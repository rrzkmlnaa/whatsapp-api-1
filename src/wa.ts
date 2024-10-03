import { Client, LocalAuth } from "whatsapp-web.js";
import qrcode from "qrcode";
import { io } from "./server";
import config from "../config";
import { Message } from "./types";
import { extractPhoneNumber, formatTimestampToAsiaJakarta } from "./helper";
import { db } from "./config/database/database";
import { contacts } from "./domain/contacts/contacts.schema";
import { messages } from "./domain/messages/messages.schema";
import { and, eq, inArray } from "drizzle-orm";
import { contactLabels } from "./domain/contact-labels/contactsLabels.schema";

export let qrBase64: string | null = null;
export let status: "ready" | "pending" | "unauthenticated" | "authenticated" =
  "pending";

export const client = new Client({
  authStrategy: new LocalAuth({ clientId: config.sessionName || "my-session" }),
  puppeteer: {
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  },
});

client.on("qr", async (qr) => {
  status = "unauthenticated";
  qrBase64 = await qrcode.toDataURL(qr);

  io.emit("status", status);
  io.emit("qr", qrBase64);
});

client.on("authenticated", (session) => {
  status = "authenticated";
  io.emit("status", status);
  io.emit("session", session);
});

client.on("ready", () => {
  status = "ready";
  io.emit("status", status);
  console.log("Client is ready!");
});

client.on("disconnected", () => {
  status = "unauthenticated";
  io.emit("status", status);
  client.initialize();
  console.log("Client was logged out!");
});

client.on("message", async (msg: Message) => {
  try {
    // Extract contact number from the message
    const contactNumber = extractPhoneNumber(msg._data.from);

    // Check if the contact already exists
    let contact = await db.query.contacts.findFirst({
      where: eq(contacts.number, contactNumber),
    });

    // Format the new message
    const formattedMessage = {
      information: {
        id: msg.id.id, // Unique ID of the message
        fromMe: msg.id.fromMe, // Indicates if the message was sent by the user
        viewed: msg._data.viewed, // Indicates if the message has been viewed
        from: msg._data.from, // Sender's phone number with WhatsApp suffix
        to: msg._data.to, // Receiver's phone number with WhatsApp suffix
        timestamp: formatTimestampToAsiaJakarta(msg.timestamp), // Formatted timestamp
        type: msg._data.type, // Type of the message (e.g., chat)
      },
      message: msg._data.body, // The actual message content
    };

    let contactId: number;

    if (!contact) {
      // Insert contact into the database if it does not exist
      const [newContact] = await db.insert(contacts).values({
        name: "Name Not Found",
        number: contactNumber,
      });
      contactId = newContact.insertId; // Use the new contact ID
      // Insert the new message into the database with the retrieved contact ID

      await db.insert(messages).values({
        message: [formattedMessage], // Store the actual message body
        contactId: contactId, // Use the contact ID from either new or existing contact
      });
    } else {
      // Use existing contact ID
      contactId = contact.id;

      // Fetch all contacts with their messages
      const messagesData = await db.query.messages.findMany({
        where: eq(messages.contactId, contactId),
      });

      // Extract the existing messages array (assuming messages are stored as an array in the database)
      let existingMessages: any =
        messagesData.length > 0 ? messagesData[0].message : [];

      // Check if the message is new
      const isNewMessage = !existingMessages.some(
        (message: any) =>
          message.information.id === formattedMessage.information.id
      );

      // If the message is new, add it to the existingMessages array
      if (isNewMessage) {
        existingMessages.push(formattedMessage);
      }

      // Update the messages array in the database
      await db
        .update(messages)
        .set({
          message: existingMessages,
        })
        .where(eq(messages.contactId, contactId));

      // update chat labels
      const contactLabelsData = await db.query.contactLabels.findMany({
        where: eq(contactLabels.contactId, contactId),
      });

      // new labels empty array
      const newLabels = [...contactLabelsData.map((label) => label.id)];

      // get chat label
      const chatLabels = await client.getChatLabels(msg.id.remote);

      // Check if the chat label is new
      const existingLabelIds = contactLabelsData.map((label) =>
        label.labelId.toString()
      );
      const newLabelIds = chatLabels.map((label: any) => label.id.toString());

      // Determine if any new labels exist
      const isNewLabel = !existingLabelIds.some((existingId) =>
        newLabelIds.includes(existingId)
      );

      if (isNewLabel) {
        // If there are new labels, add them to the newLabels array
        const labelsToAdd = newLabelIds.filter(
          (id) => !existingLabelIds.includes(id)
        );

        // Insert new labels into the database
        await Promise.all(
          labelsToAdd.map((labelId) =>
            db.insert(contactLabels).values({
              contactId: contactId,
              labelId: parseInt(labelId, 10),
            })
          )
        );
      } else {
        // If the chat label is not new, update the existing labels in the database

        // Find new labels to be added and existing labels to be removed
        const labelsToAdd = newLabelIds.filter(
          (id) => !existingLabelIds.includes(id)
        );
        const labelsToRemove = existingLabelIds.filter(
          (id) => !newLabelIds.includes(id)
        );

        // Insert new labels into the database
        if (labelsToAdd.length > 0) {
          await Promise.all(
            labelsToAdd.map((labelId) =>
              db.insert(contactLabels).values({
                contactId: contactId,
                labelId: parseInt(labelId, 10),
              })
            )
          );
        }

        // Remove labels from the database
        if (labelsToRemove.length > 0) {
          await db.delete(contactLabels).where(
            and(
              eq(contactLabels.contactId, contactId),
              inArray(
                contactLabels.labelId,
                labelsToRemove.map((id) => parseInt(id, 10))
              )
            )
          );
        }
      }
    }
  } catch (error) {
    // Log the error or handle it appropriately
    console.error(error);
  }
});

