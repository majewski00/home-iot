export const API = "/api/v1";

export const JOURNAL_API = `${API}/journal`;
// journal/data.ts
export const JOURNAL_SAVE_ENTRY = `${JOURNAL_API}/entries`;
export const JOURNAL_FETCH_ENTRY = `${JOURNAL_API}/entries/:date`;
export const JOURNAL_FETCH_FIRST_ENTRY_DATE = `${JOURNAL_API}/first-entry-date`;
// journal/structure.ts
export const JOURNAL_FETCH_STRUCTURE = `${JOURNAL_API}/structure`;
export const JOURNAL_SAVE_STRUCTURE = `${JOURNAL_API}/structure`;
// journal/actions.ts
export const JOURNAL_FETCH_ACTIONS = `${JOURNAL_API}/actions`;
export const JOURNAL_ADD_ACTION = `${JOURNAL_API}/actions/add`;
export const JOURNAL_REMOVE_ACTION = `${JOURNAL_API}/actions/remove`;
export const JOURNAL_REGISTER_ACTION = `${JOURNAL_API}/actions/register`; // post when the action is pressed
export const JOURNAL_REORDER_ACTION = `${JOURNAL_API}/actions/reorder`;
