import { Router } from "express";
import { listProvinsi } from "../controllers/jasaController";

const router = Router();

router.get("/", listProvinsi);

export default router;
