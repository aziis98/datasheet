# DataSheet

<img alt="image" src="https://github.com/user-attachments/assets/92ba2561-871a-4472-b3d3-37542e59b244" />

A tiny, modern dataset viewer and query playground built with Preact and Vite.

This project provides a fast, local UI for experimenting with tabular and text data, viewing result sets, and composing quick JavaScript-style queries inside a query bar — useful for prototyping data-centric interfaces and building a lightweight "datasheet" experience.

## Highlights

-   Based on Preact and Vite with [`@aziis98/preact-css-extract`](https://github.com/aziis98/preact-css-extract) for scoped CSS.

-   Optics-style state helpers: `useOpticState` for safe in-place updates with an easy shorthand for lenses and item access.

-   Extensible viewers: drop-in file-based viewers (Table, Text) automatically registered with `import.meta.glob`.

## Live demo

Run locally to explore the app and try the example dataset.

## Tech stack & package manager

-   Preact (JSX runtime)
-   TypeScript
-   Vite (dev server, build, preview)
-   preact-css-extract for scoped CSS
-   Iconify for icons
-   Bun: this project includes a `bun.lock` and Bun is the recommended package manager/runtime for development and script running

## Quick start

-   Install dependencies (preferred — Bun)

    ```bash
    bun install
    # or
    npm install
    yarn
    pnpm install
    ```

-   Start dev server

    ```bash
    bun dev
    # or
    bun run dev
    npm run dev
    ```

-   Build for production

    ```bash
    bun run build
    # or
    npm run build
    ```

## Project structure

Key files and directories:

-   `src/main.tsx` — App root containing the page layout, query editor, outline, and main content.

-   `src/example-dataset.ts` — Example dataset used by the app on startup (tables and text entries).

-   `src/viewers/*.tsx` — Viewer components. Each viewer that exports a component with `Viewer` in the filename is registered automatically.

-   `src/viewers/types.ts` — Types for viewer values (tables, text, etc.).

-   `src/lib/hooks.ts` — `Optic` class and `useOpticState`, a small utility that provides immutable-ish lenses and operations for nested state.

-   `src/lib/utils.ts` — Utility helpers like `tryEvaluate`, `dedent`, and `arrayRepeat`.

-   `src/components/*` — Reusable UI components such as `AutosizeInput` and an Icon wrapper.

-   `docs/design.json` — Design tokens and component layout system used for consistent UI.

## Usage

-   Query bar

    -   Enter JavaScript expressions and arrays (the project uses `new Function(...)`) in the query bar for quick previews.

    -   Example query used in source: a primes generator example: `[...]` — the query editor runs evaluation with `tryEvaluate` (safe-ish for local dev only).

-   Outline

    -   The left sidebar lists notebook entries. Click any item to scroll to that section.

-   Viewers

    -   Each dataset entry has a `type` field used to select a viewer.

    -   `text` entries are editable via an autosizing textarea viewer.

    -   `table` entries render as a scrollable table with headers and basic type formatting (numeric & date alignment).

## Notes & Roadmap

Some next-step ideas and improvements:

-   Add more viewers (JSON, image, chart).

-   Provide a safer query sandbox for running queries instead of `new Function`.

-   Add unit and integration tests.

-   Add a `README` for the `docs/design.json` tokens and CSS token definitions.

-   Add accessibility improvements for keyboard navigation and screen readers.
