import { useState, useEffect, useCallback } from "react";
import { useJournalStructure } from "./useJournalStructure";
import { useJournalEntry } from "./useJournalEntry";
import * as journalApi from "../services/journalApi";
import {
  Action,
  FieldTypeKind,
  Journal,
  JournalEntry,
} from "@src-types/journal/journal.types";

export interface UseJournalActionsReturn {
  actions: Action[];
  loading: boolean;
  error: string | null;
  registerAction: (actionId: string, value?: number) => Promise<boolean>;
  isActionCompletedToday: (action: Action) => boolean;
  createAction: (
    name: string,
    fieldId: string,
    fieldTypeId: string,
    incrementValue?: number,
    isDailyAction?: boolean
  ) => Promise<Action>;
  deleteAction: (actionId: string) => Promise<boolean>;
  updateActionOrder: (actionId: string, newOrder: number) => Promise<boolean>;
  getEligibleFields: () => {
    groupId: string;
    groupName: string;
    fieldId: string;
    fieldName: string;
    fieldTypes: {
      id: string;
      kind: FieldTypeKind;
      description?: string;
      dataOptions?: Record<string, string | number | boolean | undefined>;
    }[];
  }[];
  getActionDetails: (action: Action) => {
    fieldName: string;
    fieldTypeName: string;
    fieldTypeKind: FieldTypeKind | null;
    fieldTypeDataOptions?: Record<string, any>;
    currentValue: any;
    incrementValue?: number;
    isCustom: boolean;
  } | null;
  refreshActions: () => Promise<void>;
}

