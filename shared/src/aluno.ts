import {z} from "zod";

export const alunoSchema = z.object({

    nome: z
    .string({ error:"o nome é obrigatorio"})
    .min(3, "O nome deve ter pelo menos 3 caracteres")
    .max(100, "o nome deve  ter no máximo 100 caracteres")
    .meta({example: "Sena Ayrton"}),

    dataNascimento: z
    .string({ error: "A data de nascimento é obrigatória" })
    .regex(/^\d{2}\/\d{2}\/\d{4}$/,"A data deve estar no formato DD/MM/AAAA (exemplo: 15/10/2026)")
    .meta({example: "15/10/2018",description: "Data de nascimento no formato DD/MM/AAAA",}),

    turmaId: z
    .number({ error: "O ID da turma é obrigatório" })
    .int("O ID da turma deve ser um número inteiro")
    .positive("O ID da turma deve ser maior que zero")
    .nullable()
    .optional()
    .meta({ example: 1 }),

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
      z.email("E-mail com formato inválido").nullable(),)
    .meta({example: "garibaldo@gmail.com"}),

    observacoes: z
    .string()
    .min(10, "O observações  deve ter pelo menos 10 dígitos")
    .max(200, "O observações  deve ter no máximo 200 dígitos")
    .meta({example: "A aluna sena é exemplar"})
    .optional(),

    ativo: z.boolean().optional(),

});

export type AlunoInput = z.infer<typeof alunoSchema>;

export type Aluno = AlunoInput & { id: number };