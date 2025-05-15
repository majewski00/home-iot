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
      let existingEntry: JournalEntry & BaseItem;
      let isNewEntry = true;
      const newDate = new Date().toISOString();

      try {
        existingEntry = (
          await queryItems<JournalEntry & BaseItem>(
            process.env.DYNAMODB_TABLE_NAME!,
            `USER#${res.locals.user.sub}#ENTRIES`,
            `DATE#${req.body.date}`
          )
        )?.[0];
        if (existingEntry) {
          isNewEntry = false;
        }
      } catch (error) {
        res.status(500).send({
          message: "Failed to fetch the entry.",
          error: error as string,
        });
        return;
      }

      if (isNewEntry) {
        const newEntry: JournalEntry & BaseItem = {
          PK: `USER#${res.locals.user.sub}#ENTRIES`,
          SK: `DATE#${req.body.date}`,
          userId: res.locals.user.sub,
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
      } else {
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
          return;
        } catch (error) {
          res.status(500).send({
            message: "Failed to update the entry.",
            error: error as string,
          });
          return;
        }
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
        res.status(400).send({ message: "No date provided in the request." });
        return;
      }
      try {
        const existingEntry = (
          await queryItems<JournalEntry & BaseItem>(
            process.env.DYNAMODB_TABLE_NAME!,
            `USER#${res.locals.user.sub}#ENTRIES`,
            `DATE#${date}`
          )
        )?.[0];
        if (!existingEntry) {
          res.status(200).send({
            date,
            values: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          } as JournalEntry);
          return;
        } else {
          res.status(200).send(stripBaseItem(existingEntry));
        }
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
          res.status(404).send({ message: "No entry found for this user." });
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
