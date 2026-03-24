# TP9 — Tests Unitaires et d'Integration

## Objectif
Mettre en place des tests automatises pour verifier que l'API fonctionne correctement. Actuellement, le projet n'a aucun test (`"test": "echo \"Error: no test specified\""`). On va utiliser **Vitest** pour le backend et tester les routes principales.

## Prerequis
- TP1 a TP8 termines

## Duree estimee : 1 heure

---

## Etape 1 — Pourquoi tester ?

### Sans tests :
- Tu modifies un fichier -> tu ne sais pas si tu as casse quelque chose
- Tu decouvres les bugs **en production** (quand les utilisateurs les rencontrent)
- Tu as peur de modifier le code existant

### Avec tests :
- Tu lances `npm test` -> tu sais immediatement si tout fonctionne
- Tu decouvres les bugs **avant** le deploiement
- Tu peux modifier le code en confiance

### Types de tests :
| Type | Quoi | Exemple |
|---|---|---|
| **Unitaire** | Teste une fonction isolee | `parsePagination({ page: '2' })` retourne `{ page: 2, ... }` |
| **Integration** | Teste une route complete | `POST /api/auth/register` cree un utilisateur |
| **E2E** | Teste l'application entiere | L'utilisateur clique sur "Reserver" et voit "Reservation validee" |

Dans ce TP, on va faire des **tests unitaires** et des **tests d'integration**.

---

## Etape 2 — Installer Vitest et Supertest

### Action :
```bash
cd backend_complete
npm install --save-dev vitest supertest
```

### Pourquoi ces outils ?
- **Vitest** : framework de test rapide, compatible ES Modules (comme notre projet)
- **Supertest** : permet de tester des routes Express sans demarrer le serveur

---

## Etape 3 — Configurer Vitest

### Action :
Modifie `backend_complete/package.json` pour ajouter le script de test :

Remplace la ligne :
```json
"test": "echo \"Error: no test specified\" && exit 1",
```

Par :
```json
"test": "vitest run",
"test:watch": "vitest",
```

Le `package.json` complet :
```json
{
  "name": "backend_complete",
  "version": "1.0.0",
  "description": "",
  "main": "server.mjs",
  "scripts": {
    "test": "vitest run",
    "test:watch": "vitest",
    "start": "node server.mjs",
    "dev": "nodemon server.mjs"
  },
  "keywords": [],
  "author": "",
  "license": "ISC",
  "dependencies": {
    "bcryptjs": "^3.0.2",
    "cors": "^2.8.5",
    "dotenv": "^17.2.3",
    "drizzle-kit": "^0.31.5",
    "drizzle-orm": "^0.44.6",
    "express": "^5.1.0",
    "express-rate-limit": "^7.0.0",
    "jsonwebtoken": "^9.0.2",
    "mysql2": "^3.15.2",
    "zod": "^3.0.0"
  },
  "devDependencies": {
    "nodemon": "^3.1.10",
    "supertest": "^7.0.0",
    "vitest": "^3.0.0"
  },
  "type": "module"
}
```

---

## Etape 4 — Separer l'app Express du serveur

Pour tester l'API avec Supertest, on a besoin de l'application Express **sans** le `app.listen()`. On va separer la creation de l'app et le demarrage du serveur.

### Action :
Cree le fichier `backend_complete/app.js` :

```js
// app.js — Application Express (sans listen)
import express from 'express';
import cors from 'cors';

import authRoutes from './routes/auth.js';
import userRoutes from './routes/users.js';
import eventRoutes from './routes/events.js';
import inscriptionRoutes from './routes/inscriptions.js';
import reservationRoutes from './routes/reservations.js';
import paymentRoutes from './routes/payments.js';
import { errorHandler } from './middleware/errorMiddleware.js';

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
      callback(new Error('Bloque par CORS'));
    }
  },
  credentials: true,
}));

app.use(express.json());

// NOTE : On ne met PAS le rate-limiter ici pour ne pas bloquer les tests.
// Il est applique dans server.mjs uniquement.

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/inscriptions', inscriptionRoutes);
app.use('/api/reservations', reservationRoutes);
app.use('/api/payments', paymentRoutes);

app.get('/', (req, res) => res.send('API OK'));

app.use(errorHandler);

export default app;
```

### Action :
Modifie `backend_complete/server.mjs` pour utiliser `app.js` :

```js
// server.mjs — Point d'entree du serveur
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

import app from './app.js';
import { globalLimiter } from './middleware/rateLimiter.js';

// Rate-limiter global (uniquement en production, pas dans les tests)
app.use(globalLimiter);

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
```

