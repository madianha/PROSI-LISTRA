import { Router } from "express";
import {
  createAlatMusik,
  deleteAlatMusik,
  listAlatMusik,
  updateAlatMusik,
} from "../controllers/alatMusikController";
import { wajibLogin } from "../middleware/wajibLogin";

const router = Router();

// publik: daftar alat musik
router.get("/", listAlatMusik);

// internal: wajib login
router.post("/", wajibLogin, createAlatMusik);
router.put("/:id", wajibLogin, updateAlatMusik);
router.delete("/:id", wajibLogin, deleteAlatMusik);

export default router;
