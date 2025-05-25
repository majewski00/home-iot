import { Router, Request, Response } from "express";
import { v4 as uuidv4 } from "uuid";

import {
  putItem,
  queryItems,
  updateItem,
  BaseItem,
  stripBaseItem,
} from "@helpers/ddb";
import * as ROUTES from "@apiRoutes";
import { Journal } from "@src-types/journal/journal.types";
import {
  Locals,
  ErrorResponse,
  JournalSaveStructureBody,
} from "@src-types/journal/api.types";
import logger from "../utils/logger";

/**
 * Converts a date to YYYY-MM-DD format
 */
const toDateString = (date: Date | string): string => {
  const d = new Date(date);
  return d.toISOString().split("T")[0];
};

/**
 * Gets current date in YYYY-MM-DD format
 */
const getCurrentDateString = (): string => {
  return toDateString(new Date());
};

/**
 * Gets current timestamp in ISO format for createdAt/updatedAt
 */
const getCurrentTimestamp = (): string => {
  return new Date().toISOString();
};

export default (router: Router) => {
  // * Save new/updated journal Structure
  router.post(
    ROUTES.JOURNAL_SAVE_STRUCTURE,
    async (
      req: Request<{}, Journal, JournalSaveStructureBody, {}, {}>,
      res: Response<Journal | ErrorResponse, Locals>
    ) => {
      const routeLogger = logger.withContext({
        route: ROUTES.JOURNAL_SAVE_STRUCTURE,
        userId: res.locals.user.sub,
      });

      routeLogger.info("Saving journal structure");

      // Use YYYY-MM-DD format for SK and effectiveFrom
      const effectiveDate = req.body.currentDate
        ? toDateString(req.body.currentDate)
        : getCurrentDateString();

      // Use ISO timestamp for createdAt/updatedAt
      const currentTimestamp = getCurrentTimestamp();

      const hasDeletedElements =
        req.body.deletedElements &&
        ((req.body.deletedElements.groups &&
          req.body.deletedElements.groups.length > 0) ||
          (req.body.deletedElements.fields &&
            req.body.deletedElements.fields.length > 0) ||
          (req.body.deletedElements.fieldTypes &&
            req.body.deletedElements.fieldTypes.length > 0));

      try {
        // Query for active structure
        routeLogger.debug("Querying for existing structures");
        const existingStructures = await queryItems<Journal & BaseItem>(
          process.env.DYNAMODB_TABLE_NAME!,
          `USER#${res.locals.user.sub}#STRUCTURE`,
          "STRUCTURE#"
        );

        const activeStructure = existingStructures?.find((s) => s.isActive);

        if (activeStructure) {
          routeLogger.info("Active structure found");

          // If elements were deleted, create a new version
          if (hasDeletedElements) {
            routeLogger.info(
              "Elements were deleted, creating new structure version"
            );

            // 1. Deactivate current structure
            await updateItem<Journal & BaseItem>(
              process.env.DYNAMODB_TABLE_NAME!,
              {
                PK: activeStructure.PK,
                SK: activeStructure.SK,
              },
              { isActive: false, updatedAt: currentTimestamp }
            );

            // 2. Create new active structure
            const newStructureId = uuidv4();
            const newStructure: Journal & BaseItem = {
              PK: `USER#${res.locals.user.sub}#STRUCTURE`,
              SK: `STRUCTURE#${effectiveDate}`, // YYYY-MM-DD format
              userId: res.locals.user.sub,
              structureId: newStructureId,
              isActive: true,
              effectiveFrom: effectiveDate, // YYYY-MM-DD format
              groups: req.body.groups,
              createdAt: currentTimestamp,
              updatedAt: currentTimestamp,
            };

            await putItem(process.env.DYNAMODB_TABLE_NAME!, newStructure);

            routeLogger.info("New structure version created successfully");
            res.status(201).send(stripBaseItem(newStructure));
          } else {
            // Just update existing structure - no version change needed
            routeLogger.info(
              "Updating existing structure - no deletion detected"
            );
            const updatedStructure = await updateItem<Journal & BaseItem>(
              process.env.DYNAMODB_TABLE_NAME!,
              {
                PK: activeStructure.PK,
                SK: activeStructure.SK,
              },
              {
                groups: req.body.groups,
                updatedAt: currentTimestamp,
              }
            );

            routeLogger.info("Structure updated successfully");
            res.status(200).send(stripBaseItem(updatedStructure));
          }
        } else {
          // First time creating structure
          routeLogger.info("Creating first structure");
          const newStructureId = uuidv4();
          const newStructure: Journal & BaseItem = {
            PK: `USER#${res.locals.user.sub}#STRUCTURE`,
            SK: `STRUCTURE#${effectiveDate}`, // YYYY-MM-DD format
            userId: res.locals.user.sub,
            structureId: newStructureId,
            isActive: true,
            effectiveFrom: effectiveDate, // YYYY-MM-DD format
            groups: req.body.groups,
            createdAt: currentTimestamp,
            updatedAt: currentTimestamp,
          };

          await putItem(process.env.DYNAMODB_TABLE_NAME!, newStructure);

          routeLogger.info("Structure created successfully");
          res.status(201).send(stripBaseItem(newStructure));
        }
      } catch (error) {
        routeLogger.error("Failed to save structure", { error });
        res.status(500).send({
          message: "Failed to save the structure.",
          error: error as string,
        });
      }
    }
  );

  // * Get journal structure (current active structure)
  router.get(
    ROUTES.JOURNAL_FETCH_STRUCTURE,
    async (
      req: Request<{ date: string }, Journal, {}, {}, {}>,
      res: Response<Journal | ErrorResponse, Locals>
    ) => {
      const routeLogger = logger.withContext({
        route: ROUTES.JOURNAL_FETCH_STRUCTURE,
        userId: res.locals.user.sub,
      });

      const targetDate = req.params.date;
      if (!targetDate) {
        routeLogger.error("No date provided in path parameters");
        res.status(400).send({
          message: "Date path parameter is required.",
        });
        return;
      }

      // Ensure target date is in YYYY-MM-DD format
      const normalizedTargetDate = toDateString(targetDate);
      routeLogger.info("Fetching journal structure", {
        targetDate: normalizedTargetDate,
      });

      try {
        const structures = await queryItems<Journal & BaseItem>(
          process.env.DYNAMODB_TABLE_NAME!,
          `USER#${res.locals.user.sub}#STRUCTURE`,
          "STRUCTURE#"
        );

        if (!structures || structures.length === 0) {
          routeLogger.info("No structure found");
          res.status(404).send({
            message: "No structure found.",
          });
          return;
        }

        if (structures.length === 1) {
          routeLogger.info("Only one structure found, returning it");
          res.status(200).send(stripBaseItem(structures[0]));
          return;
        }

        // Sort structures by effectiveFrom date (newest first)
        const sortedStructures = structures.sort((a, b) => {
          // Since effectiveFrom is now in YYYY-MM-DD format, we can compare strings directly
          const dateA = a.effectiveFrom as string;
          const dateB = b.effectiveFrom as string;
          return dateB.localeCompare(dateA);
        });

        // Find the first structure that was effective before or on the target date
        const applicableStructure = sortedStructures.find((s) => {
          const effectiveDate = s.effectiveFrom as string;
          // Compare YYYY-MM-DD strings directly
          return effectiveDate <= normalizedTargetDate;
        });

        if (applicableStructure) {
          routeLogger.info("Returning historical structure", {
            effectiveFrom: applicableStructure.effectiveFrom,
            structureId: applicableStructure.structureId,
          });
          res.status(200).send(stripBaseItem(applicableStructure));
        } else {
          routeLogger.info("No applicable structure found for date", {
            targetDate: normalizedTargetDate,
          });
          // If no applicable structure is found, return the oldest one
          const oldestStructure = sortedStructures[sortedStructures.length - 1];
          routeLogger.info("Returning the oldest structure", {
            effectiveFrom: oldestStructure.effectiveFrom,
            structureId: oldestStructure.structureId,
          });
          res.status(200).send(stripBaseItem(oldestStructure));
        }
      } catch (error) {
        routeLogger.error("Failed to fetch structure", { error });
        res.status(500).send({
          message: "Failed to fetch the structure.",
          error: error as string,
        });
      }
    }
  );
};
