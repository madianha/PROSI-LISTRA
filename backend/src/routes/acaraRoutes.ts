import { Router } from "express";
import {
  createAcara,
  deleteAcara,
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
router.delete("/:id", deleteAcara);

export default router;
