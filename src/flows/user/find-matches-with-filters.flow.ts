import { WhatsAppService } from "../../services/whatsapp.service.js";
import { UserService } from "../../services/user.service.js";
import { MatchService } from "../../services/match.service.js";
import { filterExtractionAgent } from "../../ai/filter-extraction-agent.js";
import { buildFilterExtractionPrompt } from "../../ai/prompts/filter-extraction-prompt.js";
import type { AdHocFilters } from "../../types/filter.types.js";

export class FindMatchesWithFiltersFlow {
  static async initialize(
    userPhone: string,
    messageText: string,
  ): Promise<void> {
    console.log(
      `[FIND MATCHES WITH FILTERS FLOW] Initializing for phone: ${userPhone}`,
    );
    console.log(`[FIND MATCHES WITH FILTERS FLOW] Message: ${messageText}`);

    const user = await UserService.getUserByPhone(userPhone);
    if (!user) {
      console.log(
        `[FIND MATCHES WITH FILTERS FLOW] ❌ User not found for phone: ${userPhone}`,
      );
      await WhatsAppService.sendTextMessage(
        userPhone,
        "Error: User not found. Please contact support.",
      );
      return;
    }

    console.log(
      `[FIND MATCHES WITH FILTERS FLOW] User found - ID: ${user.id}, isAdmin: ${user.isAdmin}`,
    );

    try {
      await WhatsAppService.sendTextMessage(
        userPhone,
        "🔍 Analyzing your filter requirements...",
      );

      const prompt = buildFilterExtractionPrompt(messageText);
      const result = await filterExtractionAgent.generate({ prompt });

      console.log(
        `[FIND MATCHES WITH FILTERS FLOW] Extracted filters:`,
        JSON.stringify(result.output, null, 2),
      );

      const filters: AdHocFilters = {};
      if (result.output.ageMin !== null && result.output.ageMin !== undefined)
        filters.ageMin = result.output.ageMin;
      if (result.output.ageMax !== null && result.output.ageMax !== undefined)
        filters.ageMax = result.output.ageMax;
      if (
        result.output.heightMinCm !== null &&
        result.output.heightMinCm !== undefined
      )
        filters.heightMinCm = result.output.heightMinCm;
      if (
        result.output.heightMaxCm !== null &&
        result.output.heightMaxCm !== undefined
      )
        filters.heightMaxCm = result.output.heightMaxCm;
      if (
        result.output.educationLevel !== null &&
        result.output.educationLevel !== undefined
      )
        filters.educationLevel = result.output.educationLevel;
      if (
        result.output.occupation !== null &&
        result.output.occupation !== undefined
      )
        filters.occupation = result.output.occupation;
      if (result.output.city !== null && result.output.city !== undefined)
        filters.city = result.output.city;
      if (
        result.output.citizenship !== null &&
        result.output.citizenship !== undefined
      )
        filters.citizenship = result.output.citizenship;
      if (result.output.caste !== null && result.output.caste !== undefined)
        filters.caste = result.output.caste;
      if (result.output.diet !== null && result.output.diet !== undefined)
        filters.diet = result.output.diet;

      if (Object.keys(filters).length === 0) {
        await WhatsAppService.sendTextMessage(
          userPhone,
          "😕 I couldn't extract any specific filters from your message.\n\nPlease try again with specific requirements like:\n- 'Find matches age 25 to 30'\n- 'Show profiles height 5'5 and engineer'\n- 'Find age 28 to 35 from Mumbai'",
        );
        return;
      }

      let filterSummary = "🎯 *Applied Filters:*\n";
      if (filters.ageMin || filters.ageMax) {
        filterSummary += `   Age: ${filters.ageMin || "any"} - ${filters.ageMax || "any"} years\n`;
      }
      if (filters.heightMinCm || filters.heightMaxCm) {
        const minHeight = filters.heightMinCm
          ? `${Math.floor(filters.heightMinCm / 30.48)}'${Math.round((filters.heightMinCm % 30.48) / 2.54)}"`
          : "any";
        const maxHeight = filters.heightMaxCm
          ? `${Math.floor(filters.heightMaxCm / 30.48)}'${Math.round((filters.heightMaxCm % 30.48) / 2.54)}"`
          : "any";
        filterSummary += `   Height: ${minHeight} - ${maxHeight}\n`;
      }
      if (filters.educationLevel)
        filterSummary += `   Education Level: ${filters.educationLevel}+\n`;
      if (filters.occupation)
        filterSummary += `   Occupation: ${filters.occupation}\n`;
      if (filters.city) filterSummary += `   City: ${filters.city}\n`;
      if (filters.citizenship)
        filterSummary += `   Citizenship: ${filters.citizenship}\n`;
      if (filters.caste) filterSummary += `   Caste: ${filters.caste}\n`;
      if (filters.diet) filterSummary += `   Diet: ${filters.diet}\n`;

      await WhatsAppService.sendTextMessage(userPhone, filterSummary);
      await WhatsAppService.sendTextMessage(
        userPhone,
        "🔍 Searching for matches with these filters...",
      );

      console.log(
        `[FIND MATCHES WITH FILTERS FLOW] Calling MatchService.findMatchesWithAdHocFilters for userId: ${user.id}`,
      );
      const matches = await MatchService.findMatchesWithAdHocFilters(
        user.id,
        filters,
        3,
      );
      console.log(
        `[FIND MATCHES WITH FILTERS FLOW] Received ${matches.length} matches from service`,
      );

      if (matches.length === 0) {
        console.log(
          `[FIND MATCHES WITH FILTERS FLOW] No matches found - sending empty message`,
        );
        await WhatsAppService.sendTextMessage(
          userPhone,
          "😕 No matches found with these filters.\n\nTry adjusting your filters or use 'find matches' to see matches based on your saved preferences.",
        );
        return;
      }

      console.log(
        `[FIND MATCHES WITH FILTERS FLOW] Sending ${matches.length} matches to user`,
      );
      await this.sendMatches(userPhone, matches);

      await WhatsAppService.sendTextMessage(
        userPhone,
        "✅ That's all the matches we found with your filters!\n\nThese filters were not saved. To save your preferences, use 'set preferences' command.",
      );

      console.log(
        `[FIND MATCHES WITH FILTERS FLOW] ✅ Flow completed successfully`,
      );
    } catch (error) {
      console.error(
        "[FIND MATCHES WITH FILTERS FLOW] ❌ Error finding matches:",
        error,
      );
      await WhatsAppService.sendTextMessage(
        userPhone,
        "Sorry, there was an error finding matches with your filters. Please try again later.",
      );
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
