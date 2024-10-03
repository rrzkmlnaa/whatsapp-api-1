import { int, mysqlTable } from "drizzle-orm/mysql-core";
import { contacts } from "../contacts/contacts.schema";
import { labels } from "../labels/labels.schema";
import { relations } from "drizzle-orm";

export const contactLabels = mysqlTable("contactLabels", {
  id: int("id").autoincrement().primaryKey(),
  contactId: int("contactId")
    .notNull()
    .references(() => contacts.id),
  labelId: int("labelId")
    .notNull()
    .references(() => labels.id),
});

export const contactLabelsRelations = relations(contactLabels, ({ one }) => ({
  contact: one(contacts, {
    fields: [contactLabels.contactId],
    references: [contacts.id],
  }),
  label: one(labels, {
    fields: [contactLabels.labelId],
    references: [labels.id],
  }),
}));

export const contactsRelations = relations(contacts, ({ many }) => ({
  contactLabels: many(contactLabels),
}));

export const labelsRelations = relations(labels, ({ many }) => ({
  contactLabels: many(contactLabels),
}));
