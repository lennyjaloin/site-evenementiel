# TP10 — Preparation au Deploiement

## Objectif
Preparer le projet pour un deploiement en production : build du frontend, configuration de production, securisation finale, et creation d'un script de demarrage propre. A la fin de ce TP, ton projet est pret a etre mis en ligne.

## Prerequis
- TP1 a TP9 termines
- Tous les tests passent (`npm test`)

## Duree estimee : 50 minutes

---

## Etape 1 — Comprendre la difference Dev vs Production

| | Developpement | Production |
|---|---|---|
| Frontend | `npm run dev` (Vite dev server) | `npm run build` (fichiers statiques) |
| Backend | `nodemon` (redemarrage auto) | `node server.mjs` (stable) |
| Base de donnees | localhost, root/ROOT | Serveur distant, identifiants forts |
| CORS | localhost:5173 | https://monsite.fr |
| Debug | Erreurs detaillees | Messages generiques |
| Rate-limit | Souple pour les tests | Strict |

En production, le frontend est compile en fichiers statiques (HTML/CSS/JS) et servi par le backend Express ou un serveur web (Nginx).

---

## Etape 2 — Configurer le mode production dans le backend

### 2.1 — Ajouter la variable NODE_ENV

Modifie `backend_complete/.env` pour ajouter :

```env
NODE_ENV=development
```

Et dans `backend_complete/.env.example` :

```env
# Environnement : development ou production
NODE_ENV=development
```

### 2.2 — Adapter le middleware d'erreur

En production, on ne veut pas exposer les details des erreurs (stack trace, messages internes). Modifie `backend_complete/middleware/errorMiddleware.js` :

```js
// middleware/errorMiddleware.js
export const errorHandler = (err, req, res, next) => {
  console.error(err);

  const isDev = process.env.NODE_ENV !== 'production';

  res.status(err.status || 500).json({
    message: isDev ? err.message : 'Erreur serveur',
    // En dev, on affiche les details. En prod, on les cache.
    ...(isDev && { details: err.message, stack: err.stack }),
  });
};
```

### Pourquoi ?
Un attaquant qui voit le stack trace peut :
- Connaitre les fichiers et la structure de ton projet
- Identifier les versions des bibliotheques
- Trouver des failles connues

---

## Etape 3 — Servir le frontend depuis le backend (production)

En production, on n'utilise pas le serveur Vite. Le backend Express sert directement les fichiers compiles du frontend.

### 3.1 — Builder le frontend

```bash
cd frontend_complete
npm run build
```

Cela cree un dossier `frontend_complete/dist/` avec les fichiers statiques.

### 3.2 — Configurer Express pour servir les fichiers statiques

Modifie `backend_complete/app.js` pour ajouter le support des fichiers statiques en production :

```js
// app.js — Application Express
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';

import authRoutes from './routes/auth.js';
import userRoutes from './routes/users.js';
import eventRoutes from './routes/events.js';
import inscriptionRoutes from './routes/inscriptions.js';
import reservationRoutes from './routes/reservations.js';
import paymentRoutes from './routes/payments.js';
import { errorHandler } from './middleware/errorMiddleware.js';

// __dirname equivalent en ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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

// --- Routes API ---
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/inscriptions', inscriptionRoutes);
app.use('/api/reservations', reservationRoutes);
app.use('/api/payments', paymentRoutes);

app.get('/api', (req, res) => res.json({ status: 'API OK' }));

// --- Frontend statique (production) ---
if (process.env.NODE_ENV === 'production') {
  const frontendPath = path.join(__dirname, '..', 'frontend_complete', 'dist');

  // Servir les fichiers statiques (JS, CSS, images)
  app.use(express.static(frontendPath));

  // Pour toutes les autres routes, renvoyer index.html (SPA React)
  app.get('*', (req, res) => {
    res.sendFile(path.join(frontendPath, 'index.html'));
  });
}

app.use(errorHandler);

export default app;
```

### Explication :
- En **developpement** : le frontend est servi par Vite sur le port 5173, le backend tourne sur le port 4000
- En **production** : le backend sert les fichiers du dossier `dist/` et renvoie `index.html` pour toutes les routes non-API (necessaire pour React Router)

### 3.3 — Configurer le frontend pour la production

Le frontend doit appeler l'API sur la meme origine en production (pas de proxy Vite).

Le fichier `frontend_complete/src/services/api.js` utilise deja :
```js
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "";
```

En production, `VITE_API_BASE_URL` sera vide (meme domaine). C'est deja correct.

---

## Etape 4 — Creer un script de deploiement

### Action :
Cree le fichier `deploy.bat` a la racine du projet :

