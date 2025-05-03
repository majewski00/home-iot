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

export default (router: Router) => {
  // * Save new/updated journal Structure
  router.post(
    ROUTES.JOURNAL_SAVE_STRUCTURE,
    async (
      req: Request<{}, Journal, JournalSaveStructureBody, {}, {}>,
      res: Response<Journal | ErrorResponse, Locals>
    ) => {
      // 1. Verify if there is a structure of the journal in ddb
      let existingStructure: Journal & BaseItem;
      const newDate = new Date().toISOString();

      try {
        existingStructure = (
          await queryItems<Journal & BaseItem>(
            process.env.DYNAMODB_TABLE_NAME!,
            `USER#${res.locals.user.sub}#STRUCTURE`,
            "STRUCTURE#"
          )
        )?.[0];
      } catch (error) {
        res.status(500).send({
          message: "Failed to fetch the structure.",
          error: error as string,
        });
        return;
      }
      if (existingStructure) {
        try {
          const newParams = { groups: req.body.groups, updatedAt: newDate };
          const newEntry = await updateItem<Journal & BaseItem>(
            process.env.DYNAMODB_TABLE_NAME!,
            {
              PK: `USER#${res.locals.user.sub}#STRUCTURE`,
              SK: `STRUCTURE#`,
            },
            newParams
          );
          res.status(200).send(stripBaseItem(newEntry));
        } catch (error) {
          res.status(500).send({
            message: "Failed to update the structure.",
            error: error as string,
          });
          return;
        }
      } else {
        try {
          const newParams: Journal & BaseItem = {
            PK: `USER#${res.locals.user.sub}#STRUCTURE`,
            SK: `STRUCTURE#`,
            userId: res.locals.user.sub,
            groups: req.body.groups,
            createdAt: newDate,
            updatedAt: newDate,
          };
          await putItem(process.env.DYNAMODB_TABLE_NAME!, newParams);
          res.status(201).send(stripBaseItem(newParams));
        } catch (error) {
          res.status(500).send({
            message: "Failed to create the structure.",
            error: error as string,
          });
          return;
        }
      }
    }
  );
};
