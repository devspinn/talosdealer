import { serve } from "@hono/node-server";
import { createApp } from "./app";

const app = createApp(() => ({
  DATABASE_URL: process.env.DATABASE_URL!,
  BETTER_AUTH_SECRET: process.env.BETTER_AUTH_SECRET!,
  BETTER_AUTH_URL: process.env.BETTER_AUTH_URL!,
  RESEND_API_KEY: process.env.RESEND_API_KEY!,
}));

const port = parseInt(process.env.PORT || "3000");
serve({ fetch: app.fetch, port }, () => {
  console.log(`Talos API running on http://localhost:${port}`);
});
