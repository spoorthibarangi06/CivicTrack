@echo off
echo Starting CivicTrack Karnataka FastAPI Backend on port 8000...
cd /d "%~dp0backend"
call .venv\Scripts\activate.bat
uvicorn backend.app.main:app --host 127.0.0.1 --port 8000 --reload
pause
