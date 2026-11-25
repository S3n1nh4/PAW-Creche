import { useEffect, useRef, useState } from 'react';
import { FiCalendar, FiEye, FiFilter, FiSearch, FiTrash2 } from 'react-icons/fi';
import type { Turma } from '@creche/shared/turma';
import type { TurmaCuidador } from '@creche/shared/turmaCuidador';
import AdicionarPontodePresenca from './AdicionarPontodePresença';
import ModalVerPontoCuidador from '../../components/modais/ModalVerPontoCuidador.tsx';
import ModalRemoverPontoCuidador from '../../components/modais/ModalRemoverPontoCuidador';
import Paginacao from '../../components/Paginacao.tsx';
import {
  listarCuidadores,
  listarPontoDoDia,
  listarTurmas,
  listarVinculos,
  mensagemDeErro,
  type CuidadorResumo,
  type PresencaCuidador,
} from '../../services/api';
import { paraISO } from '../../utils/formatadores';

const POR_PAGINA = 8;

export default function MainPontodePresenca() {
  const [cuidadores, setCuidadores] = useState<CuidadorResumo[]>([]);
  const [turmas, setTurmas] = useState<Turma[]>([]);
  const [vinculos, setVinculos] = useState<TurmaCuidador[]>([]);
  const [registros, setRegistros] = useState<PresencaCuidador[]>([]);
  const [erro, setErro] = useState('');
  const [carregando, setCarregando] = useState(true);

  const [diaISO, setDiaISO] = useState(() => paraISO(new Date())); // AAAA-MM-DD
  const [busca, setBusca] = useState('');
  const [filtroStatus, setFiltroStatus] = useState(''); // '' = todos, 'sem' = sem registro, ou o status
  const [pagina, setPagina] = useState(1);

  // Qual modal está aberto
  const [vendo, setVendo] = useState<CuidadorResumo | null>(null);
  const [removendo, setRemovendo] = useState<CuidadorResumo | null>(null);

  const seletorData = useRef<HTMLInputElement>(null);

  // Mudar este número faz o useEffect buscar tudo de novo na API
  const [versao, setVersao] = useState(0);
  const recarregar = () => setVersao((v) => v + 1);

  // Lista os registros vindos da API (de novo quando muda o dia)
  useEffect(() => {
    let cancelado = false;
    Promise.all([listarCuidadores(), listarTurmas(), listarVinculos(), listarPontoDoDia(diaISO)])
      .then(([c, t, v, r]) => {
        if (cancelado) return;
        setCuidadores(c);
        setTurmas(t);
        setVinculos(v);
        setRegistros(r);
        setErro('');
      })
      .catch((e) => {
        if (!cancelado) setErro(mensagemDeErro(e, 'Não foi possível carregar o ponto de presença.'));
      })
      .finally(() => {
        if (!cancelado) setCarregando(false);
      });
    return () => {
      cancelado = true;
    };
  }, [diaISO, versao]);

  const registroDe = (cuidadorId: number) => registros.find((r) => r.cuidadorId === cuidadorId) ?? null;

  const turmasDe = (cuidadorId: number) =>
    vinculos
      .filter((v) => v.cuidadorId === cuidadorId)
      .map((v) => turmas.find((t) => t.id === v.turmaId)?.nome)
      .filter((nome): nome is string => Boolean(nome))
      .join(', ') || '—';

  function abrirCalendario() {
    const campo = seletorData.current;
    if (!campo) return;
    try {
      campo.showPicker();
    } catch {
      campo.click(); // navegadores sem showPicker
    }
  }

  // Busca por texto + filtro de status: calculados a cada desenho (.filter)
  const termo = busca.toLowerCase();
  const filtrados = cuidadores
    .filter((c) => c.ativo)
    .filter((c) => {
      const daBusca = c.nome.toLowerCase().includes(termo) || String(c.id).includes(termo);
      const status = registroDe(c.id)?.status;
      const doStatus =
        filtroStatus === '' || (filtroStatus === 'sem' ? !status : status === filtroStatus);
      return daBusca && doStatus;
    });

  const totalPaginas = Math.max(1, Math.ceil(filtrados.length / POR_PAGINA));
  const paginaAtual = Math.min(pagina, totalPaginas);
  const visiveis = filtrados.slice((paginaAtual - 1) * POR_PAGINA, paginaAtual * POR_PAGINA);

  // "2026-11-18" -> "18 de nov. de 2026"
  const [ano, mes, dia] = diaISO.split('-').map(Number);
  const tituloData = new Date(ano, mes - 1, dia).toLocaleDateString('pt-BR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  const registroRemovendo = removendo ? registroDe(removendo.id) : null;

  return (
    <div className="font-texto">
      {/* Título com o calendário */}
      <div className="flex items-center gap-3 mb-4">
        <h1 className="font-titulo text-[20px] font-bold">Ponto de Presença de {tituloData}</h1>
        <button
          type="button"
          onClick={abrirCalendario}
          aria-label="Escolher outra data"
          title="Escolher outra data"
          className="p-1 hover:opacity-70 cursor-pointer"
        >
          <FiCalendar size={20} />
        </button>
        <input
          ref={seletorData}
          type="date"
          value={diaISO}
          onChange={(e) => {
            if (!e.target.value) return;
            setDiaISO(e.target.value);
            setPagina(1);
            setErro('');
          }}
          aria-label="Data do ponto"
          tabIndex={-1}
          className="sr-only"
        />
      </div>

      {/* Pesquisar, Filtros e paginação */}
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
            aria-label="Filtros: status do ponto"
            value={filtroStatus}
            onChange={(e) => {
              setFiltroStatus(e.target.value);
              setPagina(1);
            }}
            className="h-9 pl-9 pr-3 rounded-md bg-white text-[13px] border border-pp-100 focus:outline-none focus:ring-2 focus:ring-pp-300"
          >
            <option value="">Filtros</option>
            <option value="presente">Presente</option>
            <option value="falta_justificada">Justificado</option>
            <option value="falta">Ausente</option>
            <option value="sem">Sem registro</option>
          </select>
        </div>

        <div className="ml-auto">
          <Paginacao pagina={paginaAtual} totalPaginas={totalPaginas} onMudar={setPagina} />
        </div>
      </div>

      {/* Aviso de erro (listar, salvar status...) */}
      {erro && (
        <div role="alert" className="mb-4 rounded-md bg-red-100 text-red-700 text-[14px] px-4 py-3">
          {erro}
        </div>
      )}

      <div className="rounded-lg overflow-x-auto bg-pp-500 text-white shadow-md">
        <table className="w-full min-w-[640px] text-[13px] text-center">
          <thead className="bg-pp-700">
            <tr>
              <th className="p-3 font-normal">ID</th>
              <th className="p-3 font-normal">Nome</th>
              <th className="p-3 font-normal">Turma</th>
              <th className="p-3 font-normal">Status</th>
              <th className="p-3 font-normal">Ações</th>
            </tr>
          </thead>
          <tbody>
            {visiveis.map((c) => {
              const registro = registroDe(c.id);
              return (
                <tr key={c.id} className="border-b border-white/20 last:border-0">
                  <td className="p-3">{c.id}</td>
                  <td className="p-3">{c.nome}</td>
                  <td className="p-3">{turmasDe(c.id)}</td>

                  {/* ★ ADICIONAR: escolher o status cria (ou atualiza) o ponto do dia */}
                  <td className="p-3">
                    <AdicionarPontodePresenca
                      cuidador={c}
                      data={diaISO}
                      registro={registro}
                      onSalvo={() => {
                        setErro('');
                        recarregar();
                      }}
                      onErro={setErro}
                    />
                  </td>

                  <td className="p-3">
                    <div className="flex items-center justify-center gap-4">
                      {/* Ver / ajustar horários (modal que já existe) */}
                      <button
                        type="button"
                        onClick={() => setVendo(c)}
                        aria-label={`Ver ponto de ${c.nome}`}
                        title="Ver ponto"
                        className="hover:opacity-70 cursor-pointer"
                      >
                        <FiEye size={17} />
                      </button>

                      {/* ★ REMOVER: só habilitado se já existe ponto neste dia */}
                      <button
                        type="button"
                        onClick={() => setRemovendo(c)}
                        disabled={!registro}
                        aria-label={`Remover ponto de ${c.nome}`}
                        title={registro ? 'Remover ponto' : 'Sem ponto neste dia'}
                        className="hover:opacity-70 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                      >
                        <FiTrash2 size={17} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}

            {visiveis.length === 0 && (
              <tr>
                <td colSpan={5} className="p-6 font-desc">
                  {carregando ? 'Carregando ponto de presença...' : 'Nenhum cuidador encontrado.'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <ModalVerPontoCuidador
        key={`${vendo?.id ?? 'nenhum'}-${diaISO}`}
        isOpen={vendo !== null}
        cuidador={vendo}
        turmas={
          vendo
            ? vinculos
                .filter((v) => v.cuidadorId === vendo.id)
                .map((v) => turmas.find((t) => t.id === v.turmaId)?.nome)
                .filter((nome): nome is string => Boolean(nome))
            : []
        }
        data={diaISO}
        registro={vendo ? registroDe(vendo.id) : null}
        onClose={() => setVendo(null)}
        onSalvo={() => {
          setErro('');
          recarregar();
        }}
      />

      <ModalRemoverPontoCuidador
        isOpen={removendo !== null && registroRemovendo !== null}
        cuidador={removendo}
        registro={registroRemovendo}
        data={diaISO}
        onClose={() => setRemovendo(null)}
        onRemovida={() => {
          setErro('');
          recarregar();
        }}
        onErro={setErro}
      />
    </div>
  );
}