import { Router } from "express";
import { autenticarPresenca } from "../middlewares/autenticarPresenca.js";
import { validarBody } from "../middlewares/validarSchema.js";
import { alterarPerfilSchema } from "@creche/shared/conta";
import { idPresencaSchema } from "@creche/shared/presenca";
import { alterarPerfil, buscarConta } from "../services/contaService.js";

const router = Router();
router.use("/contas", autenticarPresenca("ADMIN"));
router.get("/contas/:id", async (req, res) => res.json(await buscarConta(idPresencaSchema.parse(req.params.id))));
router.put("/contas/:id/perfil", validarBody(alterarPerfilSchema), async (req, res) => {
  return res.json(await alterarPerfil(idPresencaSchema.parse(req.params.id), req.body.perfil));
});
export default router;
