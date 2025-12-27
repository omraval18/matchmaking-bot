import { Hono } from "hono";
import { serve } from "@hono/node-server";
import { env } from "./env.js";
import { db } from "./lib/db/index.js";
import { users, conversationStates } from "./lib/db/schema.js";
import { eq } from "drizzle-orm";

type WebhookMessage = {
  from: string;
  id: string;
  timestamp: string;
  type: "text" | "document" | "image";
  text?: { body: string };
  document?: {
    filename: string;
    mime_type: string;
    sha256: string;
    id: string;
  };
};

type WebhookEntry = {
  changes: {
    value: {
      messages?: WebhookMessage[];
    };
  }[];
};

type WebhookPayload = {
  entry: WebhookEntry[];
};

type ConversationState = {
  id: number;
  phone: string;
  flow: string;
  step: string;
  data: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
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

  console.log("Webhook event received:", JSON.stringify(body, null, 2));

  const message = body.entry?.[0]?.changes?.[0]?.value?.messages?.[0];
  if (!message) {
    return c.json({ status: "ignored" });
  }

  const phoneNumber = message.from;

  // Check if user has an ongoing conversation state
  const state = await getConversationState(phoneNumber);

  if (state) {
    // User is in a flow, handle the flow step
    await handleFlowStep(state, message);
  } else {
    // No active flow, check for new command or greeting
    if (message.type === "text" && message.text?.body) {
      const messageText = message.text.body.toLowerCase().trim();

      // Check if admin
      const isAdmin = await checkIfAdmin(phoneNumber);

      if (messageText === "hello") {
        const response = isAdmin ? "hello admin" : "hello customer";
        await sendMessage(phoneNumber, response);
      } else if (isAdmin) {
        // Detect admin intent
        const intent = detectIntent(messageText);
        if (intent) {
          await startFlow(phoneNumber, intent);
        } else {
          await sendMessage(phoneNumber, `Echo: ${message.text.body}`);
        }
      } else {
        await sendMessage(phoneNumber, `Echo: ${message.text.body}`);
      }
    }
  }

  return c.json({ status: "processed" });
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

function detectIntent(message: string): string | null {
  const lowerMessage = message.toLowerCase().trim();

  if (lowerMessage === "create user" || lowerMessage === "create_user") {
    return "CREATE_USER";
  }
  if (lowerMessage === "update bio" || lowerMessage === "update_bio") {
    return "UPDATE_BIO";
  }
  if (lowerMessage === "remove user" || lowerMessage === "remove_user") {
    return "REMOVE_USER";
  }

  return null;
}

async function getConversationState(
  phone: string,
): Promise<ConversationState | null> {
  try {
    const result = await db
      .select()
      .from(conversationStates)
      .where(eq(conversationStates.phone, phone))
      .limit(1);

    return result.length > 0 ? (result[0] as ConversationState) : null;
  } catch (error) {
    console.error("Error getting conversation state:", error);
    return null;
  }
}

async function startFlow(phone: string, flow: string): Promise<void> {
  try {
    // Delete any existing state for this phone
    await db.delete(conversationStates).where(eq(conversationStates.phone, phone));

    // Create new conversation state
    await db.insert(conversationStates).values({
      phone,
      flow,
      step: "INITIAL",
      data: {},
    });

    // Send initial message based on flow
    if (flow === "CREATE_USER") {
      await sendMessage(
        phone,
        "Please provide the WhatsApp number of the new user you want to add (include country code, e.g., 917779088399)",
      );
      await updateConversationStep(phone, "AWAITING_PHONE");
    } else if (flow === "UPDATE_BIO") {
      await sendMessage(
        phone,
        "Please provide the WhatsApp number of the user whose biodata you want to update (include country code, e.g., 917779088399)",
      );
      await updateConversationStep(phone, "AWAITING_PHONE");
    } else if (flow === "REMOVE_USER") {
      await sendMessage(phone, "REMOVE_USER flow coming soon!");
      await clearConversationState(phone);
    }
  } catch (error) {
    console.error("Error starting flow:", error);
    await sendMessage(phone, "Sorry, an error occurred. Please try again.");
  }
}

async function updateConversationStep(
  phone: string,
  step: string,
  data?: Record<string, any>,
): Promise<void> {
  try {
    const updateData: any = {
      step,
      updatedAt: new Date(),
    };

    if (data) {
      const currentState = await getConversationState(phone);
      updateData.data = { ...currentState?.data, ...data };
    }

    await db
      .update(conversationStates)
      .set(updateData)
      .where(eq(conversationStates.phone, phone));
  } catch (error) {
    console.error("Error updating conversation step:", error);
  }
}

async function clearConversationState(phone: string): Promise<void> {
  try {
    await db.delete(conversationStates).where(eq(conversationStates.phone, phone));
  } catch (error) {
    console.error("Error clearing conversation state:", error);
  }
}

function validatePhoneNumber(phone: string): string | null {
  // Remove all non-digit characters
  const cleaned = phone.replace(/\D/g, "");

  // Check if it's a valid format (10-15 digits, starting with country code)
  if (cleaned.length >= 10 && cleaned.length <= 15) {
    return cleaned;
  }

  return null;
}

async function handleFlowStep(
  state: ConversationState,
  message: WebhookMessage,
): Promise<void> {
  const { phone, flow, step, data } = state;

  console.log(`[FLOW] Handling ${flow} flow, step: ${step}, phone: ${phone}`);

  if (flow === "CREATE_USER") {
    await handleCreateUserFlow(phone, step, data, message);
  } else if (flow === "UPDATE_BIO") {
    await handleUpdateBioFlow(phone, step, data, message);
  } else if (flow === "REMOVE_USER") {
    await sendMessage(phone, "REMOVE_USER flow not implemented yet");
    await clearConversationState(phone);
  }
}

async function handleCreateUserFlow(
  adminPhone: string,
  step: string,
  data: Record<string, any>,
  message: WebhookMessage,
): Promise<void> {
  try {
    if (step === "AWAITING_PHONE") {
      // Expecting phone number
      if (message.type === "text" && message.text?.body) {
        const validatedPhone = validatePhoneNumber(message.text.body);

        if (!validatedPhone) {
          await sendMessage(
            adminPhone,
            "Please enter a valid phone number with country code (e.g., 917779088399)",
          );
          return;
        }

        // Check if user already exists
        const existingUser = await db
          .select()
          .from(users)
          .where(eq(users.phone, validatedPhone))
          .limit(1);

        if (existingUser.length > 0) {
          await sendMessage(
            adminPhone,
            `A user with phone number ${validatedPhone} already exists. Please provide a different number.`,
          );
          return;
        }

        // Create the new user
        const newUser = await db
          .insert(users)
          .values({
            phone: validatedPhone,
            isAdmin: false,
          })
          .returning();

        console.log("Created new user:", newUser[0]);

        await updateConversationStep(adminPhone, "AWAITING_PDF", {
          newUserPhone: validatedPhone,
          newUserId: newUser[0].id,
        });

        await sendMessage(
          adminPhone,
          `User created successfully! Please upload the biodata PDF for user ${validatedPhone}.`,
        );
      }
    } else if (step === "AWAITING_PDF") {
      // Expecting PDF document
      if (message.type === "document" && message.document) {
        const { mime_type, id: mediaId } = message.document;

        if (mime_type !== "application/pdf") {
          await sendMessage(
            adminPhone,
            "Please upload a PDF file only. Other formats are not supported.",
          );
          return;
        }

        // TODO: Download and store the PDF
        // For now, we'll just acknowledge receipt
        console.log("Received PDF with media ID:", mediaId);

        const newUserPhone = data.newUserPhone as string;

        // Try to send welcome message to the new user
        try {
          await sendMessage(
            newUserPhone,
            "Welcome! Your account has been created. We have received your biodata and will get back to you soon.",
          );

          // Notify admin of success
          await sendMessage(
            adminPhone,
            `✅ User creation completed!\n\nUser: ${newUserPhone}\nPDF: Received\nWelcome message: Sent`,
          );
        } catch (error) {
          // If sending to new user fails (e.g., not in allowlist), notify admin
          console.log("Could not send welcome message to new user:", error);

          await sendMessage(
            adminPhone,
            `✅ User creation completed!\n\nUser: ${newUserPhone}\nPDF: Received\n\n⚠️ Note: Welcome message could not be sent (user not in test recipient list). Add ${newUserPhone} to your WhatsApp Business recipient allowlist to enable messaging.`,
          );
        }

        // Clear conversation state
        await clearConversationState(adminPhone);
      } else {
        await sendMessage(
          adminPhone,
          "Please upload the biodata as a PDF document.",
        );
      }
    }
  } catch (error) {
    console.error("Error in CREATE_USER flow:", error);
    await sendMessage(
      adminPhone,
      "An error occurred. Please try again or contact support.",
    );
    await clearConversationState(adminPhone);
  }
}

async function handleUpdateBioFlow(
  adminPhone: string,
  step: string,
  data: Record<string, any>,
  message: WebhookMessage,
): Promise<void> {
  try {
    if (step === "AWAITING_PHONE") {
      // Expecting phone number
      if (message.type === "text" && message.text?.body) {
        const validatedPhone = validatePhoneNumber(message.text.body);

        if (!validatedPhone) {
          await sendMessage(
            adminPhone,
            "Please enter a valid phone number with country code (e.g., 917779088399)",
          );
          return;
        }

        // Check if user exists
        const existingUser = await db
          .select()
          .from(users)
          .where(eq(users.phone, validatedPhone))
          .limit(1);

        if (existingUser.length === 0) {
          await sendMessage(
            adminPhone,
            `❌ User with phone number ${validatedPhone} does not exist in the database. Please provide a valid phone number that exists.`,
          );
          return;
        }

        // User exists, ask for PDF
        await updateConversationStep(adminPhone, "AWAITING_PDF", {
          targetUserPhone: validatedPhone,
          targetUserId: existingUser[0].id,
        });

        await sendMessage(
          adminPhone,
          `User found! Please upload the updated biodata PDF for user ${validatedPhone}.`,
        );
      }
    } else if (step === "AWAITING_PDF") {
      // Expecting PDF document
      if (message.type === "document" && message.document) {
        const { mime_type, id: mediaId } = message.document;

        if (mime_type !== "application/pdf") {
          await sendMessage(
            adminPhone,
            "Please upload a PDF file only. Other formats are not supported.",
          );
          return;
        }

        // TODO: Download and store the PDF
        // For now, we'll just acknowledge receipt
        console.log("Received updated biodata PDF with media ID:", mediaId);

        const targetUserPhone = data.targetUserPhone as string;

        // Try to send notification to the user whose bio was updated
        try {
          await sendMessage(
            targetUserPhone,
            "Your biodata has been updated successfully. Our team will review it and get back to you soon.",
          );

          // Notify admin of success
          await sendMessage(
            adminPhone,
            `✅ Biodata updated successfully!\n\nUser: ${targetUserPhone}\nUpdated PDF: Received\nNotification: Sent to user`,
          );
        } catch (error) {
          // If sending to user fails (e.g., not in allowlist), notify admin
          console.log("Could not send notification to user:", error);

          await sendMessage(
            adminPhone,
            `✅ Biodata updated successfully!\n\nUser: ${targetUserPhone}\nUpdated PDF: Received\n\n⚠️ Note: Notification could not be sent to user (not in test recipient list).`,
          );
        }

        // Clear conversation state - flow is complete
        await clearConversationState(adminPhone);
      } else {
        await sendMessage(
          adminPhone,
          "Please upload the biodata as a PDF document.",
        );
      }
    }
  } catch (error) {
    console.error("Error in UPDATE_BIO flow:", error);
    await sendMessage(
      adminPhone,
      "An error occurred. Please try again or contact support.",
    );
    await clearConversationState(adminPhone);
  }
}

serve(app);
