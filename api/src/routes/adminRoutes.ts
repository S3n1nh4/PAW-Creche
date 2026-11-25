import {Router} from "express";
import * as controller from "../controllers/adminController.js";
import { validarBody } from "../middlewares/validarSchema.js";
import { autenticarPresenca } from "../middlewares/autenticarPresenca.js";
import { adminSchema, cadastroAdminSchema , atualizarAdminSchema} from "@creche/shared/admin";

const router = Router();
router.use("/admins", autenticarPresenca("ADMIN"));

router.get("/admins", controller.listar);
router.get("/admins/:id", controller.buscarPorId);
router.get("/admins/email/:email", controller.buscarPorEmail);
router.post("/admins",validarBody(cadastroAdminSchema), controller.criar);
router.put("/admins/:id",validarBody(atualizarAdminSchema), controller.atualizar);
router.put("/admins/desativar/:id", controller.desativar);
router.delete("/admins/:id", controller.deletar);


export default router;
