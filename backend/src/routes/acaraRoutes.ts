import { Router } from "express";
import {
  cancelAcara,
  createAcara,
  getAcaraDetail,
  listAcara,
  updateAcara,
} from "../controllers/acaraController";
import { wajibLogin } from "../middleware/wajibLogin";

// Kalender Event internal: semua route wajib login
const router = Router();
router.use(wajibLogin);

router.get("/", listAcara);
router.get("/:id", getAcaraDetail);
router.post("/", createAcara);
router.put("/:id", updateAcara);
router.patch("/:id/cancel", cancelAcara);
router.delete("/:id", cancelAcara);

export default router;
