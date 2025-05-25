import { useState, useEffect, useCallback, useMemo } from "react";
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
import { ApiError } from "@apiHandler";

// TODO: Fetch journal Stats from backend and add to the hook

export interface UseJournalStructureMethods {
  addGroup: (name: string) => Promise<Group | null>;
  addField: (
    groupId: string,
    name: string,
    targetIndex?: number | null
  ) => Promise<Field | null>;
  addFieldType: (
    fieldId: string,
    kind: FieldTypeKind,
    description?: string,
    dataOptions?: Record<string, string | number>
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

export interface UseJournalStructureReturn {
  structure: Journal | null;
  isLoading: boolean;
  error: string | null;
  hasChanges: boolean;
  newUser: boolean;
  isHistorical: boolean;
  methods: UseJournalStructureMethods;
}

/**
 * Hook for managing journal structure
 *
 * This hook is responsible for:
 * - Loading the journal structure
 * - Creating and modifying journal, groups, fields, and field types
 * - Saving changes to the backend
 *
 * @param date Optional date to fetch historical structure for
 * @returns Journal structure and management functions
 */
export const useJournalStructure = (
  date: string = new Date().toISOString().split("T")[0]
): UseJournalStructureReturn => {
  const [structure, setStructure] = useState<Journal | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [hasChanges, setHasChanges] = useState<boolean>(false);
  const [newUser, setNewUser] = useState<boolean>(false);
  const [isHistorical, setIsHistorical] = useState<boolean>(false);
  const [deletedElements, setDeletedElements] = useState<{
    groups: string[];
    fields: string[];
    fieldTypes: string[];
  }>({ groups: [], fields: [], fieldTypes: [] });

  const createDefaultStructure = useCallback(async (): Promise<Journal> => {
    const defaultStructure: Journal = {
      structureId: uuidv4(),
      isActive: true,
      effectiveFrom: new Date().toISOString(),
      groups: [
        {
          id: uuidv4(),
          name: "My Journal",
          order: 0,
          fields: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    try {
      const saveData: JournalSaveStructureBody = {
        groups: defaultStructure.groups,
        currentDate: date, // THis will always be today's date
      };
      const savedStructure = await saveJournalStructure(saveData);
      setStructure(savedStructure);
      setNewUser(true);
      setHasChanges(false);
    } catch (error) {
      setError("Failed to create default structure");
      console.error("Error creating default structure:", error);
      setHasChanges(true);
    }
    return defaultStructure;
  }, []);

  const refreshStructure = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const journalStructure = await fetchJournalStructure(date);
      setStructure(journalStructure);
      setDeletedElements({ groups: [], fields: [], fieldTypes: [] });
      setHasChanges(false);

      // Determine if this is a historical structure
      setIsHistorical(!journalStructure.isActive);
    } catch (err) {
      if (err instanceof ApiError && err.status === 404) {
        if (date === new Date().toISOString().split("T")[0]) {
          await createDefaultStructure();
        } else {
          setError("No structure found for the selected date");
        }
      } else {
        setError("Failed to load journal structure");
        console.error("Error in useJournalStructure refresh:", err);
      }
    } finally {
      setIsLoading(false);
    }
  }, [createDefaultStructure, date]);

  useEffect(() => {
    refreshStructure();
    console.log("useJournalStructure: refreshStructure called");
    // TODO: if newUser --> back to false
  }, [refreshStructure, createDefaultStructure, date]);

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
    targetIndex: number | null = null // Changed 'order' to 'targetIndex', defaulting to null
  ): Promise<Field | null> => {
    if (!structure) {
      setError("No journal exists");
      return null;
    }

    try {
      const groupIndex = structure.groups.findIndex((g) => g.id === groupId);
      if (groupIndex === -1) {
        setError("Group not found");
        return null;
      }

      const group = structure.groups[groupIndex];
      const newFieldId = uuidv4(); // Generate a new ID for the field

      // Create default CHECK field type
      const defaultCheckFieldType: FieldType = {
        id: uuidv4(),
        fieldId: newFieldId,
        kind: "CHECK",
        order: 10, // Associate with high order to ensure it's last
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const newField: Field = {
        id: newFieldId,
        groupId,
        name,
        order: 0, // Placeholder, will be set correctly below
        fieldTypes: [defaultCheckFieldType],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      let updatedFields: Field[];
      if (
        targetIndex !== null &&
        targetIndex >= 0 &&
        targetIndex <= group.fields.length
      ) {
        // Insert at specific index
        updatedFields = [
          ...group.fields.slice(0, targetIndex),
          newField,
          ...group.fields.slice(targetIndex),
        ];
      } else {
        // Add to the end
        updatedFields = [...group.fields, newField];
      }

      // Re-calculate order for all fields in the group
      const correctlyOrderedFields = updatedFields.map((field, index) => ({
        ...field,
        order: index,
        // Update timestamp for the new field or if its order changed
        updatedAt:
          field.id === newField.id || field.order !== index
            ? new Date().toISOString()
            : field.updatedAt,
      }));

      const updatedGroups = [...structure.groups];
      updatedGroups[groupIndex] = {
        ...group,
        fields: correctlyOrderedFields,
        updatedAt: new Date().toISOString(),
      };

      const updatedStructure = {
        ...structure,
        groups: updatedGroups,
        updatedAt: new Date().toISOString(),
      };

      setStructure(updatedStructure);
      setHasChanges(true);

      // Return the new field with its correct order
      const finalNewField = correctlyOrderedFields.find(
        (f) => f.id === newField.id
      );
      return finalNewField || null;
    } catch (err) {
      setError("Failed to create field");
      console.error("Error creating field:", err);
      return null;
    }
  };

  const addFieldType = async (
    fieldId: string,
    kind: FieldTypeKind,
    description?: string,
    dataOptions?: Record<string, string | number>,
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
        dataOptions,
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
    updates: Partial<Omit<FieldType, "id" | "fieldId" | "kind">>
  ): Promise<boolean> => {
    if (!structure) {
      setError("No journal exists");
      return false;
    }

    try {
      let fieldTypeFound = false;
      let isCheckFieldType = false;

      // First check if this is a CHECK field type
      for (const group of structure.groups) {
        for (const field of group.fields) {
          const fieldType = field.fieldTypes.find(
            (ft) => ft.id === fieldTypeId
          );
          if (fieldType && fieldType.kind === "CHECK") {
            isCheckFieldType = true;
            break;
          }
        }
        if (isCheckFieldType) break;
      }

      // If trying to change the kind of a CHECK field type, prevent it
      if (isCheckFieldType) {
        setError("Cannot change the kind of a CHECK field type");
        return false;
      }

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
      const groupToRemove = structure.groups.find((g) => g.id === groupId);
      if (!groupToRemove) {
        setError("Group not found");
        return false;
      }

      const updatedGroups = structure.groups.filter((g) => g.id !== groupId);
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
      setDeletedElements((prev) => ({
        ...prev,
        groups: [...prev.groups, groupId],
        fields: [...prev.fields, ...groupToRemove.fields.map((f) => f.id)],
        fieldTypes: [
          ...prev.fieldTypes,
          ...groupToRemove.fields.flatMap((f) =>
            f.fieldTypes.map((ft) => ft.id)
          ),
        ],
      }));
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
      let fieldToRemove: Field | null = null;

      const updatedGroups = structure.groups.map((g) => {
        const fieldIndex = g.fields.findIndex((f) => f.id === fieldId);
        if (fieldIndex !== -1) {
          fieldFound = true;
          fieldToRemove = g.fields[fieldIndex];
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

      if (!fieldFound || !fieldToRemove) {
        setError("Field not found");
        return false;
      }

      const updatedStructure = {
        ...structure,
        groups: updatedGroups,
        updatedAt: new Date().toISOString(),
      };

      setStructure(updatedStructure);
      setDeletedElements((prev) => ({
        ...prev,
        fields: [...prev.fields, fieldId],
        fieldTypes: [
          ...prev.fieldTypes,
          ...(fieldToRemove?.fieldTypes.map((ft) => ft.id) || []),
        ],
      }));
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
      let isCheckFieldType = false;

      // Check if this is a CHECK field type and prevent removal
      for (const group of structure.groups) {
        for (const field of group.fields) {
          const fieldType = field.fieldTypes.find(
            (ft) => ft.id === fieldTypeId
          );
          if (fieldType) {
            fieldTypeFound = true;
            if (fieldType.kind === "CHECK") {
              isCheckFieldType = true;
              setError(
                "Cannot remove CHECK field type as it is required for all fields"
              );
              return false;
            }
            break;
          }
        }
        if (fieldTypeFound) break;
      }

      if (!fieldTypeFound) {
        setError("Field type not found");
        return false;
      }

      const updatedGroups = structure.groups.map((g) => {
        const updatedFields = g.fields.map((f) => {
          const fieldTypeIndex = f.fieldTypes.findIndex(
            (ft) => ft.id === fieldTypeId
          );
          if (fieldTypeIndex !== -1) {
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

        const hasChangedFields = updatedFields.some(
          (f, index) =>
            f.fieldTypes.length !== g.fields[index].fieldTypes.length
        );

        if (hasChangedFields) {
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
      setDeletedElements((prev) => ({
        ...prev,
        fieldTypes: [...prev.fieldTypes, fieldTypeId],
      }));
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

      const hasDeletedElements =
        deletedElements.groups.length > 0 ||
        deletedElements.fields.length > 0 ||
        deletedElements.fieldTypes.length > 0;

      const saveData: JournalSaveStructureBody = {
        groups: structure.groups,
        ...(hasDeletedElements && { deletedElements }),
        currentDate: date,
      };

      const savedJournal = await saveJournalStructure(saveData);

      setStructure(savedJournal);
      setDeletedElements({ groups: [], fields: [], fieldTypes: [] });
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

  const methods: UseJournalStructureMethods = useMemo(
    () => ({
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
    }),
    [
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
    ]
  );

  return {
    structure,
    isLoading,
    error,
    hasChanges,
    newUser,
    isHistorical,
    methods,
  };
};
