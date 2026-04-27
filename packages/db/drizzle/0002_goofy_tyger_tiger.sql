ALTER TABLE "dealers" ADD COLUMN "chat_enabled" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "dealers" ADD COLUMN "chat_agent_name" text;