import { useState, type SyntheticEvent } from 'react';
import { loginSchema } from '@creche/shared/auth';
import logo from '../assets/imagens/Pequenos_Passos_Logo_1-removebg-preview.png';
import fundologin from '../assets/imagens/fundo login.jpg';
import { login, logout, mensagemDeErro, type Usuario } from '../services/api';

interface LoginProps {
  onEntrar: (usuario: Usuario) => void; // avisa o App que o login deu certo
  onCadastrar?: () => void; // sem tela de cadastro ainda: o botão fica desativado
}

const classeCampo =
  'w-full h-[42px] bg-white rounded-[8px] px-3.5 text-[14px] text-[#111827] placeholder-[#64748B] border border-[#E2E8F0] focus:outline-none focus:ring-2 focus:ring-pp-300 aria-[invalid=true]:border-red-600';

export default function Login({ onEntrar, onCadastrar }: LoginProps) {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState('');
  const [errosCampos, setErrosCampos] = useState<Record<string, string>>({});
  const [carregando, setCarregando] = useState(false);

  const handleSubmit = async (e: SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErro('');
    setErrosCampos({});

    // Valida com o schema do shared antes de enviar; cada mensagem aparece junto do seu campo
    const validacao = loginSchema.safeParse({ email: email.trim(), senha });
    if (!validacao.success) {
      const porCampo: Record<string, string> = {};
      for (const issue of validacao.error.issues) {
        const campo = String(issue.path[0]);
        if (!porCampo[campo]) porCampo[campo] = issue.message;
      }
      setErrosCampos(porCampo);
      return;
    }

    setCarregando(true);
    try {
      const usuario = await login(validacao.data);
      if (usuario.tipoUsuario !== 'ADMIN') {
        await logout();
        setErro('A área do cuidador ainda não está disponível. Entre com uma conta de administrador.');
      } else {
        onEntrar(usuario);
      }
    } catch (e) {
      setErro(mensagemDeErro(e, 'Não foi possível entrar.'));
    }
    setCarregando(false);
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
        <div className="mb-4">
          <img src={logo} alt="Logo Pequenos Passos" className="w-[88px] h-[82px] object-contain" />
        </div>

        <h1
          className="text-[28px] leading-tight font-bold text-[#0F172A] text-center mb-1.5"
          style={{ fontFamily: "'Utendo', sans-serif" }}
        >
          Boas vindas!
        </h1>
        <p className="text-[14px] text-[#334155] text-center mb-8">Faça login para continuar</p>

        <form onSubmit={handleSubmit} noValidate className="w-full max-w-[270px] flex flex-col">
          {erro && (
            <div role="alert" className="mb-4 rounded-md bg-red-100 text-red-700 text-[13px] px-3 py-2 text-center">
              {erro}
            </div>
          )}

          <label htmlFor="login-email" className="sr-only">Email</label>
          <input
            id="login-email"
            type="email"
            autoComplete="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            aria-invalid={Boolean(errosCampos.email)}
            className={classeCampo}
          />
          <span className="text-red-600 text-[12px] min-h-5 mt-1">{errosCampos.email}</span>

          <label htmlFor="login-senha" className="sr-only">Senha</label>
          <input
            id="login-senha"
            type="password"
            autoComplete="current-password"
            placeholder="Senha"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            aria-invalid={Boolean(errosCampos.senha)}
            className={classeCampo}
          />
          <span className="text-red-600 text-[12px] min-h-5 mt-1">{errosCampos.senha}</span>

          <button
            type="button"
            onClick={() => setErro('A recuperação de senha ainda não está disponível. Procure um administrador.')}
            className="self-center text-[12.5px] font-bold text-[#0F172A] hover:underline mt-1 mb-6 cursor-pointer"
          >
            Esqueceu a senha?
          </button>

          <button
            type="submit"
            disabled={carregando}
            className="w-full h-[44px] disabled:opacity-60 bg-pp-botao hover:bg-pp-600 text-white font-bold text-[15px] rounded-full transition-colors cursor-pointer"
          >
            {carregando ? 'Entrando...' : 'Entrar'}
          </button>
        </form>

        <div className="w-full max-w-[310px] flex items-center justify-center gap-4 mt-10">
          <span className="text-[12.5px] text-[#1E293B]">Não se cadastrou?</span>
          <button
            type="button"
            onClick={onCadastrar}
            disabled={!onCadastrar}
            title={onCadastrar ? undefined : 'Em breve'}
            className="disabled:opacity-60 disabled:cursor-not-allowed px-6 py-2 rounded-full border border-[#475569] text-[12.5px] font-normal text-[#0F172A] hover:bg-white/60 transition-colors cursor-pointer"
          >
            Cadastre-se
          </button>
        </div>
      </main>
    </div>
  );
}