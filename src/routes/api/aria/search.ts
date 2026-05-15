import { createFileRoute } from "@tanstack/react-router";
import { serperSearch } from "@/lib/aria/connectors";

export const Route = createFileRoute("/api/aria/search")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const { q, num } = (await request.json()) as { q?: string; num?: number };
        if (!q) return new Response("q required", { status: 400 });
        const results = await serperSearch(q, num ?? 8);
        return Response.json({ results });
      },
    },
  },
});
