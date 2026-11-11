import type { Run, Scenario, Stat } from './types';

async function req<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`/api${path}`, init);
  if (!res.ok) throw new Error(`A API respondeu ${res.status} em ${path}`);
  return res.json() as Promise<T>;
}

export const api = {
  scenarios: () => req<Scenario[]>('/scenarios'),
  stats: () => req<Stat[]>('/stats'),
  runs: () => req<Run[]>('/runs'),
  run: (id: number) => req<Run>(`/scenarios/${id}/run`, { method: 'POST' }),
};
