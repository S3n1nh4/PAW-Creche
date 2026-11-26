import { z } from "zod";

export function validarAmbiente(env: NodeJS.ProcessEnv) {
  return z.object({
    DATABASE_URL: z.string().refine((valor) => {
      try { const url = new URL(valor); return ["postgres:", "postgresql:"].includes(url.protocol) && !!url.hostname && url.pathname.length > 1; }
      catch { return false; }
    }, "Informe uma URL PostgreSQL válida"),
    PORT: z.coerce.number().int().min(1).max(65535).default(3000),
    FRONTEND_URL: z.url().default("http://localhost:5173"),
  }).parse(env);
}
