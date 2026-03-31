import "dotenv/config";
import express from "express";
import cors from "cors";
import rateLimit from "express-rate-limit";
import path from "path";
import { fileURLToPath } from "url";
import { rpSignatureRouter } from "./routes/rp-signature.js";
import { verifyProofRouter } from "./routes/verify-proof.js";
import { storachaDelegationRouter } from "./routes/storacha-delegation.js";
import { inscriptionsRouter } from "./routes/inscriptions.js";
import { aiDescribeRouter } from "./routes/ai-describe.js";
import { geoRouter } from "./routes/geo.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();

// Trust proxy untuk Replit dan production environments
app.set("trust proxy", 1);

// CORS: restrict ke production domain jika ALLOWED_ORIGIN di-set
const allowedOrigin = process.env.ALLOWED_ORIGIN;
app.use(
  cors({
    origin: allowedOrigin
      ? (origin, cb) => {
          if (!origin) return cb(null, true);
          const allowed = allowedOrigin.split(",").map((o) => o.trim());
          cb(null, allowed.includes(origin));
        }
      : true,
  })
);

app.use(express.json({ limit: "10mb" }));

// Rate limiting: 100 req/15min per IP untuk API
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use("/api", apiLimiter);

// API routes
app.use("/api/rp-signature", rpSignatureRouter);
app.use("/api/verify-proof", verifyProofRouter);
app.use("/api/storacha-delegation", storachaDelegationRouter);
app.use("/api/inscriptions", inscriptionsRouter);
app.use("/api/ai-describe", aiDescribeRouter);
app.use("/api/geo", geoRouter);

// Serve static in production (frontend built to project root /dist)
if (process.env.NODE_ENV === "production") {
  const distPath = path.join(__dirname, "../../dist");
  app.use(express.static(distPath));
  app.get("*", (_, res) => {
    res.sendFile(path.join(distPath, "index.html"));
  });
}

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`STELE server running on port ${PORT}`);
});
