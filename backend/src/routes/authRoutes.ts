import { Router } from "express";
import * as controller from "../controllers/authController.js";
import { validarBody } from "../middlewares/validarSchema.js";
import { loginSchema } from "@creche/shared/auth";

const router = Router();

router.post("/login", validarBody(loginSchema), controller.login);
router.post("/logout", controller.logout);

export default router;
