import { getJson, postJson } from "@apiHandler";
import * as ROUTES from "@apiRoutes";
import {
  Journal,
  JournalEntry,
  Action,
} from "@src-types/journal/journal.types";
import {
  JournalSaveEntryBody,
  JournalSaveStructureBody,
  JournalAddActionBody,
  JournalRemoveActionBody,
  JournalRegisterActionBody,
} from "@src-types/journal/api.types";

// journal/data.ts

export const fetchJournalEntry = async (date: string): Promise<JournalEntry> =>
  getJson(ROUTES.JOURNAL_FETCH_ENTRY, { date }, {}, {}, { cacheBust: true });

export const saveJournalEntry = async (
  entryBody: JournalSaveEntryBody
): Promise<JournalEntry> =>
  postJson(ROUTES.JOURNAL_SAVE_ENTRY, entryBody, {}, { cacheBust: true });

export const fetchFirstEntryDate = async (): Promise<{ date: string }> =>
  getJson(
    ROUTES.JOURNAL_FETCH_FIRST_ENTRY_DATE,
    {},
    {},
    {},
    { cacheBust: false }
  );

// journal/structure.ts

export const fetchJournalStructure = async (date: string): Promise<Journal> =>
  getJson(
    ROUTES.JOURNAL_FETCH_STRUCTURE,
    { date },
    {},
    {},
    { cacheBust: true }
  );

export const saveJournalStructure = async (
  journal: JournalSaveStructureBody
): Promise<Journal> =>
  postJson(ROUTES.JOURNAL_SAVE_STRUCTURE, journal, {}, { cacheBust: true });

// journal/actions.ts

/**
 * Fetches all actions for the current user
 * @returns Promise with array of Action objects
 */
export const fetchActions = async (): Promise<Action[]> =>
  getJson(ROUTES.JOURNAL_FETCH_ACTIONS, {}, {}, {}, { cacheBust: true });

/**
 * Adds a new action
 * @param actionData The action data to create
 * @returns Promise with the created Action object
 */
export const addAction = async (
  actionData: JournalAddActionBody
): Promise<Action> =>
  postJson(ROUTES.JOURNAL_ADD_ACTION, actionData, {}, { cacheBust: true });

/**
 * Removes an action
 * @param actionId The ID of the action to remove
 * @returns Promise with success status
 */
export const removeAction = async (
  actionId: string
): Promise<{ success: boolean }> =>
  postJson(
    ROUTES.JOURNAL_REMOVE_ACTION,
    { id: actionId },
    {},
    { cacheBust: true }
  );

/**
 * Registers an action (when user presses the action button)
 * @param actionId The ID of the action to register
 * @param value Optional value for custom input
 * @returns Promise with success status
 */
export const registerAction = async (
  actionId: string,
  value?: number
): Promise<{ success: boolean }> =>
  postJson(
    ROUTES.JOURNAL_REGISTER_ACTION,
    { id: actionId, value },
    {},
    { cacheBust: true }
  );

/**
 * Reorders an action to a new position
 * @param actionId The ID of the action to reorder
 * @param order The new order value for the action
 * @returns Promise with success status
 */
export const reorderAction = async (
  actionId: string,
  order: number
): Promise<{ success: boolean }> =>
  postJson(
    ROUTES.JOURNAL_REORDER_ACTION,
    { id: actionId, order },
    {},
    { cacheBust: true }
  );
