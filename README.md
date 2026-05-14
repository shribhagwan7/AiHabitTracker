# AI Habit Tracker

AI Habit Tracker is a full-stack MERN application for building, tracking, and improving daily habits. It includes authentication, habit management, progress logs, stats dashboards, streak insights, and Gemini-powered AI recommendations.

## Live Demo

- Frontend: https://ai-habit-tracker-s73k.vercel.app
- Backend: https://ai-habit-tracker-ruddy.vercel.app
- Health Check: https://ai-habit-tracker-ruddy.vercel.app/api/health

## Features

- User registration and login with JWT authentication
- Create, update, reorder, archive, and delete habits
- Mark and unmark daily habit completions
- Dashboard with today's habits and progress summary
- Weekly, monthly, heatmap, and habit-level statistics
- AI weekly reports, habit suggestions, recovery plans, chat analysis, and morning motivation
- Responsive React UI with protected routes
- Vercel-ready frontend and backend deployment setup

## Tech Stack

**Frontend**

- React
- Vite
- React Router
- Axios
- Tailwind CSS
- Recharts
- Lucide React

**Backend**

- Node.js
- Express.js
- MongoDB
- Mongoose
- JWT
- bcryptjs
- Google Gemini API

## Project Structure

```txt
.
+-- backend/
|   +-- config/
|   +-- controllers/
|   +-- middlewares/
|   +-- models/
|   +-- routes/
|   +-- utils/
|   +-- server.js
|   +-- package.json
|   +-- vercel.json
|
+-- frontend/
    +-- ai-habit-tracker-ui/
        +-- src/
        +-- index.html
        +-- package.json
        +-- vercel.json

Local Setup
1. Clone the Repository
git clone https://github.com/shribhagwan7/AiHabitTracker.git
cd AiHabitTracker

2. Backend Setup
cd backend
npm install
npm run dev

3. Frontend Setup
cd frontend/ai-habit-tracker-ui
npm install
npm run dev

Author
Built with dedication by shribhagwan7.

Thanks
Thanks for checking out this project. If you like it, feel free to star the repository.
