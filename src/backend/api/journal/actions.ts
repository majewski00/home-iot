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
  JournalEntry,
  Journal,
  Field,
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

// Helper Interfaces for Validation
interface ActionValidation {
  isValid: boolean;
  invalidReason?: string;
  missingFieldId?: string;
  missingFieldTypeId?: string;
}

interface ActionWithValidation extends Action {
  _validation?: ActionValidation;
}

/**
 * Validates if an action (or its constituent parts) is compatible with the current journal structure.
 */
function validateActionAgainstStructure(
  action: Pick<Action, "fieldId" | "options" | "name">, // Accept partial action for flexibility
  structure: Journal
): ActionValidation {
  if (!structure || !structure.groups) {
    return {
      isValid: false,
      invalidReason: "Journal structure not found or invalid.",
    };
  }

  let fieldExists = false;
  let fieldTypeExists = false; // Assume true if no options requiring specific fieldType
  let foundFieldName = "";

  for (const group of structure.groups) {
    const field = group.fields.find((f) => f.id === action.fieldId);
    if (field) {
      fieldExists = true;
      foundFieldName = field.name;
      if (action.options && action.options.length > 0) {
        const actionFieldTypeId = action.options[0].fieldTypeId;
        fieldTypeExists = field.fieldTypes.some(
          (ft) => ft.id === actionFieldTypeId
        );
      } else {
        // If action has no options, it might be a generic action for a field (e.g. a CHECK type)
        // For now, if field exists and no specific fieldType is targeted by options, consider it valid at field level.
        fieldTypeExists = true;
      }
      break;
    }
  }

  if (!fieldExists) {
    return {
      isValid: false,
      invalidReason: `Associated field (ID: ${action.fieldId}) no longer exists in the current journal structure.`,
      missingFieldId: action.fieldId,
    };
  }

  if (!fieldTypeExists && action.options && action.options.length > 0) {
    return {
      isValid: false,
      invalidReason: `Associated field type (ID: ${action.options[0].fieldTypeId}) for field "${foundFieldName}" (ID: ${action.fieldId}) no longer exists.`,
      missingFieldId: action.fieldId,
      missingFieldTypeId: action.options[0].fieldTypeId,
    };
  }

  return { isValid: true };
}

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

