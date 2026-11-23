import { Router } from "express";
import { presencaSchema, atualizarPresencaSchema } from "@creche/shared/presenca";
import { validarBody } from "../middlewares/validarSchema.js";
import { autenticarPresenca } from "../middlewares/autenticarPresenca.js";
import * as controller from "../controllers/presencaController.js";

const router = Router();
router.use("/presencas", autenticarPresenca("CUIDADOR"));
router.get("/presencas", controller.listar);
router.get("/presencas/:id", controller.buscarPorId);
router.post("/presencas", validarBody(presencaSchema), controller.criar);
router.put("/presencas/:id", validarBody(atualizarPresencaSchema), controller.atualizar);
export default router;
