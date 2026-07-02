import { z } from "zod/v4";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  PORT: z.coerce.number().default(3000),
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  JWT_SECRET: z.string().min(32, "JWT_SECRET must be at least 32 characters"),
  LLM_PROVIDER: z.enum(["gemini", "anthropic"]).default("gemini"),
  LLM_API_KEY: z.string().min(1, "LLM_API_KEY is required"),
  LLM_MODEL: z.string().default("gemini-2.5-flash"),
  // Brevo (registration / password-reset emails) — Render's free tier blocks all outbound SMTP
  // ports (25/465/587), so neither 163.com nor Outlook SMTP could ever have worked from this host;
  // Brevo's HTTP API sends over plain HTTPS (443) and, unlike Resend, doesn't require a verified
  // custom sending domain to reach real recipients.
  BREVO_API_KEY: z.string().min(1, "BREVO_API_KEY is required"),
  BREVO_FROM_EMAIL: z.string().min(1, "BREVO_FROM_EMAIL is required"),
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
