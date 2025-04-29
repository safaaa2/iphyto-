@echo off
echo Nettoyage du projet...
rmdir /s /q node_modules
del /f /q package-lock.json
npm cache clean --force
npm install
echo Nettoyage terminé ! 