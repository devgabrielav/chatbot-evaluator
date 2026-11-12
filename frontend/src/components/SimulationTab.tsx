import { useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { api, errMsg } from '../api';
import type { Msg, Run, Scenario } from '../types';
import { Transcript } from './Transcript';
import { Verdict } from './Verdict';

type Props = { scenarios: Scenario[]; botPrompt: string; onChanged: () => Promise<void> };

export default function SimulationTab({ scenarios, botPrompt, onChanged }: Props) {
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [turns, setTurns] = useState(4);
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [typing, setTyping] = useState<Msg['role'] | null>(null);
  const [phase, setPhase] = useState<'idle' | 'running' | 'judging'>('idle');
  const [result, setResult] = useState<Run | null>(null);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ name: '', description: '', goal: '' });
  const stop = useRef(false);

  const scenario = scenarios.find((s) => s.id === (selectedId ?? scenarios[0]?.id));
  const busy = phase !== 'idle';

  const start = async () => {
    if (!scenario) return;
    stop.current = false;
    setError('');
    setResult(null);
    setMsgs([]);
    setPhase('running');
    let t: Msg[] = [];
    try {
      for (let i = 0; i < turns && !stop.current; i++) {
        setTyping('customer');
        t = [...t, { role: 'customer', content: (await api.customerTurn(scenario.persona, t)).content }];
        setMsgs(t);
        setTyping('bot');
        t = [...t, { role: 'bot', content: (await api.botTurn(botPrompt, t)).content }];
        setMsgs(t);
      }
      setTyping(null);
      setPhase('judging');
      const run = await api.evaluate({
        scenarioId: scenario.id, title: scenario.name, source: 'simulado',
        goal: scenario.goal, botPrompt, transcript: t,
      });
      setResult(run);
      await onChanged();
    } catch (e) {
      setError(errMsg(e));
    } finally {
      setTyping(null);
      setPhase('idle');
    }
  };

  const create = async (e: FormEvent) => {
    e.preventDefault();
    try {
      const s = await api.createScenario(form);
      await onChanged();
      setSelectedId(s.id);
      setForm({ name: '', description: '', goal: '' });
    } catch (err) {
      setError(errMsg(err));
    }
  };

  const remove = async (s: Scenario) => {
    if (!window.confirm(`Excluir o cenário "${s.name}"?`)) return;
    await api.deleteScenario(s.id);
    setSelectedId(null);
    await onChanged();
  };

  return (
    <div className="layout">
      <section aria-label="Cenários">
        <h2>Escolha um cliente</h2>
        <ul className="scenarios">
          {scenarios.map((s) => (
            <li key={s.id} className={s.id === scenario?.id ? 'on' : ''}>
              <button className="pick" onClick={() => setSelectedId(s.id)} disabled={busy}>
                <strong>{s.name}</strong>
                <small>{s.goal}</small>
              </button>
              <button className="ghost small" onClick={() => remove(s)} disabled={busy} aria-label={`Excluir ${s.name}`}>
                Excluir
              </button>
            </li>
          ))}
        </ul>

        <details className="newscenario">
          <summary>Criar meu próprio cenário</summary>
          <form onSubmit={create}>
            <label>Nome<input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required /></label>
            <label>Como o cliente se comporta
              <textarea rows={3} value={form.description} placeholder="Ex.: Você está com pressa, comprou um cabo que não funciona e quer reembolso."
                onChange={(e) => setForm({ ...form, description: e.target.value })} required />
            </label>
            <label>O que o cliente quer
              <input value={form.goal} onChange={(e) => setForm({ ...form, goal: e.target.value })} required />
            </label>
            <button type="submit">Adicionar cenário</button>
          </form>
        </details>
      </section>

      <section aria-label="Simulação" className="conversation">
        <div className="controls">
          <label>Turnos
            <select value={turns} onChange={(e) => setTurns(Number(e.target.value))} disabled={busy}>
              {[3, 4, 5, 6, 8].map((n) => <option key={n} value={n}>{n}</option>)}
            </select>
          </label>
          {phase === 'running'
            ? <button className="danger" onClick={() => { stop.current = true; }}>Parar e avaliar</button>
            : <button onClick={start} disabled={busy || !scenario}>Iniciar simulação</button>}
        </div>

        {msgs.length === 0 && !typing && <p className="empty">Escolha um cenário e inicie: as mensagens aparecem aqui conforme são geradas.</p>}
        <Transcript messages={msgs} typing={typing} />
        {phase === 'judging' && <p className="working">O juiz está avaliando a conversa…</p>}
        {error && <p role="alert" className="error">{error}</p>}
        {result && <Verdict run={result} />}
      </section>
    </div>
  );
}
