# Changelog

All notable changes to this project will be documented in this file.

## [1.0.3] - 2025-12-12
### Fixed
- Resolved `TS6305` TypeScript error during build by decoupling `vite.config.ts` from the main `tsconfig.json`.
- Removed `project references` from `tsconfig.json` and switched to explicit file inclusion patterns (`**/*.ts`, `**/*.tsx`).
- Reverted build script to standard `tsc && vite build` to ensure compatibility with the flat file structure.

## [1.0.2] - 2025-12-12
### Changed
- Attempted to use `tsc -b` (build mode) to handle project references.
- Updated `tsconfig.json` to explicitly exclude `vite.config.ts` from the root context.

## [1.0.1] - 2025-12-12
### Fixed
- Fixed `ERESOLVE` dependency conflict by aligning `react` and `react-dom` versions to `^18.3.1`.
- Removed `<script type="importmap">` from `index.html` to allow Vite to properly bundle dependencies during the production build.

## [1.0.0] - 2025-12-11
### Added
- Initial release of Okey Card Master.
- Features: Deck tracking, Hand management, Move analysis, Monte Carlo simulation for discards and chest probabilities.
