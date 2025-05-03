import { randomUUID } from "crypto";
import { Router, Request, Response } from "express";
import {
  putItem,
  queryItems,
  updateItem,
  BaseItem,
  stripBaseItem,
} from "@helpers/ddb";
import * as ROUTES from "@apiRoutes";
import { JournalEntry } from "@src-types/journal/journal.types";
import {
  Locals,
  ErrorResponse,
  JournalSaveEntryBody,
} from "@src-types/journal/api.types";

export default (router: Router) => {
  // * Save new/updated journal entry
  router.post(
    ROUTES.JOURNAL_SAVE_ENTRY,
    async (
      req: Request<{}, JournalEntry, JournalSaveEntryBody, {}, {}>,
      res: Response<JournalEntry | ErrorResponse, Locals>
    ) => {
      // 1. I need to check if there is an entry for this specific date and user - Not ID, but date
      // actually for simplicity we can send optional ID and then we don't need to check for entry every time small change is saved
      let isNewEntry: boolean = !req.body.id;
      let existingEntry: JournalEntry & BaseItem;
      const newDate = new Date().toISOString();

      // 2. we need to verify if date is actually present in the body
      if (!req.body.values) {
        res
          .status(400)
          .send({ error: "No data provided in the request body." });
        return;
      }

      if (isNewEntry) {
        // No ID provided but we still need to check if there is an entry for this date
        try {
          existingEntry = (
            await queryItems<JournalEntry & BaseItem>(
              process.env.DYNAMODB_TABLE_NAME!,
              `USER#${res.locals.user.sub}#ENTRIES`,
              `DATE#${req.body.date}`
            )
          )?.[0];
        } catch (error) {
          res.status(500).send({
            message: "Failed to fetch the entry.",
            error: error as string,
          });
          return;
        }
        if (existingEntry) {
          // Entry already exists for this date, so we should update it instead of creating a new one
          isNewEntry = false;
        }
      }
      if (isNewEntry) {
        // 3. Now we can be sure that the entry is new, so we can create it
        const newEntry: JournalEntry & BaseItem = {
          PK: `USER#${res.locals.user.sub}#ENTRIES`,
          SK: `DATE#${req.body.date}`,
          userId: res.locals.user.sub,
          id: randomUUID(),
          date: req.body.date,
          values: req.body.values,
          createdAt: newDate,
          updatedAt: newDate,
        };
        try {
          await putItem(process.env.DYNAMODB_TABLE_NAME!, newEntry);
          res.status(201).send(stripBaseItem(newEntry));
          return;
        } catch (error) {
          res.status(500).send({
            message: "Failed to save the entry.",
            error: error as string,
          });
          return;
        }
      }
      // 4. Entry already exists, so we need to update it
      const newParams = { values: req.body.values, updatedAt: newDate };
      try {
        const newEntry = await updateItem<JournalEntry & BaseItem>(
          process.env.DYNAMODB_TABLE_NAME!,
          {
            PK: `USER#${res.locals.user.sub}#ENTRIES`,
            SK: `DATE#${req.body.date}`,
          },
          newParams
        );
        res.status(200).send(stripBaseItem(newEntry));
        ``;
        return;
      } catch (error) {
        res.status(500).send({
          message: "Failed to update the entry.",
          error: error as string,
        });
        return;
      }
    }
  );

  // * Fetch journal entry for a specific date
  router.get(
    ROUTES.JOURNAL_FETCH_ENTRY,
    async (
      req: Request<{ date: string }, JournalEntry, {}, {}>,
      res: Response<JournalEntry | ErrorResponse, Locals>
    ) => {
      const { date } = req.params;
      if (!date) {
        res.status(400).send({ error: "No date provided in the request." });
        return;
      }
      try {
        const entry = await queryItems<JournalEntry & BaseItem>(
          process.env.DYNAMODB_TABLE_NAME!,
          `USER#${res.locals.user.sub}#ENTRIES`,
          `DATE#${date}`
        );
        if (entry.length === 0) {
          res.status(404).send({ error: "No entry found for this date." });
          return;
        }
        res.status(200).send(stripBaseItem(entry[0]));
      } catch (error) {
        res.status(500).send({
          message: "Failed to fetch the entry.",
          error: error as string,
        });
      }
    }
  );

  // * Fetch the first entry date for the user
  router.get(
    ROUTES.JOURNAL_FETCH_FIRST_ENTRY_DATE,
    async (
      _req: Request<{}, { date: string }, {}, {}>,
      res: Response<{ date: string } | ErrorResponse, Locals>
    ) => {
      try {
        const entry = await queryItems<JournalEntry & BaseItem>(
          process.env.DYNAMODB_TABLE_NAME!,
          `USER#${res.locals.user.sub}#ENTRIES`,
          "DATE#",
          { Limit: 1, ScanIndexForward: true }
        );
        if (entry.length === 0) {
          res.status(404).send({ error: "No entry found for this user." });
          return;
        }
        res.status(200).send({ date: stripBaseItem(entry[0]).date });
      } catch (error) {
        res.status(500).send({
          message: "Failed to fetch the entry.",
          error: error as string,
        });
      }
    }
  );
};
