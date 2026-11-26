import { prisma } from "../config/prisma.js";
import type { Prisma } from "../generated/prisma/client.js";
import * as repo from "../repositories/turmaRepository.js"
import type {Turma} from "../generated/prisma/client.js";
import type { TurmaInput } from "@creche/shared/turma";
import { persistir, PresencaError } from "./presencaErrors.js";
import type { UsuarioSessao } from "./sessaoService.js";
import { horarioTurno } from '@creche/shared/atividade';
import { compativelComFaixa } from '@creche/shared/idadeAluno';


export async function buscarTurmas(): Promise<Turma[]> {
    return await repo.buscarTodas();
}

export async function buscarPorId(id: number): Promise<Turma | null> {
    const turma = await repo.buscarPorId(id);
    if(!turma){
        throw new PresencaError(404, `Turma com ID ${id} não encontrada.`);
    }   
    return turma;
}

export async function buscarTurmaPorNome(nome : string): Promise<Turma | null> {
    const turma = await repo.buscarPorNome(nome);
    if(!turma){
        throw new PresencaError(404, `Turma com nome ${nome} não encontrada.`);
    }
    return turma;
}

// O bloqueio da turma serializa substituições e inclusões simultâneas de cuidadores.
async function substituirCuidadores(tx: Prisma.TransactionClient, turmaId: number, ids: number[], ativo: boolean) {
    if (ids.length > 3 || new Set(ids).size !== ids.length) throw new PresencaError(400, "Selecione até 3 cuidadores diferentes.");
    const atuais = await tx.turmaCuidador.findMany({ where: { turmaId } });
    const permitidos = await tx.cuidador.findMany({ where: { id: { in: ids }, OR: [{ ativo: true }, { id: { in: atuais.map(v => v.cuidadorId) } }] } });
    if (permitidos.length !== ids.length) throw new PresencaError(400, "Selecione cuidadores existentes e ativos.");
    if (!ativo && ids.some(id => !atuais.some(v => v.cuidadorId === id))) throw new PresencaError(409, "Não é possível associar cuidadores a uma turma desativada.");
    await tx.turmaCuidador.deleteMany({ where: { turmaId } });
    await tx.turmaCuidador.createMany({ data: ids.map(cuidadorId => ({ turmaId, cuidadorId })) });
}

export async function criarTurma(dados: TurmaInput, usuario: UsuarioSessao): Promise<Turma> {
    const { cuidadorIds, ...campos } = dados;
    return persistir(() => prisma.$transaction(async tx => {
        const turma = await tx.turma.create({ data: { ...campos, sala: campos.sala ?? null, faixaEtaria: campos.faixaEtaria ?? null, criadoPorId: usuario.id } });
        if (cuidadorIds !== undefined) await substituirCuidadores(tx, turma.id, cuidadorIds, turma.ativo);
        return turma;
    }), "Já existe uma turma com esse nome, ano letivo e turno.");
}

export async function atualizarTurma(id: number, dados: TurmaInput): Promise<Turma> {
    const { cuidadorIds, ...campos } = dados;
    return persistir(() => prisma.$transaction(async tx => {
        await tx.$queryRaw`SELECT id FROM turma WHERE id = ${id} FOR UPDATE`;
        const anterior = await tx.turma.findUnique({ where: { id } });
        if (!anterior) throw new PresencaError(404, "Turma não encontrada.");
        if (campos.turno !== anterior.turno) {
            const horario = horarioTurno(campos.turno);
            const atividades = await tx.atividade.findMany({ where: { turmaId: id } });
            if (atividades.some(a => !horario || a.inicio < horario.inicio || a.fim > horario.fim)) {
                throw new PresencaError(409, 'Existem atividades fora do novo turno. Remova as atividades antes de mudar o turno.');
            }
        }
        const turma = await tx.turma.update({ where: { id }, data: { ...campos, sala: campos.sala === undefined ? anterior.sala : campos.sala, faixaEtaria: campos.faixaEtaria === undefined ? anterior.faixaEtaria : campos.faixaEtaria } });
        // Clientes que não enviam a seleção preservam os vínculos existentes.
        if (cuidadorIds !== undefined) await substituirCuidadores(tx, id, cuidadorIds, turma.ativo);
        return turma;
    }), "Já existe uma turma com esse nome, ano letivo e turno.");
}

