import {Router} from "express";
import * as controller from "../controllers/alunoController.js";

const router = Router();

router.get("/alunos", controller.listar);
router.get("/alunos/:turmaId", controller.buscarPorTurma);
router.get("/alunos/:id", controller.buscarPorId);
router.get("/alunos/:nome", controller.buscarPorNome);
router.post("/alunos", controller.criar);
router.delete("/alunos/:id", controller.deletar);


export default router;
