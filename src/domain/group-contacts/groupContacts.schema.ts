import { int, mysqlTable } from "drizzle-orm/mysql-core";
import { contacts } from "../contacts/contacts.schema";
import { relations } from "drizzle-orm";
import { groups } from "../groups/group.schema";

export const groupContacts = mysqlTable("groupContacts", {
  id: int("id").autoincrement().primaryKey(),
  contactId: int("contactId")
    .notNull()
    .references(() => contacts.id),
  groupId: int("groupId")
    .notNull()
    .references(() => groups.id),
});

export const groupContactsRelations = relations(groupContacts, ({ one }) => ({
  contact: one(contacts, {
    fields: [groupContacts.contactId],
    references: [contacts.id],
  }),
  group: one(groups, {
    fields: [groupContacts.groupId],
    references: [groups.id],
  }),
}));
