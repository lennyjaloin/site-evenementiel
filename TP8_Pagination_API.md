# TP8 — Pagination de l'API

## Objectif
Ajouter la pagination sur les routes qui retournent des listes (evenements, reservations). Actuellement, `getAll()` retourne TOUS les enregistrements d'un coup, ce qui pose des problemes de performance quand la base grossit.

## Prerequis
- TP1 a TP7 termines

## Duree estimee : 50 minutes

---

## Etape 1 — Comprendre le probleme

Imagine que ta base contient 10 000 evenements. Quand le frontend appelle `GET /api/events`, le backend :
1. Charge 10 000 lignes depuis MySQL
2. Les transforme en JSON
3. Envoie le tout au frontend

### Problemes :
- **Memoire** : le serveur charge 10 000 objets en RAM
- **Reseau** : le JSON peut faire plusieurs Mo
- **Performance** : le navigateur doit parser et afficher 10 000 cartes
- **UX** : l'utilisateur attend longtemps avant de voir quoi que ce soit

### La solution : la pagination
On decoupe les resultats en **pages**. Le frontend demande une page a la fois :
- Page 1 : evenements 1 a 12
- Page 2 : evenements 13 a 24
- etc.

Le backend retourne aussi le nombre total de pages pour que le frontend puisse afficher des boutons de navigation.

---

## Etape 2 — Comprendre les parametres de pagination

La pagination standard utilise 2 parametres dans l'URL :

| Parametre | Description | Defaut |
|---|---|---|
| `page` | Numero de la page demandee | 1 |
| `limit` | Nombre d'elements par page | 12 |

Exemple : `GET /api/events?page=2&limit=12` retourne les evenements 13 a 24.

### Formule SQL :
```sql
SELECT * FROM events
ORDER BY created_at DESC
LIMIT 12 OFFSET 12
-- OFFSET = (page - 1) * limit = (2 - 1) * 12 = 12
```

### Format de reponse :
```json
{
  "data": [ ... ],       // les evenements de cette page
  "pagination": {
    "page": 2,           // page actuelle
    "limit": 12,         // elements par page
    "total": 156,        // nombre total d'elements
    "totalPages": 13     // nombre total de pages
  }
}
```

---

## Etape 3 — Creer un helper de pagination

On va creer un utilitaire reutilisable pour paginer n'importe quelle requete Drizzle.

### Action :
Cree le fichier `backend_complete/utils/paginate.js` :

```js
// utils/paginate.js

/**
 * Extrait et valide les parametres de pagination depuis req.query.
 *
 * @param {object} query - req.query
 * @param {number} defaultLimit - nombre d'elements par page par defaut
 * @param {number} maxLimit - nombre max d'elements par page
 * @returns {{ page: number, limit: number, offset: number }}
 */
export function parsePagination(query, defaultLimit = 12, maxLimit = 100) {
  let page = parseInt(query.page, 10);
  let limit = parseInt(query.limit, 10);

  // Valeurs par defaut si invalides
  if (isNaN(page) || page < 1) page = 1;
  if (isNaN(limit) || limit < 1) limit = defaultLimit;
  if (limit > maxLimit) limit = maxLimit;

  const offset = (page - 1) * limit;

  return { page, limit, offset };
}

/**
 * Construit l'objet de reponse pagine.
 *
 * @param {Array} data - les donnees de la page
 * @param {number} total - le nombre total d'elements (sans pagination)
 * @param {number} page - la page actuelle
 * @param {number} limit - le nombre d'elements par page
 * @returns {object}
 */
export function paginatedResponse(data, total, page, limit) {
  return {
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}
```

### Explication :
- **`parsePagination`** : extrait `page` et `limit` de `req.query` avec des valeurs par defaut securisees
- **`maxLimit = 100`** : empeche un utilisateur de demander `?limit=999999` pour surcharger le serveur
- **`paginatedResponse`** : formate la reponse avec les metadonnees de pagination

---

## Etape 4 — Paginer les evenements (backend)

### Action :
Modifie `backend_complete/models/Event.js` pour ajouter une methode paginee :

Ajoute cette methode dans l'objet Event (apres `getAll`) :

```js
async getAllPaginated({ limit, offset }) {
  const { events: eventsSchema, reservations: resSchema } = await import('../schema.js');

  // Compter le total
  const [{ total }] = await db
    .select({ total: count() })
    .from(events);

  // Recuperer la page
  const eventsList = await db
    .select()
    .from(events)
    .orderBy(desc(events.created_at))
    .limit(limit)
    .offset(offset);

  // Enrichir avec le comptage des reservations
  const enriched = await Promise.all(
    eventsList.map(async (event) => {
      const [{ resCount }] = await db
        .select({ resCount: count() })
        .from(reservations)
        .where(
          and(
            eq(reservations.event_id, event.id),
            eq(reservations.status, 'confirmed')
          )
        );

      return {
        ...event,
        reservationsCount: resCount,
        placesRestantes: event.capacity != null ? event.capacity - resCount : null,
      };
    })
  );

  return { data: enriched, total };
},
```

