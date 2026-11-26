import {Router} from "express";
import * as controller from "../controllers/alunoController.js";
import { validarBody } from "../middlewares/validarSchema.js";
import { cadastroAlunoSchema, atualizarAlunoSchema } from "@creche/shared/aluno";
import { autenticarPresenca } from "../middlewares/autenticarPresenca.js";

const router = Router();
router.use("/alunos", autenticarPresenca("ADMIN", "CUIDADOR"));
router.get("/alunos", controller.listar);

router.get("/alunos/turma/:turmaId", controller.buscarPorTurma);
router.get("/alunos/nome/:nome", controller.buscarPorNome);
router.get("/alunos/:id", controller.buscarPorId);
router.post("/alunos",validarBody(cadastroAlunoSchema), controller.criar);
router.put("/alunos/:id", autenticarPresenca("ADMIN"), validarBody(atualizarAlunoSchema), controller.atualizar);
router.delete("/alunos/:id", autenticarPresenca("ADMIN"), controller.deletar);


export default router;
