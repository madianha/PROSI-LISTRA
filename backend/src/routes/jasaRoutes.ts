import { Router } from "express";
import {
  createJasa,
  getJasaDetail,
  listJasa,
  toggleStatusJasa,
  updateJasa,
} from "../controllers/jasaController";
import { wajibLogin } from "../middleware/wajibLogin";

const router = Router();

// publik: katalog & detail (hanya jasa aktif, kecuali pengguna login)
router.get("/", listJasa);
router.get("/:id", getJasaDetail);

// internal: wajib login
router.post("/", wajibLogin, createJasa);
router.put("/:id", wajibLogin, updateJasa);
router.patch("/:id/status", wajibLogin, toggleStatusJasa);

export default router;
