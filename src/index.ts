import { Hono } from "hono";
import { serve } from "@hono/node-server";
import { env } from "./env.js";
import { WebhookRoutes } from "./routes/webhook.routes.js";

const app = new Hono();

console.log("Starting WhatsApp Matchmaking Bot...");
console.log("Phone Number ID:", env.WA_PHONE_NUMBER_ID);

app.get("/webhook", (c) => WebhookRoutes.handleVerification(c));

app.post("/webhook", (c) => WebhookRoutes.handleIncomingMessage(c));

app.get("/health", (c) =>
  c.json({ status: "healthy", timestamp: new Date().toISOString() }),
);

serve(app);

console.log("Server is running and listening for webhooks...");
