import { useEffect, useState } from 'react';
import { FiEdit2, FiEye, FiFilter, FiPlus, FiSearch, FiTrash2 } from 'react-icons/fi';
import type { CuidadorInput } from '@creche/shared/cuidador';
import type { Turma } from '@creche/shared/turma';
import type { TurmaCuidador } from '@creche/shared/turmaCuidador';
import ModalCriarCuidador from '../../components/modais/ModalCriarCuidador';
import ModalVerCuidador from '../../components/modais/ModalVerCuidador';
import ModalRemoverCuidador from '../../components/modais/ModalDesativarCuidador';
import {
  listarCuidadores,
  listarTurmas,
  listarVinculos,
  mensagemDeErro,
  removerCuidador,
  type CuidadorResumo,
} from '../../services/api';

function formatarData(valor: string) {
  const data = new Date(valor);
  if (Number.isNaN(data.getTime())) return '—';
  return new Intl.DateTimeFormat('pt-BR', { timeZone: 'UTC' }).format(data);
}

function formatarMoeda(valor: number | string) {
  const numero = Number(valor);
  if (!Number.isFinite(numero)) return '—';
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(numero);
}

const POR_PAGINA = 8;

function Paginacao({
  pagina,
  totalPaginas,
  onMudar,
}: {
  pagina: number;
  totalPaginas: number;
  onMudar: (pagina: number) => void;
}) {
  return (
    <nav aria-label="Paginação" className="flex items-center gap-2 text-[13px]">
      <button
        type="button"
        onClick={() => onMudar(pagina - 1)}
        disabled={pagina <= 1}
        className="rounded px-2 py-1 disabled:opacity-50"
      >
        Anterior
      </button>
      <span aria-live="polite">Página {pagina} de {totalPaginas}</span>
      <button
        type="button"
        onClick={() => onMudar(pagina + 1)}
        disabled={pagina >= totalPaginas}
        className="rounded px-2 py-1 disabled:opacity-50"
      >
        Próxima
      </button>
    </nav>
  );
}

