import { z } from "zod";

export const adminSchema = z.object({
    nome: z
    .string({ error:"o nome é obrigatorio"})
    .min(3, "O nome deve ter pelo menos 3 caracteres")
    .max(100, "o nome deve  ter no máximo 100 caracteres")
    .meta({example: "Ana Luiza"}),

    email: z
    .preprocess((valor) => (valor === "" || valor === undefined ? null : valor),
      z.email("E-mail com formato inválido").nullable(),)
    .meta({example: "analu@gmail.com"}),

});

export const cadastroAdminSchema = adminSchema.extend({
    senha: z
    .string({error:"A senha é obrigatória"})
    .min(8,"a senha deve ter pelo menos 8 caracteres")
    .max(72, "A senha deve ter no maximo 72 caracteres")
    .meta({ example: "senhaForte123"}),
});

export type AdminInput = z.infer<typeof adminSchema>;
export type CadastroAdminInput = z.infer<typeof cadastroAdminSchema>;


//É pra usar esse viu 
// Formato que a API devolve (sem senha) 
export type Admin = AdminInput & {id: number};