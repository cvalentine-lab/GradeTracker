# Start Here – Super Simple Guide

You already have a **backend** (the server that stores your data) and a **frontend** (the website you see in the browser). This guide assumes you’ve never done this before.

---

## Part 1: What You Need Installed

### Node.js

Node.js lets you run JavaScript on your computer. Your project needs it.

**Check if you have it:**
1. Open a terminal (see Part 2).
2. Type: `node --version` and press Enter.
3. If you see something like `v18.17.0` or `v24.x.x`, you’re good.
4. If you see "not found" or an error, install Node.js from [https://nodejs.org](https://nodejs.org). Download the "LTS" version and run the installer.

---

## Part 2: What Is a Terminal and Where Do I Open It?

A **terminal** (or Command Prompt on Windows) is a window where you type text commands instead of clicking things.

**On Windows:**
- Press `Windows key`, type `PowerShell` or `Terminal`, and open it.
- Or: right‑click the folder where this project lives → “Open in Terminal” (if that option exists).

**On Mac:**
- Press `Cmd + Space`, type `Terminal`, and open it.
- Or: in Finder, go to Applications → Utilities → Terminal.

You’ll see a prompt like `C:\Users\...` or `~$`. That’s where you type commands.

---

## Part 3: What’s In This Project?

```
grade_tracker/
├── backend/          ← The server (stores your classes, assignments, planner data)
├── frontend/         ← The website (what you see in the browser)
├── package.json      ← Instructions for running everything
├── START_HERE.md     ← This file
└── README.md
```

**Backend** = Server that:
- Stores your classes, assignments, and grades
- Runs the AI planner (optional, needs OpenAI key)
- Saves planner items in a database

**Frontend** = Web app that:
- Shows the dashboard, classes, assignments, grades
- Sends requests to the backend

Both need to be running at the same time.

---

## Part 4: How to Run the App (First Time)

### Step 1: Open the project folder in the terminal

1. Open PowerShell/Terminal.
2. Navigate to the project. Type this (replace the path if yours is different):

   ```powershell
   cd C:\Users\evanv\OneDrive\Desktop\grade_tracker
   ```

   Or: right‑click the `grade_tracker` folder → “Open in Terminal” and it will already be in the right place.

### Step 2: Install stuff

These commands download all the code the project needs.

**First, from the project root:**
```powershell
npm install
```

**Then install backend and frontend packages:**
```powershell
npm run install:all
```

### Step 3: Start everything

```powershell
npm run dev
```

You should see something like:
- Backend: `Grade Tracker running on port 3001`
- Frontend: `Local: http://localhost:5173`

### Step 4: Open the app in your browser

1. Open Chrome (or any browser).
2. Go to: **http://localhost:5173**
3. You should see the Grade Tracker landing page.

---

## Part 5: Optional – AI Planner (Your School’s System)

Right now the app uses **demo data** (fake courses and assignments). To use your real Populi data:

### Step 1: Get API credentials from your school

1. Contact your school’s IT department or registrar.
2. Ask them for:
   - Populi **API URL** (something like `https://yourschool.populiweb.com/api2`)
   - A Populi **API key** (a long token/secret).

### Step 2: Create a `.env` file

1. Open the `backend` folder in File Explorer.
2. Find a file named `.env.example`.
3. Copy it and rename the copy to `.env` (no `.example`).
4. Open `.env` in Notepad or any text editor.

### Step 3: Fill in the values

Your `.env` file should look like this (replace with your real values):

```
OPENAI_API_KEY=sk-your-openai-key-here

PORT=3001
```

- `OPENAI_API_KEY` = from [platform.openai.com](https://platform.openai.com) if you want the AI planner. Sign up, add a payment method, then create an API key.

**Important:** Never put your `.env` file on GitHub or share it. It contains secrets.

### Step 4: Restart the backend

1. In the terminal where the app is running, press `Ctrl+C` to stop it.
2. Run `npm run dev` again.


---

## Part 6: Quick Reference – Commands You’ll Use

| What you want to do   | Command                |
|-----------------------|------------------------|
| Go to project folder  | `cd C:\Users\evanv\OneDrive\Desktop\grade_tracker` |
| Install dependencies  | `npm run install:all`  |
| Start the app         | `npm run dev`          |
| Stop the app          | `Ctrl+C` in the terminal |

---

## Part 7: If Something Goes Wrong

### “npm is not recognized”
- Node.js isn’t installed or isn’t in your PATH. Reinstall Node.js from [nodejs.org](https://nodejs.org) and restart the terminal.

### “Cannot connect to the backend”
- Make sure you ran `npm run dev` (not just `npm run dev` in the frontend folder). The root `npm run dev` starts both backend and frontend.

### “Port 3001 already in use”
- Another app is using that port. Close other Node apps or change `PORT=3002` (or another number) in `backend/.env`.

### “Add OPENAI_API_KEY to backend/.env”
- You’re trying to use the AI planner but haven’t set an OpenAI key. Add it to `backend/.env` and restart.

---

## Part 8: Where Things Live

| Thing            | Where it lives                                      |
|------------------|-----------------------------------------------------|
| Server / backend | `backend/server.js`                                 |
| Database file    | `backend/grade_tracker.db` (created when you run it)|
| AI logic         | `backend/services/ai.js`                            |
| Secrets (API keys)| `backend/.env` (you create this from .env.example) |
| Web pages        | `frontend/src/pages/`                               |

If you’re stuck, say exactly what you did, what you saw, and any error message. Then someone can help you step by step.
