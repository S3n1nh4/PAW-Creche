import { useState, type SyntheticEvent } from 'react';
import { FiUser, FiX } from 'react-icons/fi';
import { cadastroCuidadorSchema, atualizarCuidadorSchema, type AtualizarCuidadorInput } from '@creche/shared/cuidador';
import { mensagemDeErro, type CuidadorResumo } from '../../services/api';
import type { Turma } from '@creche/shared/turma';
import { formatarCelular, formatarSalarioInicial, formatarSalarioDigitado, lerSalario, somenteDigitos } from '../../utils/camposCuidador';

export interface DadosFormularioCuidador {
  cuidador: AtualizarCuidadorInput;
  turmaIds: number[];
}

interface ModalCriarCuidadorProps {
  isOpen: boolean;
  turmasDisponiveis?: Turma[];
  onClose: () => void;
  cuidadorInicial?: CuidadorResumo | null;
  turmaIdsIniciais?: number[];
  onSalvar: (dados: DadosFormularioCuidador) => void | Promise<void>;
}

export default function ModalCriarCuidador({
  isOpen,
  turmasDisponiveis = [],
  onClose,
  onSalvar,
  cuidadorInicial = null,
  turmaIdsIniciais = [],
}: ModalCriarCuidadorProps) {
  const [nome, setNome] = useState(cuidadorInicial?.nome ?? '');
  const [email, setEmail] = useState(cuidadorInicial?.email ?? '');
  const [telefone, setTelefone] = useState(formatarCelular(cuidadorInicial?.telefone ?? ''));
  const [salarioBase, setSalarioBase] = useState(cuidadorInicial ? formatarSalarioInicial(cuidadorInicial.salarioBase) : '');
  const [turmas, setTurmas] = useState<number[]>(turmaIdsIniciais);

  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState('');
  const [salvando, setSalvando] = useState(false);
  const edicao = cuidadorInicial !== null;

  if (!isOpen) return null;

  const handleSubmit = async (e: SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (salvando) return;
    setErro('');
    const celular = somenteDigitos(telefone);
    if (!/^\d{2}9\d{8}$/.test(celular)) {
      setErro('Informe o celular com DDD e 11 dígitos, no formato (11) 9 9999-9999.');
      return;
    }
    const dados = {
      nome: nome.trim(), email, telefone: celular,
      salarioBase: lerSalario(salarioBase),
      ativo: cuidadorInicial?.ativo ?? true,
      ...(senha !== '' ? { senha } : {}),
    };
    const validacao = (edicao ? atualizarCuidadorSchema : cadastroCuidadorSchema).safeParse(dados);
    if (!validacao.success) { setErro(validacao.error.issues.map(i => i.message).join(' · ')); return; }
    setSalvando(true);
    try { await onSalvar({ cuidador: validacao.data, turmaIds: turmas }); onClose(); }
    catch (e) { setErro(mensagemDeErro(e, 'Não foi possível salvar o cuidador e suas turmas.')); }
    finally { setSalvando(false); }
  };

  return (
    <div role="dialog" aria-modal="true" aria-labelledby="titulo-form-cuidador"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      style={{ fontFamily: "'Comfortaa', sans-serif" }}
    >
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-[460px] bg-[#E1F2FE] rounded-[16px] overflow-hidden shadow-xl"
      >
        <h2 id="titulo-form-cuidador" className="px-7 pt-5 font-bold">{edicao ? 'Editar cuidador' : 'Cadastrar cuidador'}</h2>
        {/* Cabeçalho com ícone e campo Nome completo */}
        <div className="bg-[#C8E6FC] px-7 py-5 flex items-center justify-between gap-3">
          <div className="flex items-center gap-4 flex-1">
            <div className="w-12 h-12 rounded-full border-2 border-[#334155] flex items-center justify-center text-[#334155] shrink-0">
              <FiUser size={24} strokeWidth={1.8} />
            </div>

            <div className="flex flex-col flex-1 max-w-[240px]">
              <label
                htmlFor="nome-cuidador"
                className="text-[13px] font-bold text-[#0F172A] mb-1"
                style={{ fontFamily: "'Utendo', sans-serif" }}
              >
                Nome completo
              </label>
              <input
                id="nome-cuidador" disabled={salvando}
                type="text"
                placeholder="Digite o nome completo.."
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                className="w-full h-[34px] bg-[#F1F5F9] rounded-[6px] px-3 text-[12.5px] text-[#0F172A] placeholder-[#94A3B8] border border-[#CBD5E1] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#36A3DC]"
              />
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={salvando}
            aria-label="Fechar modal"
            className="text-[#0F172A] hover:opacity-70 transition-opacity cursor-pointer p-1 self-start"
          >
            <FiX size={20} strokeWidth={2} />
          </button>
        </div>

        {erro && <p role="alert" className="px-7 pt-4 text-red-700 text-sm">{erro}</p>}
        {/* Corpo com campos em duas colunas e divisor vertical azul */}
        <div className="px-7 pt-6 pb-7 grid grid-cols-[1fr_2px_1fr] gap-x-6 items-start">
          {/* Coluna esquerda */}
          <div className="flex flex-col gap-5">
            <div>
              <label htmlFor="email-cuidador" className="block text-[13px] font-bold text-[#0F172A] mb-1.5">
                Email
              </label>
              <input
                type="text" inputMode="email"
                placeholder="Digite o email..."
                id="email-cuidador" disabled={salvando} value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full h-[34px] bg-[#F1F5F9] rounded-[6px] px-3 text-[12.5px] text-[#0F172A] placeholder-[#94A3B8] border border-[#CBD5E1] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#36A3DC]"
              />
            </div>

            <div>
              <label htmlFor="turmas-cuidador" className="block text-[13px] font-bold text-[#0F172A] mb-1.5">
                Turmas
              </label>
              <select id="turmas-cuidador" multiple size={4} value={turmas.map(String)}
                disabled={salvando || turmasDisponiveis.length === 0}
                aria-describedby="ajuda-turmas-cuidador"
                onChange={e => setTurmas(Array.from(e.target.selectedOptions, option => Number(option.value)))}
                className="w-full bg-[#F1F5F9] p-2 rounded-[6px] text-[12px] border border-[#CBD5E1] focus:outline-none focus:ring-2 focus:ring-[#36A3DC]">
                {turmasDisponiveis.length === 0 && <option disabled>Nenhuma turma disponível</option>}
                {turmasDisponiveis.map(turma => <option key={turma.id} value={turma.id}>
                  {turma.nome} — {turma.turno === 'manha' ? 'Manhã' : turma.turno === 'tarde' ? 'Tarde' : turma.turno}
                </option>)}
              </select>
              <p id="ajuda-turmas-cuidador" className="mt-1 text-[11px] text-[#475569]">Use Ctrl (ou ⌘) para selecionar mais de uma turma.</p>
            </div>
          </div>

          {/* Divisor vertical azul */}
          <div className="h-full min-h-[215px] w-[2px] bg-[#36A3DC]" />

          {/* Coluna direita */}
          <div className="flex flex-col gap-5">
            <div>
              <label htmlFor="telefone-cuidador" className="block text-[13px] font-bold text-[#0F172A] mb-1.5">
                Telefone
              </label>
              <input
                type="tel" inputMode="tel" autoComplete="tel-national"
                placeholder="(11) 9 9999-9999"
                id="telefone-cuidador" disabled={salvando} value={telefone}
                onChange={(e) => setTelefone(formatarCelular(e.target.value))}
                className="w-full h-[34px] bg-[#F1F5F9] rounded-[6px] px-3 text-[12.5px] text-[#0F172A] placeholder-[#94A3B8] border border-[#CBD5E1] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#36A3DC]"
              />
            </div>

            <div>
              <label htmlFor="salario-cuidador" className="block text-[13px] font-bold text-[#0F172A] mb-1.5">
                Salário
              </label>
              <input
                type="text"
                inputMode="numeric"
                placeholder="2.500,00"
                id="salario-cuidador" disabled={salvando} value={salarioBase}
                onChange={(e) => setSalarioBase(formatarSalarioDigitado(e.target.value))}
                className="w-[140px] h-[34px] bg-[#F1F5F9] rounded-[6px] px-3 text-[12.5px] text-[#0F172A] placeholder-[#94A3B8] border border-[#CBD5E1] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#36A3DC]"
              />
            </div>

            <div>
              <label htmlFor="senha-cuidador" className="block text-[13px] font-bold mb-1.5">
                {edicao ? 'Nova senha (opcional)' : 'Senha'}
              </label>
              <input id="senha-cuidador" type="password" value={senha} onChange={e => setSenha(e.target.value)}
                autoComplete="new-password" disabled={salvando}
                className="w-full h-[34px] bg-[#F1F5F9] rounded-[6px] px-3 text-[12.5px] border border-[#CBD5E1]" />
              {edicao && <p className="text-xs mt-1">Deixe em branco para manter a senha atual.</p>}
            </div>
            <div className="pt-3 flex justify-end">
              <button
                type="submit" disabled={salvando}
                className="px-6 h-[38px] bg-[#36A3DC] hover:bg-[#2B8EC2] text-white font-bold text-[13px] rounded-full transition-colors cursor-pointer"
              >
                {salvando ? 'Salvando...' : 'Salvar'}
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
