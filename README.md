# Journal for Logseq

This plugin adds a slash command that imports daily markdown notes from a local directory (default: `~/.private-journal`) into your current Logseq journal block.

## Prerequisite

Before using this plugin, set up and run `private-journal-mcp` first:

- Repository: [John-Lin/private-journal-mcp](https://github.com/John-Lin/private-journal-mcp)
- Purpose: generates your local `.private-journal` data, which this plugin imports into Logseq.

Without that prerequisite, there may be no `.private-journal` content to import.

## Features

- Slash command: `journal`
- Imports only the current journal page date (`YYYY-MM-DD`) from `.private-journal`
- Supports both `YYYY-MM-DD*.md` and `YYYY-MM-DD/*.md` file structures
- Converts entries into clean Logseq bullets (`time AM/PM — section`) with one-level content
- Adds a configurable root tag (default: `#journal`)
- Saves directory authorization across restarts, with command palette action to unlink access

## Setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Build plugin output:

   ```bash
   npm run build
   ```

   This generates a bundled startup script at `dist/main.js`.

3. Generate a minimal local-plugin package (recommended):

   ```bash
   npm run package:release
   ```

   This creates `release/` with only runtime files.

4. In Logseq, load `release/` as the local plugin folder.

The plugin entry file is `index.html` (Logseq standard local plugin entry).

## Install Without Marketplace

Users can install it from a packed release ZIP. No npm is required.

Note: Logseq does not load ZIP files directly. You still need to unzip first, then use `Load unpacked plugin`.

1. Open this repository's `Releases` page on GitHub.
2. Download `plugin-release.zip` from the latest release assets.
3. Extract the ZIP file.
4. In Logseq, enable Developer mode.
5. Open `Plugins` -> `Load unpacked plugin`.
6. Select the extracted folder.

To update, download the newest `plugin-release.zip`, replace the old folder, and reload the plugin in Logseq.

If you are developing the plugin, use:

```bash
npm install
npm run package:release
```

## Plugin Settings

- `Tag`: tag text for imported root block. Plugin auto-prefixes `#`.
  - Default: `journal`
  - Example: `journal` (becomes `#journal`)

## Usage

1. Open a journal page in Logseq.
2. Put cursor on a block.
3. Type `/` and choose `journal`.
4. On first run, choose your local journal folder (for example `~/.private-journal`).
5. Later runs reuse the saved authorization.
6. If needed, run command palette action `Journal: Unlink Directory Access` to clear saved authorization.
7. The plugin inserts imported content as a sibling block.
8. Running the command again on the same date replaces the previous import with fresh content.

Note: Authorization handle is saved and reused across Logseq restarts.
Note: Import runs only on journal pages. On non-journal pages it will show an error.

## File Match Rule

For journal date `2026-03-18`, the plugin imports files like:

- `2026-03-18.md`
- `2026-03-18-notes.md`
- `2026-03-18/00-40-25-554525.md`

Non-markdown files or other dates are ignored.

## Development

```bash
npm test
npm run build
```
