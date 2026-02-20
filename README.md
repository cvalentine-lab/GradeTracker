# Grade Tracker

A full-stack web app for students to track classes, assignment weights, grades, and calculate:
- Current weighted grade per class
- Minimum score needed on upcoming assignments to reach a target grade
- Priority ranking of assignments based on weight, points remaining, and due date proximity

## Tech Stack

- **Frontend:** React + Vite + TypeScript + TailwindCSS
- **Backend:** Node.js + Express + TypeScript
- **Database:** SQLite
- **ORM:** Prisma
- **Auth:** Email/password with JWT

## Project Structure

```
grade_tracker/
├── backend/
│   ├── prisma/
│   │   └── schema.prisma    # Database schema
│   ├── src/
│   │   ├── index.ts         # Entry point
│   │   ├── app.ts           # Express app
│   │   ├── lib/             # Prisma client, etc.
│   │   ├── middleware/      # Auth, error handler
│   │   ├── routes/          # Auth, classes, assignments, grades
│   │   └── services/        # Grade calculations
│   ├── .env.example
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── api.ts           # API client
│   │   ├── contexts/        # Auth context
│   │   ├── components/      # Layout, etc.
│   │   └── pages/           # Login, Dashboard, ClassDetail
│   └── package.json
├── package.json             # Root scripts (concurrent dev)
└── README.md
```

## Database Schema

See `backend/prisma/schema.prisma` for the full schema. Summary:

| Table       | Fields                                                                 |
|-------------|------------------------------------------------------------------------|
| **User**    | id, email, passwordHash, createdAt, updatedAt                           |
| **Class**   | id, userId, name, createdAt, updatedAt                                  |
| **Assignment** | id, classId, name, weightPercent, gradeReceived (nullable), dueDate, createdAt, updatedAt |

### ER Diagram (conceptual)

```
User 1──* Class
Class 1──* Assignment
```

## Setup

### Prerequisites

- Node.js 18+

### 1. Clone and install

```bash
cd grade_tracker
npm run install:all
```

### 2. Database

Copy `.env.example` to `.env` in `backend/` and set:

```env
DATABASE_URL="file:./dev.db"
JWT_SECRET="your-secret-key"
PORT=3001
```

Create the database and generate Prisma client:

```bash
cd backend
npx prisma db push
npx prisma generate
```

### 3. Run the app

From the project root:

```bash
npm run dev
```

- Frontend: http://localhost:5173  
- Backend API: http://localhost:3001

### 4. Build for production

```bash
npm run build
npm run start
```

(Use `npm run start:win` on Windows.)

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/auth/register | Register user |
| POST | /api/auth/login | Login |
| GET | /api/classes | List classes (auth) |
| POST | /api/classes | Create class (auth) |
| PATCH | /api/classes/:id | Update class (auth) |
| DELETE | /api/classes/:id | Delete class (auth) |
| GET | /api/assignments/class/:classId | List assignments (auth) |
| POST | /api/assignments | Create assignment (auth) |
| PATCH | /api/assignments/:id | Update assignment (auth) |
| DELETE | /api/assignments/:id | Delete assignment (auth) |
| GET | /api/grades/class/:classId/current | Current weighted grade (auth) |
| GET | /api/grades/class/:classId/min-needed?target=90 | Min grade needed (auth) |
| GET | /api/grades/class/:classId/priority | Priority ranking (auth) |

## Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for instructions to deploy on **Render** (backend + DB) and **Vercel** (frontend).

## License

MIT