Le fichier `Event.js` complet devient :

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
    const eventsList = await db.select().from(events).orderBy(desc(events.created_at));

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

  async getAllPaginated({ limit, offset }) {
    // Compter le total
    const [{ total }] = await db
      .select({ total: count() })
      .from(events);

    // Recuperer la page
    const eventsList = await db
      .select()
      .from(events)
      .orderBy(desc(events.created_at))
      .limit(limit)
      .offset(offset);

    // Enrichir avec le comptage des reservations
    const enriched = await Promise.all(
      eventsList.map(async (event) => {
        const [{ resCount }] = await db
          .select({ resCount: count() })
          .from(reservations)
          .where(
            and(
              eq(reservations.event_id, event.id),
              eq(reservations.status, 'confirmed')
            )
          );

        return {
          ...event,
          reservationsCount: resCount,
          placesRestantes: event.capacity != null ? event.capacity - resCount : null,
        };
      })
    );

    return { data: enriched, total };
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

---

## Etape 5 — Modifier le controller des evenements

### Action :
Modifie `backend_complete/controllers/eventController.js` :

```js
// controllers/eventController.js
import { Event } from '../models/index.js';
import { parsePagination, paginatedResponse } from '../utils/paginate.js';

export const listEvents = async (req, res, next) => {
  try {
    const { page, limit, offset } = parsePagination(req.query);
    const { data, total } = await Event.getAllPaginated({ limit, offset });
    res.json(paginatedResponse(data, total, page, limit));
  } catch (err) { next(err); }
};

export const getEvent = async (req, res, next) => {
  try {
    const event = await Event.findById(Number(req.params.id));
    if (!event) return res.status(404).json({ message: 'Evenement introuvable' });
    res.json(event);
  } catch (err) { next(err); }
};

export const createEvent = async (req, res, next) => {
  try {
    const {
      title,
      description,
      location,
      date_start = null,
      date_end = null,
      capacity = null,
      image_url = null,
      is_public = 1
    } = req.body;

    const created = await Event.create({
      title, description, location, date_start, date_end, capacity, image_url, is_public
    });

    res.status(201).json(created);
  } catch (err) { next(err); }
};

export const updateEvent = async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const updated = await Event.update(id, req.body);
    res.json(updated);
  } catch (err) { next(err); }
};

export const deleteEvent = async (req, res, next) => {
  try {
    await Event.delete(Number(req.params.id));
    res.json({ message: 'Supprime' });
  } catch (err) { next(err); }
};
```

---

## Etape 6 — Adapter le frontend pour la pagination

### 6.1 — Modifier le service API

Modifie la fonction `getEvents` dans `frontend_complete/src/services/api.js` :

Remplace :
```js
export async function getEvents() {
  const { data } = await api.get("/api/events");
  return Array.isArray(data) ? data : (data.events || []);
}
```

Par :
```js
export async function getEvents({ page = 1, limit = 12 } = {}) {
  const { data } = await api.get(`/api/events?page=${page}&limit=${limit}`);
  // Compatible avec la reponse paginee OU l'ancien format
  if (data.pagination) {
    return data; // { data: [...], pagination: { ... } }
  }
  // Fallback ancien format
  const events = Array.isArray(data) ? data : (data.events || []);
  return { data: events, pagination: { page: 1, limit: events.length, total: events.length, totalPages: 1 } };
}
```

### 6.2 — Creer un composant de pagination

Cree `frontend_complete/src/components/Pagination.jsx` :

```jsx
export default function Pagination({ page, totalPages, onPageChange }) {
  if (totalPages <= 1) return null;

  const pages = [];
  // Afficher max 5 pages autour de la page courante
  const start = Math.max(1, page - 2);
  const end = Math.min(totalPages, page + 2);

  for (let i = start; i <= end; i++) {
    pages.push(i);
  }

  return (
    <div className="flex items-center justify-center gap-1 mt-8">
      {/* Bouton precedent */}
      <button
        onClick={() => onPageChange(page - 1)}
        disabled={page <= 1}
        className="btn-ghost disabled:opacity-30 disabled:cursor-not-allowed"
      >
        Prec.
      </button>

      {/* Premiere page */}
      {start > 1 && (
        <>
          <button onClick={() => onPageChange(1)} className="btn-ghost">1</button>
          {start > 2 && <span className="text-neutral-500 px-1">...</span>}
        </>
      )}

      {/* Pages */}
      {pages.map((p) => (
        <button
          key={p}
          onClick={() => onPageChange(p)}
          className={`px-3 py-1.5 rounded-lg text-sm transition ${
            p === page
              ? 'bg-brand text-white font-semibold'
              : 'btn-ghost'
          }`}
        >
          {p}
        </button>
      ))}

      {/* Derniere page */}
      {end < totalPages && (
        <>
          {end < totalPages - 1 && <span className="text-neutral-500 px-1">...</span>}
          <button onClick={() => onPageChange(totalPages)} className="btn-ghost">{totalPages}</button>
        </>
      )}

      {/* Bouton suivant */}
      <button
        onClick={() => onPageChange(page + 1)}
        disabled={page >= totalPages}
        className="btn-ghost disabled:opacity-30 disabled:cursor-not-allowed"
      >
        Suiv.
      </button>
    </div>
  );
}
```

### 6.3 — Integrer la pagination dans la page Events

Modifie `frontend_complete/src/pages/Events.jsx` :

```jsx
import { useEffect, useState } from "react";
import EventCard from "../components/EventCard.jsx";
import Pagination from "../components/Pagination.jsx";
import { getEvents } from "../services/api.js";

export default function Events() {
  const [q, setQ] = useState("");
  const [location, setLocation] = useState("");
  const [date, setDate] = useState("");

  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  // Pagination
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });

  const loadEvents = async (targetPage = page) => {
    setLoading(true);
    setErr("");

    try {
      const result = await getEvents({ page: targetPage, limit: 12 });
      setEvents(result.data);
      setPagination(result.pagination);
    } catch (e) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  };

  // Recharger quand la page change
  useEffect(() => {
    loadEvents(page);
  }, [page]);

  // Quand les filtres changent, revenir a la page 1
  useEffect(() => {
    setPage(1);
    const t = setTimeout(() => loadEvents(1), 300);
    return () => clearTimeout(t);
  }, [q, location, date]);

  const handlePageChange = (newPage) => {
    setPage(newPage);
    // Scroll vers le haut de la page
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <section className="container-app py-10">
      <h1 className="text-2xl font-bold mb-2">Trouver des evenements</h1>
      <p className="text-neutral-400 mb-6">
        Recherche par nom, lieu ou date
        {pagination.total > 0 && (
          <span className="text-neutral-500"> — {pagination.total} evenement{pagination.total > 1 ? 's' : ''}</span>
        )}
      </p>

      <div className="card p-4 grid md:grid-cols-3 gap-3 mb-6">
        <input
          className="input"
          placeholder="Nom de l'evenement"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <input
          className="input"
          placeholder="Lieu"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
        />
        <input
          className="input"
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
        />
      </div>

      {loading && <p>Chargement...</p>}
      {err && <p className="text-danger">{err}</p>}

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {events.map((ev) => (
          <EventCard key={ev.id} ev={ev} />
        ))}
      </div>

      {!loading && events.length === 0 && (
        <p className="text-neutral-400 mt-6">
          Aucun evenement trouve.
        </p>
      )}

      {/* Pagination */}
      <Pagination
        page={pagination.page}
        totalPages={pagination.totalPages}
        onPageChange={handlePageChange}
      />
    </section>
  );
}
```

---

## Etape 7 — Verification

### Test 1 : Reponse paginee
```bash
curl http://localhost:4000/api/events?page=1&limit=2
```

Reponse attendue :
```json
{
  "data": [ { ... }, { ... } ],
  "pagination": {
    "page": 1,
    "limit": 2,
    "total": 10,
    "totalPages": 5
  }
}
```

### Test 2 : Page 2
```bash
curl http://localhost:4000/api/events?page=2&limit=2
```

Tu devrais obtenir les 2 evenements suivants.

### Test 3 : Limite de securite
```bash
curl http://localhost:4000/api/events?limit=999999
```

La limite est capee a 100 (grace a `maxLimit` dans `parsePagination`).

### Test 4 : Page invalide
```bash
curl http://localhost:4000/api/events?page=-5
```

Le serveur retourne la page 1 (grace a la validation dans `parsePagination`).

### Test 5 : Interface frontend
1. Ouvre `http://localhost:5173/events`
2. Si tu as plus de 12 evenements, tu devrais voir les boutons de pagination en bas
3. Clique sur "Suiv." pour aller a la page 2
4. La page scrolle vers le haut automatiquement

---

## Resume des fichiers

| Fichier | Action |
|---|---|
| `utils/paginate.js` | **Cree** — helper de pagination reutilisable |
| `models/Event.js` | **Modifie** — ajout methode `getAllPaginated` |
| `controllers/eventController.js` | **Modifie** — utilise parsePagination |
| `services/api.js` | **Modifie** — getEvents accepte page/limit |
| `components/Pagination.jsx` | **Cree** — composant de pagination |
| `pages/Events.jsx` | **Modifie** — integre la pagination |

---

## Pour aller plus loin (exercice bonus)

Applique la meme pagination aux reservations dans le panneau admin :
1. Ajoute `getAllPaginated` dans le modele `Reservation`
2. Modifie le controller `listReservations`
3. Adapte le frontend dans `Admin.jsx`

---

## Ce qu'on a appris dans ce TP

- **La pagination** est essentielle pour la performance et l'UX
- **`LIMIT` et `OFFSET`** sont les mots-cles SQL pour paginer
- **Un helper reutilisable** (`parsePagination`) evite de dupliquer la logique
- **`maxLimit`** protege le serveur contre les requetes abusives
- **Le composant Pagination** est reutilisable sur n'importe quelle liste
- **Toujours retourner les metadonnees** (`total`, `totalPages`) pour que le frontend sache combien de pages existent
