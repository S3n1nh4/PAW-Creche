import express, { type Request, type Response, type NextFunction } from "express";
import dotenv from "dotenv";
import cors from "cors";
import swaggerUi from "swagger-ui-express";
import { swaggerSpec } from "./config/swagger.js";

import cuidadorRoutes from "./routes/cuidadorRoutes.js";
import turmaRoutes from "./routes/turmaRoutes.js";
import turmaCuidadorRoutes from "./routes/turmaCuidadorRoutes.js";
import alunoRoutes from "./routes/alunoRoutes.js";
import comportamentoRoutes from "./routes/comportamentoRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import authRoutes from "./routes/authRoutes.js";
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
app.use(turmaCuidadorRoutes);
app.use(adminRoutes);
app.use(comportamentoRoutes);
app.use(alunoRoutes);
app.use(authRoutes);
app.use(presencaRoutes);
app.use(presencaCuidadorRoutes);


// Middleware global de tratamento de erros
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  if (err instanceof PresencaError) return res.status(err.status).json({ mensagem: err.message });
  if (err instanceof ZodError) return res.status(400).json({ mensagem: "Parâmetros inválidos", detalhes: err.issues });
  if (req.path.startsWith("/presencas")) {
    if (err instanceof SyntaxError && "body" in err) return res.status(400).json({ mensagem: "JSON inválido." });
    console.error("Falha na operação de presença", err);
    return res.status(500).json({ mensagem: "Não foi possível concluir a operação." });
  }
  return res.status(400).json({ mensagem: err.message });
});

