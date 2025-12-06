CREATE TABLE "air_waybills" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"awb_number" varchar(20) NOT NULL,
	"origin_id" uuid NOT NULL,
	"destination_id" uuid NOT NULL,
	"shipper_name" varchar(200),
	"shipper_address" text,
	"consignee_name" varchar(200),
	"consignee_address" text,
	"total_pieces" integer NOT NULL,
	"total_weight_kg" numeric(10, 2) NOT NULL,
	"total_volume_m3" numeric(10, 4) NOT NULL,
	"chargeable_weight_kg" numeric(10, 2),
	"nature_of_goods" text,
	"special_handling_codes" text[],
	"booking_reference" varchar(50),
	"status" varchar(20) DEFAULT 'BOOKED' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "air_waybills_awb_number_unique" UNIQUE("awb_number")
);
--> statement-breakpoint
CREATE TABLE "aircrafts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(100) NOT NULL,
	"type_code" varchar(10) NOT NULL,
	"subtype" varchar(20),
	"registration" varchar(20),
	"msn" varchar(20),
	"main_deck_max_weight_kg" numeric(10, 2) NOT NULL,
	"main_deck_max_volume_m3" numeric(10, 4),
	"lower_deck_max_weight_kg" numeric(10, 2) NOT NULL,
	"lower_deck_max_volume_m3" numeric(10, 4),
	"total_max_payload_kg" numeric(10, 2) NOT NULL,
	"total_max_volume_m3" numeric(10, 4),
	"max_zero_fuel_weight_kg" numeric(10, 2) NOT NULL,
	"max_takeoff_weight_kg" numeric(10, 2) NOT NULL,
	"max_landing_weight_kg" numeric(10, 2) NOT NULL,
	"max_taxi_weight_kg" numeric(10, 2),
	"operating_empty_weight_kg" numeric(10, 2) NOT NULL,
	"datum_location" varchar(20) DEFAULT 'NOSE',
	"mac_leading_edge_cm" numeric(10, 2),
	"mac_length_cm" numeric(10, 2),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "aircrafts_registration_unique" UNIQUE("registration")
);
--> statement-breakpoint
CREATE TABLE "cargo_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"parcel_group_id" uuid,
	"awb_id" uuid NOT NULL,
	"piece_number" integer NOT NULL,
	"weight_kg" numeric(10, 2) NOT NULL,
	"length_cm" numeric(10, 2) NOT NULL,
	"width_cm" numeric(10, 2) NOT NULL,
	"height_cm" numeric(10, 2) NOT NULL,
	"volume_m3" numeric(10, 4),
	"is_stackable" boolean DEFAULT true NOT NULL,
	"max_stack_weight_kg" numeric(10, 2),
	"is_tiltable" boolean DEFAULT false NOT NULL,
	"is_dangerous_goods" boolean DEFAULT false NOT NULL,
	"dg_class_id" uuid,
	"temp_zone_id" uuid,
	"is_live_animal" boolean DEFAULT false NOT NULL,
	"is_foodstuff" boolean DEFAULT false NOT NULL,
	"special_handling_codes" text[],
	"priority" varchar(20) DEFAULT 'STANDARD' NOT NULL,
	"destination_id" uuid,
	"load_status" varchar(20) DEFAULT 'PENDING' NOT NULL,
	"assigned_uld_id" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "cg_envelope_points" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"envelope_id" uuid NOT NULL,
	"sequence" integer NOT NULL,
	"weight_kg" numeric(10, 2) NOT NULL,
	"cg_percent_mac" numeric(5, 2) NOT NULL,
	"cg_index" numeric(10, 2),
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "cg_envelopes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"aircraft_id" uuid NOT NULL,
	"envelope_type" varchar(20) NOT NULL,
	"forward_limit_percent_mac" numeric(5, 2) NOT NULL,
	"aft_limit_percent_mac" numeric(5, 2) NOT NULL,
	"description" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "cg_envelope_unique" UNIQUE("aircraft_id","envelope_type")
);
--> statement-breakpoint
CREATE TABLE "commodity_codes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" varchar(10) NOT NULL,
	"description" text NOT NULL,
	"is_dangerous_goods" boolean DEFAULT false NOT NULL,
	"dangerous_goods_codes" text[],
	"special_handling_codes" text[],
	"requires_temp_control" boolean DEFAULT false NOT NULL,
	"is_live_animal" boolean DEFAULT false NOT NULL,
	"is_foodstuff" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "commodity_codes_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "dangerous_goods_classes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"class_code" varchar(10) NOT NULL,
	"division" varchar(10),
	"name" varchar(100) NOT NULL,
	"description" text,
	"is_exempt_from_segregation" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "dangerous_goods_classes_class_code_unique" UNIQUE("class_code")
);
--> statement-breakpoint
CREATE TABLE "deck_configurations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"aircraft_id" uuid NOT NULL,
	"deck_code" varchar(20) NOT NULL,
	"deck_name" varchar(50) NOT NULL,
	"max_structural_weight_kg" numeric(10, 2),
	"sequence" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "deck_config_unique" UNIQUE("aircraft_id","deck_code")
);
--> statement-breakpoint
CREATE TABLE "dg_segregation_rules" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"class_a_id" uuid NOT NULL,
	"class_b_id" uuid NOT NULL,
	"is_segregated" boolean NOT NULL,
	"segregation_type" varchar(20),
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "dg_segregation_unique" UNIQUE("class_a_id","class_b_id")
);
--> statement-breakpoint
CREATE TABLE "flights" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"flight_number" varchar(10) NOT NULL,
	"aircraft_id" uuid NOT NULL,
	"origin_id" uuid NOT NULL,
	"destination_id" uuid NOT NULL,
	"scheduled_departure" timestamp with time zone NOT NULL,
	"scheduled_arrival" timestamp with time zone NOT NULL,
	"actual_departure" timestamp with time zone,
	"actual_arrival" timestamp with time zone,
	"status" varchar(20) DEFAULT 'SCHEDULED' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "flight_unique" UNIQUE("flight_number","scheduled_departure")
);
--> statement-breakpoint
CREATE TABLE "fuel_configurations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"aircraft_id" uuid NOT NULL,
	"max_fuel_capacity_kg" numeric(10, 2) NOT NULL,
	"description" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "fuel_configurations_aircraft_id_unique" UNIQUE("aircraft_id")
);
--> statement-breakpoint
CREATE TABLE "fuel_index_entries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"fuel_tank_id" uuid,
	"fuel_config_id" uuid NOT NULL,
	"weight_kg" numeric(10, 2) NOT NULL,
	"index_value" numeric(10, 2) NOT NULL,
	"density_kg_l" numeric(5, 3) DEFAULT '0.8',
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "fuel_tanks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"fuel_config_id" uuid NOT NULL,
	"tank_code" varchar(20) NOT NULL,
	"location" varchar(20) NOT NULL,
	"max_capacity_kg" numeric(10, 2) NOT NULL,
	"arm_station_cm" numeric(10, 2) NOT NULL,
	"sequence" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "fuel_tank_unique" UNIQUE("fuel_config_id","tank_code")
);
--> statement-breakpoint
CREATE TABLE "load_messages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"load_plan_id" uuid NOT NULL,
	"message_type" varchar(10) NOT NULL,
	"format" varchar(20) DEFAULT 'TYPE_B' NOT NULL,
	"content" text NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"sent_at" timestamp,
	"recipient" varchar(100),
	"status" varchar(20) DEFAULT 'DRAFT' NOT NULL,
	"error_message" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "load_plans" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"flight_id" uuid NOT NULL,
	"aircraft_id" uuid NOT NULL,
	"plan_number" varchar(20),
	"status" varchar(20) DEFAULT 'DRAFT' NOT NULL,
	"operating_empty_weight_kg" numeric(10, 2),
	"dry_operating_weight_kg" numeric(10, 2),
	"payload_kg" numeric(10, 2),
	"zero_fuel_weight_kg" numeric(10, 2),
	"takeoff_fuel_kg" numeric(10, 2),
	"trip_fuel_kg" numeric(10, 2),
	"takeoff_weight_kg" numeric(10, 2),
	"landing_weight_kg" numeric(10, 2),
	"zfw_cg_percent_mac" numeric(5, 2),
	"zfw_cg_index" numeric(10, 2),
	"tow_cg_percent_mac" numeric(5, 2),
	"tow_cg_index" numeric(10, 2),
	"ldw_cg_percent_mac" numeric(5, 2),
	"ldw_cg_index" numeric(10, 2),
	"stabilizer_trim_units" numeric(5, 2),
	"within_weight_limits" boolean,
	"within_cg_envelope" boolean,
	"constraints_satisfied" boolean,
	"lateral_balance_ok" boolean,
	"validation_errors" text[],
	"validation_warnings" text[],
	"optimization_time_ms" integer,
	"optimized_at" timestamp,
	"released_at" timestamp,
	"released_by" varchar(100),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "load_plans_plan_number_unique" UNIQUE("plan_number")
);
--> statement-breakpoint
CREATE TABLE "loading_positions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"deck_id" uuid NOT NULL,
	"position_code" varchar(10) NOT NULL,
	"sequence_number" integer NOT NULL,
	"max_weight_kg" numeric(10, 2) NOT NULL,
	"arm_station_cm" numeric(10, 2) NOT NULL,
	"compatible_uld_types" text[],
	"accepts_bulk_cargo" boolean DEFAULT false NOT NULL,
	"floor_area_m2" numeric(10, 4),
	"max_height_cm" numeric(10, 2),
	"contour_code" varchar(20),
	"x_offset" numeric(10, 2),
	"y_offset" numeric(10, 2),
	"col_index" integer,
	"row_index" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "position_unique" UNIQUE("deck_id","position_code")
);
--> statement-breakpoint
CREATE TABLE "loading_zone_index_entries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"zone_id" uuid NOT NULL,
	"weight_min_kg" numeric(10, 2) NOT NULL,
	"weight_max_kg" numeric(10, 2) NOT NULL,
	"index_units" numeric(10, 2) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "loading_zones" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"aircraft_id" uuid NOT NULL,
	"zone_code" varchar(10) NOT NULL,
	"position_codes" text[] NOT NULL,
	"lmc_index_impact" numeric(5, 2) NOT NULL,
	"description" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "loading_zone_unique" UNIQUE("aircraft_id","zone_code")
);
--> statement-breakpoint
CREATE TABLE "locations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"airport_code" varchar(4) NOT NULL,
	"city" varchar(100) NOT NULL,
	"country" varchar(100) NOT NULL,
	"country_code" varchar(3) NOT NULL,
	"timezone" varchar(50) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "locations_airport_code_unique" UNIQUE("airport_code")
);
--> statement-breakpoint
CREATE TABLE "packed_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"uld_assignment_id" uuid NOT NULL,
	"cargo_item_id" uuid NOT NULL,
	"sequence" integer NOT NULL,
	"x_position_cm" numeric(10, 2) NOT NULL,
	"y_position_cm" numeric(10, 2) NOT NULL,
	"z_position_cm" numeric(10, 2) NOT NULL,
	"rotated" boolean DEFAULT false NOT NULL,
	"rotation_axis" varchar(10),
	"packed_length_cm" numeric(10, 2) NOT NULL,
	"packed_width_cm" numeric(10, 2) NOT NULL,
	"packed_height_cm" numeric(10, 2) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "packed_item_unique" UNIQUE("uld_assignment_id","cargo_item_id")
);
--> statement-breakpoint
CREATE TABLE "packing_rules" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"rule_text" text NOT NULL,
	"rule_type" varchar(20) NOT NULL,
	"priority" integer DEFAULT 50 NOT NULL,
	"category" varchar(50),
	"is_active" boolean DEFAULT true NOT NULL,
	"examples" text[],
	"structured_rule" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "parcel_groups" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"awb_id" uuid NOT NULL,
	"commodity_code_id" uuid,
	"group_number" integer NOT NULL,
	"pieces" integer NOT NULL,
	"weight_kg" numeric(10, 2) NOT NULL,
	"length_cm" numeric(10, 2) NOT NULL,
	"width_cm" numeric(10, 2) NOT NULL,
	"height_cm" numeric(10, 2) NOT NULL,
	"volume_m3" numeric(10, 4),
	"is_stackable" boolean DEFAULT true NOT NULL,
	"max_stack_weight_kg" numeric(10, 2),
	"is_tiltable" boolean DEFAULT false NOT NULL,
	"temp_zone_id" uuid,
	"special_handling_codes" text[],
	"description" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "parcel_group_unique" UNIQUE("awb_id","group_number")
);
--> statement-breakpoint
CREATE TABLE "position_loads" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"load_plan_id" uuid NOT NULL,
	"position_id" uuid NOT NULL,
	"uld_assignment_id" uuid,
	"position_code" varchar(10) NOT NULL,
	"gross_weight_kg" numeric(10, 2) NOT NULL,
	"calculated_moment" numeric(15, 2),
	"calculated_index" numeric(10, 2),
	"status" varchar(20) DEFAULT 'PLANNED' NOT NULL,
	"loaded_at" timestamp,
	"verified_by" varchar(100),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "position_load_unique" UNIQUE("load_plan_id","position_id")
);
--> statement-breakpoint
CREATE TABLE "temperature_zones" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" varchar(20) NOT NULL,
	"name" varchar(50) NOT NULL,
	"min_temp_celsius" numeric(5, 2),
	"max_temp_celsius" numeric(5, 2),
	"description" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "temperature_zones_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "uld_assignments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"load_plan_id" uuid NOT NULL,
	"uld_id" uuid,
	"uld_type_id" uuid NOT NULL,
	"uld_number" varchar(20),
	"position_code" varchar(10),
	"sequence" integer NOT NULL,
	"total_weight_kg" numeric(10, 2) DEFAULT '0' NOT NULL,
	"tare_weight_kg" numeric(10, 2) NOT NULL,
	"cargo_weight_kg" numeric(10, 2) DEFAULT '0' NOT NULL,
	"volume_used_m3" numeric(10, 4) DEFAULT '0' NOT NULL,
	"volume_utilization" numeric(5, 2),
	"weight_utilization" numeric(5, 2),
	"is_virtual" boolean DEFAULT false NOT NULL,
	"status" varchar(20) DEFAULT 'PLANNED' NOT NULL,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "uld_types" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" varchar(10) NOT NULL,
	"name" varchar(50) NOT NULL,
	"description" text,
	"category" varchar(20) NOT NULL,
	"contour" varchar(20),
	"max_gross_weight_kg" numeric(10, 2) NOT NULL,
	"tare_weight_kg" numeric(10, 2) NOT NULL,
	"max_volume_m3" numeric(10, 4) NOT NULL,
	"length_cm" numeric(10, 2) NOT NULL,
	"width_cm" numeric(10, 2) NOT NULL,
	"height_cm" numeric(10, 2) NOT NULL,
	"internal_length_cm" numeric(10, 2),
	"internal_width_cm" numeric(10, 2),
	"internal_height_cm" numeric(10, 2),
	"door_width_cm" numeric(10, 2),
	"door_height_cm" numeric(10, 2),
	"col_span" integer DEFAULT 1 NOT NULL,
	"is_refrigerated" boolean DEFAULT false NOT NULL,
	"deck_compatibility" text[],
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "uld_types_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "ulds" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"uld_number" varchar(20) NOT NULL,
	"uld_type_id" uuid NOT NULL,
	"location_id" uuid,
	"owner_code" varchar(10),
	"status" varchar(20) DEFAULT 'AVAILABLE' NOT NULL,
	"last_inspection_date" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "ulds_uld_number_unique" UNIQUE("uld_number")
);
--> statement-breakpoint
CREATE TABLE "weight_constraints" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"aircraft_id" uuid NOT NULL,
	"name" varchar(100) NOT NULL,
	"description" text,
	"affected_positions" text[] NOT NULL,
	"max_combined_weight_kg" numeric(10, 2) NOT NULL,
	"condition_type" varchar(20) DEFAULT 'ALWAYS' NOT NULL,
	"condition_expression" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "air_waybills" ADD CONSTRAINT "air_waybills_origin_id_locations_id_fk" FOREIGN KEY ("origin_id") REFERENCES "public"."locations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "air_waybills" ADD CONSTRAINT "air_waybills_destination_id_locations_id_fk" FOREIGN KEY ("destination_id") REFERENCES "public"."locations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cargo_items" ADD CONSTRAINT "cargo_items_parcel_group_id_parcel_groups_id_fk" FOREIGN KEY ("parcel_group_id") REFERENCES "public"."parcel_groups"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cargo_items" ADD CONSTRAINT "cargo_items_awb_id_air_waybills_id_fk" FOREIGN KEY ("awb_id") REFERENCES "public"."air_waybills"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cargo_items" ADD CONSTRAINT "cargo_items_dg_class_id_dangerous_goods_classes_id_fk" FOREIGN KEY ("dg_class_id") REFERENCES "public"."dangerous_goods_classes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cargo_items" ADD CONSTRAINT "cargo_items_temp_zone_id_temperature_zones_id_fk" FOREIGN KEY ("temp_zone_id") REFERENCES "public"."temperature_zones"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cargo_items" ADD CONSTRAINT "cargo_items_destination_id_locations_id_fk" FOREIGN KEY ("destination_id") REFERENCES "public"."locations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cg_envelope_points" ADD CONSTRAINT "cg_envelope_points_envelope_id_cg_envelopes_id_fk" FOREIGN KEY ("envelope_id") REFERENCES "public"."cg_envelopes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cg_envelopes" ADD CONSTRAINT "cg_envelopes_aircraft_id_aircrafts_id_fk" FOREIGN KEY ("aircraft_id") REFERENCES "public"."aircrafts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "deck_configurations" ADD CONSTRAINT "deck_configurations_aircraft_id_aircrafts_id_fk" FOREIGN KEY ("aircraft_id") REFERENCES "public"."aircrafts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dg_segregation_rules" ADD CONSTRAINT "dg_segregation_rules_class_a_id_dangerous_goods_classes_id_fk" FOREIGN KEY ("class_a_id") REFERENCES "public"."dangerous_goods_classes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dg_segregation_rules" ADD CONSTRAINT "dg_segregation_rules_class_b_id_dangerous_goods_classes_id_fk" FOREIGN KEY ("class_b_id") REFERENCES "public"."dangerous_goods_classes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "flights" ADD CONSTRAINT "flights_aircraft_id_aircrafts_id_fk" FOREIGN KEY ("aircraft_id") REFERENCES "public"."aircrafts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "flights" ADD CONSTRAINT "flights_origin_id_locations_id_fk" FOREIGN KEY ("origin_id") REFERENCES "public"."locations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "flights" ADD CONSTRAINT "flights_destination_id_locations_id_fk" FOREIGN KEY ("destination_id") REFERENCES "public"."locations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fuel_configurations" ADD CONSTRAINT "fuel_configurations_aircraft_id_aircrafts_id_fk" FOREIGN KEY ("aircraft_id") REFERENCES "public"."aircrafts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fuel_index_entries" ADD CONSTRAINT "fuel_index_entries_fuel_tank_id_fuel_tanks_id_fk" FOREIGN KEY ("fuel_tank_id") REFERENCES "public"."fuel_tanks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fuel_index_entries" ADD CONSTRAINT "fuel_index_entries_fuel_config_id_fuel_configurations_id_fk" FOREIGN KEY ("fuel_config_id") REFERENCES "public"."fuel_configurations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fuel_tanks" ADD CONSTRAINT "fuel_tanks_fuel_config_id_fuel_configurations_id_fk" FOREIGN KEY ("fuel_config_id") REFERENCES "public"."fuel_configurations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "load_messages" ADD CONSTRAINT "load_messages_load_plan_id_load_plans_id_fk" FOREIGN KEY ("load_plan_id") REFERENCES "public"."load_plans"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "load_plans" ADD CONSTRAINT "load_plans_flight_id_flights_id_fk" FOREIGN KEY ("flight_id") REFERENCES "public"."flights"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "load_plans" ADD CONSTRAINT "load_plans_aircraft_id_aircrafts_id_fk" FOREIGN KEY ("aircraft_id") REFERENCES "public"."aircrafts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "loading_positions" ADD CONSTRAINT "loading_positions_deck_id_deck_configurations_id_fk" FOREIGN KEY ("deck_id") REFERENCES "public"."deck_configurations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "loading_zone_index_entries" ADD CONSTRAINT "loading_zone_index_entries_zone_id_loading_zones_id_fk" FOREIGN KEY ("zone_id") REFERENCES "public"."loading_zones"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "loading_zones" ADD CONSTRAINT "loading_zones_aircraft_id_aircrafts_id_fk" FOREIGN KEY ("aircraft_id") REFERENCES "public"."aircrafts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "packed_items" ADD CONSTRAINT "packed_items_uld_assignment_id_uld_assignments_id_fk" FOREIGN KEY ("uld_assignment_id") REFERENCES "public"."uld_assignments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "packed_items" ADD CONSTRAINT "packed_items_cargo_item_id_cargo_items_id_fk" FOREIGN KEY ("cargo_item_id") REFERENCES "public"."cargo_items"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "parcel_groups" ADD CONSTRAINT "parcel_groups_awb_id_air_waybills_id_fk" FOREIGN KEY ("awb_id") REFERENCES "public"."air_waybills"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "parcel_groups" ADD CONSTRAINT "parcel_groups_commodity_code_id_commodity_codes_id_fk" FOREIGN KEY ("commodity_code_id") REFERENCES "public"."commodity_codes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "parcel_groups" ADD CONSTRAINT "parcel_groups_temp_zone_id_temperature_zones_id_fk" FOREIGN KEY ("temp_zone_id") REFERENCES "public"."temperature_zones"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "position_loads" ADD CONSTRAINT "position_loads_load_plan_id_load_plans_id_fk" FOREIGN KEY ("load_plan_id") REFERENCES "public"."load_plans"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "position_loads" ADD CONSTRAINT "position_loads_position_id_loading_positions_id_fk" FOREIGN KEY ("position_id") REFERENCES "public"."loading_positions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "position_loads" ADD CONSTRAINT "position_loads_uld_assignment_id_uld_assignments_id_fk" FOREIGN KEY ("uld_assignment_id") REFERENCES "public"."uld_assignments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "uld_assignments" ADD CONSTRAINT "uld_assignments_load_plan_id_load_plans_id_fk" FOREIGN KEY ("load_plan_id") REFERENCES "public"."load_plans"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "uld_assignments" ADD CONSTRAINT "uld_assignments_uld_id_ulds_id_fk" FOREIGN KEY ("uld_id") REFERENCES "public"."ulds"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "uld_assignments" ADD CONSTRAINT "uld_assignments_uld_type_id_uld_types_id_fk" FOREIGN KEY ("uld_type_id") REFERENCES "public"."uld_types"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ulds" ADD CONSTRAINT "ulds_uld_type_id_uld_types_id_fk" FOREIGN KEY ("uld_type_id") REFERENCES "public"."uld_types"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ulds" ADD CONSTRAINT "ulds_location_id_locations_id_fk" FOREIGN KEY ("location_id") REFERENCES "public"."locations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "weight_constraints" ADD CONSTRAINT "weight_constraints_aircraft_id_aircrafts_id_fk" FOREIGN KEY ("aircraft_id") REFERENCES "public"."aircrafts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_awb_origin" ON "air_waybills" USING btree ("origin_id");--> statement-breakpoint
