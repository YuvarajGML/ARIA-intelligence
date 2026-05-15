export type AgentName = "Researcher" | "Validator" | "Critic" | "Synthesizer" | "Deliverer";

export type Channel = "email" | "gmail" | "discord" | "notion" | "github";

export type PersonaId = "student" | "founder" | "investor" | "custom";

export interface Persona {
  id: PersonaId;
  label: string;
  tagline: string;
  systemPrompt: string;
  tone: string;
  sections: string[];
}

export interface Evidence {
  id: string;
  url: string;
  title: string;
  snippet: string;
  source: string;
  score: number; // 0..1
  publishedAt?: string;
}

export interface Verdict {
  score: number;
  passed: boolean;
  reasons: string[];
}

export interface Delivery {
  id: string;
  runId: string;
  channel: Channel;
  status: "pending" | "sent" | "failed";
  target?: string;
  detail?: string;
  externalId?: string;
  at: string;
}

export type AriaEvent =
  | { type: "run.started"; runId: string; topic: string; persona: PersonaId; at: number }
  | { type: "agent.started"; agent: AgentName; at: number }
  | { type: "agent.thinking"; agent: AgentName; token: string; at: number }
  | {
      type: "agent.tool_call";
      agent: AgentName;
      tool: string;
      args: Record<string, unknown>;
      at: number;
    }
  | {
      type: "agent.tool_result";
      agent: AgentName;
      tool: string;
      ok: boolean;
      latency_ms: number;
      at: number;
    }
  | { type: "agent.completed"; agent: AgentName; at: number }
  | { type: "evidence.added"; evidence: Evidence; at: number }
  | { type: "confidence.updated"; score: number; at: number }
  | { type: "critic.verdict"; verdict: Verdict; at: number }
  | { type: "retry.scheduled"; attempt: number; reason: string; at: number }
  | { type: "report.chunk"; token: string; at: number }
  | { type: "delivery.sent"; delivery: Delivery; at: number }
  | { type: "run.completed"; at: number }
  | { type: "run.failed"; error: string; at: number };

export interface RunRequest {
  topic: string;
  persona: PersonaId;
  depth: number; // 1..5
  channels: Channel[];
}

export type RunStatus = "pending" | "running" | "completed" | "failed";

export interface Run {
  id: string;
  topic: string;
  persona: PersonaId;
  depth: number;
  channels: Channel[];
  status: RunStatus;
  confidence: number;
  createdAt: string;
  completedAt?: string;
  evidenceCount: number;
  verdict?: Verdict;
  retries: number;
  reportPreview?: string;
}
