import { RequestHandler } from "express";
import { client } from "./wa";
import { formatTimestampToAsiaJakarta } from "./helper";

interface QueryParams {
  phoneNumber?: string;
  groupId?: string;
  contactWithGroup?: boolean;
  limit?: string; // Since query parameters are always strings, limit should be typed as string
}

export const indexRouteHandler: RequestHandler = (req, res) => {
  res.sendFile(__dirname + "/index.html");
};

export const sendRouteHandler: RequestHandler = async (req, res) => {
  const { to, text } = req.body;

  if (to && text) {
    await client.sendMessage(`${to}@s.whatsapp.net`, text);
    res.status(200).send("Message sent");
  } else {
    res.status(400).send("Invalid message");
  }
};

export const broadCastRouteHandler: RequestHandler = async (req, res) => {
  const { to, text } = req.body;

  if (to && text) {
    for (const contact of to) {
      await client.sendMessage(`${contact}@s.whatsapp.net`, text);
    }
    res.status(200).send("Message sent");
  } else {
    res.status(400).send("Invalid message");
  }
};

export const getMessages: RequestHandler = async (req, res) => {
  const { phoneNumber, limit = "100" } = req.query as QueryParams; // Explicitly type req.query

  if (!phoneNumber) {
    return res.status(400).send("Phone number is required");
  }

  try {
    // Get the chat by ID
    const chat = await client.getChatById(`${phoneNumber}@c.us`);

    // Fetch the messages from the chat
    const messages: any = await chat.fetchMessages({
      limit: limit ? parseInt(limit) : undefined,
    });

    // Process the messages as needed
    const formattedMessages = messages.map((msg: any) => ({
      information: {
        id: msg.id.id,
        fromMe: msg.fromMe,
        viewed: msg._data.viewed, // Use appropriate property for "viewed"
        from: msg.from,
        to: msg.to,
        timestamp: formatTimestampToAsiaJakarta(msg.timestamp),
        type: msg.type,
      },
      message: msg.body, // Use msg.body for the actual message text
      links: msg.links.map((link: any) => {
        // Use msg.links for the actual message text
        return {
          url: link.link,
        };
      }),
    }));

    // Send the messages as the response
    res.json(formattedMessages);
  } catch (error) {
    console.error("Error fetching messages:", error);
    res.status(500).send("Failed to fetch messages");
  }
};

export const getContacs: RequestHandler = async (req, res) => {
  // params
  const { contactWithGroup } = req.query as QueryParams;

  try {
    const contacts = await client.getContacts();

    // Process the contacts as needed
    const formattedContacts = contacts
      .filter((contact) =>
        contactWithGroup
          ? contact.id.server === "c.us" || contact.id.server === "g.us"
          : contact.id.server === "c.us"
      )
      .map((contact) => ({
        id: contact.id._serialized,
        name: contact.name ?? "Not available",
        number: contact.number,
        isMyContact: contact.isMyContact,
        isBusiness: contact.isBusiness,
        isMe: contact.isMe,
        isGroup: contact.isGroup,
        isWAContact: contact.isWAContact,
      }));

    res.send(formattedContacts);
  } catch (error) {
    console.error("Error fetching contacts:", error);
    res.status(500).send("Failed to fetch contacts");
  }
};

export const getMessagesGroup: RequestHandler = async (req, res) => {
  const { groupId, limit = "1000" } = req.query as QueryParams; // Explicitly type req.query

  if (!groupId) {
    return res.status(400).send("Name group is required");
  }

  try {
    // Get the chat by ID
    const chat = await client.getChatById(`${groupId}@g.us`);

    // Fetch the messages from the chat
    const messages: any = await chat.fetchMessages({
      limit: limit ? parseInt(limit) : undefined,
    });

    // Process the messages as needed
    const formattedMessages = messages.map((msg: any) => ({
      information: {
        id: msg._data.id.id,
        fromMe: msg._data.id.fromMe,
        viewed: msg._data.viewed, // Use appropriate property for "viewed"
        from: msg._data.author.user,
        to: msg._data.to.user,
        timestamp: formatTimestampToAsiaJakarta(msg._data.t),
        type: msg._data.type,
      },
      message: msg.body, // Use msg.body for the actual message text
      mentionsList: msg.mentionedJidList?.map((jid: any) => {
        return {
          id: jid.user,
        };
      }),
      links: msg.links.map((link: any) => {
        // Use msg.links for the actual message text
        return {
          url: link.link,
        };
      }),
    }));

    // Send the messages as the response
    res.json(formattedMessages);
  } catch (error) {
    console.error("Error fetching messages:", error);
    res.status(500).send("Failed to fetch messages");
  }
};

export const getLocation: RequestHandler = async (req, res) => {
  try {
    const { phoneNumber } = req.query as QueryParams;

    if (!phoneNumber) {
      return res.status(400).send("Phone number is required");
    }

    const chat = await client.getChatById(`${phoneNumber}@c.us`);
  } catch (error) {}
};
