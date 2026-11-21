import {Router} from "express";
import * as controller from "../controllers/comportamentoController.js";
import { validarBody } from "../middlewares/validarSchema.js";
import { comportamentoSchema } from "@creche/shared/comportamento";

const router = Router();

router.get("/comportamentos", controller.listar);
router.get("/comportamentos/:CuidadorId", controller.buscarPorCuidador);
router.get("/comportamentos/:alunoId", controller.buscarPorAluno);
router.get("/comportamentos/:id", controller.buscarPorId);
router.post("/comportamentos", validarBody(comportamentoSchema), controller.criar);
router.put("/comportamentos/:id", validarBody(comportamentoSchema),controller.atualizar);
router.delete("/comportamentos/:id", controller.deletar);


export default router;