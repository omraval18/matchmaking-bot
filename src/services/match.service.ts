import { db } from "../lib/db/index.js";
import { bios, users, preferences } from "../lib/db/schema.js";
import { eq, and, gte, lte, sql, ne, type SQL } from "drizzle-orm";
import type { UserPreferences } from "../types/preference.types.js";

export interface FindMatchesOptions {
  filters?: UserPreferences;
  limit?: number;
  offset?: number;
}

export class MatchService {
  private static applyFilters(
    conditions: SQL[],
    filters: UserPreferences,
  ): void {
    if (filters.ageMin) {
      conditions.push(gte(bios.age, filters.ageMin));
    }

    if (filters.ageMax) {
      conditions.push(lte(bios.age, filters.ageMax));
    }

    if (filters.heightMinCm) {
      conditions.push(gte(bios.heightCm, filters.heightMinCm));
    }

    if (filters.heightMaxCm) {
      conditions.push(lte(bios.heightCm, filters.heightMaxCm));
    }

    if (filters.educationLevel) {
      conditions.push(gte(bios.educationLevel, filters.educationLevel));
    }

    if (filters.occupation) {
      conditions.push(
        sql`LOWER(${bios.occupation}) LIKE LOWER(${"%" + filters.occupation + "%"})`,
      );
    }

    if (filters.city) {
      conditions.push(
        sql`(LOWER(${bios.city}) LIKE LOWER(${"%" + filters.city + "%"}) OR LOWER(${bios.currentCity}) LIKE LOWER(${"%" + filters.city + "%"}))`,
      );
    }

    if (filters.citizenship) {
      conditions.push(
        sql`LOWER(${bios.citizenship}) LIKE LOWER(${"%" + filters.citizenship + "%"})`,
      );
    }

    if (filters.caste) {
      conditions.push(
        sql`LOWER(${bios.caste}) LIKE LOWER(${"%" + filters.caste + "%"})`,
      );
    }

    if (filters.diet) {
      conditions.push(
        sql`LOWER(${bios.diet}) LIKE LOWER(${"%" + filters.diet + "%"})`,
      );
    }
  }

  static async findMatches(
    userId: number,
    options: FindMatchesOptions = {},
  ): Promise<any[]> {
    const { filters: adHocFilters, limit = 3, offset = 0 } = options;
    const isAdHoc = !!adHocFilters;

    const [userBioResult, userPrefsResult] = await Promise.all([
      db.select().from(bios).where(eq(bios.userId, userId)).limit(1),
      isAdHoc
        ? Promise.resolve([])
        : db
            .select()
            .from(preferences)
            .where(eq(preferences.userId, userId))
            .limit(1),
    ]);

    if (userBioResult.length === 0) {
      return [];
    }

    const userGender = userBioResult[0].gender;
    const oppositeGender = userGender === "Male" ? "Female" : "Male";

    let filters: UserPreferences;

    if (adHocFilters) {
      filters = adHocFilters;
    } else if (userPrefsResult.length > 0) {
      const prefs = userPrefsResult[0];
      filters = {
        ageMin: prefs.ageMin ?? undefined,
        ageMax: prefs.ageMax ?? undefined,
        heightMinCm: prefs.heightMinCm ?? undefined,
        heightMaxCm: prefs.heightMaxCm ?? undefined,
        educationLevel: prefs.educationLevel ?? undefined,
        occupation: prefs.occupation ?? undefined,
        city: prefs.city ?? undefined,
        citizenship: prefs.citizenship ?? undefined,
        caste: prefs.caste ?? undefined,
        diet: prefs.diet ?? undefined,
      };
    } else {
      filters = {};
    }

    const conditions: SQL[] = [
      eq(bios.gender, oppositeGender),
      ne(bios.userId, userId),
    ];

    this.applyFilters(conditions, filters);

    const matches = await db
      .select({
        id: bios.id,
        firstName: bios.firstName,
        lastName: bios.lastName,
        gender: bios.gender,
        age: bios.age,
        city: bios.city,
        currentCity: bios.currentCity,
        citizenship: bios.citizenship,
        education: bios.education,
        occupation: bios.occupation,
        company: bios.company,
        height: bios.height,
        diet: bios.diet,
        caste: bios.caste,
        phone: users.phone,
      })
      .from(bios)
      .innerJoin(users, eq(bios.userId, users.id))
      .where(and(...conditions))
      .offset(offset)
      .limit(limit);

    return matches;
  }

  static formatMatchResult(match: any): string {
    let result = `👤 ${match.firstName} ${match.lastName}\n\n`;
    result += `📊 Basic Info:\n`;
    result += `   Age: ${match.age} years\n`;
    result += `   Gender: ${match.gender}\n`;
    result += `   Height: ${match.height}\n`;
    if (match.diet) {
      result += `   Diet: ${match.diet}\n`;
    }
    result += `\n`;

    result += `📍 Location:\n`;
    result += `   Native: ${match.city}\n`;
    if (match.currentCity) {
      result += `   Current: ${match.currentCity}\n`;
    }
    result += `   Citizenship: ${match.citizenship}\n`;
    result += `\n`;

    result += `🎓 Professional:\n`;
    result += `   Education: ${match.education}\n`;
    result += `   Occupation: ${match.occupation}\n`;
    if (match.company) {
      result += `   Company: ${match.company}\n`;
    }
    result += `\n`;

    result += `🏛️ Community:\n`;
    result += `   Caste: ${match.caste}\n`;
    result += `\n`;

    result += `📞 Contact: ${match.phone}\n`;
    result += `\n${"-".repeat(40)}\n`;

    return result;
  }
}