### Pourquoi cette separation ?
- **`app.js`** : exporte l'application Express (utilisable par Supertest)
- **`server.mjs`** : demarre le serveur (utilise en developpement/production)
- Les tests importent `app.js` directement, sans demarrer le serveur
- Le rate-limiter n'est pas dans `app.js` pour ne pas bloquer les tests rapides

---

## Etape 5 — Ecrire les tests unitaires (utils)

On commence par les tests les plus simples : les fonctions utilitaires.

### Action :
Cree le fichier `backend_complete/tests/paginate.test.js` :

```js
// tests/paginate.test.js
import { describe, it, expect } from 'vitest';
import { parsePagination, paginatedResponse } from '../utils/paginate.js';

describe('parsePagination', () => {
  it('retourne les valeurs par defaut si aucun parametre', () => {
    const result = parsePagination({});
    expect(result).toEqual({ page: 1, limit: 12, offset: 0 });
  });

  it('parse correctement page et limit', () => {
    const result = parsePagination({ page: '3', limit: '10' });
    expect(result).toEqual({ page: 3, limit: 10, offset: 20 });
  });

  it('corrige les valeurs negatives', () => {
    const result = parsePagination({ page: '-5', limit: '-1' });
    expect(result.page).toBe(1);
    expect(result.limit).toBe(12);
  });

  it('applique la limite max', () => {
    const result = parsePagination({ limit: '999' }, 12, 100);
    expect(result.limit).toBe(100);
  });

  it('gere les valeurs non numeriques', () => {
    const result = parsePagination({ page: 'abc', limit: 'xyz' });
    expect(result.page).toBe(1);
    expect(result.limit).toBe(12);
  });

  it('calcule le bon offset', () => {
    const result = parsePagination({ page: '5', limit: '20' });
    // offset = (5 - 1) * 20 = 80
    expect(result.offset).toBe(80);
  });
});

describe('paginatedResponse', () => {
  it('retourne le bon format', () => {
    const data = [{ id: 1 }, { id: 2 }];
    const result = paginatedResponse(data, 50, 1, 12);

    expect(result.data).toEqual(data);
    expect(result.pagination).toEqual({
      page: 1,
      limit: 12,
      total: 50,
      totalPages: 5, // ceil(50/12) = 5
    });
  });

  it('calcule totalPages correctement avec un reste', () => {
    const result = paginatedResponse([], 25, 1, 10);
    expect(result.pagination.totalPages).toBe(3); // ceil(25/10) = 3
  });

  it('retourne 1 page si total <= limit', () => {
    const result = paginatedResponse([], 5, 1, 12);
    expect(result.pagination.totalPages).toBe(1);
  });

  it('retourne 0 pages si total est 0', () => {
    const result = paginatedResponse([], 0, 1, 12);
    expect(result.pagination.totalPages).toBe(0);
  });
});
```

### Lancer les tests :
```bash
cd backend_complete
npm test
```

Tu devrais voir quelque chose comme :
```
 ✓ tests/paginate.test.js (10)
   ✓ parsePagination (6)
   ✓ paginatedResponse (4)

 Test Files  1 passed (1)
      Tests  10 passed (10)
```

---

## Etape 6 — Ecrire les tests unitaires (validation Zod)

### Action :
Cree le fichier `backend_complete/tests/validators.test.js` :

