import { useState, type ReactNode } from 'react';
import {
  FiChevronDown,
  FiChevronUp,
  FiClipboard,
  FiGrid,
  FiLogOut,
  FiUser,
  FiUserCheck,
  FiUsers,
} from 'react-icons/fi';
import logo from '../assets/imagens/Pequenos_Passos_Logo__1_-removebg-preview.png';

export type Pagina = 'dashboard' | 'turmas' | 'cuidadores' | 'presenca' | 'cuidador' | 'alunos';

const itensAdmin: { id: Pagina; rotulo: string; icone: ReactNode }[] = [
  { id: 'dashboard', rotulo: 'Dashboard', icone: <FiGrid size={18} /> },
  { id: 'turmas', rotulo: 'Gestão de Turmas', icone: <FiUsers size={18} /> },
  { id: 'alunos', rotulo: 'Aluno', icone: <FiUser size={18} /> },
  { id: 'cuidadores', rotulo: 'Cuidadores', icone: <FiUserCheck size={18} /> },
  { id: 'presenca', rotulo: 'Lista de Presença', icone: <FiClipboard size={18} /> },
];

interface LayoutProps {
  nome: string;
  perfil: 'ADMIN' | 'CUIDADOR';
  pagina: Pagina;
  onNavegar: (pagina: Pagina) => void;
  onSair: () => void;
  children: ReactNode;
}

// Moldura das telas internas: cabeçalho, menu lateral e área de conteúdo
export default function Layout({ nome, perfil, pagina, onNavegar, onSair, children }: LayoutProps) {
  const [menuAberto, setMenuAberto] = useState(true);
  const itens = perfil === 'ADMIN' ? itensAdmin : [
    { id: 'cuidador' as const, rotulo: 'Minha área', icone: <FiUser size={18} /> },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-white font-texto text-pp-700">
      {/* Cabeçalho */}
      <header className="h-16 flex items-center justify-between px-5 border-b border-pp-100">
        <img src={logo} alt="Logo Pequenos Passos" className="h-12 object-contain" />
        <div className="flex items-center gap-3 text-[14px]">
          <FiUser size={18} />
          <span className="font-bold">{nome}</span>
          <button
            type="button"
            onClick={onSair}
            aria-label="Sair"
            title="Sair"
            className="p-1.5 rounded-full hover:bg-pp-50 cursor-pointer"
          >
            <FiLogOut size={18} />
          </button>
        </div>
      </header>

      {/* Menu no celular */}
      <nav className="md:hidden flex gap-2 overflow-x-auto p-2 border-b border-pp-100">
        {itens.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => onNavegar(item.id)}
            className={`shrink-0 px-3 py-1.5 rounded-full text-[13px] cursor-pointer ${
              pagina === item.id ? 'bg-pp-300 text-white' : 'bg-pp-50'
            }`}
          >
            {item.rotulo}
          </button>
        ))}
      </nav>

      <div className="flex flex-1">
        {/* Menu lateral */}
        <aside className="hidden md:block w-64 shrink-0 pt-6 pl-3 pr-2">
          <button type="button" onClick={() => setMenuAberto(!menuAberto)} aria-expanded={menuAberto}
            className="w-full flex items-center gap-2 px-2 py-2 text-[14px] text-pp-300 cursor-pointer">
            <FiUser size={18} />
            <span className="flex-1 text-left">{perfil === 'ADMIN' ? 'Área do Administrador' : 'Área do Cuidador'}</span>
            {menuAberto ? <FiChevronUp size={16} /> : <FiChevronDown size={16} />}
          </button>
          {menuAberto && (
            <ul className="mt-1 ml-3 flex flex-col gap-1">
              {itens.map(item => (
                <li key={item.id}>
                  <button type="button" onClick={() => onNavegar(item.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2 text-[13px] text-left border-l-4 cursor-pointer ${pagina === item.id ? 'border-pp-300 bg-pp-50 font-bold' : 'border-transparent hover:bg-pp-50/60'}`}>
                    {item.icone}{item.rotulo}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </aside>

        {/* Conteúdo */}
        <main className="flex-1 min-w-0 bg-pp-50 p-5 md:p-8">{children}</main>
      </div>
    </div>
  );
}
