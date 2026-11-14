import { useCallback, useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { api, AuthError, errMsg } from './api';
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
  const [needCode, setNeedCode] = useState(false);
  const [code, setCode] = useState('');

  const reload = useCallback(async () => {
    const [s, r] = await Promise.all([api.scenarios(), api.runs()]);
    setScenarios(s);
    setRuns(r);
  }, []);

  const init = useCallback(async () => {
    setError('');
    try {
      await reload();
      const d = await api.botPrompt();
      setDefaultPrompt(d.prompt);
      setBotPrompt((p) => p || d.prompt);
      setNeedCode(false);
    } catch (e) {
      if (e instanceof AuthError) setNeedCode(true);
      else setError(errMsg(e));
    }
  }, [reload]);

  useEffect(() => { void init(); }, [init]);

  useEffect(() => {
    if (botPrompt) localStorage.setItem('botPrompt', botPrompt);
  }, [botPrompt]);

  const submitCode = (e: FormEvent) => {
    e.preventDefault();
    sessionStorage.setItem('accessCode', code.trim());
    void init();
  };

  if (needCode) {
    return (
      <div className="app">
        <h1>Bancada de testes para chatbots</h1>
        <form className="conversation single" onSubmit={submitCode}>
          <h2>Código de acesso</h2>
          <p className="hint">Este site usa uma chave de LLM com cota limitada. Informe o código para continuar.</p>
          <input type="password" value={code} onChange={(e) => setCode(e.target.value)} aria-label="Código de acesso" />
          <p><button type="submit" disabled={!code.trim()}>Entrar</button></p>
        </form>
      </div>
    );
  }

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
