import './App.css';
import CriarTurma from './components/modais/ModalFormTurma';

function App() {
  return (
    <CriarTurma
      isOpen={true}
      onClose={() => {}}
      onCriar={() => {}}
    />
  );
}

export default App;