// In-memory run store. Server-only.
import type { AriaEvent, Delivery, Run, RunStatus } from "./types";

interface RunRecord {
  run: Run;
  events: AriaEvent[];
  deliveries: Delivery[];
  report: string;
  // optional listeners for live tail
  listeners: Set<(e: AriaEvent) => void>;
}

const g = globalThis as unknown as { __ariaStore?: Map<string, RunRecord> };
if (!g.__ariaStore) g.__ariaStore = new Map();
const store = g.__ariaStore;

export function createRun(run: Run): RunRecord {
  const rec: RunRecord = { run, events: [], deliveries: [], report: "", listeners: new Set() };
  store.set(run.id, rec);
  return rec;
}

export function getRun(id: string): RunRecord | undefined {
  return store.get(id);
}

export function listRuns(): Run[] {
  return Array.from(store.values())
    .map((r) => r.run)
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
}

export function pushEvent(id: string, e: AriaEvent) {
  const rec = store.get(id);
  if (!rec) return;
  rec.events.push(e);
  // mutate run snapshot
  if (e.type === "evidence.added") rec.run.evidenceCount++;
  if (e.type === "confidence.updated") rec.run.confidence = e.score;
  if (e.type === "critic.verdict") rec.run.verdict = e.verdict;
  if (e.type === "retry.scheduled") rec.run.retries = e.attempt;
  if (e.type === "report.chunk") {
    rec.report += e.token;
    rec.run.reportPreview = rec.report.slice(0, 280);
  }
  if (e.type === "delivery.sent") rec.deliveries.push(e.delivery);
  if (e.type === "run.completed") {
    rec.run.status = "completed";
    rec.run.completedAt = new Date().toISOString();
  }
  if (e.type === "run.failed") {
    rec.run.status = "failed";
    rec.run.completedAt = new Date().toISOString();
  }
  for (const l of rec.listeners) l(e);
}

export function setStatus(id: string, status: RunStatus) {
  const rec = store.get(id);
  if (rec) rec.run.status = status;
}

export function subscribe(id: string, fn: (e: AriaEvent) => void): () => void {
  const rec = store.get(id);
  if (!rec) return () => {};
  rec.listeners.add(fn);
  return () => rec.listeners.delete(fn);
}

export function getReport(id: string): string {
  return store.get(id)?.report ?? "";
}

export function getDeliveries(id: string): Delivery[] {
  return store.get(id)?.deliveries ?? [];
}

export function allDeliveries(): Delivery[] {
  const out: Delivery[] = [];
  for (const r of store.values()) out.push(...r.deliveries);
  return out.sort((a, b) => (a.at < b.at ? 1 : -1));
}
