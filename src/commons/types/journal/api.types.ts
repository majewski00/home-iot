/**
 * Journal API types
 */
import type { FieldValue, Group, JournalEntry } from "./journal.types";

export type ErrorResponse = { message: string; error?: string };

// used in frontend to handle errors
export type APIErrorResponse = {
  status: number;
  body: ErrorResponse;
};

export interface Locals {
  user: { sub: string; roles?: string[] };
}

export interface JournalSaveEntryBody {
  date: string;
  values: FieldValue[];
}

export interface JournalSaveStructureBody {
  groups: Group[];
  deletedElements?: {
    groups?: string[];
    fields?: string[];
    fieldTypes?: string[];
  };
  currentDate: string; // YYYY-MM-DD format
}

// Action API types
export interface JournalAddActionBody {
  name: string;
  description: string;
  fieldId: string;
  options?: {
    fieldTypeId: string;
    increment?: number;
    isCustom?: boolean;
  }[];
  isDailyAction?: boolean;
}

export interface JournalRemoveActionBody {
  id: string;
}

export interface JournalRegisterActionBody {
  id: string;
  value?: number; // Optional value for custom input
}

export interface JournalReorderActionBody {
  id: string;
  order: number;
}

export interface JournalQuickFillBody {
  date: string;
}

export interface JournalQuickFillResponse {
  success: boolean;
  entry?: JournalEntry;
}
