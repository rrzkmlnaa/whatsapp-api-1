import { Request, Response } from "express";
import { db } from "../../config/database/database";
import { groups } from "./group.schema";
import { eq } from "drizzle-orm";
import { groupContacts } from "../group-contacts/groupContacts.schema";

export class GroupController {
  static async index(req: Request, res: Response) {
    try {
      const data = await db.select().from(groups);

      return res.status(200).json(data);
    } catch (error) {
      return res.status(500).json({ error: "Internal server error" });
    }
  }

  static async store(req: Request, res: Response) {
    const { name } = req.body;

    if (!name) {
      return res.status(400).json({ error: "Name is required" });
    }

    try {
      await db.insert(groups).values({ name });

      return res.status(201).json({ message: "Group created successfully" });
    } catch (error) {
      return res.status(500).json({ error: "Internal server error" });
    }
  }

  static async destroy(req: Request, res: Response) {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ error: "Id is required" });
    }

    try {
      await db.delete(groups).where(eq(groups.id, parseInt(id)));

      return res.status(200).json({ message: "Group deleted successfully" });
    } catch (error) {
      return res.status(500).json({ error: "Internal server error" });
    }
  }

  static async getGroupContacts(req: Request, res: Response) {
    const { groupId } = req.query;

    const groupIdString = groupId?.toString() ?? "0";

    if (!groupId) {
      return res.status(400).json({ message: "groupId is required" });
    }

    try {
      const groupContactsData = await db.query.groupContacts.findMany({
        where: eq(groupContacts.groupId, parseInt(groupIdString)),
        with: {
          contact: true,
          group: true,
        },
      });

      return res.status(200).json(groupContactsData);
    } catch (error) {
      console.error("Error fetching group contacts:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  }
}