client.on("message_create", async (msg: Message) => {
  try {
    // Extract contact number from the message (use 'to' instead of 'from')
    const contactNumber = extractPhoneNumber(msg._data.to);
    const contact = await db.query.contacts.findFirst({
      where: eq(contacts.number, contactNumber),
    });

    if (contact) {
      // Search for an existing message based on the receiver's phone number
      const existingMessageData = await db.query.messages.findFirst({
        where: eq(messages.contactId, contact.id),
      });

      if (existingMessageData) {
        // Extract the existing messages array
        let existingMessages: any = existingMessageData.message;

        // Format the new message
        const formattedMessage = {
          information: {
            id: msg.id.id, // Unique ID of the message
            fromMe: msg.id.fromMe, // Indicates if the message was sent by the user
            viewed: msg._data.viewed, // Indicates if the message has been viewed
            from: msg._data.from, // Sender's phone number with WhatsApp suffix
            to: msg._data.to, // Receiver's phone number with WhatsApp suffix
            timestamp: formatTimestampToAsiaJakarta(msg.timestamp), // Formatted timestamp
            type: msg._data.type, // Type of the message (e.g., chat)
          },
          message: msg._data.body, // The actual message content
        };

        // Check if the message is new
        const isNewMessage = !existingMessages.some(
          (message: any) =>
            message.information.id === formattedMessage.information.id
        );

        // If the message is new, add it to the existingMessages array
        if (isNewMessage) {
          existingMessages.push(formattedMessage);

          // Update the messages array in the database
          await db
            .update(messages)
            .set({
              message: existingMessages,
            })
            .where(eq(messages.contactId, contact.id));
        }
      } else {
        console.log(`No existing messages found for contact: ${contactNumber}`);
        // You can handle cases where no messages are found, e.g., log it or take other actions
      }
    }
  } catch (error) {
    // Log the error or handle it appropriately
    console.error("Error processing message_create event:", error);
  }
});
