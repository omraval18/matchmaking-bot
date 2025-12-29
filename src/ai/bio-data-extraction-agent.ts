import { z } from "zod";
import { ToolLoopAgent, Output, stepCountIs } from "ai";
import { openrouter } from "./provider.js";

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

  education: z.string().min(1).describe("Highest educational qualification"),

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
    .string()
    .nullable()
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
  model: openrouter("openai/gpt-5-mini"),
  output: Output.object({
    schema: BiodataSchema,
  }),
  stopWhen: stepCountIs(10),
});

// biodataExtractionAgent.generate({
//   prompt:"",
//   messages: [
//     {
//       role: "user",
//       content: [
//         {
//           type: "text",
//           text: "What is an embedding model according to this document?",
//         },
//         {
//           type: "file",
//           data: base64,
//           mediaType: "application/pdf",
//         },
//       ],
//     },
//   ],
// });
