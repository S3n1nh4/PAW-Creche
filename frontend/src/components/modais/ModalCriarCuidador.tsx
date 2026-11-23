import { useState, type SyntheticEvent } from 'react';
import { FiUser, FiX } from 'react-icons/fi';
import type { CuidadorInput } from "@creche/shared/cuidador";

interface ModalCriarCuidadorProps {
  isOpen: boolean;
  onClose: () => void;
  onCriar: (novoCuidador: CuidadorInput) => void | Promise<void>;
}

export default function ModalCriarCuidador({
  isOpen,
  onClose,
  onCriar,
}: ModalCriarCuidadorProps) {
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [telefone, setTelefone] = useState('');
  const [admissao, setAdmissao] = useState('');
  const [salario, setSalario] = useState('');
  const [turmas, setTurmas] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!nome.trim() || !email.trim()) return;

    await onCriar({
      nome: nome.trim(),
      email: email.trim(),
      telefone: telefone.trim(),
      admissao: admissao.trim(),
      salario: salario.trim(),
      turmas: turmas.trim(),
    });

    setNome('');
    setEmail('');
    setTelefone('');
    setAdmissao('');
    setSalario('');
    setTurmas('');
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      style={{ fontFamily: "'Coco Gothic', sans-serif" }}
    >
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-[460px] bg-[#E1F2FE] rounded-[16px] overflow-hidden shadow-xl"
      >
        {/* Cabeçalho com ícone e campo Nome completo */}
        <div className="bg-[#C8E6FC] px-7 py-5 flex items-center justify-between gap-3">
          <div className="flex items-center gap-4 flex-1">
            <div className="w-12 h-12 rounded-full border-2 border-[#334155] flex items-center justify-center text-[#334155] shrink-0">
              <FiUser size={24} strokeWidth={1.8} />
            </div>

            <div className="flex flex-col flex-1 max-w-[240px]">
              <label
                htmlFor="nome-cuidador"
                className="text-[13px] font-bold text-[#0F172A] mb-1"
                style={{ fontFamily: "'Utendo', sans-serif" }}
              >
                Nome completo
              </label>
              <input
                id="nome-cuidador"
                type="text"
                placeholder="Digite o nome completo.."
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                className="w-full h-[34px] bg-[#F1F5F9] rounded-[6px] px-3 text-[12.5px] text-[#0F172A] placeholder-[#94A3B8] border border-[#CBD5E1] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#36A3DC]"
              />
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar modal"
            className="text-[#0F172A] hover:opacity-70 transition-opacity cursor-pointer p-1 self-start"
          >
            <FiX size={20} strokeWidth={2} />
          </button>
        </div>

        {/* Corpo com campos em duas colunas e divisor vertical azul */}
        <div className="px-7 pt-6 pb-7 grid grid-cols-[1fr_2px_1fr] gap-x-6 items-start">
          {/* Coluna esquerda */}
          <div className="flex flex-col gap-5">
            <div>
              <label className="block text-[13px] font-bold text-[#0F172A] mb-1.5">
                Email
              </label>
              <input
                type="email"
                placeholder="Digite o email..."
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full h-[34px] bg-[#F1F5F9] rounded-[6px] px-3 text-[12.5px] text-[#0F172A] placeholder-[#94A3B8] border border-[#CBD5E1] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#36A3DC]"
              />
            </div>

            <div>
              <label className="block text-[13px] font-bold text-[#0F172A] mb-1.5">
                Admissão
              </label>
              <input
                type="text"
                placeholder="DD/MM/AAAA"
                maxLength={10}
                value={admissao}
                onChange={(e) => setAdmissao(e.target.value)}
                className="w-[140px] h-[34px] bg-[#F1F5F9] rounded-[6px] px-3 text-[12.5px] text-[#0F172A] placeholder-[#94A3B8] border border-[#CBD5E1] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#36A3DC]"
              />
            </div>

            <div>
              <label className="block text-[13px] font-bold text-[#0F172A] mb-1.5">
                Turmas
              </label>
              <input
                type="text"
                placeholder="Digite a turma.."
                value={turmas}
                onChange={(e) => setTurmas(e.target.value)}
                className="w-full h-[34px] bg-[#F1F5F9] rounded-[6px] px-3 text-[12.5px] text-[#0F172A] placeholder-[#94A3B8] border border-[#CBD5E1] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#36A3DC]"
              />
            </div>
          </div>

          {/* Divisor vertical azul */}
          <div className="h-full min-h-[215px] w-[2px] bg-[#36A3DC]" />

          {/* Coluna direita */}
          <div className="flex flex-col gap-5">
            <div>
              <label className="block text-[13px] font-bold text-[#0F172A] mb-1.5">
                Telefone
              </label>
              <input
                type="text"
                placeholder="Digite o telefone.."
                value={telefone}
                onChange={(e) => setTelefone(e.target.value)}
                className="w-full h-[34px] bg-[#F1F5F9] rounded-[6px] px-3 text-[12.5px] text-[#0F172A] placeholder-[#94A3B8] border border-[#CBD5E1] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#36A3DC]"
              />
            </div>

            <div>
              <label className="block text-[13px] font-bold text-[#0F172A] mb-1.5">
                Salário
              </label>
              <input
                type="text"
                placeholder="R$"
                value={salario}
                onChange={(e) => setSalario(e.target.value)}
                className="w-[140px] h-[34px] bg-[#F1F5F9] rounded-[6px] px-3 text-[12.5px] text-[#0F172A] placeholder-[#94A3B8] border border-[#CBD5E1] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#36A3DC]"
              />
            </div>

            <div className="pt-3 flex justify-end">
              <button
                type="submit"
                className="px-6 h-[38px] bg-[#36A3DC] hover:bg-[#2B8EC2] text-white font-bold text-[13px] rounded-full transition-colors cursor-pointer"
              >
                Salvar
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}