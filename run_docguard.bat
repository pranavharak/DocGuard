@echo off
echo ===================================================
echo   Starting DocuGuard AI (All Services)
echo ===================================================
echo.

echo [1/3] Starting Python AI Microservice on Port 8000...
start "DocuGuard Python AI Engine (Port 8000)" cmd /k "cd /d %~dp0python-ai && venv\Scripts\activate && uvicorn main:app --host 127.0.0.1 --port 8000"

echo [2/3] Starting Node.js Express Backend on Port 5000...
start "DocuGuard Express Backend (Port 5000)" cmd /k "cd /d %~dp0backend && node server.js"

echo [3/3] Starting React Frontend on Port 5173...
start "DocuGuard React UI (Port 5173)" cmd /k "cd /d %~dp0 && npm run dev"

echo.
echo All 3 DocuGuard AI services are launching in separate windows!
echo Open your browser at: http://localhost:5173
echo.
