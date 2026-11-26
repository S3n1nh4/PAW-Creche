import { z } from "zod";
export const alterarPerfilSchema = z.strictObject({ perfil: z.enum(["ADMIN", "CUIDADOR"]) });
