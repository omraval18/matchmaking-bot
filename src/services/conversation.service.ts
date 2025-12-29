import { db } from "../lib/db/index.js";
import { conversationStates } from "../lib/db/schema.js";
import { eq } from "drizzle-orm";
import type {
  ConversationState,
  FlowType,
  FlowStep,
} from "../types/conversation.types.js";

export class ConversationService {
  static async getState(phone: string): Promise<ConversationState | null> {
    try {
      const results = await db
        .select()
        .from(conversationStates)
        .where(eq(conversationStates.phone, phone))
        .limit(1);

      return results.length > 0 ? (results[0] as ConversationState) : null;
    } catch (error) {
      console.error("Error getting conversation state:", error);
      return null;
    }
  }

  static async startFlow(
    phone: string,
    flow: FlowType,
    initialData: Record<string, unknown> = {},
  ): Promise<void> {
    await db
      .delete(conversationStates)
      .where(eq(conversationStates.phone, phone));

    await db.insert(conversationStates).values({
      phone,
      flow,
      step: "INITIAL",
      data: initialData,
    });
  }

  static async updateStep(
    phone: string,
    step: FlowStep,
    additionalData?: Record<string, unknown>,
  ): Promise<void> {
    try {
      const updateData: {
        step: FlowStep;
        updatedAt: Date;
        data?: Record<string, unknown>;
      } = {
        step,
        updatedAt: new Date(),
      };

      if (additionalData) {
        const currentState = await this.getState(phone);
        updateData.data = { ...currentState?.data, ...additionalData };
      }

      await db
        .update(conversationStates)
        .set(updateData)
        .where(eq(conversationStates.phone, phone));
    } catch (error) {
      console.error("Error updating conversation step:", error);
    }
  }

  static async clearState(phone: string): Promise<void> {
    try {
      await db
        .delete(conversationStates)
        .where(eq(conversationStates.phone, phone));
    } catch (error) {
      console.error("Error clearing conversation state:", error);
    }
  }
}
