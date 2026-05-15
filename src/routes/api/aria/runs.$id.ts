import { createFileRoute } from "@tanstack/react-router";
import { getDeliveries, getReport, getRun } from "@/lib/aria/store";

export const Route = createFileRoute("/api/aria/runs/$id")({
  server: {
    handlers: {
      GET: async ({ params }) => {
        const rec = getRun(params.id);
        if (!rec) return new Response("not found", { status: 404 });
        return Response.json({
          run: rec.run,
          events: rec.events,
          deliveries: getDeliveries(params.id),
          report: getReport(params.id),
        });
      },
    },
  },
});
