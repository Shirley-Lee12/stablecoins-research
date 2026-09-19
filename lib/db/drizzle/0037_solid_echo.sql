CREATE TABLE "issuer_disclosures" (
	"id" serial PRIMARY KEY NOT NULL,
	"issuer_slug" text NOT NULL,
	"issuer_name" text NOT NULL,
	"product_symbols" text[] DEFAULT '{}' NOT NULL,
	"report_period_end" date NOT NULL,
	"published_at" timestamp with time zone,
	"source_url" text NOT NULL,
	"source_type" text NOT NULL,
	"reserve_total_usd" numeric(24, 2),
	"reserve_components" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"maturity_profile" text,
	"custodians" text[] DEFAULT '{}' NOT NULL,
	"counterparties" text[] DEFAULT '{}' NOT NULL,
	"redemption_terms" text,
	"assurance_provider" text,
	"assurance_type" text,
	"assurance_lag_days" integer,
	"revenue_structure" text,
	"reported_earnings_usd" numeric(24, 2),
	"notes" text,
	"review_status" text DEFAULT 'draft' NOT NULL,
	"created_by" integer,
	"reviewed_by" integer,
	"reviewed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "issuer_disclosures" ADD CONSTRAINT "issuer_disclosures_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "issuer_disclosures" ADD CONSTRAINT "issuer_disclosures_reviewed_by_users_id_fk" FOREIGN KEY ("reviewed_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;