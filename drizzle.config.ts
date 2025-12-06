import { defineConfig } from "drizzle-kit";
import dotenv from "dotenv";

dotenv.config();

const encodedPassword = encodeURIComponent(process.env.DB_PASSWORD || "");
const connectionString = `postgresql://${process.env.DB_USER}:${encodedPassword}@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}?sslmode=${process.env.DB_SSL_MODE}`;

export default defineConfig({
  schema: "./src/lib/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: connectionString,
  },
});

