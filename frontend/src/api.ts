import type { EvaluatePayload, Msg, Run, Scenario } from './types';

export class AuthError extends Error {
  constructor() {
    super('Código de acesso inválido ou ausente.');
  }
}

async function req<T>(path: string, init?: RequestInit): Promise<T> {
  const code = sessionStorage.getItem('accessCode');
  const headers = { ...(init?.headers as Record<string, string> | undefined), ...(code ? { 'X-Access-Code': code } : {}) };
  const res = await fetch(`/api${path}`, { ...init, headers });
  if (res.status === 401) throw new AuthError();
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    if (res.status === 400 && text) throw new Error(text.replace(/^"|"$/g, ''));
    if (res.status === 429) throw new Error('Muitas requisições. Aguarde um minuto e tente de novo.');
    throw new Error(
      res.status >= 500
        ? 'Erro no servidor. Confira a chave, o modelo e o provedor nas variáveis de ambiente (veja os logs da API).'
        : `A API respondeu ${res.status}`,
    );
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

const post = <T>(path: string, body: unknown) =>
  req<T>(path, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });

export const errMsg = (e: unknown) => (e instanceof Error ? e.message : 'Algo deu errado');

export const api = {
  botPrompt: () => req<{ prompt: string }>('/bot-prompt'),
  scenarios: () => req<Scenario[]>('/scenarios'),
  createScenario: (b: { name: string; description: string; goal: string }) => post<Scenario>('/scenarios', b),
  deleteScenario: (id: number) => req<void>(`/scenarios/${id}`, { method: 'DELETE' }),
  runs: () => req<Run[]>('/runs'),
  customerTurn: (persona: string, transcript: Msg[]) =>
    post<{ content: string }>('/chat/customer-turn', { persona, transcript }),
  botTurn: (botPrompt: string, transcript: Msg[]) =>
    post<{ content: string }>('/chat/bot-turn', { botPrompt, transcript }),
  evaluate: (payload: EvaluatePayload) => post<Run>('/evaluate', payload),
};
