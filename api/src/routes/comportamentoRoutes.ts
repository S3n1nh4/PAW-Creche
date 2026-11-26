import {Router} from "express";
import * as controller from "../controllers/comportamentoController.js";
import { validarBody } from "../middlewares/validarSchema.js";
import { comportamentoSchema } from "@creche/shared/comportamento";
import { autenticarPresenca } from "../middlewares/autenticarPresenca.js";

const router = Router();
router.use("/comportamentos", autenticarPresenca("ADMIN", "CUIDADOR"));
// O autor vem do login; o formulário não precisa informar cuidadorId.
const dadosComportamento = comportamentoSchema.omit({ cuidadorId: true });

router.get("/comportamentos", controller.listar);
router.get("/comportamentos/cuidador/:cuidadorId", controller.buscarPorCuidador);
router.get("/comportamentos/aluno/:alunoId", controller.buscarPorAluno);
router.get("/comportamentos/:id", controller.buscarPorId);
router.post("/comportamentos", autenticarPresenca("CUIDADOR"), validarBody(dadosComportamento), controller.criar);
router.put("/comportamentos/:id", autenticarPresenca("CUIDADOR"), validarBody(dadosComportamento),controller.atualizar);
router.delete("/comportamentos/:id", autenticarPresenca("CUIDADOR"), controller.deletar);


export default router;
