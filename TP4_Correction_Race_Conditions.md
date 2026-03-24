# TP4 — Correction des Race Conditions (insertId)

## Objectif
Corriger un bug subtil dans les modeles : apres un INSERT en base, le code recupere le dernier enregistrement avec `ORDER BY id DESC LIMIT 1`, ce qui peut retourner le mauvais enregistrement si deux requetes arrivent en meme temps. On va utiliser `insertId` a la place.

## Prerequis
- TP1, TP2, TP3 termines

## Duree estimee : 30 minutes

---

## Etape 1 — Comprendre le probleme (Race Condition)

Ouvre le fichier `backend_complete/models/Event.js` et regarde la methode `create` :

```js
async create({ title, description, ... }) {
  await db.insert(events).values({ ... });
  const [event] = await db.select().from(events).orderBy(desc(events.id)).limit(1);
  return event;
}
```

### Que se passe-t-il ?

1. On insere un evenement (ex: id = 42)
2. On fait un SELECT pour recuperer le dernier evenement insere (`ORDER BY id DESC LIMIT 1`)

### Le probleme :
Si un **autre utilisateur** insere un evenement **entre** l'etape 1 et l'etape 2, le SELECT retournera l'evenement de l'autre utilisateur (id = 43) au lieu du notre (id = 42) !

C'est ce qu'on appelle une **race condition** (condition de concurrence).

```
Temps -->

Utilisateur A : INSERT (id=42) -----> SELECT ORDER BY DESC --> retourne id=43 !!
Utilisateur B :          INSERT (id=43) -->
```

> **Question** : Pourquoi ca fonctionne en developpement ?
> **Reponse** : Parce qu'on est seul sur le serveur. En production avec des dizaines d'utilisateurs simultanes, ce bug apparaitrait.

### La solution :
MySQL retourne l'`insertId` (l'ID auto-incremente) apres chaque INSERT. Drizzle ORM donne acces a cette valeur. On l'utilise pour faire un SELECT precis sur le bon ID.

---

## Etape 2 — Comprendre comment Drizzle retourne l'insertId

Avec Drizzle ORM et MySQL, `db.insert()` retourne un tableau `[ResultSetHeader, ...]`. Le `ResultSetHeader` contient la propriete `insertId`.

```js
const [result] = await db.insert(events).values({ ... });
// result.insertId === 42 (l'ID de la ligne inseree)
```

On peut ensuite faire :
```js
const [event] = await db.select().from(events).where(eq(events.id, result.insertId));
```

---

## Etape 3 — Corriger le modele Event

### Action :
Modifie `backend_complete/models/Event.js` :

```js
// models/Event.js
import { db } from '../db.js';
import { events } from '../schema.js';
import { eq, desc } from 'drizzle-orm';

const Event = {
  async create({ title, description, location, date_start, date_end, capacity, image_url, is_public }) {
    const [result] = await db.insert(events).values({
      title,
      description,
      location,
      date_start,
      date_end,
      capacity,
      image_url,
      is_public
    });
    // On utilise insertId pour recuperer exactement la ligne inseree
    const [event] = await db.select().from(events).where(eq(events.id, result.insertId));
    return event;
  },

  async findById(id) {
    const [event] = await db.select().from(events).where(eq(events.id, id));
    return event;
  },

  async getAll() {
    return db.select().from(events).orderBy(desc(events.created_at));
  },

  async update(id, payload) {
    await db.update(events).set(payload).where(eq(events.id, id));
    const [event] = await db.select().from(events).where(eq(events.id, id));
    return event;
  },

  async delete(id) {
    return db.delete(events).where(eq(events.id, id));
  }
};

export default Event;
```

### Ce qui a change :
- Ligne `const [result] = await db.insert(...)` : on capture le resultat de l'INSERT
- Ligne `eq(events.id, result.insertId)` : on cible le bon ID au lieu de prendre le dernier

---

## Etape 4 — Corriger le modele User

### Action :
Modifie `backend_complete/models/User.js` :

```js
// models/User.js
import { db } from '../db.js';
import { users } from '../schema.js';
import { eq } from 'drizzle-orm';

const User = {
  async create({ username, email, password_hash, role = 'staff', is_active = 1 }) {
    const [result] = await db.insert(users).values({ username, email, password_hash, role, is_active });
    const [user] = await db.select().from(users).where(eq(users.id, result.insertId));
    return user;
  },

  async findByEmail(email) {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  },

  async findById(id) {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  },

  async getAll() {
    return db.select().from(users);
  },

  async deleteById(id) {
    return db.delete(users).where(eq(users.id, id));
  }
};

export default User;
```

### Ce qui a change :
- Avant : on faisait `findByEmail(email)` apres l'INSERT — ca marchait car l'email est unique, mais c'est plus propre avec `insertId`
- Maintenant : `const [result] = await db.insert(...)` puis `eq(users.id, result.insertId)`

