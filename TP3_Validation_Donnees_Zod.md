# TP3 — Validation des Donnees avec Zod

## Objectif
Ajouter une couche de validation sur toutes les entrees de l'API pour empecher les donnees invalides ou malveillantes d'atteindre la base de donnees.

## Prerequis
- TP1 et TP2 termines
- Backend fonctionnel

## Duree estimee : 1 heure

---

## Etape 1 — Comprendre le probleme

Ouvre le fichier `backend_complete/controllers/eventController.js` et regarde la fonction `updateEvent` :

```js
export const updateEvent = async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const updated = await Event.update(id, req.body);
    res.json(updated);
  } catch (err) { next(err); }
};
```

### Que se passe-t-il si un utilisateur envoie cette requete ?

```json
POST /api/events
{
  "title": "",
  "description": 12345,
  "capacity": "abc",
  "is_public": "nimportequoi"
}
```

Reponse : **Ca arrive directement dans la base de donnees !** Il n'y a aucune verification que :
- Le titre n'est pas vide
- La description est bien une chaine de caracteres
- La capacite est un nombre positif
- L'email a un format valide

C'est la meme chose pour `createReservation`, `register`, `login`, etc.

> **Regle d'or** : Ne jamais faire confiance aux donnees envoyees par le client. TOUJOURS valider cote serveur.

---

## Etape 2 — Installer Zod

Zod est une bibliotheque de validation TypeScript/JavaScript. Elle permet de definir des schemas de validation et de verifier que les donnees correspondent.

### Action :
```bash
cd backend_complete
npm install zod
```

### Pourquoi Zod plutot que Joi ?
- Zod est plus leger et plus moderne
- Il fonctionne nativement avec les ES Modules (notre projet utilise `"type": "module"`)
- La syntaxe est plus lisible

---

## Etape 3 — Creer les schemas de validation

### Action :
Cree le fichier `backend_complete/validators/index.js` :

```js
// validators/index.js
import { z } from 'zod';

// ========================================
// AUTH
// ========================================

export const registerSchema = z.object({
  email: z
    .string({ required_error: "L'email est obligatoire" })
    .email("Format d'email invalide")
    .max(120, "Email trop long (max 120 caracteres)"),
  password: z
    .string({ required_error: "Le mot de passe est obligatoire" })
    .min(6, "Le mot de passe doit faire au moins 6 caracteres")
    .max(100, "Mot de passe trop long"),
});

export const loginSchema = z.object({
  email: z
    .string({ required_error: "L'email est obligatoire" })
    .email("Format d'email invalide"),
  password: z
    .string({ required_error: "Le mot de passe est obligatoire" })
    .min(1, "Le mot de passe est obligatoire"),
});

// ========================================
// EVENTS
// ========================================

export const createEventSchema = z.object({
  title: z
    .string({ required_error: "Le titre est obligatoire" })
    .min(1, "Le titre ne peut pas etre vide")
    .max(150, "Titre trop long (max 150 caracteres)"),
  description: z
    .string({ required_error: "La description est obligatoire" })
    .min(1, "La description ne peut pas etre vide"),
  location: z
    .string()
    .max(180, "Lieu trop long (max 180 caracteres)")
    .nullable()
    .optional(),
  date_start: z
    .string()
    .nullable()
    .optional(),
  date_end: z
    .string()
    .nullable()
    .optional(),
  capacity: z
    .number()
    .int("La capacite doit etre un nombre entier")
    .min(1, "La capacite doit etre au moins 1")
    .nullable()
    .optional(),
  image_url: z
    .string()
    .url("URL d'image invalide")
    .max(255, "URL trop longue")
    .nullable()
    .optional(),
  is_public: z
    .number()
    .int()
    .min(0)
    .max(1)
    .optional()
    .default(1),
});

export const updateEventSchema = z.object({
  title: z
    .string()
    .min(1, "Le titre ne peut pas etre vide")
    .max(150, "Titre trop long")
    .optional(),
  description: z
    .string()
    .min(1, "La description ne peut pas etre vide")
    .optional(),
  location: z
    .string()
    .max(180)
    .nullable()
    .optional(),
  date_start: z
    .string()
    .nullable()
    .optional(),
  date_end: z
    .string()
    .nullable()
    .optional(),
  capacity: z
    .number()
    .int()
    .min(1)
    .nullable()
    .optional(),
  image_url: z
    .string()
    .url()
    .max(255)
    .nullable()
    .optional(),
  is_public: z
    .number()
    .int()
    .min(0)
    .max(1)
    .optional(),
});

// ========================================
// RESERVATIONS
// ========================================

export const createReservationSchema = z.object({
  event_id: z
    .number({ required_error: "L'ID de l'evenement est obligatoire" })
    .int("L'ID doit etre un entier")
    .positive("L'ID doit etre positif"),
  // On accepte aussi eventId (alias frontend)
  eventId: z
    .number()
    .int()
    .positive()
    .optional(),
  nom: z
    .string({ required_error: "Le nom est obligatoire" })
    .min(1, "Le nom ne peut pas etre vide")
    .max(80, "Nom trop long (max 80 caracteres)"),
  prenom: z
    .string({ required_error: "Le prenom est obligatoire" })
    .min(1, "Le prenom ne peut pas etre vide")
    .max(80, "Prenom trop long (max 80 caracteres)"),
  email: z
    .string({ required_error: "L'email est obligatoire" })
    .email("Format d'email invalide")
    .max(120, "Email trop long"),
}).refine(
  (data) => data.event_id || data.eventId,
  { message: "event_id ou eventId est obligatoire" }
);

// ========================================
// INSCRIPTIONS
// ========================================

export const createInscriptionSchema = z.object({
  event_id: z
    .number({ required_error: "L'ID de l'evenement est obligatoire" })
    .int()
    .positive(),
});

// ========================================
// PAYMENTS
// ========================================

export const createPaymentSchema = z.object({
  event_id: z
    .number({ required_error: "L'ID de l'evenement est obligatoire" })
    .int()
    .positive(),
  amount: z
    .number({ required_error: "Le montant est obligatoire" })
    .positive("Le montant doit etre positif"),
});
```

