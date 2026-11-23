import { z } from "zod";
import { idPresencaSchema, statusPresencaSchema } from "./presenca.js";

const camposPonto = {
  status: statusPresencaSchema,
  entrada: z.iso.datetime({ offset: true }).nullable().default(null),
  saida: z.iso.datetime({ offset: true }).nullable().default(null),
  observacao: z.string().trim().max(1000).nullable().optional(),
};

export const presencaCuidadorSchema = z.strictObject({
  cuidadorId: z.number().int().positive().max(2147483647),
  data: z.iso.date(),
  ...camposPonto,
});

// PUT substitui a situação e os horários; horários omitidos ficam nulos.
export const atualizarPresencaCuidadorSchema = z.strictObject(camposPonto);
export const filtroPresencaCuidadorSchema = z.strictObject({
  cuidadorId: idPresencaSchema.optional(),
  data: z.iso.date().optional(),
  pagina: idPresencaSchema.default(1),
  limite: z.coerce.number().int().min(1).max(100).default(50),
});

export type PresencaCuidadorInput = z.infer<typeof presencaCuidadorSchema>;
export type AtualizarPresencaCuidadorInput = z.infer<typeof atualizarPresencaCuidadorSchema>;
export type FiltroPresencaCuidador = z.infer<typeof filtroPresencaCuidadorSchema>;
