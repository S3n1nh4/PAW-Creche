import logo from '../assets/imagens/Pequenos_Passos_Logo__1_-removebg-preview.png';

interface ModalRemoverTurmaProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirmar: () => void;
}

export default function ModalRemoverTurma({
  isOpen,
  onClose,
  onConfirmar,
}: ModalRemoverTurmaProps) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      style={{ fontFamily: "'Coco Gothic', sans-serif" }}
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
          <h2 className="text-[20px] font-normal text-[#0F172A] pl-2">
            Deseja remover essa turma?
          </h2>
        </div>

        {/* Botões */}
        <div className="flex items-center justify-end gap-4 mt-6">
          <button
            type="button"
            onClick={onClose}
            className="w-[112px] h-[40px] rounded-full border border-[#475569] text-[13px] font-normal text-[#0F172A] hover:bg-white/60 transition-colors cursor-pointer"
          >
            Não
          </button>
          <button
            type="button"
            onClick={() => {
              onConfirmar();
              onClose();
            }}
            className="w-[112px] h-[40px] rounded-full bg-[#36A3DC] hover:bg-[#2B8EC2] text-[13px] font-bold text-white transition-colors cursor-pointer"
          >
            Sim
          </button>
        </div>
      </div>
    </div>
  );
}