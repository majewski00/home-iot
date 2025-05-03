/**
 * Journal API types
 */
import type { FieldValue, Group } from "./journal.types";

export type ErrorResponse = { message?: string; error: string };

export interface Locals {
  user: { sub: string; roles?: string[] };
}

export interface JournalSaveEntryBody {
  id?: string;
  date: string;
  values?: FieldValue[];
}

export interface JournalSaveStructureBody {
  groups: Group[];
}
