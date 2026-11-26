import { z } from 'zod';

export const diasPlanner = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta'] as const;
export function horarioTurno(turno: string): { inicio: string; fim: string } | null {
  const valor = turno.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  if (['manha', 'matutino'].includes(valor)) return { inicio: '07:00', fim: '12:00' };
  if (['tarde', 'vespertino'].includes(valor)) return { inicio: '13:30', fim: '18:30' };
  return null;
}
const hora = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Horário inválido');
export const atividadeSchema = z.object({
  diaSemana: z.number().int().min(1).max(5),
  inicio: hora,
  fim: hora,
  descricao: z.string().trim().min(3, 'Descreva a atividade').max(200),
}).strict().refine(d => d.inicio < d.fim, 'O término deve ser depois do início');
export type AtividadeInput = z.infer<typeof atividadeSchema>;
export type Atividade = AtividadeInput & { id: number; turmaId: number; cuidadorId: number; cuidador: { id: number; nome: string } };
