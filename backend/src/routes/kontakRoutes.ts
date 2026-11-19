import { Router } from "express";
import { getKontak, updateKontak } from "../controllers/kontakController";
import { wajibLogin } from "../middleware/wajibLogin";

const router = Router();

router.get("/", getKontak);
router.put("/", wajibLogin, updateKontak);

export default router;
