# DevVault

A full-stack MERN application for developers to save, organize, search, and copy code snippets and AI prompts. Built as a personal productivity tool with secure authentication, per-user data isolation, and a clean dark-themed dashboard.

---

## Features

- **User authentication** — register and login with JWT-based sessions
- **Snippet management** — create, read, update, and delete code snippets
- **Language tagging** — assign a programming language and custom tags to each snippet
- **Client-side search** — filter snippets by title, content, language, or tag in real time
- **Copy to clipboard** — one-click copy of any snippet's content
- **Protected routes** — unauthenticated users are redirected to login; every API route verifies the JWT
- **Ownership isolation** — users can only access their own snippets; ownership is enforced in every database query
- **Responsive UI** — dark-themed dashboard built with React, Vite, and CSS Modules

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, Vite 8, React Router 7, Axios, Lucide React |
| Backend | Node.js, Express 5 |
| Database | MongoDB Atlas via Mongoose 9 |
| Auth | bcryptjs (password hashing), JSON Web Tokens |
| Dev tooling | nodemon, oxlint |

---

## Project Structure

```
DevVault/
├── client/                      # React + Vite frontend
│   ├── src/
│   │   ├── api/
│   │   │   └── axios.js         # Axios instance with JWT interceptor
│   │   ├── context/
│   │   │   └── AuthContext.jsx  # Global auth state (login, register, logout)
│   │   ├── components/
│   │   │   ├── Navbar.jsx       # Top navigation with sign-out
│   │   │   ├── ProtectedRoute.jsx
│   │   │   ├── SnippetCard.jsx  # Card with copy, edit, delete actions
│   │   │   └── SnippetForm.jsx  # Modal form for create and edit
│   │   ├── pages/
│   │   │   ├── Login.jsx
│   │   │   ├── Register.jsx
│   │   │   └── Dashboard.jsx    # Main view: snippets list, search, filters
│   │   ├── App.jsx              # Router and AuthProvider setup
│   │   └── index.css
│   ├── vite.config.js           # Dev server proxy for /api
│   └── package.json
│
└── server/                      # Express backend
    ├── config/
    │   └── db.js                # MongoDB connection
    ├── middleware/
    │   └── auth.js              # JWT protect middleware
    ├── models/
    │   ├── User.js              # Mongoose user schema
    │   └── Snippet.js           # Mongoose snippet schema with text index
    ├── routes/
    │   ├── auth.js              # POST /api/auth/register, /login
    │   └── snippets.js          # CRUD routes for snippets
    ├── server.js                # Express app entry point
    ├── .env.example             # Environment variable template
    └── package.json
```

---

## Prerequisites

