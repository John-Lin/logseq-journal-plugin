import { describe, expect, it, vi } from "vitest";

import { DirectoryAuthManager } from "./directory-auth-manager";

describe("DirectoryAuthManager", () => {
  it("requests picker on first use and then reuses cached handle", async () => {
    const handle = { kind: "directory", name: "private-journal" };
    const store = {
      load: vi.fn().mockResolvedValue(null),
      save: vi.fn().mockResolvedValue(undefined),
      clear: vi.fn().mockResolvedValue(undefined),
    };
    const pickDirectory = vi.fn().mockResolvedValue(handle);
    const ensurePermission = vi.fn().mockResolvedValue(true);
    const manager = new DirectoryAuthManager({
      store,
      pickDirectory,
      ensurePermission,
    });

    const first = await manager.getOrAuthorize();
    const second = await manager.getOrAuthorize();

    expect(first).toBe(handle);
    expect(second).toBe(handle);
    expect(pickDirectory).toHaveBeenCalledTimes(1);
    expect(store.save).toHaveBeenCalledTimes(1);
  });

  it("uses stored handle when permission is already granted", async () => {
    const storedHandle = { kind: "directory", name: "private-journal" };
    const store = {
      load: vi.fn().mockResolvedValue(storedHandle),
      save: vi.fn().mockResolvedValue(undefined),
      clear: vi.fn().mockResolvedValue(undefined),
    };
    const pickDirectory = vi.fn();
    const ensurePermission = vi.fn().mockResolvedValue(true);
    const manager = new DirectoryAuthManager({
      store,
      pickDirectory,
      ensurePermission,
    });

    const handle = await manager.getOrAuthorize();

    expect(handle).toBe(storedHandle);
    expect(pickDirectory).not.toHaveBeenCalled();
    expect(store.save).not.toHaveBeenCalled();
  });

  it("clears cached and stored authorization on revoke", async () => {
    const handle = { kind: "directory", name: "private-journal" };
    const store = {
      load: vi.fn().mockResolvedValue(null),
      save: vi.fn().mockResolvedValue(undefined),
      clear: vi.fn().mockResolvedValue(undefined),
    };
    const pickDirectory = vi.fn().mockResolvedValue(handle);
    const ensurePermission = vi.fn().mockResolvedValue(true);
    const manager = new DirectoryAuthManager({
      store,
      pickDirectory,
      ensurePermission,
    });

    await manager.getOrAuthorize();
    await manager.revoke();
    await manager.getOrAuthorize();

    expect(store.clear).toHaveBeenCalledTimes(1);
    expect(pickDirectory).toHaveBeenCalledTimes(2);
  });
});
