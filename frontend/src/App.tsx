import { useCallback, useEffect, useState } from 'react';
import { api, errMsg } from './api';
import type { Run, Scenario } from './types';
import { BotPanel } from './components/BotPanel';
import SimulationTab from './components/SimulationTab';
import LiveTab from './components/LiveTab';
import ImportTab from './components/ImportTab';
import ResultsTab from './components/ResultsTab';

type Tab = 'sim' | 'live' | 'import' | 'results';
const TABS: [Tab, string][] = [
  ['sim', 'Simulação'],
  ['live', 'Chat ao vivo'],
  ['import', 'Importar conversa'],
  ['results', 'Resultados'],
];

export default function App() {
  const [tab, setTab] = useState<Tab>('sim');
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [runs, setRuns] = useState<Run[]>([]);
  const [defaultPrompt, setDefaultPrompt] = useState('');
  const [botPrompt, setBotPrompt] = useState(() => localStorage.getItem('botPrompt') ?? '');
  const [error, setError] = useState('');

  const reload = useCallback(async () => {
    const [s, r] = await Promise.all([api.scenarios(), api.runs()]);
    setScenarios(s);
    setRuns(r);
  }, []);

  useEffect(() => {
    reload().catch((e) => setError(errMsg(e)));
    api.botPrompt().then((d) => {
      setDefaultPrompt(d.prompt);
      setBotPrompt((p) => p || d.prompt);
    }).catch((e) => setError(errMsg(e)));
  }, [reload]);

  useEffect(() => {
    if (botPrompt) localStorage.setItem('botPrompt', botPrompt);
  }, [botPrompt]);

  return (
    <div className="app">
      <header className="top">
        <h1>Bancada de testes para chatbots</h1>
        <p>Simule clientes, converse você mesma com o bot ou importe conversas e deixe um juiz avaliar tudo.</p>
      </header>

      {error && <p role="alert" className="error">{error}</p>}
      <BotPanel value={botPrompt} onChange={setBotPrompt} onReset={() => setBotPrompt(defaultPrompt)} />

      <div className="tabs" role="tablist">
        {TABS.map(([id, label]) => (
          <button key={id} role="tab" aria-selected={tab === id} className={tab === id ? 'tab on' : 'tab'} onClick={() => setTab(id)}>
            {label}{id === 'results' && runs.length > 0 ? ` (${runs.length})` : ''}
          </button>
        ))}
      </div>

      <main>
        {tab === 'sim' && <SimulationTab scenarios={scenarios} botPrompt={botPrompt} onChanged={reload} />}
        {tab === 'live' && <LiveTab botPrompt={botPrompt} onChanged={reload} />}
        {tab === 'import' && <ImportTab botPrompt={botPrompt} onChanged={reload} />}
        {tab === 'results' && <ResultsTab runs={runs} />}
      </main>
    </div>
  );
}
