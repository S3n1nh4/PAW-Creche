import {Router} from "express";
import * as controller from "../controllers/comportamentoController.js";

const router = Router();

router.get("/comportamentos", controller.listar);
router.get("/comportamentos/:CuidadorId", controller.buscarPorCuidador);
router.get("/comportamentos/:alunoId", controller.buscarPorAluno);
router.get("/comportamentos/:id", controller.buscarPorId);
router.post("/comportamentos", controller.criar);
router.put("/comportamentos/:id",controller.atualizar);
router.delete("/comportamentos/:id", controller.deletar);


export default router;