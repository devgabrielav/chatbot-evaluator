import type { Msg } from './types';

const CUSTOMER = ['cliente', 'customer', 'usuario', 'usuário', 'user', 'human'];
const BOT = ['bot', 'atendente', 'agente', 'agent', 'assistente', 'assistant', 'ai'];

function toRole(name: string): Msg['role'] | null {
  const n = name.trim().toLowerCase();
  if (CUSTOMER.includes(n)) return 'customer';
  if (BOT.includes(n)) return 'bot';
  return null;
}

// Aceita texto ("Cliente: ..." / "Bot: ...") ou JSON ([{ "role": "customer", "content": "..." }]).
export function parseTranscript(input: string): Msg[] {
  const text = input.trim();
  if (!text) return [];

  if (text.startsWith('[')) {
    try {
      const data = JSON.parse(text) as Record<string, unknown>[];
      const out: Msg[] = [];
      for (const item of data) {
        const role = toRole(String(item.role ?? item.from ?? item.speaker ?? ''));
        const content = String(item.content ?? item.text ?? item.message ?? '').trim();
        if (role && content) out.push({ role, content });
      }
      return out;
    } catch {
      /* cai para o formato de texto */
    }
  }

  const out: Msg[] = [];
  const line = /^\s*([A-Za-zÀ-ú]+)\s*[:\-–]\s*(.*)$/;
  for (const raw of text.split(/\r?\n/)) {
    const m = line.exec(raw);
    const role = m ? toRole(m[1]) : null;
    if (m && role) out.push({ role, content: m[2].trim() });
    else if (raw.trim() && out.length) out[out.length - 1].content += `\n${raw.trim()}`;
  }
  return out.filter((m) => m.content);
}
