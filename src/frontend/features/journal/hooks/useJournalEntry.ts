import { useState, useEffect, useCallback } from "react";
import { saveJournalEntry, fetchJournalEntry } from "../services/journalApi";
import {
  Journal,
  JournalEntry,
  FieldValue,
} from "@src-types/journal/journal.types";
import { ApiError } from "@apiHandler";

interface UseJournalEntryReturn {
  entry: JournalEntry | null;
  isLoading: boolean;
  error: string | null;
  hasChanges: boolean;
  saveEntry: () => Promise<JournalEntry | null>;
  updateValue: (
    fieldData: Omit<FieldValue, "createdAt" | "updatedAt">
  ) => Promise<FieldValue | null>;
  refreshEntry: () => Promise<void>;
}

/**
 * Validates if a given string is in the "YYYY-MM-DD" format.
 * @param dateStr - The string to validate.
 * @returns True if the string is in "YYYY-MM-DD" format, otherwise false.
 */
export function isValidDateFormat(dateStr: string): boolean {
  const regex = /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/;
  return regex.test(dateStr);
}

/**
 * Hook for managing journal entries for a specific date
 * @param journal The journal object
 * @param date The date in YYYY-MM-DD format
 * @returns Journal entry data and functions
 */
export const useJournalEntry = (
  journal: Journal | null,
  date: string,
  isEditMode: boolean = false
): UseJournalEntryReturn => {
  const [entry, setEntry] = useState<JournalEntry | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [hasChanges, setHasChanges] = useState<boolean>(false);

  useEffect(() => {
    if (error) {
      console.error("Error:", error);
    }
  }, [error]);

  const validate = useCallback((): boolean => {
    if (!journal) {
      setError("No journal exists");
      return false;
    }
    if (!isValidDateFormat(date)) {
      setError("Invalid date format. Expected YYYY-MM-DD.");
      return false;
    }
    setError(null);
    return true;
  }, [journal, date]);

  // // If no entry exists for the date, create a new, blank entry
  // const createJournalEntry = useCallback(async (): Promise<JournalEntry> => {
  //   if (!journal?.groups) {
  //     return {
  //       date,
  //       values: [],
  //       createdAt: new Date().toISOString(),
  //       updatedAt: new Date().toISOString(),
  //     };
  //   }

  //   const fieldValues: FieldValue[] = journal.groups.flatMap((group) =>
  //     group.fields.flatMap((field) =>
  //       field.fieldTypes.map((fieldType) => ({
  //         groupId: group.id,
  //         fieldId: field.id,
  //         fieldTypeId: fieldType.id,
  //         value: null,
  //         createdAt: new Date().toISOString(),
  //         updatedAt: new Date().toISOString(),
  //       }))
  //     )
  //   );

  //   return {
  //     date,
  //     values: fieldValues,
  //     createdAt: new Date().toISOString(),
  //     updatedAt: new Date().toISOString(),
  //   };
  // }, [journal, date]);

  // Fetch journal entry for the specified date
  const refreshEntry = useCallback(async () => {
    if (!validate()) return;

    try {
      setIsLoading(true);
      setError(null);

      const entryData = await fetchJournalEntry(date);

      setEntry(entryData);
      setHasChanges(false);
    } catch (err) {
      // if (err instanceof ApiError) {
      //   if (err.status === 404) {
      //     // Entry not found, create a new one
      //     try {
      //       const newEntry = await createJournalEntry();
      //       setEntry(newEntry);
      //       setHasChanges(true); // Set to true since this is a new entry that needs to be saved
      //     } catch (createErr) {
      //       setError("Failed to create new journal entry");
      //     }
      //   } else {
      setError(`Failed to fetch journal entry`);
      // }
      // } else {
      //   console.error("Unexpected error fetching journal entry:", err);
      //   setError("Failed to fetch journal entry");
      // }
    } finally {
      setIsLoading(false);
    }
  }, [date, validate]); // , createJournalEntry

  // Only run when date changes or component mounts
  useEffect(() => {
    // Only fetch if journal is available
    if (journal && !isEditMode) {
      refreshEntry();
    }
  }, [date, journal, isEditMode, validate]); // , createJournalEntry

  const saveEntry = async (): Promise<JournalEntry | null> => {
    if (!validate()) return null;

    if (!entry) {
      setError("No journal entry exists to update");
      return null;
    }

    if (!hasChanges) return entry;

    try {
      setIsLoading(true);
      setError(null);

      const savedEntry = await saveJournalEntry(entry);

      setEntry(savedEntry);
      setHasChanges(false);

      return savedEntry;
    } catch (err) {
      setError("Failed to save journal entry");
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const updateValue = async (
    fieldData: Omit<FieldValue, "createdAt" | "updatedAt">
  ): Promise<FieldValue | null> => {
    if (!validate()) return null;

    if (!entry) {
      setError("No journal entry exists to update");
      return null;
    }

    try {
      setIsLoading(true);
      setError(null);

      let updatedValues = [...entry.values];
      const now = new Date().toISOString();

      const fieldIndex = updatedValues.findIndex(
        (field) =>
          field.groupId === fieldData.groupId &&
          field.fieldId === fieldData.fieldId &&
          field.fieldTypeId === fieldData.fieldTypeId
      );

      if (fieldIndex !== -1) {
        updatedValues[fieldIndex] = {
          ...updatedValues[fieldIndex],
          ...fieldData,
          updatedAt: now,
        };
      } else {
        const newField: FieldValue = {
          ...fieldData,
          createdAt: now,
          updatedAt: now,
        };
        updatedValues.push(newField);
      }

      const updatedEntry = { ...entry, values: updatedValues, updatedAt: now };
      setEntry(updatedEntry);
      setHasChanges(true);

      // Return the updated or newly created field value
      const resultField = updatedValues.find(
        (field) =>
          field.groupId === fieldData.groupId &&
          field.fieldId === fieldData.fieldId &&
          field.fieldTypeId === fieldData.fieldTypeId
      );
      return resultField || null;
    } catch (err) {
      setError("Failed to update field value");
      console.error("Error updating field value:", err);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    entry,
    isLoading,
    error,
    hasChanges,
    saveEntry,
    updateValue,
    refreshEntry,
  };
};
