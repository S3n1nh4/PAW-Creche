import {Router} from "express";
import * as controller from "../controllers/cuidadorController.js";
import { validarBody } from "../middlewares/validarSchema.js";
import { autenticarPresenca } from "../middlewares/autenticarPresenca.js";
import { cuidadorSchema, cadastroCuidadorSchema, atualizarCuidadorSchema } from "@creche/shared/cuidador";

const router = Router();
router.use("/cuidadores", autenticarPresenca("ADMIN"));

router.get("/cuidadores", controller.listar);
router.get("/cuidadores/:id", controller.buscarPorId);
router.get("/cuidadores/email/:email", controller.buscarPorEmail);
router.post("/cuidadores",validarBody(cadastroCuidadorSchema), controller.criar);
router.put("/cuidadores/:id",validarBody(atualizarCuidadorSchema), controller.atualizar);
// router.put("/cuidador/:id", controller.desativar);
router.delete("/cuidadores/:id", controller.deletar);


export default router;
