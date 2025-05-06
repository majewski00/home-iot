import { useState, useEffect, useCallback } from "react";
import {
  fetchJournalStructure,
  saveJournalStructure,
} from "../services/journalApi";
import {
  Journal,
  Group,
  Field,
  FieldType,
  FieldTypeKind,
} from "@src-types/journal/journal.types";
import { JournalSaveStructureBody } from "@src-types/journal/api.types";
import { v4 as uuidv4 } from "uuid";

// TODO: Fetch journal Stats from backend and add to the hook

interface UseJournalStructureReturn {
  structure: Journal | null;
  isLoading: boolean;
  error: string | null;
  hasChanges: boolean;
  addGroup: (name: string) => Promise<Group | null>;
  addField: (groupId: string, name: string) => Promise<Field | null>;
  addFieldType: (
    fieldId: string,
    kind: FieldTypeKind,
    name: string,
    dataType?: string
  ) => Promise<FieldType | null>;
  updateGroup: (
    groupId: string,
    updates: Partial<Omit<Group, "id" | "fields">>
  ) => Promise<boolean>;
  updateField: (
    fieldId: string,
    updates: Partial<Omit<Field, "id" | "fieldTypes">>
  ) => Promise<boolean>;
  updateFieldType: (
    fieldTypeId: string,
    updates: Partial<Omit<FieldType, "id">>
  ) => Promise<boolean>;
  removeGroup: (groupId: string) => Promise<boolean>;
  removeField: (fieldId: string) => Promise<boolean>;
  removeFieldType: (fieldTypeId: string) => Promise<boolean>;
  saveStructure: () => Promise<Journal | null>;
  refreshStructure: () => Promise<void>;
  reorderGroup: (groupId: string, newOrder: number) => Promise<boolean>;
  reorderField: (fieldId: string, newOrder: number) => Promise<boolean>;
  reorderFieldType: (fieldTypeId: string, newOrder: number) => Promise<boolean>;
}

/**
 * Hook for managing journal structure
 *
 * This hook is responsible for:
 * - Loading the journal structure
 * - Creating and modifying journal, groups, fields, and field types
 * - Saving changes to the backend
 *
 * @returns Journal structure and management functions
 */
