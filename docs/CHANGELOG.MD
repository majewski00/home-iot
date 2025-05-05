# Changelog

All notable changes to this project will be documented in this file.

---

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
