export const API = "/api/v1";

export const JOURNAL_API = `${API}/journal`;
// journal/data.ts
export const JOURNAL_SAVE_ENTRY = `${JOURNAL_API}/entries`;
export const JOURNAL_FETCH_ENTRY = `${JOURNAL_API}/entries/:date`;
export const JOURNAL_FETCH_FIRST_ENTRY_DATE = `${JOURNAL_API}/first-entry-date`;
// journal/structure.ts
export const JOURNAL_FETCH_STRUCTURE = `${JOURNAL_API}/structure`;
export const JOURNAL_SAVE_STRUCTURE = `${JOURNAL_API}/structure`;
