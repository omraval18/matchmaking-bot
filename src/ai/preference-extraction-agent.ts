import { z } from "zod";
import { ToolLoopAgent, Output, stepCountIs } from "ai";
import { openrouter } from "./provider.js";

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

  education: z
    .string()
    .nullable()
    .describe(
      "Educational qualification preference (e.g., 'Graduate', 'Post Graduate', 'MBA'), if mentioned",
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
  model: openrouter("openai/gpt-4o-mini"),
  output: Output.object({
    schema: PreferenceSchema,
  }),
  stopWhen: stepCountIs(5),
});
