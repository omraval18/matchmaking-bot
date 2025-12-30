import type { WhatsAppMessage } from "../types/whatsapp.types.js";
import { ConversationService } from "../services/conversation.service.js";
import { UserService } from "../services/user.service.js";
import { WhatsAppService } from "../services/whatsapp.service.js";
import { FlowHandler } from "../flows/flow-handler.js";
import { CreateUserFlow } from "../flows/admin/create-user.flow.js";
import { UpdateBiodataFlow } from "../flows/admin/update-biodata.flow.js";
import { RemoveUserFlow } from "../flows/admin/remove-user.flow.js";
import { IntentDetectionService } from "../services/intent-detection.service.js";
import { GlobalEvent, FlowEvent } from "../types/intent.types.js";

export class MessageProcessor {
  static async process(
    phoneNumber: string,
    message: WhatsAppMessage,
  ): Promise<void> {
    const state = await ConversationService.getState(phoneNumber);
    const isAdmin = await UserService.isAdmin(phoneNumber);

    if (message.type === "text" && message.text?.body) {
      const intent = await IntentDetectionService.detectMenuIntent(
        message,
        isAdmin,
      );

      if (intent.event === GlobalEvent.END_FLOW && intent.confidence >= 0.6) {
        await this.handleEndCommand(phoneNumber, state !== null);
        return;
      }

      if (intent.event === GlobalEvent.HELP && intent.confidence >= 0.6) {
        await this.handleHelpCommand(phoneNumber, isAdmin, state !== null);
        return;
      }
    }

    if (state) {
      await FlowHandler.handle(state, message);
    } else {
      await this.handleNewMessage(phoneNumber, message);
    }
  }

  private static async handleEndCommand(
    phoneNumber: string,
    hasActiveFlow: boolean,
  ): Promise<void> {
    if (hasActiveFlow) {
      await ConversationService.clearState(phoneNumber);
      await WhatsAppService.sendTextMessage(
        phoneNumber,
        "Thank you for using our service! We have closed your conversation.",
      );
    } else {
      await WhatsAppService.sendTextMessage(
        phoneNumber,
        "No active flow to cancel.",
      );
    }
  }

  private static async handleHelpCommand(
    phoneNumber: string,
    isAdmin: boolean,
    hasActiveFlow: boolean,
  ): Promise<void> {
    if (hasActiveFlow) {
      await WhatsAppService.sendTextMessage(
        phoneNumber,
        "💡 You're currently in a flow. Type 'end' or 'cancel' to exit, or continue with the current flow.",
      );
    }

    if (isAdmin) {
      await WhatsAppService.sendTemplateMessage(
        phoneNumber,
        "matchmaking_admin",
      );
    } else {
      await this.showUserMenu(phoneNumber);
    }
  }

  private static async handleNewMessage(
    phoneNumber: string,
    message: WhatsAppMessage,
  ): Promise<void> {
    const isAdmin = await UserService.isAdmin(phoneNumber);

    const intent = await IntentDetectionService.detectMenuIntent(
      message,
      isAdmin,
    );

    if (intent.confidence < 0.6) {
      await WhatsAppService.sendTextMessage(
        phoneNumber,
        "I didn't quite understand that. Please choose from the options below:",
      );

      if (isAdmin) {
        await WhatsAppService.sendTemplateMessage(
          phoneNumber,
          "matchmaking_admin",
        );
      } else {
        await this.showUserMenu(phoneNumber);
      }
      return;
    }

    if (intent.event === GlobalEvent.HELP) {
      if (isAdmin) {
        await WhatsAppService.sendTemplateMessage(
          phoneNumber,
          "matchmaking_admin",
        );
      } else {
        await this.showUserMenu(phoneNumber);
      }
      return;
    }

    if (intent.event === GlobalEvent.GREETING) {
      if (isAdmin) {
        await WhatsAppService.sendTemplateMessage(
          phoneNumber,
          "matchmaking_admin",
        );
      } else {
        await this.showUserMenu(phoneNumber);
      }
      return;
    }

    await this.initializeFlowFromIntent(
      phoneNumber,
      intent.event,
      isAdmin,
      message,
    );
  }

