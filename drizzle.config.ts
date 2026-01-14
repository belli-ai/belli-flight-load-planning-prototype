import { defineConfig } from "drizzle-kit";
import dotenv from "dotenv";

dotenv.config();

const encodedPassword = encodeURIComponent(process.env.DB_PASSWORD || "");
const encodedDbName = encodeURIComponent(process.env.DB_NAME || "");
const connectionString = `postgresql://${process.env.DB_USER}:${encodedPassword}@${process.env.DB_HOST}:${process.env.DB_PORT}/${encodedDbName}?sslmode=${process.env.DB_SSL_MODE}`;

export default defineConfig({
  schema: "./src/lib/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  schemaFilter: ["app"],
  dbCredentials: {
    url: connectionString,
  },
});
