# ITPM_PROJECT

# PeerPal — Student Support System

A full-stack web application designed to help university students manage assignments, study sessions, help desk requests, modules, and academic calendar events.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, Vite, React Router, Axios, Lucide React |
| Backend | Node.js, Express 5, MongoDB (Mongoose) |
| Auth | JWT, bcryptjs |
| Email | Nodemailer (Gmail SMTP) |
| Security | Helmet, express-rate-limit, CORS |

---

## Features

- **Authentication** — Register, login, JWT-protected routes
- **Dashboard** — Personalised student overview
- **Assignments** — Create, track, and monitor assignment progress with due-soon email reminders
- **Modules** — Manage enrolled modules
- **Study Sessions** — Propose, vote on, and join peer study sessions
- **Help Desk** — Submit and track help requests; batch top requests surfaced to admins
- **Calendar** — Personal and campus events with Sri Lanka public holidays
- **Admin Panel** — User and content management
- **System Guide Chatbot** — In-app help assistant
- **Seasonal UI Overlay** — Dynamic seasonal theming

---

## Project Structure

```
Copy_Peer_Pal/
├── backend/
│   ├── src/
│   │   ├── config/        # Database connection
│   │   ├── controllers/   # Route handlers
│   │   ├── middleware/     # Auth middleware
│   │   ├── models/        # Mongoose schemas
│   │   ├── routes/        # Express routers
│   │   └── utils/         # Mailer, scheduler, validation
│   └── server.js
└── frontend/
    ├── public/
    └── src/
        ├── components/    # Shared UI components
        ├── pages/         # Page-level components
        ├── services/      # Axios API client
        └── utils/         # Auth helpers
```

---

## Getting Started

### Prerequisites

- Node.js >= 18
- MongoDB Atlas account (or local MongoDB)
- Gmail account with an App Password for SMTP

### 1. Clone the repository

```bash
git clone <repo-url>
cd Copy_Peer_Pal
```

### 2. Backend setup

```bash
cd backend
npm install
```

Create a `.env` file in `backend/`:

```env
PORT=5000
MONGO_URI=<your_mongodb_connection_string>
JWT_SECRET=<your_jwt_secret>
CLIENT_ORIGIN=http://localhost:5173

SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=<your_gmail_address>
SMTP_PASS=<your_gmail_app_password>
SMTP_FROM=PeerPal <your_gmail_address>
```

Start the backend:

```bash
npm run dev      # development (nodemon)
npm start        # production
```

Backend runs on `http://localhost:5000`.

### 3. Frontend setup

```bash
cd frontend
npm install
npm run dev
```

Frontend runs on `http://localhost:5173`.

---

## API Routes

| Prefix | Description |
|--------|-------------|
| `/api/auth` | Register, login |
| `/api/admin` | Admin operations |
| `/api/assignments` | Assignment CRUD & progress |
| `/api/modules` | Module management |
| `/api/helpdesk` | Help requests |
| `/api/study-support` | Study sessions & voting |
| `/api/calendar-events` | Calendar events |

---

## Environment Variables Reference

| Variable | Description |
|----------|-------------|
| `PORT` | Backend server port (default: 5000) |
| `MONGO_URI` | MongoDB connection string |
| `JWT_SECRET` | Secret key for signing JWTs |
| `CLIENT_ORIGIN` | Allowed CORS origin (frontend URL) |
| `SMTP_HOST` | SMTP server host |
| `SMTP_PORT` | SMTP server port |
| `SMTP_SECURE` | Use TLS (`true`/`false`) |
| `SMTP_USER` | SMTP login email |
| `SMTP_PASS` | SMTP password / app password |
| `SMTP_FROM` | Sender display name and email |

---

## License

ISC
