export class PresencaError extends Error {
  constructor(public readonly status: number, mensagem: string) {
    super(mensagem);
  }
}

// A unicidade do banco continua sendo a garantia contra requisições simultâneas.
export async function persistir<T>(operacao: () => Promise<T>): Promise<T> {
  try {
    return await operacao();
  } catch (erro) {
    const codigo = (erro as { code?: string } | null)?.code;
    if (codigo === "P2002") throw new PresencaError(409, "Já existe um registro para essa pessoa nesta data.");
    if (codigo === "P2025") throw new PresencaError(404, "Registro não encontrado.");
    if (codigo === "P2003") throw new PresencaError(409, "Um cadastro relacionado foi alterado ou removido. Atualize os dados.");
    throw erro;
  }
}

export function dataCivil(valor: string): Date {
  return new Date(`${valor}T00:00:00.000Z`);
}
