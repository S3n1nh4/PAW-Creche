
import { z } from "zod";

export const comportamentoSchema = z.object({

    alunoId: z
    .number({ error: "O ID do aluno é obrigatório" })
    .int("O ID do aluno deve ser um número inteiro")
    .positive("O ID do aluno deve ser maior que zero")
    .meta({ example: 1 }),

    cuidadorId: z
    .number({ error: "O ID do cuidador é obrigatório" })
    .int("O ID do cuidador deve ser um número inteiro")
    .positive("O ID do cuidador deve ser maior que zero")
    .meta({ example: 2 }),

    data: z
    .string()
    .regex(
      /^\d{2}\/\d{2}\/\d{4}$/,
      "A data deve estar no formato DD/MM/AAAA (exemplo: 15/10/2026)"
    )
    .optional()
    .meta({example: "15/10/2026",description: "Data do comportamento no formato DD/MM/AAAA",}),

    descricao: z
    .string({ error: "A descrição do comportamento é obrigatória" })
    .min(10, "A descrição deve ter pelo menos 10 caracteres")
    .max(500, "A descrição deve ter no máximo 500 caracteres")
    .meta({
      example: "O aluno participou das atividades e interagiu bem com os colegas.",
    }),

});

export type ComportamentoInput = z.infer<typeof comportamentoSchema>;

export type Comportamento = ComportamentoInput & { id: number };
