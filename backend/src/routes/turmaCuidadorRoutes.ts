import {Router} from "express";
import * as controller from "../controllers/turmaCuidadorController.js";
import { validarBody } from "../middlewares/validarSchema.js";
import { turmaCuidadorSchema } from "@creche/shared/turmaCuidador";

const router = Router();

router.get("/turmaCuidador", controller.listar);
router.get("/turmaCuidador/turma/:turmaId", controller.buscarCuidadorPorTurma);
router.get("/turmaCuidador/cuidador/:cuiadorId", controller.buscarTurmasDosCuidadores);
router.post("/turmaCuidador/:turmaId/:cuiadorId", validarBody(turmaCuidadorSchema), controller.vincular);
router.delete("/turmaCuidador/:turmaId/:cuiadorId", controller.desvincular);


export default router;