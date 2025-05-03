import { useState, useEffect, useCallback } from "react";
import {
  fetchJournalEntry,
  saveJournalEntry,
  updateFieldValue,
} from "../services/journalApi";
import { Journal, JournalEntry, FieldValue } from "../types/journal.types";

interface UseJournalEntryReturn {
  entry: JournalEntry | null;
  isLoading: boolean;
  error: string | null;
  saveEntry: (values: FieldValue[]) => Promise<JournalEntry | null>;
  updateValue: (
    fieldId: string,
    fieldTypeId: string,
    value: string | number | null,
    filled: boolean
  ) => Promise<FieldValue | null>;
  refreshEntry: () => Promise<void>;
}

/**
 * Hook for managing journal entries for a specific date
 * @param journal The journal object
 * @param date The date in YYYY-MM-DD format
 * @returns Journal entry data and functions
 */
export const useJournalEntry = (
  journal: Journal | null,
  date: string
): UseJournalEntryReturn => {
  const [entry, setEntry] = useState<JournalEntry | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch journal entry for the specified date
  const refreshEntry = useCallback(async () => {
    if (!journal) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      const entryData = await fetchJournalEntry(journal.id, date);
      setEntry(entryData);
    } catch (err) {
      setError("Failed to fetch journal entry");
      console.error("Error in useJournalEntry:", err);
    } finally {
      setIsLoading(false);
    }
  }, [journal, date]);

  // Initial fetch
  useEffect(() => {
    refreshEntry();
  }, [refreshEntry]);

  // Save the entire journal entry
  const saveEntry = async (
    values: FieldValue[]
  ): Promise<JournalEntry | null> => {
    if (!journal) {
      setError("No journal exists");
      return null;
    }

    try {
      setIsLoading(true);
      setError(null);

      const entryData: Omit<JournalEntry, "id" | "createdAt" | "updatedAt"> = {
        journalId: journal.id,
        date,
        values,
      };

      const savedEntry = await saveJournalEntry(entryData);

      if (savedEntry) {
        setEntry(savedEntry);
        return savedEntry;
      }
      return null;
    } catch (err) {
      setError("Failed to save journal entry");
      console.error("Error saving journal entry:", err);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  // Update a single field value
  const updateValue = async (
    fieldId: string,
    fieldTypeId: string,
    value: string | number | null,
    filled: boolean
  ): Promise<FieldValue | null> => {
    if (!journal || !entry) {
      setError("No journal or entry exists");
      return null;
    }

    try {
      setIsLoading(true);
      setError(null);

      const updatedValue = await updateFieldValue(
        entry.id,
        fieldId,
        fieldTypeId,
        value,
        filled
      );

      if (updatedValue) {
        // Update local state
        const updatedValues = entry.values.map((v) => {
          if (v.fieldId === fieldId && v.fieldTypeId === fieldTypeId) {
            return updatedValue;
          }
          return v;
        });

        // If the value doesn't exist in the current values, add it
        const valueExists = updatedValues.some(
          (v) => v.fieldId === fieldId && v.fieldTypeId === fieldTypeId
        );

        if (!valueExists) {
          updatedValues.push(updatedValue);
        }

        setEntry({
          ...entry,
          values: updatedValues,
        });

        return updatedValue;
      }
      return null;
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
    saveEntry,
    updateValue,
    refreshEntry,
  };
};