export async function deletarTurma(id: number): Promise<Turma> {
    const turma = await repo.buscarPorId(id);
    if (!turma) {
        throw new PresencaError(404, `Turma com ID ${id} não encontrada.`);
   }
    return await repo.atualizar(id, { ativo: false });
    
}

export async function adicionarAluno(turmaId: number, alunoId: number) {
    return persistir(() => prisma.$transaction(async tx => {
        await tx.$queryRaw`SELECT id FROM turma WHERE id = ${turmaId} FOR UPDATE`;
        const turma = await tx.turma.findUnique({ where: { id: turmaId } });
        if (!turma) throw new PresencaError(404, 'Turma não encontrada.');
        if (!turma.ativo) throw new PresencaError(409, 'A turma está desativada.');
        await tx.$queryRaw`SELECT id FROM aluno WHERE id = ${alunoId} FOR UPDATE`;
        const aluno = await tx.aluno.findUnique({ where: { id: alunoId } });
        if (!aluno) throw new PresencaError(404, 'Aluno não encontrado.');
        if (!aluno.ativo) throw new PresencaError(409, 'O aluno está desativado.');
        if (!compativelComFaixa(aluno.dataNascimento.toISOString(), turma.faixaEtaria)) throw new PresencaError(409, 'A idade do aluno não é compatível com a faixa etária da turma. Verifique a faixa cadastrada.');
        if (aluno.turmaId !== null && aluno.turmaId !== turmaId) throw new PresencaError(409, 'O aluno já está em outra turma. Altere a turma pelo cadastro do aluno.');
        return tx.aluno.update({ where: { id: alunoId }, data: { turmaId } });
    }));
}

// Altera apenas o vínculo atual; as presenças continuam nas turmas de origem.
export async function moverAluno(turmaId: number, alunoId: number, destinoId: number | null) {
    if (destinoId === turmaId) throw new PresencaError(400, 'Selecione uma turma diferente da atual.');
    return persistir(() => prisma.$transaction(async tx => {
        await tx.$queryRaw`SELECT id FROM turma WHERE id IN (${turmaId}, ${destinoId}) ORDER BY id FOR UPDATE`;
        const origem = await tx.turma.findUnique({ where: { id: turmaId } });
        if (!origem) throw new PresencaError(404, 'Turma de origem não encontrada.');
        if (destinoId !== null) {
            const destino = await tx.turma.findUnique({ where: { id: destinoId } });
            if (!destino) throw new PresencaError(404, 'Turma de destino não encontrada.');
            if (!destino.ativo) throw new PresencaError(409, 'A turma de destino está desativada.');
        }
        await tx.$queryRaw`SELECT id FROM aluno WHERE id = ${alunoId} FOR UPDATE`;
        const aluno = await tx.aluno.findUnique({ where: { id: alunoId } });
        if (!aluno) throw new PresencaError(404, 'Aluno não encontrado.');
        if (!aluno.ativo || aluno.turmaId !== turmaId) throw new PresencaError(409, 'O aluno não está ativo nesta turma. Atualize a página.');
        if (destinoId !== null) {
            const destino = await tx.turma.findUniqueOrThrow({ where: { id: destinoId } });
            if (!compativelComFaixa(aluno.dataNascimento.toISOString(), destino.faixaEtaria)) throw new PresencaError(409, 'A idade do aluno não é compatível com a faixa etária da turma de destino.');
        }
        return tx.aluno.update({ where: { id: alunoId }, data: { turmaId: destinoId } });
    }));
}
