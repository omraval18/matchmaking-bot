import { db } from "../lib/db/index.js";
import { bios } from "../lib/db/schema.js";
import { eq } from "drizzle-orm";
import { biodataExtractionAgent, normalizeBiodata } from "../ai/bio-data-extraction-agent.js";
import { BIODATA_EXTRACTION_PROMPT } from "../ai/prompts/extraction-prompt.js";
import type { BiodataExtraction } from "../types/biodata.types.js";

export class BiodataService {
  static async extractFromPdf(pdfBuffer: Buffer): Promise<BiodataExtraction> {
    const base64 = pdfBuffer.toString("base64");

    const result = await biodataExtractionAgent.generate({
      messages: [
        {
          role: "system",
          content: BIODATA_EXTRACTION_PROMPT,
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Extract biodata information from this PDF document according to the schema.",
            },
            {
              type: "file",
              data: base64,
              mediaType: "application/pdf",
            },
          ],
        },
      ],
    });

    return result.output as BiodataExtraction;
  }

  static async biodataExists(userId: number): Promise<boolean> {
    const results = await db
      .select()
      .from(bios)
      .where(eq(bios.userId, userId))
      .limit(1);

    return results.length > 0;
  }

  static async createBiodata(
    userId: number,
    data: BiodataExtraction,
  ): Promise<void> {
    const normalized = normalizeBiodata(data);

    await db.insert(bios).values({
      userId,
      firstName: normalized.firstName,
      lastName: normalized.lastName,
      gender: normalized.gender,
      age: normalized.age,
      dateOfBirth: normalized.dateOfBirth,
      city: normalized.city,
      caste: normalized.caste,
      currentCity: normalized.currentCity,
      citizenship: normalized.citizenship,
      education: normalized.education,
      educationLevel: normalized.educationLevel,
      occupation: normalized.occupation,
      company: normalized.company,
      height: normalized.height,
      heightCm: normalized.heightCm,
      diet: normalized.diet,
      extra: normalized.extra || {},
      url: "",
    });
  }

  static async updateBiodata(
    userId: number,
    data: BiodataExtraction,
  ): Promise<void> {
    const normalized = normalizeBiodata(data);

    await db
      .update(bios)
      .set({
        firstName: normalized.firstName,
        lastName: normalized.lastName,
        gender: normalized.gender,
        age: normalized.age,
        dateOfBirth: normalized.dateOfBirth,
        city: normalized.city,
        caste: normalized.caste,
        currentCity: normalized.currentCity,
        citizenship: normalized.citizenship,
        education: normalized.education,
        educationLevel: normalized.educationLevel,
        occupation: normalized.occupation,
        company: normalized.company,
        height: normalized.height,
        heightCm: normalized.heightCm,
        diet: normalized.diet,
        extra: normalized.extra || {},
        url: "",
      })
      .where(eq(bios.userId, userId));
  }
}
