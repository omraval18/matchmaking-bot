import { z } from "zod";
import { ToolLoopAgent, Output, stepCountIs } from "ai";
import { openrouter } from "./provider.js";
import { parseHeightToCm } from "../utils/height.utils.js";

export const PreferenceSchema = z.object({
  ageMin: z
    .number()
    .int()
    .positive()
    .nullable()
    .describe("Minimum age preference, if mentioned"),

  ageMax: z
    .number()
    .int()
    .positive()
    .nullable()
    .describe("Maximum age preference, if mentioned"),

  heightMin: z
    .string()
    .nullable()
    .describe(
      "Minimum height preference (e.g., '5\\'4\"', '165 cm'), if mentioned",
    ),

  heightMax: z
    .string()
    .nullable()
    .describe(
      "Maximum height preference (e.g., '6\\'0\"', '180 cm'), if mentioned",
    ),

  educationLevel: z
    .number()
    .int()
    .min(1)
    .max(8)
    .nullable()
    .describe(
      "Minimum education level preference as integer: 1=Below 10th, 2=10th Pass, 3=12th Pass, 4=Diploma, 5=Undergraduate (pursuing), 6=Graduate (Bachelor's), 7=Postgraduate (Master's), 8=Doctorate (PhD). If user says 'at least graduate' or 'minimum graduate', use 6. If user says 'at least 12th pass', use 3. If not mentioned, use null."
    ),

  occupation: z
    .string()
    .nullable()
    .describe("Occupation or profession preference, if mentioned"),

  city: z
    .string()
    .nullable()
    .describe("City or location preference, if mentioned"),

  citizenship: z
    .string()
    .nullable()
    .describe("Nationality or citizenship preference, if mentioned"),

  caste: z
    .string()
    .nullable()
    .describe("Caste or community preference, if mentioned"),

  diet: z
    .string()
    .nullable()
    .describe(
      "Dietary preference (e.g., 'Vegetarian', 'Non-Vegetarian', 'Jain'), if mentioned",
    ),

  otherPreferences: z
    .object({})
    .catchall(z.any())
    .describe(
      "Any other preferences not covered by the above fields, such as salary expectations, hobbies, family background, etc.",
    ),
});

export const preferenceExtractionAgent = new ToolLoopAgent({
  model: openrouter("openai/gpt-5-nano"),
  output: Output.object({
    schema: PreferenceSchema,
  }),
  stopWhen: stepCountIs(5),
});

export function normalizePreferences(preferences: z.infer<typeof PreferenceSchema>) {
  const heightMinCm = preferences.heightMin ? parseHeightToCm(preferences.heightMin) : null;
  const heightMaxCm = preferences.heightMax ? parseHeightToCm(preferences.heightMax) : null;

  const educationLevelNames: Record<number, string> = {
    1: 'Below 10th',
    2: '10th Pass',
    3: '12th Pass',
    4: 'Diploma',
    5: 'Undergraduate',
    6: 'Graduate',
    7: 'Postgraduate',
    8: 'Doctorate',
  };
  const education = preferences.educationLevel
    ? educationLevelNames[preferences.educationLevel] || null
    : null;

  return {
    ageMin: preferences.ageMin,
    ageMax: preferences.ageMax,
    heightMin: preferences.heightMin, 
    heightMax: preferences.heightMax, 
    heightMinCm,
    heightMaxCm,
    education, 
    educationLevel: preferences.educationLevel, 
    occupation: preferences.occupation,
    city: preferences.city,
    citizenship: preferences.citizenship,
    caste: preferences.caste,
    diet: preferences.diet,
    otherPreferences: preferences.otherPreferences,
  };
}
