# Journal for Logseq

This plugin adds a slash command that imports daily markdown notes from a local directory (default: `~/.private-journal`) into your current Logseq journal block.

## Features

- Slash command: `journal`
- Imports all matching `*.md` files for the target date from either:
  - source root files named with `YYYY-MM-DD` prefix
  - `YYYY-MM-DD/` subfolder files
- Uses only the current journal page date (`YYYY-MM-DD`)
- Strips YAML frontmatter and keeps clean body content
- Uses timestamp (`h:mm AM/PM`) as section headings
- Converts markdown headings in body to plain text lines
- Inserts shallow Logseq bullets (`time — section` with content one level below)
- Adds configurable `#tag` on imported root block

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

Users can install it directly as a local plugin. No npm is required.

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
