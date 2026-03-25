@echo off
setlocal EnableDelayedExpansion
echo ============================================
echo      LANCEMENT MOBILE EXPO
echo ============================================

for /f "usebackq delims=" %%i in (`powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0detect_mobile_ip.ps1"`) do set MOBILE_IP=%%i

if defined MOBILE_IP (
  set EXPO_PUBLIC_API_BASE_URL=http://!MOBILE_IP!:4000
  echo API mobile configuree sur !EXPO_PUBLIC_API_BASE_URL!
) else (
  echo IP locale non detectee automatiquement. Expo utilisera sa detection par defaut.
)

cd /d %~dp0frontend_complete\mobile
call npm run start
