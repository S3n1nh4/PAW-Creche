import {Router} from "express";
import * as controller from "../controllers/alunoController.js";
import { validarBody } from "../middlewares/validarSchema.js";
import { alunoSchema } from "@creche/shared/aluno";

const router = Router();

router.get("/alunos", controller.listar);
router.get("/alunos/:turmaId", controller.buscarPorTurma);
router.get("/alunos/:id", controller.buscarPorId);
router.get("/alunos/:nome", controller.buscarPorNome);
router.post("/alunos",validarBody(alunoSchema), controller.criar);
router.put("/alunos/:id", validarBody(alunoSchema), controller.atualizar);
router.delete("/alunos/:id", controller.deletar);


export default router;
