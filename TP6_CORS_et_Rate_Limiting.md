# TP6 — Securisation CORS et Rate Limiting

## Objectif
Configurer CORS pour n'accepter que les requetes provenant de notre frontend, et ajouter un rate-limiter pour empecher les attaques par brute-force sur le login et le spam de reservations.

## Prerequis
- TP1 a TP5 termines

## Duree estimee : 35 minutes

---

## Etape 1 — Comprendre CORS

### Qu'est-ce que CORS ?
CORS = **Cross-Origin Resource Sharing**. C'est un mecanisme du navigateur qui empeche un site A de faire des requetes vers un site B, sauf si le site B l'autorise explicitement.

### Le probleme actuel :
Ouvre `backend_complete/server.mjs` :

```js
app.use(cors());
```

Avec `cors()` sans options, **tous les sites du monde** peuvent appeler ton API. Un site malveillant pourrait afficher un formulaire de login, envoyer les identifiants a ton API, et voler les tokens.

### La solution :
Configurer CORS pour n'accepter que les requetes venant de `http://localhost:5173` (ton frontend Vite) en developpement.

---

## Etape 2 — Configurer CORS

### Action :
Modifie `backend_complete/server.mjs`. Remplace la ligne `app.use(cors())` par :

```js
// Configuration CORS : n'accepter que les origines autorisees
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',')
  : ['http://localhost:5173'];

app.use(cors({
  origin: function (origin, callback) {
    // Autoriser les requetes sans origin (Postman, curl, mobile)
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Bloque par CORS : origine non autorisee'));
    }
  },
  credentials: true,
}));
```

### Action :
Ajoute la variable dans `backend_complete/.env` :

```env
ALLOWED_ORIGINS=http://localhost:5173
```

Et dans `backend_complete/.env.example` :

```env
# Origines autorisees pour CORS (separees par des virgules)
# En production : https://monsite.fr
ALLOWED_ORIGINS=http://localhost:5173
```

### Explication :
- **`origin`** : fonction qui verifie si l'origine de la requete est autorisee
- **`!origin`** : les requetes depuis Postman, curl ou le meme serveur n'ont pas d'origin. On les autorise pour le developpement
- **`credentials: true`** : permet l'envoi de cookies (utile si tu ajoutes des cookies plus tard)
- **`ALLOWED_ORIGINS`** : en production, tu mettras l'URL de ton vrai domaine

### Test :
1. Redemarre le backend
2. Ouvre ton frontend sur `http://localhost:5173` -> tout fonctionne normalement
3. Si tu essayais d'appeler l'API depuis un autre site (ex: `http://evil.com`), le navigateur bloquerait la requete

---

## Etape 3 — Comprendre le Rate Limiting

### Qu'est-ce que le rate-limiting ?
C'est une technique qui limite le nombre de requetes qu'un utilisateur peut faire dans un laps de temps. Ca protege contre :

1. **Brute-force** : un attaquant qui teste des milliers de mots de passe sur `/api/auth/login`
2. **Spam** : un bot qui cree des milliers de reservations
3. **DDoS** : un afflux massif de requetes qui fait tomber le serveur

### Exemple :
Sans rate-limiting, un attaquant peut envoyer 1000 requetes `/api/auth/login` par seconde en testant tous les mots de passe courants. Avec un rate-limiter de 10 requetes par minute sur le login, il ne peut tester que 10 mots de passe par minute.

---

## Etape 4 — Installer express-rate-limit

### Action :
```bash
cd backend_complete
npm install express-rate-limit
```

---

## Etape 5 — Creer les limiteurs

On va creer deux types de limiteurs :
1. **Global** : limite le nombre total de requetes par IP (100 par minute)
2. **Strict** : pour les routes sensibles comme le login (10 par minute)

### Action :
Cree le fichier `backend_complete/middleware/rateLimiter.js` :

```js
// middleware/rateLimiter.js
import rateLimit from 'express-rate-limit';

/**
 * Limiteur GLOBAL — applique a toutes les routes.
 * 100 requetes par fenetre de 1 minute par IP.
 */
export const globalLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 100,                 // 100 requetes max par fenetre
  standardHeaders: true,    // Retourne les headers RateLimit-*
  legacyHeaders: false,     // Desactive les headers X-RateLimit-*
  message: {
    message: 'Trop de requetes. Reessaie dans une minute.',
  },
});

/**
 * Limiteur STRICT — pour les routes sensibles (login, register).
 * 10 requetes par fenetre de 1 minute par IP.
 */
export const authLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 10,                  // 10 tentatives max
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    message: 'Trop de tentatives de connexion. Reessaie dans une minute.',
  },
});

/**
 * Limiteur pour les reservations — eviter le spam.
 * 20 reservations par fenetre de 5 minutes par IP.
 */
export const reservationLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 20,                  // 20 reservations max
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    message: 'Trop de reservations. Reessaie dans quelques minutes.',
  },
});
```

