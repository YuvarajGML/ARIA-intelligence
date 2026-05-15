import { createFileRoute } from "@tanstack/react-router";
import { allDeliveries } from "@/lib/aria/store";

export const Route = createFileRoute("/api/aria/deliveries")({
  server: {
    handlers: {
      GET: async () => Response.json({ deliveries: allDeliveries() }),
    },
  },
});
