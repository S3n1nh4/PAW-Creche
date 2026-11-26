import { Router } from "express";
import * as controller from "../controllers/authController.js";
import { validarBody } from "../middlewares/validarSchema.js";
import { loginSchema } from "@creche/shared/auth";
import { criarLimitadorLogin } from "../middlewares/limitarLogin.js";

const router = Router();

router.post("/login", criarLimitadorLogin(), validarBody(loginSchema), controller.login);
router.post("/logout", controller.logout);

export default router;
