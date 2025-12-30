import { db } from "../lib/db/index.js";
import { bios, users, preferences } from "../lib/db/schema.js";
import { eq, and, gte, lte, sql, ne } from "drizzle-orm";
import type { AdHocFilters } from "../types/filter.types.js";

export class MatchService {
  static async findMatches(userId: number, limit: number = 3, offset: number = 0): Promise<any[]> {
    console.log(`[MATCH SERVICE] Finding matches for userId: ${userId}, limit: ${limit}, offset: ${offset}`);
    
    const userBio = await db
      .select()
      .from(bios)
      .where(eq(bios.userId, userId))
      .limit(1);

    console.log(`[MATCH SERVICE] User bio found:`, userBio.length > 0 ? `Yes, gender: ${userBio[0].gender}` : 'No');

    if (userBio.length === 0) {
      console.log(`[MATCH SERVICE] ❌ No bio found for userId: ${userId}`);
      return [];
    }

    const userGender = userBio[0].gender;
    const oppositeGender = userGender === "Male" ? "Female" : "Male";
    console.log(`[MATCH SERVICE] Looking for opposite gender: ${oppositeGender}`);

    const userPrefs = await db
      .select()
      .from(preferences)
      .where(eq(preferences.userId, userId))
      .limit(1);

    console.log(`[MATCH SERVICE] Preferences found:`, userPrefs.length > 0 ? 'Yes' : 'No');
    if (userPrefs.length > 0) {
      console.log(`[MATCH SERVICE] Preferences:`, JSON.stringify(userPrefs[0], null, 2));
    }

    const conditions = [
      eq(bios.gender, oppositeGender),
      ne(bios.userId, userId),
    ];

    console.log(`[MATCH SERVICE] Base conditions: gender=${oppositeGender}, userId!=${userId}`);

    if (userPrefs.length > 0) {
      const prefs = userPrefs[0];
      let activeFilters = [];

      if (prefs.ageMin) {
        conditions.push(gte(bios.age, prefs.ageMin));
        activeFilters.push(`ageMin: ${prefs.ageMin}`);
      }

      if (prefs.ageMax) {
        conditions.push(lte(bios.age, prefs.ageMax));
        activeFilters.push(`ageMax: ${prefs.ageMax}`);
      }

      if (prefs.heightMinCm) {
        conditions.push(gte(bios.heightCm, prefs.heightMinCm));
        activeFilters.push(`heightMinCm: ${prefs.heightMinCm}`);
      }

      if (prefs.heightMaxCm) {
        conditions.push(lte(bios.heightCm, prefs.heightMaxCm));
        activeFilters.push(`heightMaxCm: ${prefs.heightMaxCm}`);
      }

      if (prefs.educationLevel) {
        conditions.push(gte(bios.educationLevel, prefs.educationLevel));
        activeFilters.push(`educationLevel: ${prefs.educationLevel}`);
      }

      if (prefs.occupation) {
        conditions.push(
          sql`LOWER(${bios.occupation}) LIKE LOWER(${"%" + prefs.occupation + "%"})`,
        );
        activeFilters.push(`occupation: ${prefs.occupation}`);
      }

      if (prefs.city) {
        conditions.push(
          sql`(LOWER(${bios.city}) LIKE LOWER(${"%" + prefs.city + "%"}) OR LOWER(${bios.currentCity}) LIKE LOWER(${"%" + prefs.city + "%"}))`,
        );
        activeFilters.push(`city: ${prefs.city}`);
      }

      if (prefs.citizenship) {
        conditions.push(
          sql`LOWER(${bios.citizenship}) LIKE LOWER(${"%" + prefs.citizenship + "%"})`,
        );
        activeFilters.push(`citizenship: ${prefs.citizenship}`);
      }

      if (prefs.caste) {
        conditions.push(
          sql`LOWER(${bios.caste}) LIKE LOWER(${"%" + prefs.caste + "%"})`,
        );
        activeFilters.push(`caste: ${prefs.caste}`);
      }

      if (prefs.diet) {
        conditions.push(
          sql`LOWER(${bios.diet}) LIKE LOWER(${"%" + prefs.diet + "%"})`,
        );
        activeFilters.push(`diet: ${prefs.diet}`);
      }

      console.log(`[MATCH SERVICE] Active preference filters:`, activeFilters.length > 0 ? activeFilters.join(', ') : 'None (all null)');
    }

    console.log(`[MATCH SERVICE] Total conditions: ${conditions.length}`);
    console.log(`[MATCH SERVICE] Executing query with limit: ${limit}...`);

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

    console.log(`[MATCH SERVICE] ✅ Found ${matches.length} matches`);
    if (matches.length > 0) {
      console.log(`[MATCH SERVICE] Match IDs:`, matches.map(m => m.id).join(', '));
    }

    return matches;
  }

