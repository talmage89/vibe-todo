import z from "zod";

const oauthCallbackQuerySchema = z.object({
  code: z.string().optional(),
  state: z.string().optional(),
  error: z.string().optional(),
  error_description: z.string().optional(),
});

export type OAuthCallbackQuery = z.infer<typeof oauthCallbackQuerySchema>;

export const parseOAuthCallbackQuery = (query: unknown) => {
  const parsed = oauthCallbackQuerySchema.safeParse(query);
  if (!parsed.success) {
    return {
      ok: false as const,
      status: 400 as const,
      body: { error: "Authorization failed", details: parsed.error.message },
    };
  }

  const data = parsed.data;
  if (data.error) {
    return {
      ok: false as const,
      status: 400 as const,
      body: { error: "Authorization failed", details: data.error_description ?? data.error },
    };
  }

  if (!data.code || !data.state) {
    return {
      ok: false as const,
      status: 400 as const,
      body: { error: "Authorization failed", details: "Missing code or state" },
    };
  }

  return { ok: true as const, code: data.code, state: data.state };
};