export const useJournalActions = (
  date: string,
  externalStructure?: Journal | null,
  externalEntry?: JournalEntry | null,
  externalRefreshEntry?: () => Promise<void>
): UseJournalActionsReturn => {
  const [actions, setActions] = useState<Action[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Use external structure if provided, otherwise fetch it
  const { structure } =
    externalStructure !== undefined
      ? { structure: externalStructure }
      : useJournalStructure();

  // Use external entry and refresh function if provided, otherwise fetch them
  const { entry, refreshEntry } =
    externalEntry !== undefined && externalRefreshEntry !== undefined
      ? { entry: externalEntry, refreshEntry: externalRefreshEntry }
      : useJournalEntry(structure, date);

  // Fetch actions
  const fetchActions = useCallback(async () => {
    try {
      setLoading(true);
      const fetchedActions = await journalApi.fetchActions();
      setActions(fetchedActions);
      setError(null);
    } catch (err) {
      setError("Failed to fetch actions");
      console.error("Error fetching actions:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Register an action
  const registerAction = useCallback(
    async (actionId: string, value?: number) => {
      try {
        await journalApi.registerAction(actionId, value);
        // Refresh the journal entry to reflect the changes
        refreshEntry();
        return true;
      } catch (err) {
        console.error("Error registering action:", err);
        return false;
      }
    },
    [refreshEntry]
  );

  // Create a new action
  const createAction = useCallback(
    async (
      name: string,
      fieldId: string,
      fieldTypeId: string,
      incrementValue?: number,
      isDailyAction?: boolean
    ) => {
      try {
        // For custom values, explicitly set isCustom to true and increment to null
        // instead of passing undefined
        const isCustom = incrementValue === undefined;

        const newAction = await journalApi.addAction({
          name,
          description: "",
          fieldId,
          options: [
            {
              fieldTypeId,
              // For custom values, send null instead of undefined
              increment: isCustom ? undefined : incrementValue,
              isCustom: isCustom,
            },
          ],
          isDailyAction: isDailyAction || false,
        });
        setActions((prev) => [...prev, newAction]);
        return newAction;
      } catch (err) {
        console.error("Error creating action:", err);
        throw err;
      }
    },
    []
  );

  // Delete an action
  const deleteAction = useCallback(async (actionId: string) => {
    try {
      await journalApi.removeAction(actionId);
      setActions((prev) => prev.filter((action) => action.id !== actionId));
      return true;
    } catch (err) {
      console.error("Error deleting action:", err);
      return false;
    }
  }, []);

  // Update action order
  const updateActionOrder = useCallback(
    async (actionId: string, newOrder: number) => {
      try {
        // Find the action to update
        const actionToUpdate = actions.find((action) => action.id === actionId);
        if (!actionToUpdate) return false;

        // Call the API to update the action order in the backend
        await journalApi.reorderAction(actionId, newOrder);

        // Create a new action object with the updated order
        const updatedAction = {
          ...actionToUpdate,
          order: newOrder,
        };

        // Update the actions array locally
        setActions((prev) =>
          prev.map((action) =>
            action.id === actionId ? updatedAction : action
          )
        );

        return true;
      } catch (err) {
        console.error("Error updating action order:", err);
        return false;
      }
    },
    [actions]
  );

  // Get eligible fields for actions (NUMBER, NUMBER_NAVIGATION, TIME_SELECT, or CHECK if it's the only type)
  const getEligibleFields = useCallback(() => {
    if (!structure) return [];

    const eligibleFields: {
      groupId: string;
      groupName: string;
      fieldId: string;
      fieldName: string;
      fieldTypes: {
        id: string;
        kind: FieldTypeKind;
        description?: string;
        dataOptions?: Record<string, string | number | boolean | undefined>;
      }[];
    }[] = [];

    structure.groups.forEach((group) => {
      group.fields.forEach((field) => {
        const eligibleFieldTypes = field.fieldTypes.filter((ft) => {
          const isStandardEligible =
            ft.kind === "NUMBER" ||
            ft.kind === "NUMBER_NAVIGATION" ||
            ft.kind === "TIME_SELECT";

          // A field with only one fieldType, which is "CHECK", is also eligible.
          const isCheckOnlyEligible =
            ft.kind === "CHECK" && field.fieldTypes.length === 1;

          return isStandardEligible || isCheckOnlyEligible;
        });

        if (eligibleFieldTypes.length > 0) {
          eligibleFields.push({
            groupId: group.id,
            groupName: group.name,
            fieldId: field.id,
            fieldName: field.name,
            fieldTypes: eligibleFieldTypes.map((ft) => ({
              id: ft.id,
              kind: ft.kind as FieldTypeKind,
              description: ft.description,
              dataOptions: ft.dataOptions,
            })),
          });
        }
      });
    });

    return eligibleFields;
  }, [structure]);

  // Get field and fieldType details for an action
  const getActionDetails = useCallback(
    (action: Action) => {
      if (!structure) return null;

      let fieldName = "";
      let fieldTypeName = "";
      let fieldTypeKind: FieldTypeKind | null = null;
      let fieldTypeDataOptions: Record<string, any> | undefined;
      let currentValue: any = null;

      // Find the field and fieldType in the structure
      structure.groups.forEach((group) => {
        group.fields.forEach((field) => {
          if (field.id === action.fieldId) {
            fieldName = field.name;

            field.fieldTypes.forEach((fieldType) => {
              if (action.options && action.options.length > 0) {
                const option = action.options[0];
                if (fieldType.id === option.fieldTypeId) {
                  fieldTypeName = fieldType.description || "";
                  fieldTypeKind = fieldType.kind as FieldTypeKind;
                  fieldTypeDataOptions = fieldType.dataOptions;
                }
              }
            });
          }
        });
      });

      // Find the current value in the entry
      if (entry) {
        entry.values.forEach((fieldValue) => {
          if (fieldValue.fieldId === action.fieldId) {
            if (action.options && action.options.length > 0) {
              const option = action.options[0];
              if (fieldValue.fieldTypeId === option.fieldTypeId) {
                currentValue = fieldValue.value;
              }
            }
          }
        });
      }

      return {
        fieldName,
        fieldTypeName,
        fieldTypeKind,
        fieldTypeDataOptions,
        currentValue,
        incrementValue:
          action.options && action.options.length > 0
            ? action.options[0].increment
            : undefined,
        isCustom:
          action.options && action.options.length > 0
            ? action.options[0].isCustom ?? false // Ensure isCustom is always a boolean
            : false,
      };
    },
    [structure, entry]
  );

  const isActionCompletedToday = useCallback((action: Action): boolean => {
    if (!action.isDailyAction || !action.lastTriggeredDate) return false;

    const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD
    return action.lastTriggeredDate === today;
  }, []);

  useEffect(() => {
    fetchActions();
  }, [fetchActions]);

  return {
    actions,
    loading,
    error,
    registerAction,
    createAction,
    deleteAction,
    updateActionOrder,
    getEligibleFields,
    getActionDetails,
    refreshActions: fetchActions,
    isActionCompletedToday,
  };
};
