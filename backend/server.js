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

const allowedOrigins = (process.env.CLIENT_URL || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

const corsOptions = {
    origin(origin, cb) {
        if (!origin) {
            return cb(null, true);
        }

        if (/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) {
            return cb(null, true);
        }

        if (allowedOrigins.includes(origin)) {
            return cb(null, true);
        }

        return cb(new Error(`Origin ${origin} not allowed by CORS`));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
};

let isConnected = false;

const ensureDBConnection = async () => {
    if (!isConnected) {
        await connectDB();
        isConnected = true;
        console.log("MongoDB connected");
    }
};

app.use(cors(corsOptions));
app.options("*", cors(corsOptions));
app.use(express.json({ limit: "1mb" }));

app.get("/", (req, res) => {
    res.json({
        message: "AI Habit Tracker Backend is running successfully 🚀",
        health: "/api/health",
    });
});

app.get("/api/health", (req, res) => {
    res.json({
        status: "ok",
        time: new Date().toISOString(),
    });
});

app.use(async (req, res, next) => {
    try {
        await ensureDBConnection();
        next();
    } catch (err) {
        console.error("Database connection failed:", err.message);
        res.status(500).json({
            message: "Database connection failed",
        });
    }
});

app.use("/api/auth", authRoutes);
app.use("/api/habits", habitRoutes);
app.use("/api/logs", logRoutes);
app.use("/api/ai", aiRoutes);

app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 8000;

if (process.env.NODE_ENV !== "production") {
    ensureDBConnection()
        .then(() => {
            app.listen(PORT, () => {
                console.log(`Server running on http://localhost:${PORT}`);
            });
        })
        .catch((err) => {
            console.error("Database connection failed:", err.message);
            process.exit(1);
        });
}

export default app;