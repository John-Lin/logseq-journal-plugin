import type { DirectoryHandleLike } from "./file-loader";

type DirectoryHandleStore = {
  load: () => Promise<DirectoryHandleLike | null>;
  save: (handle: DirectoryHandleLike) => Promise<void>;
  clear: () => Promise<void>;
};

type DirectoryAuthDeps = {
  store: DirectoryHandleStore;
  pickDirectory: () => Promise<DirectoryHandleLike>;
  ensurePermission: (handle: DirectoryHandleLike) => Promise<boolean>;
};

export class DirectoryAuthManager {
  private cachedHandle: DirectoryHandleLike | null = null;
  private readonly deps: DirectoryAuthDeps;

  constructor(deps: DirectoryAuthDeps) {
    this.deps = deps;
  }

  async getOrAuthorize(): Promise<DirectoryHandleLike> {
    if (this.cachedHandle && (await this.deps.ensurePermission(this.cachedHandle))) {
      return this.cachedHandle;
    }

    const storedHandle = await this.deps.store.load();
    if (storedHandle && (await this.deps.ensurePermission(storedHandle))) {
      this.cachedHandle = storedHandle;
      return storedHandle;
    }

    const pickedHandle = await this.deps.pickDirectory();
    const granted = await this.deps.ensurePermission(pickedHandle);
    if (!granted) {
      throw new Error("Directory permission was not granted");
    }

    await this.deps.store.save(pickedHandle);
    this.cachedHandle = pickedHandle;
    return pickedHandle;
  }

  async revoke(): Promise<void> {
    this.cachedHandle = null;
    await this.deps.store.clear();
  }
}
