import { useEffect, useState } from 'react';
import logo from '../../assets/imagens/Pequenos_Passos_Logo__1_-removebg-preview.png';
import {
  mensagemDeErro,
  removerPonto,
  type CuidadorResumo,
  type PresencaCuidador,
} from '../../services/api';

interface ModalRemoverPontoCuidadorProps {
  isOpen: boolean;
  cuidador: CuidadorResumo | null;
  registro: PresencaCuidador | null;
  data: string; // AAAA-MM-DD
  onClose: () => void;
  onRemovida: () => void;
  onErro?: (mensagem: string) => void;
}

export default function ModalRemoverPontoCuidador({
  isOpen,
  cuidador,
  registro,
  data,
  onClose,
  onRemovida,
  onErro,
}: ModalRemoverPontoCuidadorProps) {
  const [removendo, setRemovendo] = useState(false);
  const [erroLocal, setErroLocal] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    const aoApertar = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !removendo) onClose();
    };
    window.addEventListener('keydown', aoApertar);
    return () => window.removeEventListener('keydown', aoApertar);
  }, [isOpen, removendo, onClose]);

  if (!isOpen || !cuidador || !registro) return null;

  const [ano, mes, dia] = data.split('-');
  const dataFormatada = ano && mes && dia ? `${dia}/${mes}/${ano}` : data;

  async function handleConfirmar() {
    if (!registro || removendo) return;
    setRemovendo(true);
    setErroLocal('');
    try {
      await removerPonto(registro.id);
      onRemovida();
      onClose();
    } catch (e) {
      const msg = mensagemDeErro(e, 'Não foi possível remover o ponto de presença.');
      setErroLocal(msg);
      onErro?.(msg);
    } finally {
      setRemovendo(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      style={{ fontFamily: "'Coco Gothic', sans-serif" }}
      onClick={() => {
        if (!removendo) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="titulo-remover-ponto"
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-[460px] bg-[#E1F2FE] rounded-[6px] px-7 pt-6 pb-8 shadow-xl"
      >
        {/* Logo */}
        <div className="mb-3">
          <img
            src={logo}
            alt="Logo Pequenos Passos"
            className="w-[62px] h-[58px] object-contain"
          />
        </div>

        {/* Pergunta de confirmação com linha divisória azul */}
        <div className="pb-3 border-b-2 border-[#36A3DC]">
          <h2
            id="titulo-remover-ponto"
            className="text-[20px] font-normal text-[#0F172A] pl-2"
          >
            Deseja remover o ponto desse cuidador?
          </h2>
        </div>

        <p className="text-[13px] text-[#334155] pl-2 mt-3">
          <strong>{cuidador.nome}</strong> — {dataFormatada}
        </p>

        {erroLocal && (
          <div
            role="alert"
            className="mt-3 rounded-md bg-red-100 text-red-700 text-[12.5px] px-3 py-2"
          >
            {erroLocal}
          </div>
        )}

        {/* Botões */}
        <div className="flex items-center justify-end gap-4 mt-6">
          <button
            type="button"
            disabled={removendo}
            onClick={onClose}
            className="w-[112px] h-[40px] rounded-full border border-[#475569] text-[13px] font-normal text-[#0F172A] hover:bg-white/60 disabled:opacity-60 transition-colors cursor-pointer"
          >
            Não
          </button>
          <button
            type="button"
            disabled={removendo}
            onClick={handleConfirmar}
            className="w-[112px] h-[40px] rounded-full bg-[#36A3DC] hover:bg-[#2B8EC2] disabled:opacity-60 text-[13px] font-bold text-white transition-colors cursor-pointer"
          >
            {removendo ? 'Removendo...' : 'Sim'}
          </button>
        </div>
      </div>
    </div>
  );
}