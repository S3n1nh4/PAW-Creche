import { useState, type SyntheticEvent } from 'react';
import logo from '../assets/imagens/Pequenos_Passos_Logo__1_-removebg-preview.png';
import fundologin from '../assets/imagens/fundo login.jpg';

export default function Login() {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState('');

  const handleSubmit = async (e: SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!email.trim() || !senha.trim()) {
      setErro('Por favor, preencha o e-mail e a senha.');
      return;
    }
    setErro('');
    console.log('Dados enviados:', { email, senha });
  };

  return (
    <div
      className="min-h-screen w-full flex justify-center bg-cover bg-center bg-no-repeat"
      style={{
        backgroundImage: `url(${fundologin})`,
        fontFamily: "'Coco Gothic', sans-serif",
      }}
    >
      {/* Coluna central azul-bebê fiel ao protótipo */}
      <main className="w-full max-w-[430px] min-h-screen bg-[#E1F2FE] flex flex-col items-center justify-center px-8 py-10">
        {/* Logotipo */}
        <div className="mb-4">
          <img
            src={logo}
            alt="Logo Pequenos Passos"
            className="w-[88px] h-[82px] object-contain"
          />
        </div>

        {/* Título e subtítulo */}
        <h1
          className="text-[28px] leading-tight font-bold text-[#0F172A] text-center mb-1.5"
          style={{ fontFamily: "'Utendo', sans-serif" }}
        >
          Boas vindas!
        </h1>
        <p className="text-[14px] text-[#334155] text-center mb-8">
          Faça login para continuar
        </p>

        {/* Formulário */}
        <form
          onSubmit={handleSubmit}
          className="w-full max-w-[270px] flex flex-col items-center"
        >
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full h-[42px] bg-white rounded-[8px] px-3.5 text-[14px] text-[#111827] placeholder-[#64748B] border border-[#E2E8F0] focus:outline-none focus:ring-2 focus:ring-[#36A3DC] mb-4"
          />

          <input
            type="password"
            placeholder="Senha"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            className="w-full h-[42px] bg-white rounded-[8px] px-3.5 text-[14px] text-[#111827] placeholder-[#64748B] border border-[#E2E8F0] focus:outline-none focus:ring-2 focus:ring-[#36A3DC] mb-3"
          />

          {erro && (
            <span className="text-[#DC2626] text-[12px] font-bold mb-3 text-center">
              {erro}
            </span>
          )}

          <a
            href="#recuperar-senha"
            className="text-[12.5px] font-bold text-[#0F172A] hover:underline mb-6"
          >
            Esqueceu a senha?
          </a>

          <button
            type="submit"
            className="w-full h-[44px] bg-[#36A3DC] hover:bg-[#2B8EC2] text-white font-bold text-[15px] rounded-full border border-[#1E78A8] transition-colors cursor-pointer"
          >
            Entrar
          </button>
        </form>

        {/* Rodapé de cadastro alinhado ao protótipo */}
        <div className="w-full max-w-[310px] flex items-center justify-center gap-4 mt-10">
          <span className="text-[12.5px] text-[#1E293B]">
            Não se cadastrou?
          </span>
          <button
            type="button"
            onClick={() => console.log('Navegar para cadastro')}
            className="px-6 py-2 rounded-full border border-[#475569] text-[12.5px] font-normal text-[#0F172A] hover:bg-white/60 transition-colors cursor-pointer"
          >
            Cadastre-se
          </button>
        </div>
      </main>
    </div>
  );
}