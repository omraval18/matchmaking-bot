import { z } from "zod";

export interface AdHocFilters {
  ageMin?: number;
  ageMax?: number;
  heightMinCm?: number;
  heightMaxCm?: number;
  educationLevel?: number;
  occupation?: string;
  city?: string;
  citizenship?: string;
  caste?: string;
  diet?: string;
}

export const AdHocFiltersSchema = z.object({
  ageMin: z
    .number()
    .nullable()
    .describe("Minimum age filter extracted from the message"),
  ageMax: z
    .number()
    .nullable()
    .describe("Maximum age filter extracted from the message"),
  heightMinCm: z
    .number()
    .nullable()
    .describe("Minimum height in centimeters extracted from the message"),
  heightMaxCm: z
    .number()
    .nullable()
    .describe("Maximum height in centimeters extracted from the message"),
  educationLevel: z
    .number()
    .nullable()
    .describe("Education level filter extracted from the message"),
  occupation: z
    .string()
    .nullable()
    .describe("Occupation filter extracted from the message"),
  city: z
    .string()
    .nullable()
    .describe("City/location filter extracted from the message"),
  citizenship: z
    .string()
    .nullable()
    .describe("Citizenship filter extracted from the message"),
  caste: z
    .string()
    .nullable()
    .describe("Caste filter extracted from the message"),
  diet: z
    .string()
    .nullable()
    .describe("Diet preference filter extracted from the message"),
});

export type AdHocFiltersOutput = z.infer<typeof AdHocFiltersSchema>;
