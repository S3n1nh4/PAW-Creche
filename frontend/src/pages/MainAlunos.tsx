import { useEffect, useState } from 'react';
import { FiEdit2, FiEye, FiPlus, FiTrash2 } from 'react-icons/fi';
import type { Turma } from '@creche/shared/turma';
import type { TurmaCuidador } from '@creche/shared/turmaCuidador';
import { idadeAluno } from '@creche/shared/idadeAluno';
import { atualizarAluno, criarAluno, listarAlunos, listarCuidadores, listarTurmas, listarVinculos, mensagemDeErro, removerAluno, type AlunoResumo, type CuidadorResumo } from '../services/api';
import ModalFormAluno from '../components/modais/ModalFormAluno';
import ModalConfirmacao from '../components/modais/ModalConfirmacao';
import Paginacao from '../components/Paginacao';

export default function MainAlunos() {
  const [alunos, setAlunos] = useState<AlunoResumo[]>([]);
  const [turmas, setTurmas] = useState<Turma[]>([]);
  const [cuidadores, setCuidadores] = useState<CuidadorResumo[]>([]);
  const [vinculos, setVinculos] = useState<TurmaCuidador[]>([]);
  const [erro, setErro] = useState('');
  const [carregando, setCarregando] = useState(true);
  const [busca, setBusca] = useState('');
  const [pagina, setPagina] = useState(1);
  const [versao, setVersao] = useState(0);
  const [modal, setModal] = useState<{ modo: 'criar' | 'editar' | 'visualizar'; aluno: AlunoResumo | null } | null>(null);
  const [excluindo, setExcluindo] = useState<AlunoResumo | null>(null);
  const recarregar = () => setVersao(v => v + 1);

  useEffect(() => {
    let cancelado = false;
    Promise.all([listarAlunos(), listarTurmas(), listarCuidadores(), listarVinculos()]).then(([a, t, c, v]) => {
      if (cancelado) return;
      setAlunos(a); setTurmas(t); setCuidadores(c); setVinculos(v); setErro('');
    }).catch(e => { if (!cancelado) setErro(mensagemDeErro(e, 'Não foi possível carregar os alunos.')); })
      .finally(() => { if (!cancelado) setCarregando(false); });
    return () => { cancelado = true; };
  }, [versao]);

  const nomeTurma = (id: number | null) => turmas.find(t => t.id === id)?.nome ?? 'Sem turma';
  const nomesCuidadores = (id: number | null) => cuidadores.filter(c => c.ativo && vinculos.some(v => v.turmaId === id && v.cuidadorId === c.id)).map(c => c.nome).join(', ') || 'Não associado';
  const filtrados = alunos.filter(a => a.ativo && `${a.nome} ${nomeTurma(a.turmaId)}`.toLocaleLowerCase().includes(busca.toLocaleLowerCase())).sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));
  const totalPaginas = Math.max(1, Math.ceil(filtrados.length / 8));
  const paginaAtual = Math.min(pagina, totalPaginas);

  return <section className="font-texto">
    <h1 className="font-titulo text-[22px] mb-5">Alunos</h1>
    <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
      <input aria-label="Pesquisar alunos" placeholder="Pesquisar aluno ou turma" className="rounded-md border border-pp-100 bg-white p-2 text-sm" value={busca} onChange={e => { setBusca(e.target.value); setPagina(1); }} />
      <button type="button" onClick={() => setModal({ modo: 'criar', aluno: null })} className="flex items-center gap-2 rounded-md bg-pp-botao px-4 py-2 text-white text-sm"><FiPlus />Cadastrar Aluno</button>
    </div>
    {erro && <p role="alert" className="mb-4 rounded-md bg-red-100 p-3 text-red-700">{erro}</p>}
    <div className="mb-3 flex justify-end"><Paginacao pagina={paginaAtual} totalPaginas={totalPaginas} onMudar={setPagina} /></div>
    <div className="overflow-x-auto rounded-lg bg-pp-500 text-white">
      <table className="w-full min-w-[620px] text-sm text-left">
        <thead className="bg-pp-700"><tr>{['Aluno', 'Turma', 'Idade', 'Cuidador', 'Ações'].map(t => <th key={t} className="p-3">{t}</th>)}</tr></thead>
        <tbody>{filtrados.slice((paginaAtual - 1) * 8, paginaAtual * 8).map(a => {
          const idade = idadeAluno(a.dataNascimento);
          return <tr key={a.id} className="border-b border-white/20">
            <td className="p-3">{a.nome}</td><td className="p-3">{nomeTurma(a.turmaId)}</td>
            <td className="p-3">{Number.isFinite(idade) ? `${idade} ${idade === 1 ? 'ano' : 'anos'}` : '—'}</td>
            <td className="p-3">{nomesCuidadores(a.turmaId)}</td>
            <td className="p-3"><div className="flex gap-4">
              <button type="button" aria-label={`Visualizar ${a.nome}`} onClick={() => setModal({ modo: 'visualizar', aluno: a })}><FiEye /></button>
              <button type="button" aria-label={`Alterar ${a.nome}`} onClick={() => setModal({ modo: 'editar', aluno: a })}><FiEdit2 /></button>
              <button type="button" aria-label={`Excluir ${a.nome}`} onClick={() => setExcluindo(a)}><FiTrash2 /></button>
            </div></td>
          </tr>;
        })}{filtrados.length === 0 && <tr><td colSpan={5} className="p-6 text-center">{carregando ? 'Carregando alunos...' : erro ? 'Não foi possível exibir os alunos.' : 'Nenhum aluno encontrado.'}</td></tr>}</tbody>
      </table>
    </div>
    {modal && <ModalFormAluno key={`${modal.modo}-${modal.aluno?.id ?? 'novo'}`} aluno={modal.aluno} turmas={turmas} somenteLeitura={modal.modo === 'visualizar'} onClose={() => setModal(null)}
      onSalvar={async dados => {
        if (modal.aluno) await atualizarAluno(modal.aluno.id, dados); else await criarAluno(dados);
        recarregar();
      }} />}
    {excluindo && <ModalConfirmacao isOpen titulo={`Excluir ${excluindo.nome}? O cadastro será desativado e o histórico preservado.`} onClose={() => setExcluindo(null)} onConfirmar={async () => { await removerAluno(excluindo.id); recarregar(); }} />}
  </section>;
}
