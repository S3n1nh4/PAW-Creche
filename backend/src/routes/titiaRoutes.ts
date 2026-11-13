import {Router} from "express";
import * as controller from "../controllers/titiaContoller.js";

const router = Router();

router.get("/titia", controller.listar);
router.get("/titia/:id", controller.buscarPorId);
router.get("/titia/:email", controller.buscarPorEmail);
router.post("/titia/:id", controller.criar);
router.put("/titia/:id", controller.atualizar);
// router.put("/titia/:id", controller.desativar);
router.delete("/titia/:id", controller.deletar);


export default router;
