import "dotenv/config";
import { app } from "./app.js";

const PORT = Number(process.env.PORT || 3000);
app.listen(PORT, () => {
  console.log(`A API subiu na porta ${PORT}`);
  console.log(`Documentação disponível em: http://localhost:${PORT}/docs`);
});
