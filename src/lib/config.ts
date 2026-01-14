/**
 * Application Configuration
 *
 * Centralizes environment variable checks and configuration.
 */

/**
 * Check if the application should use static data instead of database.
 * This is useful for development/demo without a database connection.
 */
export function isStaticDataMode(): boolean {
  return process.env.NEXT_PUBLIC_USE_STATIC_DATA === "true";
}

/**
 * Get the current data source mode
 */
export function getDataSourceMode(): "static" | "database" {
  return isStaticDataMode() ? "static" : "database";
}

