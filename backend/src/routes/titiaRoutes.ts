import {Router} from "express";
import * as controller from "../controllers/titiaContoller.js";

const router = Router();

router.get("/titia", controller.listar);
router.post("/titia/:id", controller.listar);
router.post("/titia", controller.listar);
router.put("/titia/:id", controller.listar);
router.delete("/titia/:id", controller.listar);


export default router;
