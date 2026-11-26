import { useState } from 'react';
import { FiUserCheck, FiRepeat, FiUserMinus, FiUserPlus } from 'react-icons/fi';
import type { Turma } from '@creche/shared/turma';
import { faixasEtarias } from '@creche/shared/turma';
import { idadeAluno, compativelComFaixa } from '@creche/shared/idadeAluno';
import type { TurmaCuidador } from '@creche/shared/turmaCuidador';
import { adicionarAlunoNaTurma, atualizarTurma, criarAluno, excluirAlunoDaTurma, transferirAlunoDaTurma, mensagemDeErro, type AlunoResumo, type CuidadorResumo } from '../services/api';
import ModalFormAluno from '../components/modais/ModalFormAluno';
import ModalFormTurma from '../components/modais/ModalFormTurma';
import ModalConfirmacao from '../components/modais/ModalConfirmacao';
import PlannerTurma from '../components/PlannerTurma';

interface Props {
  turma: Turma;
  turmas: Turma[];
  alunos: AlunoResumo[];
  cuidadores: CuidadorResumo[];
  vinculos: TurmaCuidador[];
  onVoltar: () => void;
  onAtualizar: () => void;
}

export default function DetalhesTurma({ turma, turmas, alunos, cuidadores, vinculos, onVoltar, onAtualizar }: Props) {
  const [editandoCuidadores, setEditandoCuidadores] = useState(false);
  const [transferindo, setTransferindo] = useState<AlunoResumo | null>(null);
  const [excluindo, setExcluindo] = useState<AlunoResumo | null>(null);
  const [destinoId, setDestinoId] = useState('');
  const [adicionando, setAdicionando] = useState(false);
  const [cadastrando, setCadastrando] = useState(false);
  const [candidato, setCandidato] = useState<AlunoResumo | null>(null);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState('');
  const equipe = cuidadores.filter(c => vinculos.some(v => v.turmaId === turma.id && v.cuidadorId === c.id));
  const matriculados = alunos.filter(a => a.ativo && a.turmaId === turma.id);
  const disponiveis = alunos.filter(a => a.ativo && a.turmaId !== turma.id && compativelComFaixa(a.dataNascimento, turma.faixaEtaria)).sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));
  const dataCriacao = turma.criadoEm ? new Date(turma.criadoEm) : null;

  async function adicionar(aluno: AlunoResumo) {
    if (aluno.turmaId === null) await adicionarAlunoNaTurma(turma.id, aluno.id);
    else await transferirAlunoDaTurma(aluno.turmaId, aluno.id, turma.id);
    setAdicionando(false); onAtualizar();
  }

  return <section className="font-texto">
    <button type="button" onClick={onVoltar} className="mb-5 text-pp-700 underline">Voltar para Gestão de Turmas</button>
    <h1 className="font-titulo text-[22px] mb-5">{turma.nome}</h1>
    <dl className="grid gap-4 rounded-xl bg-white p-5 sm:grid-cols-2">
      <div><dt className="font-bold">Criada em</dt><dd>{dataCriacao && Number.isFinite(dataCriacao.getTime()) ? dataCriacao.toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' }) : 'Data não informada'}</dd></div>
      <div><dt className="font-bold">Administrador responsável pela criação</dt><dd>{turma.criadoPor?.nome ?? 'Não registrado no cadastro antigo'}</dd></div>
      <div><dt className="font-bold">Turno</dt><dd>{turma.turno === 'manha' ? 'Manhã' : turma.turno === 'tarde' ? 'Tarde' : turma.turno}</dd></div>
      <div><dt className="font-bold">Faixa etária</dt><dd>{faixasEtarias.find(f => f.valor === turma.faixaEtaria)?.rotulo ?? 'Não informada'}</dd></div>
      <div><dt className="font-bold">Situação</dt><dd>{turma.ativo ? 'Ativa' : 'Inativa'}</dd></div>
      <div><dt className="font-bold">Sala</dt><dd>{turma.sala ?? 'Não informada'}</dd></div>
    </dl>
    <PlannerTurma key={turma.id} turma={turma} />
    <div className="flex flex-wrap items-center justify-between gap-3 mt-6 mb-3">
      <h2 className="font-titulo text-lg">Cuidadores ({equipe.length}/3)</h2>
      <button type="button" aria-label="Adicionar/Atualizar Cuidador" title="Adicionar/Atualizar Cuidador" onClick={() => setEditandoCuidadores(true)} className="rounded-md bg-pp-botao p-2 text-white"><FiUserCheck size={18} aria-hidden="true" /></button>
    </div>
    {equipe.length ? <ul className="rounded-xl bg-white p-5 space-y-2">{equipe.map(c => <li key={c.id}>{c.nome}{!c.ativo ? ' (inativo)' : ''}</li>)}</ul> : <p>Nenhum cuidador associado.</p>}
    <div className="flex flex-wrap items-center justify-between gap-3 mt-6 mb-3">
      <h2 className="font-titulo text-lg">Alunos ({matriculados.length})</h2>
      <button type="button" disabled={!turma.ativo} onClick={() => { setAdicionando(true); setErro(''); }} className="rounded-md bg-pp-botao px-4 py-2 text-white disabled:opacity-50">Adicionar Aluno</button>
    </div>
    {matriculados.length ? <ul className="rounded-xl bg-white p-5 space-y-3">{matriculados.map(a => <li key={a.id} className="flex flex-wrap items-center justify-between gap-3 border-b border-pp-100 pb-3 last:border-0">
      <span>{a.nome} — {idadeAluno(a.dataNascimento)} {idadeAluno(a.dataNascimento) === 1 ? 'ano' : 'anos'}</span>
      <div className="flex flex-wrap gap-4 text-sm">
        <button type="button" aria-label={`Transferir ${a.nome}`} title="Transferir" onClick={() => { setTransferindo(a); setDestinoId(''); setErro(''); }} className="p-2 text-pp-700"><FiRepeat size={18} aria-hidden="true" /></button>
        <button type="button" aria-label={`Excluir ${a.nome} da turma`} title="Excluir da turma" onClick={() => setExcluindo(a)} className="p-2 text-red-700"><FiUserMinus size={18} aria-hidden="true" /></button>
      </div>
    </li>)}</ul> : <p>Nenhum aluno nesta turma.</p>}
    {editandoCuidadores && <ModalFormTurma isOpen turmaInicial={turma} cuidadores={cuidadores} cuidadorIdsIniciais={equipe.map(c => c.id)} onClose={() => setEditandoCuidadores(false)} onSubmitTurma={async dados => { await atualizarTurma(turma.id, dados); onAtualizar(); }} />}
    {excluindo && <ModalConfirmacao isOpen titulo={`Excluir ${excluindo.nome} da turma? O cadastro e o histórico serão preservados.`} onClose={() => setExcluindo(null)} onConfirmar={async () => { await excluirAlunoDaTurma(turma.id, excluindo.id); onAtualizar(); }} />}
    {transferindo && <div role="dialog" aria-modal="true" aria-labelledby="transferir-aluno-titulo" className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <form className="w-full max-w-lg rounded-xl bg-pp-50 p-6" onSubmit={async e => {
        e.preventDefault();
        if (!destinoId || salvando) return;
        setSalvando(true); setErro('');
        try { await transferirAlunoDaTurma(turma.id, transferindo.id, Number(destinoId)); setTransferindo(null); onAtualizar(); }
        catch (e) { setErro(mensagemDeErro(e, 'Não foi possível transferir o aluno.')); }
        finally { setSalvando(false); }
      }}>
        <h2 id="transferir-aluno-titulo" className="font-titulo text-lg mb-4">Transferir {transferindo.nome}</h2>
        {erro && <p role="alert" className="text-red-700 mb-3">{erro}</p>}
        <label>Turma de destino<select className="mt-2 w-full rounded-md border bg-white p-2" value={destinoId} disabled={salvando} onChange={e => setDestinoId(e.target.value)}>
          <option value="">Selecione a turma</option>
          {turmas.filter(t => t.ativo && t.id !== turma.id && compativelComFaixa(transferindo.dataNascimento, t.faixaEtaria)).map(t => <option key={t.id} value={t.id}>{t.nome} — {t.turno === 'manha' ? 'Manhã' : t.turno === 'tarde' ? 'Tarde' : t.turno}</option>)}
        </select></label>
        {!turmas.some(t => t.ativo && t.id !== turma.id && compativelComFaixa(transferindo.dataNascimento, t.faixaEtaria)) && <p className="mt-2 text-sm">Nenhuma outra turma ativa compatível com a idade do aluno.</p>}
        <div className="mt-5 flex gap-4">
          <button type="submit" disabled={salvando || !destinoId} className="rounded-md bg-pp-botao px-4 py-2 text-white disabled:opacity-50">{salvando ? 'Transferindo...' : 'Confirmar transferência'}</button>
          <button type="button" disabled={salvando} onClick={() => setTransferindo(null)}>Cancelar</button>
        </div>
      </form>
    </div>}
    {adicionando && <div role="dialog" aria-modal="true" aria-labelledby="adicionar-aluno-titulo" className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-xl bg-pp-50 p-6">
        <h2 id="adicionar-aluno-titulo" className="font-titulo text-lg mb-4">Adicionar aluno à turma {turma.nome}</h2>
        {erro && <p role="alert" className="text-red-700 mb-3">{erro}</p>}
        <p className="text-sm mb-4">{faixasEtarias.find(f => f.valor === turma.faixaEtaria)?.rotulo ?? 'Defina a faixa etária da turma para consultar os alunos disponíveis.'}</p>
        <ul className="space-y-3">{disponiveis.map(a => <li key={a.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg bg-white p-3">
          <div><p className="font-bold">{a.nome}</p><p className="text-sm">{idadeAluno(a.dataNascimento)} {idadeAluno(a.dataNascimento) === 1 ? 'ano' : 'anos'} · {turmas.find(t => t.id === a.turmaId)?.nome ?? 'Sem turma'}</p></div>
          <button type="button" aria-label={a.turmaId === null ? `Adicionar ${a.nome} na turma` : `Transferir ${a.nome} pra essa turma`} title={a.turmaId === null ? 'Adicionar na turma' : 'Transferir pra essa turma'} onClick={() => setCandidato(a)} className="rounded-md bg-pp-botao p-2 text-white">{a.turmaId === null ? <FiUserPlus size={18} aria-hidden="true" /> : <FiRepeat size={18} aria-hidden="true" />}</button>
        </li>)}</ul>
        {turma.faixaEtaria && !disponiveis.length && <p className="text-sm mt-2">Nenhum aluno disponível para a faixa etária desta turma.</p>}
        <div className="flex flex-wrap gap-3 mt-5">
          <button type="button" disabled={salvando} onClick={() => { setAdicionando(false); setCadastrando(true); }} className="underline">Cadastrar novo aluno</button>
          <button type="button" disabled={salvando} onClick={() => setAdicionando(false)}>Cancelar</button>
        </div>
      </div>
    </div>}
    {candidato && <ModalConfirmacao isOpen titulo={candidato.turmaId === null ? `Adicionar ${candidato.nome} na turma ${turma.nome}?` : `Transferir ${candidato.nome} de ${turmas.find(t => t.id === candidato.turmaId)?.nome ?? 'sua turma atual'} para ${turma.nome}? O histórico será preservado.`} onClose={() => setCandidato(null)} onConfirmar={() => adicionar(candidato)} />}
    {cadastrando && <ModalFormAluno turmas={[turma]} turmaFixa={turma} onClose={() => setCadastrando(false)} onSalvar={async dados => {
      await criarAluno({ ...dados, turmaId: turma.id }); onAtualizar();
    }} />}
  </section>;
}
