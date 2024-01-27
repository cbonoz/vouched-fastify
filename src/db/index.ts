import Postgrator from "postgrator";
import path from "path";

export const initDB = async () => {
  const client = new pg.Client({
    host: "localhost",
    port: 5432,
    database: "example",
    user: "example",
    password: "example",
  });

  try {
    const postgrator = new Postgrator({
      migrationPattern: path.join(__dirname, "/migrations/*"),
      driver: "pg",
      database: "vouched",
      schemaTable: "migrations",
      currentSchema: "public", // Postgres and MS SQL Server only
      execQuery: (query) => client.query(query),
    });

    const result = await postgrator.migrate();

    if (result.length === 0) {
      console.log('No migrations run for schema "public". Already at the latest one.');
    }

    console.log("Migration done.");

    process.exitCode = 0;
  } catch (err) {
    console.error(err);
    process.exitCode = 1;
  }

  await client.end();
};
