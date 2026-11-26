export function hojeBrasil(): string {
  const partes = new Intl.DateTimeFormat('en-US', { timeZone: 'America/Sao_Paulo', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(new Date());
  const obter = (tipo: string) => partes.find(p => p.type === tipo)?.value;
  return `${obter('year')}-${obter('month')}-${obter('day')}`;
}

export function dataAlunoISO(valor: string): string {
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(valor)) {
    const [dia, mes, ano] = valor.split('/');
    return `${ano}-${mes}-${dia}`;
  }
  return valor.slice(0, 10);
}

export function idadeAluno(valor: string, hoje = hojeBrasil()): number {
  const data = dataAlunoISO(valor);
  const [ano, mes, dia] = data.split('-').map(Number);
  const [anoHoje, mesHoje, diaHoje] = hoje.split('-').map(Number);
  if (!ano || !mes || !dia || !anoHoje || !mesHoje || !diaHoje) return NaN;
  return anoHoje - ano - (mesHoje < mes || (mesHoje === mes && diaHoje < dia) ? 1 : 0);
}

export function idadeAlunoPermitida(valor: string, hoje = hojeBrasil()): boolean {
  const idade = idadeAluno(valor, hoje);
  return dataAlunoISO(valor) <= hoje && idade >= 0 && idade <= 3;
}

// Limites sem sobreposição: Berçário I < 1, II < 2, Maternal I < 3 e II < 4 anos.
export function compativelComFaixa(valor: string, faixa: string | null | undefined, hoje = hojeBrasil()): boolean {
  const idades: Record<string, number> = { bercario_i: 0, bercario_ii: 1, maternal_i: 2, maternal_ii: 3 };
  return !!faixa && Object.hasOwn(idades, faixa) && idadeAlunoPermitida(valor, hoje) && idadeAluno(valor, hoje) === idades[faixa];
}