export default (router: Router) => {
  // * Fetch all actions for a user
  router.get(
    ROUTES.JOURNAL_FETCH_ACTIONS,
    async (
      _req: Request<{}, ActionWithValidation[], {}, {}>, // Updated response type
      res: Response<ActionWithValidation[] | ErrorResponse, Locals> // Updated response type
    ) => {
      const routeLogger = logger.withContext({
        route: ROUTES.JOURNAL_FETCH_ACTIONS,
        userId: res.locals.user.sub,
      });

      routeLogger.info("Fetching all actions for user");

      try {
        routeLogger.debug("Querying DynamoDB for actions");
        const actionsFromDb = await queryItems<Action & BaseItem>(
          process.env.DYNAMODB_TABLE_NAME!,
          `USER#${res.locals.user.sub}#ACTIONS`,
          "ACTION#"
        );

        routeLogger.debug("Fetching journal structure for validation");
        const journalStructure = await getJournalStructure(res.locals.user.sub);

        if (!journalStructure) {
          routeLogger.warn(
            "No journal structure found. Returning actions without full validation, marked as potentially invalid."
          );
          const actionsToReturn = actionsFromDb.map((actionWithBase) => {
            const strippedAction = stripBaseItem(actionWithBase);
            return {
              ...strippedAction,
              _validation: {
                isValid: false, // Mark as invalid if structure is missing
                invalidReason: "Journal structure not found for validation.",
              },
            };
          });
          res.status(200).send(actionsToReturn);
          return;
        }

        const validatedActions: ActionWithValidation[] = actionsFromDb.map(
          (actionWithBase) => {
            const strippedAction = stripBaseItem(actionWithBase);
            const validation = validateActionAgainstStructure(
              strippedAction,
              journalStructure
            );
            return {
              ...strippedAction,
              _validation: validation,
            };
          }
        );

        const validCount = validatedActions.filter(
          (a) => a._validation?.isValid
        ).length;
        const invalidCount = validatedActions.length - validCount;

        routeLogger.info("Successfully fetched and validated actions", {
          totalCount: validatedActions.length,
          validCount,
          invalidCount,
        });

        if (invalidCount > 0) {
          routeLogger.warn(
            "Invalid actions found:",
            validatedActions
              .filter((a) => !a._validation?.isValid)
              .map((a) => ({
                id: a.id,
                name: a.name,
                reason: a._validation?.invalidReason,
              }))
          );
        }

        // Add debug log to verify response structure
        routeLogger.debug("Response structure verification", {
          totalActions: validatedActions.length,
          sampleAction: validatedActions[0]
            ? {
                id: validatedActions[0].id,
                name: validatedActions[0].name,
                hasValidation: !!validatedActions[0]._validation,
                isValid: validatedActions[0]._validation?.isValid,
                invalidReason: validatedActions[0]._validation?.invalidReason,
              }
            : null,
          invalidActionsWithValidation: validatedActions
            .filter((a) => !a._validation?.isValid)
            .map((a) => ({
              id: a.id,
              name: a.name,
              hasValidationObject: !!a._validation,
              isValid: a._validation?.isValid,
              invalidReason: a._validation?.invalidReason,
            })),
        });

        res.status(200).send(validatedActions);
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
      routeLogger.info("Attempting to add new action", { name, fieldId });

      try {
        routeLogger.debug("Fetching journal structure for validation");
        const journalStructure = await getJournalStructure(res.locals.user.sub);

        if (!journalStructure) {
          routeLogger.error(
            "Journal structure not found. Cannot validate or add action."
          );
          res.status(500).send({
            message:
              "Journal structure not found. Cannot validate or add action.",
          });
          return;
        }

        // Validate the fieldId and fieldTypeId from input against the current structure
        const validationInput = {
          name: name, // For context in validation messages if needed
          fieldId: fieldId,
          options: options
            ? options.map((opt) => ({
                id: "", // Dummy id for ActionOption
                fieldTypeId: opt.fieldTypeId,
                increment: opt.increment,
                isCustom: opt.isCustom,
              }))
            : undefined,
        };
        const validation = validateActionAgainstStructure(
          validationInput,
          journalStructure
        );

        if (!validation.isValid) {
          routeLogger.warn("Validation failed for new action", {
            name,
            fieldId,
            reason: validation.invalidReason,
          });
          res.status(400).send({
            message: `Cannot add action: ${validation.invalidReason}`,
          });
          return;
        }

        routeLogger.debug("New action validation successful");

        const timestamp = new Date().toISOString();
        const id = uuidv4();

        const newAction: Action & BaseItem = {
          PK: `USER#${res.locals.user.sub}#ACTIONS`,
          SK: `ACTION#${id}`,
          userId: res.locals.user.sub,
          id,
          name,
          description: description || "",
          fieldId,
          options: options?.map((opt) => ({
            id: uuidv4(), // Generate ID for each option
            fieldTypeId: opt.fieldTypeId,
            ...(opt.increment !== undefined && { increment: opt.increment }),
            isCustom: opt.isCustom,
          })),
          order: Date.now(), // Default order, can be improved
          createdAt: timestamp,
          updatedAt: timestamp,
          isDailyAction: isDailyAction || false,
        };

        routeLogger.debug("Creating action in DynamoDB", { actionId: id });
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
      const dateString = today.toISOString().split("T")[0];
      const newDate = today.toISOString();

      try {
        routeLogger.debug("Fetching action details");
        const actionsFromDb = await queryItems<Action & BaseItem>(
          process.env.DYNAMODB_TABLE_NAME!,
          `USER#${res.locals.user.sub}#ACTIONS`,
          `ACTION#${id}`
        );

        if (actionsFromDb.length === 0) {
          routeLogger.warn("Action not found", { actionId: id });
          res.status(404).send({ message: "Action not found." });
          return;
        }
        const action = stripBaseItem(actionsFromDb[0]);

        routeLogger.debug("Fetching journal structure for validation");
        const journalStructure = await getJournalStructure(res.locals.user.sub);

        if (!journalStructure) {
          routeLogger.error(
            "Journal structure not found. Cannot validate or register action."
          );
          res.status(500).send({
            message:
              "Journal structure not found. Cannot validate or register action.",
          });
          return;
        }

        const validation = validateActionAgainstStructure(
          action,
          journalStructure
        );
        if (!validation.isValid) {
          routeLogger.warn("Action validation failed for registration", {
            actionId: id,
            reason: validation.invalidReason,
          });
          res.status(400).send({
            message: `Action "${action.name}" is no longer valid: ${validation.invalidReason}. Please update or delete this action.`,
          });
          return;
        }
        routeLogger.debug("Action validation successful for registration");

        if (action.isDailyAction && action.lastTriggeredDate === dateString) {
          routeLogger.warn("Daily action already completed today", {
            actionId: id,
          });
          res.status(400).send({
            message: `Daily action "${action.name}" has already been completed today.`,
          });
          return;
        }

        let journalEntry = await getOrCreateJournalEntry(
          res.locals.user.sub,
          dateString,
          newDate
        );
        const { field, groupId } = findFieldInStructure(
          journalStructure,
          action.fieldId
        );

        if (!field || !groupId) {
          // This guard ensures groupId is a string below
          routeLogger.error(
            "Field or GroupId not found in structure despite passing validation. This should not happen.",
            {
              fieldId: action.fieldId,
              actionId: id,
              fieldFound: !!field,
              groupIdFound: !!groupId,
            }
          );
          res.status(500).send({
            message:
              "Internal error: Associated field or group information is missing after validation. Please try again or check action configuration.",
          });
          return;
        }

        if (action.options && action.options.length > 0) {
          await processActionWithOptions(
            journalEntry,
            action,
            field,
            groupId,
            value,
            newDate
          );
          // Ensure any associated CHECK field type is marked as true
          // when the action had specific options.
          await processCheckFieldType(journalEntry, field, groupId, newDate);
        } else {
          await processActionWithoutOptions(
            journalEntry,
            action,
            field,
            groupId,
            newDate
          );
        }

        await processTimeSelectField(
          journalEntry,
          field,
          // action.fieldId, // Parameter already removed in previous step
          groupId, // groupId is now guaranteed to be a string here
          newDate
        );
        await saveJournalEntry(res.locals.user.sub, dateString, journalEntry);

        if (action.isDailyAction) {
          routeLogger.debug("Updating lastTriggeredDate for daily action", {
            actionId: id,
          });
          await updateItem(
            process.env.DYNAMODB_TABLE_NAME!,
            {
              PK: `USER#${res.locals.user.sub}#ACTIONS`,
              SK: `ACTION#${id}`,
            },
            {
              lastTriggeredDate: dateString,
              updatedAt: newDate,
            }
          );
        }

        routeLogger.info("Action registered successfully", { actionId: id });
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

  // Helper functions
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
    functionLogger.debug("No entry found, creating new entry");
    return {
      structureId: "current", // Assuming default or will be set if structure changes
      date: dateString,
      values: [],
      createdAt: timestamp,
      updatedAt: timestamp,
      isNewEntry: true,
    };
  }

  async function getJournalStructure(userId: string): Promise<Journal | null> {
    const functionLogger = logger.withContext({
      function: "getJournalStructure",
      userId,
    });
    functionLogger.debug("Fetching journal structure");

    const targetDate = getCurrentDateString();
    functionLogger.debug("Using current date for structure selection", {
      targetDate,
    });

    const structures = await queryItems<Journal & BaseItem>(
      process.env.DYNAMODB_TABLE_NAME!,
      `USER#${userId}#STRUCTURE`,
      "STRUCTURE#"
    );

    if (structures.length === 0) {
      functionLogger.warn("No journal structures found for user");
      return null;
    }

    if (structures.length === 1) {
      functionLogger.debug("Only one structure found, returning it");
      return stripBaseItem(structures[0]);
    }

    // Sort structures by effectiveFrom date (newest first)
    const sortedStructures = structures.sort((a, b) => {
      const dateA = a.effectiveFrom as string;
      const dateB = b.effectiveFrom as string;
      return dateB.localeCompare(dateA);
    });

    // Find the first structure that was effective before or on the target date
    const applicableStructure = sortedStructures.find((s) => {
      const effectiveDate = s.effectiveFrom as string;
      return effectiveDate <= targetDate;
    });

    if (applicableStructure) {
      functionLogger.debug("Found applicable structure for current date", {
        effectiveFrom: applicableStructure.effectiveFrom,
        structureId: applicableStructure.structureId,
      });
      return stripBaseItem(applicableStructure);
    } else {
      functionLogger.warn("No applicable structure found for current date", {
        targetDate,
      });
      // If no applicable structure is found, return the oldest one
      const oldestStructure = sortedStructures[sortedStructures.length - 1];
      functionLogger.debug("Returning the oldest structure", {
        effectiveFrom: oldestStructure.effectiveFrom,
        structureId: oldestStructure.structureId,
      });
      return stripBaseItem(oldestStructure);
    }
  }

  function findFieldInStructure(
    structure: Journal,
    fieldId: string
  ): { field: Field | null; groupId: string | null } {
    for (const group of structure.groups) {
      const field = group.fields.find((f) => f.id === fieldId);
      if (field) {
        return { field, groupId: group.id };
      }
    }
    return { field: null, groupId: null };
  }

  async function processActionWithOptions(
    journalEntry: JournalEntry,
    action: Action,
    field: Field,
    groupId: string,
    value: any, // Can be number for custom input, or undefined
    timestamp: string
  ) {
    const functionLogger = logger.withContext({
      function: "processActionWithOptions",
      actionId: action.id,
      fieldId: field.id,
    });
    functionLogger.debug("Processing action with options", { value });

    const option = action.options![0]; // Assuming one option for now
    const fieldType = field.fieldTypes.find(
      (ft) => ft.id === option.fieldTypeId
    );

    if (!fieldType) {
      functionLogger.error("FieldType not found for action option", {
        fieldTypeId: option.fieldTypeId,
      });
      // This should ideally be caught by earlier validation
      return;
    }

    let existingValueIndex = journalEntry.values.findIndex(
      (v) => v.fieldId === field.id && v.fieldTypeId === option.fieldTypeId
    );

    let newValue: string | number | boolean | null = null;

    if (fieldType.kind === "NUMBER" || fieldType.kind === "NUMBER_NAVIGATION") {
      const currentNumericValue =
        existingValueIndex !== -1
          ? Number(journalEntry.values[existingValueIndex].value)
          : 0;
      if (option.isCustom) {
        newValue = Number(value); // Value from custom input
      } else {
        newValue = currentNumericValue + (option.increment || 1);
      }
    } else if (fieldType.kind === "CHECK") {
      // This case might be handled by processActionWithoutOptions if CHECK is primary
      newValue = true; // Or toggle: !(existingValueIndex !== -1 ? journalEntry.values[existingValueIndex].value : false)
    }
    // Add other FieldTypeKind handlers as needed

    if (newValue !== null) {
      if (existingValueIndex !== -1) {
        journalEntry.values[existingValueIndex].value = newValue;
        journalEntry.values[existingValueIndex].updatedAt = timestamp;
      } else {
        journalEntry.values.push({
          groupId,
          fieldId: field.id,
          fieldTypeId: option.fieldTypeId,
          value: newValue,
          createdAt: timestamp,
          updatedAt: timestamp,
        });
      }
      functionLogger.debug("Updated/added field value", { newValue });
    }
  }

  async function processActionWithoutOptions(
    journalEntry: JournalEntry,
    action: Action,
    field: Field,
    groupId: string,
    timestamp: string
  ) {
    const functionLogger = logger.withContext({
      function: "processActionWithoutOptions",
      actionId: action.id,
      fieldId: field.id,
    });
    functionLogger.debug("Processing action without options (e.g., for CHECK)");

    // Typically, an action without options might toggle a 'CHECK' field type.
    // Find the 'CHECK' fieldType associated with this field.
    const checkFieldType = field.fieldTypes.find((ft) => ft.kind === "CHECK");
    if (checkFieldType) {
      let existingValueIndex = journalEntry.values.findIndex(
        (v) => v.fieldId === field.id && v.fieldTypeId === checkFieldType.id
      );
      if (existingValueIndex !== -1) {
        journalEntry.values[existingValueIndex].value = true; // Or toggle
        journalEntry.values[existingValueIndex].updatedAt = timestamp;
      } else {
        journalEntry.values.push({
          groupId,
          fieldId: field.id,
          fieldTypeId: checkFieldType.id,
          value: true,
          createdAt: timestamp,
          updatedAt: timestamp,
        });
      }
      functionLogger.debug("Updated/added CHECK field value to true");
    } else {
      functionLogger.warn(
        "No CHECK fieldType found for action without options",
        { fieldId: field.id }
      );
    }
  }

  async function processCheckFieldType(
    journalEntry: JournalEntry,
    field: Field,
    groupId: string,
    timestamp: string
  ) {
    const functionLogger = logger.withContext({
      function: "processCheckFieldType",
      fieldId: field.id,
    });

    const checkFieldType = field.fieldTypes.find((ft) => ft.kind === "CHECK");
    if (checkFieldType) {
      functionLogger.debug("Processing CHECK field type for associated action");
      let existingValueIndex = journalEntry.values.findIndex(
        (v) => v.fieldId === field.id && v.fieldTypeId === checkFieldType.id
      );
      if (existingValueIndex !== -1) {
        // Only update if not already true
        if (journalEntry.values[existingValueIndex].value !== true) {
          journalEntry.values[existingValueIndex].value = true;
          journalEntry.values[existingValueIndex].updatedAt = timestamp;
          functionLogger.debug("Updated CHECK field value to true");
        } else {
          functionLogger.debug(
            "CHECK field value already true, no update needed"
          );
        }
      } else {
        journalEntry.values.push({
          groupId,
          fieldId: field.id,
          fieldTypeId: checkFieldType.id,
          value: true,
          createdAt: timestamp,
          updatedAt: timestamp,
        });
        functionLogger.debug("Added CHECK field value as true");
      }
    } else {
      functionLogger.debug(
        "No CHECK fieldType found for this field, skipping check update.",
        { fieldId: field.id }
      );
    }
  }

  async function processTimeSelectField(
    journalEntry: JournalEntry,
    field: Field,
    // fieldId: string, // Parameter already removed
    groupId: string, // Type is string as per function definition
    timestamp: string
  ) {
    const functionLogger = logger.withContext({
      function: "processTimeSelectField",
      fieldId: field.id,
    });

    const timeSelectFieldType = field.fieldTypes.find(
      (ft) => ft.kind === "TIME_SELECT"
    );

    if (timeSelectFieldType) {
      functionLogger.debug("Processing TIME_SELECT field type");
      let existingValueIndex = journalEntry.values.findIndex(
        (v) =>
          v.fieldId === field.id && v.fieldTypeId === timeSelectFieldType.id
      );
      const currentTime = new Date(timestamp).toTimeString().substring(0, 5); // HH:MM

      if (existingValueIndex !== -1) {
        // Update if it's the first registration of the day or if policy allows multiple updates
        // For now, let's assume we always update it upon action registration
        journalEntry.values[existingValueIndex].value = currentTime;
        journalEntry.values[existingValueIndex].updatedAt = timestamp;
        functionLogger.debug("Updated TIME_SELECT value", { currentTime });
      } else {
        journalEntry.values.push({
          groupId,
          fieldId: field.id,
          fieldTypeId: timeSelectFieldType.id,
          value: currentTime,
          createdAt: timestamp,
          updatedAt: timestamp,
        });
        functionLogger.debug("Added TIME_SELECT value", { currentTime });
      }
    }
  }

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
    functionLogger.debug("Saving journal entry");

    const { isNewEntry, ...entryToSave } = journalEntry;
    entryToSave.updatedAt = new Date().toISOString(); // Always update timestamp on save

    const itemToSave: JournalEntry & BaseItem = {
      PK: `USER#${userId}#ENTRIES`,
      SK: `DATE#${dateString}`,
      userId: userId,
      ...entryToSave,
    };

    await putItem(process.env.DYNAMODB_TABLE_NAME!, itemToSave);
    functionLogger.debug("Journal entry saved successfully");
  }
};
