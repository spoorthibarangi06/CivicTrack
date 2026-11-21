# CivicTrack Karnataka – Production Deployment & Setup Guide

This document describes how to deploy **CivicTrack Karnataka** to production using PostgreSQL, Docker, and Nginx / Cloud hosting.

---

## 1. Database Configuration (PostgreSQL)

CivicTrack Karnataka supports PostgreSQL for production deployments.

### PostgreSQL Setup
1. Create a database and user:
```sql
CREATE DATABASE civictrack_karnataka;
CREATE USER civictrack_admin WITH ENCRYPTED PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE civictrack_karnataka TO civictrack_admin;
```

2. Configure `DATABASE_URL` in `.env`:
```env
DATABASE_URL=postgresql://civictrack_admin:your_secure_password@localhost:5432/civictrack_karnataka
```

SQLAlchemy automatically generates all required tables (`projects`, `financial_records`, `progress_updates`, `project_documents`, `data_sources`, `predictions`, `import_logs`, `audit_logs`, `users`) upon server boot, along with foreign keys, indexes, and numeric precision constraints.

---

## 2. Docker & Containerized Deployment

A multi-container setup using `docker-compose.yml`:

```yaml
version: '3.8'

services:
  db:
    image: postgres:16-alpine
    container_name: civictrack_postgres
    restart: always
    environment:
      POSTGRES_DB: civictrack_karnataka
      POSTGRES_USER: civictrack_admin
      POSTGRES_PASSWORD: your_secure_password
    volumes:
      - pgdata:/var/lib/postgresql/data
    ports:
      - "5432:5432"

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    container_name: civictrack_backend
    restart: always
    environment:
      DATABASE_URL: postgresql://civictrack_admin:your_secure_password@db:5432/civictrack_karnataka
      SECRET_KEY: ${SECRET_KEY}
    ports:
      - "8000:8000"
    depends_on:
      - db

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    container_name: civictrack_frontend
    restart: always
    ports:
      - "80:80"
    depends_on:
      - backend

volumes:
  pgdata:
```

---

## 3. Production Environment Checklist

- [x] Configure production `SECRET_KEY` using high-entropy random bytes (`openssl rand -hex 32`).
- [x] Ensure HTTPS (TLS 1.3) certificates are installed via Let's Encrypt / Certbot.
- [x] Set `DEBUG=False` in production `.env`.
- [x] Restrict `BACKEND_CORS_ORIGINS` to the exact production domain (e.g., `["https://civictrack.karnataka.gov.in"]`).
- [x] Schedule regular database snapshots using `pg_dump`.