---

## Etape 5 — Corriger le modele Reservation

### Action :
Modifie `backend_complete/models/Reservation.js` :

```js
// models/Reservation.js
import { db } from '../db.js';
import { reservations, events } from '../schema.js';
import { eq, desc } from 'drizzle-orm';

const Reservation = {
  async create({ event_id, nom, prenom, email }) {
    // Verifier que l'evenement existe
    const [ev] = await db.select().from(events).where(eq(events.id, event_id));
    if (!ev) throw Object.assign(new Error("Evenement introuvable"), { status: 404 });

    // Inserer et recuperer via insertId
    const [result] = await db.insert(reservations).values({ event_id, nom, prenom, email, status: 'confirmed' });
    const [row] = await db.select().from(reservations).where(eq(reservations.id, result.insertId));
    return row;
  },

  async getAll() {
    return db.select({
      id: reservations.id,
      eventId: reservations.event_id,
      eventTitle: events.title,
      nom: reservations.nom,
      prenom: reservations.prenom,
      email: reservations.email,
      status: reservations.status,
      createdAt: reservations.created_at,
    })
    .from(reservations)
    .leftJoin(events, eq(reservations.event_id, events.id))
    .orderBy(desc(reservations.created_at));
  },

  async delete(id) {
    return db.delete(reservations).where(eq(reservations.id, id));
  }
};

export default Reservation;
```

---

## Etape 6 — Corriger le modele Inscription

### Action :
Modifie `backend_complete/models/Inscription.js` :

```js
// models/Inscription.js
import { db } from '../db.js';
import { inscriptions } from '../schema.js';
import { and, eq } from 'drizzle-orm';

const Inscription = {
  async create({ user_id, event_id }) {
    // Verifier si deja inscrit
    const exist = await db.select().from(inscriptions)
      .where(and(eq(inscriptions.user_id, user_id), eq(inscriptions.event_id, event_id)));
    if (exist.length) return null;

    // Inserer et recuperer via insertId
    const [result] = await db.insert(inscriptions).values({ user_id, event_id, status: 'confirmed' });
    const [insc] = await db.select().from(inscriptions).where(eq(inscriptions.id, result.insertId));
    return insc;
  },

  async cancel(id) {
    return db.delete(inscriptions).where(eq(inscriptions.id, id));
  },

  async getByUser(user_id) {
    return db.select().from(inscriptions).where(eq(inscriptions.user_id, user_id));
  }
};

export default Inscription;
```

---

## Etape 7 — Corriger le modele Payment

### Action :
Modifie `backend_complete/models/Payment.js` :

```js
// models/Payment.js
import { db } from '../db.js';
import { payments } from '../schema.js';
import { eq } from 'drizzle-orm';

const Payment = {
  async create({ user_id, event_id, amount }) {
    const [result] = await db.insert(payments).values({ user_id, event_id, amount, status: 'paid' });
    const [pay] = await db.select().from(payments).where(eq(payments.id, result.insertId));
    return pay;
  },

  async getByUser(user_id) {
    return db.select().from(payments).where(eq(payments.user_id, user_id));
  }
};

export default Payment;
```

---

## Etape 8 — Verification

### Test :
1. Redemarre le backend : `npm run dev`
2. Cree un evenement via l'admin (ou curl) :
```bash
curl -X POST http://localhost:4000/api/events \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TON_TOKEN_ADMIN" \
  -d '{"title": "Test InsertId", "description": "Verification que insertId fonctionne"}'
```
3. La reponse doit contenir l'evenement cree avec le bon `id`
4. Fais une reservation et verifie que la reponse contient le bon `id`

---

## Resume des fichiers modifies

| Fichier | Modification |
|---|---|
| `models/Event.js` | `orderBy(desc).limit(1)` remplace par `insertId` |
| `models/User.js` | `findByEmail` apres insert remplace par `insertId` |
| `models/Reservation.js` | `orderBy(desc).limit(1)` remplace par `insertId` |
| `models/Inscription.js` | Double select remplace par `insertId` |
| `models/Payment.js` | `orderBy(desc).limit(1)` remplace par `insertId` |

---

## Ce qu'on a appris dans ce TP

- **Race condition** : quand deux operations concurrentes interferent et produisent un resultat inattendu
- **`insertId`** : MySQL retourne l'ID auto-incremente apres chaque INSERT. C'est le moyen fiable de recuperer la ligne qu'on vient d'inserer
- **Tester la concurrence** : un bug qui ne se manifeste pas en dev (1 seul utilisateur) peut apparaitre en production (centaines d'utilisateurs simultanes)
- **Pattern Insert + Select by ID** : c'est la bonne pratique pour retourner l'objet cree
