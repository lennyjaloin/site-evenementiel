# Site Événementiel — Frontend React + Tailwind (BTS)

## Installation
```bash
npm install
npm run dev
```

## Connexion au backend BTS
Dans un `.env` à la racine, mets l'URL de ton backend :

```env
VITE_API_BASE_URL=http://localhost:3000
# si besoin de proxy Vite:
VITE_PROXY_TARGET=http://localhost:3000
```

### Endpoints attendus
- **GET** `/api/events`
- **GET** `/api/events/:id`
- **POST** `/api/reservations`
  - body: `{ eventId, nom, prenom, email }`
- **GET** `/api/reservations` (admin)
- **DELETE** `/api/reservations/:id` (admin)

Adapte les routes dans `src/services/api.js` si ton backend a d'autres URL.

## Structure
- `src/pages/*` : pages du routing
- `src/components/*` : composants UI
- `src/services/api.js` : intégration backend

Bon dev 💜
