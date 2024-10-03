import { int, mysqlTable, varchar } from "drizzle-orm/mysql-core";

export const groups = mysqlTable("groups", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }),
});
