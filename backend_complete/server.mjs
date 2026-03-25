// server.mjs
import dotenv from 'dotenv';
dotenv.config();

// Vérification des variables d'environnement obligatoires
const requiredEnv = ['DB_HOST', 'DB_USER', 'DB_PASSWORD', 'DB_NAME', 'JWT_SECRET'];
const missing = requiredEnv.filter(key => !process.env[key]);
if (missing.length > 0) {
  console.error(`ERREUR: Variables d'environnement manquantes : ${missing.join(', ')}`);
  console.error('Copie .env.example vers .env et remplis les valeurs.');
  process.exit(1);
}

import app from './app.js';
import { globalLimiter } from './middleware/rateLimiter.js';

app.use(globalLimiter);

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
