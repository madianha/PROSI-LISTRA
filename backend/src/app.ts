import cors from "cors";
import express from "express";
import kontakRoutes from "./routes/kontakRoutes";

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (_req, res) => {
  res.json({ message: "PROSI-LISTRA API berjalan." });
});

app.use("/api/kontak", kontakRoutes);

export default app;
