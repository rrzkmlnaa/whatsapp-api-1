import type { Config } from "drizzle-kit";
import * as dotenv from "dotenv";
dotenv.config();

export default {
  schema: "./src/domain/**/**.schema.ts",
  out: "./drizzle",
  dialect: "mysql",
  dbCredentials: {
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    host: process.env.DB_HOST ?? "",
    port: parseInt(process.env.DB_PORT ?? "3306"),
    database: process.env.DB_NAME ?? "",
  },
} satisfies Config;
