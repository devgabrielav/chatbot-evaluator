export type Scenario = { id: number; name: string; persona: string; goal: string };
export type Msg = { role: 'customer' | 'bot'; content: string };
export type Run = {
  id: number;
  scenarioId: number;
  scenarioName: string;
  createdAt: string;
  resolved: boolean;
  hallucinated: boolean;
  tone: string;
  score: number;
  reason: string;
  transcript: Msg[];
};
export type Stat = {
  scenarioId: number;
  scenarioName: string;
  runs: number;
  resolvedRate: number;
  avgScore: number;
  hallucinations: number;
};
