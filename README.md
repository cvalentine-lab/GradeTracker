# Grade Tracker

A full-stack web app that connects to **Populi** (student information system) to track grades, access syllabi, and automatically build a homework planner.

## Features

- **Grades Dashboard** – View your course grades and GPA
- **Syllabi** – Browse syllabi for all your courses
- **Auto Planner** – Build a homework/assignment planner from Populi courses
- **Demo Mode** – Works with sample data without Populi credentials

## Quick Start

**Important:** You must run BOTH the backend and frontend. Visit **http://localhost:5173** (the frontend) in your browser—not the backend port.

### Option A: Run both at once (from project root)

```bash
cd grade_tracker
npm install
npm run install:all
npm run dev
```

Then open **http://localhost:5173** in your browser.

### Option B: Run in two separate terminals

**Terminal 1 – Backend:**
```bash
cd backend
npm install
npm run dev
```

**Terminal 2 – Frontend:**
```bash
cd frontend
npm install
npm run dev
```

Then open **http://localhost:5173** in your browser.

### 3. Connect Populi (Optional)

To use live data from your school's Populi:

1. Copy `backend/.env.example` to `backend/.env`
2. Add your Populi API URL (e.g. `https://yourschool.populiweb.com/api`)
3. Add your Populi access token (get from your school admin/IT)
4. Restart the backend

Without Populi credentials, the app runs in **demo mode** with sample grades, syllabi, and assignments.

## Tech Stack

- **Backend**: Node.js, Express, SQLite (better-sqlite3)
- **Frontend**: React, Vite, React Router
- **Populi API**: REST integration for academic data

## Project Structure

```
grade_tracker/
├── backend/
│   ├── server.js
│   ├── db.js
│   ├── routes/        # API routes
│   ├── services/      # Populi client, demo data
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/     # Dashboard, Grades, Syllabi, Planner
│   │   └── api.js
│   └── vite.config.js
└── README.md
```
