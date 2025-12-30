import type { Context } from "hono";
import { env } from "../env.js";
import type { WhatsAppWebhookPayload } from "../types/whatsapp.types.js";
import { MessageDeduplication } from "../utils/message-deduplication.utils.js";
import { MessageProcessor } from "./message-processor.js";

const VERIFY_TOKEN = env.WA_VERIFY_TOKEN;

export class WebhookRoutes {
  static async handleVerification(c: Context) {
    const mode = c.req.query("hub.mode");
    const token = c.req.query("hub.verify_token");
    const challenge = c.req.query("hub.challenge");

    console.log("Webhook verification request:", {
      mode,
      token,
      challenge,
    });

    if (mode === "subscribe" && token === VERIFY_TOKEN) {
      return c.text(challenge ?? "");
    }
    return c.text("Forbidden", 403);
  }

  static async handleIncomingMessage(c: Context) {
    const body = (await c.req.json()) as WhatsAppWebhookPayload;

    console.log("Webhook event received:", JSON.stringify(body, null, 2));

    const message = body.entry?.[0]?.changes?.[0]?.value?.messages?.[0];
    if (!message) {
      return c.json({ status: "ignored" });
    }

    const messageId = message.id;
    if (MessageDeduplication.isProcessed(messageId)) {
      console.log(
        `Duplicate message detected: ${messageId}, skipping processing`,
      );
      return c.json({ status: "duplicate" });
    }

    MessageDeduplication.markAsProcessed(messageId);

    const phoneNumber = message.from;

    try {
      await MessageProcessor.process(phoneNumber, message);
      return c.json({ status: "received" });
    } catch (error) {
      console.error("Error processing message:", error);
      return c.json({ status: "error", message: "Processing failed" });
    }
  }
}
