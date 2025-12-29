import type { WhatsAppMessage } from "../../types/whatsapp.types.js";
import type { ConversationState } from "../../types/conversation.types.js";
import { WhatsAppService } from "../../services/whatsapp.service.js";
import { ConversationService } from "../../services/conversation.service.js";
import { UserService } from "../../services/user.service.js";
import { MatchService } from "../../services/match.service.js";

export class FindMatchesFlow {
  static async initialize(userPhone: string): Promise<void> {
    console.log(`[FIND MATCHES FLOW] Initializing for phone: ${userPhone}`);
    
    const user = await UserService.getUserByPhone(userPhone);
    if (!user) {
      console.log(`[FIND MATCHES FLOW] ❌ User not found for phone: ${userPhone}`);
      await WhatsAppService.sendTextMessage(
        userPhone,
        "Error: User not found. Please contact support.",
      );
      return;
    }

    console.log(`[FIND MATCHES FLOW] User found - ID: ${user.id}, isAdmin: ${user.isAdmin}`);

    try {
      await WhatsAppService.sendTextMessage(
        userPhone,
        "🔍 Searching for compatible matches...",
      );

      console.log(`[FIND MATCHES FLOW] Calling MatchService.findMatches for userId: ${user.id}`);
      const matches = await MatchService.findMatches(user.id, 3);
      console.log(`[FIND MATCHES FLOW] Received ${matches.length} matches from service`);

      if (matches.length === 0) {
        console.log(`[FIND MATCHES FLOW] No matches found - sending empty message`);
        await WhatsAppService.sendTextMessage(
          userPhone,
          "😕 No matches found based on your preferences.\n\nTry updating your preferences using 'set preferences' command to see more profiles.",
        );
        return;
      }

      console.log(`[FIND MATCHES FLOW] Sending ${matches.length} matches to user`);
      await this.sendMatches(userPhone, matches);

      await WhatsAppService.sendInteractiveButtons(
        userPhone,
        "Would you like to see more matches?",
        [
          { id: "MORE_MATCHES", title: "More Matches" },
          { id: "NO_MORE_MATCHES", title: "No, I'm Okay" },
        ],
      );

      await ConversationService.startFlow(userPhone, "FIND_MATCHES", {
        matchesShown: 3,
      });
      await ConversationService.updateStep(userPhone, "SHOWING_MATCHES");
      console.log(`[FIND MATCHES FLOW] ✅ Flow completed successfully`);
    } catch (error) {
      console.error("[FIND MATCHES FLOW] ❌ Error finding matches:", error);
      await WhatsAppService.sendTextMessage(
        userPhone,
        "Sorry, there was an error finding matches. Please try again later.",
      );
    }
  }

  static async handle(
    state: ConversationState,
    message: WhatsAppMessage,
  ): Promise<void> {
    const { phone: userPhone, step, data } = state;

    if (step === "SHOWING_MATCHES") {
      await this.handleMatchResponse(userPhone, data, message);
    }
  }

  private static async handleMatchResponse(
    userPhone: string,
    data: Record<string, unknown>,
    message: WhatsAppMessage,
  ): Promise<void> {
    console.log(`[FLOW] Handling FIND_MATCHES flow, step: SHOWING_MATCHES, phone: ${userPhone}`);

    if (message.type !== "button" || !message.button || message.button.payload !== "MORE_MATCHES") {
      console.log(`[FLOW] Ending flow - received non-button or non-MORE_MATCHES response`);

      if (message.type === "button" && message.button?.payload === "NO_MORE_MATCHES") {
        await WhatsAppService.sendTextMessage(
          userPhone,
          "✅ Great! If you'd like to see matches again, just type 'find matches'.\n\nGood luck with your search! 💫",
        );
      }

      await ConversationService.clearState(userPhone);
      return;
    }

    console.log(`[FLOW] User wants more matches`);

    const user = await UserService.getUserByPhone(userPhone);
    if (!user) {
      await WhatsAppService.sendTextMessage(
        userPhone,
        "Error: User not found. Please contact support.",
      );
      await ConversationService.clearState(userPhone);
      return;
    }

    try {
      await WhatsAppService.sendTextMessage(
        userPhone,
        "🔍 Finding more matches...",
      );

      const matches = await MatchService.findMatches(user.id, 3);

      if (matches.length === 0) {
        await WhatsAppService.sendTextMessage(
          userPhone,
          "😕 No more matches available at the moment.\n\nCheck back later or update your preferences to see different profiles!",
        );
        await ConversationService.clearState(userPhone);
        return;
      }

      await this.sendMatches(userPhone, matches);

      await WhatsAppService.sendInteractiveButtons(
        userPhone,
        "Would you like to see more matches?",
        [
          { id: "MORE_MATCHES", title: "More Matches" },
          { id: "NO_MORE_MATCHES", title: "No, I'm Okay" },
        ],
      );

      const matchesShown = (data.matchesShown as number) || 3;
      await ConversationService.updateStep(userPhone, "SHOWING_MATCHES", {
        matchesShown: matchesShown + 3,
      });
    } catch (error) {
      console.error("Error finding more matches:", error);
      await WhatsAppService.sendTextMessage(
        userPhone,
        "Sorry, there was an error finding more matches. Please try again later.",
      );
      await ConversationService.clearState(userPhone);
    }
  }

  private static async sendMatches(
    userPhone: string,
    matches: any[],
  ): Promise<void> {
    const headerMessage = `✨ *Found ${matches.length} Compatible ${matches.length === 1 ? "Match" : "Matches"}!*\n\n`;
    await WhatsAppService.sendTextMessage(userPhone, headerMessage);

    for (const match of matches) {
      const matchMessage = MatchService.formatMatchResult(match);
      await WhatsAppService.sendTextMessage(userPhone, matchMessage);

      await new Promise((resolve) => setTimeout(resolve, 500));
    }
  }
}
