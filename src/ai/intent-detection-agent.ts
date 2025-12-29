import { ToolLoopAgent, Output, stepCountIs } from "ai";
import { openrouter } from "./provider.js";
import { IntentDetectionSchema } from "../types/intent.types.js";

export const intentDetectionAgent = new ToolLoopAgent({
  model: openrouter("openai/gpt-5-nano"),
  output: Output.object({
    schema: IntentDetectionSchema,
  }),
  stopWhen: stepCountIs(3),
});
