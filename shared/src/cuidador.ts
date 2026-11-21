import { z } from "zod";

export const cuidadorSchema =  z.object({
    nome: z
    .string({ error:"o nome é obrigatorio"})
    .min(3, "O nome deve ter pelo menos 3 caracteres")
    .max(100, "o nome deve  ter no máximo 100 caracteres")
    .meta({example: "Ana Betatriz"}),

    telefone: z
    .string({ error: "O telefone é obrigatório" })
    .min(10, "O telefone deve ter pelo menos 10 dígitos")
    .max(15, "O telefone deve ter no máximo 15 dígitos")
    .meta({ example: "79999998888" }),

    email: z
    .preprocess((valor) => (valor === "" || valor === undefined ? null : valor),
      z.email("E-mail com formato inválido"),)
    .meta({example: "betatriz@gmail.com"}),


    salarioBase: z
    .number()
    .min(0, "O salário não pode ser negativo")
    ,

    ativo: z.boolean().default(true),

});

export const cadastroCuidadorSchema = cuidadorSchema.extend({
    senha: z
    .string({error:"A senha é obrigatória"})
    .min(8,"a senha deve ter pelo menos 8 caracteres")
    .max(72, "A senha deve ter no maximo 72 caracteres")
    .meta({ example: "senhaForte123"}),
});

export type CuidadorInput = z.infer<typeof cuidadorSchema>;
export type CadastroCuidadorInput = z.infer<typeof cadastroCuidadorSchema>;

export type Cuidador = CuidadorInput & {id: number};