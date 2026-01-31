import { z } from "zod";

const envSchema = z.object({
  PORT: z.string().transform(Number),
  DB_URL: z.string(),
});

export type Env = z.infer<typeof envSchema>;

export const env = (): Env => {
  return envSchema.parse(process.env);
};
