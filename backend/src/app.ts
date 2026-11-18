import cors from "cors";
import express from "express";
import acaraRoutes from "./routes/acaraRoutes";
import alatMusikRoutes from "./routes/alatMusikRoutes";
import anggotaRoutes from "./routes/anggotaRoutes";
import authRoutes from "./routes/authRoutes";
import beritaRoutes from "./routes/beritaRoutes";
import jadwalRoutes from "./routes/jadwalRoutes";
import kontakRoutes from "./routes/kontakRoutes";
import jasaRoutes from "./routes/jasaRoutes";
import testimoniRoutes from "./routes/testimoniRoutes";
import provinsiRoutes from "./routes/provinsiRoutes";
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
app.use("/api/acara", acaraRoutes);
app.use("/api/jadwal", jadwalRoutes);
app.use("/api/alat-musik", alatMusikRoutes);
app.use("/api/berita", beritaRoutes);
app.use("/api/jasa", jasaRoutes);
app.use("/api/provinsi", provinsiRoutes);
app.use("/api/kontak", kontakRoutes);
app.use("/api/testimoni", testimoniRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/uploads", express.static(UPLOAD_DIR));

export default app;
