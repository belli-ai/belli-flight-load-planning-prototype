import dotenv from "dotenv";
import postgres from "postgres";

dotenv.config();

const encodedPassword = encodeURIComponent(process.env.DB_PASSWORD || "");
const encodedDbName = encodeURIComponent(process.env.DB_NAME || "");
const connectionString = `postgresql://${process.env.DB_USER}:${encodedPassword}@${process.env.DB_HOST}:${process.env.DB_PORT}/${encodedDbName}?sslmode=${process.env.DB_SSL_MODE}`;

async function testConnection() {
  console.log("Testing database connection...");
  console.log(`Host: ${process.env.DB_HOST}`);
  console.log(`Port: ${process.env.DB_PORT}`);
  console.log(`Database: ${process.env.DB_NAME}`);
  console.log(`User: ${process.env.DB_USER}`);
  console.log(`SSL Mode: ${process.env.DB_SSL_MODE}`);
  console.log("");

  const client = postgres(connectionString);

  try {
    const result = await client`SELECT NOW() as current_time, version() as pg_version`;
    console.log("✅ Connection successful!");
    console.log(`   Server time: ${result[0].current_time}`);
    console.log(`   PostgreSQL version: ${result[0].pg_version.split(",")[0]}`);
    await client.end();
    process.exit(0);
  } catch (error) {
    console.error("❌ Connection failed!");
    console.error(`   Error: ${error instanceof Error ? error.message : error}`);
    await client.end();
    process.exit(1);
  }
}

testConnection();

