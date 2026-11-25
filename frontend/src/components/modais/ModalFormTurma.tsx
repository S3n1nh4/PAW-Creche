import { useState, useEffect, type SyntheticEvent } from 'react';
import { FiX } from 'react-icons/fi';
import type { TurmaInput } from '@creche/shared/turma';

interface ModalFormTurmaProps {
  isOpen: boolean;
  turmaInicial?: TurmaInput | null;
  onClose: () => void;
  onSubmitTurma: (dados: TurmaInput) => void | Promise<void>;
}

export default function ModalFormTurma({
  isOpen,
  turmaInicial = null,
  onClose,
  onSubmitTurma,
}: ModalFormTurmaProps) {
  const isEdicao = Boolean(turmaInicial);

  const [nome, setNome] = useState('');
  const [turno, setTurno] = useState('');
  const [anoLetivo, setAnoLetivo] = useState('');

  useEffect(() => {
    if (!isOpen) return;

    if (turmaInicial) {
      setNome(turmaInicial.nome);
      setTurno(turmaInicial.turno);
      setAnoLetivo(turmaInicial.anoLetivo ? String(turmaInicial.anoLetivo) : '');
    } else {
      setNome('');
      setTurno('');
      setAnoLetivo('');
    }
  }, [isOpen, turmaInicial]);

  if (!isOpen) return null;

  const handleSubmit = async (e: SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();

    const anoNumero = Number(anoLetivo.trim());
    if (!nome.trim() || !turno.trim() || !anoLetivo.trim() || Number.isNaN(anoNumero)) {
      return;
    }

    await onSubmitTurma({
      ...(turmaInicial ?? {}),
      nome: nome.trim(),
      turno: turno.trim(),
      anoLetivo: anoNumero,
      ativo: turmaInicial ? turmaInicial.ativo : true,
    });

    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
      style={{ fontFamily: "'Coco Gothic', sans-serif" }}
    >
      <div className="w-full max-w-[430px] bg-[#E1F2FE] rounded-[12px] px-8 pt-8 pb-10 shadow-xl">
        {/* Cabeçalho */}
        <div className="flex items-center justify-between pb-4 border-b-2 border-[#36A3DC]">
          <h2
            className="text-[22px] font-bold text-[#0F172A] pl-2"
            style={{ fontFamily: "'Utendo', sans-serif" }}
          >
            {isEdicao ? 'Modificar Turma' : 'Criar Turma'}
          </h2>

          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar modal"
            className="text-[#0F172A] hover:opacity-70 transition-opacity cursor-pointer p-1"
          >
            <FiX size={20} strokeWidth={2} />
          </button>
        </div>

        {/* Formulário */}
        <form onSubmit={handleSubmit} className="mt-6 flex flex-col">
          <label className="text-[14px] text-[#0F172A] mb-1.5">
            Nome da Turma
          </label>
          <input
            type="text"
            placeholder={isEdicao ? 'Turma 1' : 'Digite o nome aqui..'}
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            className="w-full h-[38px] bg-[#F1F5F9] rounded-[6px] px-3 text-[13px] text-[#0F172A] placeholder-[#94A3B8] border border-[#CBD5E1] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#36A3DC] mb-5"
          />

          <label className="text-[14px] text-[#0F172A] mb-1.5">
            Turno
          </label>
          <input
            type="text"
            placeholder={isEdicao ? 'Integral' : 'Digite o turno aqui...'}
            value={turno}
            onChange={(e) => setTurno(e.target.value)}
            className="w-full h-[38px] bg-[#F1F5F9] rounded-[6px] px-3 text-[13px] text-[#0F172A] placeholder-[#94A3B8] border border-[#CBD5E1] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#36A3DC] mb-5"
          />

          <label className="text-[14px] text-[#0F172A] mb-1.5">
            Ano
          </label>
          <input
            type="text"
            inputMode="numeric"
            placeholder={isEdicao ? '2026' : 'AAAA'}
            maxLength={4}
            value={anoLetivo}
            onChange={(e) => setAnoLetivo(e.target.value.replace(/\D/g, ''))}
            className="w-[155px] h-[38px] bg-[#F1F5F9] rounded-[6px] px-3 text-[13px] text-[#0F172A] placeholder-[#94A3B8] border border-[#CBD5E1] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#36A3DC] mb-12"
          />

          <div className="flex justify-center">
            <button
              type="submit"
              className="w-[155px] h-[44px] bg-[#36A3DC] hover:bg-[#2B8EC2] text-white font-bold text-[13px] rounded-full transition-colors cursor-pointer"
            >
              {isEdicao ? 'Salvar Alterações' : 'Criar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}