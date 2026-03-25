# TP2 — Securisation de la Configuration

## Objectif
Proteger les secrets du projet (mots de passe, cles JWT) et mettre en place un `.gitignore` correct.
A la fin de ce TP, tes secrets ne seront plus jamais commites dans Git.

## Prerequis
- TP1 termine
- Git installe sur ta machine

## Duree estimee : 30 minutes

---

## Etape 1 — Comprendre le probleme

Ouvre le fichier `backend_complete/.env` :

```
PORT=4000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=ROOT
DB_NAME=evenement
JWT_SECRET=mon_secret_bts
```

### Pourquoi c'est dangereux ?

1. **Le fichier `.env` est commite dans Git** : quiconque clone le depot voit tes mots de passe
2. **Le `JWT_SECRET` est trivial** (`mon_secret_bts`) : n'importe qui peut deviner ce secret et creer de faux tokens JWT pour se faire passer pour un admin
3. **Le mot de passe BDD est faible** (`ROOT`) : en production, ca serait une faille critique

> **Question** : Que peut faire un attaquant qui connait ton `JWT_SECRET` ?
> **Reponse** : Il peut generer un token JWT valide avec `role: "admin"` et acceder a toutes les routes protegees (supprimer des utilisateurs, des evenements, voir les donnees privees...).

---

## Etape 2 — Creer un fichier .gitignore

A la **racine du projet** (pas dans backend ou frontend), cree un fichier `.gitignore` :

### Action :
Cree le fichier `.gitignore` a la racine du projet avec ce contenu :

```gitignore
# Dependances
node_modules/

# Variables d'environnement (SECRETS)
.env
.env.local
.env.production

# Logs
*.log
npm-debug.log*

# OS
.DS_Store
Thumbs.db

# IDE
.vscode/
.idea/

# Build
dist/
build/
```

### Verification :
```bash
# A la racine du projet
git status
```
Le fichier `.env` ne devrait plus apparaitre dans les fichiers suivis.

> **Attention** : Si le `.env` a deja ete commite, le `.gitignore` ne suffit pas. Il faut aussi le retirer de l'historique Git :
> ```bash
> git rm --cached backend_complete/.env
> git commit -m "Retrait du .env de l'historique Git"
> ```

---

## Etape 3 — Creer un fichier .env.example

Le `.env` ne sera plus dans Git, mais les autres developpeurs doivent savoir quelles variables sont necessaires. On cree un fichier **modele** sans les vraies valeurs.

### Action :
Cree le fichier `backend_complete/.env.example` :

```env
# Configuration serveur
PORT=4000

# Base de donnees MySQL
DB_HOST=localhost
DB_PORT=3306
DB_USER=ton_utilisateur
DB_PASSWORD=ton_mot_de_passe
DB_NAME=evenement

# Secret JWT (genere une chaine aleatoire longue !)
# Tu peux en generer un avec : node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
JWT_SECRET=REMPLACE_PAR_UNE_CLE_ALEATOIRE_LONGUE
```

### Explication :
- Ce fichier sert de **documentation** : il montre quelles variables sont necessaires
- Il ne contient **aucun vrai secret**
- Il EST commite dans Git (contrairement au `.env`)

---

## Etape 4 — Generer un vrai JWT_SECRET securise

### Action :
Ouvre un terminal et lance cette commande :

```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

Tu vas obtenir une chaine de 128 caracteres hexadecimaux, par exemple :
```
a3f8b2c1d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0
```

### Action :
Mets a jour ton fichier `backend_complete/.env` :

```env
PORT=4000
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=ROOT
DB_NAME=evenement
JWT_SECRET=COLLE_ICI_TA_CLE_GENEREE
```

> **Important** : En production, le `DB_PASSWORD` doit aussi etre un mot de passe fort. Pour le developpement local, `ROOT` est acceptable.

---

## Etape 5 — Securiser le chargement du .env dans le backend

Actuellement, `dotenv.config()` est appele dans **plusieurs fichiers** (`server.mjs`, `db.js`, `authController.js`, `authMiddleware.js`). C'est redondant et risque de causer des bugs si un fichier est charge avant que dotenv ne soit initialise.

### Action :
On va s'assurer que dotenv est charge **une seule fois**, au tout debut de `server.mjs`.

Le fichier `server.mjs` charge deja dotenv en premier, donc c'est bon. Mais il faut **retirer** les appels `dotenv.config()` des autres fichiers :

#### Fichier `backend_complete/db.js` — Supprime les lignes dotenv :
```js
// db.js
import mysql from 'mysql2/promise';
import { drizzle } from 'drizzle-orm/mysql2';

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 3306,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10
});