CREATE INDEX "idx_awb_destination" ON "air_waybills" USING btree ("destination_id");--> statement-breakpoint
CREATE INDEX "idx_awb_status" ON "air_waybills" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_aircrafts_type" ON "aircrafts" USING btree ("type_code");--> statement-breakpoint
CREATE INDEX "idx_cargo_awb" ON "cargo_items" USING btree ("awb_id");--> statement-breakpoint
CREATE INDEX "idx_cargo_parcel" ON "cargo_items" USING btree ("parcel_group_id");--> statement-breakpoint
CREATE INDEX "idx_cargo_status" ON "cargo_items" USING btree ("load_status");--> statement-breakpoint
CREATE INDEX "idx_cargo_priority" ON "cargo_items" USING btree ("priority");--> statement-breakpoint
CREATE INDEX "idx_cargo_dg" ON "cargo_items" USING btree ("is_dangerous_goods");--> statement-breakpoint
CREATE INDEX "idx_cg_points_envelope" ON "cg_envelope_points" USING btree ("envelope_id");--> statement-breakpoint
CREATE INDEX "idx_cg_envelope_aircraft" ON "cg_envelopes" USING btree ("aircraft_id");--> statement-breakpoint
CREATE INDEX "idx_commodity_dg" ON "commodity_codes" USING btree ("is_dangerous_goods");--> statement-breakpoint
CREATE INDEX "idx_deck_aircraft" ON "deck_configurations" USING btree ("aircraft_id");--> statement-breakpoint
CREATE INDEX "idx_dg_segregation_class_a" ON "dg_segregation_rules" USING btree ("class_a_id");--> statement-breakpoint
CREATE INDEX "idx_dg_segregation_class_b" ON "dg_segregation_rules" USING btree ("class_b_id");--> statement-breakpoint
CREATE INDEX "idx_flights_aircraft" ON "flights" USING btree ("aircraft_id");--> statement-breakpoint
CREATE INDEX "idx_flights_origin" ON "flights" USING btree ("origin_id");--> statement-breakpoint
CREATE INDEX "idx_flights_destination" ON "flights" USING btree ("destination_id");--> statement-breakpoint
CREATE INDEX "idx_flights_departure" ON "flights" USING btree ("scheduled_departure");--> statement-breakpoint
CREATE INDEX "idx_flights_status" ON "flights" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_fuel_index_tank" ON "fuel_index_entries" USING btree ("fuel_tank_id");--> statement-breakpoint
CREATE INDEX "idx_fuel_index_config" ON "fuel_index_entries" USING btree ("fuel_config_id");--> statement-breakpoint
CREATE INDEX "idx_fuel_tanks_config" ON "fuel_tanks" USING btree ("fuel_config_id");--> statement-breakpoint
CREATE INDEX "idx_load_messages_plan" ON "load_messages" USING btree ("load_plan_id");--> statement-breakpoint
CREATE INDEX "idx_load_messages_type" ON "load_messages" USING btree ("message_type");--> statement-breakpoint
CREATE INDEX "idx_load_messages_status" ON "load_messages" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_load_plans_flight" ON "load_plans" USING btree ("flight_id");--> statement-breakpoint
CREATE INDEX "idx_load_plans_aircraft" ON "load_plans" USING btree ("aircraft_id");--> statement-breakpoint
CREATE INDEX "idx_load_plans_status" ON "load_plans" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_positions_deck" ON "loading_positions" USING btree ("deck_id");--> statement-breakpoint
CREATE INDEX "idx_zone_index_zone" ON "loading_zone_index_entries" USING btree ("zone_id");--> statement-breakpoint
CREATE INDEX "idx_zones_aircraft" ON "loading_zones" USING btree ("aircraft_id");--> statement-breakpoint
CREATE INDEX "idx_locations_country" ON "locations" USING btree ("country_code");--> statement-breakpoint
CREATE INDEX "idx_packed_items_assignment" ON "packed_items" USING btree ("uld_assignment_id");--> statement-breakpoint
CREATE INDEX "idx_packed_items_cargo" ON "packed_items" USING btree ("cargo_item_id");--> statement-breakpoint
CREATE INDEX "idx_packing_rules_type" ON "packing_rules" USING btree ("rule_type");--> statement-breakpoint
CREATE INDEX "idx_packing_rules_active" ON "packing_rules" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "idx_parcel_awb" ON "parcel_groups" USING btree ("awb_id");--> statement-breakpoint
CREATE INDEX "idx_parcel_commodity" ON "parcel_groups" USING btree ("commodity_code_id");--> statement-breakpoint
CREATE INDEX "idx_position_loads_plan" ON "position_loads" USING btree ("load_plan_id");--> statement-breakpoint
CREATE INDEX "idx_position_loads_position" ON "position_loads" USING btree ("position_id");--> statement-breakpoint
CREATE INDEX "idx_uld_assignments_plan" ON "uld_assignments" USING btree ("load_plan_id");--> statement-breakpoint
CREATE INDEX "idx_uld_assignments_uld" ON "uld_assignments" USING btree ("uld_id");--> statement-breakpoint
CREATE INDEX "idx_uld_assignments_status" ON "uld_assignments" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_uld_types_category" ON "uld_types" USING btree ("category");--> statement-breakpoint
CREATE INDEX "idx_ulds_type" ON "ulds" USING btree ("uld_type_id");--> statement-breakpoint
CREATE INDEX "idx_ulds_location" ON "ulds" USING btree ("location_id");--> statement-breakpoint
CREATE INDEX "idx_ulds_status" ON "ulds" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_weight_constraints_aircraft" ON "weight_constraints" USING btree ("aircraft_id");