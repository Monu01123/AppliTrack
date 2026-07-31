<div align="center">
  <h1>📌 HireIQ - AI Job Desk & Tracker</h1>
  <p><b>An intelligent, end-to-end ecosystem for managing job applications, powered by AI and a custom Chrome Extension.</b></p>
  
  <a href="https://appli-track-seven.vercel.app/"><strong>View Live Website</strong></a> · 
  <a href="https://chromewebstore.google.com/"><strong>Download Chrome Extension</strong></a>

  <br />
  <br />

  [![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](#)
  [![Node.js](https://img.shields.io/badge/Node.js-43853D?style=for-the-badge&logo=node.js&logoColor=white)](#)
  [![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white)](#)
  [![Redis](https://img.shields.io/badge/redis-%23DD0031.svg?style=for-the-badge&logo=redis&logoColor=white)](#)
  [![Google Gemini](https://img.shields.io/badge/Google%20Gemini-8E75B2?style=for-the-badge&logo=google&logoColor=white)](#)

</div>

<hr />

## 👋 To Hiring Managers & Recruiters

**I am currently actively seeking Junior / Entry-Level Software Engineering roles.** 

This project was built to demonstrate my ability to construct **production-ready, full-stack applications** that solve real-world problems. Unlike standard tutorial clones, HireIQ features a complex architecture including:

- **Cross-Origin Authentication:** Secure JWT session syncing between a Chrome Extension and a React Web App.
- **Performance Optimization:** In-memory caching and distributed rate-limiting via **Redis**.
- **Background Processing:** Scheduled CRON jobs that send automated weekly email digests to users.
- **AI Integration:** Leveraging the Google Gemini API to dynamically parse job descriptions against user resumes and calculate match scores.

If you are looking for an engineer who understands full-stack data flow, deployment (AWS EC2 / Vercel), and user-centric design, **I would love to connect!** 

📫 **Email:** monum@example.com *(Please update this!)* <br/>
💼 **LinkedIn:** [Insert Your LinkedIn Link Here]

<hr />

## ✨ Core Features

* 🧩 **Chrome Extension Clipper:** Browse LinkedIn, Indeed, or any job board. Click the HireIQ extension to instantly scrape the job title, company, and description, and save it directly to your web dashboard.
* 🤖 **AI Resume Matcher:** Upload your PDF resume. When you save a job, HireIQ uses Google Gemini to analyze the job description against your resume and gives you a precise match percentage and tailored improvement tips.
* 📈 **Advanced Analytics:** A visual dashboard tracking your pipeline velocity, interview conversion rates, and total applications (Cached via Redis for blazing-fast load times).
* 💌 **Automated Weekly Digests:** A background Node.js CRON job compiles your weekly application stats and emails you a beautiful digest using Nodemailer.
* 🌍 **Public Profiles:** Generate a unique, shareable link (e.g., `hireiq.com/p/alex`) to showcase your application pipeline and progress to mentors or peers.

## 🛠 Tech Stack & Architecture

### **Frontend (Vercel)**
- **Framework:** React.js + Vite
- **Routing:** React Router v6
- **State Management & Caching:** React Query / Context API
- **Styling:** Custom CSS (Corkboard UI/UX Design System)
- **Visuals:** Recharts, Lucide-React

### **Backend (AWS EC2)**
- **Runtime:** Node.js + Express
- **Database:** PostgreSQL (Neon) via Prisma ORM
- **In-Memory Store:** Redis (Analytics caching & Global Rate Limiting)
- **Authentication:** JWT (HttpOnly Cookies + Access Tokens) & Google OAuth
- **AI/LLM:** Google Gemini API (`@google/genai`)

### **Chrome Extension**
- **Manifest V3:** Modern Chrome Extension architecture.
- **Content Scripts:** DOM scraping for job details.
- **Service Workers:** Background API synchronization.

## 🚀 Local Development Setup

To run this project locally on your machine:

**1. Clone the repository**
```bash
git clone https://github.com/Monu01123/AppliTrack.git
cd AppliTrack
```

**2. Setup the Backend**
```bash
cd server
npm install

# Set up your environment variables (.env)
# DATABASE_URL, REDIS_URL, JWT_SECRET, GEMINI_API_KEY, etc.

# Push the database schema
npx prisma db push

# Start the server (Requires Redis running locally on port 6379)
npm run dev
```

**3. Setup the Frontend**
```bash
cd ../client
npm install
npm run dev
```

**4. Load the Extension**
- Go to `chrome://extensions/`
- Enable **"Developer mode"**
- Click **"Load unpacked"** and select the `/extension` directory in this project.
