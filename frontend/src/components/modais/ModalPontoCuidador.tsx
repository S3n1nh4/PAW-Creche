import { useEffect, useState, type SyntheticEvent } from 'react';
import { FiX } from 'react-icons/fi';
import { atualizarPresencaCuidadorSchema } from '@creche/shared/presencaCuidador';
import {
  atualizarPonto,
  errosPorCampo,
  mensagemDeErro,
  type CuidadorResumo,
  type PresencaCuidador,
} from '../../services/api';
import { horaDeISO, isoDeHora } from '../../utils/formatadores';

interface ModalPontoCuidadorProps {
  cuidador: CuidadorResumo;
  data: string; // AAAA-MM-DD
  registro: PresencaCuidador | null; // ponto do dia (null = ainda não existe)
  onClose: () => void;
  onSalvo: () => void; // recarrega a lista
}

const ROTULO_STATUS = {
  presente: 'Presente',
  falta_justificada: 'Justificado',
  falta: 'Ausente',
};

const classeCampo =
  'w-full h-[38px] bg-[#F1F5F9] rounded-[6px] px-3 text-[13px] text-[#0F172A] border border-[#CBD5E1] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#36A3DC] aria-[invalid=true]:border-red-600 disabled:opacity-50';

export default function ModalPontoCuidador({ cuidador, data, registro, onClose, onSalvo }: ModalPontoCuidadorProps) {
  const [entrada, setEntrada] = useState(horaDeISO(registro?.entrada ?? null));
  const [saida, setSaida] = useState(horaDeISO(registro?.saida ?? null));
  const [observacao, setObservacao] = useState(registro?.observacao ?? '');
  const [erros, setErros] = useState<Record<string, string>>({});
  const [erroGeral, setErroGeral] = useState('');
  const [salvando, setSalvando] = useState(false);

  // Esc fecha o modal
  useEffect(() => {
    const aoApertar = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', aoApertar);
    return () => window.removeEventListener('keydown', aoApertar);
  }, [onClose]);

  const aceitaHorario = registro?.status === 'presente';
  const [ano, mes, dia] = data.split('-');

  async function handleSubmit(e: SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!registro) return;
    setErros({});
    setErroGeral('');

    // Valida com o schema do shared antes de enviar
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
    } catch (e) {
      // Erros da API: por campo e/ou um aviso geral
      setErros(errosPorCampo(e));
      setErroGeral(mensagemDeErro(e, 'Não foi possível salvar o ponto.'));
      setSalvando(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      style={{ fontFamily: "'Coco Gothic', sans-serif" }}
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="titulo-ponto"
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-[430px] bg-[#E1F2FE] rounded-[12px] px-8 pt-8 pb-8 shadow-xl"
      >
        <div className="flex items-center justify-between pb-4 border-b-2 border-[#36A3DC]">
          <h2 id="titulo-ponto" className="text-[20px] font-bold text-[#0F172A] pl-2" style={{ fontFamily: "'Utendo', sans-serif" }}>
            Ponto de {cuidador.nome}
          </h2>
          <button type="button" onClick={onClose} aria-label="Fechar modal" className="text-[#0F172A] hover:opacity-70 cursor-pointer p-1">
            <FiX size={20} />
          </button>
        </div>

        <p className="text-[13px] text-[#334155] mt-3">
          {dia}/{mes}/{ano}
          {registro && <> — Status: <strong>{ROTULO_STATUS[registro.status]}</strong></>}
        </p>

        {!registro ? (
          <>
            <p className="mt-6 text-[14px] text-[#0F172A]">
              Ainda não há ponto neste dia. Escolha o status na tabela para registrar.
            </p>
            <div className="flex justify-center mt-8">
              <button
                type="button"
                onClick={onClose}
                className="w-[155px] h-[44px] bg-[#1E78A5] hover:bg-[#267CA1] text-white font-bold text-[13px] rounded-full cursor-pointer"
              >
                Fechar
              </button>
            </div>
          </>
        ) : (
          <form onSubmit={handleSubmit} noValidate className="mt-5 flex flex-col">
            {erroGeral && (
              <div role="alert" className="mb-4 rounded-md bg-red-100 text-red-700 text-[13px] px-3 py-2">
                {erroGeral}
              </div>
            )}

            {!aceitaHorario && (
              <p className="text-[12px] text-[#334155] mb-3">Horários só valem para o status Presente.</p>
            )}

            <div className="flex gap-4">
              <div className="flex-1">
                <label htmlFor="ponto-entrada" className="block text-[14px] text-[#0F172A] mb-1.5">Entrada</label>
                <input
                  id="ponto-entrada"
                  type="time"
                  value={entrada}
                  onChange={(e) => setEntrada(e.target.value)}
                  disabled={!aceitaHorario}
                  aria-invalid={Boolean(erros.entrada)}
                  className={classeCampo}
                />
                <span className="block text-red-600 text-[12px] min-h-5 mt-1">{erros.entrada}</span>
              </div>
              <div className="flex-1">
                <label htmlFor="ponto-saida" className="block text-[14px] text-[#0F172A] mb-1.5">Saída</label>
                <input
                  id="ponto-saida"
                  type="time"
                  value={saida}
                  onChange={(e) => setSaida(e.target.value)}
                  disabled={!aceitaHorario}
                  aria-invalid={Boolean(erros.saida)}
                  className={classeCampo}
                />
                <span className="block text-red-600 text-[12px] min-h-5 mt-1">{erros.saida}</span>
              </div>
            </div>

            <label htmlFor="ponto-obs" className="block text-[14px] text-[#0F172A] mb-1.5">Observação</label>
            <textarea
              id="ponto-obs"
              rows={3}
              value={observacao}
              onChange={(e) => setObservacao(e.target.value)}
              placeholder="Digite uma observação..."
              aria-invalid={Boolean(erros.observacao)}
              className="w-full bg-[#F1F5F9] rounded-[6px] px-3 py-2 text-[13px] text-[#0F172A] border border-[#CBD5E1] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#36A3DC] aria-[invalid=true]:border-red-600"
            />
            <span className="block text-red-600 text-[12px] min-h-5 mt-1">{erros.observacao}</span>

            <div className="flex justify-center mt-6">
              <button
                type="submit"
                disabled={salvando}
                className="w-[155px] h-[44px] bg-[#1E78A5] hover:bg-[#267CA1] disabled:opacity-60 text-white font-bold text-[13px] rounded-full cursor-pointer"
              >
                {salvando ? 'Salvando...' : 'Salvar Alterações'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}