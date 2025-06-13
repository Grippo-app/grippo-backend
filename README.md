## 🗂 Project Structure

### 1. `Dockerfile` — production image builder 📦

Builds a clean, production-ready Docker image for the NestJS backend:

- Installs dependencies via `npm ci`
- Builds the app using `npm run build`
- Copies `dist/` and `node_modules` into a minimal runtime image
- Exposes port `3000`
- Launches the app using `node dist/main`

---

### 2. `docker-compose.yml` — service orchestration 🧩

Defines and runs multi-container Docker applications:

#### 🛢 `db` (PostgreSQL)

- Uses the official `postgres:15.5` image
- Reads credentials and config from `.env`
- Persists data in a `pgdata` Docker volume
- Waits for readiness via `pg_isready` healthcheck

#### 🧠 `backend` (NestJS)

- Built from the local `Dockerfile`
- Waits for the `db` service to become healthy
- Maps internal port `3000` to `${PORT}` (e.g. `3010`)
- Automatically restarts on failure (`restart: unless-stopped`)

---

### 3. `init.sh` — cold start script 🚀

Automates first-time setup and local initialization:

- Loads environment variables from `.env`
- Starts services via `docker compose up --build`
- Waits 10 seconds for PostgreSQL to initialize
- If `dump.sql` exists:
    - Drops and recreates the `public` schema
    - Imports the SQL dump into the database
- Waits for the backend to become reachable on `${PORT}`
- Confirms successful startup via terminal output
