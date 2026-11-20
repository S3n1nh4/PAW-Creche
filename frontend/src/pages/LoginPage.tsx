import { useState } from 'react';
import logo from '../assets/imagens/Pequenos_Passos_Logo__1_-removebg-preview.png'
import fundologin from '../assets/imagens/fundo login.jpg'

export default function Login() {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!email || !senha) {
      setErro('Por favor, preencha o e-mail e a senha.');
      return;
    }
    setErro('');
    console.log('Dados enviados:', { email, senha });
  };

  return (
    <div
      className="min-h-screen w-full flex justify-center bg-cover bg-center"
      style={{
        backgroundImage: `url(${fundologin})`,
        fontFamily: "'Coco Gothic', sans-serif"
      }}
    >
      <main className="w-full max-w-[460px] min-h-screen bg-[#E1F2FE] flex flex-col items-center justify-between py-12 px-8 shadow-2xl">
        <div className="w-full flex flex-col items-center">
          {/* Logotipo Pequenos Passos */}
          <div className="mb-5">
            <img
                src={logo}
                alt="Logo Pequenos Passos"
                className="w-24 h-[88px] object-contain"
            />
</div>

          {/* Títulos */}
          <h1 
            className="text-[28px] font-bold text-[#111827] tracking-tight mb-2"
            style={{ fontFamily: "'Utendo', sans-serif" }}
          >
            Boas vindas!
          </h1>
          <p 
            className="text-[15px] text-[#374151] mb-9"
            
          >
            Faça login para continuar
          </p>

          {/* Formulário */}
          <form onSubmit={handleSubmit} className="w-full max-w-[300px] flex flex-col items-center">
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full h-[46px] bg-white rounded-lg px-4 text-[15px] text-gray-800 placeholder-[#6B7280] shadow-sm focus:outline-none focus:ring-2 focus:ring-[#36A3DC] mb-5"
              
            />

            <input
              type="password"
              placeholder="Senha"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              className="w-full h-[46px] bg-white rounded-lg px-4 text-[15px] text-gray-800 placeholder-[#6B7280] shadow-sm focus:outline-none focus:ring-2 focus:ring-[#36A3DC] mb-4"
              
            />

            {erro && (
              <span 
              className="text-red-600 text-xs font-bold mb-3 text-center"
              style={{ fontFamily: "'Coco Gothic', sans-serif" }}
              >
                {erro}
              </span>
            )}

            <a
              href="#recuperar-senha"
              className="text-[13px] font-bold text-[#111827] hover:underline mb-8"
            >
              Esqueceu a senha?
            </a>

            <button
              type="submit"
              className="w-full h-[48px] bg-[#36A3DC] hover:bg-[#2b8ec2] text-white font-bold text-[16px] rounded-full border border-[#237aa8] shadow-sm transition-colors cursor-pointer"
            >
              Entrar
            </button>
          </form>
        </div>

        {/* Rodapé de Cadastro */}
        <div className="flex items-center justify-center gap-4 mt-8">
          <span 
            className="text-[13px] text-[#1F2937]"
          >
            Não se cadastrou?
          </span>
          <button
            type="button"
            onClick={() => console.log('Navegar para cadastro')}
            className="px-6 py-2.5 rounded-full border border-[#4B5563] text-[13px] font-normal text-[#111827] hover:bg-white/60 transition-colors cursor-pointer"
          >
            Cadastre-se
          </button>
        </div>
      </main>
    </div>
  );
}