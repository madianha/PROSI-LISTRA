import cors from "cors";
import express from "express";
import authRoutes from "./routes/authRoutes";
import anggotaRoutes from "./routes/anggotaRoutes";
import beritaRoutes from "./routes/beritaRoutes";
import kontakRoutes from "./routes/kontakRoutes";
import uploadRoutes from "./routes/uploadRoutes";
import { UPLOAD_DIR } from "./storage/uploadStorage";

const app = express();

app.use(cors());
app.use(express.json({ limit: "2mb" }));

app.get("/", (_req, res) => {
  res.json({ message: "PROSI-LISTRA API berjalan." });
});

app.use("/api/auth", authRoutes);
app.use("/api/anggota", anggotaRoutes);
app.use("/api/berita", beritaRoutes);
app.use("/api/kontak", kontakRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/uploads", express.static(UPLOAD_DIR));

export default app;
