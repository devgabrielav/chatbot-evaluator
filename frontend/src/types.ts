export type Scenario = { id: number; name: string; persona: string; goal: string };
export type Msg = { role: 'customer' | 'bot'; content: string };
export type Source = 'simulado' | 'manual' | 'importado';
export type Run = {
  id: number;
  scenarioId: number | null;
  title: string;
  source: Source;
  goal: string;
  botPrompt: string;
  createdAt: string;
  resolved: boolean;
  hallucinated: boolean;
  tone: string;
  score: number;
  reason: string;
  transcript: Msg[];
};
export type EvaluatePayload = {
  scenarioId: number | null;
  title: string;
  source: Source;
  goal: string;
  botPrompt: string;
  transcript: Msg[];
};
