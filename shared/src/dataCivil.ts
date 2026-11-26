import { z } from "zod";

export const dataCivilSchema = z.string().regex(/^\d{2}\/\d{2}\/\d{4}$/, "Use DD/MM/AAAA")
  .refine((valor) => {
    const [dia, mes, ano] = valor.split("/");
    return z.iso.date().safeParse(`${ano}-${mes}-${dia}`).success;
  }, "Data inexistente");

// Colunas DATE recebem a data civil representada em UTC, sem ambiguidade de fuso.
export function converterDataCivil(valor: string): Date {
  const [dia, mes, ano] = dataCivilSchema.parse(valor).split("/");
  return new Date(`${ano}-${mes}-${dia}T00:00:00.000Z`);
}