### Explication de la syntaxe Zod :
- `z.string()` : doit etre une chaine de caracteres
- `.min(6)` : longueur minimale de 6
- `.email()` : doit etre un format email valide
- `.nullable()` : accepte `null`
- `.optional()` : le champ peut etre absent
- `.default(1)` : valeur par defaut si absent
- `z.object({...})` : definit un objet avec des champs valides
- `.refine()` : validation personnalisee

---

## Etape 4 — Creer un middleware de validation

Ce middleware va s'intercaler entre la route et le controller pour valider les donnees.

### Action :
Cree le fichier `backend_complete/middleware/validate.js` :

```js
// middleware/validate.js

/**
 * Middleware de validation avec Zod.
 * Utilisation : router.post('/events', validate(createEventSchema), createEvent);
 *
 * @param {import('zod').ZodSchema} schema - Le schema Zod a appliquer
 * @returns {Function} Middleware Express
 */
export const validate = (schema) => (req, res, next) => {
  const result = schema.safeParse(req.body);

  if (!result.success) {
    // On extrait les messages d'erreur lisibles
    const errors = result.error.issues.map(issue => ({
      champ: issue.path.join('.'),
      message: issue.message,
    }));

    return res.status(400).json({
      message: 'Donnees invalides',
      errors,
    });
  }

  // On remplace req.body par les donnees validees et nettoyees
  // Cela supprime tout champ non defini dans le schema !
  req.body = result.data;
  next();
};
```

### Pourquoi c'est important :
- `safeParse` ne lance pas d'exception, il retourne un objet `{ success, data, error }`
- On remplace `req.body` par `result.data` : cela **supprime automatiquement** tous les champs non prevus dans le schema. Plus de risque d'injection de champs !

---

## Etape 5 — Appliquer la validation aux routes

### 5.1 — Routes d'authentification

Modifie `backend_complete/routes/auth.js` :

```js
// routes/auth.js
import express from 'express';
import { register, login } from '../controllers/authController.js';
import { validate } from '../middleware/validate.js';
import { registerSchema, loginSchema } from '../validators/index.js';

const router = express.Router();

router.post('/register', validate(registerSchema), register);
router.post('/login', validate(loginSchema), login);

export default router;
```

### 5.2 — Routes des evenements

