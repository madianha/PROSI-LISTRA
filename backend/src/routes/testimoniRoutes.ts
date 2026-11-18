import { Router } from "express";
import {
  createTestimoni,
  deleteTestimoni,
  listPublik,
  listSemua,
  setAktif,
  setStatus,
} from "../controllers/testimoniController";
import { wajibLogin } from "../middleware/wajibLogin";

const router = Router();

// publik: lihat yang sudah tampil, dan kirim testimoni baru (masuk sebagai "menunggu")
router.get("/", listPublik);
router.post("/", createTestimoni);

// internal: wajib login
router.get("/semua", wajibLogin, listSemua);
router.patch("/:id/status", wajibLogin, setStatus);
router.patch("/:id/aktif", wajibLogin, setAktif);
router.delete("/:id", wajibLogin, deleteTestimoni);

export default router;
