# TP7 — Verification de Capacite et Logique Metier

## Objectif
Ajouter la verification de la capacite des evenements : empecher les reservations quand un evenement est complet. Actuellement, le champ `capacity` existe en base mais n'est jamais verifie.

## Prerequis
- TP1 a TP6 termines

## Duree estimee : 45 minutes

---

## Etape 1 — Comprendre le probleme

Ouvre le modele `backend_complete/models/Reservation.js` et regarde la methode `create` :

```js
async create({ event_id, nom, prenom, email }) {
  const [ev] = await db.select().from(events).where(eq(events.id, event_id));
  if (!ev) throw Object.assign(new Error("Evenement introuvable"), { status: 404 });

  await db.insert(reservations).values({ event_id, nom, prenom, email, status: 'confirmed' });
  // ...
}
```

### Probleme :
On verifie que l'evenement existe, mais on ne verifie **jamais** si l'evenement a encore des places disponibles. Si un evenement a une capacite de 50 personnes et qu'il y a deja 50 reservations, on accepte quand meme la 51eme !

### Ce qu'on va faire :
1. Compter le nombre de reservations existantes pour cet evenement
2. Comparer avec la capacite de l'evenement
3. Refuser la reservation si c'est complet
4. Afficher le nombre de places restantes cote frontend

---

## Etape 2 — Ajouter le comptage des reservations dans le modele

### Action :
Modifie `backend_complete/models/Reservation.js` :

```js
// models/Reservation.js
import { db } from '../db.js';
import { reservations, events } from '../schema.js';
import { eq, desc, and, sql, count } from 'drizzle-orm';

const Reservation = {
  async create({ event_id, nom, prenom, email }) {
    // 1. Verifier que l'evenement existe
    const [ev] = await db.select().from(events).where(eq(events.id, event_id));
    if (!ev) throw Object.assign(new Error("Evenement introuvable"), { status: 404 });

    // 2. Verifier la capacite (si definie)
    if (ev.capacity != null) {
      const [{ total }] = await db
        .select({ total: count() })
        .from(reservations)
        .where(
          and(
            eq(reservations.event_id, event_id),
            eq(reservations.status, 'confirmed')
          )
        );

      if (total >= ev.capacity) {
        throw Object.assign(
          new Error(`Evenement complet (${ev.capacity} places). Plus de places disponibles.`),
          { status: 400 }
        );
      }
    }

    // 3. Inserer la reservation
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

  async countByEvent(event_id) {
    const [{ total }] = await db
      .select({ total: count() })
      .from(reservations)
      .where(
        and(
          eq(reservations.event_id, event_id),
          eq(reservations.status, 'confirmed')
        )
      );
    return total;
  },

  async delete(id) {
    return db.delete(reservations).where(eq(reservations.id, id));
  }
};

export default Reservation;
```

### Ce qui a change :
- **Import de `count`** depuis drizzle-orm
- **Verification de capacite** : on compte les reservations confirmees et on compare avec `ev.capacity`
- **Nouvelle methode `countByEvent`** : utile pour afficher le nombre de places restantes
- **Erreur avec status 400** si l'evenement est complet

---

## Etape 3 — Gerer l'erreur de capacite dans le controller

Le controller `reservationController.js` gere deja les erreurs via `next(err)`, mais il faut aussi renvoyer le bon status HTTP.

### Action :
Modifie `backend_complete/controllers/reservationController.js` :

```js
// controllers/reservationController.js
import { Reservation } from '../models/index.js';

export const createReservation = async (req, res, next) => {
  try {
    const { eventId, event_id, nom, prenom, email } = req.body;
    const payload = {
      event_id: Number(eventId ?? event_id),
      nom,
      prenom,
      email
    };
    const row = await Reservation.create(payload);
    res.status(201).json(row);
  } catch (err) {
    // Erreur avec status personnalise (capacite, not found)
    if (err.status) {
      return res.status(err.status).json({ message: err.message });
    }
    // Erreur d'unicite MySQL (double reservation)
    if (err?.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ message: 'Deja reserve avec cet email.' });
    }
    next(err);
  }
};

export const listReservations = async (req, res, next) => {
  try {
    const rows = await Reservation.getAll();
    res.json(rows);
  } catch (err) { next(err); }
};

export const deleteReservation = async (req, res, next) => {
  try {
    await Reservation.delete(Number(req.params.id));
    res.json({ message: 'Supprime' });
  } catch (err) { next(err); }
};
```

