CREATE TABLE "regulatory_entries" (
	"id" serial PRIMARY KEY NOT NULL,
	"country" text NOT NULL,
	"region" text,
	"authority" text,
	"title" text NOT NULL,
	"title_zh" text,
	"summary" text,
	"summary_zh" text,
	"document_url" text,
	"effective_date" date NOT NULL,
	"category" text,
	"created_by" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "regulatory_resources" (
	"id" serial PRIMARY KEY NOT NULL,
	"regulatory_entry_id" integer NOT NULL,
	"resource_id" integer NOT NULL,
	CONSTRAINT "regulatory_resources_regulatory_entry_id_resource_id_unique" UNIQUE("regulatory_entry_id","resource_id")
);
--> statement-breakpoint
ALTER TABLE "our_research" ADD COLUMN "title_zh" text;--> statement-breakpoint
ALTER TABLE "our_research" ADD COLUMN "abstract_zh" text;--> statement-breakpoint
ALTER TABLE "our_research" ADD COLUMN "authors" text[] DEFAULT '{}' NOT NULL;--> statement-breakpoint
ALTER TABLE "our_research" ADD COLUMN "key_innovations_zh" text[] DEFAULT '{}' NOT NULL;--> statement-breakpoint
ALTER TABLE "our_research" ADD COLUMN "published_date" date;--> statement-breakpoint
ALTER TABLE "regulatory_entries" ADD CONSTRAINT "regulatory_entries_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "regulatory_resources" ADD CONSTRAINT "regulatory_resources_regulatory_entry_id_regulatory_entries_id_fk" FOREIGN KEY ("regulatory_entry_id") REFERENCES "public"."regulatory_entries"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "regulatory_resources" ADD CONSTRAINT "regulatory_resources_resource_id_resources_id_fk" FOREIGN KEY ("resource_id") REFERENCES "public"."resources"("id") ON DELETE cascade ON UPDATE no action;