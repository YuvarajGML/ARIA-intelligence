// Browser-side typed SSE helper.
import type { AriaEvent } from "./types";

export function subscribeRunEvents(runId: string, onEvent: (e: AriaEvent) => void): () => void {
  const es = new EventSource(`/api/aria/runs/${runId}/events`);
  es.onmessage = (msg) => {
    try {
      const data = JSON.parse(msg.data) as AriaEvent;
      onEvent(data);
      if (data.type === "run.completed" || data.type === "run.failed") {
        es.close();
      }
    } catch {
      /* ignore */
    }
  };
  es.onerror = () => {
    // Browser will auto-retry; close on terminal states.
  };
  return () => es.close();
}
