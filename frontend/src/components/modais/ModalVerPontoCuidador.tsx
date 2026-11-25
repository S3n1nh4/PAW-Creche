import { useEffect, useRef, useState, type SyntheticEvent } from 'react';
import { FiEdit2, FiUser, FiX } from 'react-icons/fi';
import { atualizarPresencaCuidadorSchema } from '@creche/shared/presencaCuidador';
import {
  atualizarPonto,
  errosPorCampo,
  mensagemDeErro,
  type CuidadorResumo,
  type PresencaCuidador,
  type StatusPresenca,
} from '../../services/api';
import { horaDeISO, isoDeHora } from '../../utils/formatadores';

interface ModalVerPontodePresencaProps {
  isOpen: boolean;
  cuidador: CuidadorResumo | null;
  turmas?: string[];
  data: string; // AAAA-MM-DD
  registro: PresencaCuidador | null;
  onClose: () => void;
  onSalvo: () => void;
}

type CampoEditavel = 'entrada' | 'saida' | 'observacao';

const ROTULO_STATUS: Record<StatusPresenca, string> = {
  presente: 'Presente',
  falta_justificada: 'Justificado',
  falta: 'Ausente',
};

const classeCampo =
  'w-full h-[34px] bg-[#F1F5F9] rounded-[6px] px-3 text-[12.5px] text-[#0F172A] border border-[#CBD5E1] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#36A3DC] aria-[invalid=true]:border-red-600 disabled:opacity-60';

