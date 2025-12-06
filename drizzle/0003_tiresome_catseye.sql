ALTER TABLE "air_waybills" DROP CONSTRAINT "air_waybills_flight_id_flights_id_fk";
--> statement-breakpoint
ALTER TABLE "air_waybills" ADD CONSTRAINT "air_waybills_flight_id_flights_id_fk" FOREIGN KEY ("flight_id") REFERENCES "public"."flights"("id") ON DELETE set null ON UPDATE no action;