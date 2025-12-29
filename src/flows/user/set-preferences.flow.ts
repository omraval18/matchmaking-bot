import type { WhatsAppMessage } from "../../types/whatsapp.types.js";
import type { ConversationState } from "../../types/conversation.types.js";
import { WhatsAppService } from "../../services/whatsapp.service.js";
import { ConversationService } from "../../services/conversation.service.js";
import { UserService } from "../../services/user.service.js";
import { PreferenceService } from "../../services/preference.service.js";

export class SetPreferencesFlow {
  static async initialize(userPhone: string): Promise<void> {
    await ConversationService.startFlow(userPhone, "SET_PREFERENCES");

    const instructionsMessage = `📝 *Set Your Partner Preferences*

Please describe your ideal partner preferences in natural language. You can mention:

✓ Age range (e.g., "25-30 years")
✓ Height requirements (e.g., "at least 5'6\"")
✓ Education level (e.g., "Graduate or above")
✓ Occupation (e.g., "Engineer" or "Doctor")
✓ Location preference (e.g., "from Mumbai")
✓ Citizenship (e.g., "Indian citizen")
✓ Caste/Community preference
✓ Dietary preference (e.g., "Vegetarian")
✓ Any other specific requirements

*Example:*
"I'm looking for someone aged 25-30, should be at least graduate, preferably working in IT, from Mumbai or Delhi, vegetarian, and should be from Patel community."

Please type your preferences now:`;

    await WhatsAppService.sendTextMessage(userPhone, instructionsMessage);

    await ConversationService.updateStep(userPhone, "AWAITING_PREFERENCES");
  }

  static async handle(
    state: ConversationState,
    message: WhatsAppMessage,
  ): Promise<void> {
    const { phone: userPhone, step } = state;

    if (step === "AWAITING_PREFERENCES") {
      await this.handlePreferencesInput(userPhone, message);
    }
  }

  private static async handlePreferencesInput(
    userPhone: string,
    message: WhatsAppMessage,
  ): Promise<void> {
    if (message.type !== "text" || !message.text?.body) {
      await WhatsAppService.sendTextMessage(
        userPhone,
        "Please provide your preferences as text.",
      );
      return;
    }

    try {
      await WhatsAppService.sendTextMessage(
        userPhone,
        "Processing your preferences...",
      );

      // Extract preferences using AI
      const extractedPreferences = await PreferenceService.extractFromText(
        message.text.body,
      );

      console.log("Extracted preferences:", extractedPreferences);

      // Get user from phone
      const user = await UserService.getUserByPhone(userPhone);
      if (!user) {
        await WhatsAppService.sendTextMessage(
          userPhone,
          "Error: User not found. Please contact support.",
        );
        await ConversationService.clearState(userPhone);
        return;
      }

      // Save preferences to database
      await PreferenceService.savePreferences(user.id, extractedPreferences);

      console.log("Preferences saved successfully");

      // Send confirmation
      let confirmationMessage = `✅ *Preferences Saved Successfully!*\n\n`;
      confirmationMessage += `Your partner preferences have been saved:\n\n`;

      if (extractedPreferences.ageMin || extractedPreferences.ageMax) {
        confirmationMessage += `📊 Age: `;
        if (extractedPreferences.ageMin && extractedPreferences.ageMax) {
          confirmationMessage += `${extractedPreferences.ageMin}-${extractedPreferences.ageMax} years\n`;
        } else if (extractedPreferences.ageMin) {
          confirmationMessage += `${extractedPreferences.ageMin}+ years\n`;
        } else {
          confirmationMessage += `up to ${extractedPreferences.ageMax} years\n`;
        }
      }

      if (extractedPreferences.heightMin || extractedPreferences.heightMax) {
        confirmationMessage += `📏 Height: `;
        if (extractedPreferences.heightMin && extractedPreferences.heightMax) {
          confirmationMessage += `${extractedPreferences.heightMin} - ${extractedPreferences.heightMax}\n`;
        } else if (extractedPreferences.heightMin) {
          confirmationMessage += `at least ${extractedPreferences.heightMin}\n`;
        } else {
          confirmationMessage += `up to ${extractedPreferences.heightMax}\n`;
        }
      }

      if (extractedPreferences.education) {
        confirmationMessage += `🎓 Education: ${extractedPreferences.education}\n`;
      }

      if (extractedPreferences.occupation) {
        confirmationMessage += `💼 Occupation: ${extractedPreferences.occupation}\n`;
      }

      if (extractedPreferences.city) {
        confirmationMessage += `📍 Location: ${extractedPreferences.city}\n`;
      }

      if (extractedPreferences.citizenship) {
        confirmationMessage += `🌍 Citizenship: ${extractedPreferences.citizenship}\n`;
      }

      if (extractedPreferences.caste) {
        confirmationMessage += `🏛️ Community: ${extractedPreferences.caste}\n`;
      }

      if (extractedPreferences.diet) {
        confirmationMessage += `🥗 Diet: ${extractedPreferences.diet}\n`;
      }

      confirmationMessage += `\nYou can now use "find matches" to see compatible profiles!\n\n`;
      confirmationMessage += `💡 Type "set preferences" anytime to update your preferences.`;

      await WhatsAppService.sendTextMessage(userPhone, confirmationMessage);

      // Clear conversation state
      await ConversationService.clearState(userPhone);
    } catch (error) {
      console.error("Error processing preferences:", error);

      await WhatsAppService.sendTextMessage(
        userPhone,
        "Sorry, there was an error processing your preferences. Please try again or contact support.",
      );

      // Stay in AWAITING_PREFERENCES step
    }
  }
}
