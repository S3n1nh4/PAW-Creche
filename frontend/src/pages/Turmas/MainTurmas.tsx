import { useEffect, useState } from 'react';
import { FiEdit2, FiPlus, FiSearch, FiTrash2, FiUsers } from 'react-icons/fi';
import type { Turma } from '@creche/shared/turma';
import type { Aluno } from '@creche/shared/aluno';
import type { TurmaCuidador } from '@creche/shared/turmaCuidador';
import ModalTurma from '../../components/modais/ModalTurma';
import ModalRemoverTurma from '../../components/modais/ModalRemoverTurma';
import ModalCuidadoresTurma from '../../components/modais/ModalCuidadoresTurma';
import {
  listarAlunos,
  listarCuidadores,
  listarTurmas,
  listarVinculos,
  mensagemDeErro,
  removerTurma,
  type CuidadorResumo,
} from '../../services/api';

const plural = (n: number, singular: string, pluralizado: string) =>
  `${n} ${n === 1 ? singular : pluralizado}`;

export default function MainTurmas() {
  const [turmas, setTurmas] = useState<Turma[]>([]);
  const [alunos, setAlunos] = useState<Aluno[]>([]);
  const [cuidadores, setCuidadores] = useState<CuidadorResumo[]>([]);
  const [vinculos, setVinculos] = useState<TurmaCuidador[]>([]);
  const [busca, setBusca] = useState('');
  const [erro, setErro] = useState('');

  // Qual modal está aberto
  const [criando, setCriando] = useState(false);
  const [emEdicao, setEmEdicao] = useState<Turma | null>(null);
  const [removendo, setRemovendo] = useState<Turma | null>(null);
  const [gerenciando, setGerenciando] = useState<Turma | null>(null);

  // Mudar este número faz o useEffect buscar tudo de novo na API
  const [versao, setVersao] = useState(0);
  const recarregar = () => setVersao((v) => v + 1);

  useEffect(() => {
    let cancelado = false;
    Promise.all([listarTurmas(), listarAlunos(), listarCuidadores(), listarVinculos()])
      .then(([t, a, c, v]) => {
        if (cancelado) return;
        setTurmas(t);
        setAlunos(a);
        setCuidadores(c);
        setVinculos(v);
        setErro('');
      })
      .catch((e) => {
        if (!cancelado) setErro(mensagemDeErro(e, 'Não foi possível buscar as turmas na API.'));
      });
    return () => {
      cancelado = true;
    };
  }, [versao]);

  async function remover(turma: Turma) {
    try {
      await removerTurma(turma.id);
      recarregar();
    } catch (e) {
      setErro(mensagemDeErro(e, 'Não foi possível remover a turma.'));
    }
  }

  // Busca por texto: calculada a cada desenho, a partir da lista e do que foi digitado
  const termo = busca.toLowerCase();
  const visiveis = turmas.filter(
    (t) => t.nome.toLowerCase().includes(termo) || t.turno.toLowerCase().includes(termo),
  );

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
          className="flex items-center gap-2 h-9 px-4 rounded-md bg-pp-300 hover:bg-[#2B8EC2] text-white text-[13px] font-bold cursor-pointer"
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
          const totalAlunos = alunos.filter((a) => a.turmaId === turma.id).length;
          const totalCuidadores = vinculos.filter((v) => v.turmaId === turma.id).length;
          return (
            <article key={turma.id} className="rounded-xl bg-pp-500 text-white shadow-md p-5">
              <div className="flex items-start justify-between">
                <h2 className="font-titulo text-[17px]">{turma.nome}</h2>
                <div className="flex items-center gap-3">
                  <button type="button" onClick={() => setGerenciando(turma)} aria-label={`Cuidadores da ${turma.nome}`} className="hover:opacity-70 cursor-pointer">
                    <FiUsers size={17} />
                  </button>
                  <button type="button" onClick={() => setEmEdicao(turma)} aria-label={`Editar ${turma.nome}`} className="hover:opacity-70 cursor-pointer">
                    <FiEdit2 size={16} />
                  </button>
                  <button type="button" onClick={() => setRemovendo(turma)} aria-label={`Remover ${turma.nome}`} className="hover:opacity-70 cursor-pointer">
                    <FiTrash2 size={16} />
                  </button>
                </div>
              </div>
              <ul className="mt-4 flex flex-col gap-1.5 font-desc text-[13px]">
                <li>Tempo {turma.turno}</li>
                <li>Ano Letivo {turma.anoLetivo}</li>
                <li>{plural(totalAlunos, 'Aluno', 'Alunos')}</li>
                <li>{plural(totalCuidadores, 'Cuidador', 'Cuidadores')}</li>
              </ul>
            </article>
          );
        })}
      </div>

      {visiveis.length === 0 && !erro && (
        <p className="text-[14px] text-pp-500">Nenhuma turma encontrada.</p>
      )}

      {/* Criar e editar usam o mesmo modal */}
      {(criando || emEdicao) && (
        <ModalTurma
          key={emEdicao?.id ?? 'nova'}
          turma={emEdicao}
          onClose={() => {
            setCriando(false);
            setEmEdicao(null);
          }}
          onSalvo={recarregar}
        />
      )}

      <ModalRemoverTurma
        isOpen={removendo !== null}
        onClose={() => setRemovendo(null)}
        onConfirmar={() => {
          if (removendo) remover(removendo);
        }}
      />

      {gerenciando && (
        <ModalCuidadoresTurma
          turma={gerenciando}
          cuidadores={cuidadores}
          vinculos={vinculos}
          onClose={() => setGerenciando(null)}
          onAlterado={recarregar}
        />
      )}
    </div>
  );
}