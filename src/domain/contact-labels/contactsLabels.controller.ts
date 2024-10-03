import { Request, Response } from "express";
import { client } from "../../wa";
import { db } from "../../config/database/database";
import { contactLabels } from "./contactsLabels.schema";
import { eq } from "drizzle-orm";
import { contacts } from "../contacts/contacts.schema";

export class ContactsController {
  static async getContactLabels(_req: Request, res: Response) {
    try {
      // Fetch the contact and label data
      const contactData = await db.query.contactLabels.findMany({
        with: {
          contact: true,
          label: true,
        },
      });

      if (contactData.length === 0) {
        return res.status(404).json({ message: "No contacts found" });
      }

      // Transform data to group labels under each contact
      const transformedData = contactData.reduce((acc: any, curr: any) => {
        // If the contact is not already in the accumulator, add it
        if (!acc[curr.contact.id]) {
          acc[curr.contact.id] = {
            id: curr.contact.id,
            name: curr.contact.name,
            number: curr.contact.number,
            labels: [],
          };
        }

        // Add the label to the contact's labels array
        acc[curr.contact.id].labels.push({
          id: curr.label.id,
          name: curr.label.name,
        });

        return acc;
      }, {});

      // Convert the accumulator object to an array of contacts
      const contactsWithLabels = Object.values(transformedData);

      return res.status(200).json(contactsWithLabels);
    } catch (error) {
      console.error("Error fetching contacts:", error);
      res.status(500).send("Failed to fetch contacts");
    }
  }

  static async initContactLabels(
    _req: Request,
    res: Response
  ): Promise<Response> {
    try {
      // Fetch all labels
      const labels = await client.getLabels();

      if (labels.length === 0) {
        return res.status(404).json({ message: "No labels found" });
      }

      // Process labels and fetch chats by label ID
      const labelPromises = labels.map(async (label) => {
        const labelId = label.id;
        const messages = await client.getChatsByLabelId(labelId);

        // Resolve all contact IDs for each message
        const contactsData = await Promise.all(
          messages.map(async (message) => {
            const contact = await db.query.contacts.findFirst({
              where: eq(contacts.number, message.id.user),
            });

            return {
              contactId: contact?.id.toString() ?? "0",
              labelId: labelId,
            };
          })
        );

        return { labelId, contactsData };
      });

      // Wait for all label promises to resolve
      const manipulatedData = await Promise.all(labelPromises);

      // Flatten manipulatedData for database insertion
      const flattenedData = manipulatedData.flatMap((data) =>
        data.contactsData
          .filter((contact) => contact.contactId !== "0")
          .map((contact) => ({
            contactId: parseInt(contact.contactId),
            labelId: parseInt(data.labelId),
          }))
      );

      // Insert into the database
      await db.insert(contactLabels).values(flattenedData);

      return res.status(200).json({
        message: "Contact labels inserted into database",
      });
    } catch (error) {
      console.error("Error fetching contacts:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  }
}
