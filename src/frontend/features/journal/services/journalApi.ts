import { getJson, postJson } from "@apiHandler";
import * as ROUTES from "@apiRoutes";
import { Journal, JournalEntry } from "@src-types/journal/journal.types";
import {
  JournalSaveEntryBody,
  JournalSaveStructureBody,
} from "@src-types/journal/api.types";

// journal/data.ts

export const fetchJournalEntry = async (date: string): Promise<JournalEntry> =>
  getJson(ROUTES.JOURNAL_FETCH_ENTRY, { date }, {}, {}, { cacheBust: true });

export const saveJournalEntry = async (
  entryBody: JournalSaveEntryBody
): Promise<JournalEntry> =>
  postJson(ROUTES.JOURNAL_SAVE_ENTRY, entryBody, {}, { cacheBust: true });

export const fetchFirstEntryDate = async (): Promise<{ date: string }> =>
  getJson(
    ROUTES.JOURNAL_FETCH_FIRST_ENTRY_DATE,
    {},
    {},
    {},
    { cacheBust: false }
  );

// journal/structure.ts

export const fetchJournalStructure = async (): Promise<Journal> =>
  getJson(ROUTES.JOURNAL_FETCH_STRUCTURE, {}, {}, {}, { cacheBust: true });

export const saveJournalStructure = async (
  journal: JournalSaveStructureBody
): Promise<Journal> =>
  postJson(ROUTES.JOURNAL_SAVE_STRUCTURE, journal, {}, { cacheBust: true });
