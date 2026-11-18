import {Router} from "express";
import * as controller from "../controllers/adminController.js";

const router = Router();

router.get("/admins", controller.listar);
router.get("/admins/:id", controller.buscarPorId);
router.get("/admins/email/:email", controller.buscarPorEmail);
router.post("/admins", controller.criar);
router.put("/admins/:id", controller.atualizar);
router.put("/admins/desativar/:id", controller.desativar);
router.delete("/admins/:id", controller.deletar);


export default router;