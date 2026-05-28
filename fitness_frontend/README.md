# Fitness Frontend

React app: sign in with username/password, log workouts, view AI recommendations.

## One-time Keycloak setup (fixes “Client not found”)

Open **http://localhost:8181** → Admin → realm **`fitness-app`**

### 1. Create client

**Clients → Create client**

| Setting | Value |
|---------|--------|
| Client ID | `fitness-frontend` (must match `.env` `VITE_KEYCLOAK_CLIENT_ID`) |
| Client authentication | **Off** (public) |

### 2. Capability config

| Setting | Value |
|---------|--------|
| Standard flow | Off (optional) |
| **Direct access grants** | **On** ← required for username/password login |

### 3. Login settings

**Valid redirect URIs** (optional for this login style, but good to have):

```
http://localhost:5173/*
http://192.168.1.8:5173/*
```

**Web origins** (required for browser token requests):

```
http://localhost:5173
http://127.0.0.1:5173
http://192.168.1.8:5173
```

Click **Save**.

### 4. Create a user

**Users → Create user** → set **Username** → **Credentials** → set password → turn off **Temporary**.

Use that username (or email) and password on the sign-in page.

---

## Run frontend

```bash
cd fitness_frontend
cp .env.example .env
npm install
npm run dev
```

Open **http://localhost:5173** (or the Network URL Vite prints).

## Environment (`.env`)

```bash
VITE_API_BASE_URL=http://localhost:8080
VITE_KEYCLOAK_URL=http://localhost:8181
VITE_KEYCLOAK_REALM=fitness-app
VITE_KEYCLOAK_CLIENT_ID=fitness-frontend
```

## Backend (must be running)

| Service | Port |
|---------|------|
| Keycloak | 8181 |
| Gateway | 8080 |
| User, Activity, AI services | 8081–8083 |
| Eureka, Config, Postgres, Mongo, Kafka | as before |

AI service needs `GEMINI_KEY` for recommendations.

## How sign-in works

1. You enter username + password on the app page (no redirect to Keycloak UI).
2. App calls Keycloak **token** endpoint (`grant_type=password`).
3. JWT is stored and sent to the gateway on every API call.
4. Gateway syncs your user to user-service automatically.

## Troubleshooting

| Error | Fix |
|-------|-----|
| **Client not found** | Create client `fitness-frontend` in realm `fitness-app` |
| **Invalid grant** / password | Enable **Direct access grants** on the client; check user password in Keycloak |
| **401** on API | Gateway running; token valid; realm matches |
| CORS on login | Add your frontend URL under client **Web origins** |
| No AI tips | `GEMINI_KEY`, Kafka running; wait after adding activity |
