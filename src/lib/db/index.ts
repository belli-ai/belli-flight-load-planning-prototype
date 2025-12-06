import dotenv from "dotenv";
dotenv.config();

import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const encodedPassword = encodeURIComponent(process.env.DB_PASSWORD || "");
const encodedDbName = encodeURIComponent(process.env.DB_NAME || "");
const connectionString = `postgresql://${process.env.DB_USER}:${encodedPassword}@${process.env.DB_HOST}:${process.env.DB_PORT}/${encodedDbName}?sslmode=${process.env.DB_SSL_MODE}`;

const client = postgres(connectionString);

export const db = drizzle(client, { schema });

