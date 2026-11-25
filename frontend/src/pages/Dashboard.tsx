import { useEffect, useState, type ReactNode } from 'react';
import { FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import type { Turma } from '@creche/shared/turma';
import type { Aluno } from '@creche/shared/aluno';
import type { TurmaCuidador } from '@creche/shared/turmaCuidador';
import {
  listarAlunos,
  listarCuidadores,
  listarPontoDoDia,
  listarTurmas,
  listarVinculos,
  mensagemDeErro,
  type CuidadorResumo,
  type PresencaCuidador,
  type StatusPresenca,
} from '../services/api';

const STATUS: Record<StatusPresenca, { rotulo: string; classe: string }> = {
  presente: { rotulo: 'Presente', classe: 'bg-green-600 text-white' },
  falta_justificada: { rotulo: 'Justificado', classe: 'bg-pp-amarelo text-pp-700' },
  falta: { rotulo: 'Falta', classe: 'bg-red-600 text-white' },
};

// AAAA-MM-DD no fuso local (toISOString usaria UTC e poderia trocar o dia)
function paraISO(d: Date) {
  const mes = String(d.getMonth() + 1).padStart(2, '0');
  const dia = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${mes}-${dia}`;
}

function Cartao({ titulo, children, className = '' }: { titulo: string; children: ReactNode; className?: string }) {
  return (
    <section className={`rounded-2xl bg-pp-500 text-white shadow-md p-5 ${className}`}>
      <h2 className="font-titulo text-[17px] text-center mb-4">{titulo}</h2>
      {children}
    </section>
  );
}

function CartaoNumero({ titulo, valor }: { titulo: string; valor: number }) {
  return (
    <section className="rounded-2xl bg-pp-500 text-white shadow-md px-5 py-4 text-center">
      <h2 className="font-titulo text-[16px] pb-1 border-b border-white/70 mx-4">{titulo}</h2>
      <p className="text-[32px] font-bold mt-3">{valor}</p>
      <p className="font-desc text-[12px] opacity-90">ao total.</p>
    </section>
  );
}

export default function Dashboard() {
  const [turmas, setTurmas] = useState<Turma[]>([]);
  const [cuidadores, setCuidadores] = useState<CuidadorResumo[]>([]);
  const [alunos, setAlunos] = useState<Aluno[]>([]);
  const [vinculos, setVinculos] = useState<TurmaCuidador[]>([]);
  const [presencas, setPresencas] = useState<PresencaCuidador[]>([]);
  const [dia, setDia] = useState(() => new Date());
  const [erro, setErro] = useState('');

  // Listas do painel: buscadas uma vez, quando a tela aparece
  useEffect(() => {
    let cancelado = false;
    Promise.all([listarTurmas(), listarCuidadores(), listarAlunos(), listarVinculos()])
      .then(([t, c, a, v]) => {
        if (cancelado) return;
        setTurmas(t);
        setCuidadores(c);
        setAlunos(a);
        setVinculos(v);
      })
      .catch((e) => {
        if (!cancelado) setErro(mensagemDeErro(e, 'Não foi possível carregar o painel.'));
      });
    return () => {
      cancelado = true;
    };
  }, []);

  // Ponto de presença: busca de novo toda vez que o dia muda
  const diaISO = paraISO(dia);
  useEffect(() => {
    let cancelado = false;
    listarPontoDoDia(diaISO)
      .then((registros) => {
        if (!cancelado) setPresencas(registros);
      })
      .catch((e) => {
        if (!cancelado) setErro(mensagemDeErro(e, 'Não foi possível carregar o ponto de presença.'));
      });
    return () => {
      cancelado = true;
    };
  }, [diaISO]);

  function mudarDia(dias: number) {
    setDia(new Date(dia.getFullYear(), dia.getMonth(), dia.getDate() + dias));
  }

  const turmasAtivas = turmas.filter((t) => t.ativo);
  const cuidadoresAtivos = cuidadores.filter((c) => c.ativo);
  const alunosAtivos = alunos.filter((a) => a.ativo);

  function turmaDoCuidador(cuidadorId: number) {
    const vinculo = vinculos.find((v) => v.cuidadorId === cuidadorId);
    return turmas.find((t) => t.id === vinculo?.turmaId)?.nome ?? '—';
  }

  const tituloData = dia.toLocaleDateString('pt-BR', { day: 'numeric', month: 'short', year: 'numeric' });

  return (
    <div className="font-texto">
      <h1 className="font-titulo text-[22px] font-bold mb-5">Painel Administrativo</h1>

      {erro && (
        <div role="alert" className="mb-4 rounded-md bg-red-100 text-red-700 text-[14px] px-4 py-3">
          {erro}
        </div>
      )}

      {/* Ponto de presença do dia */}
      <section className="rounded-2xl bg-pp-500 text-white shadow-md p-5 mb-5">
        <div className="flex items-center justify-between mb-4 px-2">
          <button type="button" onClick={() => mudarDia(-1)} aria-label="Dia anterior" className="p-1 cursor-pointer">
            <FiChevronLeft size={20} />
          </button>
          <h2 className="font-titulo text-[17px] text-center">Ponto de Presença de {tituloData}</h2>
          <button type="button" onClick={() => mudarDia(1)} aria-label="Próximo dia" className="p-1 cursor-pointer">
            <FiChevronRight size={20} />
          </button>
        </div>
        <div className="rounded-lg bg-pp-600 p-3 overflow-x-auto">
          <table className="w-full text-[13px] text-center min-w-[420px]">
            <thead>
              <tr className="border-b border-white/60">
                <th className="py-2 font-normal">Cuidador</th>
                <th className="py-2 font-normal border-x border-white/60">Turma</th>
                <th className="py-2 font-normal">Status</th>
              </tr>
            </thead>
            <tbody>
              {presencas.length === 0 && (
                <tr>
                  <td colSpan={3} className="py-4 font-desc">Nenhum ponto registrado neste dia.</td>
                </tr>
              )}
              {presencas.map((p) => (
                <tr key={p.id}>
                  <td className="py-2">{cuidadores.find((c) => c.id === p.cuidadorId)?.nome ?? `Cuidador ${p.cuidadorId}`}</td>
                  <td className="py-2 border-x border-white/60">{turmaDoCuidador(p.cuidadorId)}</td>
                  <td className="py-2">
                    <span className={`inline-block min-w-[78px] rounded px-2 py-0.5 text-[12px] font-bold ${STATUS[p.status].classe}`}>
                      {STATUS[p.status].rotulo}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <div className="grid gap-5 lg:grid-cols-[1fr_210px]">
        <div className="flex flex-col gap-5 min-w-0">
          <Cartao titulo="Turmas Disponíveis">
            <div className="rounded-lg bg-pp-600 p-3 max-h-56 overflow-y-auto">
              <table className="w-full text-[13px]">
                <tbody>
                  {turmasAtivas.map((t) => (
                    <tr key={t.id} className="border-b border-white/30 last:border-0">
                      <td className="py-1.5 pl-2">{t.nome}</td>
                      <td className="py-1.5 pl-2">{t.turno}</td>
                    </tr>
                  ))}
                  {turmasAtivas.length === 0 && (
                    <tr><td className="py-2 font-desc">Nenhuma turma cadastrada.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </Cartao>

          <Cartao titulo="Cuidadores Disponíveis">
            <div className="rounded-lg bg-pp-600 p-3 max-h-56 overflow-y-auto">
              <table className="w-full text-[13px]">
                <tbody>
                  {cuidadoresAtivos.map((c) => (
                    <tr key={c.id} className="border-b border-white/30 last:border-0">
                      <td className="py-1.5 pl-2">{c.nome}</td>
                      <td className="py-1.5 pl-2 break-all">{c.email}</td>
                    </tr>
                  ))}
                  {cuidadoresAtivos.length === 0 && (
                    <tr><td className="py-2 font-desc">Nenhum cuidador cadastrado.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </Cartao>
        </div>

        <div className="flex lg:flex-col gap-5">
          <div className="flex-1"><CartaoNumero titulo="Cuidadores" valor={cuidadoresAtivos.length} /></div>
          <div className="flex-1"><CartaoNumero titulo="Turmas" valor={turmasAtivas.length} /></div>
          <div className="flex-1"><CartaoNumero titulo="Alunos" valor={alunosAtivos.length} /></div>
        </div>
      </div>
    </div>
  );
}