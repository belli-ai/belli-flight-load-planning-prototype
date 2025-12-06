import dotenv from "dotenv";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

dotenv.config();

// Build connection string from individual env variables
const encodedPassword = encodeURIComponent(process.env.DB_PASSWORD || "");
const encodedDbName = encodeURIComponent(process.env.DB_NAME || "");
const connectionString = `postgresql://${process.env.DB_USER}:${encodedPassword}@${process.env.DB_HOST}:${process.env.DB_PORT}/${encodedDbName}?sslmode=${process.env.DB_SSL_MODE || "disable"}`;

const client = postgres(connectionString);

export const db = drizzle(client, { schema });

