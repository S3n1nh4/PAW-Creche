import ModalConfirmacao from './ModalConfirmacao';
interface Props { isOpen: boolean; onClose: () => void; onConfirmar: () => void | Promise<void> }
export default function ModalDesativarCuidador(props: Props) {
  return <ModalConfirmacao {...props} titulo="Deseja desativar este cuidador?" />;
}
