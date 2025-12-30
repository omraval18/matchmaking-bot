import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

export const env = createEnv({
  server: {
    DATABASE_URL: z.url(),
    WA_PHONE_NUMBER_ID: z.string().min(1),
    WA_ACCESS_TOKEN: z.string().min(1),
    WA_VERIFY_TOKEN: z.string().min(1),
    WA_BUSINESS_ACCOUNT_ID: z.string().min(1),
    OPENROUTER_API_KEY: z.string().min(1),
    NODE_ENV: z.string().default("development"),
  },

  /**
   * The prefix that client-side variables must have. This is enforced both at
   * a type-level and at runtime.
   */
  clientPrefix: "PUBLIC_",

  client: {},

  /**
   * What object holds the environment variables at runtime. This is usually
   * `process.env` or `import.meta.env`.
   */

  runtimeEnvStrict: {
    DATABASE_URL: process.env.DATABASE_URL,
    WA_PHONE_NUMBER_ID: process.env.WA_PHONE_NUMBER_ID,
    WA_ACCESS_TOKEN: process.env.WA_ACCESS_TOKEN,
    WA_VERIFY_TOKEN: process.env.WA_VERIFY_TOKEN,
    WA_BUSINESS_ACCOUNT_ID: process.env.WA_BUSINESS_ACCOUNT_ID,
    OPENROUTER_API_KEY: process.env.OPENROUTER_API_KEY,
    NODE_ENV: process.env.NODE_ENV,
  },

  /**
   * By default, this library will feed the environment variables directly to
   * the Zod validator.
   *
   * This means that if you have an empty string for a value that is supposed
   * to be a number (e.g. `PORT=` in a ".env" file), Zod will incorrectly flag
   * it as a type mismatch violation. Additionally, if you have an empty string
   * for a value that is supposed to be a string with a default value (e.g.
   * `DOMAIN=` in an ".env" file), the default value will never be applied.
   *
   * In order to solve these issues, we recommend that all new projects
   * explicitly specify this option as true.
   */
  emptyStringAsUndefined: true,
});
