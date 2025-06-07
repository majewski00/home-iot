import { Router, Request, Response } from "express";
import { v4 as uuidv4 } from "uuid";
import {
  putItem,
  queryItems,
  updateItem,
  BaseItem,
  stripBaseItem,
  deleteItem,
} from "@helpers/ddb";
import * as ROUTES from "@apiRoutes";
import {
  Action,
  FieldValue,
  JournalEntry,
} from "@src-types/journal/journal.types";
import {
  Locals,
  ErrorResponse,
  JournalAddActionBody,
  JournalRemoveActionBody,
  JournalRegisterActionBody,
  JournalReorderActionBody,
} from "@src-types/journal/api.types";
import logger from "../utils/logger";

export default (router: Router) => {
  // * Fetch all actions for a user
  // TODO: Check if the associated FieldType exists in the present journal structure
  router.get(
    ROUTES.JOURNAL_FETCH_ACTIONS,
    async (
      _req: Request<{}, Action[], {}, {}>,
      res: Response<Action[] | ErrorResponse, Locals>
    ) => {
      const routeLogger = logger.withContext({
        route: ROUTES.JOURNAL_FETCH_ACTIONS,
        userId: res.locals.user.sub,
      });

      routeLogger.info("Fetching all actions for user");

      try {
        routeLogger.debug("Querying DynamoDB for actions");
        const actions = await queryItems<Action & BaseItem>(
          process.env.DYNAMODB_TABLE_NAME!,
          `USER#${res.locals.user.sub}#ACTIONS`,
          "ACTION#"
        );

        // Get current journal structure to validate field types
        routeLogger.debug("Fetching journal structure for validation");
        const journalStructure = await getJournalStructure(res.locals.user.sub);

        if (!journalStructure) {
          routeLogger.warn("No journal structure found");
          // If no structure exists, return empty actions array
          res.status(200).send([]);
          return;
        }

        // Create a set of valid field IDs and field type IDs for quick lookup
        const validFieldIds = new Set<string>();
        const validFieldTypeIds = new Set<string>();

        journalStructure.groups.forEach((group) => {
          group.fields.forEach((field) => {
            validFieldIds.add(field.id);
            field.fieldTypes.forEach((fieldType) => {
              validFieldTypeIds.add(fieldType.id);
            });
          });
        });

        // Filter actions to only include those with valid field references
        const validActions = actions.filter((action) => {
          const actionData = stripBaseItem(action);

          // Check if the field still exists
          if (!validFieldIds.has(actionData.fieldId)) {
            routeLogger.warn("Action references non-existent field", {
              actionId: actionData.id,
              actionName: actionData.name,
              fieldId: actionData.fieldId,
            });
            return false;
          }

          // Check if action has options with field type references
          if (actionData.options && actionData.options.length > 0) {
            const hasValidFieldTypes = actionData.options.every((option) =>
              validFieldTypeIds.has(option.fieldTypeId)
            );

            if (!hasValidFieldTypes) {
              routeLogger.warn("Action references non-existent field type", {
                actionId: actionData.id,
                actionName: actionData.name,
                options: actionData.options.map((opt) => ({
                  fieldTypeId: opt.fieldTypeId,
                  exists: validFieldTypeIds.has(opt.fieldTypeId),
                })),
              });
              return false;
            }
          }

          return true;
        });

        routeLogger.info("Successfully fetched and validated actions", {
          totalCount: actions.length,
          validCount: validActions.length,
          filteredCount: actions.length - validActions.length,
        });

        res
          .status(200)
          .send(validActions.map((action) => stripBaseItem(action)));
      } catch (error) {
        routeLogger.error("Failed to fetch actions", { error });
        res.status(500).send({
          message: "Failed to fetch actions.",
          error: error as string,
        });
      }
    }
  );

  // * Add a new action
  router.post(
    ROUTES.JOURNAL_ADD_ACTION,
    async (
      req: Request<{}, Action, JournalAddActionBody, {}, {}>,
      res: Response<Action | ErrorResponse, Locals>
    ) => {
      const routeLogger = logger.withContext({
        route: ROUTES.JOURNAL_ADD_ACTION,
        userId: res.locals.user.sub,
      });

      const { name, description, fieldId, options, isDailyAction } = req.body;
      routeLogger.info("Adding new action", { name, fieldId });

      const timestamp = new Date().toISOString();
      const id = uuidv4();

      try {
        const newAction: Action & BaseItem = {
          PK: `USER#${res.locals.user.sub}#ACTIONS`,
          SK: `ACTION#${id}`,
          userId: res.locals.user.sub,
          id,
          name,
          description,
          fieldId,
          options: options?.map((opt) => ({
            id: uuidv4(),
            fieldTypeId: opt.fieldTypeId,
            ...(opt.increment !== undefined && { increment: opt.increment }),
            isCustom: opt.isCustom,
          })),
          order: 4, // Default order
          createdAt: timestamp,
          isDailyAction: isDailyAction || false,
          // lastTriggeredDate is undefined initially
        };

        routeLogger.debug("Creating action in DynamoDB", {
          actionId: id,
          optionsCount: options?.length || 0,
        });

        await putItem(process.env.DYNAMODB_TABLE_NAME!, newAction);

        routeLogger.info("Action created successfully", { actionId: id });
        res.status(201).send(stripBaseItem(newAction));
      } catch (error) {
        routeLogger.error("Failed to add action", { error });
        res.status(500).send({
          message: "Failed to add action.",
          error: error as string,
        });
      }
    }
  );

  // * Remove an action
  router.post(
    ROUTES.JOURNAL_REMOVE_ACTION,
    async (
      req: Request<{}, {}, JournalRemoveActionBody, {}, {}>,
      res: Response<{ success: boolean } | ErrorResponse, Locals>
    ) => {
      const { id } = req.body;
      const routeLogger = logger.withContext({
        route: ROUTES.JOURNAL_REMOVE_ACTION,
        userId: res.locals.user.sub,
        actionId: id,
      });

      routeLogger.info("Removing action");

      try {
        routeLogger.debug("Deleting action from DynamoDB");
        // Use the deleteItem function to remove the action
        await deleteItem(process.env.DYNAMODB_TABLE_NAME!, {
          PK: `USER#${res.locals.user.sub}#ACTIONS`,
          SK: `ACTION#${id}`,
        });

        routeLogger.info("Action removed successfully");
        res.status(200).send({ success: true });
      } catch (error) {
        routeLogger.error("Failed to remove action", { error });
        res.status(500).send({
          message: "Failed to remove action.",
          error: error as string,
        });
      }
    }
  );

  // * Register an action (when user presses the action button)
  router.post(
    ROUTES.JOURNAL_REGISTER_ACTION,
    async (
      req: Request<{}, {}, JournalRegisterActionBody, {}, {}>,
      res: Response<{ success: boolean } | ErrorResponse, Locals>
    ) => {
      const { id, value } = req.body;
      const routeLogger = logger.withContext({
        route: ROUTES.JOURNAL_REGISTER_ACTION,
        userId: res.locals.user.sub,
        actionId: id,
      });

      routeLogger.info("Registering action", { actionId: id, value });

      const today = new Date();
      const dateString = today.toISOString().split("T")[0]; // Format: YYYY-MM-DD
      const newDate = today.toISOString();

      try {
        // 1. Get the action details
        routeLogger.debug("Fetching action details");
        const actions = await queryItems<Action & BaseItem>(
          process.env.DYNAMODB_TABLE_NAME!,
          `USER#${res.locals.user.sub}#ACTIONS`,
          `ACTION#${id}`
        );
        const action = actions.length > 0 ? stripBaseItem(actions[0]) : null;
        if (!action) {
          routeLogger.warn("Action not found", { actionId: id });
          res.status(404).send({ message: "Action not found." });
          return;
        }

        // 2. Get today's journal entry
        routeLogger.debug("Getting or creating journal entry", {
          date: dateString,
        });
        let journalEntry = await getOrCreateJournalEntry(
          res.locals.user.sub,
          dateString,
          newDate
        );
        routeLogger.debug("Journal entry retrieved", {
          isNew: journalEntry.isNewEntry,
          valuesCount: journalEntry.values.length,
        });

        // 3. Get journal structure to find field information
        routeLogger.debug("Fetching journal structure");
        const journalStructure = await getJournalStructure(res.locals.user.sub);
        if (!journalStructure) {
          routeLogger.warn("Journal structure not found");
          res.status(404).send({ message: "Journal structure not found." });
          return;
        }

        // 4. Find the field and its group in the structure
        routeLogger.debug("Finding field in structure", {
          fieldId: action.fieldId,
        });
        const { field, groupId } = findFieldInStructure(
          journalStructure,
          action.fieldId
        );

        if (!field) {
          routeLogger.warn("Action field not found in current structure", {
            fieldId: action.fieldId,
            actionId: id,
          });
          res.status(400).send({
            message:
              "Action field no longer exists in current journal structure. Please update or delete this action.",
          });
          return;
        }

        // 5. Update field values based on action options
        if (action.options && action.options.length > 0) {
          routeLogger.debug("Processing action with options", {
            optionsCount: action.options.length,
          });
          await processActionWithOptions(
            journalEntry,
            action,
            field,
            groupId,
            value,
            newDate
          );
        } else {
          routeLogger.debug("Processing action without options");
          // If no options, just mark the CHECK field as done
          await processActionWithoutOptions(
            journalEntry,
            action,
            field,
            groupId,
            newDate
          );
        }

        // 6. Check for TIME_SELECT field type and create/update its value
        routeLogger.debug("Processing time select field");
        await processTimeSelectField(
          journalEntry,
          field,
          action.fieldId,
          groupId,
          newDate
        );

        // 7. Save the updated journal entry
        routeLogger.debug("Saving journal entry", {
          date: dateString,
          valuesCount: journalEntry.values.length,
        });
        await saveJournalEntry(res.locals.user.sub, dateString, journalEntry);

        // 8. If this is a daily action, update lastTriggeredDate
        if (action.isDailyAction) {
          routeLogger.debug("Updating lastTriggeredDate for daily action");

          await updateItem(
            process.env.DYNAMODB_TABLE_NAME!,
            {
              PK: `USER#${res.locals.user.sub}#ACTIONS`,
              SK: `ACTION#${id}`,
            },
            {
              lastTriggeredDate: dateString, // TODO: mismatch with users timezone!
              updatedAt: newDate,
            }
          );

          routeLogger.debug("Updated lastTriggeredDate successfully", {
            date: dateString,
          });
        }

        routeLogger.info("Action registered successfully");
        res.status(200).send({ success: true });
      } catch (error) {
        routeLogger.error("Failed to register action", { error });
        res.status(500).send({
          message: "Failed to register action.",
          error: error as string,
        });
      }
    }
  );

  // * Reorder an action
  router.post(
    ROUTES.JOURNAL_REORDER_ACTION,
    async (
      req: Request<{}, {}, JournalReorderActionBody, {}, {}>,
      res: Response<{ success: boolean } | ErrorResponse, Locals>
    ) => {
      const { id, order } = req.body;
      const routeLogger = logger.withContext({
        route: ROUTES.JOURNAL_REORDER_ACTION,
        userId: res.locals.user.sub,
        actionId: id,
      });

      routeLogger.info("Reordering action", { actionId: id, newOrder: order });

      try {
        routeLogger.debug("Updating action order in DynamoDB");
        // Update the action with the new order
        await updateItem(
          process.env.DYNAMODB_TABLE_NAME!,
          {
            PK: `USER#${res.locals.user.sub}#ACTIONS`,
            SK: `ACTION#${id}`,
          },
          {
            order: order,
            updatedAt: new Date().toISOString(),
          }
        );

        routeLogger.info("Action reordered successfully");
        res.status(200).send({ success: true });
      } catch (error) {
        routeLogger.error("Failed to reorder action", { error });
        res.status(500).send({
          message: "Failed to reorder action.",
          error: error as string,
        });
      }
    }
  );

  // Helper functions for JOURNAL_REGISTER_ACTION
  /**
   * Get or create a journal entry for the specified date
   */
  async function getOrCreateJournalEntry(
    userId: string,
    dateString: string,
    timestamp: string
  ): Promise<JournalEntry & { isNewEntry?: boolean }> {
    const functionLogger = logger.withContext({
      function: "getOrCreateJournalEntry",
      userId,
      date: dateString,
    });

    functionLogger.debug("Fetching journal entry");
    const entries = await queryItems<JournalEntry & BaseItem>(
      process.env.DYNAMODB_TABLE_NAME!,
      `USER#${userId}#ENTRIES`,
      `DATE#${dateString}`
    );

    if (entries.length > 0) {
      functionLogger.debug("Existing entry found");
      return { ...stripBaseItem(entries[0]), isNewEntry: false };
    }

    // Create new entry
    functionLogger.debug("No entry found, creating new entry");
    return {
      date: dateString,
      values: [],
      createdAt: timestamp,
      updatedAt: timestamp,
      isNewEntry: true,
    };
  }

  /**
   * Get journal structure
   */
  async function getJournalStructure(
    userId: string
  ): Promise<{ groups: any[] } | null> {
    const functionLogger = logger.withContext({
      function: "getJournalStructure",
      userId,
    });

    functionLogger.debug("Fetching journal structure");
    const structures = await queryItems<{ groups: any[] } & BaseItem>(
      process.env.DYNAMODB_TABLE_NAME!,
      `USER#${userId}#STRUCTURE`,
      "STRUCTURE#"
    );

    if (structures.length === 0) {
      functionLogger.debug("No structure found");
      return null;
    }

    functionLogger.debug("Structure found", {
      groupsCount: structures[0].groups.length,
    });
    return structures.length > 0 ? structures[0] : null;
  }

  /**
   * Find a field and its group in the journal structure
   */
  function findFieldInStructure(
    structure: { groups: any[] },
    fieldId: string
  ): { field: any; groupId: string } {
    for (const group of structure.groups) {
      const field = group.fields.find((f: any) => f.id === fieldId);
      if (field) {
        return { field, groupId: group.id };
      }
    }
    return { field: null, groupId: "" };
  }

  /**
   * Process an action with options
   */
  async function processActionWithOptions(
    journalEntry: JournalEntry,
    action: Action,
    field: any,
    groupId: string,
    value: any,
    timestamp: string
  ) {
    for (const option of action.options!) {
      // Find if there's an existing value for this field type
      const existingValueIndex = journalEntry.values.findIndex(
        (v) =>
          v.fieldId === action.fieldId && v.fieldTypeId === option.fieldTypeId
      );

      if (existingValueIndex >= 0) {
        // Update existing value
        const existingValue = journalEntry.values[existingValueIndex];

        if (option.isCustom && value !== undefined) {
          // For custom value input
          journalEntry.values[existingValueIndex] = {
            ...existingValue,
            value: value,
            updatedAt: timestamp,
          };
        } else if (option.increment !== undefined) {
          // For increment
          const currentValue = Number(existingValue.value) || 0;
          journalEntry.values[existingValueIndex] = {
            ...existingValue,
            value: currentValue + option.increment,
            updatedAt: timestamp,
          };
        }
      } else {
        // Create new value
        const newValue: FieldValue = {
          groupId,
          fieldId: action.fieldId,
          fieldTypeId: option.fieldTypeId,
          value:
            option.isCustom && value !== undefined
              ? value
              : option.increment || 1,
          createdAt: timestamp,
          updatedAt: timestamp,
        };

        journalEntry.values.push(newValue);
      }
    }

    // Also mark the CHECK field as done
    updateCheckField(journalEntry, action.fieldId, field, groupId, timestamp);
  }

  /**
   * Process an action without options
   */
  function processActionWithoutOptions(
    journalEntry: JournalEntry,
    action: Action,
    field: any,
    groupId: string,
    timestamp: string
  ) {
    updateCheckField(journalEntry, action.fieldId, field, groupId, timestamp);
  }

  /**
   * Update the CHECK field value
   */
  function updateCheckField(
    journalEntry: JournalEntry,
    fieldId: string,
    field: any,
    groupId: string,
    timestamp: string
  ) {
    // Find if there's an existing CHECK value
    const existingCheckValueIndex = journalEntry.values.findIndex(
      (v) => v.fieldId === fieldId && v.fieldTypeId.includes("CHECK")
    );

    if (existingCheckValueIndex >= 0) {
      // Update existing CHECK value to true
      journalEntry.values[existingCheckValueIndex] = {
        ...journalEntry.values[existingCheckValueIndex],
        value: true,
        updatedAt: timestamp,
      };
    } else {
      // Find the CHECK field type ID
      const checkFieldType = field.fieldTypes.find(
        (ft: any) => ft.kind === "CHECK"
      );

      if (checkFieldType) {
        // Create new CHECK value
        const checkValue: FieldValue = {
          groupId,
          fieldId,
          fieldTypeId: checkFieldType.id,
          value: true,
          createdAt: timestamp,
          updatedAt: timestamp,
        };

        journalEntry.values.push(checkValue);
      }
    }
  }

  /**
   * Process TIME_SELECT field type
   */
  function processTimeSelectField(
    journalEntry: JournalEntry,
    field: any,
    fieldId: string,
    groupId: string,
    timestamp: string
  ) {
    // Find if the field has a TIME_SELECT field type
    const timeSelectFieldType = field.fieldTypes.find(
      (ft: any) => ft.kind === "TIME_SELECT"
    );

    if (!timeSelectFieldType) {
      return; // No TIME_SELECT field type found
    }

    // Get the step value from dataOptions or use default (30)
    const stepValue =
      timeSelectFieldType.dataOptions?.step !== undefined
        ? Number(timeSelectFieldType.dataOptions.step)
        : 30;

    // Calculate current time as minutes from midnight
    const now = new Date();
    const currentTotalMinutes = now.getHours() * 60 + now.getMinutes();

    // Round the time value according to the step
    const roundedTimeValue =
      Math.floor(currentTotalMinutes / stepValue) * stepValue;

    // Find if there's an existing value for this TIME_SELECT field type
    const existingTimeValueIndex = journalEntry.values.findIndex(
      (v) => v.fieldId === fieldId && v.fieldTypeId === timeSelectFieldType.id
    );

    if (existingTimeValueIndex >= 0) {
      // Update existing TIME_SELECT value
      journalEntry.values[existingTimeValueIndex] = {
        ...journalEntry.values[existingTimeValueIndex],
        value: roundedTimeValue,
        updatedAt: timestamp,
      };
    } else {
      // Create new TIME_SELECT value
      const timeValue: FieldValue = {
        groupId,
        fieldId,
        fieldTypeId: timeSelectFieldType.id,
        value: roundedTimeValue,
        createdAt: timestamp,
        updatedAt: timestamp,
      };

      journalEntry.values.push(timeValue);
    }
  }

  /**
   * Save journal entry
   */
  async function saveJournalEntry(
    userId: string,
    dateString: string,
    journalEntry: JournalEntry & { isNewEntry?: boolean }
  ) {
    const functionLogger = logger.withContext({
      function: "saveJournalEntry",
      userId,
      date: dateString,
    });

    const { isNewEntry, ...entryToSave } = journalEntry;

    if (isNewEntry) {
      functionLogger.debug("Creating new journal entry");
      await putItem(process.env.DYNAMODB_TABLE_NAME!, {
        PK: `USER#${userId}#ENTRIES`,
        SK: `DATE#${dateString}`,
        userId,
        ...entryToSave,
      });
    } else {
      functionLogger.debug("Updating existing journal entry");
      await updateItem<JournalEntry & BaseItem>(
        process.env.DYNAMODB_TABLE_NAME!,
        {
          PK: `USER#${userId}#ENTRIES`,
          SK: `DATE#${dateString}`,
        },
        {
          values: entryToSave.values,
          updatedAt: entryToSave.updatedAt,
        }
      );
    }
    functionLogger.debug("Journal entry saved successfully");
  }
};
