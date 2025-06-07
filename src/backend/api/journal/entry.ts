import { Router, Request, Response } from "express";
import {
  putItem,
  queryItems,
  updateItem,
  BaseItem,
  stripBaseItem,
} from "@helpers/ddb";
import * as ROUTES from "@apiRoutes";
import { JournalEntry, Journal } from "@src-types/journal/journal.types";
import {
  Locals,
  ErrorResponse,
  JournalSaveEntryBody,
  JournalQuickFillBody,
  JournalQuickFillResponse,
} from "@src-types/journal/api.types";
import logger from "../utils/logger";

/**
 * Converts a date to YYYY-MM-DD format
 */
const toDateString = (date: Date | string): string => {
  const d = new Date(date);
  return d.toISOString().split("T")[0];
};

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
        routeLogger.debug("Fetching appropriate structure for entry date");
        const targetDate = toDateString(req.body.date);
        const structures = await queryItems<Journal & BaseItem>(
          process.env.DYNAMODB_TABLE_NAME!,
          `USER#${res.locals.user.sub}#STRUCTURE`,
          "STRUCTURE#"
        );

        if (!structures || structures.length === 0) {
          routeLogger.error("No structures found");
          res.status(400).send({
            message:
              "No journal structure found. Please create a structure first.",
          });
          return;
        }

        let applicableStructure: Journal & BaseItem;

        if (structures.length === 1) {
          applicableStructure = structures[0];
        } else {
          // Sort structures by effectiveFrom date (newest first)
          const sortedStructures = structures.sort((a, b) => {
            const dateA = a.effectiveFrom as string;
            const dateB = b.effectiveFrom as string;
            return dateB.localeCompare(dateA);
          });

          // Find the first structure that was effective before or on the target date
          const found = sortedStructures.find((s) => {
            const effectiveDate = s.effectiveFrom as string;
            return effectiveDate <= targetDate;
          });

          applicableStructure =
            found || sortedStructures[sortedStructures.length - 1];
        }

        activeStructureId = applicableStructure.structureId;
        routeLogger.debug("Applicable structure found", {
          structureId: activeStructureId,
          effectiveFrom: applicableStructure.effectiveFrom,
        });
      } catch (error) {
        routeLogger.error("Failed to fetch structure", { error });
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

  // * Fill today's entry with yesterday's values
  router.post(
    ROUTES.JOURNAL_QUICK_FILL,
    async (
      req: Request<{}, JournalQuickFillResponse, JournalQuickFillBody, {}>,
      res: Response<JournalQuickFillResponse | ErrorResponse, Locals>
    ) => {
      const routeLogger = logger.withContext({
        route: ROUTES.JOURNAL_QUICK_FILL,
        userId: res.locals.user.sub,
      });

      routeLogger.info("Filling today's entry with yesterday's values");

      const today = req.body.date;
      const targetDate = new Date(today);
      targetDate.setDate(targetDate.getDate() - 1);
      const yesterdayStr = targetDate.toISOString().split("T")[0];

      try {
        // 1. Get yesterday's entry
        const yesterdayEntries = await queryItems<JournalEntry & BaseItem>(
          process.env.DYNAMODB_TABLE_NAME!,
          `USER#${res.locals.user.sub}#ENTRIES`,
          `DATE#${yesterdayStr}`
        );

        if (yesterdayEntries.length === 0) {
          routeLogger.warn("No entry found for yesterday", {
            date: yesterdayStr,
          });
          res.status(404).send({ message: "No entry found for yesterday." });
          return;
        }

        const yesterdayEntry = yesterdayEntries[0];

        // 2. Get today's structure to validate field compatibility
        const todayStructures = await queryItems<Journal & BaseItem>(
          process.env.DYNAMODB_TABLE_NAME!,
          `USER#${res.locals.user.sub}#STRUCTURE`,
          "STRUCTURE#"
        );

        const activeStructure = todayStructures.find((s) => s.isActive);
        if (!activeStructure) {
          routeLogger.warn("No active structure found");
          res.status(404).send({ message: "No active structure found." });
          return;
        }

        // 3. Filter yesterday's values to only include fields that exist in today's structure
        const validFieldTypeIds = new Set<string>();
        activeStructure.groups.forEach((group) => {
          group.fields.forEach((field) => {
            field.fieldTypes.forEach((fieldType) => {
              validFieldTypeIds.add(fieldType.id);
            });
          });
        });

        const validValues = yesterdayEntry.values.filter((value) =>
          validFieldTypeIds.has(value.fieldTypeId)
        );

        routeLogger.debug("Filtered values for compatibility", {
          originalCount: yesterdayEntry.values.length,
          validCount: validValues.length,
        });

        // 4. Check if today's entry already exists
        const todayEntries = await queryItems<JournalEntry & BaseItem>(
          process.env.DYNAMODB_TABLE_NAME!,
          `USER#${res.locals.user.sub}#ENTRIES`,
          `DATE#${today}`
        );

        const currentTimestamp = new Date().toISOString();

        if (todayEntries.length > 0) {
          // Update existing entry
          const updatedEntry = await updateItem<JournalEntry & BaseItem>(
            process.env.DYNAMODB_TABLE_NAME!,
            {
              PK: `USER#${res.locals.user.sub}#ENTRIES`,
              SK: `DATE#${today}`,
            },
            {
              values: validValues.map((value) => ({
                ...value,
                updatedAt: currentTimestamp,
              })),
              updatedAt: currentTimestamp,
            }
          );

          routeLogger.info(
            "Successfully updated today's entry with yesterday's values"
          );
          res.status(200).send({
            success: true,
            entry: stripBaseItem(updatedEntry),
          });
        } else {
          // Create new entry
          const newEntry: JournalEntry & BaseItem = {
            PK: `USER#${res.locals.user.sub}#ENTRIES`,
            SK: `DATE#${today}`,
            userId: res.locals.user.sub,
            date: today,
            structureId: activeStructure.structureId,
            values: validValues.map((value) => ({
              ...value,
              createdAt: currentTimestamp,
              updatedAt: currentTimestamp,
            })),
            createdAt: currentTimestamp,
            updatedAt: currentTimestamp,
          };

          await putItem(process.env.DYNAMODB_TABLE_NAME!, newEntry);

          routeLogger.info(
            "Successfully created today's entry with yesterday's values"
          );
          res.status(201).send({
            success: true,
            entry: stripBaseItem(newEntry),
          });
        }
      } catch (error) {
        routeLogger.error("Failed to fill yesterday's values", { error });
        res.status(500).send({
          message: "Failed to fill yesterday's values.",
          error: error as string,
        });
      }
    }
  );
};
