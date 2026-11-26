import {z} from "zod";
import { dataCivilSchema } from "./dataCivil.js";
import { idadeAlunoPermitida } from "./idadeAluno.js";

const parentescoSchema = z.string().trim().min(2, 'Informe o parentesco do responsável').max(50);
const contatoSchema = z.string().regex(/^\d{10,11}$/, 'Informe um telefone com DDD e 10 ou 11 dígitos');

export const alunoSchema = z.object({

    nome: z
    .string({ error:"o nome é obrigatorio"})
    .min(3, "O nome deve ter pelo menos 3 caracteres")
    .max(100, "o nome deve  ter no máximo 100 caracteres")
    .meta({example: "Sena Ayrton"}),

    dataNascimento: dataCivilSchema
    .refine(idadeAlunoPermitida, 'A idade do aluno deve ser de 0 a 3 anos, sem data de nascimento futura')
    .meta({example: "15/10/2025",description: "Data de nascimento no formato DD/MM/AAAA; idade de 0 a 3 anos",}),

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

    responsavelTelefone: contatoSchema.meta({ example: "79999998888" }),
    responsavelParentesco: parentescoSchema.nullish(),
    responsavelSecundarioNome: z.string().trim().min(3).max(100).nullish(),
    responsavelSecundarioParentesco: parentescoSchema.nullish(),
    responsavelSecundarioTelefone: contatoSchema.nullish(),

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

function validarSecundario(dados: z.infer<typeof alunoSchema>, ctx: z.RefinementCtx) {
  const campos = ['responsavelSecundarioNome', 'responsavelSecundarioParentesco', 'responsavelSecundarioTelefone'] as const;
  if (campos.some(campo => !!dados[campo])) {
    for (const campo of campos) if (!dados[campo]) ctx.addIssue({ code: 'custom', path: [campo], message: 'Preencha os três dados do responsável secundário ou deixe todos vazios' });
  }
}

export const cadastroAlunoSchema = alunoSchema.extend({ responsavelParentesco: parentescoSchema }).superRefine(validarSecundario);
export const atualizarAlunoSchema = alunoSchema.superRefine(validarSecundario);

export type AlunoInput = z.infer<typeof alunoSchema>;

export type Aluno = AlunoInput & { id: number };
