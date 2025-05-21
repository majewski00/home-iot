/**
 * Journal API types
 */
import type { FieldValue, Group } from "./journal.types";

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
