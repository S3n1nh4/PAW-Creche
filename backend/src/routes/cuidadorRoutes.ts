import {Router} from "express";
import * as controller from "../controllers/cuidadorController.js";

const router = Router();

router.get("/cuidador", controller.listar);
router.get("/cuidador/:id", controller.buscarPorId);
router.get("/cuidador/:email", controller.buscarPorEmail);
router.post("/cuidador/:id", controller.criar);
router.put("/cuidador/:id", controller.atualizar);
// router.put("/cuidador/:id", controller.desativar);
router.delete("/cuidador/:id", controller.deletar);


export default router;
