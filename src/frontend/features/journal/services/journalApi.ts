import { getJson, postJson } from "../../../services/apis/handler";
import * as routes from "@apiRoutes";
import {
  Journal,
  Group,
  Field,
  FieldType,
  JournalEntry,
  FieldValue,
  JournalStats,
} from "../types/journal.types";

/**
 * Fetches the user's journal
 * @returns Promise with the user's journal
 */
export const fetchJournal = async (): Promise<Journal | null> => {
  try {
    return await getJson(routes.FETCH_JOURNAL);
  } catch (error) {
    console.error("Error fetching journal:", error);
    return null;
  }
};

/**
 * Creates a new journal for the user
 * @param name Journal name
 * @returns Promise with the created journal
 */
export const createJournal = async (name: string): Promise<Journal | null> => {
  try {
    return await postJson(routes.CREATE_JOURNAL, { name });
  } catch (error) {
    console.error("Error creating journal:", error);
    return null;
  }
};

/**
 * Creates a new group in the journal
 * @param journalId Journal ID
 * @param name Group name
 * @param order Group order
 * @returns Promise with the created group
 */
export const createGroup = async (
  journalId: string,
  name: string,
  order: number
): Promise<Group | null> => {
  try {
    return await postJson(routes.CREATE_GROUP, {
      journalId,
      name,
      order,
    });
  } catch (error) {
    console.error("Error creating group:", error);
    return null;
  }
};

/**
 * Creates a new field in a group
 * @param groupId Group ID
 * @param name Field name
 * @param order Field order
 * @returns Promise with the created field
 */
export const createField = async (
  groupId: string,
  name: string,
  order: number
): Promise<Field | null> => {
  try {
    return await postJson(routes.CREATE_FIELD, {
      groupId,
      name,
      order,
    });
  } catch (error) {
    console.error("Error creating field:", error);
    return null;
  }
};

/**
 * Creates a new field type for a field
 * @param fieldId Field ID
 * @param fieldType Field type data
 * @returns Promise with the created field type
 */
export const createFieldType = async (
  fieldId: string,
  fieldType: Omit<FieldType, "id" | "fieldId" | "createdAt" | "updatedAt">
): Promise<FieldType | null> => {
  try {
    return await postJson(routes.CREATE_FIELD_TYPE, {
      fieldId,
      ...fieldType,
    });
  } catch (error) {
    console.error("Error creating field type:", error);
    return null;
  }
};

/**
 * Fetches a journal entry for a specific date
 * @param journalId Journal ID
 * @param date Date in YYYY-MM-DD format
 * @returns Promise with the journal entry
 */
export const fetchJournalEntry = async (
  journalId: string,
  date: string
): Promise<JournalEntry | null> => {
  try {
    return await getJson(routes.FETCH_JOURNAL_ENTRY, {}, { journalId, date });
  } catch (error) {
    console.error("Error fetching journal entry:", error);
    return null;
  }
};

/**
 * Creates or updates a journal entry
 * @param entry Journal entry data
 * @returns Promise with the created/updated journal entry
 */
export const saveJournalEntry = async (
  entry: Omit<JournalEntry, "id" | "createdAt" | "updatedAt">
): Promise<JournalEntry | null> => {
  try {
    return await postJson(routes.SAVE_JOURNAL_ENTRY, entry);
  } catch (error) {
    console.error("Error saving journal entry:", error);
    return null;
  }
};

/**
 * Updates a field value in a journal entry
 * @param entryId Entry ID
 * @param fieldId Field ID
 * @param fieldTypeId Field type ID
 * @param value Field value
 * @param filled Whether the field is filled
 * @returns Promise with the updated field value
 */
export const updateFieldValue = async (
  entryId: string,
  fieldId: string,
  fieldTypeId: string,
  value: string | number | null,
  filled: boolean
): Promise<FieldValue | null> => {
  try {
    return await postJson(routes.UPDATE_FIELD_VALUE, {
      entryId,
      fieldId,
      fieldTypeId,
      value,
      filled,
    });
  } catch (error) {
    console.error("Error updating field value:", error);
    return null;
  }
};

/**
 * Fetches journal statistics
 * @param journalId Journal ID
 * @returns Promise with journal statistics
 */
export const fetchJournalStats = async (
  journalId: string
): Promise<JournalStats | null> => {
  try {
    return await getJson(routes.FETCH_JOURNAL_STATS, {}, { journalId });
  } catch (error) {
    console.error("Error fetching journal stats:", error);
    return null;
  }
};