Modifie `backend_complete/routes/events.js` (celui qu'on a refait au TP1) :

```js
// routes/events.js
import express from 'express';
import {
  listEvents,
  getEvent,
  createEvent,
  updateEvent,
  deleteEvent
} from '../controllers/eventController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { requireRole } from '../middleware/roleMiddleware.js';
import { validate } from '../middleware/validate.js';
import { createEventSchema, updateEventSchema } from '../validators/index.js';

const router = express.Router();

// Public
router.get('/', listEvents);
router.get('/:id', getEvent);

// Admin : avec validation
router.post('/', authMiddleware, requireRole('admin'), validate(createEventSchema), createEvent);
router.put('/:id', authMiddleware, requireRole('admin'), validate(updateEventSchema), updateEvent);
router.delete('/:id', authMiddleware, requireRole('admin'), deleteEvent);

export default router;
```

### 5.3 — Routes des reservations

Modifie `backend_complete/routes/reservations.js` :

```js
// routes/reservations.js
import express from 'express';
import { createReservation, listReservations, deleteReservation } from '../controllers/reservationController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { requireRole } from '../middleware/roleMiddleware.js';
import { validate } from '../middleware/validate.js';
import { createReservationSchema } from '../validators/index.js';

const router = express.Router();

// Public : reserver sans compte (avec validation)
router.post('/', validate(createReservationSchema), createReservation);

// Admin : voir/supprimer les reservations
router.get('/', authMiddleware, requireRole('admin'), listReservations);
router.delete('/:id', authMiddleware, requireRole('admin'), deleteReservation);

export default router;
```

### 5.4 — Routes des inscriptions

Modifie `backend_complete/routes/inscriptions.js` :

```js
// routes/inscriptions.js
import express from 'express';
import { authMiddleware } from '../middleware/authMiddleware.js';
import * as ctrl from '../controllers/inscriptionController.js';
import { validate } from '../middleware/validate.js';
import { createInscriptionSchema } from '../validators/index.js';

const router = express.Router();
router.post('/', authMiddleware, validate(createInscriptionSchema), ctrl.createInscription);
router.get('/me', authMiddleware, ctrl.getUserInscriptions);
router.delete('/:id', authMiddleware, ctrl.cancelInscription);

export default router;
```

### 5.5 — Routes des paiements

Modifie `backend_complete/routes/payments.js` :

```js
// routes/payments.js
import express from 'express';
import { authMiddleware } from '../middleware/authMiddleware.js';
import * as ctrl from '../controllers/paymentController.js';
import { validate } from '../middleware/validate.js';
import { createPaymentSchema } from '../validators/index.js';

const router = express.Router();
router.post('/', authMiddleware, validate(createPaymentSchema), ctrl.createPayment);
router.get('/me', authMiddleware, ctrl.getMyPayments);
export default router;
```

---

## Etape 6 — Simplifier les controllers (la validation est faite en amont)

Maintenant que la validation est geree par le middleware, on peut simplifier les controllers.

### authController.js — Supprime la verification manuelle :

Dans `backend_complete/controllers/authController.js`, dans la fonction `register`, tu peux **supprimer** ce bloc car Zod s'en charge deja :

```js
// AVANT (a supprimer) :
if (!email || !password) {
  return res.status(400).json({ message: "Email et mot de passe obligatoires" });
}
```

### eventController.js — Supprime la verification manuelle :

Dans `backend_complete/controllers/eventController.js`, dans `createEvent`, **supprime** :

```js
// AVANT (a supprimer) :
if (!title || !description) {
  return res.status(400).json({ message: "Titre et description obligatoires" });
}
```

---

## Etape 7 — Tester la validation

### Test 1 : Inscription avec email invalide

```bash
curl -X POST http://localhost:4000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email": "pasunemail", "password": "123456"}'
```

Reponse attendue :
```json
{
  "message": "Donnees invalides",
  "errors": [
    { "champ": "email", "message": "Format d'email invalide" }
  ]
}
```

### Test 2 : Mot de passe trop court

```bash
curl -X POST http://localhost:4000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email": "test@test.com", "password": "12"}'
```

Reponse attendue :
```json
{
  "message": "Donnees invalides",
  "errors": [
    { "champ": "password", "message": "Le mot de passe doit faire au moins 6 caracteres" }
  ]
}
```

### Test 3 : Evenement sans titre

```bash
curl -X POST http://localhost:4000/api/events \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TON_TOKEN_ADMIN" \
  -d '{"description": "test"}'
```

Reponse attendue :
```json
{
  "message": "Donnees invalides",
  "errors": [
    { "champ": "title", "message": "Le titre est obligatoire" }
  ]
}
```

### Test 4 : Reservation sans nom

```bash
curl -X POST http://localhost:4000/api/reservations \
  -H "Content-Type: application/json" \
  -d '{"event_id": 1, "email": "a@b.com", "prenom": "Test"}'
```

Reponse attendue :
```json
{
  "message": "Donnees invalides",
  "errors": [
    { "champ": "nom", "message": "Le nom est obligatoire" }
  ]
}
```

### Test 5 : Injection de champs interdits

```bash
curl -X PUT http://localhost:4000/api/events/1 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TON_TOKEN_ADMIN" \
  -d '{"title": "Nouveau titre", "id": 999, "role": "admin"}'
```

Reponse attendue : seul `title` est pris en compte. Les champs `id` et `role` sont **ignores** car `req.body` a ete remplace par les donnees validees par Zod.

---

## Resume des fichiers

| Fichier | Action |
|---|---|
| `validators/index.js` | **Cree** — tous les schemas de validation |
| `middleware/validate.js` | **Cree** — middleware de validation generique |
| `routes/auth.js` | **Modifie** — ajout de validate() |
| `routes/events.js` | **Modifie** — ajout de validate() |
| `routes/reservations.js` | **Modifie** — ajout de validate() |
| `routes/inscriptions.js` | **Modifie** — ajout de validate() |
| `routes/payments.js` | **Modifie** — ajout de validate() |
| `controllers/authController.js` | **Modifie** — suppression de la validation manuelle |
| `controllers/eventController.js` | **Modifie** — suppression de la validation manuelle |

---

## Ce qu'on a appris dans ce TP

- **Ne jamais faire confiance au client** : toutes les donnees doivent etre validees cote serveur
- **Zod** permet de definir des schemas de validation lisibles et puissants
- **Un middleware generique** (`validate()`) evite de dupliquer la logique de validation dans chaque controller
- **Remplacer `req.body`** par les donnees validees empeche l'injection de champs non prevus
- **Les messages d'erreur** doivent etre clairs pour aider le developpeur frontend a afficher des erreurs utiles
