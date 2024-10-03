import { int, json, mysqlTable } from "drizzle-orm/mysql-core";
import { contacts } from "../contacts/contacts.schema";
import { relations } from "drizzle-orm";

export const messages = mysqlTable("messages", {
  id: int("int").autoincrement().primaryKey(),
  contactId: int("contactId").notNull().references(()=> contacts.id),
  message: json("message").notNull(),
});

export const messagesRelation = relations(messages, ({one}) => ({
   contacts : one(contacts,{
    fields: [messages.contactId],
    references: [contacts.id]
   })
}));
