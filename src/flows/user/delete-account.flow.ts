import type { WhatsAppMessage } from "../../types/whatsapp.types.js";
import type { ConversationState } from "../../types/conversation.types.js";
import { WhatsAppService } from "../../services/whatsapp.service.js";
import { ConversationService } from "../../services/conversation.service.js";
import { UserService } from "../../services/user.service.js";

export class DeleteAccountFlow {
  static async initialize(userPhone: string): Promise<void> {
    const confirmMessage = `⚠️ *Delete Account Confirmation*

Are you sure you want to delete your account?

This action will:
❌ Delete your biodata
❌ Delete your preferences
❌ Remove all your information from our system

This action CANNOT be undone.

Please reply with:
✅ "YES DELETE" to confirm deletion
❌ "CANCEL" to keep your account`;

    await WhatsAppService.sendTextMessage(userPhone, confirmMessage);

    await ConversationService.startFlow(userPhone, "DELETE_ACCOUNT");
    await ConversationService.updateStep(userPhone, "AWAITING_CONFIRMATION");
  }

  static async handle(
    state: ConversationState,
    message: WhatsAppMessage,
  ): Promise<void> {
    const { phone: userPhone, step } = state;

    if (step === "AWAITING_CONFIRMATION") {
      await this.handleConfirmation(userPhone, message);
    }
  }

  private static async handleConfirmation(
    userPhone: string,
    message: WhatsAppMessage,
  ): Promise<void> {
    if (message.type !== "text" || !message.text?.body) {
      await WhatsAppService.sendTextMessage(
        userPhone,
        'Please reply with "YES DELETE" to confirm or "CANCEL" to keep your account.',
      );
      return;
    }

    const response = message.text.body.toUpperCase().trim();

    if (response === "YES DELETE") {
      try {
        // Get user
        const user = await UserService.getUserByPhone(userPhone);
        if (!user) {
          await WhatsAppService.sendTextMessage(
            userPhone,
            "Error: User not found.",
          );
          await ConversationService.clearState(userPhone);
          return;
        }

        // Check if user is admin
        if (user.isAdmin) {
          await WhatsAppService.sendTextMessage(
            userPhone,
            "❌ Admin accounts cannot be deleted through this method. Please contact system administrator.",
          );
          await ConversationService.clearState(userPhone);
          return;
        }

        // Delete user (cascade will delete biodata and preferences)
        await UserService.deleteUser(userPhone);

        console.log("User account deleted:", userPhone);

        await WhatsAppService.sendTextMessage(
          userPhone,
          `✅ Your account has been successfully deleted.

All your information has been removed from our system.

Thank you for using our matchmaking service. We wish you all the best in your journey! 💫

If you wish to join again in the future, please contact our admin.`,
        );

        // Clear conversation state
        await ConversationService.clearState(userPhone);
      } catch (error) {
        console.error("Error deleting account:", error);
        await WhatsAppService.sendTextMessage(
          userPhone,
          "Sorry, there was an error deleting your account. Please contact support.",
        );
        await ConversationService.clearState(userPhone);
      }
    } else if (response === "CANCEL") {
      await WhatsAppService.sendTextMessage(
        userPhone,
        "✅ Account deletion cancelled. Your account is safe!",
      );
      await ConversationService.clearState(userPhone);
    } else {
      await WhatsAppService.sendTextMessage(
        userPhone,
        '⚠️ Invalid response.\n\nPlease reply with "YES DELETE" to confirm deletion or "CANCEL" to keep your account.',
      );
    }
  }
}
