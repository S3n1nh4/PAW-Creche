import {Router} from "express";
import * as controller from "../controllers/turmaCuidadorController.js";
import { validarBody } from "../middlewares/validarSchema.js";
import { turmaCuidadorSchema } from "@creche/shared/turmaCuidador";
import { autenticarPresenca } from "../middlewares/autenticarPresenca.js";

const router = Router();
router.use("/turmaCuidador", autenticarPresenca("ADMIN"));

router.get("/turmaCuidador", controller.listar);
router.get("/turmaCuidador/turma/:turmaId", controller.buscarCuidadorPorTurma);
router.get("/turmaCuidador/cuidador/:cuidadorId", controller.buscarTurmasDosCuidadores);
router.post("/turmaCuidador/:turmaId/:cuidadorId", validarBody(turmaCuidadorSchema), controller.vincular);
router.delete("/turmaCuidador/:turmaId/:cuidadorId", controller.desvincular);


export default router;
