import { useState, type SyntheticEvent } from 'react';
import { FiX } from 'react-icons/fi';
import { cadastroAlunoSchema, type AlunoInput } from '@creche/shared/aluno';
import { dataAlunoISO, hojeBrasil, idadeAluno, compativelComFaixa } from '@creche/shared/idadeAluno';
import type { Turma } from '@creche/shared/turma';
import { mensagemDeErro, type AlunoResumo } from '../../services/api';
import { formatarContato, somenteDigitos } from '../../utils/camposCuidador';

interface Props {
  aluno?: AlunoResumo | null;
  turmas: Turma[];
  somenteLeitura?: boolean;
  turmaFixa?: Turma;
  onClose: () => void;
  onSalvar?: (dados: AlunoInput) => Promise<void>;
}

const campo = 'w-full h-10 rounded-md bg-white px-3 text-sm border border-pp-100 focus:outline-none focus:ring-2 focus:ring-pp-300 disabled:bg-pp-50 disabled:text-pp-700';

export default function ModalFormAluno({ aluno, turmas, turmaFixa, somenteLeitura = false, onClose, onSalvar }: Props) {
  const [nome, setNome] = useState(aluno?.nome ?? '');
  const [nascimento, setNascimento] = useState(aluno ? dataAlunoISO(aluno.dataNascimento) : '');
  const [turmaId, setTurmaId] = useState(turmaFixa ? String(turmaFixa.id) : aluno?.turmaId ? String(aluno.turmaId) : '');
  const [responsavel, setResponsavel] = useState(aluno?.responsavelNome ?? '');
  const [parentesco, setParentesco] = useState(aluno?.responsavelParentesco ?? '');
  const [telefone, setTelefone] = useState(formatarContato(aluno?.responsavelTelefone ?? ''));
  const [secundario, setSecundario] = useState(aluno?.responsavelSecundarioNome ?? '');
  const [parentescoSecundario, setParentescoSecundario] = useState(aluno?.responsavelSecundarioParentesco ?? '');
  const [telefoneSecundario, setTelefoneSecundario] = useState(formatarContato(aluno?.responsavelSecundarioTelefone ?? ''));
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState('');
  const idade = nascimento ? idadeAluno(nascimento) : NaN;
  const hoje = hojeBrasil();
  const inicio = new Date(`${hoje}T12:00:00Z`);
  inicio.setUTCFullYear(inicio.getUTCFullYear() - 4);
  inicio.setUTCDate(inicio.getUTCDate() + 1);
  const titulo = somenteLeitura ? 'Visualizar aluno' : aluno ? 'Alterar aluno' : 'Cadastrar Aluno';

  async function salvar(e: SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    if (salvando || somenteLeitura || !onSalvar) return;
    const [ano, mes, dia] = nascimento.split('-');
    const validacao = cadastroAlunoSchema.safeParse({
      nome: nome.trim(), dataNascimento: `${dia}/${mes}/${ano}`, turmaId: turmaId ? Number(turmaId) : null,
      responsavelNome: responsavel.trim(), responsavelParentesco: parentesco.trim(), responsavelTelefone: somenteDigitos(telefone),
      responsavelSecundarioNome: secundario.trim() || null,
      responsavelSecundarioParentesco: parentescoSecundario.trim() || null,
      responsavelSecundarioTelefone: somenteDigitos(telefoneSecundario) || null,
      responsavelEmail: aluno?.responsavelEmail ?? null, observacoes: aluno?.observacoes ?? null, ativo: aluno?.ativo ?? true,
    });
    if (!validacao.success) { setErro(validacao.error.issues.map(i => i.message).join(' · ')); return; }
    if (turmaFixa?.faixaEtaria && !compativelComFaixa(nascimento, turmaFixa.faixaEtaria)) { setErro('A idade do aluno não é compatível com a faixa etária da turma.'); return; }
    setErro(''); setSalvando(true);
    try { await onSalvar(validacao.data); onClose(); }
    catch (e) { setErro(mensagemDeErro(e, 'Não foi possível salvar o aluno.')); }
    finally { setSalvando(false); }
  }

  return <div role="dialog" aria-modal="true" aria-labelledby="titulo-aluno" className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
    <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-xl bg-pp-50 p-6 shadow-xl">
      <div className="flex items-center justify-between gap-3 border-b border-pp-300 pb-4">
        <h2 id="titulo-aluno" className="font-titulo text-xl">{titulo}</h2>
        <button type="button" aria-label="Fechar modal" onClick={onClose} disabled={salvando} className="p-2"><FiX size={20} /></button>
      </div>
      <form onSubmit={salvar} noValidate>
        {erro && <p role="alert" className="mt-4 text-sm text-red-700">{erro}</p>}
        <fieldset disabled={salvando || somenteLeitura} className="mt-5 grid gap-4 sm:grid-cols-2">
          <label className="text-sm sm:col-span-2">Nome do Aluno<input className={campo} value={nome} onChange={e => setNome(e.target.value)} /></label>
          <label className="text-sm">Turma<select className={campo} disabled={!!turmaFixa} value={turmaId} onChange={e => setTurmaId(e.target.value)}>
            <option value="">Sem turma</option>
            {turmas.filter(t => t.ativo || t.id === aluno?.turmaId).map(t => <option key={t.id} value={t.id}>{t.nome} — {t.turno === 'manha' ? 'Manhã' : t.turno === 'tarde' ? 'Tarde' : t.turno}{t.ativo ? '' : ' (inativa)'}</option>)}
          </select></label>
          <label className="text-sm">Data de nascimento<input type="date" className={campo} min={inicio.toISOString().slice(0, 10)} max={hoje} value={nascimento} onChange={e => setNascimento(e.target.value)} /></label>
          <label className="text-sm sm:col-span-2">Idade do aluno (0 a 3 anos)<input className={campo} readOnly value={!nascimento ? '' : idade >= 0 && idade <= 3 ? `${idade} ${idade === 1 ? 'ano' : 'anos'}` : 'Fora do limite de 0 a 3 anos'} /></label>
          <label className="text-sm">Nome do Responsável<input className={campo} value={responsavel} onChange={e => setResponsavel(e.target.value)} /></label>
          <label className="text-sm">Parentesco do Responsável<input className={campo} placeholder="Ex.: mãe, pai, avó" value={parentesco} onChange={e => setParentesco(e.target.value)} /></label>
          <label className="text-sm sm:col-span-2">Contato do Responsável<input type="tel" className={campo} placeholder="(11) 9 9999-9999" value={telefone} onChange={e => setTelefone(formatarContato(e.target.value))} /></label>
          <p className="text-sm font-bold sm:col-span-2 mt-2">Responsável secundário (opcional)</p>
          <label className="text-sm">Responsável Secundário<input className={campo} value={secundario} onChange={e => setSecundario(e.target.value)} /></label>
          <label className="text-sm">Parentesco do Responsável Secundário<input className={campo} value={parentescoSecundario} onChange={e => setParentescoSecundario(e.target.value)} /></label>
          <label className="text-sm sm:col-span-2">Contato do Responsável Secundário<input type="tel" className={campo} placeholder="(11) 9 9999-9999" value={telefoneSecundario} onChange={e => setTelefoneSecundario(formatarContato(e.target.value))} /></label>
        </fieldset>
        <div className="mt-6 flex justify-end gap-3">
          <button type="button" onClick={onClose} disabled={salvando} className="rounded-full border border-pp-500 px-5 py-2">{somenteLeitura ? 'Fechar' : 'Cancelar'}</button>
          {!somenteLeitura && <button type="submit" disabled={salvando} className="rounded-full bg-pp-botao text-white px-5 py-2 disabled:opacity-50">{salvando ? 'Salvando...' : 'Salvar aluno'}</button>}
        </div>
      </form>
    </div>
  </div>;
}
