import { Router } from "express";
import {
  createTestimoni,
  deleteTestimoni,
  listPublik,
  listSemua,
  setAktif,
  setStatus,
  updateTestimoni,
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
// ubah dan hapus hanya untuk testimoni yang ditolak
router.put("/:id", wajibLogin, updateTestimoni);
router.delete("/:id", wajibLogin, deleteTestimoni);

export default router;
