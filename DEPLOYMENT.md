# Deployment Guide

Deploy the Grade Tracker backend on **Render** and the frontend on **Vercel**. Uses SQLite for the database (no separate DB service needed).

## 1. Render (Backend)

### Create Web Service

1. Sign in to [render.com](https://render.com)
2. **New → Web Service**
3. Connect your GitHub repo
4. Root directory: `backend`
5. Build command: `npm install && npx prisma generate && npm run build`
6. Start command: `npm start` (or `npx node dist/index.js`)
7. Add environment variables:
   - `DATABASE_URL` — `file:./data/dev.db` (SQLite file in project dir)
   - `JWT_SECRET` — Generate a long random string (e.g. `openssl rand -base64 32`)
   - `NODE_ENV=production`

Backend URL will be like: `https://grade-tracker-api.onrender.com`

### SQLite on Render

Render's free tier uses **ephemeral disk** — the SQLite file is lost when the service restarts or redeploys. For production with persistent data:

- Use **Render persistent disk** (paid) and mount it, e.g. `file:/data/dev.db`
- Or use **Railway**, **Fly.io**, or **Render paid** which support persistent storage

For development/demos, ephemeral SQLite is fine; data resets on deploy.

---

## 2. Vercel (Frontend)

### Create project

1. Sign in to [vercel.com](https://vercel.com)
2. **Import Project** → select your GitHub repo
3. Root directory: `frontend`
4. Framework preset: **Vite**
5. Build command: `npm run build`
6. Output directory: `dist`
7. Add environment variable:
   - `VITE_API_URL` — your Render backend URL (e.g. `https://grade-tracker-api.onrender.com`)

The frontend is already configured to use `VITE_API_URL` in production.

---

## 3. CORS

In `backend/src/app.ts`, CORS allows all origins by default. For production, you can restrict:

```ts
app.use(cors({ 
  origin: process.env.FRONTEND_URL ?? true,
  credentials: true 
}));
```

Add `FRONTEND_URL=https://your-app.vercel.app` to Render env vars if needed.

---

## 4. Summary

| Service | Platform | URL |
|---------|----------|-----|
| Database | SQLite (file, bundled with backend) | N/A |
| Backend | Render Web Service | `https://your-api.onrender.com` |
| Frontend | Vercel | `https://your-app.vercel.app` |

---

## Render free tier notes

- Web Service free tier sleeps after 15 min inactivity
- First request after sleep may be slow
- SQLite file is ephemeral — data resets on redeploy/restart
