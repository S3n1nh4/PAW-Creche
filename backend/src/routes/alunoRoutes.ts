import {Router} from "express";
import * as controller from "../controllers/alunoController.js";

const router = Router();

router.get("/aluno", controller.listar);
router.get("/aluno/:turmaId", controller.buscarPorTurma);
router.get("/aluno/:alunoId", controller.buscarPorId);
router.get("/aluno/:nome", controller.buscarPorNome);
router.post("/aluno/:alunoId", controller.criar);
router.delete("/aluno/:alunoId", controller.deletar);


export default router;