```bat
@echo off
echo ============================================
echo      DEPLOIEMENT DU PROJET
echo ============================================

echo.
echo [1/4] Installation des dependances backend...
cd /d %~dp0backend_complete
call npm install --production
if errorlevel 1 (
    echo ERREUR: Installation backend echouee
    exit /b 1
)

echo.
echo [2/4] Installation des dependances frontend...
cd /d %~dp0frontend_complete
call npm install
if errorlevel 1 (
    echo ERREUR: Installation frontend echouee
    exit /b 1
)

echo.
echo [3/4] Build du frontend...
call npm run build
if errorlevel 1 (
    echo ERREUR: Build frontend echoue
    exit /b 1
)

echo.
echo [4/4] Verification...
if not exist "%~dp0frontend_complete\dist\index.html" (
    echo ERREUR: Le build n'a pas produit de fichier index.html
    exit /b 1
)

echo.
echo ============================================
echo      DEPLOIEMENT TERMINE AVEC SUCCES
echo ============================================
echo.
echo Pour demarrer en production :
echo   cd backend_complete
echo   set NODE_ENV=production
echo   node server.mjs
echo.
exit /b 0
```

---

## Etape 5 — Ajouter les scripts de production dans package.json

### Action :
Modifie `backend_complete/package.json` pour ajouter un script de production :

```json
{
  "name": "backend_complete",
  "version": "1.0.0",
  "description": "API du site evenementiel BTS SIO",
  "main": "server.mjs",
  "scripts": {
    "test": "vitest run",
    "test:watch": "vitest",
    "start": "node server.mjs",
    "dev": "nodemon server.mjs",
    "prod": "set NODE_ENV=production && node server.mjs",
    "db:init": "node createTables.js"
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

### Nouveaux scripts :
- **`npm run prod`** : demarre le serveur en mode production
- **`npm run db:init`** : initialise les tables de la base de donnees

---

## Etape 6 — Creer un README.md complet

### Action :
Cree (ou remplace) le fichier `README.md` a la racine du projet :

```markdown
# Site Evenementiel — BTS SIO

Application web de gestion d'evenements avec systeme de reservation.

## Stack technique

- **Backend** : Express 5, Drizzle ORM, MySQL, JWT, bcryptjs, Zod
- **Frontend** : React 18, Vite 5, TailwindCSS 3, Framer Motion

## Installation

### Prerequis
- Node.js 18+
- MySQL 8+

### 1. Cloner le projet
```bash
git clone <url-du-repo>
cd Site-venementiel--Develop
```

### 2. Configurer l'environnement
```bash
cp backend_complete/.env.example backend_complete/.env
```
Edite le fichier `.env` avec tes identifiants MySQL et un JWT_SECRET fort.

### 3. Installer les dependances
```bash
cd backend_complete && npm install
cd ../frontend_complete && npm install
```

### 4. Initialiser la base de donnees
```bash
cd backend_complete
npm run db:init
```

### 5. Lancer en developpement
```bash
# Terminal 1
cd backend_complete && npm run dev

# Terminal 2
cd frontend_complete && npm run dev
```

Ouvre http://localhost:5173

## Lancer en production

```bash
cd frontend_complete && npm run build
cd ../backend_complete
npm run prod
```

Ouvre http://localhost:4000

## Tests

```bash
cd backend_complete
npm test
```

## Structure du projet

```
.
├── backend_complete/
│   ├── controllers/     # Logique metier
│   ├── middleware/       # Auth, validation, erreurs, rate-limit
│   ├── models/          # Acces aux donnees (Drizzle ORM)
│   ├── routes/          # Routes Express
│   ├── tests/           # Tests Vitest
│   ├── utils/           # Utilitaires (pagination)
│   ├── validators/      # Schemas de validation Zod
│   ├── app.js           # Application Express
│   ├── server.mjs       # Point d'entree serveur
│   ├── db.js            # Connexion MySQL
│   └── schema.js        # Schema Drizzle ORM
├── frontend_complete/
│   ├── src/
│   │   ├── components/  # Composants reutilisables
│   │   ├── context/     # Context React (Auth)
│   │   ├── pages/       # Pages de l'application
│   │   └── services/    # Appels API (Axios)
│   └── ...
├── TPs/                 # Travaux pratiques detailles
└── README.md
```

## Routes API

