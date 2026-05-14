import "dotenv/config";
import express from "express";
import cors from "cors";
import { connectDB } from "./config/db.js";

import authRoutes from "./routes/auth.js";
import habitRoutes from "./routes/habits.js";
import logRoutes from "./routes/logs.js";
import aiRoutes from "./routes/ai.js";

import { notFound, errorHandler } from "./middlewares/errorHandler.js";

const app = express();

/* ---------------- CORS CONFIG ---------------- */

app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET,POST,PUT,PATCH,DELETE,OPTIONS"
  );
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }

  next();
});

app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

/* ---------------- MIDDLEWARE ---------------- */

app.use(express.json({ limit: "1mb" }));

/* ---------------- ROUTES WITHOUT DB ---------------- */

app.get("/", (req, res) => {
  res.json({ message: "Backend running - open CORS v3" });
});

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", time: new Date().toISOString() });
});

/* ---------------- DB CONNECTION ---------------- */

let isConnected = false;

const ensureDBConnection = async () => {
  if (!isConnected) {
    await connectDB();
    isConnected = true;
    console.log("MongoDB connected");
  }
};

app.use(async (req, res, next) => {
  try {
    await ensureDBConnection();
    next();
  } catch (err) {
    console.error("DB connection failed:", err);
    res.status(500).json({ message: "DB connection failed" });
  }
});

/* ---------------- API ROUTES ---------------- */

app.use("/api/auth", authRoutes);
app.use("/api/habits", habitRoutes);
app.use("/api/logs", logRoutes);
app.use("/api/ai", aiRoutes);

/* ---------------- ERROR HANDLERS ---------------- */

app.use(notFound);
app.use(errorHandler);

/* ---------------- EXPORT FOR VERCEL ---------------- */

export default app;
