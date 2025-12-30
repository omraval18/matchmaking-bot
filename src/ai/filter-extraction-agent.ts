import { ToolLoopAgent, Output, stepCountIs } from "ai";
import { openrouter } from "./provider.js";
import { AdHocFiltersSchema } from "../types/filter.types.js";

export const filterExtractionAgent = new ToolLoopAgent({
  model: openrouter("openai/gpt-5-nano"),
  output: Output.object({
    schema: AdHocFiltersSchema,
  }),
  stopWhen: stepCountIs(3),
});
