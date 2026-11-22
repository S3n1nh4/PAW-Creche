import { useState, useEffect, type FormEvent } from 'react';

export interface Turma {
  id: number | string;
  nome: string;
  turno: string;
  ano: string;
}

interface ModalModificarTurmaProps {
  isOpen: boolean;
  turma: Turma | null;
  onClose: () => void;
  onSalvar: (turmaAtualizada: Turma) => void;
}

export default function ModalModificarTurma({
  isOpen,
  turma,
  onClose,
  onSalvar,
}: ModalModificarTurmaProps) {
  const [nome, setNome] = useState('');
  const [turno, setTurno] = useState('');
  const [ano, setAno] = useState('');

  useEffect(() => {
    if (turma) {
      setNome(turma.nome);
      setTurno(turma.turno);
      setAno(turma.ano);
    }
  }, [turma]);

  if (!isOpen || !turma) return null;

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!nome.trim() || !turno.trim() || !ano.trim()) return;

    onSalvar({ ...turma, nome, turno, ano });
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      style={{ fontFamily: "'Coco Gothic', sans-serif" }}
    >
      <div className="w-full max-w-[430px] bg-[#E1F2FE] rounded-[12px] px-8 pt-8 pb-10 shadow-xl">
        {/* Cabeçalho */}
        <div className="flex items-center justify-between pb-4 border-b-2 border-[#36A3DC]">
          <h2
            className="text-[22px] font-bold text-[#0F172A] pl-2"
            style={{ fontFamily: "'Utendo', sans-serif" }}
          >
            Modificar Turma
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar modal"
            className="text-[#0F172A] hover:opacity-70 transition-opacity cursor-pointer p-1"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </div>

        {/* Formulário */}
        <form onSubmit={handleSubmit} className="mt-6 flex flex-col">
          <label className="text-[14px] text-[#0F172A] mb-1.5">
            Nome da Turma
          </label>
          <input
            type="text"
            placeholder="Turma 1"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            className="w-full h-[38px] bg-[#F1F5F9] rounded-[6px] px-3 text-[13px] text-[#475569] placeholder-[#94A3B8] border border-[#CBD5E1] focus:bg-white focus:text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#36A3DC] mb-5"
          />

          <label className="text-[14px] text-[#0F172A] mb-1.5">
            Turno
          </label>
          <input
            type="text"
            placeholder="Integral"
            value={turno}
            onChange={(e) => setTurno(e.target.value)}
            className="w-full h-[38px] bg-[#F1F5F9] rounded-[6px] px-3 text-[13px] text-[#475569] placeholder-[#94A3B8] border border-[#CBD5E1] focus:bg-white focus:text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#36A3DC] mb-5"
          />

          <label className="text-[14px] text-[#0F172A] mb-1.5">
            Ano
          </label>
          <input
            type="text"
            placeholder="2026"
            maxLength={4}
            value={ano}
            onChange={(e) => setAno(e.target.value)}
            className="w-[155px] h-[38px] bg-[#F1F5F9] rounded-[6px] px-3 text-[13px] text-[#475569] placeholder-[#94A3B8] border border-[#CBD5E1] focus:bg-white focus:text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#36A3DC] mb-12"
          />

          <div className="flex justify-center">
            <button
              type="submit"
              className="w-[155px] h-[44px] bg-[#36A3DC] hover:bg-[#2B8EC2] text-white font-bold text-[13px] rounded-full transition-colors cursor-pointer"
            >
              Salvar Alterações
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}