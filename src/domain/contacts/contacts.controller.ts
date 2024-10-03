import { Request, Response } from "express";
import { client } from "../../wa";
import { db } from "../../config/database/database";
import { contacts } from "./contacts.schema";
import { eq } from "drizzle-orm";

export class ContactsController {
  static async getContacts(_req: Request, res: Response) {
    const { phoneNumber } = _req.query;

    const phoneNumberString =
      typeof phoneNumber === "string" ? phoneNumber : "";

    try {
      let contactData;

      if (phoneNumberString) {
        // Fetch labels that match the given phoneNumberString
        contactData = await db.query.contacts.findMany({
          where: eq(contacts.number, phoneNumberString),
        });
      } else {
        // Fetch all labels if labelId is not provided
        contactData = await db.query.contacts.findMany();
      }

      if (contactData.length === 0) {
        return res.status(404).json({ message: "No Labels found" });
      }

      return res.status(200).json(contactData);
    } catch (error) {
      console.error("Error fetching Labels:", error);
      return res.status(500).send("Failed to fetch Labels");
    }
  }

  static async initContacts(_req: Request, res: Response) {
    try {
      const contactData = await client.getContacts();

      if (contactData.length === 0) {
        return { message: "No contacts found" };
      }

      let formattedContacts = contactData.map((contact) => ({
        server: contact.id.server,
        name: contact.name,
        number: contact.number,
      }));
      formattedContacts = formattedContacts.filter(
        (contact) => contact.server === "c.us"
      );
      if (formattedContacts.length === 0) {
        res.status(404).json({ message: "No contacts found" });
      }

      await db.insert(contacts).values(formattedContacts);

      res.status(200).json({
        message: "Contacts inserted into database",
      });
    } catch (error) {
      console.error("Error fetching contacts:", error);
      return [];
    }
  }
}
