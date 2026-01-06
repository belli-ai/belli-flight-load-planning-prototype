import dotenv from "dotenv";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";
import { isStaticDataMode } from "@/lib/config";

dotenv.config();

// Only initialize database connection if not in static data mode
let db: ReturnType<typeof drizzle<typeof schema>>;

if (!isStaticDataMode()) {
  // Build connection string from individual env variables
  const encodedPassword = encodeURIComponent(process.env.DB_PASSWORD || "");
  const encodedDbName = encodeURIComponent(process.env.DB_NAME || "");
  const connectionString = `postgresql://${process.env.DB_USER}:${encodedPassword}@${process.env.DB_HOST}:${process.env.DB_PORT}/${encodedDbName}?sslmode=${process.env.DB_SSL_MODE || "disable"}`;

  const client = postgres(connectionString);
  db = drizzle(client, { schema });
} else {
  // In static data mode, create a placeholder that will throw if accessed
  // This ensures any code paths that accidentally use db in static mode will fail fast
  db = new Proxy({} as ReturnType<typeof drizzle<typeof schema>>, {
    get(_, prop) {
      if (prop === "then") {
        // Allow promise checks to pass without throwing
        return undefined;
      }
      throw new Error(
        `Database access attempted while in static data mode. ` +
        `The application is configured with NEXT_PUBLIC_USE_STATIC_DATA=true. ` +
        `Ensure all data access goes through the appropriate static data functions.`
      );
    },
  });
}

export { db };
