import { relations } from "drizzle-orm";
import { int, mysqlTable, varchar } from "drizzle-orm/mysql-core";
import { contacts } from "../contacts/contacts.schema";

export const labels = mysqlTable("labels", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }),
});

export const labelsRelation = relations(labels, ({ one }) => ({
  contacts: one(contacts),
}));
