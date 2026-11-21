import {Router} from "express";
import * as controller from "../controllers/turmaController.js";
import { validarBody } from "../middlewares/validarSchema.js";
import { turmaSchema } from "@creche/shared/turma";

const router = Router();

router.get("/turmas", controller.listar);
router.get("/turmas/:id", controller.buscarPorId);
router.get("/turmas/:nome", controller.buscarPorNome);
router.post("/turmas/:id",validarBody(turmaSchema), controller.criar);
router.put("/turmas/:id",validarBody(turmaSchema), controller.atualizar);
router.delete("/turmas/:id", controller.deletar);


export default router;