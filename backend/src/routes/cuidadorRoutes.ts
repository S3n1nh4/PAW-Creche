import {Router} from "express";
import * as controller from "../controllers/cuidadorController.js";

const router = Router();

router.get("/cuidadores", controller.listar);
router.get("/cuidadores/:id", controller.buscarPorId);
router.get("/cuidadores/email/:email", controller.buscarPorEmail);
router.post("/cuidadores", controller.criar);
router.put("/cuidadores/:id", controller.atualizar);
// router.put("/cuidador/:id", controller.desativar);
router.delete("/cuidadores/:id", controller.deletar);


export default router;
