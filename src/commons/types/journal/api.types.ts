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
