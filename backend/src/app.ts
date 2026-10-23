import cors from "cors";
import express from "express";
import beritaRoutes from "./routes/beritaRoutes";
import uploadRoutes from "./routes/uploadRoutes";
import { UPLOAD_DIR } from "./storage/uploadStorage";

const app = express();

app.use(cors());
app.use(express.json({ limit: "2mb" }));

app.get("/", (_req, res) => {
  res.json({ message: "PROSI-LISTRA API berjalan." });
});

app.use("/api/berita", beritaRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/uploads", express.static(UPLOAD_DIR));

export default app;
