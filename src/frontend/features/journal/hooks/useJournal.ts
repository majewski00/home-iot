import { useState, useEffect, useCallback } from "react";
import {
  fetchJournal,
  createJournal,
  createGroup,
  createField,
  createFieldType,
  fetchJournalStats,
} from "../services/journalApi";
import {
  Journal,
  Group,
  Field,
  FieldType,
  FieldTypeKind,
  JournalStats,
} from "../types/journal.types";

interface UseJournalReturn {
  journal: Journal | null;
  isLoading: boolean;
  error: string | null;
  stats: JournalStats | null;
  createNewJournal: (name: string) => Promise<Journal | null>;
  addGroup: (name: string) => Promise<Group | null>;
  addField: (groupId: string, name: string) => Promise<Field | null>;
  addFieldType: (
    fieldId: string,
    kind: FieldTypeKind,
    name: string,
    dataType?: string
  ) => Promise<FieldType | null>;
  refreshJournal: () => Promise<void>;
}

/**
 * Hook for managing journal data
 * @returns Journal data and functions
 */
export const useJournal = (): UseJournalReturn => {
  const [journal, setJournal] = useState<Journal | null>(null);
  const [stats, setStats] = useState<JournalStats | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch journal data
  const refreshJournal = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const journalData = await fetchJournal();
      setJournal(journalData);

      // If journal exists, fetch stats
      if (journalData) {
        const statsData = await fetchJournalStats(journalData.id);
        setStats(statsData);
      }
    } catch (err) {
      setError("Failed to fetch journal data");
      console.error("Error in useJournal:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initial fetch
  useEffect(() => {
    refreshJournal();
  }, [refreshJournal]);

  // Create a new journal
  const createNewJournal = async (name: string): Promise<Journal | null> => {
    try {
      setIsLoading(true);
      setError(null);

      // Create journal
      const newJournal = await createJournal(name);

      if (newJournal) {
        // Create default group
        const defaultGroup = await createGroup(newJournal.id, "My Journal", 0);

        if (defaultGroup) {
          // Update local state
          setJournal({
            ...newJournal,
            groups: [defaultGroup],
          });
        } else {
          setJournal(newJournal);
        }

        return newJournal;
      }
      return null;
    } catch (err) {
      setError("Failed to create journal");
      console.error("Error creating journal:", err);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  // Add a new group to the journal
  const addGroup = async (name: string): Promise<Group | null> => {
    if (!journal) {
      setError("No journal exists");
      return null;
    }

    try {
      setIsLoading(true);
      setError(null);

      // Calculate next order
      const nextOrder = journal.groups.length;

      // Create group
      const newGroup = await createGroup(journal.id, name, nextOrder);

      if (newGroup) {
        // Update local state
        setJournal({
          ...journal,
          groups: [...journal.groups, newGroup],
        });
        return newGroup;
      }
      return null;
    } catch (err) {
      setError("Failed to create group");
      console.error("Error creating group:", err);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  // Add a new field to a group
  const addField = async (
    groupId: string,
    name: string
  ): Promise<Field | null> => {
    if (!journal) {
      setError("No journal exists");
      return null;
    }

    try {
      setIsLoading(true);
      setError(null);

      // Find group
      const group = journal.groups.find((g) => g.id === groupId);
      if (!group) {
        setError("Group not found");
        return null;
      }

      // Calculate next order
      const nextOrder = group.fields.length;

      // Create field
      const newField = await createField(groupId, name, nextOrder);

      if (newField) {
        // Update local state
        const updatedGroups = journal.groups.map((g) => {
          if (g.id === groupId) {
            return {
              ...g,
              fields: [...g.fields, newField],
            };
          }
          return g;
        });

        setJournal({
          ...journal,
          groups: updatedGroups,
        });
        return newField;
      }
      return null;
    } catch (err) {
      setError("Failed to create field");
      console.error("Error creating field:", err);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  // Add a new field type to a field
  const addFieldType = async (
    fieldId: string,
    kind: FieldTypeKind,
    name: string,
    dataType?: string
  ): Promise<FieldType | null> => {
    if (!journal) {
      setError("No journal exists");
      return null;
    }

    try {
      setIsLoading(true);
      setError(null);

      // Find field
      let field: Field | null = null;
      let groupId: string | null = null;

      for (const group of journal.groups) {
        const foundField = group.fields.find((f) => f.id === fieldId);
        if (foundField) {
          field = foundField;
          groupId = group.id;
          break;
        }
      }

      if (!field || !groupId) {
        setError("Field not found");
        return null;
      }

      // Calculate next order
      const nextOrder = field.fieldTypes.length;

      // Create field type
      const fieldTypeData: Omit<
        FieldType,
        "id" | "fieldId" | "createdAt" | "updatedAt"
      > = {
        kind,
        name,
        dataType,
        order: nextOrder,
      };

      const newFieldType = await createFieldType(fieldId, fieldTypeData);

      if (newFieldType) {
        // Update local state
        const updatedGroups = journal.groups.map((g) => {
          if (g.id === groupId) {
            const updatedFields = g.fields.map((f) => {
              if (f.id === fieldId) {
                return {
                  ...f,
                  fieldTypes: [...f.fieldTypes, newFieldType],
                };
              }
              return f;
            });

            return {
              ...g,
              fields: updatedFields,
            };
          }
          return g;
        });

        setJournal({
          ...journal,
          groups: updatedGroups,
        });
        return newFieldType;
      }
      return null;
    } catch (err) {
      setError("Failed to create field type");
      console.error("Error creating field type:", err);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    journal,
    isLoading,
    error,
    stats,
    createNewJournal,
    addGroup,
    addField,
    addFieldType,
    refreshJournal,
  };
};
