import { useState } from 'react';
import { turmaSchema, type TurmaInput } from '@creche/shared/turma';
import ModalFormTurma from '../../components/modais/ModalFormTurma';
import { criarTurma, errosPorCampo, mensagemDeErro } from '../../services/api';

interface CriarTurmasProps {
  onClose: () => void;
  onCriada: () => void; // recarrega a lista depois de criar
}

const ROTULOS: Record<string, string> = { nome: 'Nome', turno: 'Turno', anoLetivo: 'Ano' };

export default function CriarTurmas({ onClose, onCriada }: CriarTurmasProps) {
  const [aviso, setAviso] = useState('');

  // O modal chama esta função ao enviar. Se ela lançar erro, o modal NÃO fecha.
  async function criar(dados: TurmaInput) {
    setAviso('');

    // Valida com o schema do shared antes de enviar
    const validacao = turmaSchema.safeParse({
      nome: dados.nome,
      turno: dados.turno,
      anoLetivo: dados.anoLetivo,
      ativo: true,
    });
    if (!validacao.success) {
      setAviso(validacao.error.issues.map((i) => i.message).join(' · '));
      throw new Error('Dados inválidos');
    }

    try {
      await criarTurma(validacao.data);
      onCriada();
    } catch (e) {
      // Erros da API: por campo (validação) ou mensagem geral (valor repetido etc.)
      const porCampo = Object.entries(errosPorCampo(e)).map(
        ([campo, mensagem]) => `${ROTULOS[campo] ?? campo}: ${mensagem}`,
      );
      setAviso(porCampo.length > 0 ? porCampo.join(' · ') : mensagemDeErro(e, 'Não foi possível criar a turma.'));
      throw e;
    }
  }

  return (
    <>
      <ModalFormTurma isOpen onClose={onClose} onSubmitTurma={criar} />

      {aviso && (
        <div
          role="alert"
          className="fixed top-4 left-1/2 -translate-x-1/2 z-[60] w-[calc(100%-2rem)] max-w-[430px] flex items-start gap-3 rounded-md bg-red-100 text-red-700 text-[14px] px-4 py-3 shadow-lg"
        >
          <span className="flex-1">{aviso}</span>
          <button type="button" onClick={() => setAviso('')} aria-label="Fechar aviso" className="font-bold cursor-pointer">
            ×
          </button>
        </div>
      )}
    </>
  );
}