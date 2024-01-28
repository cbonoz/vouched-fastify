import path from "node:path";
import pg from "pg";
import { migrate } from "postgres-migrations";

// https://www.npmjs.com/package/postgres-migrations
export async function initDB() {
  const connectionString = process.env.DATABASE_URL as string;
  // parse user, password, host, port, database from connectionString

  const password = connectionString.split(":")[2].split("@")[0];
  const host = connectionString.split("@")[1].split(":")[0];
  const database = connectionString.split(":")[3].split("/")[1];
  const user = connectionString.split(":")[1].split("//")[1];
  const port = parseInt(connectionString.split(":")[3].split("/")[0]);

  const dbConfig = {
    database,
    user,
    password,
    host,
    port,

    // Default: false for backwards-compatibility
    // This might change!
    ensureDatabaseExists: true,

    // Default: "postgres"
    // Used when checking/creating "database-name"
    defaultDatabase: "postgres",
  };

  const dbPath = path.join(__dirname, "migrations");
  console.log("Migrating database...", dbPath);

  await migrate(dbConfig, dbPath);
}
