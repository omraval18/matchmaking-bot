import { db } from "../lib/db/index.js";
import { bios } from "../lib/db/schema.js";
import { eq } from "drizzle-orm";
import { biodataExtractionAgent } from "../ai/bio-data-extraction-agent.js";
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
    await db.insert(bios).values({
      userId,
      firstName: data.firstName,
      lastName: data.lastName,
      gender: data.gender,
      age: data.age,
      dateOfBirth: data.dateOfBirth,
      city: data.city,
      caste: data.caste,
      currentCity: data.currentCity,
      citizenship: data.citizenship,
      education: data.education,
      occupation: data.occupation,
      company: data.company,
      height: data.height,
      diet: data.diet,
      extra: data.extra || {},
      url: "",
    });
  }

  static async updateBiodata(
    userId: number,
    data: BiodataExtraction,
  ): Promise<void> {
    await db
      .update(bios)
      .set({
        firstName: data.firstName,
        lastName: data.lastName,
        gender: data.gender,
        age: data.age,
        dateOfBirth: data.dateOfBirth,
        city: data.city,
        caste: data.caste,
        currentCity: data.currentCity,
        citizenship: data.citizenship,
        education: data.education,
        occupation: data.occupation,
        company: data.company,
        height: data.height,
        diet: data.diet,
        extra: data.extra || {},
        url: "",
      })
      .where(eq(bios.userId, userId));
  }
}
