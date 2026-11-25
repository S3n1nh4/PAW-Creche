import './App.css';
import { useState } from 'react';
import Login from './pages/LoginPage';
import Dashboard from './pages/Dashboard';
import MainTurmas from './pages/Turmas/MainTurmas';
import MainCuidadores from './pages/Cuidadores/MainCuidadores';
import MainPontodePresenca from './pages/Ponto de Presença/MainPontodePresença';
import Layout, { type Pagina } from './components/Layout';
import { logout, usuarioSalvo, type Usuario } from './services/api';

function App() {
  // usuarioSalvo: quem já estava logado continua logado depois de recarregar a página
  const [usuario, setUsuario] = useState<Usuario | null>(usuarioSalvo);
  const [pagina, setPagina] = useState<Pagina>('dashboard');

  // Sem login: só a tela de login. Ao entrar, cai direto no Dashboard.
  if (!usuario) return <Login />;

  function sair() {
    logout().catch(() => {});
    setUsuario(null);
    setPagina('dashboard');
  }

  return (
    <Layout nome={usuario.nome} pagina={pagina} onNavegar={setPagina} onSair={sair}>
      {pagina === 'dashboard' && <Dashboard />}
      {pagina === 'turmas' && <MainTurmas />}
      {pagina === 'cuidadores' && <MainCuidadores />}
      {pagina === 'presenca' && <MainPontodePresenca />}
    </Layout>
  );
}

export default App;