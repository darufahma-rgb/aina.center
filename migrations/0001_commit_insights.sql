CREATE TABLE "commit_insights" (
	"id" serial PRIMARY KEY NOT NULL,
	"commit_hash" text NOT NULL,
	"repo_name" text NOT NULL,
	"detailed_explanation" text,
	"simple_explanation" text,
	"mapped_feature_target" text,
	"generated_by" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "commit_insights_commit_hash_unique" UNIQUE("commit_hash")
);
--> statement-breakpoint
ALTER TABLE "commit_insights" ADD CONSTRAINT "commit_insights_generated_by_users_id_fk" FOREIGN KEY ("generated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;