import {Router} from "express";
import * as controller from "../controllers/cuidadorController.js";
import { validarBody } from "../middlewares/validarSchema.js";
import { cuidadorSchema, cadastroCuidadorSchema, atualizarCuidadorSchema } from "@creche/shared/cuidador";

const router = Router();

router.get("/cuidadores", controller.listar);
router.get("/cuidadores/:id", controller.buscarPorId);
router.get("/cuidadores/email/:email", controller.buscarPorEmail);
router.post("/cuidadores",validarBody(cadastroCuidadorSchema), controller.criar);
router.put("/cuidadores/:id",validarBody(atualizarCuidadorSchema), controller.atualizar);
// router.put("/cuidador/:id", controller.desativar);
router.delete("/cuidadores/:id", controller.deletar);


export default router;
