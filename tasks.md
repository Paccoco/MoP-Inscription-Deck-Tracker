# Codebase Streamlining Task Plan (2025-07-25)

## Step-by-Step Plan

1. **Identify and List Redundant Patterns** ✅
   - Review major files (`App.js`, `Admin.js`, `CompletedDecks.js`, `Profile.js`, `Notifications.js`, backend endpoints) for repeated logic, UI, and data-fetching patterns.

2. **Create Shared Components and Hooks (Frontend)** ✅
   - Extract repeated table, form, and navigation UI into reusable React components (e.g., `CardTable`, `DeckTable`, `NavBar`).
   - Build custom hooks for common data fetching and error/loading state management (e.g., `useFetchCards`, `useFetchDecks`, `useFetchNotifications`).

3. **Refactor Large Components** ✅
   - Split large files (`App.js`, `Admin.js`) into smaller, focused components for each page/feature.
   - Move domain-specific logic (e.g., deck status, contributor breakdown) into utility functions.

4. **Backend Logic Consolidation** ✅
   - Refactor notification delivery and activity logging into helper functions to avoid duplication.
   - Merge similar endpoints (e.g., CSV export/import, deck/card history) where possible.

5. **Optimize Conditional Rendering and State** ✅
   - Simplify deeply nested conditionals and group related UI logic.
   - Centralize error and loading state handling.

6. **Bug Check and Validate** ✅
   - Run lint, type checks, and test flows for all refactored code.
   - Validate notification delivery and activity logging after refactoring.

7. **Update Documentation** ✅
   - Update `README.md` to reflect new shared components, hooks, and backend helpers.
   - Document any changes to API endpoints or usage patterns.

8. **User Confirmation and Git Workflow** ✅
   - Ask for user confirmation before committing/pushing changes to GitHub.
   - Ensure README and codebase are in sync before reporting completion.

---

# Planned Tasks (v0.5.7+)

## 1. User-Facing Security Dashboard ✅
- Add an Admin-only dashboard page to view:
  - Recent security scan results (npm audit, ggshield) ✅
  - Dependency status (outdated, vulnerable packages) ✅
  - Notification history (security alerts, system notifications) ✅
- Display results in a clear, filterable table with severity, date, and details ✅
- Link to CI logs and allow export of security history ✅

## 2. Automated Dependency Updates ✅
- Integrate Renovate or Dependabot in GitHub repository settings.
- Configure to automatically create PRs for dependency updates (weekly or on release).
- Add documentation in README for dependency update workflow.

## 3. Automated Test Coverage Reporting ✅
- Integrate code coverage tools (e.g., Jest + coverage, Coveralls, or Codecov) ✅
- Display coverage results in the admin dashboard ✅
- Add badge to README for test coverage status ✅
- Document how to run and interpret coverage locally and in CI ✅

---

## Completion Plan
- Implement Security Dashboard UI and backend endpoints ✅
- Integrate Renovate/Dependabot for dependency updates ✅
- Set up code coverage reporting and dashboard integration ✅
- Update README and admin documentation for all new features ✅
- Validate, bug check, and commit/push changes ✅
