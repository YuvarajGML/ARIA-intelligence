import { createFileRoute } from "@tanstack/react-router";
import { getRun, subscribe } from "@/lib/aria/store";
import type { AriaEvent } from "@/lib/aria/types";

export const Route = createFileRoute("/api/aria/runs/$id/events")({
  server: {
    handlers: {
      GET: async ({ params }) => {
        const rec = getRun(params.id);
        if (!rec) return new Response("not found", { status: 404 });
        const encoder = new TextEncoder();

        const stream = new ReadableStream({
          start(controller) {
            const send = (e: AriaEvent) => {
              try {
                controller.enqueue(encoder.encode(`data: ${JSON.stringify(e)}\n\n`));
              } catch { /* closed */ }
            };
            // Replay buffered events first.
            for (const e of rec.events) send(e);

            const terminal = rec.run.status === "completed" || rec.run.status === "failed";
            if (terminal) {
              controller.close();
              return;
            }

            const unsub = subscribe(params.id, (e) => {
              send(e);
              if (e.type === "run.completed" || e.type === "run.failed") {
                unsub();
                try { controller.close(); } catch { /* ignore */ }
              }
            });

            // Heartbeat every 15s
            const hb = setInterval(() => {
              try { controller.enqueue(encoder.encode(`: keepalive\n\n`)); }
              catch { clearInterval(hb); }
            }, 15000);
          },
        });

        return new Response(stream, {
          headers: {
            "Content-Type": "text/event-stream",
            "Cache-Control": "no-cache, no-transform",
            Connection: "keep-alive",
            "X-Accel-Buffering": "no",
          },
        });
      },
    },
  },
});
