import type { BlockCommandCallback, SettingSchemaDesc } from "@logseq/libs/dist/LSPlugin";

import {
  loadDailyMarkdownFilesFromDirectoryHandle,
  type DirectoryHandleLike,
} from "./file-loader";
import {
  IMPORT_COMMAND,
  UNLINK_DIRECTORY_ACCESS_PALETTE_KEY,
  UNLINK_DIRECTORY_ACCESS_PALETTE_LABEL,
} from "./commands";
import { shouldRemoveSourceBlock } from "./block-cleanup";
import { DirectoryAuthManager } from "./directory-auth-manager";
import {
  clearStoredDirectoryHandle,
  loadStoredDirectoryHandle,
  saveStoredDirectoryHandle,
} from "./directory-handle-store";
import { buildImportedBatchBlock, isExistingImportBlock, resolveJournalIsoDate } from "./importer";
import { extractJournalDay } from "./logseq-helpers";

const DEFAULT_RESOURCE_TAG_PATH = "journal";
const startupAt = Date.now();

const settingsSchema: Array<SettingSchemaDesc> = [
  {
    key: "tag",
    type: "string",
    default: DEFAULT_RESOURCE_TAG_PATH,
    title: "Tag",
    description: "Tag text added to imported journal root block, e.g. journal",
  },
];

function getConfiguredResourceTagPath(): string {
  const rawSetting = logseq.settings?.tag;
  const configured = typeof rawSetting === "string" ? rawSetting.trim() : "";
  return configured.length > 0 ? configured : DEFAULT_RESOURCE_TAG_PATH;
}

type WindowWithDirectoryPicker = Window & {
  showDirectoryPicker?: () => Promise<DirectoryHandleLike>;
};

function getDirectoryPicker(): () => Promise<DirectoryHandleLike> {
  const pickerWindow = window as WindowWithDirectoryPicker;
  if (typeof pickerWindow.showDirectoryPicker !== "function") {
    throw new Error("Directory picker is unavailable in this Logseq runtime");
  }

  return pickerWindow.showDirectoryPicker.bind(pickerWindow);
}

async function ensureReadPermission(handle: DirectoryHandleLike): Promise<boolean> {
  if (typeof handle.queryPermission === "function") {
    const permission = await handle.queryPermission({ mode: "read" });
    if (permission === "granted") {
      return true;
    }

    if (permission === "denied") {
      return false;
    }
  }

  if (typeof handle.requestPermission === "function") {
    const permission = await handle.requestPermission({ mode: "read" });
    return permission === "granted";
  }

  return true;
}

async function pickDirectoryHandle(): Promise<DirectoryHandleLike> {
  const pickDirectory = getDirectoryPicker();
  return pickDirectory();
}

const authManager = new DirectoryAuthManager({
  store: {
    load: loadStoredDirectoryHandle,
    save: saveStoredDirectoryHandle,
    clear: clearStoredDirectoryHandle,
  },
  pickDirectory: pickDirectoryHandle,
  ensurePermission: ensureReadPermission,
});

const importPrivateJournalCommand: BlockCommandCallback = async (event) => {
  let isoDate = "";
  let resourceTagPath = "";
  let importedFiles: Awaited<ReturnType<typeof loadDailyMarkdownFilesFromDirectoryHandle>>;
  let directoryHandle: DirectoryHandleLike;
  try {
    resourceTagPath = getConfiguredResourceTagPath();
    directoryHandle = await authManager.getOrAuthorize();
    const currentPage = await logseq.Editor.getCurrentPage();
    const journalDay = extractJournalDay(currentPage);
    isoDate = resolveJournalIsoDate(journalDay);
    importedFiles = await loadDailyMarkdownFilesFromDirectoryHandle(directoryHandle, isoDate);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    await logseq.UI.showMsg(
      `Unable to load journal files: ${errorMessage}`,
      "error",
    );
    return;
  }

  if (importedFiles.length === 0) {
    await logseq.UI.showMsg(`No markdown files found for ${isoDate} in authorized directory`, "warning");
    return;
  }

  const pageBlocksTree = await logseq.Editor.getCurrentPageBlocksTree();
  if (pageBlocksTree) {
    for (const block of pageBlocksTree) {
      if (block.uuid && block.content && isExistingImportBlock(block.content, isoDate)) {
        await logseq.Editor.removeBlock(block.uuid);
      }
    }
  }

  const batch = buildImportedBatchBlock(isoDate, importedFiles, resourceTagPath);
  await logseq.Editor.insertBatchBlock(event.uuid, batch, {
    sibling: true,
  });

  const sourceBlock = await logseq.Editor.getBlock(event.uuid, {
    includeChildren: true,
  });
  if (shouldRemoveSourceBlock(sourceBlock)) {
    await logseq.Editor.removeBlock(event.uuid);
  }

  await logseq.UI.showMsg(
    `Imported ${importedFiles.length} markdown file(s) for ${isoDate}`,
    "success",
  );
};

const revokeAuthorizationCommand: BlockCommandCallback = async () => {
  try {
    await authManager.revoke();
    await logseq.UI.showMsg(
      "Cleared saved journal directory authorization",
      "success",
    );
  } catch (error) {
    await logseq.UI.showMsg(`Failed to clear authorization: ${String(error)}`, "error");
  }
};

async function main(): Promise<void> {
  logseq.useSettingsSchema(settingsSchema);
  logseq.Editor.registerSlashCommand(IMPORT_COMMAND, importPrivateJournalCommand);
  logseq.App.registerCommandPalette(
    {
      key: UNLINK_DIRECTORY_ACCESS_PALETTE_KEY,
      label: UNLINK_DIRECTORY_ACCESS_PALETTE_LABEL,
    },
    revokeAuthorizationCommand,
  );
  console.info(`Journal plugin ready in ${Date.now() - startupAt}ms`);
}

logseq.ready(main).catch((error: unknown) => {
  console.error("Journal plugin failed to start", error);
});
