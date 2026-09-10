import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import dotenv from "dotenv";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { initDb, seedAdmin } from "./db.js";
import auth from "./routes/auth.js";
import products from "./routes/products.js";
import orders from "./routes/orders.js";
import custom from "./routes/custom.js";
import reviews from "./routes/reviews.js";
import admin from "./routes/admin.js";
import payments from "./routes/payments.js";

dotenv.config();

const app = express();
const dir = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(dir, "../..");
const webDist = path.join(rootDir, "web", "dist");
const uploadDir = process.env.UPLOAD_DIR
  ? path.resolve(process.env.UPLOAD_DIR)
  : path.join(rootDir, "backend", "uploads");

fs.mkdirSync(uploadDir, { recursive: true });
initDb();
seedAdmin();

app.disable("x-powered-by");
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
    contentSecurityPolicy: false,
  })
);

const allowedOrigins = (process.env.WEB_URL || "")
  .split(",")
  .map((x) => x.trim())
  .filter(Boolean);
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || !allowedOrigins.length || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error("CORS origin not allowed"));
    },
    credentials: true,
  })
);

app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true, limit: "2mb" }));
app.use("/uploads", express.static(uploadDir, { maxAge: "7d" }));
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 500,
    standardHeaders: true,
    legacyHeaders: false,
  })
);

app.get("/api/health", (req, res) =>
  res.json({ ok: true, shop: "IBGLOBAL FASHION", version: "1.0.0" })
);

app.use("/api/auth", auth);
app.use("/api/products", products);
app.use("/api/orders", orders);
app.use("/api/custom-orders", custom);
app.use("/api/reviews", reviews);
app.use("/api/admin", admin);
app.use("/api/payments", payments);

// Serve the compiled React storefront when this repository is deployed as one service.
if (fs.existsSync(webDist)) {
  app.use(express.static(webDist));
  app.get("*", (req, res, next) => {
    if (req.path.startsWith("/api/") || req.path.startsWith("/uploads/")) return next();
    res.sendFile(path.join(webDist, "index.html"));
  });
}

app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({ message: err.message || "Server error" });
});

const port = Number(process.env.PORT || 5000);
app.listen(port, () =>
  console.log(`IBGLOBAL FASHION is running on port ${port}`)
);