### Explication :
- **`windowMs`** : la duree de la fenetre en millisecondes
- **`max`** : le nombre maximum de requetes dans cette fenetre
- **`standardHeaders`** : ajoute des headers HTTP pour que le frontend sache combien de requetes il reste
- **`message`** : la reponse JSON renvoyee quand la limite est atteinte

---

## Etape 6 — Appliquer les limiteurs

### 6.1 — Limiteur global dans server.mjs

Modifie `backend_complete/server.mjs` pour ajouter le limiteur global. Ajoute l'import en haut et l'appel apres `cors()` :

```js
// server.mjs
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
dotenv.config();

// Verification des variables d'environnement obligatoires
const requiredEnv = ['DB_HOST', 'DB_USER', 'DB_PASSWORD', 'DB_NAME', 'JWT_SECRET'];
const missing = requiredEnv.filter(key => !process.env[key]);
if (missing.length > 0) {
  console.error(`ERREUR: Variables d'environnement manquantes : ${missing.join(', ')}`);
  console.error('Copie .env.example vers .env et remplis les valeurs.');
  process.exit(1);
}

import authRoutes from './routes/auth.js';
import userRoutes from './routes/users.js';
import eventRoutes from './routes/events.js';
import inscriptionRoutes from './routes/inscriptions.js';
import reservationRoutes from './routes/reservations.js';
import paymentRoutes from './routes/payments.js';
import { errorHandler } from './middleware/errorMiddleware.js';
import { globalLimiter } from './middleware/rateLimiter.js';

const app = express();

// Configuration CORS
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',')
  : ['http://localhost:5173'];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Bloque par CORS : origine non autorisee'));
    }
  },
  credentials: true,
}));

app.use(express.json());

// Rate-limiter global
app.use(globalLimiter);

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/inscriptions', inscriptionRoutes);
app.use('/api/reservations', reservationRoutes);
app.use('/api/payments', paymentRoutes);

app.get('/', (req, res) => res.send('API OK'));

app.use(errorHandler);

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
```

### 6.2 — Limiteur strict sur les routes d'authentification

Modifie `backend_complete/routes/auth.js` :

```js
// routes/auth.js
import express from 'express';
import { register, login } from '../controllers/authController.js';
import { validate } from '../middleware/validate.js';
import { registerSchema, loginSchema } from '../validators/index.js';
import { authLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

// Rate-limit strict sur login et register
router.post('/register', authLimiter, validate(registerSchema), register);
router.post('/login', authLimiter, validate(loginSchema), login);

export default router;
```

### 6.3 — Limiteur sur les reservations

Modifie `backend_complete/routes/reservations.js` :

```js
// routes/reservations.js
import express from 'express';
import { createReservation, listReservations, deleteReservation } from '../controllers/reservationController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { requireRole } from '../middleware/roleMiddleware.js';
import { validate } from '../middleware/validate.js';
import { createReservationSchema } from '../validators/index.js';
import { reservationLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

// Public : reserver (avec validation + rate-limit)
router.post('/', reservationLimiter, validate(createReservationSchema), createReservation);

// Admin : voir/supprimer
router.get('/', authMiddleware, requireRole('admin'), listReservations);
router.delete('/:id', authMiddleware, requireRole('admin'), deleteReservation);

export default router;
```

---

## Etape 7 — Gerer l'erreur de rate-limit cote frontend

Quand le rate-limiter bloque une requete, le backend renvoie un status HTTP **429** (Too Many Requests). Il faut que le frontend affiche un message clair.

### Action :
Modifie `frontend_complete/src/services/api.js` pour ajouter un intercepteur de reponse :

```js
import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "";

const api = axios.create({ baseURL: API_BASE_URL });

// Attach token automatically
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Intercepteur de reponse : gerer les erreurs globalement
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      const { status, data } = error.response;

      // Rate-limit atteint
      if (status === 429) {
        const msg = data?.message || "Trop de requetes. Patiente un moment.";
        return Promise.reject(new Error(msg));
      }

      // Erreur de validation
      if (status === 400 && data?.errors) {
        const messages = data.errors.map(e => e.message).join(', ');
        return Promise.reject(new Error(messages));
      }

      // Token expire ou invalide
      if (status === 401) {
        // Optionnel : deconnecter l'utilisateur
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        return Promise.reject(new Error(data?.message || "Session expiree. Reconnecte-toi."));
      }

      // Erreur serveur generique
      return Promise.reject(new Error(data?.message || "Erreur serveur"));
    }

    // Erreur reseau (pas de reponse)
    return Promise.reject(new Error("Erreur reseau. Verifie ta connexion."));
  }
);

