import { useEffect, useState } from 'react';
import { FiPlus, FiTrash2 } from 'react-icons/fi';
import { atividadeSchema, diasPlanner, horarioTurno, type Atividade } from '@creche/shared/atividade';
import type { Turma } from '@creche/shared/turma';
import { criarAtividade, excluirAtividade, listarAtividades, mensagemDeErro } from '../services/api';
import ModalConfirmacao from './modais/ModalConfirmacao';

export default function PlannerTurma({ turma, cuidadorId }: { turma: Turma; cuidadorId?: number }) {
  const [atividades, setAtividades] = useState<Atividade[]>([]);
  const [erro, setErro] = useState('');
  const [carregando, setCarregando] = useState(true);
  const [versao, setVersao] = useState(0);
  const [aberto, setAberto] = useState(false);
  const [excluindo, setExcluindo] = useState<Atividade | null>(null);
  const [dia, setDia] = useState('1');
  const [inicio, setInicio] = useState('');
  const [fim, setFim] = useState('');
  const [descricao, setDescricao] = useState('');
  const [erroForm, setErroForm] = useState('');
  const [salvando, setSalvando] = useState(false);
  const horario = horarioTurno(turma.turno);
  useEffect(() => {
    let cancelado = false;
    listarAtividades(turma.id).then(a => { if (!cancelado) { setAtividades(a); setErro(''); } })
      .catch(e => { if (!cancelado) setErro(mensagemDeErro(e, 'Não foi possível carregar as atividades.')); })
      .finally(() => { if (!cancelado) setCarregando(false); });
    return () => { cancelado = true; };
  }, [turma.id, versao]);
  const minutos = (hora: string) => Number(hora.slice(0, 2)) * 60 + Number(hora.slice(3));
  const formatar = (valor: number) => `${String(Math.floor(valor / 60)).padStart(2, '0')}:${String(valor % 60).padStart(2, '0')}`;
  const faixas: string[] = [];
  if (horario) for (let m = minutos(horario.inicio); m < minutos(horario.fim); m += 30) faixas.push(formatar(m));

  return <section aria-label="Planner semanal" className="mt-6 rounded-xl bg-white p-5 shadow-sm">
    <div className="flex items-center justify-between gap-3 mb-2">
      <h2 className="font-titulo text-lg">Planner semanal de atividades</h2>
      {cuidadorId && turma.ativo && horario && <button type="button" aria-label="Adicionar atividade" title="Adicionar atividade" className="rounded-md bg-pp-botao p-2 text-white" onClick={() => { setAberto(true); setInicio(horario.inicio); setFim(formatar(minutos(horario.inicio) + 30)); setDescricao(''); setErroForm(''); }}><FiPlus size={18} /></button>}
    </div>
    <p className="text-sm mb-4">Segunda a sexta{horario ? ` · ${horario.inicio} às ${horario.fim}` : ''} · Programação semanal</p>
    {erro && <p role="alert" className="mb-3 text-red-700">{erro} <button type="button" className="underline" onClick={() => setVersao(v => v + 1)}>Tentar novamente</button></p>}
    {carregando && <p className="text-sm">Carregando atividades...</p>}
    {!horario ? <p>Defina o turno da turma como Manhã ou Tarde para visualizar os horários.</p> : <div className="overflow-x-auto">
      <table className="w-full min-w-[720px] table-fixed border-collapse text-sm">
        <caption className="sr-only">Atividades semanais de {turma.nome}</caption>
        <thead><tr className="bg-pp-700 text-white"><th scope="col" className="w-28 p-2">Horário</th>{diasPlanner.map(d => <th scope="col" className="p-2" key={d}>{d}</th>)}</tr></thead>
        <tbody>{faixas.map(h => <tr key={h}><th scope="row" className="border border-pp-100 bg-pp-50 p-2 text-xs">{h}–{formatar(minutos(h) + 30)}</th>{diasPlanner.map((d, i) => {
          const presentes = atividades.filter(a => a.diaSemana === i + 1 && a.inicio < formatar(minutos(h) + 30) && a.fim > h);
          return <td key={d} className="align-top border border-pp-100 p-2 h-14">{presentes.map(a => <div key={a.id} className="rounded bg-pp-50 p-2 mb-1 break-words">
            <p className="font-bold">{a.descricao}</p><p className="text-xs">{a.inicio}–{a.fim}</p><p className="text-xs">{a.cuidador.nome}</p>
            {cuidadorId === a.cuidadorId && <button type="button" aria-label={`Excluir atividade ${a.descricao}`} title="Excluir atividade" className="mt-1 p-1 text-red-700" onClick={() => setExcluindo(a)}><FiTrash2 /></button>}
          </div>)}</td>;
        })}</tr>)}</tbody>
      </table>
    </div>}
    {aberto && horario && <div role="dialog" aria-modal="true" aria-labelledby="atividade-titulo" className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <form className="w-full max-w-lg rounded-xl bg-pp-50 p-6" onSubmit={async e => {
        e.preventDefault(); if (salvando) return;
        const validacao = atividadeSchema.safeParse({ diaSemana: Number(dia), inicio, fim, descricao });
        if (!validacao.success) { setErroForm(validacao.error.issues.map(i => i.message).join(' · ')); return; }
        if (inicio < horario.inicio || fim > horario.fim) { setErroForm('Use horários dentro do turno.'); return; }
        setSalvando(true); setErroForm('');
        try { await criarAtividade(turma.id, validacao.data); setAberto(false); setVersao(v => v + 1); }
        catch (e) { setErroForm(mensagemDeErro(e, 'Não foi possível salvar a atividade.')); }
        finally { setSalvando(false); }
      }}>
        <h2 id="atividade-titulo" className="font-titulo text-lg mb-4">Adicionar atividade</h2>
        {erroForm && <p role="alert" className="text-red-700 mb-3">{erroForm}</p>}
        <fieldset disabled={salvando} className="grid gap-3">
          <label>Dia da semana<select className="block w-full p-2" value={dia} onChange={e => setDia(e.target.value)}>{diasPlanner.map((d, i) => <option key={d} value={i + 1}>{d}</option>)}</select></label>
          <label>Início<input type="time" min={horario.inicio} max={horario.fim} className="block w-full p-2" value={inicio} onChange={e => setInicio(e.target.value)} required /></label>
          <label>Término<input type="time" min={horario.inicio} max={horario.fim} className="block w-full p-2" value={fim} onChange={e => setFim(e.target.value)} required /></label>
          <label>Atividade<textarea className="block w-full p-2" maxLength={200} value={descricao} onChange={e => setDescricao(e.target.value)} required /></label>
        </fieldset>
        <div className="flex gap-4 mt-5"><button type="submit" disabled={salvando} className="rounded-md bg-pp-botao px-4 py-2 text-white">{salvando ? 'Salvando...' : 'Salvar atividade'}</button><button type="button" disabled={salvando} onClick={() => setAberto(false)}>Cancelar</button></div>
      </form>
    </div>}
    {excluindo && <ModalConfirmacao isOpen titulo={`Excluir a atividade ${excluindo.descricao}?`} onClose={() => setExcluindo(null)} onConfirmar={async () => { await excluirAtividade(turma.id, excluindo.id); setVersao(v => v + 1); }} />}
  </section>;
}
