# Deployment Guide — Railway (Single Service)

Deploy the full app (frontend + backend) as **one service** on [Railway](https://railway.app). The backend serves the frontend and API from a single Node process.

## 1. Deploy to Railway

1. Sign in at [railway.app](https://railway.app)
2. **New Project** → **Deploy from GitHub repo**
3. Select your repository
4. Root directory: project root (leave default)
5. Railway uses `railway.toml` for build/start — no extra config needed

### Environment variables

In Railway → your service → **Variables**, add:

| Variable        | Value                                                         |
|-----------------|---------------------------------------------------------------|
| `NODE_ENV`      | `production`                                                  |
| `JWT_SECRET`    | Long random string (e.g. `openssl rand -base64 32`)           |
| `PORT`          | Railway sets this automatically                               |

Optional (for AI planner):

- `OPENAI_API_KEY` — OpenAI API key for AI planner

### SQLite and persistence

Railway’s default filesystem is **ephemeral** — data resets on redeploy.

For persistent data:

1. In Railway → your service → **Volumes**
2. Add a volume and mount path: `/data`
3. Add env var: `DB_PATH=/data/grade_tracker.db`
4. Update `backend/db.js` to use `process.env.DB_PATH` when set

## 2. Build and start commands

`railway.toml` configures:

- **Build:** `npm run build` — installs deps and builds the frontend into `frontend/dist`
- **Start:** `NODE_ENV=production npm start` — runs `node backend/server.js`

The backend serves:

- `/api/*` — API routes
- `/*` — static frontend (in production)

## 3. Local development

```bash
npm run install:all
npm run dev
```

This runs backend (port 3001) and frontend (port 5173) for local development.
