# Task Management System

A full-stack task management application for organizing tasks, tracking progress, and collaborating with team members.

## Live Demo

- **Frontend:** https://task-management-system-lime-eight.vercel.app/
- **Backend Health Check:** https://task-management-system-dwq8.onrender.com/api/health

## Features

- User registration and login with JWT authentication
- Role-based access control for Admin and User roles
- Create, view, edit, and delete tasks
- Assign tasks to registered team members
- Task priorities: Low, Medium, High
- Task statuses: To Do, In Progress, Completed
- Due dates and task descriptions
- Search tasks by title
- Filter by status and priority
- Sort tasks by due date
- Dashboard statistics and visualizations
- Kanban board and team view
- Responsive user interface

## Tech Stack

**Frontend:** React, Vite, Tailwind CSS, Axios, Recharts

**Backend:** Node.js, Express.js, PostgreSQL, JWT, bcrypt, Zod

**Database:** PostgreSQL hosted on Neon

**Deployment:** Vercel (frontend), Render (backend)

## Project Structure

```text
task-management-system/
├── client/
│   ├── src/
│   │   ├── pages/
│   │   ├── services/
│   │   ├── App.jsx
│   │   └── main.jsx
│   └── package.json
└── server/
    ├── src/
    │   ├── controllers/
    │   ├── middleware/
    │   ├── routes/
    │   ├── db.js
    │   ├── initDb.js
    │   └── server.js
    └── package.json
```

## Run Locally

### Prerequisites

- Node.js and npm
- PostgreSQL, or a PostgreSQL connection string

### Backend

```bash
cd server
npm install
```

Create a `server/.env` file with:

```env
PORT=5000
CLIENT_URL=http://localhost:5173
DATABASE_URL=your_postgresql_connection_string
JWT_SECRET=your_long_random_secret
```

Initialize the database tables:

```bash
node src/initDb.js
```

Start the backend:

```bash
npm run dev
```

### Frontend

Open a second terminal:

```bash
cd client
npm install
npm run dev
```

Configure `client/src/services/api.js` to point to your local backend when developing locally.

## API Endpoints

| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/api/auth/register` | Register a user |
| POST | `/api/auth/login` | Log in |
| GET | `/api/auth/me` | Get the authenticated user |
| GET | `/api/tasks` | List accessible tasks |
| POST | `/api/tasks` | Create a task |
| GET | `/api/tasks/:id` | Get a task |
| PUT | `/api/tasks/:id` | Update a task |
| DELETE | `/api/tasks/:id` | Delete a task |
| GET | `/api/tasks/stats` | Dashboard statistics |
| GET | `/api/tasks/users` | List team members |

## Security Notes

- Keep `.env` files and credentials out of Git.
- Use strong JWT secrets.
- Passwords are stored as hashes rather than plaintext.
- Protected endpoints require authentication.

## Future Improvements

- Automated backend and frontend tests
- Task comments and activity history
- Email notifications and reminders
- Drag-and-drop Kanban functionality
- Docker-based development and deployment

## Author

Chhavi Dwivedi
