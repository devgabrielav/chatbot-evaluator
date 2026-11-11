import { useEffect, useState } from 'react';
import { api } from './api';
import type { Run, Scenario, Stat } from './types';

const pct = (n: number) => `${Math.round(n * 100)}%`;
const nota = (n: number) => n.toFixed(1).replace('.', ',');

export default function App() {
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [stats, setStats] = useState<Stat[]>([]);
  const [runs, setRuns] = useState<Run[]>([]);
  const [selected, setSelected] = useState<Run | null>(null);
  const [runningId, setRunningId] = useState<number | null>(null);
  const [error, setError] = useState('');

  const load = async () => {
    const [s, st, r] = await Promise.all([api.scenarios(), api.stats(), api.runs()]);
    setScenarios(s);
    setStats(st);
    setRuns(r);
    return r;
  };

  useEffect(() => {
    load()
      .then((r) => setSelected(r[0] ?? null))
      .catch((e) => setError(e instanceof Error ? e.message : 'Não foi possível carregar os dados'));
  }, []);

  const run = async (id: number) => {
    setRunningId(id);
    setError('');
    try {
      const result = await api.run(id);
      await load();
      setSelected(result);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Não foi possível rodar o cenário');
    } finally {
      setRunningId(null);
    }
  };

  const total = stats.reduce((a, s) => a + s.runs, 0);
  const resolved = stats.reduce((a, s) => a + s.resolvedRate * s.runs, 0);
  const hallucinations = stats.reduce((a, s) => a + s.hallucinations, 0);
  const scoreSum = stats.reduce((a, s) => a + s.avgScore * s.runs, 0);

  return (
    <div className="app">
      <header className="top">
        <h1>Bancada de testes para chatbots</h1>
        <p>
          Um cliente simulado conversa com o bot, um juiz avalia a conversa e você acompanha os resultados.
        </p>
        <dl className="summary">
          <div><dt>Rodadas</dt><dd>{total}</dd></div>
          <div><dt>Resolvidas</dt><dd>{total ? pct(resolved / total) : '–'}</dd></div>
          <div><dt>Nota média</dt><dd>{total ? nota(scoreSum / total) : '–'}</dd></div>
          <div className={hallucinations > 0 ? 'alert' : ''}><dt>Alucinações</dt><dd>{hallucinations}</dd></div>
        </dl>
      </header>

      {error && <p role="alert" className="error">{error}</p>}

      <main className="layout">
        <section aria-label="Cenários">
          <h2>Cenários</h2>
          <ul className="scenarios">
            {scenarios.map((s) => {
              const st = stats.find((x) => x.scenarioId === s.id);
              const busy = runningId === s.id;
              return (
                <li key={s.id}>
                  <div>
                    <strong>{s.name}</strong>
                    <small>
                      {st && st.runs > 0
                        ? `${st.runs} rodadas, ${pct(st.resolvedRate)} resolvidas, nota ${nota(st.avgScore)}`
                        : 'Ainda sem rodadas'}
                    </small>
                  </div>
                  <button onClick={() => run(s.id)} disabled={runningId !== null}>
                    {busy ? 'Rodando…' : 'Rodar'}
                  </button>
                </li>
              );
            })}
          </ul>

          <h2>Histórico</h2>
          {runs.length === 0 && <p className="empty">Rode um cenário para ver a primeira conversa aqui.</p>}
          <ul className="history">
            {runs.map((r) => (
              <li key={r.id}>
                <button
                  className={selected?.id === r.id ? 'on' : ''}
                  onClick={() => setSelected(r)}
                >
                  <span className={`dot ${r.resolved ? 'ok' : 'bad'}`} aria-hidden="true" />
                  {r.scenarioName}
                  <small>nota {r.score}</small>
                </button>
              </li>
            ))}
          </ul>
        </section>

        <section aria-label="Conversa" className="conversation">
          {runningId !== null && <p className="working">Simulando a conversa e avaliando. Isso leva cerca de um minuto.</p>}
          {selected ? (
            <>
              <h2>{selected.scenarioName}</h2>
              <ol className="transcript">
                {selected.transcript.map((m, i) => (
                  <li key={i} className={m.role}>
                    <span className="who">{m.role === 'customer' ? 'Cliente' : 'Bot'}</span>
                    <p>{m.content}</p>
                  </li>
                ))}
              </ol>
              <aside className="verdict">
                <h3>Veredito do juiz</h3>
                <ul className="tags">
                  <li className={selected.resolved ? 'ok' : 'bad'}>{selected.resolved ? 'Resolvido' : 'Não resolvido'}</li>
                  <li className={selected.hallucinated ? 'bad' : 'ok'}>{selected.hallucinated ? 'Alucinou' : 'Sem alucinação'}</li>
                  <li>Tom {selected.tone}</li>
                  <li>Nota {selected.score} de 5</li>
                </ul>
                <p>{selected.reason}</p>
              </aside>
            </>
          ) : (
            runningId === null && <p className="empty">Nenhuma conversa selecionada.</p>
          )}
        </section>
      </main>
    </div>
  );
}
