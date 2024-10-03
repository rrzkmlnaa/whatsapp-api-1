import { Request, Response } from "express";
import { client } from "../../wa";
import { db } from "../../config/database/database";
import { groupContacts } from "./groupContacts.schema";
import { eq } from "drizzle-orm";
import { contacts } from "../contacts/contacts.schema";

export class ContactsController {
  static async index(req: Request, res: Response) {
    return res.json(await db.select().from(groupContacts));
  }

  static async store(req: Request, res: Response) {
    const { groupId, contactId } = req.body;

    if (!groupId || !contactId) {
      return res.status(400).json({
        message: "groupId and contactId are required",
      });
    }

    try {
      await db.insert(groupContacts).values({
        groupId,
        contactId,
      });

      return res.status(201).json({
        message: "Contact added to group",
      });
    } catch (error) {
      return res.status(500).json({
        message: "Error adding contact to group",
      });
    }
  }
}
