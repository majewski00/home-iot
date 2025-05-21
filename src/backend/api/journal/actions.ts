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

export default (router: Router) => {
  // * Fetch all actions for a user
  router.get(
    ROUTES.JOURNAL_FETCH_ACTIONS,
    async (
      _req: Request<{}, Action[], {}, {}>,
      res: Response<Action[] | ErrorResponse, Locals>
    ) => {
      try {
        const actions = await queryItems<Action & BaseItem>(
          process.env.DYNAMODB_TABLE_NAME!,
          `USER#${res.locals.user.sub}#ACTIONS`,
          "ACTION#"
        );

        res.status(200).send(actions.map((action) => stripBaseItem(action)));
      } catch (error) {
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
      const { name, description, fieldId, options } = req.body;
      const newDate = new Date().toISOString();
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
          createdAt: newDate,
        };

        await putItem(process.env.DYNAMODB_TABLE_NAME!, newAction);
        res.status(201).send(stripBaseItem(newAction));
      } catch (error) {
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

      try {
        // Use the deleteItem function to remove the action
        await deleteItem(process.env.DYNAMODB_TABLE_NAME!, {
          PK: `USER#${res.locals.user.sub}#ACTIONS`,
          SK: `ACTION#${id}`,
        });

        res.status(200).send({ success: true });
      } catch (error) {
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
      const today = new Date();
      const dateString = today.toISOString().split("T")[0]; // Format: YYYY-MM-DD
      const newDate = today.toISOString();

      try {
        // 1. Get the action details
        const actions = await queryItems<Action & BaseItem>(
          process.env.DYNAMODB_TABLE_NAME!,
          `USER#${res.locals.user.sub}#ACTIONS`,
          `ACTION#${id}`
        );
        const action = actions.length > 0 ? stripBaseItem(actions[0]) : null;
        if (!action) {
          res.status(404).send({ message: "Action not found." });
          return;
        }

        // 2. Get today's journal entry
        let journalEntry = await getOrCreateJournalEntry(
          res.locals.user.sub,
          dateString,
          newDate
        );

        // 3. Get journal structure to find field information
        const journalStructure = await getJournalStructure(res.locals.user.sub);
        if (!journalStructure) {
          res.status(404).send({ message: "Journal structure not found." });
          return;
        }

        // 4. Find the field and its group in the structure
        const { field, groupId } = findFieldInStructure(
          journalStructure,
          action.fieldId
        );

        if (!field) {
          res.status(404).send({ message: "Field not found in structure." });
          return;
        }

        // 5. Update field values based on action options
        if (action.options && action.options.length > 0) {
          await processActionWithOptions(
            journalEntry,
            action,
            field,
            groupId,
            value,
            newDate
          );
        } else {
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
        await processTimeSelectField(
          journalEntry,
          field,
          action.fieldId,
          groupId,
          newDate
        );

        // 7. Save the updated journal entry
        await saveJournalEntry(res.locals.user.sub, dateString, journalEntry);

        res.status(200).send({ success: true });
      } catch (error) {
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

      try {
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

        res.status(200).send({ success: true });
      } catch (error) {
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
    const entries = await queryItems<JournalEntry & BaseItem>(
      process.env.DYNAMODB_TABLE_NAME!,
      `USER#${userId}#ENTRIES`,
      `DATE#${dateString}`
    );

    if (entries.length > 0) {
      return { ...stripBaseItem(entries[0]), isNewEntry: false };
    }

    // Create new entry
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
    const structures = await queryItems<{ groups: any[] } & BaseItem>(
      process.env.DYNAMODB_TABLE_NAME!,
      `USER#${userId}#STRUCTURE`,
      "STRUCTURE#"
    );

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
    const { isNewEntry, ...entryToSave } = journalEntry;

    if (isNewEntry) {
      await putItem(process.env.DYNAMODB_TABLE_NAME!, {
        PK: `USER#${userId}#ENTRIES`,
        SK: `DATE#${dateString}`,
        userId,
        ...entryToSave,
      });
    } else {
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
  }
};
