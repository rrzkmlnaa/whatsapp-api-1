import * as contacts from "../../domain/contacts/contacts.schema";
import * as groups from "../../domain/groups/group.schema";
import * as groupContacts from "../../domain/group-contacts/groupContacts.schema";
import * as messages from "../../domain/messages/messages.schema";
import * as labels from "../../domain/labels/labels.schema";
import * as contactLabels from "../../domain/contact-labels/contactsLabels.schema";

export const schema = {
  ...contacts,
  ...groups,
  ...groupContacts,
  ...messages,
  ...labels,
  ...contactLabels,
};
