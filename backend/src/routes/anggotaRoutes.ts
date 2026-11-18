import { Router } from "express";
import {
  createAnggota,
  getAnggotaDetail,
  getSpesialisasiList,
  listAnggota,
  toggleStatusAktif,
  updateAnggota,
} from "../controllers/anggotaController";

import { wajibLogin } from "../middleware/wajibLogin";

// data anggota (termasuk email) hanya untuk panel internal: semua route wajib login
const router = Router();
router.use(wajibLogin);

router.get("/spesialisasi", getSpesialisasiList);
router.get("/", listAnggota);
router.get("/:id", getAnggotaDetail);
router.post("/", createAnggota);
router.put("/:id", updateAnggota);
router.patch("/:id/status", toggleStatusAktif);

export default router;
