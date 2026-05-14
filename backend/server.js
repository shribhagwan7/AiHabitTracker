import "dotenv/config";
import express from "express";
import cors from "cors";
import { connectDB } from "./config/db.js";
import authRoutes from "./routes/auth.js";
import habitRoutes from "./routes/habits.js";
import logRoutes from "./routes/logs.js";
import aiRoutes from "./routes/ai.js";
import {
    notFound,
    errorHandler,
} from "./middlewares/errorHandler.js";

const app = express();

/* ==========================================
   CORS Configuration
========================================== */
const allowedOrigins = (process.env.CLIENT_URL || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

const corsOptions = {
    origin(origin, cb) {
        // Allow requests with no origin
        // (Postman, curl, server-to-server)
        if (!origin) {
            return cb(null, true);
        }

        // Allow localhost and 127.0.0.1 during development
        if (/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) {
            return cb(null, true);
        }

        // Allow origins listed in CLIENT_URL
        if (allowedOrigins.includes(origin)) {
            return cb(null, true);
        }

        // Block all other origins
        return cb(
            new Error(`Origin ${origin} not allowed by CORS`)
        );
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
};

/* ==========================================
   Middlewares
========================================== */
app.use(cors(corsOptions));
app.options("*", cors(corsOptions));
app.use(express.json({ limit: "1mb" }));

/* ==========================================
   Root Route
========================================== */
app.get("/", (req, res) => {
    res.json({
        message: "AI Habit Tracker Backend is running successfully 🚀",
        health: "/api/health",
    });
});

/* ==========================================
   Health Check Route
========================================== */
app.get("/api/health", (req, res) => {
    res.json({
        status: "ok",
        time: new Date().toISOString(),
    });
});

/* ==========================================
   API Routes
========================================== */
app.use("/api/auth", authRoutes);
app.use("/api/habits", habitRoutes);
app.use("/api/logs", logRoutes);
app.use("/api/ai", aiRoutes);

/* ==========================================
   Error Handlers
========================================== */
app.use(notFound);
app.use(errorHandler);

/* ==========================================
   Start Server
========================================== */
const PORT = process.env.PORT || 8000;

connectDB()
    .then(() => {
        app.listen(PORT, () => {
            console.log(
                `Server running on http://localhost:${PORT}`
            );
        });
    })
    .catch((err) => {
        console.error(
            "Database connection failed:",
            err.message
        );
        process.exit(1);
    });