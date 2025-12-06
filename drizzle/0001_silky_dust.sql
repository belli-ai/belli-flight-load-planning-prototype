CREATE TABLE "deck_configuration_presets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"aircraft_id" uuid NOT NULL,
	"preset_name" varchar(50) NOT NULL,
	"preset_code" varchar(20) NOT NULL,
	"description" text,
	"is_default" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "preset_unique" UNIQUE("aircraft_id","preset_code")
);
--> statement-breakpoint
ALTER TABLE "load_messages" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP TABLE "load_messages" CASCADE;--> statement-breakpoint
ALTER TABLE "deck_configurations" DROP CONSTRAINT "deck_config_unique";--> statement-breakpoint
ALTER TABLE "deck_configurations" DROP CONSTRAINT "deck_configurations_aircraft_id_aircrafts_id_fk";
--> statement-breakpoint
DROP INDEX "idx_deck_aircraft";--> statement-breakpoint
ALTER TABLE "loading_positions" ALTER COLUMN "contour_code" SET DEFAULT 'FULL_WIDTH';--> statement-breakpoint
ALTER TABLE "loading_positions" ALTER COLUMN "contour_code" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "deck_configurations" ADD COLUMN "preset_id" uuid NOT NULL;--> statement-breakpoint
ALTER TABLE "deck_configuration_presets" ADD CONSTRAINT "deck_configuration_presets_aircraft_id_aircrafts_id_fk" FOREIGN KEY ("aircraft_id") REFERENCES "public"."aircrafts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_preset_aircraft" ON "deck_configuration_presets" USING btree ("aircraft_id");--> statement-breakpoint
ALTER TABLE "deck_configurations" ADD CONSTRAINT "deck_configurations_preset_id_deck_configuration_presets_id_fk" FOREIGN KEY ("preset_id") REFERENCES "public"."deck_configuration_presets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_deck_preset" ON "deck_configurations" USING btree ("preset_id");--> statement-breakpoint
ALTER TABLE "deck_configurations" DROP COLUMN "aircraft_id";--> statement-breakpoint
ALTER TABLE "deck_configurations" ADD CONSTRAINT "deck_config_unique" UNIQUE("preset_id","deck_code");