export const useJournalStructure = (): UseJournalStructureReturn => {
  const [structure, setStructure] = useState<Journal | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [hasChanges, setHasChanges] = useState<boolean>(false);

  // Fetch journal structure
  const refreshStructure = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const journalStructure = await fetchJournalStructure();
      setStructure(journalStructure);
      setHasChanges(false);
    } catch (err) {
      setError("Failed to load journal structure");
      console.error("Error in useJournalStructure refresh:", err);
    } finally {
      setIsLoading(false);
    }
  }, []); // Removed 'structure' dependency

  useEffect(() => {
    refreshStructure();
  }, [refreshStructure]);

  const addGroup = async (
    name: string,
    order?: number
  ): Promise<Group | null> => {
    if (!structure) {
      setError("No journal exists");
      return null;
    }

    try {
      const nextOrder = order || structure.groups.length;

      const newGroup: Group = {
        id: uuidv4(),
        name,
        order: nextOrder,
        fields: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const updatedStructure = {
        ...structure,
        groups: [...structure.groups, newGroup],
        updatedAt: new Date().toISOString(),
      };

      setStructure(updatedStructure);
      setHasChanges(true);

      return newGroup;
    } catch (err) {
      setError("Failed to create group");
      console.error("Error creating group:", err);
      return null;
    }
  };

  const addField = async (
    groupId: string,
    name: string,
    order?: number
  ): Promise<Field | null> => {
    if (!structure) {
      setError("No journal exists");
      return null;
    }

    try {
      const group = structure.groups.find((g) => g.id === groupId);
      if (!group) {
        setError("Group not found");
        return null;
      }

      const nextOrder = order || group.fields.length;

      const newField: Field = {
        id: uuidv4(),
        groupId,
        name,
        order: nextOrder,
        fieldTypes: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const updatedGroups = structure.groups.map((g) => {
        if (g.id === groupId) {
          return {
            ...g,
            fields: [...g.fields, newField],
            updatedAt: new Date().toISOString(),
          };
        }
        return g;
      });

      const updatedStructure = {
        ...structure,
        groups: updatedGroups,
        updatedAt: new Date().toISOString(),
      };

      setStructure(updatedStructure);
      setHasChanges(true);

      return newField;
    } catch (err) {
      setError("Failed to create field");
      console.error("Error creating field:", err);
      return null;
    }
  };

  const addFieldType = async (
    fieldId: string,
    kind: FieldTypeKind,
    description: string,
    dataType?: string,
    order?: number
  ): Promise<FieldType | null> => {
    if (!structure) {
      setError("No journal exists");
      return null;
    }

    try {
      let field: Field | null = null;
      let groupId: string | null = null;

      for (const group of structure.groups) {
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

      const nextOrder = order || field.fieldTypes.length;

      const newFieldType: FieldType = {
        id: uuidv4(),
        fieldId,
        kind,
        description: description,
        dataType,
        order: nextOrder,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const updatedGroups = structure.groups.map((g) => {
        if (g.id === groupId) {
          const updatedFields = g.fields.map((f) => {
            if (f.id === fieldId) {
              return {
                ...f,
                fieldTypes: [...f.fieldTypes, newFieldType],
                updatedAt: new Date().toISOString(),
              };
            }
            return f;
          });

          return {
            ...g,
            fields: updatedFields,
            updatedAt: new Date().toISOString(),
          };
        }
        return g;
      });

      const updatedStructure = {
        ...structure,
        groups: updatedGroups,
        updatedAt: new Date().toISOString(),
      };

      setStructure(updatedStructure);
      setHasChanges(true);

      return newFieldType;
    } catch (err) {
      setError("Failed to create field type");
      console.error("Error creating field type:", err);
      return null;
    }
  };

  const updateGroup = async (
    groupId: string,
    updates: Partial<Omit<Group, "id" | "fields">>
  ): Promise<boolean> => {
    if (!structure) {
      setError("No journal exists");
      return false;
    }

    try {
      const groupIndex = structure.groups.findIndex((g) => g.id === groupId);
      if (groupIndex === -1) {
        setError("Group not found");
        return false;
      }

      const updatedGroups = [...structure.groups];
      updatedGroups[groupIndex] = {
        ...updatedGroups[groupIndex],
        ...updates,
        updatedAt: new Date().toISOString(),
      };

      const updatedStructure = {
        ...structure,
        groups: updatedGroups,
        updatedAt: new Date().toISOString(),
      };

      setStructure(updatedStructure);
      setHasChanges(true);

      return true;
    } catch (err) {
      setError("Failed to update group");
      console.error("Error updating group:", err);
      return false;
    }
  };

  const updateField = async (
    fieldId: string,
    updates: Partial<Omit<Field, "id" | "groupId" | "fieldTypes">>
  ): Promise<boolean> => {
    if (!structure) {
      setError("No journal exists");
      return false;
    }

    try {
      let fieldFound = false;
      const updatedGroups = structure.groups.map((g) => {
        const fieldIndex = g.fields.findIndex((f) => f.id === fieldId);
        if (fieldIndex !== -1) {
          fieldFound = true;
          const updatedFields = [...g.fields];
          updatedFields[fieldIndex] = {
            ...updatedFields[fieldIndex],
            ...updates,
            updatedAt: new Date().toISOString(),
          };

          return {
            ...g,
            fields: updatedFields,
            updatedAt: new Date().toISOString(),
          };
        }
        return g;
      });
      if (!fieldFound) {
        setError("Field not found");
        return false;
      }

      const updatedStructure = {
        ...structure,
        groups: updatedGroups,
        updatedAt: new Date().toISOString(),
      };

      setStructure(updatedStructure);
      setHasChanges(true);

      return true;
    } catch (err) {
      setError("Failed to update field");
      console.error("Error updating field:", err);
      return false;
    }
  };

  const updateFieldType = async (
    fieldTypeId: string,
    updates: Partial<Omit<FieldType, "id" | "fieldId">>
  ): Promise<boolean> => {
    if (!structure) {
      setError("No journal exists");
      return false;
    }

    try {
      let fieldTypeFound = false;
      const updatedGroups = structure.groups.map((g) => {
        const updatedFields = g.fields.map((f) => {
          const fieldTypeIndex = f.fieldTypes.findIndex(
            (ft) => ft.id === fieldTypeId
          );
          if (fieldTypeIndex !== -1) {
            fieldTypeFound = true;
            const updatedFieldTypes = [...f.fieldTypes];
            updatedFieldTypes[fieldTypeIndex] = {
              ...updatedFieldTypes[fieldTypeIndex],
              ...updates,
              updatedAt: new Date().toISOString(),
            };

            return {
              ...f,
              fieldTypes: updatedFieldTypes,
              updatedAt: new Date().toISOString(),
            };
          }
          return f;
        });

        if (
          updatedFields.some((f) => f !== g.fields.find((gf) => gf.id === f.id))
        ) {
          return {
            ...g,
            fields: updatedFields,
            updatedAt: new Date().toISOString(),
          };
        }
        return g;
      });

      if (!fieldTypeFound) {
        setError("Field type not found");
        return false;
      }

      const updatedStructure = {
        ...structure,
        groups: updatedGroups,
        updatedAt: new Date().toISOString(),
      };

      setStructure(updatedStructure);
      setHasChanges(true);

      return true;
    } catch (err) {
      setError("Failed to update field type");
      console.error("Error updating field type:", err);
      return false;
    }
  };

  const removeGroup = async (groupId: string): Promise<boolean> => {
    if (!structure) {
      setError("No journal exists");
      return false;
    }

    try {
      const updatedGroups = structure.groups.filter((g) => g.id !== groupId);

      if (updatedGroups.length === structure.groups.length) {
        setError("Group not found");
        return false;
      }

      const reorderedGroups = updatedGroups.map((g, index) => ({
        ...g,
        order: index,
      }));

      const updatedStructure = {
        ...structure,
        groups: reorderedGroups,
        updatedAt: new Date().toISOString(),
      };

      setStructure(updatedStructure);
      setHasChanges(true);

      return true;
    } catch (err) {
      setError("Failed to remove group");
      console.error("Error removing group:", err);
      return false;
    }
  };

  const removeField = async (fieldId: string): Promise<boolean> => {
    if (!structure) {
      setError("No journal exists");
      return false;
    }

    try {
      let fieldFound = false;
      const updatedGroups = structure.groups.map((g) => {
        const fieldIndex = g.fields.findIndex((f) => f.id === fieldId);
        if (fieldIndex !== -1) {
          fieldFound = true;
          const updatedFields = g.fields.filter((f) => f.id !== fieldId);

          const reorderedFields = updatedFields.map((f, index) => ({
            ...f,
            order: index,
          }));

          return {
            ...g,
            fields: reorderedFields,
            updatedAt: new Date().toISOString(),
          };
        }
        return g;
      });

      if (!fieldFound) {
        setError("Field not found");
        return false;
      }

      const updatedStructure = {
        ...structure,
        groups: updatedGroups,
        updatedAt: new Date().toISOString(),
      };

      setStructure(updatedStructure);
      setHasChanges(true);

      return true;
    } catch (err) {
      setError("Failed to remove field");
      console.error("Error removing field:", err);
      return false;
    }
  };

  const removeFieldType = async (fieldTypeId: string): Promise<boolean> => {
    if (!structure) {
      setError("No journal exists");
      return false;
    }

    try {
      let fieldTypeFound = false;
      const updatedGroups = structure.groups.map((g) => {
        const updatedFields = g.fields.map((f) => {
          const fieldTypeIndex = f.fieldTypes.findIndex(
            (ft) => ft.id === fieldTypeId
          );
          if (fieldTypeIndex !== -1) {
            fieldTypeFound = true;
            const updatedFieldTypes = f.fieldTypes.filter(
              (ft) => ft.id !== fieldTypeId
            );

            const reorderedFieldTypes = updatedFieldTypes.map((ft, index) => ({
              ...ft,
              order: index,
            }));

            return {
              ...f,
              fieldTypes: reorderedFieldTypes,
              updatedAt: new Date().toISOString(),
            };
          }
          return f;
        });

        if (
          updatedFields.some((f) => f !== g.fields.find((gf) => gf.id === f.id))
        ) {
          return {
            ...g,
            fields: updatedFields,
            updatedAt: new Date().toISOString(),
          };
        }
        return g;
      });

      if (!fieldTypeFound) {
        setError("Field type not found");
        return false;
      }

      const updatedStructure = {
        ...structure,
        groups: updatedGroups,
        updatedAt: new Date().toISOString(),
      };

      setStructure(updatedStructure);
      setHasChanges(true);

      return true;
    } catch (err) {
      setError("Failed to remove field type");
      console.error("Error removing field type:", err);
      return false;
    }
  };

  const reorderGroup = async (
    groupId: string,
    newOrder: number
  ): Promise<boolean> => {
    if (!structure) {
      setError("No journal exists");
      return false;
    }

    try {
      const groupIndex = structure.groups.findIndex((g) => g.id === groupId);
      if (groupIndex === -1) {
        setError("Group not found");
        return false;
      }

      if (newOrder < 0 || newOrder >= structure.groups.length) {
        setError("Invalid order value");
        return false;
      }

      const groupToMove = structure.groups[groupIndex];
      const remainingGroups = structure.groups.filter((g) => g.id !== groupId);

      remainingGroups.splice(newOrder, 0, {
        ...groupToMove,
        order: newOrder,
        updatedAt: new Date().toISOString(),
      });

      const reorderedGroups = remainingGroups.map((g, index) => ({
        ...g,
        order: index,
        updatedAt: new Date().toISOString(),
      }));

      const updatedStructure = {
        ...structure,
        groups: reorderedGroups,
        updatedAt: new Date().toISOString(),
      };

      setStructure(updatedStructure);
      setHasChanges(true);

      return true;
    } catch (err) {
      setError("Failed to reorder group");
      console.error("Error reordering group:", err);
      return false;
    }
  };

  const reorderField = async (
    fieldId: string,
    newOrder: number
  ): Promise<boolean> => {
    if (!structure) {
      setError("No journal exists");
      return false;
    }

    try {
      let fieldFound = false;
      let targetGroup: Group | null = null;
      let fieldToMove: Field | null = null;

      for (const group of structure.groups) {
        const field = group.fields.find((f) => f.id === fieldId);
        if (field) {
          fieldFound = true;
          targetGroup = group;
          fieldToMove = field;
          break;
        }
      }

      if (!fieldFound || !targetGroup || !fieldToMove) {
        setError("Field not found");
        return false;
      }

      if (newOrder < 0 || newOrder >= targetGroup.fields.length) {
        setError("Invalid order value");
        return false;
      }

      const remainingFields = targetGroup.fields.filter(
        (f) => f.id !== fieldId
      );

      remainingFields.splice(newOrder, 0, {
        ...fieldToMove,
        order: newOrder,
        updatedAt: new Date().toISOString(),
      });

      const reorderedFields = remainingFields.map((f, index) => ({
        ...f,
        order: index,
        updatedAt: new Date().toISOString(),
      }));

      const updatedGroups = structure.groups.map((g) => {
        if (g.id === targetGroup?.id) {
          return {
            ...g,
            fields: reorderedFields,
            updatedAt: new Date().toISOString(),
          };
        }
        return g;
      });

      const updatedStructure = {
        ...structure,
        groups: updatedGroups,
        updatedAt: new Date().toISOString(),
      };

      setStructure(updatedStructure);
      setHasChanges(true);

      return true;
    } catch (err) {
      setError("Failed to reorder field");
      console.error("Error reordering field:", err);
      return false;
    }
  };

  const reorderFieldType = async (
    fieldTypeId: string,
    newOrder: number
  ): Promise<boolean> => {
    if (!structure) {
      setError("No journal exists");
      return false;
    }

    try {
      let fieldTypeFound = false;
      let targetField: Field | null = null;
      let fieldTypeToMove: FieldType | null = null;

      for (const group of structure.groups) {
        for (const field of group.fields) {
          const fieldType = field.fieldTypes.find(
            (ft) => ft.id === fieldTypeId
          );
          if (fieldType) {
            fieldTypeFound = true;
            targetField = field;
            fieldTypeToMove = fieldType;
            break;
          }
        }
        if (fieldTypeFound) break;
      }

      if (!fieldTypeFound || !targetField || !fieldTypeToMove) {
        setError("Field type not found");
        return false;
      }

      if (newOrder < 0 || newOrder >= targetField.fieldTypes.length) {
        setError("Invalid order value");
        return false;
      }

      const remainingFieldTypes = targetField.fieldTypes.filter(
        (ft) => ft.id !== fieldTypeId
      );

      remainingFieldTypes.splice(newOrder, 0, {
        ...fieldTypeToMove,
        order: newOrder,
        updatedAt: new Date().toISOString(),
      });

      const reorderedFieldTypes = remainingFieldTypes.map((ft, index) => ({
        ...ft,
        order: index,
        updatedAt: new Date().toISOString(),
      }));

      const updatedGroups = structure.groups.map((g) => {
        const updatedFields = g.fields.map((f) => {
          if (f.id === targetField?.id) {
            return {
              ...f,
              fieldTypes: reorderedFieldTypes,
              updatedAt: new Date().toISOString(),
            };
          }
          return f;
        });

        if (
          updatedFields.some((f) => f !== g.fields.find((gf) => gf.id === f.id))
        ) {
          return {
            ...g,
            fields: updatedFields,
            updatedAt: new Date().toISOString(),
          };
        }
        return g;
      });

      const updatedStructure = {
        ...structure,
        groups: updatedGroups,
        updatedAt: new Date().toISOString(),
      };

      setStructure(updatedStructure);
      setHasChanges(true);

      return true;
    } catch (err) {
      setError("Failed to reorder field type");
      console.error("Error reordering field type:", err);
      return false;
    }
  };

  const saveStructure = async (): Promise<Journal | null> => {
    if (!structure) {
      setError("No journal exists");
      return null;
    }

    try {
      setIsLoading(true);
      setError(null);

      const saveData: JournalSaveStructureBody = {
        groups: structure.groups,
      };

      const savedJournal = await saveJournalStructure(saveData);

      setStructure(savedJournal);
      setHasChanges(false);

      return savedJournal;
    } catch (err) {
      setError("Failed to save journal structure");
      console.error("Error saving journal structure:", err);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    structure,
    isLoading,
    error,
    hasChanges,
    addGroup,
    addField,
    addFieldType,
    updateGroup,
    updateField,
    updateFieldType,
    removeGroup,
    removeField,
    removeFieldType,
    saveStructure,
    refreshStructure,
    reorderGroup,
    reorderField,
    reorderFieldType,
  };
};
