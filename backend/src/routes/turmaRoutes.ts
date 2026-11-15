import {Router} from "express";
import * as controller from "../controllers/turmaController.js";

const router = Router();

router.get("/turma", controller.listar);
router.get("/turma/:id", controller.buscarPorId);
router.get("/turma/:nome", controller.buscarPorNome);
router.post("/turma/:id", controller.criar);
router.put("/turma/:id", controller.atualizar);
router.delete("/turma/:id", controller.deletar);


export default router;