import { useState, type SyntheticEvent } from 'react';
import { FiX } from 'react-icons/fi';
import { turmaSchema, faixasEtarias, type TurmaInput } from '@creche/shared/turma';
import { mensagemDeErro, type CuidadorResumo } from '../../services/api';

interface ModalFormTurmaProps {
  isOpen: boolean;
  turmaInicial?: TurmaInput | null;
  cuidadores?: CuidadorResumo[];
  cuidadorIdsIniciais?: number[];
  onClose: () => void;
  onSubmitTurma: (dados: TurmaInput) => void | Promise<void>;
}

export default function ModalFormTurma({
  isOpen,
  turmaInicial = null,
  cuidadores = [],
  cuidadorIdsIniciais = [],
  onClose,
  onSubmitTurma,
}: ModalFormTurmaProps) {
  const isEdicao = Boolean(turmaInicial);

  const [nome, setNome] = useState(turmaInicial?.nome ?? '');
  const [sala, setSala] = useState(turmaInicial?.sala ?? '');
  const turnoAnterior = turmaInicial?.turno.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  const [turno, setTurno] = useState(['manha', 'matutino'].includes(turnoAnterior ?? '') ? 'manha' : ['tarde', 'vespertino'].includes(turnoAnterior ?? '') ? 'tarde' : '');
  const [faixaEtaria, setFaixaEtaria] = useState(turmaInicial?.faixaEtaria ?? '');
  const [cuidadorIds, setCuidadorIds] = useState<number[]>(cuidadorIdsIniciais);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (salvando) return;
    setErro('');
    if (!turno || !faixaEtaria) { setErro('Selecione o turno e a faixa etária da turma.'); return; }
    const validacao = turmaSchema.safeParse({ sala: sala.trim() || null, cuidadorIds, nome: nome.trim(), turno: turno.trim(), faixaEtaria, anoLetivo: turmaInicial?.anoLetivo ?? new Date().getFullYear(), ativo: turmaInicial?.ativo ?? true });
    if (!validacao.success) { setErro(validacao.error.issues.map(i => i.message).join(' · ')); return; }
    setSalvando(true);
    try { await onSubmitTurma(validacao.data); onClose(); }
    catch (e) { setErro(mensagemDeErro(e, 'Não foi possível salvar a turma.')); }
    finally { setSalvando(false); }
  };

  return (
    <div role="dialog" aria-modal="true" aria-labelledby="titulo-form-turma"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
      style={{ fontFamily: "'Comfortaa', sans-serif" }}
    >
      <div className="w-full max-w-[430px] max-h-[90vh] overflow-y-auto bg-[#E1F2FE] rounded-[12px] px-8 pt-8 pb-10 shadow-xl">
        {/* Cabeçalho */}
        <div className="flex items-center justify-between pb-4 border-b-2 border-[#36A3DC]">
          <h2 id="titulo-form-turma"
            className="text-[22px] font-bold text-[#0F172A] pl-2"
            style={{ fontFamily: "'Utendo', sans-serif" }}
          >
            {isEdicao ? 'Modificar Turma' : 'Criar Turma'}
          </h2>

          <button
            type="button"
            onClick={onClose}
            disabled={salvando}
            aria-label="Fechar modal"
            className="text-[#0F172A] hover:opacity-70 transition-opacity cursor-pointer p-1"
          >
            <FiX size={20} strokeWidth={2} />
          </button>
        </div>

        {/* Formulário */}
        <form onSubmit={handleSubmit} className="mt-6 flex flex-col">
          <label htmlFor="turma-nome" className="text-[14px] text-[#0F172A] mb-1.5">
            Nome da Turma
          </label>
          <input
            type="text"
            placeholder={isEdicao ? 'Turma 1' : 'Digite o nome aqui..'}
            id="turma-nome" disabled={salvando} value={nome}
            onChange={(e) => setNome(e.target.value)}
            className="w-full h-[38px] bg-[#F1F5F9] rounded-[6px] px-3 text-[13px] text-[#0F172A] placeholder-[#94A3B8] border border-[#CBD5E1] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#36A3DC] mb-5"
          />

          <label htmlFor="turma-turno" className="text-[14px] text-[#0F172A] mb-1.5">
            Turno
          </label>
          <select id="turma-turno" disabled={salvando} value={turno} onChange={e => setTurno(e.target.value)}
            className="w-full h-[38px] bg-[#F1F5F9] rounded-[6px] px-3 text-[13px] text-[#0F172A] border border-[#CBD5E1] focus:outline-none focus:ring-2 focus:ring-[#36A3DC] mb-5">
            <option value="" disabled>Selecione o turno</option>
            <option value="manha">Manhã</option>
            <option value="tarde">Tarde</option>
          </select>

          <label htmlFor="turma-sala" className="text-[14px] text-[#0F172A] mb-1.5">Sala</label>
          <input id="turma-sala" type="text" placeholder="Ex.: Sala 1" maxLength={50} disabled={salvando} value={sala} onChange={e => setSala(e.target.value)}
            className="w-full h-[38px] bg-[#F1F5F9] rounded-[6px] px-3 text-[13px] text-[#0F172A] border border-[#CBD5E1] focus:outline-none focus:ring-2 focus:ring-[#36A3DC] mb-5" />

          <label htmlFor="turma-faixa-etaria" className="text-[14px] text-[#0F172A] mb-1.5">
            Turma por faixa etária
          </label>
          <select id="turma-faixa-etaria" disabled={salvando} value={faixaEtaria}
            onChange={e => setFaixaEtaria(e.target.value as typeof faixaEtaria)}
            className="w-full h-[38px] bg-[#F1F5F9] rounded-[6px] px-3 text-[13px] text-[#0F172A] border border-[#CBD5E1] focus:outline-none focus:ring-2 focus:ring-[#36A3DC] mb-12">
            <option value="" disabled>Selecione a faixa etária</option>
            {faixasEtarias.map(faixa => <option key={faixa.valor} value={faixa.valor}>{faixa.rotulo}</option>)}
          </select>

          <fieldset disabled={salvando} className="mb-6">
            <legend className="text-sm mb-2">Cuidadores (até 3)</legend>
            <div className="max-h-40 overflow-y-auto space-y-2">
              {cuidadores.filter(c => c.ativo || cuidadorIdsIniciais.includes(c.id)).map(c => <label key={c.id} className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={cuidadorIds.includes(c.id)} disabled={!cuidadorIds.includes(c.id) && (!c.ativo || cuidadorIds.length >= 3)} onChange={e => setCuidadorIds(ids => e.target.checked ? [...ids, c.id] : ids.filter(id => id !== c.id))} />
                {c.nome}{!c.ativo ? ' (inativo)' : ''}
              </label>)}
            </div>
            {cuidadores.length === 0 && <p className="text-sm">Nenhum cuidador disponível.</p>}
            <p className="text-xs mt-2">{cuidadorIds.length}/3 selecionados. Desmarque um cuidador para selecionar outro.</p>
          </fieldset>

          {erro && <p role="alert" className="mb-4 text-red-700 text-sm">{erro}</p>}
          <div className="flex justify-center">
            <button
              type="submit" disabled={salvando}
              className="w-[155px] h-[44px] bg-[#36A3DC] hover:bg-[#2B8EC2] text-white font-bold text-[13px] rounded-full transition-colors cursor-pointer"
            >
              {salvando ? 'Salvando...' : isEdicao ? 'Salvar Alterações' : 'Criar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
