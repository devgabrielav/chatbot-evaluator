import type { Msg } from '../types';

export function Transcript({ messages, typing }: { messages: Msg[]; typing?: Msg['role'] | null }) {
  const label = (r: Msg['role']) => (r === 'customer' ? 'Cliente' : 'Bot');
  return (
    <ol className="transcript" aria-live="polite">
      {messages.map((m, i) => (
        <li key={i} className={m.role}>
          <span className="who">{label(m.role)}</span>
          <p>{m.content}</p>
        </li>
      ))}
      {typing && (
        <li className={typing}>
          <span className="who">{label(typing)} digitando</span>
          <p className="typing" aria-hidden="true"><i /><i /><i /></p>
        </li>
      )}
    </ol>
  );
}
