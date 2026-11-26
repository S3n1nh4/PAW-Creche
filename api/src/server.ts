import "dotenv/config";
import { validarAmbiente } from "./config/ambiente.js";
import { ZodError } from "zod";

try {
  const ambiente = validarAmbiente(process.env);
  const { app } = await import("./app.js");
  const servidor = app.listen(ambiente.PORT, () => {
    console.log(`A API subiu na porta ${ambiente.PORT}`);
  });
  servidor.on("error", () => { console.error("Não foi possível abrir a porta da API."); process.exitCode = 1; });
} catch (erro) {
  console.error(erro instanceof ZodError
    ? erro.issues.map(i => `${i.path.join(".")}: ${i.message}`).join("\n")
    : "Não foi possível inicializar a API.");
  process.exitCode = 1;
}
