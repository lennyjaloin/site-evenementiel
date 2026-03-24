@echo off
echo ============================================
echo      🚀 LANCEMENT DU PROJET EVENT BTS 🚀
echo ============================================

REM ---- BACKEND ----
echo 🔧 Démarrage du BACKEND...
start cmd /k "cd /d C:\Projet Web\Projet Web\backend_complete && npm run dev"

timeout /t 2 >nul

REM ---- FRONTEND ----
echo 🎨 Démarrage du FRONTEND...
start cmd /k "cd /d C:\Projet Web\Projet Web\frontend_complete && npm run dev"

timeout /t 4 >nul

REM ---- OUVERTURE DU NAVIGATEUR ----
echo 🌐 Ouverture du site...
start "" http://localhost:5173/

echo 🎉 Tout est lancé ! Bon dev Papichulo 💙🔥
exit
