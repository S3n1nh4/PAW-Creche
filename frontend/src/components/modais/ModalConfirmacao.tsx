import { useState, useId } from 'react';
import { mensagemDeErro } from '../../services/api';
import logo from '../../assets/imagens/Pequenos_Passos_Logo__1_-removebg-preview.png';

interface ModalConfirmacaoProps {
  isOpen: boolean;
  onClose: () => void;
  titulo: string;
  onConfirmar: () => void | Promise<void>;
}

export default function ModalConfirmacao({
  isOpen,
  onClose,
  onConfirmar,
  titulo,
}: ModalConfirmacaoProps) {
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState('');
  const tituloId = useId();
  if (!isOpen) return null;
  async function confirmar() {
    if (salvando) return;
    setSalvando(true); setErro('');
    try { await onConfirmar(); onClose(); }
    catch (e) { setErro(mensagemDeErro(e, 'Não foi possível concluir a operação.')); }
    finally { setSalvando(false); }
  }

  return (
    <div role="dialog" aria-modal="true" aria-labelledby={tituloId}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
      style={{ fontFamily: "'Comfortaa', sans-serif" }}
    >
      <div className="w-full max-w-[460px] bg-[#E1F2FE] rounded-[6px] px-7 pt-6 pb-8 shadow-xl">
        {/* Logotipo no topo esquerdo */}
        <div className="mb-3">
          <img
            src={logo}
            alt="Logo Pequenos Passos"
            className="w-[62px] h-[58px] object-contain"
          />
        </div>

        {/* Pergunta de confirmação com linha divisória azul */}
        <div className="pb-3 border-b-2 border-[#36A3DC]">
          <h2 id={tituloId} className="text-[20px] font-normal text-[#0F172A] pl-2">
            {titulo}
          </h2>
        </div>

        {erro && <p role="alert" className="mt-4 text-red-700 text-sm">{erro}</p>}
        {/* Botões */}
        <div className="flex items-center justify-end gap-4 mt-6">
          <button
            type="button"
            onClick={onClose}
            disabled={salvando}
            className="w-[112px] h-[40px] rounded-full border border-[#475569] text-[13px] font-normal text-[#0F172A] hover:bg-white/60 transition-colors cursor-pointer"
          >
            Não
          </button>
          <button
            type="button"
            onClick={confirmar}
            disabled={salvando}
            className="w-[112px] h-[40px] rounded-full bg-[#36A3DC] hover:bg-[#2B8EC2] text-[13px] font-bold text-white transition-colors cursor-pointer"
          >
            {salvando ? 'Salvando...' : 'Sim'}
          </button>
        </div>
      </div>
    </div>
  );
}