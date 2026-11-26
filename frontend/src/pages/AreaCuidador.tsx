import { useEffect, useState } from 'react';
import type { Turma } from '@creche/shared/turma';
import { listarTurmasPlanner, mensagemDeErro, type Usuario } from '../services/api';
import PlannerTurma from '../components/PlannerTurma';

export default function AreaCuidador({ usuario }: { usuario: Usuario }) {
  const [turmas, setTurmas] = useState<Turma[]>([]);
  const [erro, setErro] = useState('');
  const [carregando, setCarregando] = useState(true);
  useEffect(() => {
    let cancelado = false;
    listarTurmasPlanner().then(t => { if (!cancelado) setTurmas(t); })
      .catch(e => { if (!cancelado) setErro(mensagemDeErro(e, 'Não foi possível carregar suas turmas.')); })
      .finally(() => { if (!cancelado) setCarregando(false); });
    return () => { cancelado = true; };
  }, []);
  return <section>
    <h1 className="font-titulo text-[22px] mb-4">Área do Cuidador</h1>
    <p>Olá, {usuario.nome}. Planeje as atividades das suas turmas abaixo.</p>
    {erro && <p role="alert" className="text-red-700 mt-3">{erro}</p>}
    {carregando && <p>Carregando turmas...</p>}
    {!carregando && !erro && !turmas.length && <p className="mt-3">Nenhuma turma ativa vinculada.</p>}
    {turmas.map(t => <div key={t.id} className="mt-6"><h2 className="font-titulo text-lg">{t.nome} · Sala: {t.sala ?? 'Não informada'}</h2><PlannerTurma turma={t} cuidadorId={usuario.id} /></div>)}
  </section>;
}
