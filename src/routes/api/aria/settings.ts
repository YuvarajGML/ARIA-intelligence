import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/aria/settings")({
  server: {
    handlers: {
      GET: async () => {
        const names = [
          "SERPER_API_KEY",
          "RESEND_API_KEY",
          "GMAIL_CLIENT_ID",
          "GMAIL_CLIENT_SECRET",
          "GMAIL_REFRESH_TOKEN",
          "GMAIL_FROM",
          "GMAIL_TO",
          "DISCORD_WEBHOOK_URL",
          "NOTION_API_KEY",
          "GITHUB_TOKEN",
          "GITHUB_REPO",
          "LOVABLE_API_KEY",
        ];
        const status: Record<string, boolean> = {};
        for (const n of names) status[n] = !!process.env[n];
        return Response.json({ status, backend: process.env.ARIA_BACKEND_URL ?? null });
      },
    },
  },
});
