# Changelog

All notable changes to this project will be documented in this file.

---

## 0.1.1 - 2025-05-21

### Added

- CreateActionModal component for creating new actions in the journal
- implement NumberInputModal for custom number input handling
- create SelectFieldModal for selecting fields associated with actions
- add useJournalActions hook for managing journal actions and fetching eligible fields
- implement journalApi service methods for action management (fetch, add, remove, register, reorder)
- enhance error logging in API response handler

## 0.1.0 - 2025-05-15

### Added

- Redesign and working solution - Journal

## 0.0.7 - 2025-05-11

### Added

- Implemented FieldTypes Pages both with edit and view functionality
- `Layout.tsx`

## 0.0.6 - 2025-05-06

### Added

- Implemented EditPage functionality:
  - Added ability to add, remove, and reorder fields within groups using drag and drop.
  - Implemented inline field creation without modals.
  - Added group options menu (rename, delete) accessible via three-dot icon.
  - Implemented inline group renaming.
  - Added navigation from JournalPage to EditPage.

### Changed

- Refactored JournalPage to use React Router navigation for the Edit button.
- Added EditPage route to `src/frontend/routes/index.tsx`.

## 0.0.5 - 2025-05-05

### Added

- Frontend implementation for Journal feature:
  - Created JournalPage component as the main entry point
  - Implemented DateNavigator for intuitive date selection
  - Added JournalGroupDisplay for collapsible group visualization with completion statistics
  - Created JournalFieldInput for field editing with YES/NO toggles
  - Implemented NumberField component for numeric inputs
  - Added visual feedback for journal entry completion status
  - Integrated with existing journal hooks (useJournalEntry, useJournalStructure)

### Fixed

- Corrected import path in routes file for JournalPage component

## 0.0.4 - 2025-05-05

### Added

- backend endpoints for journal support

### Fixed

- Correct configuration of the serverless framework

## 0.0.3 - 2025-05-03

### Added

- Backend for Journal endpoints
- common types in `src/commons/*`

## 0.0.2 - 2025-05-03

### Added

- IaC:
  - Cognito
  - DDB
  - CF + static website on S3
  - API Gateway
- Scripts for deployment and local variables

## 0.0.1 - 2025-05-02

### Added

- Journal feature implementation:
  - Created data models and types for Journal, Group, Field, FieldType, and JournalEntry
  - Implemented API services for journal operations
  - Added React hooks for managing journal data and entries
  - Created UI components for journal creation, viewing, and editing
  - Implemented field type components (NumberField, CustomNumberField, DateField, LiteralField)
  - Added journal page to main application routes

### Changed

- Updated App.tsx to include Journal page in routes
- Added temporary redirect from root to journal page

## 0.0.0 - 2025-05-02

### Added

- Initial Commit

### Changed

- Initial Commit

### Fixed

- Initial Commit
  
---
