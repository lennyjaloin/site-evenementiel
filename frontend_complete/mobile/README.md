# Mobile Expo

Application mobile React Native compatible Expo Go, mise a jour vers Expo SDK 54.

## Lancement

```bash
cd frontend_complete/mobile
npm install
npm run start
```

Puis scanne le QR code avec Expo Go.

## URL API

L'application essaie automatiquement de deduire l'IP locale de la machine Expo pour appeler l'API sur le port `4000`.

Si besoin, tu peux forcer l'URL avec :

```bash
set EXPO_PUBLIC_API_BASE_URL=http://192.168.1.50:4000
npm run start
```

## Fonctions incluses

- accueil mobile natif
- authentification
- liste et detail des evenements
- reservation
- profil
- administration si l'utilisateur est admin