export default function MainCuidadores() {
  const [cuidadores, setCuidadores] = useState<CuidadorResumo[]>([]);
  const [turmas, setTurmas] = useState<Turma[]>([]);
  const [vinculos, setVinculos] = useState<TurmaCuidador[]>([]);
  const [erro, setErro] = useState('');
  const [carregando, setCarregando] = useState(true);

  const [busca, setBusca] = useState('');
  const [filtroTurma, setFiltroTurma] = useState(''); // '' = todas, 'sem' = sem turma, ou o id da turma
  const [pagina, setPagina] = useState(1);

  // Qual modal está aberto
  const [criando, setCriando] = useState(false);
  const [emEdicao, setEmEdicao] = useState<CuidadorResumo | null>(null); // ★ EDITAR: cuidador que está sendo editado
  const [vendo, setVendo] = useState<CuidadorResumo | null>(null);
  const [removendo, setRemovendo] = useState<CuidadorResumo | null>(null); // ★ REMOVER: cuidador aguardando confirmação

  // Mudar este número faz o useEffect buscar tudo de novo na API
  const [versao, setVersao] = useState(0);
  const recarregar = () => setVersao((v) => v + 1);

  // Lista os registros vindos da API
  useEffect(() => {
    let cancelado = false;
    Promise.all([listarCuidadores(), listarTurmas(), listarVinculos()])
      .then(([c, t, v]) => {
        if (cancelado) return;
        setCuidadores(c);
        setTurmas(t);
        setVinculos(v);
        setErro('');
      })
      .catch((e) => {
        if (!cancelado) setErro(mensagemDeErro(e, 'Não foi possível buscar os cuidadores na API.'));
      })
      .finally(() => {
        if (!cancelado) setCarregando(false);
      });
    return () => {
      cancelado = true;
    };
  }, [versao]);

  // ===================== ★ REMOVER (lógica) =====================
  // Chamada pelo modal de confirmação ("Deseja remover esse cuidador?" -> Sim).
  // Se o cuidador já tem turma ou ponto, o banco recusa; mostramos uma mensagem clara.
  async function remover(cuidador: CuidadorResumo) {
    try {
      await removerCuidador(cuidador.id);
      setErro('');
      recarregar();
    } catch (e) {
      const mensagem = mensagemDeErro(e, 'Não foi possível remover o cuidador.');
      if (/foreign key|constraint|violat|referenc/i.test(mensagem)) {
        setErro(
          `Não é possível remover ${cuidador.nome}: ele(a) já está em uma turma ou tem ponto registrado. Tire o vínculo antes.`,
        );
      } else {
        setErro(mensagem);
      }
    }
  }
  // ===================== fim ★ REMOVER (lógica) =================

  // O ModalVerCuidador espera o formato do schema (telefone texto, salário número)
  function paraModal(c: CuidadorResumo): CuidadorInput {
    return {
      nome: c.nome,
      email: c.email,
      telefone: c.telefone ?? '',
      salarioBase: Number(c.salarioBase),
      ativo: c.ativo,
    };
  }

  // Busca por texto + filtro de turma: calculados a cada desenho (.filter)
  const termo = busca.toLowerCase();
  const filtrados = cuidadores.filter((c) => {
    const daBusca = c.nome.toLowerCase().includes(termo) || c.email.toLowerCase().includes(termo);
    const idsTurmas = vinculos.filter((v) => v.cuidadorId === c.id).map((v) => v.turmaId);
    const daTurma =
      filtroTurma === '' ||
      (filtroTurma === 'sem' ? idsTurmas.length === 0 : idsTurmas.includes(Number(filtroTurma)));
    return daBusca && daTurma;
  });

  const totalPaginas = Math.max(1, Math.ceil(filtrados.length / POR_PAGINA));
  const paginaAtual = Math.min(pagina, totalPaginas);
  const visiveis = filtrados.slice((paginaAtual - 1) * POR_PAGINA, paginaAtual * POR_PAGINA);

  return (
    <div className="font-texto">
      <h1 className="font-titulo text-[22px] font-bold mb-4">Gestão de Cuidadores</h1>

      <div className="flex flex-wrap items-center gap-3 mb-4">
        <div className="relative w-full max-w-[260px]">
          <FiSearch size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-pp-500" />
          <input
            type="text"
            placeholder="Pesquisar"
            aria-label="Pesquisar cuidadores"
            value={busca}
            onChange={(e) => {
              setBusca(e.target.value);
              setPagina(1);
            }}
            className="w-full h-9 pl-9 pr-3 rounded-md bg-white text-[13px] border border-pp-100 focus:outline-none focus:ring-2 focus:ring-pp-300"
          />
        </div>

        <div className="relative">
          <FiFilter size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-pp-500 pointer-events-none" />
          <select
            aria-label="Filtrar por turma"
            value={filtroTurma}
            onChange={(e) => {
              setFiltroTurma(e.target.value);
              setPagina(1);
            }}
            className="h-9 pl-9 pr-3 rounded-md bg-white text-[13px] border border-pp-100 focus:outline-none focus:ring-2 focus:ring-pp-300"
          >
            <option value="">Todas as turmas</option>
            <option value="sem">Sem turma</option>
            {turmas.map((t) => (
              <option key={t.id} value={String(t.id)}>{t.nome}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Erro da API (listar, remover...) aparece aqui */}
      {erro && (
        <div role="alert" className="mb-4 rounded-md bg-red-100 text-red-700 text-[14px] px-4 py-3">
          {erro}
        </div>
      )}

      <div className="flex justify-end mb-2">
        <Paginacao pagina={paginaAtual} totalPaginas={totalPaginas} onMudar={setPagina} />
      </div>

      <div className="rounded-lg overflow-x-auto bg-pp-500 text-white shadow-md">
        <table className="w-full min-w-[760px] text-[13px] text-left">
          <thead className="bg-pp-700">
            <tr>
              <th className="p-3 font-normal">Nome</th>
              <th className="p-3 font-normal">Email</th>
              <th className="p-3 font-normal">Telefone</th>
              <th className="p-3 font-normal">Admissão</th>
              <th className="p-3 font-normal">Salário</th>
              <th className="p-3 font-normal text-center">Ações</th>
            </tr>
          </thead>
          <tbody>
            {/* Linha "+" do Figma: adicionar cuidador */}
            <tr>
              <td colSpan={6} className="p-0">
                <button
                  type="button"
                  onClick={() => setCriando(true)}
                  aria-label="Adicionar cuidador"
                  title="Adicionar cuidador"
                  className="w-full h-11 flex items-center justify-center bg-pp-300 hover:bg-pp-400 text-pp-700 cursor-pointer"
                >
                  <FiPlus size={18} />
                </button>
              </td>
            </tr>

            {visiveis.map((c) => (
              <tr key={c.id} className="border-b border-white/20 last:border-0">
                <td className="p-3">{c.nome}</td>
                <td className="p-3 break-all">{c.email}</td>
                <td className="p-3">{c.telefone ?? '—'}</td>
                <td className="p-3">{formatarData(c.dataAdmissao)}</td>
                <td className="p-3">{formatarMoeda(c.salarioBase)}</td>
                <td className="p-3">
                  <div className="flex items-center justify-center gap-4">
                    {/* Ver */}
                    <button
                      type="button"
                      onClick={() => setVendo(c)}
                      aria-label={`Ver ${c.nome}`}
                      title="Ver"
                      className="hover:opacity-70 cursor-pointer"
                    >
                      <FiEye size={17} />
                    </button>

                    {/* ★ EDITAR (botão): abre o mesmo modal do "+", já preenchido com este cuidador */}
                    <button
                      type="button"
                      onClick={() => setEmEdicao(c)}
                      aria-label={`Editar ${c.nome}`}
                      title="Editar"
                      className="hover:opacity-70 cursor-pointer"
                    >
                      <FiEdit2 size={16} />
                    </button>

                    {/* ★ REMOVER (botão): só marca quem será removido; a confirmação é o modal lá embaixo */}
                    <button
                      type="button"
                      onClick={() => setRemovendo(c)}
                      aria-label={`Remover ${c.nome}`}
                      title="Remover"
                      className="hover:opacity-70 cursor-pointer"
                    >
                      <FiTrash2 size={17} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}

            {visiveis.length === 0 && (
              <tr>
                <td colSpan={6} className="p-6 text-center font-desc">
                  {carregando ? 'Carregando cuidadores...' : 'Nenhum cuidador encontrado.'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* ===================== ★ CRIAR / EDITAR (modal) =====================
          O mesmo modal serve para os dois:
            - cuidador = null  -> criar (aberto pelo "+")
            - cuidador = {...} -> editar (aberto pelo lápis)
          O modal valida com os schemas do shared, chama criarCuidador/atualizarCuidador,
          mostra os erros da API perto dos campos e, se der certo, chama onSalvo() e onClose(). */}
      {(criando || emEdicao) && (
        <ModalCriarCuidador
          key={emEdicao?.id ?? 'novo'}
          isOpen={criando || emEdicao !== null}
          onCriar={recarregar}
          onClose={() => {
            setCriando(false);
            setEmEdicao(null);
            recarregar();
          }}
        />
      )}
      {/* =================== fim ★ CRIAR / EDITAR =================== */}

      <ModalVerCuidador
        isOpen={vendo !== null}
        cuidador={vendo ? paraModal(vendo) : null}
        onClose={() => setVendo(null)}
      />

      {/* ===================== ★ REMOVER (confirmação) =====================
          Modal "Deseja remover esse cuidador?" (Não / Sim).
          "Sim" chama remover(); o próprio modal se fecha depois de confirmar. */}
      <ModalRemoverCuidador
        isOpen={removendo !== null}
        onClose={() => setRemovendo(null)}
        onConfirmar={() => {
          if (removendo) remover(removendo);
        }}
      />
      {/* =================== fim ★ REMOVER (confirmação) =================== */}
    </div>
  );
}