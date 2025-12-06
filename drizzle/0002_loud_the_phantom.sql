ALTER TABLE "air_waybills" ADD COLUMN "flight_id" uuid;--> statement-breakpoint
ALTER TABLE "air_waybills" ADD CONSTRAINT "air_waybills_flight_id_flights_id_fk" FOREIGN KEY ("flight_id") REFERENCES "public"."flights"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_awb_flight" ON "air_waybills" USING btree ("flight_id");