// ---- AUTH ----
export async function signup(email, password) {
  const { data } = await api.post("/api/auth/register", { email, password });
  return data;
}

export async function login(email, password) {
  const { data } = await api.post("/api/auth/login", { email, password });
  return data;
}

export function logout() {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
}

// ---- EVENTS ----
export async function getEvents() {
  const { data } = await api.get("/api/events");
  return Array.isArray(data) ? data : (data.events || []);
}

export async function getEvent(id) {
  const { data } = await api.get(`/api/events/${id}`);
  return data.event || data;
}

export async function createEvent(payload) {
  const { data } = await api.post("/api/events", payload);
  return data.event || data;
}

export async function deleteEvent(id) {
  const { data } = await api.delete(`/api/events/${id}`);
  return data;
}

// ---- RESERVATIONS ----
export async function reserveEvent({ event_id, nom, prenom, email }) {
  const { data } = await api.post("/api/reservations", { event_id, nom, prenom, email });
  return data;
}

export async function getReservations() {
  const { data } = await api.get("/api/reservations");
  return Array.isArray(data) ? data : (data.reservations || []);
}

export async function deleteReservation(id) {
  const { data } = await api.delete(`/api/reservations/${id}`);
  return data;
}
```

### Ce qui a change :
- Ajout d'un **intercepteur de reponse** qui transforme les erreurs HTTP en messages clairs
- Gestion du **429** (rate-limit), du **400** (validation), du **401** (token expire)
- Gestion des erreurs reseau (pas internet)

---

## Etape 8 — Verification

### Test 1 : Rate-limit sur le login
Lance 11 requetes login rapides :

```bash
for i in $(seq 1 11); do
  curl -s -o /dev/null -w "%{http_code}\n" \
    -X POST http://localhost:4000/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"test@test.com","password":"wrong"}'
done
```

Ou en PowerShell :
```powershell
1..11 | ForEach-Object {
  $r = Invoke-WebRequest -Uri "http://localhost:4000/api/auth/login" -Method POST -ContentType "application/json" -Body '{"email":"test@test.com","password":"wrong"}' -SkipHttpErrorHandling
  Write-Host "Requete $_ : Status $($r.StatusCode)"
}
```

**Resultat attendu** : Les 10 premieres retournent 401 (identifiants invalides). La 11eme retourne **429** (trop de tentatives).

### Test 2 : Headers de rate-limit
Fais une requete et regarde les headers de reponse :

```bash
curl -v http://localhost:4000/api/events 2>&1 | grep -i ratelimit
```

Tu devrais voir :
```
RateLimit-Limit: 100
RateLimit-Remaining: 99
RateLimit-Reset: 60
```

### Test 3 : CORS
Ouvre la console du navigateur sur un autre site (ex: google.com) et tape :
```js
fetch('http://localhost:4000/api/events').then(r => r.json()).then(console.log)
```

**Resultat attendu** : Erreur CORS bloquee par le navigateur.

---

## Resume des fichiers

| Fichier | Action |
|---|---|
| `middleware/rateLimiter.js` | **Cree** — 3 limiteurs (global, auth, reservation) |
| `server.mjs` | **Modifie** — CORS configure + rate-limiter global |
| `routes/auth.js` | **Modifie** — ajout authLimiter |
| `routes/reservations.js` | **Modifie** — ajout reservationLimiter |
| `.env` | **Modifie** — ajout ALLOWED_ORIGINS |
| `.env.example` | **Modifie** — ajout ALLOWED_ORIGINS |
| `frontend: services/api.js` | **Modifie** — intercepteur d'erreurs |

---

## Ce qu'on a appris dans ce TP

- **CORS** protege contre les requetes non autorisees depuis d'autres sites
- **Rate-limiting** protege contre le brute-force, le spam et le DDoS
- **Differents niveaux** de rate-limit : global (100/min), strict auth (10/min), reservations (20/5min)
- **Les headers** `RateLimit-*` informent le client du nombre de requetes restantes
- **L'intercepteur Axios** centralise la gestion des erreurs cote frontend
- **Toujours configurer CORS et rate-limiting** avant de mettre en production