| Methode | Route | Auth | Description |
|---|---|---|---|
| POST | /api/auth/register | - | Creer un compte |
| POST | /api/auth/login | - | Se connecter |
| GET | /api/events | - | Lister les evenements (pagine) |
| GET | /api/events/:id | - | Detail d'un evenement |
| POST | /api/events | Admin | Creer un evenement |
| PUT | /api/events/:id | Admin | Modifier un evenement |
| DELETE | /api/events/:id | Admin | Supprimer un evenement |
| POST | /api/reservations | - | Reserver un evenement |
| GET | /api/reservations | Admin | Lister les reservations |
| DELETE | /api/reservations/:id | Admin | Supprimer une reservation |
| POST | /api/inscriptions | Auth | S'inscrire a un evenement |
| GET | /api/inscriptions/me | Auth | Mes inscriptions |
| DELETE | /api/inscriptions/:id | Auth | Annuler une inscription |
| POST | /api/payments | Auth | Effectuer un paiement |
| GET | /api/payments/me | Auth | Mes paiements |
| GET | /api/users | Admin | Lister les utilisateurs |
| DELETE | /api/users/:id | Admin | Supprimer un utilisateur |
```

---

## Etape 7 — Checklist de securite finale

Avant de mettre en production, verifie que chaque point est coche :

### Backend
- [ ] `.env` n'est PAS commite dans Git (`.gitignore`)
- [ ] `JWT_SECRET` est une chaine aleatoire de 64+ octets
- [ ] Le mot de passe BDD n'est PAS `root` ou `ROOT`
- [ ] CORS est configure avec les bons domaines
- [ ] Rate-limiting est actif sur login et reservations
- [ ] Toutes les entrees sont validees avec Zod
- [ ] Les erreurs n'exposent pas le stack trace en production
- [ ] Les routes admin sont protegees par `authMiddleware` + `requireRole`
- [ ] `insertId` est utilise au lieu de `ORDER BY DESC LIMIT 1`
- [ ] Tous les tests passent (`npm test`)

### Frontend
- [ ] `/admin` est protege par `PrivateRoute` avec `requiredRole="admin"`
- [ ] `/profile` est protege par `PrivateRoute`
- [ ] `/login` et `/signup` redirigent si deja connecte (`GuestRoute`)
- [ ] Les erreurs API sont affichees clairement (intercepteur Axios)
- [ ] Le build fonctionne (`npm run build`)

### General
- [ ] Pas de code mort (dossier `ORM/` supprime)
- [ ] Pas de chemins en dur
- [ ] README.md a jour
- [ ] `.gitignore` en place

---

## Etape 8 — Tester le mode production localement

### Action :
1. Build le frontend :
```bash
cd frontend_complete
npm run build
```

2. Lance le backend en mode production :
```bash
cd backend_complete
set NODE_ENV=production
node server.mjs
```

3. Ouvre http://localhost:4000

### Verification :
- [ ] La page d'accueil s'affiche
- [ ] Tu peux naviguer vers /events, /login, /signup
- [ ] Tu peux te connecter et acceder au profil
- [ ] Tu peux creer un evenement (admin)
- [ ] Tu peux reserver un evenement
- [ ] La page /admin redirige si tu n'es pas admin
- [ ] L'URL /api/events retourne du JSON
- [ ] Les erreurs sont generiques (pas de stack trace)

---

## Etape 9 — Pour aller plus loin (bonus)

Voici les ameliorations possibles pour continuer le projet :

### 1. HTTPS
En production, toujours utiliser HTTPS. Avec un hebergeur comme Render, Heroku ou Railway, c'est automatique.

### 2. Docker
Creer un `Dockerfile` pour containeriser l'application :
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY backend_complete/package*.json ./
RUN npm install --production
COPY backend_complete/ ./
EXPOSE 4000
CMD ["node", "server.mjs"]
```

### 3. CI/CD
Ajouter un fichier `.github/workflows/test.yml` pour lancer les tests automatiquement a chaque push :
```yaml
name: Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 18
      - run: cd backend_complete && npm install
      - run: cd backend_complete && npm test
```

### 4. Envoi d'emails
Ajouter un service d'envoi d'emails (Nodemailer + service SMTP) pour confirmer les reservations.

### 5. Upload d'images
Remplacer `image_url` par un vrai systeme d'upload (Multer + stockage local ou S3).

---

## Resume des fichiers

| Fichier | Action |
|---|---|
| `middleware/errorMiddleware.js` | **Modifie** — cache les details en production |
| `app.js` | **Modifie** — sert le frontend en production |
| `server.mjs` | **Modifie** — importe app.js + rate-limiter |
| `backend_complete/package.json` | **Modifie** — scripts prod et db:init |
| `deploy.bat` | **Cree** — script de deploiement |
| `README.md` | **Cree** — documentation complete |
| `.env` | **Modifie** — ajout NODE_ENV |
| `.env.example` | **Modifie** — ajout NODE_ENV |

---

## Ce qu'on a appris dans ce TP

- **Dev vs Production** : deux modes avec des configurations differentes
- **Build React** : `npm run build` genere des fichiers statiques optimises
- **Express statique** : `express.static()` sert les fichiers compiles du frontend
- **SPA fallback** : toutes les routes non-API renvoient `index.html` pour que React Router fonctionne
- **Erreurs en production** : ne jamais exposer le stack trace
- **Checklist de securite** : verifier chaque point avant la mise en production
- **README.md** : documentation essentielle pour tout projet
