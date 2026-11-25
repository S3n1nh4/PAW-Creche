import { useEffect, useState } from 'react';
import type { Turma } from '@creche/shared/turma';
import logo from '../../assets/imagens/Pequenos_Passos_Logo__1_-removebg-preview.png';
import { mensagemDeErro, removerTurma } from '../../services/api';

interface DeletarTurmasProps {
  turma: Turma; // turma que será removida
  onClose: () => void;
  onRemovida: () => void; // recarrega a lista depois de remover
}

export default function DeletarTurmas({ turma, onClose, onRemovida }: DeletarTurmasProps) {
  const [erro, setErro] = useState('');
  const [removendo, setRemovendo] = useState(false);

  // Esc fecha o modal
  useEffect(() => {
    const aoApertar = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', aoApertar);
    return () => window.removeEventListener('keydown', aoApertar);
  }, [onClose]);

  async function confirmar() {
    setErro('');
    setRemovendo(true);
    try {
      await removerTurma(turma.id);
      onRemovida();
      onClose();
    } catch (e) {
      const mensagem = mensagemDeErro(e, 'Não foi possível remover a turma.');
      // Turma com alunos/cuidadores: o banco recusa, então explicamos em português
      setErro(
        /foreign key|constraint|violat|referenc/i.test(mensagem)
          ? `Não é possível remover a ${turma.nome}: ela ainda tem alunos ou cuidadores vinculados.`
          : mensagem,
      );
      setRemovendo(false);
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
        aria-labelledby="titulo-remover-turma"
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-[400px] bg-[#E1F2FE] rounded-[12px] px-8 pt-6 pb-8 shadow-xl"
      >
        <img src={logo} alt="Logo Pequenos Passos" className="w-[64px] h-[60px] object-contain mb-3" />

        <h2 id="titulo-remover-turma" className="text-[18px] text-[#0F172A] pb-3 border-b-2 border-[#36A3DC]">
          Deseja remover essa turma?
        </h2>
        <p className="text-[13px] text-[#334155] mt-2">{turma.nome}</p>

        {erro && (
          <div role="alert" className="mt-4 rounded-md bg-red-100 text-red-700 text-[13px] px-3 py-2">
            {erro}
          </div>
        )}

        <div className="flex justify-end gap-4 mt-6">
          <button
            type="button"
            onClick={onClose}
            autoFocus
            className="w-[100px] h-[40px] rounded-full border border-[#475569] text-[13px] text-[#0F172A] hover:bg-white/60 cursor-pointer"
          >
            Não
          </button>
          <button
            type="button"
            onClick={confirmar}
            disabled={removendo}
            className="w-[100px] h-[40px] rounded-full bg-[#1E78A5] hover:bg-[#267CA1] disabled:opacity-60 text-white font-bold text-[13px] cursor-pointer"
          >
            {removendo ? 'Removendo...' : 'Sim'}
          </button>
        </div>
      </div>
    </div>
  );
}