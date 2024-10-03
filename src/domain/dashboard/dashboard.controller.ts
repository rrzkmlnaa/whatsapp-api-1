import { Request, Response } from "express";
import { db } from "../../config/database/database";
import { and, between, count, eq, sql } from "drizzle-orm";
import { contacts } from "../contacts/contacts.schema";
import { messages } from "../messages/messages.schema";
import { labels } from "../labels/labels.schema";
import { groups } from "../groups/group.schema";
import { extractPhoneNumber } from "../../helper";
import { contactLabels } from "../contact-labels/contactsLabels.schema";

const sevenDaysAgo = sql`DATE_SUB(CURDATE(), INTERVAL 7 DAY)`;
const today = sql`CURDATE()`;

// Extract the numeric phone number from the JSON field
const phoneNumberPath = "$[0].information.to";
const phoneNumberQuery = sql`REPLACE(REPLACE(REPLACE(
    JSON_UNQUOTE(JSON_EXTRACT(${messages.message}, ${phoneNumberPath})),
    '@c.us', ''), '+', ''), '-', '')`;

export class DashboardController {
  static async index(_req: Request, res: Response) {
    try {
      // count contacts
      const totalContactResult = await db
        .select({ count: count() })
        .from(contacts);
      const totalContact = totalContactResult[0]?.count || 0;

      // count messages
      const totalMessageResult = await db
        .select({ count: count() })
        .from(messages)
        .where(sql`JSON_LENGTH(${messages.message}) != 0`);
      const totalMessage = totalMessageResult[0]?.count || 0;

      // count labels
      const totalLabelResult = await db.select({ count: count() }).from(labels);
      const totalLabel = totalLabelResult[0]?.count || 0;

      // count groups
      const totalGroupResult = await db.select({ count: count() }).from(groups);
      const totalGroup = totalGroupResult[0]?.count || 0;

      // count new message today
      const newMessagesToday = await db
        .select({ count: count() })
        .from(messages)
        .where(
          sql`DATE(STR_TO_DATE(
            JSON_UNQUOTE(JSON_EXTRACT(${messages.message}, '$[last].information.timestamp')),
            '%d/%m/%Y, %H.%i.%s'
          )) = CURDATE() AND JSON_UNQUOTE(JSON_EXTRACT(${messages.message}, '$[last].information.fromMe')) = 'false'`
        );
      const totalNewMessageToday = newMessagesToday[0]?.count || 0;

      // count message today and fromMe true
      const newMessagesTodayFromMe = await db
        .select({ count: count() })
        .from(messages)
        .where(
          sql`DATE(STR_TO_DATE(
            JSON_UNQUOTE(JSON_EXTRACT(${messages.message}, '$[last].information.timestamp')),
            '%d/%m/%Y, %H.%i.%s'
          )) = CURDATE() AND JSON_UNQUOTE(JSON_EXTRACT(${messages.message}, '$[last].information.fromMe')) = 'true'`
        );
      const totalMessageTodayFromMe = newMessagesTodayFromMe[0]?.count || 0;

      // count all message today
      const allMessageToday = await db
        .select({ count: count() })
        .from(messages)
        .where(
          sql`DATE(STR_TO_DATE(
            JSON_UNQUOTE(JSON_EXTRACT(${messages.message}, '$[last].information.timestamp')),
            '%d/%m/%Y, %H.%i.%s'
          )) = CURDATE()`
        );
      const totalAllMessageToday = allMessageToday[0]?.count || 0;

      // get message range from 7 days ago and current date
      const messages7DaysAgo = await db
        .select()
        .from(messages)
        .innerJoin(contacts, eq(phoneNumberQuery, contacts.number))
        .where(
          between(
            sql`DATE_FORMAT(
                STR_TO_DATE(
                  JSON_UNQUOTE(JSON_EXTRACT(${messages.message}, '$[last].information.timestamp')),
                  '%d/%m/%Y, %H.%i.%s'
                ),
                '%Y-%m-%d'
              )`,
            sevenDaysAgo,
            today
          )
        )
        .execute();

      // format message for get last message only
      const lastMessages7DaysAgo = messages7DaysAgo.map((message: any) => ({
        hasFollowUp:
          message.messages.message[message.messages.message.length - 1]
            .information.fromMe,
        contact: message.contacts,
        message: message.messages.message[message.messages.message.length - 1],
      }));

      // Get messages range from 00:01 WIB to 11:59 WIB
      const messagesMorning = await db
        .select()
        .from(messages)
        .innerJoin(contacts, eq(phoneNumberQuery, contacts.number))
        .where(
          and(
            sql`DATE(STR_TO_DATE(
                JSON_UNQUOTE(JSON_EXTRACT(${messages.message}, '$[last].information.timestamp')),
                '%d/%m/%Y, %H.%i.%s'
            )) = CURDATE()`,
            sql`TIME(STR_TO_DATE(
                JSON_UNQUOTE(JSON_EXTRACT(${messages.message}, '$[last].information.timestamp')),
                '%d/%m/%Y, %H.%i.%s'
            )) BETWEEN '00:00:00' AND '11:59:59'`
          )
        )
        .execute();

      // format messages morning for get last message only
      const lastMessagesMorningAgo = messagesMorning.map((message: any) => ({
        hasFollowUp:
          message.messages.message[message.messages.message.length - 1]
            .information.fromMe,
        contact: message.contacts,
        message: message.messages.message[message.messages.message.length - 1],
      }));

      // Get messages range from 12:00 WIB to 15:59 WIB
      const messagesAfternoon = await db
        .select()
        .from(messages)
        .innerJoin(contacts, eq(phoneNumberQuery, contacts.number))
        .where(
          sql`DATE(
            STR_TO_DATE(
              JSON_UNQUOTE(JSON_EXTRACT(${messages.message}, '$[last].information.timestamp')),
              '%d/%m/%Y, %H.%i.%s'
            )
          ) = CURRENT_DATE
          AND TIME(
            STR_TO_DATE(
              JSON_UNQUOTE(JSON_EXTRACT(${messages.message}, '$[last].information.timestamp')),
              '%d/%m/%Y, %H.%i.%s'
            )
          ) BETWEEN '12:00:00' AND '15:59:59'`
        )
        .execute();

      // format messages afternoon for get last message only
      const lastMessagesAfternoonAgo = messagesAfternoon.map(
        (message: any) => ({
          hasFollowUp:
            message.messages.message[message.messages.message.length - 1]
              .information.fromMe,
          contact: message.contacts,
          message:
            message.messages.message[message.messages.message.length - 1],
        })
      );

      // Get messages range from 16:00 WIB to 18:59 WIB
      const messagesEvening = await db
        .select()
        .from(messages)
        .innerJoin(contacts, eq(phoneNumberQuery, contacts.number))
        .where(
          sql`DATE(
            STR_TO_DATE(
              JSON_UNQUOTE(JSON_EXTRACT(${messages.message}, '$[last].information.timestamp')),
              '%d/%m/%Y, %H.%i.%s'
            )
          ) = CURRENT_DATE
          AND TIME(
            STR_TO_DATE(
              JSON_UNQUOTE(JSON_EXTRACT(${messages.message}, '$[last].information.timestamp')),
              '%d/%m/%Y, %H.%i.%s'
            )
          ) BETWEEN '16:00:00' AND '18:59:59'`
        )
        .execute();

      // format messages evening for get last message only
      const lastMessagesEveningAgo = messagesEvening.map((message: any) => ({
        hasFollowUp:
          message.messages.message[message.messages.message.length - 1]
            .information.fromMe,
        contact: message.contacts,
        message: message.messages.message[message.messages.message.length - 1],
      }));

      return res.status(200).json({
        totalContact,
        totalMessage,
        totalLabel,
        totalGroup,
        totalAllMessageToday,
        totalNewMessageToday,
        totalMessageTodayFromMe,
        lastMessages7DaysAgo,
        lastMessagesMorningAgo,
        lastMessagesAfternoonAgo,
        lastMessagesEveningAgo,
      });
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }
}
