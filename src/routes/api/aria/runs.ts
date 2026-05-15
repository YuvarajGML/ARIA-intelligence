import { createFileRoute } from "@tanstack/react-router";
import { PERSONAS } from "@/lib/aria/personas";
import { createRun, listRuns } from "@/lib/aria/store";
import { ensureRun } from "@/lib/aria/engine";
import type { Run, RunRequest } from "@/lib/aria/types";

export const Route = createFileRoute("/api/aria/runs")({
  server: {
    handlers: {
      GET: async () => Response.json({ runs: listRuns() }),
      POST: async ({ request }) => {
        const body = (await request.json()) as Partial<RunRequest>;
        const topic = (body.topic ?? "").trim();
        if (!topic) return new Response("topic required", { status: 400 });
        const persona = body.persona && PERSONAS[body.persona] ? body.persona : "founder";
        const depth = Math.max(1, Math.min(5, Number(body.depth ?? 3)));
        const channels = (body.channels ?? []).filter((c) =>
          ["email", "discord", "notion", "github"].includes(c)
        );
        const id = `run_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
        const run: Run = {
          id, topic, persona, depth, channels,
          status: "pending", confidence: 0, createdAt: new Date().toISOString(),
          evidenceCount: 0, retries: 0,
        };
        createRun(run);
        ensureRun(id, { topic, persona, depth, channels });
        return Response.json({ run });
      },
    },
  },
});
