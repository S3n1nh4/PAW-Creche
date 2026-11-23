import { z } from "zod";

export const statusPresencaSchema = z.enum(["presente", "falta", "falta_justificada"]);
export const idPresencaSchema = z.coerce.number().int().positive().max(2147483647);
const id = z.number().int().positive().max(2147483647);

// O autor é obtido da sessão; campos extras são rejeitados.
export const presencaSchema = z.strictObject({
  alunoId: id,
  turmaId: id,
  data: z.iso.date(),
  status: statusPresencaSchema,
  observacao: z.string().trim().max(1000).nullable().optional(),
});

// A correção não muda aluno, turma nem dia do registro original.
export const atualizarPresencaSchema = presencaSchema.pick({ status: true, observacao: true });
export const filtroPresencaSchema = z.strictObject({
  turmaId: idPresencaSchema.optional(),
  alunoId: idPresencaSchema.optional(),
  data: z.iso.date().optional(),
  pagina: idPresencaSchema.default(1),
  limite: z.coerce.number().int().min(1).max(100).default(50),
});

export type PresencaInput = z.infer<typeof presencaSchema>;
export type AtualizarPresencaInput = z.infer<typeof atualizarPresencaSchema>;
export type FiltroPresenca = z.infer<typeof filtroPresencaSchema>;
