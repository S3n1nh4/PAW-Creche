import {Router} from "express";
import * as controller from "../controllers/turmaController.js";

const router = Router();

router.get("/turmas", controller.listar);
router.get("/turmas/:id", controller.buscarPorId);
router.get("/turmas/:nome", controller.buscarPorNome);
router.post("/turmas/:id", controller.criar);
router.put("/turmas/:id", controller.atualizar);
router.delete("/turmas/:id", controller.deletar);


export default router;