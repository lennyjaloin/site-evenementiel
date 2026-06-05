@echo off
echo ============================================
echo      LANCEMENT WEB + BACKEND
echo ============================================

REM ---- BACKEND ----
echo Demarrage du BACKEND...
start cmd /k "cd /d %~dp0backend_complete && npm run dev"

timeout /t 2 >nul

REM ---- FRONTEND WEB ----
echo Demarrage du FRONTEND WEB...
start cmd /k "cd /d %~dp0frontend_complete\web && npm run dev"

timeout /t 4 >nul

REM ---- OUVERTURE DU NAVIGATEUR ----
echo Ouverture du site...
start "" http://localhost:5173/

echo Tout est lance.
exit
