import { useMemo, useState } from 'react';
import { api, errMsg } from '../api';
import { parseTranscript } from '../parse';
import { SAMPLES } from '../samples';
import type { Run } from '../types';
import { Transcript } from './Transcript';
import { Verdict } from './Verdict';

type Props = { botPrompt: string; onChanged: () => Promise<void> };

export default function ImportTab({ botPrompt, onChanged }: Props) {
  const [text, setText] = useState('');
  const [title, setTitle] = useState('Conversa importada');
  const [goal, setGoal] = useState('');
  const [judging, setJudging] = useState(false);
  const [result, setResult] = useState<Run | null>(null);
  const [error, setError] = useState('');

  const messages = useMemo(() => parseTranscript(text), [text]);

  const evaluate = async () => {
    setJudging(true);
    setError('');
    setResult(null);
    try {
      setResult(await api.evaluate({ scenarioId: null, title, source: 'importado', goal, botPrompt, transcript: messages }));
      await onChanged();
    } catch (e) {
      setError(errMsg(e));
    } finally {
      setJudging(false);
    }
  };

  return (
    <div className="layout">
      <section aria-label="Importar">
        <h2>Cole uma conversa</h2>
        <p className="hint">
          Formato: uma fala por linha, começando com <code>Cliente:</code> ou <code>Bot:</code> (também aceita
          Atendente, User, Assistant) ou um JSON com <code>role</code> e <code>content</code>. Remova nomes, telefones
          e dados pessoais antes de colar.
        </p>
        <textarea rows={12} value={text} onChange={(e) => setText(e.target.value)} aria-label="Conversa" placeholder={'Cliente: Oi, tudo bem?\nBot: Olá! Como posso ajudar?'} />
        <label>Título<input value={title} onChange={(e) => setTitle(e.target.value)} /></label>
        <label>O que o cliente queria? (opcional)<input value={goal} onChange={(e) => setGoal(e.target.value)} /></label>

        <h3>Exemplos para testar</h3>
        <p className="hint">Escritos para teste, não são conversas reais.</p>
        <div className="samples">
          {SAMPLES.map((s) => (
            <button key={s.title} className="ghost" onClick={() => { setText(s.text); setTitle(s.title); setGoal(s.goal); setResult(null); }}>
              {s.title}
            </button>
          ))}
        </div>
      </section>

      <section aria-label="Prévia" className="conversation">
        <h2>Prévia ({messages.length} mensagens)</h2>
        {messages.length === 0 ? <p className="empty">A conversa interpretada aparece aqui.</p> : <Transcript messages={messages} />}
        <button onClick={evaluate} disabled={judging || messages.length < 2}>{judging ? 'Avaliando…' : 'Avaliar conversa'}</button>
        {error && <p role="alert" className="error">{error}</p>}
        {result && <Verdict run={result} />}
      </section>
    </div>
  );
}
