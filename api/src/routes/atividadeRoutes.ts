import { Router } from 'express';
import { atividadeSchema, horarioTurno } from '@creche/shared/atividade';
import { idPresencaSchema } from '@creche/shared/presenca';
import { autenticarPresenca } from '../middlewares/autenticarPresenca.js';
import { prisma } from '../config/prisma.js';
import { validarTurma } from '../services/acessoDados.js';
import { PresencaError } from '../services/presencaErrors.js';

const router = Router();
router.use('/planner', autenticarPresenca('ADMIN', 'CUIDADOR'));
router.get('/planner/turmas', async (req, res) => {
  const usuario = req.usuario!;
  return res.json(await prisma.turma.findMany({ where: { ativo: true, ...(usuario.tipoUsuario === 'CUIDADOR' ? { cuidadores: { some: { cuidadorId: usuario.id } } } : {}) }, orderBy: { nome: 'asc' } }));
});
router.get('/planner/turmas/:id/atividades', async (req, res) => {
  const turmaId = idPresencaSchema.parse(req.params.id);
  const usuario = req.usuario!;
  // Administradores também consultam o planejamento de turmas desativadas.
  if (usuario.tipoUsuario === 'CUIDADOR') await validarTurma(turmaId, usuario);
  else if (!await prisma.turma.findUnique({ where: { id: turmaId } })) throw new PresencaError(404, 'Turma não encontrada.');
  return res.json(await prisma.atividade.findMany({ where: { turmaId }, include: { cuidador: { select: { id: true, nome: true } } }, orderBy: [{ diaSemana: 'asc' }, { inicio: 'asc' }] }));
});
router.post('/planner/turmas/:id/atividades', autenticarPresenca('CUIDADOR'), async (req, res) => {
  const turmaId = idPresencaSchema.parse(req.params.id);
  const dados = atividadeSchema.parse(req.body);
  const usuario = req.usuario!;
  const atividade = await prisma.$transaction(async tx => {
    await tx.$queryRaw`SELECT id FROM turma WHERE id = ${turmaId} FOR UPDATE`;
    await validarTurma(turmaId, usuario);
    const turma = await tx.turma.findUniqueOrThrow({ where: { id: turmaId } });
    const horario = horarioTurno(turma.turno);
    if (!horario || dados.inicio < horario.inicio || dados.fim > horario.fim) throw new PresencaError(400, 'A atividade deve ficar dentro do horário do turno.');
    const conflito = await tx.atividade.findFirst({ where: { turmaId, diaSemana: dados.diaSemana, inicio: { lt: dados.fim }, fim: { gt: dados.inicio } } });
    if (conflito) throw new PresencaError(409, 'Já existe uma atividade nesse horário.');
    return tx.atividade.create({ data: { ...dados, turmaId, cuidadorId: usuario.id }, include: { cuidador: { select: { id: true, nome: true } } } });
  });
  return res.status(201).json(atividade);
});
router.delete('/planner/turmas/:id/atividades/:atividadeId', autenticarPresenca('CUIDADOR'), async (req, res) => {
  const turmaId = idPresencaSchema.parse(req.params.id);
  await validarTurma(turmaId, req.usuario!);
  const id = idPresencaSchema.parse(req.params.atividadeId);
  const resultado = await prisma.atividade.deleteMany({ where: { id, turmaId, cuidadorId: req.usuario!.id } });
  if (!resultado.count) throw new PresencaError(404, 'Atividade não encontrada ou cadastrada por outro cuidador.');
  return res.status(204).send();
});
export default router;
