import { useState } from 'react';
import { turmaSchema, type Turma, type TurmaInput } from '@creche/shared/turma';
import ModalFormTurma from '../../components/modais/ModalFormTurma';
import { atualizarTurma, errosPorCampo, mensagemDeErro } from '../../services/api';

interface AlterarTurmasProps {
  turma: Turma; // turma que está sendo editada
  onClose: () => void;
  onAlterada: () => void; // recarrega a lista depois de salvar
}

const ROTULOS: Record<string, string> = { nome: 'Nome', turno: 'Turno', anoLetivo: 'Ano' };

export default function AlterarTurmas({ turma, onClose, onAlterada }: AlterarTurmasProps) {
  const [aviso, setAviso] = useState('');

  // O modal chama esta função ao enviar. Se ela lançar erro, o modal NÃO fecha.
  async function alterar(dados: TurmaInput) {
    setAviso('');

    // Só os campos do schema (o modal também manda o id junto)
    const validacao = turmaSchema.safeParse({
      nome: dados.nome,
      turno: dados.turno,
      anoLetivo: dados.anoLetivo,
      ativo: dados.ativo,
    });
    if (!validacao.success) {
      setAviso(validacao.error.issues.map((i) => i.message).join(' · '));
      throw new Error('Dados inválidos');
    }

    try {
      await atualizarTurma(turma.id, validacao.data);
      onAlterada();
    } catch (e) {
      const porCampo = Object.entries(errosPorCampo(e)).map(
        ([campo, mensagem]) => `${ROTULOS[campo] ?? campo}: ${mensagem}`,
      );
      setAviso(porCampo.length > 0 ? porCampo.join(' · ') : mensagemDeErro(e, 'Não foi possível salvar a turma.'));
      throw e;
    }
  }

  return (
    <>
      {/* Mesmo modal da criação; com turmaInicial ele vira "Modificar Turma" / "Salvar Alterações" */}
      <ModalFormTurma isOpen turmaInicial={turma} onClose={onClose} onSubmitTurma={alterar} />

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