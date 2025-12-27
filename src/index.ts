import { Hono } from "hono";
import { serve } from "@hono/node-server";
import { env } from "./env.js";
import { db } from "./lib/db/index.js";
import { users } from "./lib/db/schema.js";
import { eq } from "drizzle-orm";

type WebhookEntry = {
  changes: {
    value: {
      messages?: {
        from: string;
        text?: { body: string };
      }[];
    };
  }[];
};

type WebhookPayload = {
  entry: WebhookEntry[];
};

const app = new Hono();

const VERIFY_TOKEN = env.WA_VERIFY_TOKEN!;
const ACCESS_TOKEN = env.WA_ACCESS_TOKEN!;
const PHONE_NUMBER_ID = env.WA_PHONE_NUMBER_ID!;

console.log("Verify Token:", VERIFY_TOKEN);
console.log("Access Token:", ACCESS_TOKEN);
console.log("Phone Number ID:", PHONE_NUMBER_ID);

app.get("/webhook", (c) => {
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
});

app.post("/webhook", async (c) => {
  const body = (await c.req.json()) as WebhookPayload;

  console.log("Webhook event received:", JSON.stringify(body));

  const message = body.entry?.[0]?.changes?.[0]?.value?.messages?.[0];
  if (!message?.text?.body) {
    return c.json({ status: "ignored" });
  }

  const messageText = message.text.body.toLowerCase().trim();
  const phoneNumber = message.from;

  if (messageText === "hello") {
    const isAdmin = await checkIfAdmin(phoneNumber);
    const response = isAdmin ? "hello admin" : "hello customer";
    await sendMessage(phoneNumber, response);
    return c.json({ status: "sent" });
  }

  await sendMessage(phoneNumber, `Echo: ${message.text.body}`);
  return c.json({ status: "sent" });
});

async function checkIfAdmin(phoneNumber: string): Promise<boolean> {
  try {
    const user = await db
      .select({ isAdmin: users.isAdmin })
      .from(users)
      .where(eq(users.phone, phoneNumber))
      .limit(1);

    return user.length > 0 && user[0].isAdmin;
  } catch (error) {
    console.error("Error checking admin status:", error);
    return false;
  }
}

async function sendMessage(to: string, text: string): Promise<void> {
  const res = await fetch(
    `https://graph.facebook.com/v19.0/${PHONE_NUMBER_ID}/messages`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${ACCESS_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to,
        type: "text",
        text: { body: text },
      }),
    },
  );

  if (!res.ok) {
    const err = await res.text();
    throw new Error(err);
  }
}

serve(app);
