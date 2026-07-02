import { z } from "zod/v4";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  PORT: z.coerce.number().default(3000),
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  JWT_SECRET: z.string().min(32, "JWT_SECRET must be at least 32 characters"),
  LLM_PROVIDER: z.enum(["gemini", "anthropic"]).default("gemini"),
  LLM_API_KEY: z.string().min(1, "LLM_API_KEY is required"),
  LLM_MODEL: z.string().default("gemini-2.5-flash"),
  // SMTP (registration / password-reset emails) — now Outlook/Microsoft 365 instead of 163.com
  // (which kept failing from Render) or Resend (whose shared test domain can't send to real users
  // without a verified custom domain).
  SMTP_HOST: z.string().min(1, "SMTP_HOST is required"),
  SMTP_PORT: z.coerce.number().default(587),
  SMTP_USER: z.string().min(1, "SMTP_USER is required"),
  SMTP_PASS: z.string().min(1, "SMTP_PASS is required"),
  SMTP_FROM: z.string().min(1, "SMTP_FROM is required"),
  FRONTEND_URL: z.string().default("http://localhost:5173"),
  ADMIN_BOOTSTRAP_EMAILS: z.string().default(""),
  CORS_ORIGIN: z.string().optional(),
  LOG_LEVEL: z.enum(["debug", "info", "warn", "error"]).default("info"),
  // Polite-pool contact email for Crossref/OpenAlex/Unpaywall — required by Unpaywall, recommended
  // by the others for faster/unthrottled responses. Use a project mailbox, not a personal one.
  SCHOLAR_CONTACT_EMAIL: z.string().min(1, "SCHOLAR_CONTACT_EMAIL is required"),
  // Optional — raises Semantic Scholar's rate limit. Leave unset to use the unauthenticated tier.
  SEMANTIC_SCHOLAR_API_KEY: z.string().optional(),
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
