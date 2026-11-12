import { useState } from 'react';
import type { FormEvent } from 'react';
import { api, errMsg } from '../api';
import type { Msg, Run } from '../types';
import { Transcript } from './Transcript';
import { Verdict } from './Verdict';

type Props = { botPrompt: string; onChanged: () => Promise<void> };

export default function LiveTab({ botPrompt, onChanged }: Props) {
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [input, setInput] = useState('');
  const [goal, setGoal] = useState('');
  const [sending, setSending] = useState(false);
  const [judging, setJudging] = useState(false);
  const [result, setResult] = useState<Run | null>(null);
  const [error, setError] = useState('');

  const send = async (e: FormEvent) => {
    e.preventDefault();
    const text = input.trim();
    if (!text || sending) return;
    const t: Msg[] = [...msgs, { role: 'customer', content: text }];
    setMsgs(t);
    setInput('');
    setResult(null);
    setError('');
    setSending(true);
    try {
      const bot = await api.botTurn(botPrompt, t);
      setMsgs([...t, { role: 'bot', content: bot.content }]);
    } catch (err) {
      setMsgs(msgs); // desfaz a mensagem para manter a alternância cliente/bot
      setInput(text);
      setError(errMsg(err));
    } finally {
      setSending(false);
    }
  };

  const evaluate = async () => {
    setJudging(true);
    setError('');
    try {
      setResult(await api.evaluate({
        scenarioId: null, title: 'Chat ao vivo', source: 'manual', goal, botPrompt, transcript: msgs,
      }));
      await onChanged();
    } catch (err) {
      setError(errMsg(err));
    } finally {
      setJudging(false);
    }
  };

  const reset = () => { setMsgs([]); setResult(null); setError(''); };

  return (
    <section className="conversation single" aria-label="Chat ao vivo">
      <h2>Converse você mesma com o bot</h2>
      <p className="hint">Tente quebrá-lo: peça um desconto, mude de assunto, pergunte algo que ele não sabe. Depois peça ao juiz para avaliar.</p>

      {msgs.length === 0 && <p className="empty">Escreva a primeira mensagem do cliente abaixo.</p>}
      <Transcript messages={msgs} typing={sending ? 'bot' : null} />

      <form className="composer" onSubmit={send}>
        <input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Mensagem do cliente…" aria-label="Mensagem do cliente" />
        <button type="submit" disabled={sending || !input.trim()}>Enviar</button>
      </form>

      {msgs.length >= 2 && !sending && (
        <div className="evalbar">
          <input value={goal} onChange={(e) => setGoal(e.target.value)} placeholder="O que o cliente queria? (opcional)" aria-label="Objetivo do cliente" />
          <button onClick={evaluate} disabled={judging}>{judging ? 'Avaliando…' : 'Avaliar conversa'}</button>
          <button className="ghost" onClick={reset}>Nova conversa</button>
        </div>
      )}
      {error && <p role="alert" className="error">{error}</p>}
      {result && <Verdict run={result} />}
    </section>
  );
}
