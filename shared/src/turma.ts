
import { z } from "zod";

export const faixasEtarias = [
  { valor: 'bercario_i', rotulo: 'Berçário I — 0 a 1 ano' },
  { valor: 'bercario_ii', rotulo: 'Berçário II — 1 a 2 anos' },
  { valor: 'maternal_i', rotulo: 'Maternal I — 2 a 3 anos' },
  { valor: 'maternal_ii', rotulo: 'Maternal II — 3 a 4 anos' },
] as const;
export const faixaEtariaSchema = z.enum(['bercario_i', 'bercario_ii', 'maternal_i', 'maternal_ii']);

export const turmaSchema = z.object({
    sala: z.string().trim().min(1, 'Informe a sala').max(50, 'A sala deve ter no máximo 50 caracteres').nullish(),
    cuidadorIds: z.array(z.number().int().positive()).max(3, 'Cada turma permite no máximo 3 cuidadores').refine(ids => new Set(ids).size === ids.length, 'Não repita cuidadores').optional(),
    // Cadastros antigos podem não possuir essa informação.
    faixaEtaria: faixaEtariaSchema.nullish(),

    nome: z
    .string({ error: "O nome da turma é obrigatório" })
    .min(2, "O nome deve ter pelo menos 2 caracteres")
    .max(50, "O nome deve ter no máximo 50 caracteres")
    .meta({ example: "Maternal I" }),

    anoLetivo: z
    .number({ error: "O ano letivo é obrigatório" })
    .int("O ano letivo deve ser um número inteiro")
    .positive("O ano letivo deve ser maior que zero")
    .meta({ example: 2026 }),

    turno: z
    .string({ error: "O turno é obrigatório" })
    .min(3, "O turno deve ter pelo menos 3 caracteres")
    .max(20, "O turno deve ter no máximo 20 caracteres")
    .meta({ example: "Matutino" }),

    ativo: z
    .boolean()
    .default(true),

});

export type TurmaInput = z.infer<typeof turmaSchema>;

export type Turma = TurmaInput & { id: number; criadoEm?: string; criadoPor?: { id: number; nome: string } | null };
