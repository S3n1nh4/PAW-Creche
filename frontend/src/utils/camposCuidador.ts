export function somenteDigitos(valor: string) {
  return valor.replace(/\D/g, '');
}

export function formatarCelular(valor: string) {
  const digitos = somenteDigitos(valor).slice(0, 11);
  if (!digitos) return '';
  if (digitos.length <= 2) return `(${digitos}`;
  const inicio = `(${digitos.slice(0, 2)}) ${digitos.slice(2, 3)}`;
  if (digitos.length <= 3) return inicio;
  const numero = digitos.slice(3);
  return `${inicio} ${numero.slice(0, 4)}${numero.length > 4 ? `-${numero.slice(4)}` : ''}`;
}

export function formatarContato(valor: string) {
  const digitos = somenteDigitos(valor).slice(0, 11);
  if (digitos.length > 10) return formatarCelular(digitos);
  if (!digitos) return '';
  if (digitos.length <= 2) return `(${digitos}`;
  const numero = digitos.slice(2);
  return `(${digitos.slice(0, 2)}) ${numero.slice(0, 4)}${numero.length > 4 ? `-${numero.slice(4)}` : ''}`;
}

export function formatarSalarioInicial(valor: string | number) {
  return Number(valor).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function formatarSalarioDigitado(valor: string) {
  const digitos = somenteDigitos(valor).slice(0, 12);
  return digitos ? formatarSalarioInicial(Number(digitos) / 100) : '';
}

export function lerSalario(valor: string) {
  return valor ? Number(valor.replace(/\./g, '').replace(',', '.')) : NaN;
}
