import { Router } from "express";
import { presencaCuidadorSchema, atualizarPresencaCuidadorSchema } from "@creche/shared/presencaCuidador";
import { validarBody } from "../middlewares/validarSchema.js";
import { autenticarPresenca } from "../middlewares/autenticarPresenca.js";
import * as controller from "../controllers/presencaCuidadorController.js";

const router = Router();
router.use("/presencas-cuidadores", autenticarPresenca("ADMIN"));
router.get("/presencas-cuidadores", controller.listar);
router.get("/presencas-cuidadores/:id", controller.buscarPorId);
router.post("/presencas-cuidadores", validarBody(presencaCuidadorSchema), controller.criar);
router.put("/presencas-cuidadores/:id", validarBody(atualizarPresencaCuidadorSchema), controller.atualizar);
router.delete("/presencas-cuidadores/:id", controller.deletar);
export default router;
