import './App.css';
import { useState } from 'react';
import Login from './pages/LoginPage';
import Dashboard from './pages/Dashboard';
import MainTurmas from './pages/MainTurmas';
import MainCuidadores from './pages/MainCuidadores';
import MainAlunos from './pages/MainAlunos';
import AreaCuidador from './pages/AreaCuidador';
import MainPontodePresenca from './pages/MainPontodePresença';
import Layout, { type Pagina } from './components/Layout';
import { logout, usuarioSalvo, type Usuario } from './services/api';

function App() {
  // usuarioSalvo: quem já estava logado continua logado depois de recarregar a página
  const [usuario, setUsuario] = useState<Usuario | null>(usuarioSalvo);
  const [pagina, setPagina] = useState<Pagina>('dashboard');

  // Sem login: só a tela de login. Ao entrar, cai direto no Dashboard.
  if (!usuario){
    return (
        <Login
          onEntrar={(usuarioLogado) => {
            setUsuario(usuarioLogado);
            setPagina(usuarioLogado.tipoUsuario === 'ADMIN' ? 'dashboard' : 'cuidador');
          }}
        />)

  } 

  function sair() {
    logout().catch(() => {});
    setUsuario(null);
    setPagina('dashboard');
  }

  const paginaAtiva: Pagina = usuario.tipoUsuario === 'CUIDADOR' ? 'cuidador' : pagina === 'cuidador' ? 'dashboard' : pagina;
  return (
    <Layout nome={usuario.nome} perfil={usuario.tipoUsuario} pagina={paginaAtiva}
      onNavegar={destino => setPagina(usuario.tipoUsuario === 'ADMIN' ? destino : 'cuidador')} onSair={sair}>
      {usuario.tipoUsuario === 'ADMIN' ? <>
        {paginaAtiva === 'dashboard' && <Dashboard />}
        {paginaAtiva === 'turmas' && <MainTurmas />}
        {paginaAtiva === 'cuidadores' && <MainCuidadores />}
        {paginaAtiva === 'alunos' && <MainAlunos />}
        {paginaAtiva === 'presenca' && <MainPontodePresenca />}
      </> : <AreaCuidador usuario={usuario} />}
    </Layout>
  );
}

export default App;
