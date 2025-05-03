/**
 * Journal feature type definitions
 */

// Journal represents the overall structure of a user's journal
export interface Journal {
  id: string;
  userId: string;
  name: string;
  groups: Group[];
  createdAt: Date;
  updatedAt: Date;
}

// Group represents a collection of related fields
export interface Group {
  id: string;
  journalId: string;
  name: string;
  fields: Field[];
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

// Field represents a specific item that the user wants to track
export interface Field {
  id: string;
  groupId: string;
  name: string;
  fieldTypes: FieldType[];
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

// Possible field type kinds
export type FieldTypeKind = "NUMBER" | "CUSTOM_NUMBER" | "DATE" | "LITERAL";

// FieldType represents the type of data for a field
export interface FieldType {
  id: string;
  fieldId: string;
  kind: FieldTypeKind;
  name: string; // e.g., "When did it occur?"
  dataType?: string; // e.g., "Hours", "Minutes", "Servings"
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

// JournalEntry represents a single day's journal entry
export interface JournalEntry {
  id: string;
  journalId: string;
  date: string; // ISO date string (YYYY-MM-DD)
  values: FieldValue[];
  createdAt: Date;
  updatedAt: Date;
}

// FieldValue represents the value for a specific field in a journal entry
export interface FieldValue {
  id: string;
  entryId: string;
  fieldId: string;
  fieldTypeId: string;
  value: string | number | null; // Stored as string, parsed based on field type
  filled: boolean; // Whether the field has been filled (YES/NO)
  createdAt: Date;
  updatedAt: Date;
}

// JournalStats represents statistics about the journal
export interface JournalStats {
  streak: number; // Number of consecutive days with entries
  totalEntries: number;
  completionRate: number; // Percentage of fields filled
}
