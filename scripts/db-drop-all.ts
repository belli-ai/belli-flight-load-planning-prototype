/**
 * Drop all tables from the database
 * WARNING: This will delete all data!
 */
import dotenv from "dotenv";
import postgres from "postgres";

dotenv.config();

const encodedPassword = encodeURIComponent(process.env.DB_PASSWORD || "");
const encodedDbName = encodeURIComponent(process.env.DB_NAME || "");
const connectionString = `postgresql://${process.env.DB_USER}:${encodedPassword}@${process.env.DB_HOST}:${process.env.DB_PORT}/${encodedDbName}?sslmode=${process.env.DB_SSL_MODE}`;

async function dropAllTables() {
  console.log("🗑️  Dropping all tables...");
  console.log(`   Database: ${process.env.DB_NAME}`);
  console.log("");

  const client = postgres(connectionString);

  try {
    // Get all table names in the public schema
    const tables = await client`
      SELECT tablename 
      FROM pg_tables 
      WHERE schemaname = 'public'
    `;

    if (tables.length === 0) {
      console.log("✅ No tables to drop - database is already empty");
      await client.end();
      process.exit(0);
    }

    console.log(`   Found ${tables.length} tables to drop:`);
    tables.forEach((t) => console.log(`   - ${t.tablename}`));
    console.log("");

    // Drop all tables with CASCADE to handle foreign key constraints
    for (const table of tables) {
      await client`DROP TABLE IF EXISTS ${client(table.tablename)} CASCADE`;
      console.log(`   ✓ Dropped ${table.tablename}`);
    }

    // Try to drop any custom types (enums, etc.) - some DBs don't support this
    try {
      const types = await client`
        SELECT typname 
        FROM pg_type 
        WHERE typnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
        AND typtype = 'e'
      `;

      if (types.length > 0) {
        console.log("");
        console.log(`   Found ${types.length} custom types to drop:`);
        for (const type of types) {
          try {
            await client`DROP TYPE IF EXISTS ${client(type.typname)}`;
            console.log(`   ✓ Dropped type ${type.typname}`);
          } catch (typeErr) {
            // Some databases don't support DROP TYPE, that's OK
            console.log(`   ⚠ Could not drop type ${type.typname} (may not be supported)`);
          }
        }
      }
    } catch (typeQueryErr) {
      // pg_type query might not work on all databases
      console.log("   ⚠ Skipping type cleanup (not supported on this database)");
    }

    // Drop drizzle migration table if it exists
    try {
      await client`DROP TABLE IF EXISTS __drizzle_migrations CASCADE`;
    } catch (e) {
      // Ignore errors
    }
    try {
      await client`DROP TABLE IF EXISTS drizzle.__drizzle_migrations CASCADE`;
    } catch (e) {
      // Ignore errors
    }
    try {
      await client`DROP SCHEMA IF EXISTS drizzle CASCADE`;
    } catch (e) {
      // Ignore errors - schema might not support CASCADE
    }

    console.log("");
    console.log("✅ All tables dropped successfully!");
    console.log("");
    console.log("💡 To recreate tables, run: make db-push");
    console.log("💡 To recreate and seed, run: make db-reset");
    
    await client.end();
    process.exit(0);
  } catch (error) {
    console.error("❌ Failed to drop tables:");
    console.error(`   ${error instanceof Error ? error.message : error}`);
    await client.end();
    process.exit(1);
  }
}

dropAllTables();

