import {Router} from "express";
import * as controller from "../controllers/alunoController.js";
import { validarBody } from "../middlewares/validarSchema.js";
import { alunoSchema } from "@creche/shared/aluno";

const router = Router();

router.get("/alunos/turma/:turmaId", controller.buscarPorTurma);
router.get("/alunos/nome/:nome", controller.buscarPorNome);
router.get("/alunos/:id", controller.buscarPorId);
router.post("/alunos",validarBody(alunoSchema), controller.criar);
router.put("/alunos/:id", validarBody(alunoSchema), controller.atualizar);
router.delete("/alunos/:id", controller.deletar);


export default router;
