import {z} from "zod";
import { dataCivilSchema } from "./dataCivil.js";

export const alunoSchema = z.object({

    nome: z
    .string({ error:"o nome é obrigatorio"})
    .min(3, "O nome deve ter pelo menos 3 caracteres")
    .max(100, "o nome deve  ter no máximo 100 caracteres")
    .meta({example: "Sena Ayrton"}),

    dataNascimento: dataCivilSchema
    .meta({example: "15/10/2018",description: "Data de nascimento no formato DD/MM/AAAA",}),

    turmaId: z
    .number()
    .int()
    .positive()
    .nullable()
    .default(null),

    responsavelNome: z
    .string({ error:"o nome é obrigatorio"})
    .min(3, "O nome deve ter pelo menos 3 caracteres")
    .max(100, "o nome deve  ter no máximo 100 caracteres")
    .meta({example: "Israell Carvalho"}),

    responsavelTelefone: z
    .string({ error: "O telefone é obrigatório" })
    .min(10, "O telefone deve ter pelo menos 10 dígitos")
    .max(15, "O telefone deve ter no máximo 15 dígitos")
    .meta({ example: "79999998888" }),

    responsavelEmail: z
    .preprocess((valor) => (valor === "" || valor === undefined ? null : valor),
      z.email("E-mail com formato inválido").nullable())
    .meta({example: "garibaldo@gmail.com"}),

    observacoes: z
    .string()
    .min(10, "As observações devem ter pelo menos 10 caracteres")
    .max(200, "As observações devem ter no máximo 200 caracteres")
    .nullable()
    .default(null),

    ativo: z.boolean().default(true),

});

export type AlunoInput = z.infer<typeof alunoSchema>;

export type Aluno = AlunoInput & { id: number };
