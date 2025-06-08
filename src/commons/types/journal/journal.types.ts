/**
 * Journal feature type definitions
 */

// Journal represents the overall structure of a user's journal
export interface Journal {
  structureId: string;
  isActive: boolean;
  effectiveFrom: Date | string;
  groups: Group[];
  createdAt: Date | string;
  updatedAt: Date | string;
}

// Group represents a collection of related fields
export interface Group {
  id: string;
  name: string;
  fields: Field[];
  order: number;
  collapsedByDefault?: boolean; // New property for groups that should be collapsed by default
  createdAt: Date | string;
  updatedAt: Date | string;
}

// Field represents a specific item that the user wants to track
export interface Field {
  id: string;
  groupId: string;
  name: string;
  fieldTypes: FieldType[];
  order: number;
  createdAt: Date | string;
  updatedAt: Date | string;
}

// Possible field type kinds
export type FieldTypeKind =
  | "NUMBER_NAVIGATION"
  | "NUMBER"
  | "TIME_SELECT"
  | "SEVERITY"
  | "RANGE"
  | "CUSTOM_SCALE";

// FieldType represents the type of data for a field
export interface FieldType {
  id: string;
  fieldId: string;
  kind: FieldTypeKind | "CHECK"; // CHECK is a special case for checkbox associated with all Field
  description?: string; // e.g., "When did it occur?"
  dataOptions?: Record<
    string,
    string | number | boolean | string[] | undefined
  >; // e.g., "Hours", "Minutes", "Servings", max/min range, labels array, etc. - depending on the kind
  order: number;
  createdAt: Date | string;
  updatedAt: Date | string;
}

// JournalEntry represents a single day's journal entry
export interface JournalEntry {
  date: string; // ISO date string (YYYY-MM-DD)
  structureId: string;
  values: FieldValue[];
  createdAt: Date | string;
  updatedAt: Date | string;
}

// FieldValue represents the value for a specific field in a journal entry
export interface FieldValue {
  groupId: string;
  fieldId: string;
  fieldTypeId: string;
  value: string | boolean | number | null; // Stored as string, parsed based on field type
  createdAt: Date | string;
  updatedAt: Date | string;
}

// JournalStats represents statistics about the journal
export interface JournalStats {
  streak: number; // Number of consecutive days with entries
  totalEntries: number;
  completionRate: number; // Percentage of fields filled
}

// Actions

export interface ActionOption {
  id: string;
  fieldTypeId: string;
  increment?: number; // Increment value for the operation
  isCustom?: boolean; // Indicates if the operation is custom
}
export interface ActionValidation {
  isValid: boolean;
  invalidReason?: string;
  missingFieldId?: string;
  missingFieldTypeId?: string;
}

export interface Action {
  id: string;
  name: string;
  description: string;
  fieldId: string;
  options?: ActionOption[];
  createdAt: Date | string;
  updatedAt: Date | string;
  order: number;
  isDailyAction?: boolean;
  lastTriggeredDate?: string;
  _validation?: ActionValidation;
  iconName?: string | null; // Icon name from Material-UI icons
  iconColor?: string; // Icon color (inherit, primary, secondary, etc.)
}
