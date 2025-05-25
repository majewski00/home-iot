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
import logger from "../utils/logger";

export default (router: Router) => {
  // * Save new/updated journal entry
  router.post(
    ROUTES.JOURNAL_SAVE_ENTRY,
    async (
      req: Request<{}, JournalEntry, JournalSaveEntryBody, {}, {}>,
      res: Response<JournalEntry | ErrorResponse, Locals>
    ) => {
      const routeLogger = logger.withContext({
        route: ROUTES.JOURNAL_SAVE_ENTRY,
        userId: res.locals.user.sub,
        entryDate: req.body.date,
      });

      routeLogger.info("Saving journal entry");

      let existingEntry: JournalEntry & BaseItem;
      let isNewEntry = true;
      const newDate = new Date().toISOString();

      try {
        routeLogger.debug("Checking if entry already exists");
        existingEntry = (
          await queryItems<JournalEntry & BaseItem>(
            process.env.DYNAMODB_TABLE_NAME!,
            `USER#${res.locals.user.sub}#ENTRIES`,
            `DATE#${req.body.date}`
          )
        )?.[0];
        if (existingEntry) {
          isNewEntry = false;
          routeLogger.debug("Entry already exists, will update");
        } else {
          routeLogger.debug("No existing entry found, will create new");
        }
      } catch (error) {
        routeLogger.error("Failed to fetch entry for pre-save check", {
          error,
        });
        res.status(500).send({
          message: "Failed to fetch the entry.",
          error: error as string,
        });
        return;
      }

      // Get active structure to assign structureId
      let activeStructureId: string;
      try {
        routeLogger.debug("Fetching active structure for structureId");
        const structures = await queryItems<
          { structureId: string; isActive: boolean } & BaseItem
        >(
          process.env.DYNAMODB_TABLE_NAME!,
          `USER#${res.locals.user.sub}#STRUCTURE`,
          "STRUCTURE#"
        );

        const activeStructure = structures?.find((s) => s.isActive);
        if (!activeStructure) {
          routeLogger.error("No active structure found");
          res.status(400).send({
            message:
              "No active journal structure found. Please create a structure first.",
          });
          return;
        }

        activeStructureId = activeStructure.structureId;
        routeLogger.debug("Active structure found", {
          structureId: activeStructureId,
        });
      } catch (error) {
        routeLogger.error("Failed to fetch active structure", { error });
        res.status(500).send({
          message: "Failed to fetch journal structure.",
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
          structureId: activeStructureId,
          values: req.body.values,
          createdAt: newDate,
          updatedAt: newDate,
        };

        routeLogger.debug("Creating new entry", {
          valuesCount: req.body.values.length,
          structureId: activeStructureId,
        });

        try {
          await putItem(process.env.DYNAMODB_TABLE_NAME!, newEntry);
          routeLogger.info("Entry created successfully");
          res.status(201).send(stripBaseItem(newEntry));
          return;
        } catch (error) {
          routeLogger.error("Failed to save new entry", { error });
          res.status(500).send({
            message: "Failed to save the entry.",
            error: error as string,
          });
          return;
        }
      } else {
        const newParams = {
          values: req.body.values,
          updatedAt: newDate,
        };

        routeLogger.debug("Updating existing entry", {
          valuesCount: req.body.values.length,
          structureId: activeStructureId,
        });

        try {
          const newEntry = await updateItem<JournalEntry & BaseItem>(
            process.env.DYNAMODB_TABLE_NAME!,
            {
              PK: `USER#${res.locals.user.sub}#ENTRIES`,
              SK: `DATE#${req.body.date}`,
            },
            newParams
          );
          routeLogger.info("Entry updated successfully");
          res.status(200).send(stripBaseItem(newEntry));
          return;
        } catch (error) {
          routeLogger.error("Failed to update entry", { error });
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
      const routeLogger = logger.withContext({
        route: ROUTES.JOURNAL_FETCH_ENTRY,
        userId: res.locals.user.sub,
        entryDate: date,
      });

      routeLogger.info("Fetching journal entry");

      if (!date) {
        routeLogger.warn("No date provided in request");
        res.status(400).send({ message: "No date provided in the request." });
        return;
      }

      try {
        routeLogger.debug("Querying DynamoDB for entry");
        const existingEntry = (
          await queryItems<JournalEntry & BaseItem>(
            process.env.DYNAMODB_TABLE_NAME!,
            `USER#${res.locals.user.sub}#ENTRIES`,
            `DATE#${date}`
          )
        )?.[0];

        if (!existingEntry) {
          routeLogger.info("No entry found, returning empty template");

          // Get active structure for empty template
          try {
            const structures = await queryItems<
              { structureId: string; isActive: boolean } & BaseItem
            >(
              process.env.DYNAMODB_TABLE_NAME!,
              `USER#${res.locals.user.sub}#STRUCTURE`,
              "STRUCTURE#"
            );

            const activeStructure = structures?.find((s) => s.isActive);
            if (!activeStructure) {
              res.status(400).send({
                message: "No active journal structure found.",
              });
              return;
            }

            res.status(200).send({
              date,
              structureId: activeStructure.structureId,
              values: [],
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            } as JournalEntry);
            return;
          } catch (error) {
            routeLogger.error("Failed to fetch structure for empty template", {
              error,
            });
            res.status(500).send({
              message: "Failed to fetch journal structure.",
              error: error as string,
            });
            return;
          }
        } else {
          routeLogger.info("Entry found, returning to client");
          res.status(200).send(stripBaseItem(existingEntry));
        }
      } catch (error) {
        routeLogger.error("Failed to fetch entry", { error });
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
      const routeLogger = logger.withContext({
        route: ROUTES.JOURNAL_FETCH_FIRST_ENTRY_DATE,
        userId: res.locals.user.sub,
      });

      routeLogger.info("Fetching first entry date");

      try {
        routeLogger.debug("Querying DynamoDB for first entry");
        const entry = await queryItems<JournalEntry & BaseItem>(
          process.env.DYNAMODB_TABLE_NAME!,
          `USER#${res.locals.user.sub}#ENTRIES`,
          "DATE#",
          { Limit: 1, ScanIndexForward: true }
        );

        if (entry.length === 0) {
          routeLogger.info("No entries found for user");
          res.status(404).send({ message: "No entry found for this user." });
          return;
        }

        const firstDate = stripBaseItem(entry[0]).date;
        routeLogger.info("First entry date found", { firstDate });
        res.status(200).send({ date: firstDate });
      } catch (error) {
        routeLogger.error("Failed to fetch first entry date", { error });
        res.status(500).send({
          message: "Failed to fetch the entry.",
          error: error as string,
        });
      }
    }
  );
};