```js
// tests/validators.test.js
import { describe, it, expect } from 'vitest';
import {
  registerSchema,
  loginSchema,
  createEventSchema,
  createReservationSchema,
  createPaymentSchema,
} from '../validators/index.js';

describe('registerSchema', () => {
  it('accepte un email et password valides', () => {
    const result = registerSchema.safeParse({ email: 'test@test.com', password: '123456' });
    expect(result.success).toBe(true);
  });

  it('refuse un email invalide', () => {
    const result = registerSchema.safeParse({ email: 'pasunemail', password: '123456' });
    expect(result.success).toBe(false);
    expect(result.error.issues[0].message).toContain('email');
  });

  it('refuse un mot de passe trop court', () => {
    const result = registerSchema.safeParse({ email: 'test@test.com', password: '12' });
    expect(result.success).toBe(false);
  });

  it('refuse si email manquant', () => {
    const result = registerSchema.safeParse({ password: '123456' });
    expect(result.success).toBe(false);
  });

  it('refuse si password manquant', () => {
    const result = registerSchema.safeParse({ email: 'test@test.com' });
    expect(result.success).toBe(false);
  });
});

describe('loginSchema', () => {
  it('accepte des donnees valides', () => {
    const result = loginSchema.safeParse({ email: 'test@test.com', password: 'x' });
    expect(result.success).toBe(true);
  });

  it('refuse un email invalide', () => {
    const result = loginSchema.safeParse({ email: '', password: 'x' });
    expect(result.success).toBe(false);
  });
});

describe('createEventSchema', () => {
  it('accepte un evenement valide minimal', () => {
    const result = createEventSchema.safeParse({
      title: 'Mon event',
      description: 'Super event',
    });
    expect(result.success).toBe(true);
    expect(result.data.is_public).toBe(1); // valeur par defaut
  });

  it('refuse si titre vide', () => {
    const result = createEventSchema.safeParse({
      title: '',
      description: 'test',
    });
    expect(result.success).toBe(false);
  });

  it('refuse si titre manquant', () => {
    const result = createEventSchema.safeParse({
      description: 'test',
    });
    expect(result.success).toBe(false);
  });

  it('accepte les champs optionnels a null', () => {
    const result = createEventSchema.safeParse({
      title: 'Test',
      description: 'Desc',
      location: null,
      capacity: null,
      image_url: null,
    });
    expect(result.success).toBe(true);
  });

  it('refuse une capacite negative', () => {
    const result = createEventSchema.safeParse({
      title: 'Test',
      description: 'Desc',
      capacity: -5,
    });
    expect(result.success).toBe(false);
  });

  it('supprime les champs non prevus', () => {
    const result = createEventSchema.safeParse({
      title: 'Test',
      description: 'Desc',
      hack: 'injection',
      id: 999,
    });
    expect(result.success).toBe(true);
    expect(result.data.hack).toBeUndefined();
    expect(result.data.id).toBeUndefined();
  });
});

describe('createReservationSchema', () => {
  it('accepte une reservation valide', () => {
    const result = createReservationSchema.safeParse({
      event_id: 1,
      nom: 'Dupont',
      prenom: 'Jean',
      email: 'jean@test.com',
    });
    expect(result.success).toBe(true);
  });

  it('refuse si email invalide', () => {
    const result = createReservationSchema.safeParse({
      event_id: 1,
      nom: 'Dupont',
      prenom: 'Jean',
      email: 'pasunemail',
    });
    expect(result.success).toBe(false);
  });

  it('refuse si nom manquant', () => {
    const result = createReservationSchema.safeParse({
      event_id: 1,
      prenom: 'Jean',
      email: 'jean@test.com',
    });
    expect(result.success).toBe(false);
  });
});

describe('createPaymentSchema', () => {
  it('accepte un paiement valide', () => {
    const result = createPaymentSchema.safeParse({
      event_id: 1,
      amount: 25.50,
    });
    expect(result.success).toBe(true);
  });

  it('refuse un montant negatif', () => {
    const result = createPaymentSchema.safeParse({
      event_id: 1,
      amount: -10,
    });
    expect(result.success).toBe(false);
  });
});
```

### Lancer les tests :
```bash
npm test
```

---

## Etape 7 — Ecrire les tests d'integration (API)

Les tests d'integration testent les routes Express avec une vraie requete HTTP (via Supertest). Ils necessitent une connexion a la base de donnees.

> **Important** : Ces tests interagissent avec ta base de donnees reelle. En production, on utiliserait une base de test separee. Pour ce TP, on va creer et supprimer nos donnees de test.

### Action :
Cree le fichier `backend_complete/tests/auth.test.js` :

```js
// tests/auth.test.js
import { describe, it, expect, beforeAll } from 'vitest';
import dotenv from 'dotenv';
dotenv.config();

import request from 'supertest';
import app from '../app.js';
import { db } from '../db.js';
import { users } from '../schema.js';
import { eq } from 'drizzle-orm';

// Email unique pour les tests (evite les conflits)
const TEST_EMAIL = `test_${Date.now()}@vitest.com`;
let authToken = '';

// Nettoyage apres les tests
afterAll(async () => {
  await db.delete(users).where(eq(users.email, TEST_EMAIL));
});

describe('POST /api/auth/register', () => {
  it('cree un compte et retourne un token', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: TEST_EMAIL, password: 'password123' });

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('token');
    expect(res.body).toHaveProperty('user');
    expect(res.body.user.email).toBe(TEST_EMAIL);

    authToken = res.body.token;
  });

  it('refuse un email deja existant', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: TEST_EMAIL, password: 'password123' });

    expect(res.status).toBe(409);
    expect(res.body.message).toContain('existant');
  });

  it('refuse si email manquant', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ password: 'password123' });

    expect(res.status).toBe(400);
  });

  it('refuse si mot de passe trop court', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'autre@test.com', password: '12' });

    expect(res.status).toBe(400);
  });
});

describe('POST /api/auth/login', () => {
  it('connecte un utilisateur existant', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: TEST_EMAIL, password: 'password123' });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('token');
    expect(res.body.user.email).toBe(TEST_EMAIL);
  });

  it('refuse un mauvais mot de passe', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: TEST_EMAIL, password: 'mauvais' });

    expect(res.status).toBe(401);
  });

  it('refuse un email inexistant', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'nexistepas@test.com', password: 'password123' });

    expect(res.status).toBe(401);
  });
});

describe('Routes protegees', () => {
  it('refuse GET /api/users sans token', async () => {
    const res = await request(app).get('/api/users');
    expect(res.status).toBe(401);
  });

  it('refuse GET /api/users avec un faux token', async () => {
    const res = await request(app)
      .get('/api/users')
      .set('Authorization', 'Bearer faux_token_123');

    expect(res.status).toBe(401);
  });
});
```

