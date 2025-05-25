import { useState, useEffect, useCallback } from "react";
import {
  saveJournalEntry,
  fetchJournalEntry,
  quickFillJournal,
} from "../services/journalApi";
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
  quickFillValues: () => Promise<boolean>;
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
      setError(`Failed to fetch journal entry`);
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

  const quickFillValues = async (): Promise<boolean> => {
    if (!validate()) return false;

    try {
      setIsLoading(true);
      setError(null);

      const { success, entry: filledEntry } = await quickFillJournal({ date });

      if (!success || !filledEntry) {
        setError("Failed to fill with yesterday's values");
        return false;
      }

      setEntry(filledEntry);
      setHasChanges(false); // Values are already saved

      return true;
    } catch (err) {
      if (err instanceof ApiError && err.status === 404) {
        setError("No entry found for yesterday");
      } else {
        setError("Failed to fill with yesterday's values");
      }
      return false;
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
    quickFillValues,
  };
};
