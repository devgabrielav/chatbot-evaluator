import { useState } from 'react';
import type { Run, Source } from '../types';
import { Transcript } from './Transcript';
import { Verdict } from './Verdict';

const pct = (n: number) => `${Math.round(n * 100)}%`;
const nota = (n: number) => n.toFixed(1).replace('.', ',');
const avg = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0);
const SOURCES: ('todas' | Source)[] = ['todas', 'simulado', 'manual', 'importado'];

export default function ResultsTab({ runs }: { runs: Run[] }) {
  const [filter, setFilter] = useState<'todas' | Source>('todas');
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const filtered = runs.filter((r) => filter === 'todas' || r.source === filter);
  const selected = runs.find((r) => r.id === selectedId) ?? filtered[0] ?? null;
  const groups = Object.values(
    filtered.reduce<Record<string, Run[]>>((acc, r) => { (acc[r.title] ??= []).push(r); return acc; }, {}),
  );
  const halluc = filtered.filter((r) => r.hallucinated).length;

  return (
    <div>
      <div className="filters" role="group" aria-label="Filtrar por origem">
        {SOURCES.map((s) => (
          <button key={s} className={filter === s ? 'chip on' : 'chip'} onClick={() => setFilter(s)}>{s}</button>
        ))}
      </div>

      <dl className="summary">
        <div><dt>Conversas</dt><dd>{filtered.length}</dd></div>
        <div><dt>Resolvidas</dt><dd>{filtered.length ? pct(avg(filtered.map((r) => (r.resolved ? 1 : 0)))) : '–'}</dd></div>
        <div><dt>Nota média</dt><dd>{filtered.length ? nota(avg(filtered.map((r) => r.score))) : '–'}</dd></div>
        <div className={halluc > 0 ? 'alert' : ''}><dt>Alucinações</dt><dd>{halluc}</dd></div>
      </dl>

      {filtered.length === 0 ? (
        <p className="empty">Nenhuma conversa avaliada ainda. Rode uma simulação, converse ao vivo ou importe uma conversa.</p>
      ) : (
        <>
          <h2>Por cenário</h2>
          <div className="tablewrap">
            <table>
              <thead><tr><th>Cenário</th><th>Conversas</th><th>Resolvidas</th><th>Nota média</th><th>Alucinações</th></tr></thead>
              <tbody>
                {groups.map((g) => (
                  <tr key={g[0].title}>
                    <td>{g[0].title}</td>
                    <td>{g.length}</td>
                    <td>{pct(avg(g.map((r) => (r.resolved ? 1 : 0))))}</td>
                    <td>{nota(avg(g.map((r) => r.score)))}</td>
                    <td>{g.filter((r) => r.hallucinated).length}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="layout results">
            <section aria-label="Histórico">
              <h2>Histórico</h2>
              <ul className="history">
                {filtered.map((r) => (
                  <li key={r.id}>
                    <button className={selected?.id === r.id ? 'on' : ''} onClick={() => setSelectedId(r.id)}>
                      <span className={`dot ${r.resolved ? 'ok' : 'bad'}`} aria-hidden="true" />
                      {r.title}
                      <small>{r.source}, nota {r.score}</small>
                    </button>
                  </li>
                ))}
              </ul>
            </section>
            {selected && (
              <section className="conversation" aria-label="Conversa selecionada">
                <h2>{selected.title}</h2>
                <Transcript messages={selected.transcript} />
                <Verdict run={selected} />
                {selected.goal && <p className="hint">Objetivo do cliente: {selected.goal}</p>}
                <details className="botpanel">
                  <summary>Base de conhecimento usada nesta avaliação</summary>
                  <pre>{selected.botPrompt}</pre>
                </details>
              </section>
            )}
          </div>
        </>
      )}
    </div>
  );
}
