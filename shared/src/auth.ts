import { z } from "zod";

export const loginSchema = z.object({
  email: z
    .email("O email informado é inválido")
    .meta({ example: "usuario@email.com" }),

  senha: z
    .string({ error: "A senha é obrigatória" })
    .min(8, "A senha tem que ter 8 dígitos no mínimo")
    .meta({ example: "senhaForte123" }),
});

export type LoginInput = z.infer<typeof loginSchema>;