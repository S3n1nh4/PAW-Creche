import { z } from "zod";


export const turmaCuidadorSchema = z.object({

    turmaId: z
    .number({ error: "O ID da turma é obrigatório" })
    .int("O ID da turma deve ser um número inteiro")
    .positive("O ID da turma deve ser maior que zero")
    .meta({ example: 1 }),

    cuidadorId: z
    .number({ error: "O ID do cuidador é obrigatório" })
    .int("O ID do cuidador deve ser um número inteiro")
    .positive("O ID do cuidador deve ser maior que zero")
    .meta({ example: 2 }),

});

export type TurmaCuidadorInput = z.infer<typeof turmaCuidadorSchema>;

export type TurmaCuidador = TurmaCuidadorInput;