  private static async initializeFlowFromIntent(
    phoneNumber: string,
    event: string,
    isAdmin: boolean,
    message: WhatsAppMessage,
  ): Promise<void> {
    try {
      switch (event) {
        case FlowEvent.SET_PREFERENCES:
          if (isAdmin) {
            await WhatsAppService.sendTextMessage(
              phoneNumber,
              "Admins don't need to set preferences. This feature is for users only.",
            );
            return;
          }
          const { SetPreferencesFlow } = await import(
            "../flows/user/set-preferences.flow.js"
          );
          await SetPreferencesFlow.initialize(phoneNumber);
          break;

        case FlowEvent.FIND_MATCHES:
          if (isAdmin) {
            await WhatsAppService.sendTextMessage(
              phoneNumber,
              "Admins don't search for matches. This feature is for users only.",
            );
            return;
          }
          const { FindMatchesFlow } = await import(
            "../flows/user/find-matches.flow.js"
          );
          await FindMatchesFlow.initialize(phoneNumber);
          break;

        case FlowEvent.FIND_MATCHES_WITH_FILTERS:
          if (isAdmin) {
            await WhatsAppService.sendTextMessage(
              phoneNumber,
              "Admins don't search for matches. This feature is for users only.",
            );
            return;
          }
          let messageText = "";
          if (message.type === "text" && message.text?.body) {
            messageText = message.text.body;
          }
          const { FindMatchesWithFiltersFlow } = await import(
            "../flows/user/find-matches-with-filters.flow.js"
          );
          await FindMatchesWithFiltersFlow.initialize(phoneNumber, messageText);
          break;

        case FlowEvent.VIEW_BIO:
          const { ViewBioFlow } = await import(
            "../flows/user/view-bio.flow.js"
          );
          await ViewBioFlow.execute(phoneNumber);
          break;

        case FlowEvent.DELETE_ACCOUNT:
          const { DeleteAccountFlow } = await import(
            "../flows/user/delete-account.flow.js"
          );
          await DeleteAccountFlow.initialize(phoneNumber);
          break;

        case FlowEvent.CREATE_USER:
          if (!isAdmin) {
            await WhatsAppService.sendTextMessage(
              phoneNumber,
              "You don't have permission to perform this action.",
            );
            return;
          }
          await CreateUserFlow.initialize(phoneNumber);
          break;

        case FlowEvent.UPDATE_BIO:
          if (!isAdmin) {
            await WhatsAppService.sendTextMessage(
              phoneNumber,
              "You don't have permission to perform this action.",
            );
            return;
          }
          await UpdateBiodataFlow.initialize(phoneNumber);
          break;

        case FlowEvent.REMOVE_USER:
          if (!isAdmin) {
            await WhatsAppService.sendTextMessage(
              phoneNumber,
              "You don't have permission to perform this action.",
            );
            return;
          }
          await RemoveUserFlow.initialize(phoneNumber);
          break;

        case "UNKNOWN":
          if (isAdmin) {
            await WhatsAppService.sendTemplateMessage(
              phoneNumber,
              "matchmaking_admin",
            );
          } else {
            await this.showUserMenu(phoneNumber);
          }
          break;

        default:
          console.warn(`Unhandled intent event: ${event}`);
          if (isAdmin) {
            await WhatsAppService.sendTemplateMessage(
              phoneNumber,
              "matchmaking_admin",
            );
          } else {
            await this.showUserMenu(phoneNumber);
          }
      }
    } catch (error) {
      console.error("Error initializing flow from intent:", error);
      await WhatsAppService.sendTextMessage(
        phoneNumber,
        "Sorry, an error occurred. Please try again.",
      );
    }
  }

  private static async showUserMenu(phoneNumber: string): Promise<void> {
    await WhatsAppService.sendTextMessage(
      phoneNumber,
      "👋 Welcome! Please choose an option:",
    );

    await WhatsAppService.sendInteractiveButtons(
      phoneNumber,
      "What would you like to do?",
      [
        { id: "SET_PREFERENCES", title: "Set Preferences" },
        { id: "FIND_MATCHES", title: "Find Matches" },
        { id: "VIEW_BIO", title: "View My Bio" },
        { id: "DELETE_ACCOUNT", title: "Delete Account" },
      ],
    );
  }
}
