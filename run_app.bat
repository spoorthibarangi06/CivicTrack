@echo off
title CivicTrack Karnataka Launcher
echo ==========================================================
echo        CivicTrack Karnataka - Launching Services
echo ==========================================================

echo [1/3] Starting FastAPI Backend on http://127.0.0.1:8000 ...
start "CivicTrack Backend (FastAPI)" cmd /k "backend\.venv\Scripts\python.exe -m uvicorn backend.app.main:app --host 127.0.0.1 --port 8000 --reload"

echo [2/3] Starting Vite React Frontend on http://127.0.0.1:3000 ...
start "CivicTrack Frontend (React)" cmd /k "cd frontend && npm run dev"

echo [3/3] Waiting 4 seconds for services to initialize...
timeout /t 4 /nobreak >nul

echo Opening web browser...
start http://localhost:3000

echo ==========================================================
echo CivicTrack is running!
echo Frontend: http://localhost:3000
echo Backend:  http://localhost:8000
echo API Docs: http://localhost:8000/docs
echo ==========================================================
