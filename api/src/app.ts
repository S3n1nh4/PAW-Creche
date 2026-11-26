import express, { type Request, type Response, type NextFunction } from "express";
import dotenv from "dotenv";
import cors from "cors";
import swaggerUi from "swagger-ui-express";
import { swaggerSpec } from "./config/swagger.js";

import cuidadorRoutes from "./routes/cuidadorRoutes.js";
import turmaRoutes from "./routes/turmaRoutes.js";
import atividadeRoutes from "./routes/atividadeRoutes.js";
import turmaCuidadorRoutes from "./routes/turmaCuidadorRoutes.js";
import alunoRoutes from "./routes/alunoRoutes.js";
import comportamentoRoutes from "./routes/comportamentoRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import contaRoutes from "./routes/contaRoutes.js";
import presencaRoutes from "./routes/presencaRoutes.js";
import presencaCuidadorRoutes from "./routes/presencaCuidadorRoutes.js";
import { PresencaError } from "./services/presencaErrors.js";
import { ZodError } from "zod";

dotenv.config();


export const app = express();

// Libera o front (outra origem: porta 5173) para chamar a API pelo navegador
app.use(cors({ origin: process.env.FRONTEND_URL || "http://localhost:5173" }));
app.use(express.json());


// Documentação interativa Swagger UI
app.use("/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Rotas da aplicação
app.use(cuidadorRoutes);
app.use(turmaRoutes);
app.use(atividadeRoutes);
app.use(turmaCuidadorRoutes);
app.use(adminRoutes);
app.use(comportamentoRoutes);
app.use(alunoRoutes);
app.use(authRoutes);
app.use(contaRoutes);
app.use(presencaRoutes);
app.use(presencaCuidadorRoutes);

app.use((_req, res) => res.status(404).json({ mensagem: "Rota não encontrada." }));


// Middleware global de tratamento de erros
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  if (err instanceof PresencaError) return res.status(err.status).json({ mensagem: err.message });
  if (err instanceof ZodError) return res.status(400).json({ mensagem: "Parâmetros inválidos", detalhes: err.issues });
  const codigo = (err as Error & { code?: string }).code;
  if (codigo === "P2025") return res.status(404).json({ mensagem: "Registro não encontrado." });
  if (codigo === "P2002") return res.status(409).json({ mensagem: "Já existe um registro com esses dados." });
  if (codigo === "P2003") return res.status(409).json({ mensagem: "Operação incompatível com os vínculos existentes." });
  if ((err as Error & { type?: string }).type === "entity.too.large") return res.status(413).json({ mensagem: "Corpo da requisição acima do limite permitido." });
  if (err instanceof SyntaxError && "body" in err) return res.status(400).json({ mensagem: "JSON inválido." });
  console.error("Falha na operação da API", err);
  return res.status(500).json({ mensagem: "Não foi possível concluir a operação." });
});

