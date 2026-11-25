// AAAA-MM-DD no fuso local (toISOString usaria UTC e poderia trocar o dia)
export function paraISO(d: Date) {
  const mes = String(d.getMonth() + 1).padStart(2, '0');
  const dia = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${mes}-${dia}`;
}

// "2026-11-12T00:00:00.000Z" -> "12/11/26" (usa UTC porque a API guarda só a data)
export function formatarData(iso: string) {
  const d = new Date(iso);
  const dia = String(d.getUTCDate()).padStart(2, '0');
  const mes = String(d.getUTCMonth() + 1).padStart(2, '0');
  const ano = String(d.getUTCFullYear()).slice(-2);
  return `${dia}/${mes}/${ano}`;
}

// A API devolve o salário (Decimal) como texto: "1600" -> "R$ 1.600,00"
export function formatarMoeda(valor: string | number) {
  return Number(valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

// Data-hora ISO -> "HH:MM" no fuso local (para <input type="time">)
export function horaDeISO(iso: string | null) {
  if (!iso) return '';
  const d = new Date(iso);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

// ("2026-11-18", "08:30") -> data-hora ISO; hora vazia vira null
export function isoDeHora(data: string, hora: string) {
  return hora ? new Date(`${data}T${hora}:00`).toISOString() : null;
}