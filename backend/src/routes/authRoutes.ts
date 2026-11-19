import { Router } from "express";
import { changePassword, login, me } from "../controllers/authController";
import { wajibLogin } from "../middleware/wajibLogin";

const router = Router();

router.post("/login", login);
router.get("/me", wajibLogin, me);
router.put("/change-password", wajibLogin, changePassword);

export default router;