export const db = drizzle(pool);
export const poolDirect = pool;
```

#### Fichier `backend_complete/controllers/authController.js` — Supprime les lignes dotenv :
```js
// controllers/authController.js
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User } from '../models/index.js';

// ... (reste du code inchange)
```

#### Fichier `backend_complete/middleware/authMiddleware.js` — Supprime les lignes dotenv :
```js
// middleware/authMiddleware.js
import jwt from 'jsonwebtoken';

export const authMiddleware = (req, res, next) => {
  const header = req.headers.authorization;
  if (!header) return res.status(401).json({ message: 'No token' });
  const token = header.split(' ')[1];
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = { id: payload.userId, role: payload.role };
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Token invalide' });
  }
};
```

### Pourquoi ?
- `dotenv.config()` lit le fichier `.env` et charge les variables dans `process.env`
- Il suffit de le faire **une seule fois** au demarrage de l'application
- Les autres fichiers accedent simplement a `process.env.XXX` qui est deja rempli

---

## Etape 6 — Verifier que le backend demarre correctement

### Action :
```bash
cd backend_complete
npm run dev
```

### Verification :
1. Le serveur demarre sans erreur
2. Tu vois `Server running on port 4000`
3. `GET http://localhost:4000/` renvoie `API OK`
4. `POST http://localhost:4000/api/auth/login` avec un bon email/mot de passe renvoie un token

> **Si ca ne marche pas** : verifie que ton `.env` existe bien dans `backend_complete/` et que les variables sont correctes.

---

## Etape 7 — Ajouter une verification de demarrage

Ajoutons une verification au demarrage du serveur pour s'assurer que toutes les variables d'environnement sont presentes.

### Action :
Modifie `backend_complete/server.mjs` pour ajouter une verification apres `dotenv.config()` :

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

const app = express();
app.use(cors());
app.use(express.json());

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

### Test :
1. Renomme temporairement ton `.env` en `.env.backup`
2. Lance `npm run dev`
3. Tu devrais voir : `ERREUR: Variables d'environnement manquantes : DB_HOST, DB_USER, ...`
4. Renomme `.env.backup` en `.env`
5. Relance : ca marche

---

## Resume des fichiers modifies

| Fichier | Action |
|---|---|
| `.gitignore` (racine) | **Cree** — ignore .env et node_modules |
| `backend_complete/.env.example` | **Cree** — modele sans secrets |
| `backend_complete/.env` | **Modifie** — JWT_SECRET fort |
| `backend_complete/server.mjs` | **Modifie** — verification des env vars |
| `backend_complete/db.js` | **Modifie** — supprime dotenv redondant |
| `backend_complete/controllers/authController.js` | **Modifie** — supprime dotenv redondant |
| `backend_complete/middleware/authMiddleware.js` | **Modifie** — supprime dotenv redondant |

---

## Ce qu'on a appris dans ce TP

- **Ne jamais commiter de secrets** dans Git (`.env`, cles API, mots de passe)
- **`.gitignore`** est la premiere chose a configurer dans un projet
- **`.env.example`** documente les variables necessaires sans exposer les valeurs
- **Un JWT_SECRET fort** (64+ octets aleatoires) est essentiel pour la securite
- **`dotenv.config()`** ne doit etre appele qu'une seule fois, au point d'entree
- **Verifier les variables d'environnement** au demarrage evite les erreurs cryptiques en runtime
