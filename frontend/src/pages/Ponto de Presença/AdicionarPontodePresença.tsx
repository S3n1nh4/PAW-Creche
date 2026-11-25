import { useEffect, useRef, useState } from 'react';
import { FiChevronDown } from 'react-icons/fi';
import {
  atualizarPresencaCuidadorSchema,
  presencaCuidadorSchema,
} from '@creche/shared/presencaCuidador';
import {
  atualizarPonto,
  criarPonto,
  errosPorCampo,
  mensagemDeErro,
  type CuidadorResumo,
  type PresencaCuidador,
  type StatusPresenca,
} from '../../services/api';

interface AdicionarPontoProps {
  cuidador: CuidadorResumo;
  data: string; // AAAA-MM-DD
  registro: PresencaCuidador | null; // ponto que já existe neste dia (ou null)
  onSalvo: () => void; // recarrega a lista
  onErro: (mensagem: string) => void; // mostra o aviso na tela
}

// Cores e textos do Figma (verde / amarelo / vermelho)
const OPCOES: { valor: StatusPresenca; rotulo: string; classe: string }[] = [
  { valor: 'presente', rotulo: 'Presente', classe: 'bg-green-700 text-white' },
  { valor: 'falta_justificada', rotulo: 'Justificado', classe: 'bg-[#DDD617] text-[#123A4B]' },
  { valor: 'falta', rotulo: 'Ausente', classe: 'bg-red-600 text-white' },
];

export default function AdicionarPontodePresenca({
  cuidador,
  data,
  registro,
  onSalvo,
  onErro,
}: AdicionarPontoProps) {
  const [aberto, setAberto] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [posicao, setPosicao] = useState({ top: 0, left: 0 });
  const raiz = useRef<HTMLDivElement>(null);
  const botao = useRef<HTMLButtonElement>(null);

  // Fecha ao clicar fora, apertar Esc, rolar ou redimensionar a tela
  useEffect(() => {
    if (!aberto) return;
    const fechar = () => setAberto(false);
    const aoClicar = (e: MouseEvent) => {
      if (!raiz.current?.contains(e.target as Node)) setAberto(false);
    };
    const aoApertar = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setAberto(false);
    };
    document.addEventListener('mousedown', aoClicar);
    document.addEventListener('keydown', aoApertar);
    window.addEventListener('scroll', fechar, true);
    window.addEventListener('resize', fechar);
    return () => {
      document.removeEventListener('mousedown', aoClicar);
      document.removeEventListener('keydown', aoApertar);
      window.removeEventListener('scroll', fechar, true);
      window.removeEventListener('resize', fechar);
    };
  }, [aberto]);

  function alternar() {
    if (!aberto && botao.current) {
      // a lista abre com position: fixed, assim a tabela não corta as opções
      const r = botao.current.getBoundingClientRect();
      setPosicao({ top: r.bottom + 4, left: r.left + r.width / 2 });
    }
    setAberto(!aberto);
  }

  async function escolher(status: StatusPresenca) {
    setAberto(false);
    if (registro?.status === status) return;
    onErro('');
    setSalvando(true);
    try {
      if (registro) {
        // Já existe ponto neste dia: atualiza. Falta não pode ter horário (a API recusa).
        const dados = atualizarPresencaCuidadorSchema.safeParse({
          status,
          entrada: status === 'presente' ? registro.entrada : null,
          saida: status === 'presente' ? registro.saida : null,
          observacao: registro.observacao,
        });
        if (!dados.success) {
          onErro(dados.error.issues[0]?.message ?? 'Dados inválidos.');
          return;
        }
        await atualizarPonto(registro.id, dados.data);
      } else {
        // Ainda não existe: cria o ponto do dia
        const dados = presencaCuidadorSchema.safeParse({
          cuidadorId: cuidador.id,
          data,
          status,
          entrada: null,
          saida: null,
        });
        if (!dados.success) {
          onErro(dados.error.issues[0]?.message ?? 'Dados inválidos.');
          return;
        }
        await criarPonto(dados.data);
      }
      onSalvo();
    } catch (e) {
      const detalhes = Object.values(errosPorCampo(e));
      onErro(
        detalhes.length > 0
          ? `${cuidador.nome}: ${detalhes.join(' · ')}`
          : mensagemDeErro(e, `Não foi possível salvar o status de ${cuidador.nome}.`),
      );
    } finally {
      setSalvando(false);
    }
  }

  const atual = OPCOES.find((o) => o.valor === registro?.status);

  return (
    <div ref={raiz} className="inline-block">
      <button
        ref={botao}
        type="button"
        onClick={alternar}
        disabled={salvando}
        aria-haspopup="listbox"
        aria-expanded={aberto}
        aria-label={`Status de ${cuidador.nome}`}
        className={`flex items-center justify-between gap-1 w-[112px] h-7 rounded px-2 text-[12px] cursor-pointer disabled:opacity-60 ${
          atual ? `${atual.classe} font-bold` : 'bg-white text-[#475569]'
        }`}
      >
        <span className="flex-1 text-center">{salvando ? 'Salvando...' : (atual?.rotulo ?? '')}</span>
        <FiChevronDown size={13} aria-hidden="true" />
      </button>

      {aberto && (
        <ul
          role="listbox"
          aria-label={`Escolher status de ${cuidador.nome}`}
          style={{ position: 'fixed', top: posicao.top, left: posicao.left, transform: 'translateX(-50%)' }}
          className="z-50 w-[132px] flex flex-col gap-2 rounded-md bg-white p-2 shadow-lg"
        >
          {OPCOES.map((o) => (
            <li key={o.valor} role="option" aria-selected={o.valor === registro?.status}>
              <button
                type="button"
                onClick={() => escolher(o.valor)}
                className={`w-full h-6 rounded text-[12px] font-bold cursor-pointer hover:opacity-85 ${o.classe}`}
              >
                {o.rotulo}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}