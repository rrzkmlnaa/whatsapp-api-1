import { relations } from "drizzle-orm";
import { int, mysqlTable, varchar } from "drizzle-orm/mysql-core";
import { messages } from "../messages/messages.schema";

export const contacts = mysqlTable("contacts", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 200 }),
  number: varchar("number", { length: 20 }).unique(),
});

export const contactsRelation = relations(contacts, ({ one }) => ({
  messages: one(messages),
}));
