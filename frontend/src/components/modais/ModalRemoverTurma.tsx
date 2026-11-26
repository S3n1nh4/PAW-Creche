import ModalConfirmacao from './ModalConfirmacao';
interface Props { isOpen: boolean; onClose: () => void; onConfirmar: () => void | Promise<void> }
export default function ModalRemoverTurma(props: Props) {
  return <ModalConfirmacao {...props} titulo="Deseja desativar esta turma?" />;
}
