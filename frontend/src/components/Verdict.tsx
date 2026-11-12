import type { Run } from '../types';

export function Verdict({ run }: { run: Run }) {
  return (
    <aside className="verdict">
      <h3>Veredito do juiz</h3>
      <ul className="tags">
        <li className={run.resolved ? 'ok' : 'bad'}>{run.resolved ? 'Resolvido' : 'Não resolvido'}</li>
        <li className={run.hallucinated ? 'bad' : 'ok'}>{run.hallucinated ? 'Alucinou' : 'Sem alucinação'}</li>
        <li>Tom {run.tone}</li>
        <li>Nota {run.score} de 5</li>
      </ul>
      <p>{run.reason}</p>
    </aside>
  );
}
