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
      console.log(
        `[FIND MATCHES FLOW] ❌ User not found for phone: ${userPhone}`,
      );
      await WhatsAppService.sendTextMessage(
        userPhone,
        "Error: User not found. Please contact support.",
      );
      return;
    }

    console.log(
      `[FIND MATCHES FLOW] User found - ID: ${user.id}, isAdmin: ${user.isAdmin}`,
    );

    try {
      await WhatsAppService.sendTextMessage(
        userPhone,
        "🔍 Searching for compatible matches...",
      );

      console.log(
        `[FIND MATCHES FLOW] Calling MatchService.findMatches for userId: ${user.id}`,
      );
      // Fetch 4 matches to check if there are more available
      const allMatches = await MatchService.findMatches(user.id, { limit: 4 });
      console.log(
        `[FIND MATCHES FLOW] Received ${allMatches.length} matches from service`,
      );

      if (allMatches.length === 0) {
        console.log(
          `[FIND MATCHES FLOW] No matches found - sending empty message`,
        );
        await WhatsAppService.sendTextMessage(
          userPhone,
          "😕 No matches found based on your preferences.\n\nTry updating your preferences using 'set preferences' command to see more profiles.",
        );
        return;
      }

      // Show only first 3 matches
      const matchesToShow = allMatches.slice(0, 3);
      const hasMoreMatches = allMatches.length > 3;

      console.log(
        `[FIND MATCHES FLOW] Sending ${matchesToShow.length} matches to user, hasMore: ${hasMoreMatches}`,
      );
      await this.sendMatches(userPhone, matchesToShow);

      // Only show "More Matches" button if there are actually more matches
      if (hasMoreMatches) {
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
      } else {
        await WhatsAppService.sendTextMessage(
          userPhone,
          "✅ That's all the matches we have for you right now!\n\nCheck back later or update your preferences to see different profiles.",
        );
      }
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
    console.log(
      `[FLOW] Handling FIND_MATCHES flow, step: SHOWING_MATCHES, phone: ${userPhone}`,
    );

    // Get the button ID from interactive message
    const buttonId = message.interactive?.button_reply?.id;
    console.log(`[FLOW] Button ID received: ${buttonId}`);

    // If it's the "More Matches" button, continue showing matches
    if (buttonId === "MORE_MATCHES") {
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

        const matchesShown = (data.matchesShown as number) || 3;

        // Fetch 4 matches to check if there are more available beyond these 3
        const allMatches = await MatchService.findMatches(user.id, {
          limit: 4,
          offset: matchesShown,
        });

        if (allMatches.length === 0) {
          await WhatsAppService.sendTextMessage(
            userPhone,
            "😕 No more matches available at the moment.\n\nCheck back later or update your preferences to see different profiles!",
          );
          await ConversationService.clearState(userPhone);
          return;
        }

        // Show only first 3 matches from the batch
        const matchesToShow = allMatches.slice(0, 3);
        const hasMoreMatches = allMatches.length > 3;

        await this.sendMatches(userPhone, matchesToShow);

        // Only show "More Matches" button if there are actually more matches
        if (hasMoreMatches) {
          await WhatsAppService.sendInteractiveButtons(
            userPhone,
            "Would you like to see more matches?",
            [
              { id: "MORE_MATCHES", title: "More Matches" },
              { id: "NO_MORE_MATCHES", title: "No, I'm Okay" },
            ],
          );

          await ConversationService.updateStep(userPhone, "SHOWING_MATCHES", {
            matchesShown: matchesShown + 3,
          });
        } else {
          await WhatsAppService.sendTextMessage(
            userPhone,
            "✅ That's all the matches we have for you right now!\n\nCheck back later or update your preferences to see different profiles.",
          );
          await ConversationService.clearState(userPhone);
        }
      } catch (error) {
        console.error("Error finding more matches:", error);
        await WhatsAppService.sendTextMessage(
          userPhone,
          "Sorry, there was an error finding more matches. Please try again later.",
        );
        await ConversationService.clearState(userPhone);
      }
    } else {
      // User clicked "No, I'm Okay" or sent any other message - end the flow
      console.log(
        `[FLOW] Ending flow - user chose not to see more matches or sent other message`,
      );

      if (buttonId === "NO_MORE_MATCHES") {
        await WhatsAppService.sendTextMessage(
          userPhone,
          "✅ Great! If you'd like to see matches again, just type 'find matches'.\n\nGood luck with your search! 💫",
        );
      }

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
    }
  }
}
