import {Router} from "express";
import * as controller from "../controllers/turmaController.js";
import { validarBody } from "../middlewares/validarSchema.js";
import { turmaSchema } from "@creche/shared/turma";
import { autenticarPresenca } from "../middlewares/autenticarPresenca.js";

const router = Router();
router.use("/turmas", autenticarPresenca("ADMIN"));

router.get("/turmas", controller.listar);
router.get("/turmas/nome/:nome", controller.buscarPorNome);
router.get("/turmas/:id", controller.buscarPorId);
router.post("/turmas",validarBody(turmaSchema), controller.criar);
router.put("/turmas/:id",validarBody(turmaSchema), controller.atualizar);
router.put("/turmas/:id/alunos/:alunoId", controller.adicionarAluno);
router.post("/turmas/:id/alunos/:alunoId/transferir", controller.transferirAluno);
router.delete("/turmas/:id/alunos/:alunoId", controller.removerAluno);
router.delete("/turmas/:id", controller.deletar);


export default router;