---

## Etape 4 — Ajouter le nombre de places dans la reponse des evenements

Quand on recupere un evenement, le frontend a besoin de savoir combien de places sont deja prises.

### Action :
Modifie `backend_complete/models/Event.js` pour ajouter une methode enrichie :

```js
// models/Event.js
import { db } from '../db.js';
import { events, reservations } from '../schema.js';
import { eq, desc, count, and } from 'drizzle-orm';

const Event = {
  async create({ title, description, location, date_start, date_end, capacity, image_url, is_public }) {
    const [result] = await db.insert(events).values({
      title, description, location, date_start, date_end, capacity, image_url, is_public
    });
    const [event] = await db.select().from(events).where(eq(events.id, result.insertId));
    return event;
  },

  async findById(id) {
    const [event] = await db.select().from(events).where(eq(events.id, id));
    if (!event) return null;

    // Compter les reservations confirmees
    const [{ total }] = await db
      .select({ total: count() })
      .from(reservations)
      .where(
        and(
          eq(reservations.event_id, id),
          eq(reservations.status, 'confirmed')
        )
      );

    return {
      ...event,
      reservationsCount: total,
      placesRestantes: event.capacity != null ? event.capacity - total : null,
    };
  },

  async getAll() {
    // Recuperer les evenements avec le nombre de reservations
    const eventsList = await db.select().from(events).orderBy(desc(events.created_at));

    // Pour chaque evenement, compter les reservations
    const enriched = await Promise.all(
      eventsList.map(async (event) => {
        const [{ total }] = await db
          .select({ total: count() })
          .from(reservations)
          .where(
            and(
              eq(reservations.event_id, event.id),
              eq(reservations.status, 'confirmed')
            )
          );

        return {
          ...event,
          reservationsCount: total,
          placesRestantes: event.capacity != null ? event.capacity - total : null,
        };
      })
    );

    return enriched;
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
- `findById` retourne maintenant `reservationsCount` et `placesRestantes`
- `getAll` enrichit chaque evenement avec le comptage des reservations
- Import de `reservations` (le schema), `count`, et `and` depuis drizzle-orm

---

## Etape 5 — Afficher les places restantes cote frontend

### 5.1 — Composant EventCard

Le composant `EventCard.jsx` affiche deja `reservationsCount` ! Verifie que le code est bien :

```jsx
{ev.capacity != null && (
  <span className="badge">{ev.reservationsCount || 0}/{ev.capacity} places</span>
)}
```

C'est deja fait. Maintenant que le backend renvoie `reservationsCount`, ca va s'afficher automatiquement.

### 5.2 — Page EventDetails

Modifie `frontend_complete/src/pages/EventDetails.jsx` pour afficher les places restantes et desactiver le bouton si c'est complet :

```jsx
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { getEvent } from "../services/api.js";
import ReserveModal from "../components/ReserveModal.jsx";
import { motion } from "framer-motion";

