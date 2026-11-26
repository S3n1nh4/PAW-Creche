import { z } from "zod";

// Valida o endereço sem alterar o valor original: espaços externos são significativos.
export const emailSchema = z.string().max(320).refine(
  (valor) => z.email().safeParse(valor.trim()).success,
  "E-mail com formato inválido",
);
