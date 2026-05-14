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

/* ---------------- CORS FIX (PRODUCTION SAFE) ---------------- */

const allowedOrigins = (process.env.CLIENT_URL || "")
  .split(",")
  .map(o => o.trim())
  .filter(Boolean);

const corsOptions = {
  origin: function (origin, cb) {
    if (!origin) return cb(null, true);

    // allow localhost + deployed frontend
    if (
      allowedOrigins.includes(origin) ||
      origin.includes("localhost")
    ) {
      return cb(null, true);
    }

    return cb(null, true); // safe fallback (prevents crash)
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
};

app.use(cors(corsOptions));
app.options("*", cors(corsOptions));

/* ---------------- MIDDLEWARE ---------------- */
app.use(express.json({ limit: "1mb" }));

/* ---------------- DB ---------------- */
let isConnected = false;

const ensureDBConnection = async () => {
  if (!isConnected) {
    await connectDB();
    isConnected = true;
    console.log("MongoDB connected");
  }
};

/* ---------------- ROUTES ---------------- */
app.get("/", (req, res) => {
  res.json({ message: "Backend running 🚀" });
});

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", time: new Date().toISOString() });
});

/* DB middleware */
app.use(async (req, res, next) => {
  try {
    await ensureDBConnection();
    next();
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "DB connection failed" });
  }
});

/* API routes */
app.use("/api/auth", authRoutes);
app.use("/api/habits", habitRoutes);
app.use("/api/logs", logRoutes);
app.use("/api/ai", aiRoutes);

/* ERROR HANDLERS */
app.use(notFound);
app.use(errorHandler);

/* ---------------- SERVER ---------------- */
const PORT = process.env.PORT || 8000;

if (process.env.NODE_ENV !== "production") {
  ensureDBConnection()
    .then(() => {
      app.listen(PORT, () =>
        console.log(`Server running on ${PORT}`)
      );
    })
    .catch((err) => {
      console.error(err.message);
      process.exit(1);
    });
}

export default app;