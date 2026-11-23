import { FiUser, FiX } from 'react-icons/fi';
import type { CuidadorInput } from "@creche/shared/cuidador";

interface ModalVerCuidadorProps {
  isOpen: boolean;
  cuidador: CuidadorInput | null;
  onClose: () => void;
}

export default function ModalVerCuidador({
  isOpen,
  cuidador,
  onClose,
}: ModalVerCuidadorProps) {
  if (!isOpen || !cuidador) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      style={{ fontFamily: "'Coco Gothic', sans-serif" }}
    >
      <div className="w-full max-w-[460px] bg-[#E1F2FE] rounded-[16px] overflow-hidden shadow-xl">
        {/* Cabeçalho */}
        <div className="bg-[#C8E6FC] px-7 py-5 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full border-2 border-[#334155] flex items-center justify-center text-[#334155] shrink-0">
              <FiUser size={24} strokeWidth={1.8} />
            </div>
            <h2
              className="text-[20px] font-bold text-[#0F172A]"
              style={{ fontFamily: "'Utendo', sans-serif" }}
            >
              {cuidador.nome}
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar modal"
            className="text-[#0F172A] hover:opacity-70 transition-opacity cursor-pointer p-1"
          >
            <FiX size={20} strokeWidth={2} />
          </button>
        </div>

        {/* Corpo em duas colunas separadas por linha vertical azul */}
        <div className="px-7 py-7 grid grid-cols-[1fr_2px_1fr] gap-x-6 gap-y-6 items-start">
          {/* Coluna esquerda */}
          <div className="flex flex-col gap-6">
            <div>
              <span className="block text-[13px] font-bold text-[#0F172A] mb-1">
                Email
              </span>
              <span className="block text-[13px] text-[#334155] break-all">
                {cuidador.email}
              </span>
            </div>

            <div>
              <span className="block text-[13px] font-bold text-[#0F172A] mb-1">
                Admissão
              </span>
              <span className="block text-[13px] text-[#334155]">
                {cuidador.admissao}
              </span>
            </div>

            <div>
              <span className="block text-[13px] font-bold text-[#0F172A] mb-1">
                Turmas
              </span>
              <span className="block text-[13px] text-[#334155]">
                {cuidador.turmas}
              </span>
            </div>
          </div>

          {/* Divisor vertical azul */}
          <div className="h-full min-h-[210px] w-[2px] bg-[#36A3DC]" />

          {/* Coluna direita */}
          <div className="flex flex-col gap-6">
            <div>
              <span className="block text-[13px] font-bold text-[#0F172A] mb-1">
                Telefone
              </span>
              <span className="block text-[13px] text-[#334155]">
                {cuidador.telefone}
              </span>
            </div>

            <div>
              <span className="block text-[13px] font-bold text-[#0F172A] mb-1">
                Salário
              </span>
              <span className="block text-[13px] text-[#334155]">
                {cuidador.salarioBase}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}