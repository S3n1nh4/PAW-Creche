import { useEffect, useState } from 'react';
import { FiEdit2, FiPlus, FiSearch, FiTrash2, FiUsers } from 'react-icons/fi';
import { faixasEtarias, type Turma } from '@creche/shared/turma';
import type { Aluno } from '@creche/shared/aluno';
import type { TurmaCuidador } from '@creche/shared/turmaCuidador';
import DetalhesTurma from './DetalhesTurma';
import ModalFormTurma from '../components/modais/ModalFormTurma';
import ModalRemoverTurma from '../components/modais/ModalRemoverTurma';
import {
  listarCuidadores,
  type CuidadorResumo,
  atualizarTurma,
  criarTurma,
  removerTurma,
  listarAlunos,
  listarTurmas,
  listarVinculos,
  mensagemDeErro,
} from '../services/api';

const plural = (n: number, singular: string, pluralizado: string) =>
  `${n} ${n === 1 ? singular : pluralizado}`;

export default function MainTurmas() {
  const [turmaAbertaId, setTurmaAbertaId] = useState<number | null>(null);
  const [turmas, setTurmas] = useState<Turma[]>([]);
  const [cuidadores, setCuidadores] = useState<CuidadorResumo[]>([]);
  const [alunos, setAlunos] = useState<Aluno[]>([]);
  const [vinculos, setVinculos] = useState<TurmaCuidador[]>([]);
  const [busca, setBusca] = useState('');
  const [erro, setErro] = useState('');
  const [carregando, setCarregando] = useState(true);

  // Qual modal está aberto (cada um só existe na tela enquanto está aberto)
  const [criando, setCriando] = useState(false);
  const [emEdicao, setEmEdicao] = useState<Turma | null>(null);
  const [removendo, setRemovendo] = useState<Turma | null>(null);

  // Mudar este número faz o useEffect buscar tudo de novo na API
  const [versao, setVersao] = useState(0);
  const recarregar = () => setVersao((v) => v + 1);

  // Lista os registros vindos da API
  useEffect(() => {
    let cancelado = false;
    Promise.all([listarTurmas(), listarAlunos(), listarVinculos(), listarCuidadores()])
      .then(([t, a, v, c]) => {
        if (cancelado) return;
        setCuidadores(c);
        setTurmas(t);
        setAlunos(a);
        setVinculos(v);
        setErro('');
      })
      .catch((e) => {
        if (!cancelado) setErro(mensagemDeErro(e, 'Não foi possível buscar as turmas na API.'));
      })
      .finally(() => {
        if (!cancelado) setCarregando(false);
      });
    return () => {
      cancelado = true;
    };
  }, [versao]);

  // Busca por texto: calculada a cada desenho, a partir da lista e do que foi digitado
  const termo = busca.toLowerCase();
  const visiveis = turmas.filter(
    (t) => t.nome.toLowerCase().includes(termo) || t.turno.toLowerCase().includes(termo),
  );

  const turmaAberta = turmas.find(t => t.id === turmaAbertaId);
  if (turmaAberta) return <DetalhesTurma turma={turmaAberta} turmas={turmas} alunos={alunos} cuidadores={cuidadores} vinculos={vinculos} onVoltar={() => setTurmaAbertaId(null)} onAtualizar={recarregar} />;

  return (
    <div className="font-texto">
      <h1 className="font-titulo text-[22px] font-bold mb-4">Gestão de Turmas</h1>

      <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
        <div className="relative w-full max-w-[300px]">
          <FiSearch size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-pp-500" />
          <input
            type="text"
            placeholder="Pesquisar"
            aria-label="Pesquisar turmas"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="w-full h-9 pl-9 pr-3 rounded-md bg-white text-[13px] border border-pp-100 focus:outline-none focus:ring-2 focus:ring-pp-300"
          />
        </div>

        <button
          type="button"
          onClick={() => setCriando(true)}
          className="flex items-center gap-2 h-9 px-4 rounded-md bg-[#1E78A5] hover:bg-[#267CA1] text-white text-[13px] font-bold cursor-pointer"
        >
          <FiPlus size={16} /> Criar Turmas
        </button>
      </div>

      {erro && (
        <div role="alert" className="mb-4 rounded-md bg-red-100 text-red-700 text-[14px] px-4 py-3">
          {erro}
        </div>
      )}

      <div className="grid gap-5 sm:grid-cols-2">
        {visiveis.map((turma) => {
          const totalAlunos = alunos.filter((a) => a.ativo && a.turmaId === turma.id).length;
          const totalCuidadores = vinculos.filter((v) => v.turmaId === turma.id).length;
          return (
            <article key={turma.id} className="rounded-xl bg-pp-500 text-white shadow-md p-5">
              <button type="button" onClick={() => setTurmaAbertaId(turma.id)} aria-label={`Visualizar turma ${turma.nome}`} className="block w-full text-left rounded-lg p-2 hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-white">
                <h2 className="font-titulo text-[17px]">{turma.nome}</h2>
              <ul className="mt-4 flex flex-col gap-1.5 font-desc text-[13px]">
                <li>Sala: {turma.sala ?? 'Não informada'}</li>
                <li>Turno {turma.turno === 'manha' ? 'Manhã' : turma.turno === 'tarde' ? 'Tarde' : turma.turno}</li>
                <li>{faixasEtarias.find(faixa => faixa.valor === turma.faixaEtaria)?.rotulo ?? 'Faixa etária não informada'}</li>
                <li>{plural(totalAlunos, 'Aluno', 'Alunos')}</li>
                <li>{plural(totalCuidadores, 'Cuidador', 'Cuidadores')}</li>
                <li>{cuidadores.filter(c => vinculos.some(v => v.turmaId === turma.id && v.cuidadorId === c.id)).map(c => c.nome).join(', ') || 'Nenhum cuidador associado'}</li>
              </ul>
              </button>
              <div className="mt-4 flex justify-end">
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setEmEdicao(turma)}
                    aria-label={`Cuidadores da ${turma.nome}`}
                    title="Alterar cuidadores"
                    className="hover:opacity-70 cursor-pointer"
                  >
                    <FiUsers size={17} />
                  </button>
                  <button
                    type="button"
                    onClick={() => setEmEdicao(turma)}
                    aria-label={`Editar ${turma.nome}`}
                    title="Editar"
                    className="hover:opacity-70 cursor-pointer"
                  >
                    <FiEdit2 size={16} />
                  </button>
                  <button
                    type="button"
                    onClick={() => setRemovendo(turma)}
                    aria-label={`Remover ${turma.nome}`}
                    title="Remover"
                    className="hover:opacity-70 cursor-pointer"
                  >
                    <FiTrash2 size={16} />
                  </button>
                </div>
              </div>
            </article>
          );
        })}
      </div>

      {carregando && <p className="text-[14px] text-pp-500">Carregando turmas...</p>}
      {visiveis.length === 0 && !erro && !carregando && (
        <p className="text-[14px] text-pp-500">Nenhuma turma encontrada.</p>
      )}

      {(criando || emEdicao) && (
        <ModalFormTurma
          key={emEdicao?.id ?? 'nova'}
          isOpen={criando || emEdicao !== null}
          turmaInicial={emEdicao}
          cuidadores={cuidadores}
          cuidadorIdsIniciais={vinculos.filter(v => v.turmaId === emEdicao?.id).map(v => v.cuidadorId)}
          onSubmitTurma={async (dados) => {
            if (emEdicao) await atualizarTurma(emEdicao.id, dados);
            else await criarTurma(dados);
            setErro('');
            recarregar();
          }}
          onClose={() => {
            setCriando(false);
            setEmEdicao(null);
          }}
        />
      )}

      {removendo && (
        <ModalRemoverTurma
          isOpen={removendo !== null}
          onClose={() => setRemovendo(null)}
          onConfirmar={async () => {
            await removerTurma(removendo.id);
            setErro('');
            recarregar();
          }}
        />
      )}
    </div>
  );
}
