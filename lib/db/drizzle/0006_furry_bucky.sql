CREATE TYPE "public"."tag_facet" AS ENUM('theme', 'jurisdiction', 'asset');--> statement-breakpoint
CREATE TYPE "public"."tag_status" AS ENUM('active', 'candidate');--> statement-breakpoint
CREATE TABLE "resource_tags" (
	"id" serial PRIMARY KEY NOT NULL,
	"resource_id" integer NOT NULL,
	"tag_id" integer NOT NULL,
	CONSTRAINT "resource_tags_resource_id_tag_id_unique" UNIQUE("resource_id","tag_id")
);
--> statement-breakpoint
CREATE TABLE "tags" (
	"id" serial PRIMARY KEY NOT NULL,
	"slug" text NOT NULL,
	"name_en" text NOT NULL,
	"name_zh" text NOT NULL,
	"facet" "tag_facet" NOT NULL,
	"definition" text,
	"status" "tag_status" DEFAULT 'active' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "tags_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
ALTER TABLE "resource_tags" ADD CONSTRAINT "resource_tags_resource_id_resources_id_fk" FOREIGN KEY ("resource_id") REFERENCES "public"."resources"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "resource_tags" ADD CONSTRAINT "resource_tags_tag_id_tags_id_fk" FOREIGN KEY ("tag_id") REFERENCES "public"."tags"("id") ON DELETE cascade ON UPDATE no action;