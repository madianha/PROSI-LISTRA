import { Router } from "express";
import { listJadwal } from "../controllers/acaraController";

// Jadwal Acara publik: tanpa Nama Client, PJ, dan performer
const router = Router();

router.get("/", listJadwal);

export default router;
