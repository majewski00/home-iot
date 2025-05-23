import { Router, Request, Response } from "express";

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

      // 1. Verify if there is a structure of the journal in ddb
      let existingStructure: Journal & BaseItem;
      const newDate = new Date().toISOString();

      try {
        routeLogger.debug("Querying for existing structure");
        existingStructure = (
          await queryItems<Journal & BaseItem>(
            process.env.DYNAMODB_TABLE_NAME!,
            `USER#${res.locals.user.sub}#STRUCTURE`,
            "STRUCTURE#"
          )
        )?.[0];
      } catch (error) {
        routeLogger.error("Failed to fetch structure", { error });
        res.status(500).send({
          message: "Failed to fetch the structure.",
          error: error as string,
        });
        return;
      }
      if (existingStructure) {
        routeLogger.info("Updating existing structure");
        try {
          const newParams = { groups: req.body.groups, updatedAt: newDate };
          routeLogger.debug("Update parameters prepared", {
            groupsCount: req.body.groups.length,
          });

          const newEntry = await updateItem<Journal & BaseItem>(
            process.env.DYNAMODB_TABLE_NAME!,
            {
              PK: `USER#${res.locals.user.sub}#STRUCTURE`,
              SK: `STRUCTURE#`,
            },
            newParams
          );

          routeLogger.info("Structure updated successfully");
          res.status(200).send(stripBaseItem(newEntry));
        } catch (error) {
          routeLogger.error("Failed to update structure", { error });
          res.status(500).send({
            message: "Failed to update the structure.",
            error: error as string,
          });
          return;
        }
      } else {
        routeLogger.info("Creating new structure");
        try {
          const newParams: Journal & BaseItem = {
            PK: `USER#${res.locals.user.sub}#STRUCTURE`,
            SK: `STRUCTURE#`,
            userId: res.locals.user.sub,
            groups: req.body.groups,
            createdAt: newDate,
            updatedAt: newDate,
          };

          routeLogger.debug("Creation parameters prepared", {
            groupsCount: req.body.groups.length,
          });

          await putItem(process.env.DYNAMODB_TABLE_NAME!, newParams);

          routeLogger.info("Structure created successfully");
          res.status(201).send(stripBaseItem(newParams));
        } catch (error) {
          routeLogger.error("Failed to create structure", { error });
          res.status(500).send({
            message: "Failed to create the structure.",
            error: error as string,
          });
          return;
        }
      }
    }
  );

  // * Get journal structure
  router.get(
    ROUTES.JOURNAL_FETCH_STRUCTURE,
    async (
      _req: Request<{}, Journal, {}, {}>,
      res: Response<Journal | ErrorResponse, Locals>
    ) => {
      const routeLogger = logger.withContext({
        route: ROUTES.JOURNAL_FETCH_STRUCTURE,
        userId: res.locals.user.sub,
      });

      routeLogger.info("Fetching journal structure");

      let existingStructure: Journal & BaseItem;
      try {
        routeLogger.debug("Querying DynamoDB for structure");
        existingStructure = (
          await queryItems<Journal & BaseItem>(
            process.env.DYNAMODB_TABLE_NAME!,
            `USER#${res.locals.user.sub}#STRUCTURE`,
            "STRUCTURE#"
          )
        )?.[0];
      } catch (error) {
        routeLogger.error("Failed to fetch structure", { error });
        res.status(500).send({
          message: "Failed to fetch the structure.",
          error: error as string,
        });
        return;
      }
      if (existingStructure) {
        routeLogger.info("Structure found, returning to client");
        res.status(200).send(stripBaseItem(existingStructure));
      } else {
        routeLogger.info("No structure found");
        res.status(404).send({
          message: "No structure found.",
        });
        return;
      }
    }
  );
};
