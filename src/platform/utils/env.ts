import { z } from "zod";

const envSchema = z.object({
  PORT: z.string().transform(Number),
  DB_URL: z.string(),

  // OAuth Configuration
  GOOGLE_CLIENT_ID: z.string(),
  GOOGLE_CLIENT_SECRET: z.string(),
  GOOGLE_REDIRECT_URI: z.string().url(),

  GITHUB_CLIENT_ID: z.string(),
  GITHUB_CLIENT_SECRET: z.string(),
  GITHUB_REDIRECT_URI: z.string().url(),

  // Session Configuration
  SESSION_SECRET: z.string().min(32),
});

export type Env = z.infer<typeof envSchema>;

export const env = (): Env => {
  return envSchema.parse(process.env);
};
