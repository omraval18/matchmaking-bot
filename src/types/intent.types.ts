import { z } from "zod";

export enum GlobalEvent {
  END_FLOW = "END_FLOW",
  HELP = "HELP",
  GREETING = "GREETING",
}

export enum FlowEvent {
  SET_PREFERENCES = "SET_PREFERENCES",
  FIND_MATCHES = "FIND_MATCHES",
  FIND_MATCHES_WITH_FILTERS = "FIND_MATCHES_WITH_FILTERS",
  VIEW_BIO = "VIEW_BIO",
  DELETE_ACCOUNT = "DELETE_ACCOUNT",

  CREATE_USER = "CREATE_USER",
  UPDATE_BIO = "UPDATE_BIO",
  REMOVE_USER = "REMOVE_USER",
}

export type IntentEvent = GlobalEvent | FlowEvent;

export interface DetectedIntent {
  event: IntentEvent | "UNKNOWN";
  confidence: number; 
  reasoning: string; 
}

export const IntentDetectionSchema = z.object({
  event: z
    .enum([
      GlobalEvent.END_FLOW,
      GlobalEvent.HELP,
      GlobalEvent.GREETING,

      FlowEvent.SET_PREFERENCES,
      FlowEvent.FIND_MATCHES,
      FlowEvent.FIND_MATCHES_WITH_FILTERS,
      FlowEvent.VIEW_BIO,
      FlowEvent.DELETE_ACCOUNT,

      FlowEvent.CREATE_USER,
      FlowEvent.UPDATE_BIO,
      FlowEvent.REMOVE_USER,

      "UNKNOWN",
    ])
    .describe("The detected intent event from the user's message"),

  confidence: z
    .number()
    .min(0)
    .max(1)
    .describe(
      "Confidence score between 0 and 1. Use values below 0.6 for ambiguous or unclear intents.",
    ),

  reasoning: z
    .string()
    .describe(
      "Brief explanation of why this intent was chosen (1-2 sentences)",
    ),
});

export type IntentDetectionOutput = z.infer<typeof IntentDetectionSchema>;
