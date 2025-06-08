# Changelog

All notable changes to this project will be documented in this file.

---

## 0.2.4 - 2025-06-08

-- *Stable version for Prod*

### Added

- Icon Picker component for journal actions with Material-UI icon integration in `IconPicker.tsx` and `LazyIcon.tsx`
  - Search functionality with debounced input via `useDebounce.ts` hook
  - Pagination support for browsing 1000+ available icons
  - Color variants selection with 8 predefined colors including custom brown and yellow
  - Lazy loading optimization to improve initial bundle size
- Custom Scale field type for user-defined labeled scales in `CustomScaleFieldView.tsx` and `CustomScaleFieldEdit.tsx`
  - Dynamic label creation with add/remove functionality
  - Visual preview during configuration
  - Support for any number of scale points with minimum validation
- Enhanced action system with optional icon and color support
  - Icon selection integration in `CreateActionModal.tsx`
  - Backend API updates in `useJournalActions.ts` to handle icon parameters

### Changed

- Upgraded React Router from `BrowserRouter` to `createBrowserRouter` for improved performance
- Enhanced field type factory in `FieldTypeFactory.tsx` to support custom scale fields
- Improved mobile viewport configuration and responsive design
- Enhanced loading states and user feedback across journal components

### Fixed

- Added beforeunload warning to prevent data loss when leaving with unsaved changes
- Improved action completion status tracking for daily actions
- Enhanced error handling and validation throughout the application

## 0.2.3 - 2025-06-07

### Added

- Comprehensive validation for `Action` objects against the current `Journal` structure, impacting `actions.ts`, `useJournalActions.ts`, and `journal.types.ts`.
- Frontend display of invalid actions in a dedicated section on `AllActionsPage.tsx`, including an option for bulk deletion.

### Changed

- Backend API endpoints in `actions.ts` now incorporate and return action validation status.
- Frontend components (`ActionGrid.tsx`, `AllActionsPage.tsx`) and hooks (`useJournalActions.ts`) updated to handle and display actions based on their validity.
- Enhanced logic in `actions.ts` and `entry.ts` for selecting the appropriate `Journal` structure based on its `effectiveFrom` date.
- Refined helper functions within `actions.ts` for processing and registering action values.

### Fixed

- Prevented registration of actions that are invalid due to journal structure changes, primarily in `actions.ts` and `useJournalActions.ts`.
- Ensured action reordering on `AllActionsPage.tsx` correctly applies only to valid actions.

## 0.2.2 - 2025-06-07

### Added

- Validation of actions against journal structure to ensure referenced fields and field types exist.
- Toast notification for actions with a cancel option to prevent accidental registration.
- Support for configuring default values, minimum/maximum values, and unit labels for `NumberNavigationField`.
- Static preview section for field configuration in edit view.
- "Quick Fill" button to copy yesterday's journal values into today's entry.

### Changed

- Improved drag-and-drop functionality for fields and groups in `EditPage`.
- Enhanced loading state indicators for better user experience.
- Actions visibility restricted to today's journal entry for relevance.
- Increment/decrement buttons in `NumberNavigationFieldView` now respect value bounds.
- Refactored SSL certificate path in `vite.config.ts` for local development.

### Fixed

- Input validation for `NumberNavigationFieldView` to ensure values stay within allowed range.
- Collapse component rendering logic to avoid unnecessary UI elements.

## 0.2.1 - 2025-05-25

### Added

- Quick Fill - demo (requires some changes)
- Default values for Number FieldTypes

## 0.2.0 - 2025-05-25

### Added

- Implementation of safe deletion
- Pop-up after Action is pressed to be able to cancel
- Daily Action

### Changed

- rename `data.ts` to `entry.ts`

## 0.1.3 - 2025-05-24

### Added

- Custom domain support with SSL certificate management
- Route53 hosted zone integration for DNS management
- Certificate stack for SSL/TLS certificate provisioning
- Enhanced CloudFormation outputs for API Gateway, Cognito, and Frontend stacks
- Debug logging in API URL formatting for better troubleshooting

### Changed

- Refactored API Gateway to use custom domain integration
- Enhanced Cognito configuration with custom domain URL handling
- Updated frontend stack with certificate and Route53 integration
- Restructured infrastructure stack dependencies for cross-region support

### Fixed

- Infrastructure deployment environment variable export for child processes
- Frontend configuration for custom domain deployments

## 0.1.2 - 2025-05-23

### Fix

- Backend configuration to work when deployed to AWS Lambda

### Added

- Generalized logger in the backend

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