- [Node.js](https://nodejs.org/) v18 or later
- [npm](https://www.npmjs.com/) v9 or later
- A [MongoDB Atlas](https://www.mongodb.com/atlas) cluster (free tier is sufficient) or a local MongoDB instance

---

## Installation

### 1. Clone the repository

```bash
git clone https://github.com/subhu339/DevVault.git
cd DevVault
```

### 2. Install backend dependencies

```bash
cd server
npm install
```

### 3. Configure environment variables

```bash
cp .env.example .env
```

Open `server/.env` and fill in your values (see [Environment Variables](#environment-variables) below).

### 4. Install frontend dependencies

```bash
cd ../client
npm install
```

---

## Environment Variables

Create `server/.env` based on `server/.env.example`. **Never commit real credentials.**

```env
NODE_ENV=development

# Port the Express server listens on
PORT=5000

# MongoDB connection string
# Atlas:  mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/devvault
# Local:  mongodb://127.0.0.1:27017/devvault
MONGO_URI=your_mongodb_connection_string_here

# Secret key for signing JWTs — use a long random string in production
JWT_SECRET=your_jwt_secret_here

# Token expiry (e.g. 7d, 24h)
JWT_EXPIRES_IN=7d
```

---

## Running the Application

Open two terminal windows from the project root.

**Terminal 1 — Backend:**
```bash
cd server
npm run dev
```
Expected output:
```
MongoDB connected: <your-cluster-host>
Server running in development mode on port 5000
```

**Terminal 2 — Frontend:**
```bash
cd client
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## API Endpoints

All endpoints return JSON. Protected routes require an `Authorization: Bearer <token>` header.

### Authentication

| Method | Path | Access | Description |
|--------|------|--------|-------------|
| `POST` | `/api/auth/register` | Public | Create a new account. Body: `{ username, email, password }` |
| `POST` | `/api/auth/login` | Public | Sign in. Body: `{ email, password }`. Returns JWT. |
| `GET` | `/api/health` | Public | Server health check |

**Register / Login response shape:**
```json
{
  "token": "<jwt>",
  "user": { "id": "...", "username": "...", "email": "...", "createdAt": "..." }
}
```

### Snippets

| Method | Path | Access | Description |
|--------|------|--------|-------------|
| `GET` | `/api/snippets` | Protected | Get all snippets belonging to the logged-in user |
| `POST` | `/api/snippets` | Protected | Create a snippet. Body: `{ title, content, language?, tags?, description? }` |
| `GET` | `/api/snippets/:id` | Protected | Get one snippet (owner only) |
| `PUT` | `/api/snippets/:id` | Protected | Partially update a snippet (owner only) |
| `DELETE` | `/api/snippets/:id` | Protected | Delete a snippet (owner only) |

**Snippet fields:**

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `title` | String | Yes | Max 100 characters |
| `content` | String | Yes | The code or prompt body |
| `language` | String | No | Lowercase (e.g. `javascript`). Default: `plaintext` |
| `tags` | String[] | No | Array of lowercase strings |
| `description` | String | No | Max 500 characters |

---

## Security Features

- **Password hashing** — passwords are hashed with bcrypt (12 salt rounds) before storage; plaintext is never stored or returned
- **JWT authentication** — tokens are signed with a secret key and expire after a configurable duration
- **Ownership enforcement** — every read, update, and delete query includes `{ owner: req.user._id }`, so one user cannot access another's data even with a valid token
- **Password excluded by default** — the Mongoose `password` field carries `select: false`, preventing accidental exposure in any future query
- **Request body size limit** — `express.json({ limit: '50kb' })` prevents memory exhaustion from oversized payloads
- **No stack traces in production** — the global error handler omits `stack` when `NODE_ENV !== 'development'`
- **CORS restricted** — the backend only accepts requests from the configured frontend origin

---

## AI-Assisted Development

This project was built with assistance from an AI coding agent (Kiro). Below are honest examples of how it contributed:

1. **Diagnosing a non-obvious MongoDB error** — when `POST /api/snippets` returned `MongoServerError: language override unsupported: javascript`, the AI identified that MongoDB's text index reserves the field name `language` as a per-document language override. The fix (`language_override: 'textLanguage'` on the index definition) is not well-documented; the AI found the root cause and applied the minimal fix without rewriting unrelated code.

2. **Catching a middleware logic bug** — the original `protect` middleware had a structural flaw where the `if (!token)` check ran as a parallel branch rather than an `else`, which could cause a double-response in certain error paths. The AI identified this during a security review and restructured the control flow with explicit `return` on every path.

3. **Scaffolding boilerplate structure** — the AI generated the initial Express folder structure (routes, models, middleware, config) with consistent naming and comments, which saved significant setup time and left a clean base to build on.

4. **Fixing a `.env` configuration error** — when MongoDB authentication kept failing despite a valid password being set, the AI read the `.env` file directly, identified that `<db_username>` was still an unreplaced placeholder, and corrected it — rather than suggesting generic troubleshooting steps.

5. **Security hardening without new features** — during a dedicated review pass, the AI added `select: false` to the password field and a body size limit to `express.json`, and explained the rationale for each change clearly enough to be evaluated and accepted or rejected independently.

---


