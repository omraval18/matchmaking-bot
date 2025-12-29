import type { WhatsAppMessage } from "../types/whatsapp.types.js";
import type { DetectedIntent, FlowEvent } from "../types/intent.types.js";
import { GlobalEvent } from "../types/intent.types.js";
import { intentDetectionAgent } from "../ai/intent-detection-agent.js";
import { buildMenuIntentPrompt } from "../ai/prompts/intent-prompt.js";

export class IntentDetectionService {
  static async detectMenuIntent(
    message: WhatsAppMessage,
    isAdmin: boolean,
  ): Promise<DetectedIntent> {
    if (message.type === "interactive" && message.interactive?.button_reply) {
      return this.mapButtonToFlowEvent(message.interactive.button_reply.id);
    }

    if (message.type === "button" && message.button?.payload) {
      return this.mapButtonToFlowEvent(message.button.payload);
    }

    if (message.type === "text" && message.text?.body) {
      return this.detectTextIntent(message.text.body, isAdmin);
    }

    return {
      event: "UNKNOWN",
      confidence: 0.1,
      reasoning: "Unsupported message type (not text or button)",
    };
  }

  private static mapButtonToFlowEvent(buttonId: string): DetectedIntent {
    const buttonMap: Record<string, FlowEvent | GlobalEvent> = {
      SET_PREFERENCES: "SET_PREFERENCES" as FlowEvent,
      FIND_MATCHES: "FIND_MATCHES" as FlowEvent,
      VIEW_BIO: "VIEW_BIO" as FlowEvent,
      DELETE_ACCOUNT: "DELETE_ACCOUNT" as FlowEvent,

      // Admin flow buttons (from template)
      "Create New User": "CREATE_USER" as FlowEvent,
      "Update Biodata": "UPDATE_BIO" as FlowEvent,
      "Remove Biodata": "REMOVE_USER" as FlowEvent,
    };

    const event = buttonMap[buttonId];

    if (event) {
      return {
        event,
        confidence: 1.0,
        reasoning: `Direct button click: ${buttonId}`,
      };
    }

    return {
      event: "UNKNOWN",
      confidence: 0.1,
      reasoning: `Unknown button ID: ${buttonId}`,
    };
  }

  private static async detectTextIntent(
    text: string,
    isAdmin: boolean,
  ): Promise<DetectedIntent> {
    try {
      const prompt = buildMenuIntentPrompt(text, isAdmin);

      const result = await intentDetectionAgent.generate({
        prompt,
      });

      console.log("[INTENT]", {
        timestamp: new Date().toISOString(),
        message: text,
        detectedEvent: result.output.event,
        confidence: result.output.confidence,
        reasoning: result.output.reasoning,
        isAdmin,
      });

      return {
        event: result.output.event,
        confidence: result.output.confidence,
        reasoning: result.output.reasoning,
      };
    } catch (error) {
      console.error("[INTENT] Error detecting intent:", error);

      return {
        event: "UNKNOWN",
        confidence: 0.1,
        reasoning: "Error occurred during intent detection",
      };
    }
  }
}
