import { db } from "../lib/db/index.js";
import { preferences } from "../lib/db/schema.js";
import { eq } from "drizzle-orm";
import { preferenceExtractionAgent, normalizePreferences } from "../ai/preference-extraction-agent.js";
import { PREFERENCE_EXTRACTION_PROMPT } from "../ai/prompts/preference-extraction-prompt.js";
import type { PreferenceExtraction } from "../types/preference.types.js";

export class PreferenceService {
  static async extractFromText(text: string): Promise<PreferenceExtraction> {
    const result = await preferenceExtractionAgent.generate({
      messages: [
        {
          role: "system",
          content: PREFERENCE_EXTRACTION_PROMPT,
        },
        {
          role: "user",
          content: text,
        },
      ],
    });

    const extracted = result.output as any;
    return normalizePreferences(extracted);
  }

  static async getPreferences(userId: number) {
    const results = await db
      .select()
      .from(preferences)
      .where(eq(preferences.userId, userId))
      .limit(1);

    return results.length > 0 ? results[0] : null;
  }

  static async savePreferences(
    userId: number,
    prefs: PreferenceExtraction,
  ): Promise<void> {
    const existing = await this.getPreferences(userId);

    if (existing) {
      await db
        .update(preferences)
        .set({
          ageMin: prefs.ageMin,
          ageMax: prefs.ageMax,
          heightMinCm: prefs.heightMinCm,
          heightMaxCm: prefs.heightMaxCm,
          educationLevel: prefs.educationLevel,
          occupation: prefs.occupation,
          city: prefs.city,
          citizenship: prefs.citizenship,
          caste: prefs.caste,
          diet: prefs.diet,
          otherPreferences: prefs.otherPreferences || {},
          updatedAt: new Date(),
        })
        .where(eq(preferences.userId, userId));
    } else {
      await db.insert(preferences).values({
        userId,
        ageMin: prefs.ageMin,
        ageMax: prefs.ageMax,
        heightMinCm: prefs.heightMinCm,
        heightMaxCm: prefs.heightMaxCm,
        educationLevel: prefs.educationLevel,
        occupation: prefs.occupation,
        city: prefs.city,
        citizenship: prefs.citizenship,
        caste: prefs.caste,
        diet: prefs.diet,
        otherPreferences: prefs.otherPreferences || {},
      });
    }
  }
}
