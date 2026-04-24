# ITPM_PROJECT

# 🎓 PeerPal — Student Support System

PeerPal is a full-stack web application designed to support university students in managing their academic and collaborative activities. It centralizes assignments, study sessions, help requests, modules, and calendar events into a single platform.

---

## 🚀 Tech Stack

| Layer       | Technology |
|------------|------------|
| **Frontend** | React 19, Vite, React Router, Axios, Lucide React |
| **Backend**  | Node.js, Express 5, MongoDB (Mongoose) |
| **Authentication** | JWT, bcryptjs |
| **Email Service** | Nodemailer (Gmail SMTP) |
| **Security** | Helmet, express-rate-limit, CORS |

---

## ✨ Features

- 🔐 **Authentication**
  - User registration & login
  - JWT-based protected routes

- 📊 **Dashboard**
  - Personalized student overview

- 📝 **Assignments**
  - Create and track assignments
  - Progress monitoring
  - Automated due-soon email reminders

- 📚 **Modules**
  - Manage enrolled modules

- 🤝 **Study Sessions**
  - Create and join study sessions
  - Voting system for session proposals

- 🆘 **Help Desk**
  - Submit and track support requests
  - Frequently requested issues highlighted for admins

- 📅 **Calendar**
  - Personal & academic events
  - Includes Sri Lankan public holidays

- 🛠️ **Admin Panel**
  - Manage users and system content

- 🤖 **System Guide Chatbot**
  - In-app assistance for users

- 🎨 **Seasonal UI Overlay**
  - Dynamic UI themes based on seasons/events

---

## 📁 Project Structure

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

## ⚙️ Getting Started

### Prerequisites

- Node.js (v18 or higher)
- MongoDB Atlas account or local MongoDB instance
- Gmail account with App Password (for email service)

---

### 1️⃣ Clone the Repository

```bash
git clone <repo-url>
cd Copy_Peer_Pal
```

### 2️⃣ Backend Setup

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

### 3️⃣ Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

Frontend runs on `http://localhost:5173`.

---

## 🔗 API Endpoints

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

## 🔐 Environment Variables Reference

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


