
import { z } from "zod";

export const turmaSchema = z.object({

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

export type Turma = TurmaInput & { id: number };