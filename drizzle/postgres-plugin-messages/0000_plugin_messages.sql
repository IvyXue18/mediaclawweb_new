-- Drizzle runs this migration in a transaction. Fail promptly on lock contention.
SET LOCAL lock_timeout = '2s';
--> statement-breakpoint
SET LOCAL statement_timeout = '30s';
--> statement-breakpoint
CREATE TABLE "public"."plugin_message" (
	"id" text PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"summary" text DEFAULT '' NOT NULL,
	"body_markdown" text DEFAULT '' NOT NULL,
	"category" text DEFAULT 'product' NOT NULL,
	"priority" text DEFAULT 'normal' NOT NULL,
	"status" text DEFAULT 'draft' NOT NULL,
	"action_label" text DEFAULT '' NOT NULL,
	"action_url" text DEFAULT '' NOT NULL,
	"audience_json" text DEFAULT '{}' NOT NULL,
	"is_pinned" boolean DEFAULT false NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"content_version" integer DEFAULT 1 NOT NULL,
	"starts_at" timestamp,
	"ends_at" timestamp,
	"published_at" timestamp,
	"created_by" text DEFAULT '' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "public"."plugin_message_receipt" (
	"id" text PRIMARY KEY NOT NULL,
	"message_id" text NOT NULL,
	"subject_key" text NOT NULL,
	"content_version" integer DEFAULT 1 NOT NULL,
	"first_impression_at" timestamp,
	"read_at" timestamp,
	"dismissed_at" timestamp,
	"action_clicked_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "public"."plugin_message_receipt" ADD CONSTRAINT "plugin_message_receipt_message_id_plugin_message_id_fk" FOREIGN KEY ("message_id") REFERENCES "public"."plugin_message"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
CREATE INDEX "idx_plugin_message_status_window" ON "public"."plugin_message" USING btree ("status","starts_at","ends_at");
--> statement-breakpoint
CREATE INDEX "idx_plugin_message_priority_sort" ON "public"."plugin_message" USING btree ("priority","sort_order","published_at");
--> statement-breakpoint
CREATE UNIQUE INDEX "uq_plugin_message_receipt_subject" ON "public"."plugin_message_receipt" USING btree ("message_id","subject_key");
--> statement-breakpoint
CREATE INDEX "idx_plugin_message_receipt_subject_read" ON "public"."plugin_message_receipt" USING btree ("subject_key","read_at");
