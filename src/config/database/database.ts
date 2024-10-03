import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import { schema } from "./schema";
import "dotenv/config";

const poolConnection = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: parseInt(process.env.DB_PORT ?? "3306"),
  multipleStatements: true,
});

void (async () => {
  try {
    await poolConnection.query("SELECT 1");
    console.log("Connected to database successfully");
  } catch (error) {
    console.error("Could not connect to database", error);
  }
})();

export const db = drizzle(poolConnection, {
  schema,
  mode: "default",
});
