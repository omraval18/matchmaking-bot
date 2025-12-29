import type { WhatsAppMessage } from "../../types/whatsapp.types.js";
import type { ConversationState } from "../../types/conversation.types.js";
import { WhatsAppService } from "../../services/whatsapp.service.js";
import { ConversationService } from "../../services/conversation.service.js";
import { UserService } from "../../services/user.service.js";
import { ValidationUtils } from "../../utils/validation.utils.js";

export class RemoveUserFlow {
  static async initialize(adminPhone: string): Promise<void> {
    await ConversationService.startFlow(adminPhone, "REMOVE_USER");

    await WhatsAppService.sendTextMessage(
      adminPhone,
      "Please provide the WhatsApp number of the user whose biodata you want to remove (include country code, e.g., 917779088399)",
    );

    await ConversationService.updateStep(adminPhone, "AWAITING_PHONE");
  }

  static async handle(
    state: ConversationState,
    message: WhatsAppMessage,
  ): Promise<void> {
    const { phone: adminPhone, step } = state;

    if (step === "AWAITING_PHONE") {
      await this.handlePhoneInput(adminPhone, message);
    }
  }

  private static async handlePhoneInput(
    adminPhone: string,
    message: WhatsAppMessage,
  ): Promise<void> {
    if (message.type !== "text" || !message.text?.body) {
      return;
    }

    const validatedPhone = ValidationUtils.validatePhoneNumber(
      message.text.body,
    );

    if (!validatedPhone) {
      await WhatsAppService.sendTextMessage(
        adminPhone,
        "Please enter a valid phone number with country code (e.g., 917779088399)",
      );
      return;
    }

    const user = await UserService.getUserByPhone(validatedPhone);

    if (!user) {
      await WhatsAppService.sendTextMessage(
        adminPhone,
        `❌ User with phone number ${validatedPhone} does not exist in the database. Please provide a valid phone number.`,
      );
      return;
    }

    if (user.isAdmin) {
      await WhatsAppService.sendTextMessage(
        adminPhone,
        `❌ Cannot remove admin user ${validatedPhone}. Admin accounts must be managed separately.`,
      );
      await ConversationService.clearState(adminPhone);
      return;
    }

    await UserService.deleteUser(validatedPhone);

    console.log("Deleted user:", validatedPhone);

    try {
      await WhatsAppService.sendTextMessage(
        validatedPhone,
        "Your account and biodata have been removed from our system. Thank you for using our service.",
      );

      await WhatsAppService.sendTextMessage(
        adminPhone,
        `✅ User removed successfully!\n\nUser: ${validatedPhone}\nAccount: Deleted\nNotification: Sent to user`,
      );
    } catch (error) {
      console.log("Could not send notification to removed user:", error);

      await WhatsAppService.sendTextMessage(
        adminPhone,
        `✅ User removed successfully!\n\nUser: ${validatedPhone}\nAccount: Deleted\n\n⚠️ Note: Notification could not be sent to user (not in test recipient list).`,
      );
    }

    await ConversationService.clearState(adminPhone);
  }
}
