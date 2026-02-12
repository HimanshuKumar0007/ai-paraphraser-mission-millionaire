@echo off
FOR /F "tokens=5" %%a IN ('netstat -aon ^| findstr :8080') DO taskkill /F /PID %%a
npm run dev
