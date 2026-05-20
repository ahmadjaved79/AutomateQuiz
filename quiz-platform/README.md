# 🧠 QuizMaster AI — Full-Stack Exam Platform

AI-powered quiz and examination platform built with MERN Stack featuring gamification, anti-cheat, and real-time analytics.

---

## 🚀 Features

- ✅ **AI Question Generation** via OpenRouter API (free models)
- ✅ **Anti-Cheat Engine** — tab switch detection, fullscreen enforcement, copy/paste blocking
- ✅ **Gamified Experience** — XP, levels, badges, confetti animations
- ✅ **Admin Dashboard** — analytics, rankings, batch management
- ✅ **Student Portal** — exam room, results, AI feedback
- ✅ **JWT Authentication** + bcrypt password hashing
- ✅ **Responsive Design** with glassmorphism UI
- ✅ **Framer Motion Animations** throughout

---

## 📁 Project Structure

```
quiz-platform/
├── backend/
│   ├── models/          # Mongoose schemas
│   ├── routes/          # Express API routes
│   ├── middleware/       # Auth middleware
│   ├── utils/           # AI generator utility
│   ├── server.js        # Entry point
│   └── .env.example
└── frontend/
    ├── src/
    │   ├── pages/
    │   │   ├── admin/   # Admin pages
    │   │   └── student/ # Student pages
    │   ├── components/  # Layout components
    │   ├── context/     # Auth context
    │   └── utils/       # API utility
    ├── index.html
    └── .env.example
```

---

## ⚙️ Setup Instructions

### Prerequisites
- Node.js v18+
- MongoDB Atlas account (free tier works)
- OpenRouter account (free API key)

---

### 1. Clone & Install

```bash
# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

---

### 2. Configure Environment Variables

**Backend** — copy `.env.example` to `.env`:
```bash
cd backend
cp .env.example .env
```

Edit `.env`:
```env
PORT=5000
MONGO_URI=mongodb+srv://USERNAME:PASSWORD@cluster0.mongodb.net/quizplatform
JWT_SECRET=your_very_long_random_secret_key_here
OPENROUTER_API_KEY=sk-or-v1-your_openrouter_key
ADMIN_EMAIL=admin@quizplatform.com
ADMIN_PASSWORD=Admin@123
FRONTEND_URL=http://localhost:5173
NODE_ENV=development
```

**Frontend** — copy `.env.example` to `.env`:
```bash
cd frontend
cp .env.example .env
```

Edit `.env`:
```env
VITE_API_URL=http://localhost:5000/api
```

---

### 3. Get OpenRouter API Key

1. Go to [openrouter.ai](https://openrouter.ai)
2. Sign up and get a free API key
3. Free models used: `meta-llama/llama-3.2-3b-instruct:free`
4. Add key to backend `.env`

---

### 4. Get MongoDB URI

1. Go to [MongoDB Atlas](https://cloud.mongodb.com)
2. Create a free cluster
3. Create a database user
4. Get connection string
5. Replace `USERNAME`, `PASSWORD` in `.env`

---

### 5. Run the Application

```bash
# Terminal 1 — Backend
cd backend
npm run dev

# Terminal 2 — Frontend
cd frontend
npm run dev
```

- Backend: http://localhost:5000
- Frontend: http://localhost:5173

---

## 🔑 Default Login

| Role    | Email                    | Password   |
|---------|--------------------------|------------|
| Admin   | admin@quizplatform.com   | Admin@123  |
| Student | Register via /register   | Your choice|

---

## 🛠️ API Endpoints

### Auth
| Method | Route              | Description        |
|--------|--------------------|--------------------|
| POST   | /api/auth/register | Register student   |
| POST   | /api/auth/login    | Login user         |
| GET    | /api/auth/me       | Get current user   |

### Exams (Admin)
| Method | Route                  | Description          |
|--------|------------------------|----------------------|
| GET    | /api/exams/admin/all   | All exams (admin)    |
| POST   | /api/exams             | Create exam + AI gen |
| DELETE | /api/exams/:id         | Delete exam          |

### Exams (Student)
| Method | Route                    | Description          |
|--------|--------------------------|----------------------|
| GET    | /api/exams               | My assigned exams    |
| GET    | /api/exams/:id/questions | Get exam questions   |

### Results
| Method | Route                    | Description          |
|--------|--------------------------|----------------------|
| POST   | /api/results/submit      | Submit exam          |
| GET    | /api/results/my          | My results           |
| GET    | /api/results/:id         | Result detail        |
| GET    | /api/results/exam/:id    | All results (admin)  |

### Admin
| Method | Route                      | Description        |
|--------|----------------------------|--------------------|
| GET    | /api/admin/dashboard       | Dashboard stats    |
| GET    | /api/admin/students        | All students       |
| PUT    | /api/admin/students/:id/batch | Assign batch    |
| GET    | /api/admin/rankings/:examId | Exam rankings     |
| GET    | /api/admin/analytics       | Analytics data     |
| GET    | /api/admin/anticheat/:id   | Anti-cheat logs    |

### Batches
| Method | Route                          | Description        |
|--------|--------------------------------|--------------------|
| GET    | /api/batches                   | All batches        |
| POST   | /api/batches                   | Create batch       |
| POST   | /api/batches/:id/students      | Add student        |
| DELETE | /api/batches/:id/students/:sid | Remove student     |

---

## 🎮 Gamification System

| Achievement      | Requirement            | Reward     |
|------------------|------------------------|------------|
| High Achiever    | Score ≥ 80% on any exam | Badge + XP |
| Perfect Score    | Score 100%             | Badge + XP |
| XP Points        | Per exam completion    | % × 2 XP  |
| Level Up         | Every 100 XP           | New level  |

---

## 🛡️ Anti-Cheat Features

| Feature               | Action                            |
|-----------------------|-----------------------------------|
| Tab Switch (1-2x)     | Warning popup shown               |
| Tab Switch (3x)       | Auto-submit exam                  |
| Fullscreen Exit       | Warning + force fullscreen        |
| Copy / Paste / Cut    | Blocked silently + logged         |
| Right Click           | Blocked + logged                  |
| All violations        | Stored in MongoDB for admin review|

---

## 📦 Deployment

### Backend (Railway/Render)
```bash
# Set environment variables in dashboard
# Deploy from GitHub
npm start
```

### Frontend (Vercel/Netlify)
```bash
npm run build
# Deploy dist/ folder
# Set VITE_API_URL to your backend URL
```

---

## 🧰 Tech Stack

| Layer      | Technology                            |
|------------|---------------------------------------|
| Frontend   | React 18, Tailwind CSS, Framer Motion |
| Backend    | Node.js, Express.js                   |
| Database   | MongoDB Atlas + Mongoose              |
| Auth       | JWT + bcryptjs                        |
| AI         | OpenRouter API (Llama 3.2 free)       |
| Charts     | Recharts                              |
| Animations | Framer Motion, canvas-confetti        |

---

## 📝 License

MIT License — Free for educational use.
