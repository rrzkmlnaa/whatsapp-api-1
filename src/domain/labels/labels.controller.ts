import { Request, Response } from "express";
import { client } from "../../wa";
import { db } from "../../config/database/database";
import { labels } from "./labels.schema";
import { eq } from "drizzle-orm";

export class LabelsController {
  static async getLabels(_req: Request, res: Response) {
    const { labelId } = _req.query;

    const labelIdString = typeof labelId === "string" ? labelId : "";

    try {
      let contactData;

      if (labelIdString) {
        // Fetch labels that match the given labelIdString
        contactData = await db.query.labels.findMany({
          where: eq(labels.id, parseInt(labelIdString)),
        });
      } else {
        // Fetch all labels if labelId is not provided
        contactData = await db.query.labels.findMany();
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

  static async initLabels(_req: Request, res: Response) {
    try {
      const labelsData = await client.getLabels();

      if (labelsData.length === 0) {
        return { message: "No Labels found" };
      }

      let formattedLabels = labelsData.map((label) => ({
        id: parseInt(label.id),
        name: label.name,
      }));

      if (formattedLabels.length === 0) {
        res.status(404).json({ message: "No Labels found" });
      }

      await db.insert(labels).values(formattedLabels);

      res.status(200).json({
        message: "Labels inserted into database",
      });
    } catch (error) {
      console.error("Error fetching Labels:", error);
      return [];
    }
  }
}
