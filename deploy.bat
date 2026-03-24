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
