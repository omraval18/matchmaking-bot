import type { ConversationState } from "../types/conversation.types.js";
import type { WhatsAppMessage } from "../types/whatsapp.types.js";
import { CreateUserFlow } from "./admin/create-user.flow.js";
import { UpdateBiodataFlow } from "./admin/update-biodata.flow.js";
import { RemoveUserFlow } from "./admin/remove-user.flow.js";
import { SetPreferencesFlow } from "./user/set-preferences.flow.js";
import { FindMatchesFlow } from "./user/find-matches.flow.js";
import { DeleteAccountFlow } from "./user/delete-account.flow.js";

export class FlowHandler {
  static async handle(
    state: ConversationState,
    message: WhatsAppMessage,
  ): Promise<void> {
    const { flow } = state;

    console.log(
      `[FLOW] Handling ${flow} flow, step: ${state.step}, phone: ${state.phone}`,
    );

    switch (flow) {
      case "CREATE_USER":
        await CreateUserFlow.handle(state, message);
        break;
      case "UPDATE_BIO":
        await UpdateBiodataFlow.handle(state, message);
        break;
      case "REMOVE_USER":
        await RemoveUserFlow.handle(state, message);
        break;
      case "SET_PREFERENCES":
        await SetPreferencesFlow.handle(state, message);
        break;
      case "FIND_MATCHES":
        await FindMatchesFlow.handle(state, message);
        break;
      case "DELETE_ACCOUNT":
        await DeleteAccountFlow.handle(state, message);
        break;
      default:
        console.error(`Unknown flow type: ${flow}`);
    }
  }
}
