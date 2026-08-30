import { z } from "zod/v4";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  PORT: z.coerce.number().default(3000),
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  JWT_SECRET: z.string().min(32, "JWT_SECRET must be at least 32 characters"),
  JWT_EXPIRES_IN: z.string().regex(/^\d+[smhd]$/, "JWT_EXPIRES_IN must look like 30m, 8h, or 7d").default("8h"),
  LLM_PROVIDER: z.enum(["gemini", "anthropic"]).default("gemini"),
  LLM_API_KEY: z.string().min(1, "LLM_API_KEY is required"),
  LLM_MODEL: z.string().default("gemini-2.5-flash"),
  // Transactional email uses HTTPS APIs because Render blocks outbound SMTP ports.
  EMAIL_PROVIDER: z.enum(["brevo", "microsoft_graph"]).default("brevo"),
  BREVO_API_KEY: z.string().default(""),
  BREVO_FROM_EMAIL: z.string().default(""),
  MICROSOFT_CLIENT_ID: z.string().default(""),
  MICROSOFT_CLIENT_SECRET: z.string().default(""),
  MICROSOFT_REFRESH_TOKEN: z.string().default(""),
  MICROSOFT_FROM_EMAIL: z.string().default(""),
  FRONTEND_URL: z.string().default("http://localhost:5173"),
  ADMIN_BOOTSTRAP_EMAILS: z.string().default(""),
  CORS_ORIGIN: z.string().optional(),
  LOG_LEVEL: z.enum(["debug", "info", "warn", "error"]).default("info"),
  // Polite-pool contact email for Crossref/OpenAlex/Unpaywall — required by Unpaywall, recommended
  // by the others for faster/unthrottled responses. Use a project mailbox, not a personal one.
  SCHOLAR_CONTACT_EMAIL: z.string().min(1, "SCHOLAR_CONTACT_EMAIL is required"),
  // Optional — raises Semantic Scholar's rate limit. Leave unset to use the unauthenticated tier.
  SEMANTIC_SCHOLAR_API_KEY: z.string().optional(),
}).superRefine((value, ctx) => {
  const required = value.EMAIL_PROVIDER === "brevo"
    ? (["BREVO_API_KEY", "BREVO_FROM_EMAIL"] as const)
    : (["MICROSOFT_CLIENT_ID", "MICROSOFT_CLIENT_SECRET", "MICROSOFT_REFRESH_TOKEN", "MICROSOFT_FROM_EMAIL"] as const);

  for (const key of required) {
    if (!value[key].trim()) {
      ctx.addIssue({ code: "custom", path: [key], message: `${key} is required for ${value.EMAIL_PROVIDER}` });
    }
  }
  if (value.EMAIL_PROVIDER === "microsoft_graph" && value.MICROSOFT_FROM_EMAIL) {
    const emailResult = z.string().email().safeParse(value.MICROSOFT_FROM_EMAIL);
    if (!emailResult.success) {
      ctx.addIssue({ code: "custom", path: ["MICROSOFT_FROM_EMAIL"], message: "MICROSOFT_FROM_EMAIL must be a valid email address" });
    }
  }
});

function loadEnv() {
  const result = envSchema.safeParse(process.env);
  if (!result.success) {
    const issues = result.error.issues.map((i) => `  - ${i.path.join(".")}: ${i.message}`).join("\n");
    throw new Error(`Invalid environment configuration:\n${issues}`);
  }
  return result.data;
}

export const env = loadEnv();
