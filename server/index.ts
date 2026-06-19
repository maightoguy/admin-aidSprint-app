import "dotenv/config";
import express from "express";
import cors from "cors";
import { handleDemo } from "./routes/demo";
import {
  handleGenerateRecoveryCodes,
  handleVerifyRecoveryCode,
} from "./routes/admin-security";
import { handleGenerateEvidenceSignedUrl } from "./routes/disputes-evidence";

export function createServer() {
  const app = express();

  // Middleware
  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Example API routes
  app.get("/api/ping", (_req, res) => {
    const ping = process.env.PING_MESSAGE ?? "ping";
    res.json({ message: ping });
  });

  app.get("/api/demo", handleDemo);
  app.post("/api/admin/security/recovery-codes/generate", handleGenerateRecoveryCodes);
  app.post("/api/admin/security/recovery-codes/verify", handleVerifyRecoveryCode);
  app.post("/api/disputes/evidence/signed-url", handleGenerateEvidenceSignedUrl);

  return app;
}
