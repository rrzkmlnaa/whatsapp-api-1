import { Request, Response } from "express";
import { client } from "../../wa";
import { db } from "../../config/database/database";
import { messages } from "./messages.schema";
import { formatTimestampToAsiaJakarta } from "../../helper";
import { eq } from "drizzle-orm";
import { contacts } from "../contacts/contacts.schema";

export class MessagesController {
  static async getMessages(req: Request, res: Response): Promise<Response> {
    const { contactId } = req.query;

    // Convert contactId to string if it is present
    const contactIdString = typeof contactId === "string" ? contactId : "";

    try {
      // Construct the query
      const queryOptions: any = {
        with: {
          messages: true,
        },
      };

      // Add where clause only if contactId is provided
      if (contactIdString) {
        queryOptions.where = eq(contacts.id, parseInt(contactIdString));
      }

      // Execute the query
      const messages = await db.query.contacts.findMany(queryOptions);

      // Handle no messages found
      if (messages.length === 0) {
        return res.status(404).json({ message: "No messages found" });
      }

      // Return found messages
      return res.status(200).json(messages);
    } catch (error) {
      console.error("Error fetching messages:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  }

  static async getMessagesWithLabel(req: Request, res: Response) {
    const { labelId } = req.query;

    // Ambil pesan dari WhatsApp berdasarkan label ID
    const messages = await client.getChatsByLabelId(labelId?.toString() ?? "");

    if (messages.length === 0) {
      return res.status(404).json({ message: "No messages found" });
    }

    return res.status(200).json(messages);
  }

  static async initMessages(_req: Request, res: Response) {
    try {
      // Ambil semua kontak dari database
      const phoneNumbers = await db.query.contacts.findMany();
      const allFormattedMessages: any[] = []; // Array untuk menyimpan semua pesan yang diformat

      // Loop melalui setiap kontak
      for (const contact of phoneNumbers) {
        const phoneNumber = contact.number;

        try {
          // Dapatkan chat dari WhatsApp berdasarkan nomor telepon
          const chat = await client.getChatById(`${phoneNumber}@c.us`);

          // Ambil semua pesan dari chat
          const message = await chat.fetchMessages({
            limit: 100000000,
          });

          // Format pesan
          const formattedMessages = message.map((msg: any) => ({
            information: {
              id: msg.id.id,
              fromMe: msg.fromMe,
              viewed: msg._data.viewed,
              from: msg.from,
              to: msg.to,
              timestamp: formatTimestampToAsiaJakarta(msg.timestamp),
              type: msg.type,
            },
            message: msg.body,
          }));

          // Simpan pesan yang diformat ke dalam array utama
          allFormattedMessages.push(...formattedMessages);

          // Simpan ke dalam database (kode ini masih dikomentari, bisa diaktifkan jika diperlukan)
          await db.insert(messages).values({
            contactId: contact.id,
            message: formattedMessages, // Pastikan ini dalam format JSON yang sesuai
          });
        } catch (err) {
          console.error(
            `Gagal mendapatkan chat untuk nomor ${phoneNumber}:`,
            err
          );
          return res.status(500).json({
            message: `Failed to get chat for number ${phoneNumber}`,
          });
        }
      }

      // Kirim respons sukses dengan semua pesan yang diformat
      res.status(200).json({
        message: "Messages inserted into database",
      });
    } catch (error) {
      console.error("Error during message insertion:", error);
      res.status(500).json({
        message: "Failed to insert messages",
      });
    }
  }
}
