import type { DirectoryHandleLike } from "./file-loader";

const DB_NAME = "private-journal-importer";
const STORE_NAME = "directory-handles";
const HANDLE_KEY = "source-directory";

export async function loadStoredDirectoryHandle(): Promise<DirectoryHandleLike | null> {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, "readonly");
    const store = transaction.objectStore(STORE_NAME);
    const request = store.get(HANDLE_KEY);

    request.onsuccess = () => {
      resolve((request.result as DirectoryHandleLike | undefined) ?? null);
    };
    request.onerror = () => {
      reject(request.error ?? new Error("Failed to load stored directory handle"));
    };
  });
}

export async function saveStoredDirectoryHandle(handle: DirectoryHandleLike): Promise<void> {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, "readwrite");
    const store = transaction.objectStore(STORE_NAME);
    const request = store.put(handle, HANDLE_KEY);

    request.onsuccess = () => resolve();
    request.onerror = () => {
      reject(request.error ?? new Error("Failed to save directory handle"));
    };
  });
}

export async function clearStoredDirectoryHandle(): Promise<void> {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, "readwrite");
    const store = transaction.objectStore(STORE_NAME);
    const request = store.delete(HANDLE_KEY);

    request.onsuccess = () => resolve();
    request.onerror = () => {
      reject(request.error ?? new Error("Failed to clear directory handle"));
    };
  });
}

async function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("Failed to open IndexedDB"));
  });
}