  static async findMatchesWithAdHocFilters(
    userId: number,
    filters: AdHocFilters,
    limit: number = 3,
    offset: number = 0
  ): Promise<any[]> {
    console.log(`[MATCH SERVICE - AD-HOC] Finding matches for userId: ${userId} with ad-hoc filters`);
    console.log(`[MATCH SERVICE - AD-HOC] Filters:`, JSON.stringify(filters, null, 2));

    const userBio = await db
      .select()
      .from(bios)
      .where(eq(bios.userId, userId))
      .limit(1);

    console.log(`[MATCH SERVICE - AD-HOC] User bio found:`, userBio.length > 0 ? `Yes, gender: ${userBio[0].gender}` : 'No');

    if (userBio.length === 0) {
      console.log(`[MATCH SERVICE - AD-HOC] ❌ No bio found for userId: ${userId}`);
      return [];
    }

    const userGender = userBio[0].gender;
    const oppositeGender = userGender === "Male" ? "Female" : "Male";
    console.log(`[MATCH SERVICE - AD-HOC] Looking for opposite gender: ${oppositeGender}`);

    const conditions = [
      eq(bios.gender, oppositeGender),
      ne(bios.userId, userId),
    ];

    console.log(`[MATCH SERVICE - AD-HOC] Base conditions: gender=${oppositeGender}, userId!=${userId}`);

    // Apply ad-hoc filters
    let activeFilters: string[] = [];

    if (filters.ageMin) {
      conditions.push(gte(bios.age, filters.ageMin));
      activeFilters.push(`ageMin: ${filters.ageMin}`);
    }

    if (filters.ageMax) {
      conditions.push(lte(bios.age, filters.ageMax));
      activeFilters.push(`ageMax: ${filters.ageMax}`);
    }

    if (filters.heightMinCm) {
      conditions.push(gte(bios.heightCm, filters.heightMinCm));
      activeFilters.push(`heightMinCm: ${filters.heightMinCm}`);
    }

    if (filters.heightMaxCm) {
      conditions.push(lte(bios.heightCm, filters.heightMaxCm));
      activeFilters.push(`heightMaxCm: ${filters.heightMaxCm}`);
    }

    if (filters.educationLevel) {
      conditions.push(gte(bios.educationLevel, filters.educationLevel));
      activeFilters.push(`educationLevel: ${filters.educationLevel}`);
    }

    if (filters.occupation) {
      conditions.push(
        sql`LOWER(${bios.occupation}) LIKE LOWER(${"%" + filters.occupation + "%"})`,
      );
      activeFilters.push(`occupation: ${filters.occupation}`);
    }

    if (filters.city) {
      conditions.push(
        sql`(LOWER(${bios.city}) LIKE LOWER(${"%" + filters.city + "%"}) OR LOWER(${bios.currentCity}) LIKE LOWER(${"%" + filters.city + "%"}))`,
      );
      activeFilters.push(`city: ${filters.city}`);
    }

    if (filters.citizenship) {
      conditions.push(
        sql`LOWER(${bios.citizenship}) LIKE LOWER(${"%" + filters.citizenship + "%"})`,
      );
      activeFilters.push(`citizenship: ${filters.citizenship}`);
    }

    if (filters.caste) {
      conditions.push(
        sql`LOWER(${bios.caste}) LIKE LOWER(${"%" + filters.caste + "%"})`,
      );
      activeFilters.push(`caste: ${filters.caste}`);
    }

    if (filters.diet) {
      conditions.push(
        sql`LOWER(${bios.diet}) LIKE LOWER(${"%" + filters.diet + "%"})`,
      );
      activeFilters.push(`diet: ${filters.diet}`);
    }

    console.log(`[MATCH SERVICE - AD-HOC] Active ad-hoc filters:`, activeFilters.length > 0 ? activeFilters.join(', ') : 'None');
    console.log(`[MATCH SERVICE - AD-HOC] Total conditions: ${conditions.length}`);
    console.log(`[MATCH SERVICE - AD-HOC] Executing query with limit: ${limit}...`);

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

    console.log(`[MATCH SERVICE - AD-HOC] ✅ Found ${matches.length} matches`);
    if (matches.length > 0) {
      console.log(`[MATCH SERVICE - AD-HOC] Match IDs:`, matches.map(m => m.id).join(', '));
    }

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
