import {Router} from "express";
import * as controller from "../controllers/turmaCuidadorController.js";

const router = Router();

router.get("/turmaCuidador", controller.listar);
router.get("/turmaCuidador/turma/:turmaId", controller.buscarCuidadorPorTurma);
router.get("/turmaCuidador/cuidador/:cuiadorId", controller.buscarTurmasDosCuidadores);
router.post("/turmaCuidador/:turmaId/:cuiadorId", controller.vincular);
router.delete("/turmaCuidador/:turmaId/:cuiadorId", controller.desvincular);


export default router;