---

## Etape 8 — Ecrire les tests pour les evenements

### Action :
Cree le fichier `backend_complete/tests/events.test.js` :

```js
// tests/events.test.js
import { describe, it, expect, beforeAll } from 'vitest';
import dotenv from 'dotenv';
dotenv.config();

import request from 'supertest';
import app from '../app.js';

describe('GET /api/events', () => {
  it('retourne une reponse paginee', async () => {
    const res = await request(app).get('/api/events');

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('data');
    expect(res.body).toHaveProperty('pagination');
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.pagination).toHaveProperty('page');
    expect(res.body.pagination).toHaveProperty('totalPages');
    expect(res.body.pagination).toHaveProperty('total');
  });

  it('respecte le parametre limit', async () => {
    const res = await request(app).get('/api/events?limit=2');

    expect(res.status).toBe(200);
    expect(res.body.data.length).toBeLessThanOrEqual(2);
    expect(res.body.pagination.limit).toBe(2);
  });

  it('retourne la page demandee', async () => {
    const res = await request(app).get('/api/events?page=1&limit=1');

    expect(res.status).toBe(200);
    expect(res.body.pagination.page).toBe(1);
  });
});

describe('GET /api/events/:id', () => {
  it('retourne 404 pour un evenement inexistant', async () => {
    const res = await request(app).get('/api/events/999999');

    expect(res.status).toBe(404);
  });
});

describe('POST /api/events (protege)', () => {
  it('refuse sans token', async () => {
    const res = await request(app)
      .post('/api/events')
      .send({ title: 'Test', description: 'Test' });

    expect(res.status).toBe(401);
  });
});
```

---

## Etape 9 — Test du endpoint racine

### Action :
Cree le fichier `backend_complete/tests/health.test.js` :

```js
// tests/health.test.js
import { describe, it, expect } from 'vitest';
import dotenv from 'dotenv';
dotenv.config();

import request from 'supertest';
import app from '../app.js';

describe('GET /', () => {
  it('retourne API OK', async () => {
    const res = await request(app).get('/');
    expect(res.status).toBe(200);
    expect(res.text).toBe('API OK');
  });
});

describe('Route inexistante', () => {
  it('retourne 404 pour une route inconnue', async () => {
    const res = await request(app).get('/api/route-inexistante');
    expect(res.status).toBe(404);
  });
});
```

---

## Etape 10 — Lancer tous les tests

### Action :
```bash
cd backend_complete
npm test
```

### Resultat attendu :
```
 ✓ tests/health.test.js (2)
 ✓ tests/paginate.test.js (10)
 ✓ tests/validators.test.js (15)
 ✓ tests/auth.test.js (8)
 ✓ tests/events.test.js (5)

 Test Files  5 passed (5)
      Tests  40 passed (40)
```

### Mode watch (developpement) :
```bash
npm run test:watch
```
Les tests se relancent automatiquement a chaque modification de fichier.

---

## Resume des fichiers

| Fichier | Action |
|---|---|
| `package.json` | **Modifie** — scripts test + devDependencies |
| `app.js` | **Cree** — app Express sans listen (pour les tests) |
| `server.mjs` | **Modifie** — importe app.js |
| `tests/paginate.test.js` | **Cree** — tests unitaires pagination |
| `tests/validators.test.js` | **Cree** — tests unitaires validation Zod |
| `tests/auth.test.js` | **Cree** — tests integration authentification |
| `tests/events.test.js` | **Cree** — tests integration evenements |
| `tests/health.test.js` | **Cree** — test du endpoint racine |

---

## Ce qu'on a appris dans ce TP

- **Separer `app.js` et `server.mjs`** permet de tester l'API sans demarrer le serveur
- **Vitest** est un framework de test moderne et rapide, compatible ES Modules
- **Supertest** simule des requetes HTTP vers une app Express
- **Tests unitaires** verifient des fonctions isolees (rapide, sans BDD)
- **Tests d'integration** verifient des routes completes (plus lent, avec BDD)
- **`safeParse`** de Zod est facile a tester car il retourne un objet au lieu de lancer une exception
- **Toujours nettoyer** les donnees de test (`afterAll`) pour ne pas polluer la base
- **`npm test`** doit etre la premiere commande a lancer apres un `git pull`