export default function ModalVerPontodePresenca({
  isOpen,
  cuidador,
  turmas = [],
  data,
  registro,
  onClose,
  onSalvo,
}: ModalVerPontodePresencaProps) {
  const [entrada, setEntrada] = useState(horaDeISO(registro?.entrada ?? null));
  const [saida, setSaida] = useState(horaDeISO(registro?.saida ?? null));
  const [observacao, setObservacao] = useState(registro?.observacao ?? '');

  const [editando, setEditando] = useState<Record<CampoEditavel, boolean>>({
    entrada: false,
    saida: false,
    observacao: false,
  });

  const [erros, setErros] = useState<Record<string, string>>({});
  const [erroGeral, setErroGeral] = useState('');
  const [salvando, setSalvando] = useState(false);

  const refEntrada = useRef<HTMLInputElement>(null);
  const refSaida = useRef<HTMLInputElement>(null);
  const refObs = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    setEntrada(horaDeISO(registro?.entrada ?? null));
    setSaida(horaDeISO(registro?.saida ?? null));
    setObservacao(registro?.observacao ?? '');
    setEditando({ entrada: false, saida: false, observacao: false });
    setErros({});
    setErroGeral('');
  }, [registro, cuidador, data, isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const aoApertar = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !salvando) onClose();
    };
    window.addEventListener('keydown', aoApertar);
    return () => window.removeEventListener('keydown', aoApertar);
  }, [isOpen, salvando, onClose]);

  if (!isOpen || !cuidador) return null;

  const textoTurmas = turmas.length > 0 ? turmas.join(', ') : '—';
  const statusTexto = registro ? ROTULO_STATUS[registro.status] : 'Sem registro';
  const aceitaHorario = registro?.status === 'presente';

  function habilitarEdicao(campo: CampoEditavel) {
    if (!registro) return;
    if ((campo === 'entrada' || campo === 'saida') && !aceitaHorario) return;

    setEditando((atual) => ({ ...atual, [campo]: true }));

    requestAnimationFrame(() => {
      if (campo === 'entrada') refEntrada.current?.focus();
      if (campo === 'saida') refSaida.current?.focus();
      if (campo === 'observacao') refObs.current?.focus();
    });
  }

  async function handleSubmit(e: SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!registro) {
      onClose();
      return;
    }

    setErros({});
    setErroGeral('');

    const validacao = atualizarPresencaCuidadorSchema.safeParse({
      status: registro.status,
      entrada: aceitaHorario ? isoDeHora(data, entrada) : null,
      saida: aceitaHorario ? isoDeHora(data, saida) : null,
      observacao: observacao.trim() || null,
    });

    if (!validacao.success) {
      const porCampo: Record<string, string> = {};
      let geral = '';
      for (const issue of validacao.error.issues) {
        const campo = String(issue.path[0] ?? '');
        if (campo === 'entrada' || campo === 'saida' || campo === 'observacao') {
          if (!porCampo[campo]) porCampo[campo] = issue.message;
        } else {
          geral = issue.message;
        }
      }
      setErros(porCampo);
      setErroGeral(geral);
      return;
    }

    setSalvando(true);
    try {
      await atualizarPonto(registro.id, validacao.data);
      onSalvo();
      onClose();
    } catch (err) {
      setErros(errosPorCampo(err));
      setErroGeral(mensagemDeErro(err, 'Não foi possível salvar o ponto.'));
      setSalvando(false);
    }
  }

  const podeEditarHorario = Boolean(registro && aceitaHorario && editando.entrada);
  const podeEditarSaida = Boolean(registro && aceitaHorario && editando.saida);
  const podeEditarObs = Boolean(registro && editando.observacao);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
      style={{ fontFamily: "'Coco Gothic', sans-serif" }}
      onClick={() => {
        if (!salvando) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="titulo-ver-ponto"
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-[460px] bg-[#E1F2FE] rounded-[16px] overflow-hidden shadow-xl"
      >
        {/* Cabeçalho */}
        <div className="bg-[#C8E6FC] px-7 py-5 flex items-center justify-between gap-3">
          <div className="flex items-center gap-4 min-w-0">
            <div className="w-12 h-12 rounded-full border-2 border-[#334155] flex items-center justify-center text-[#334155] shrink-0">
              <FiUser size={24} strokeWidth={1.8} />
            </div>
            <div className="min-w-0">
              <h2
                id="titulo-ver-ponto"
                className="text-[20px] font-bold text-[#0F172A] truncate"
                style={{ fontFamily: "'Utendo', sans-serif" }}
              >
                {cuidador.nome}
              </h2>
              <span className="block text-[12px] text-[#334155]">
                ID: {cuidador.id}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar modal"
            className="text-[#0F172A] hover:opacity-70 transition-opacity cursor-pointer p-1 shrink-0"
          >
            <FiX size={20} strokeWidth={2} />
          </button>
        </div>

        {/* Corpo em duas colunas separadas por linha vertical azul */}
        <form onSubmit={handleSubmit} noValidate className="px-7 py-6">
          {erroGeral && (
            <div
              role="alert"
              className="mb-4 rounded-md bg-red-100 text-red-700 text-[12.5px] px-3 py-2"
            >
              {erroGeral}
            </div>
          )}

          <div className="grid grid-cols-[1fr_2px_1fr] gap-x-6 items-start">
            {/* Coluna esquerda: Turma, Status e Observação */}
            <div className="flex flex-col gap-5">
              <div>
                <span className="block text-[13px] font-bold text-[#0F172A] mb-1">
                  Turma
                </span>
                <span className="block text-[13px] text-[#334155]">
                  {textoTurmas}
                </span>
              </div>

              <div>
                <span className="block text-[13px] font-bold text-[#0F172A] mb-1">
                  Status
                </span>
                <span className="block text-[13px] text-[#334155]">
                  {statusTexto}
                </span>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label
                    htmlFor="ver-ponto-obs"
                    className="text-[13px] font-bold text-[#0F172A]"
                  >
                    Observação
                  </label>
                  {registro && (
                    <button
                      type="button"
                      onClick={() => habilitarEdicao('observacao')}
                      aria-label="Editar observação"
                      title="Editar observação"
                      className="text-[#0F172A] hover:text-[#36A3DC] transition-colors cursor-pointer p-0.5"
                    >
                      <FiEdit2 size={14} />
                    </button>
                  )}
                </div>

                <textarea
                  ref={refObs}
                  id="ver-ponto-obs"
                  rows={3}
                  disabled={!podeEditarObs}
                  value={observacao}
                  onChange={(e) => setObservacao(e.target.value)}
                  placeholder={
                    registro ? 'Digite uma observação...' : 'Sem ponto no dia'
                  }
                  aria-invalid={Boolean(erros.observacao)}
                  className="w-full bg-[#F1F5F9] rounded-[6px] px-3 py-2 text-[12.5px] text-[#0F172A] placeholder-[#94A3B8] border border-[#CBD5E1] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#36A3DC] aria-[invalid=true]:border-red-600 disabled:opacity-60"
                />
                <span className="block text-red-600 text-[11.5px] min-h-4 mt-1">
                  {erros.observacao}
                </span>
              </div>
            </div>

            {/* Divisor vertical azul */}
            <div className="h-full min-h-[210px] w-[2px] bg-[#36A3DC]" />

            {/* Coluna direita: Entrada, Saída e Ação */}
            <div className="flex flex-col gap-5">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label
                    htmlFor="ver-ponto-entrada"
                    className="text-[13px] font-bold text-[#0F172A]"
                  >
                    Entrada
                  </label>
                  {registro && aceitaHorario && (
                    <button
                      type="button"
                      onClick={() => habilitarEdicao('entrada')}
                      aria-label="Editar entrada"
                      title="Editar entrada"
                      className="text-[#0F172A] hover:text-[#36A3DC] transition-colors cursor-pointer p-0.5"
                    >
                      <FiEdit2 size={14} />
                    </button>
                  )}
                </div>

                <input
                  ref={refEntrada}
                  id="ver-ponto-entrada"
                  type="time"
                  value={entrada}
                  onChange={(e) => setEntrada(e.target.value)}
                  disabled={!podeEditarHorario}
                  aria-invalid={Boolean(erros.entrada)}
                  className={classeCampo}
                />
                <span className="block text-red-600 text-[11.5px] min-h-4 mt-1">
                  {erros.entrada}
                </span>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label
                    htmlFor="ver-ponto-saida"
                    className="text-[13px] font-bold text-[#0F172A]"
                  >
                    Saída
                  </label>
                  {registro && aceitaHorario && (
                    <button
                      type="button"
                      onClick={() => habilitarEdicao('saida')}
                      aria-label="Editar saída"
                      title="Editar saída"
                      className="text-[#0F172A] hover:text-[#36A3DC] transition-colors cursor-pointer p-0.5"
                    >
                      <FiEdit2 size={14} />
                    </button>
                  )}
                </div>

                <input
                  ref={refSaida}
                  id="ver-ponto-saida"
                  type="time"
                  value={saida}
                  onChange={(e) => setSaida(e.target.value)}
                  disabled={!podeEditarSaida}
                  aria-invalid={Boolean(erros.saida)}
                  className={classeCampo}
                />
                <span className="block text-red-600 text-[11.5px] min-h-4 mt-1">
                  {erros.saida}
                </span>
              </div>

              {registro && !aceitaHorario && (
                <p className="text-[11.5px] text-[#475569] -mt-2">
                  Horários valem apenas para Presente.
                </p>
              )}

              <div className="pt-1 flex justify-end">
                {registro ? (
                  <button
                    type="submit"
                    disabled={salvando}
                    className="px-5 h-[38px] bg-[#36A3DC] hover:bg-[#2B8EC2] disabled:opacity-60 text-white font-bold text-[12.5px] rounded-full transition-colors cursor-pointer"
                  >
                    {salvando ? 'Salvando...' : 'Salvar'}
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-5 h-[38px] bg-[#36A3DC] hover:bg-[#2B8EC2] text-white font-bold text-[12.5px] rounded-full transition-colors cursor-pointer"
                  >
                    Fechar
                  </button>
                )}
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}