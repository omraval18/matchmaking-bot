import type {
  WhatsAppMessage,
  WhatsAppInteractive,
} from "../types/whatsapp.types.js";
import type { FlowType } from "../types/conversation.types.js";
import { ConversationService } from "../services/conversation.service.js";
import { UserService } from "../services/user.service.js";
import { WhatsAppService } from "../services/whatsapp.service.js";
import { FlowHandler } from "../flows/flow-handler.js";
import { CreateUserFlow } from "../flows/admin/create-user.flow.js";
import { UpdateBiodataFlow } from "../flows/admin/update-biodata.flow.js";
import { RemoveUserFlow } from "../flows/admin/remove-user.flow.js";

export class MessageProcessor {
  static async process(
    phoneNumber: string,
    message: WhatsAppMessage,
  ): Promise<void> {
    const state = await ConversationService.getState(phoneNumber);

    if (
      message.type === "text" &&
      message.text?.body.toLowerCase().trim() === "end"
    ) {
      await this.handleEndCommand(phoneNumber, state !== null);
      return;
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
        "❌ Current flow cancelled. You can start a new action anytime.",
      );
    } else {
      await WhatsAppService.sendTextMessage(
        phoneNumber,
        "No active flow to cancel.",
      );
    }
  }

  private static async handleNewMessage(
    phoneNumber: string,
    message: WhatsAppMessage,
  ): Promise<void> {
    const isAdmin = await UserService.isAdmin(phoneNumber);

    if (message.type === "text" && message.text?.body) {
      await this.handleTextMessage(phoneNumber, message.text.body, isAdmin);
    } else if (message.type === "button" && message.button) {
      await this.handleButtonMessage(
        phoneNumber,
        message.button.payload,
        isAdmin,
      );
    } else if (message.type === "interactive" && message.interactive) {
      await this.handleInteractiveMessage(
        phoneNumber,
        message.interactive,
        isAdmin,
      );
    } else {
      if (!isAdmin) {
        await this.showUserMenu(phoneNumber);
      }
    }
  }

  private static async handleTextMessage(
    phoneNumber: string,
    messageText: string,
    isAdmin: boolean,
  ): Promise<void> {
    const lowerCaseText = messageText.toLowerCase().trim();

    if (lowerCaseText === "hello") {
      if (isAdmin) {
        await WhatsAppService.sendTemplateMessage(
          phoneNumber,
          "matchmaking_admin",
        );
      } else {
        await this.showUserMenu(phoneNumber);
      }
    } else if (
      lowerCaseText === "set preferences" ||
      lowerCaseText === "set preference"
    ) {
      if (isAdmin) {
        await WhatsAppService.sendTextMessage(
          phoneNumber,
          "Admins don't need to set preferences. This feature is for users only.",
        );
      } else {
        const { SetPreferencesFlow } = await import(
          "../flows/user/set-preferences.flow.js"
        );
        await SetPreferencesFlow.initialize(phoneNumber);
      }
    } else if (
      lowerCaseText === "find matches" ||
      lowerCaseText === "find match"
    ) {
      if (isAdmin) {
        await WhatsAppService.sendTextMessage(
          phoneNumber,
          "Admins don't search for matches. This feature is for users only.",
        );
      } else {
        const { FindMatchesFlow } = await import(
          "../flows/user/find-matches.flow.js"
        );
        await FindMatchesFlow.initialize(phoneNumber);
      }
    } else {
      if (!isAdmin) {
        await this.showUserMenu(phoneNumber);
      } else {
        await WhatsAppService.sendTextMessage(
          phoneNumber,
          `Echo: ${messageText}`,
        );
      }
    }
  }

  private static async handleButtonMessage(
    phoneNumber: string,
    payload: string,
    isAdmin: boolean,
  ): Promise<void> {
    if (!isAdmin) {
      await WhatsAppService.sendTextMessage(
        phoneNumber,
        "You don't have permission to perform this action.",
      );
      return;
    }

    const flow = this.getFlowFromPayload(payload);
    if (flow) {
      await this.startFlow(phoneNumber, flow);
    } else {
      await WhatsAppService.sendTextMessage(
        phoneNumber,
        "Unknown button action.",
      );
    }
  }

  private static getFlowFromPayload(payload: string): FlowType | null {
    switch (payload) {
      case "Create New User":
        return "CREATE_USER";
      case "Update Biodata":
        return "UPDATE_BIO";
      case "Remove Biodata":
        return "REMOVE_USER";
      default:
        return null;
    }
  }

  private static async startFlow(
    phoneNumber: string,
    flow: FlowType,
  ): Promise<void> {
    try {
      switch (flow) {
        case "CREATE_USER":
          await CreateUserFlow.initialize(phoneNumber);
          break;
        case "UPDATE_BIO":
          await UpdateBiodataFlow.initialize(phoneNumber);
          break;
        case "REMOVE_USER":
          await RemoveUserFlow.initialize(phoneNumber);
          break;
      }
    } catch (error) {
      console.error("Error starting flow:", error);
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
      ],
    );
  }

  private static async handleInteractiveMessage(
    phoneNumber: string,
    interactive: WhatsAppInteractive,
    isAdmin: boolean,
  ): Promise<void> {
    if (interactive.type !== "button_reply" || !interactive.button_reply) {
      return;
    }

    const buttonId = interactive.button_reply.id;

    if (isAdmin) {
      await WhatsAppService.sendTextMessage(
        phoneNumber,
        "This menu is for users only. Admins should use the admin template.",
      );
      return;
    }

    switch (buttonId) {
      case "SET_PREFERENCES":
        const { SetPreferencesFlow } = await import(
          "../flows/user/set-preferences.flow.js"
        );
        await SetPreferencesFlow.initialize(phoneNumber);
        break;

      case "FIND_MATCHES":
        const { FindMatchesFlow } = await import(
          "../flows/user/find-matches.flow.js"
        );
        await FindMatchesFlow.initialize(phoneNumber);
        break;

      case "VIEW_BIO":
        const { ViewBioFlow } = await import("../flows/user/view-bio.flow.js");
        await ViewBioFlow.execute(phoneNumber);
        break;

      case "DELETE_ACCOUNT":
        const { DeleteAccountFlow } = await import(
          "../flows/user/delete-account.flow.js"
        );
        await DeleteAccountFlow.initialize(phoneNumber);
        break;

      case "MORE_MATCHES":
      case "NO_MORE_MATCHES":
        console.log("Match response button received outside of flow context");
        break;

      default:
        await WhatsAppService.sendTextMessage(
          phoneNumber,
          "Unknown option. Please try again.",
        );
        await this.showUserMenu(phoneNumber);
    }
  }
}