export default function EventDetails() {
  const { id } = useParams();
  const [ev, setEv] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [open, setOpen] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const data = await getEvent(id);
        setEv(data);
      } catch (e) {
        setErr(e.message);
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  if (loading) return <div className="container-app py-8 text-neutral-400">Chargement...</div>;
  if (err) return <div className="container-app py-8 text-danger">{err}</div>;
  if (!ev) return null;

  const date = ev.date_start || ev.date;
  const isComplet = ev.capacity != null && ev.placesRestantes != null && ev.placesRestantes <= 0;

  return (
    <section className="container-app py-8">
      <motion.div className="card p-6 md:p-8" initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }}>
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold">{ev.title}</h2>
            <div className="mt-2 flex flex-wrap gap-2">
              {ev.location && <span className="badge">{ev.location}</span>}
              {date && <span className="badge">{new Date(date).toLocaleString()}</span>}
              {ev.capacity != null && (
                <span className={`badge ${isComplet ? 'bg-danger/20 text-danger' : 'bg-ok/20 text-ok'}`}>
                  {isComplet
                    ? 'COMPLET'
                    : `${ev.reservationsCount || 0}/${ev.capacity} places`
                  }
                </span>
              )}
            </div>
          </div>

          {isComplet ? (
            <button disabled className="btn-secondary self-start opacity-50 cursor-not-allowed">
              Complet
            </button>
          ) : (
            <button onClick={()=>setOpen(true)} className="btn-primary self-start">
              Reserver
            </button>
          )}
        </div>

        <p className="text-neutral-200 mt-4 whitespace-pre-line">{ev.description}</p>

        {ev.placesRestantes != null && !isComplet && (
          <p className="text-sm text-ok mt-3">
            {ev.placesRestantes} place{ev.placesRestantes > 1 ? 's' : ''} restante{ev.placesRestantes > 1 ? 's' : ''}
          </p>
        )}
      </motion.div>

      <ReserveModal open={open} onClose={()=>setOpen(false)} eventId={ev.id} />
    </section>
  );
}
```

### Ce qui a change :
- **`isComplet`** : verifie si `placesRestantes <= 0`
- **Badge colore** : vert si places dispo, rouge si complet
- **Bouton desactive** quand l'evenement est complet
- **Message "X places restantes"** sous la description

---

## Etape 6 — Ameliorer le message d'erreur dans le modal de reservation

Si un utilisateur essaie de reserver un evenement complet (par exemple via un lien direct), le backend renvoie une erreur 400. Le modal doit afficher ce message clairement.

Le composant `ReserveModal.jsx` affiche deja `{err}` — grace a l'intercepteur Axios du TP6, le message sera automatiquement lisible. Rien a changer ici.

---

## Etape 7 — Verification

### Test 1 : Creer un evenement avec une capacite de 2
1. Va dans l'admin
2. Cree un evenement avec `capacite = 2`
3. Va sur la page de l'evenement
4. Tu devrais voir `0/2 places` et `2 places restantes`

### Test 2 : Reserver 2 places
1. Fais 2 reservations differentes (emails differents)
2. La page doit maintenant afficher `2/2 places` puis `COMPLET`
3. Le bouton "Reserver" est remplace par "Complet" (grise)

### Test 3 : Tenter une 3eme reservation
1. Essaie de faire une reservation via curl :
```bash
curl -X POST http://localhost:4000/api/reservations \
  -H "Content-Type: application/json" \
  -d '{"event_id": 1, "nom": "Test", "prenom": "Spam", "email": "spam@test.com"}'
```
2. **Resultat attendu** : Status 400 avec le message "Evenement complet (2 places). Plus de places disponibles."

### Test 4 : Evenement sans capacite
1. Cree un evenement sans definir de capacite
2. Tu peux faire autant de reservations que tu veux — pas de limite

---

## Resume des fichiers modifies

| Fichier | Action |
|---|---|
| `models/Reservation.js` | **Modifie** — verification capacite + methode countByEvent |
| `models/Event.js` | **Modifie** — enrichissement avec reservationsCount et placesRestantes |
| `controllers/reservationController.js` | **Modifie** — gestion erreur status personnalise |
| `pages/EventDetails.jsx` | **Modifie** — affichage places restantes + bouton desactive |

---

## Ce qu'on a appris dans ce TP

- **Logique metier** : la verification de capacite est une regle metier critique qui doit etre dans le backend, pas dans le frontend
- **Comptage SQL** : `count()` avec Drizzle ORM pour compter les lignes filtrees
- **Enrichissement des donnees** : ajouter des champs calcules (`reservationsCount`, `placesRestantes`) a la reponse API
- **UX** : desactiver le bouton et afficher un badge colore donne un retour visuel clair a l'utilisateur
- **Defense en profondeur** : le frontend desactive le bouton ET le backend refuse la requete. Les deux sont necessaires
