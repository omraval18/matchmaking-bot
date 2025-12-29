import { z } from "zod";
import { ToolLoopAgent, Output, stepCountIs } from "ai";
import { openrouter } from "./provider.js";
import { parseHeightToCm } from "../utils/height.utils.js";

export const BiodataSchema = z.object({
  firstName: z
    .string()
    .min(1)
    .describe("Person's first name as written in the biodata"),

  lastName: z.string().min(1).describe("Person's last name or surname"),

  gender: z
    .enum(["Male", "Female", "Other"])
    .describe("Person's gender as mentioned in the biodata"),

  age: z.number().int().positive().describe("Person's age in completed years"),

  dateOfBirth: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "YYYY-MM-DD")
    .describe("Date of birth in YYYY-MM-DD format"),

  city: z.string().min(1).describe("Native city or hometown"),

  caste: z
    .string()
    .min(1)
    .describe("Caste or community mentioned in the biodata"),

  currentCity: z
    .string()
    .nullable()
    .describe("Current city of residence, if different from native city"),

  citizenship: z.string().min(1).describe("Nationality or citizenship status"),

  education: z.string().min(1).describe("Highest educational qualification (original text as mentioned in biodata)"),

  educationLevel: z
    .number()
    .int()
    .min(1)
    .max(8)
    .describe(
      "Education level as integer: 1=Below 10th, 2=10th Pass, 3=12th Pass, 4=Diploma, 5=Undergraduate (pursuing), 6=Graduate (Bachelor's like BA, BSc, BTech, BBA, BCA, MBBS, etc.), 7=Postgraduate (Master's like MA, MSc, MTech, MBA, MCA, MD, MS, etc.), 8=Doctorate (PhD). Assign based on the highest qualification mentioned."
    ),

  occupation: z.string().min(1).describe("Current occupation or profession"),

  company: z
    .string()
    .nullable()
    .describe("Current employer or company name, if mentioned"),

  height: z
    .string()
    .min(1)
    .describe("Height as mentioned in the biodata (e.g., 5'8\" or 173 cm)"),

  diet: z
    .enum([
      "Vegetarian",
      "Non-Vegetarian",
      "Jain",
    ]).nullable()
    .describe(
      "Dietary preference such as Vegetarian, Non-Vegetarian, Jain, etc.",
    ),

  extra: z
    .object({})
    .catchall(z.any())
    .describe(
      "Any additional information present in the biodata not covered by other fields, such as marital status, salary, horoscope, hobbies, languages, family details, etc.",
    ),
});

export const biodataExtractionAgent = new ToolLoopAgent({
  model: openrouter("openai/gpt-5-nano"),
  output: Output.object({
    schema: BiodataSchema,
  }),
  stopWhen: stepCountIs(10),
});

export function normalizeBiodata(biodata: z.infer<typeof BiodataSchema>) {
  const heightCm = parseHeightToCm(biodata.height);
  if (!heightCm) {
    throw new Error(`Invalid height format: ${biodata.height}`);
  }

  return {
    ...biodata,
    heightCm,
  };
}
