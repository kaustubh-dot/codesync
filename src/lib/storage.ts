const legacyKeys = {
  github_leetsync_token: 'github_token',
  github_leetsync_repo: 'github_repo',
  github_leetsync_subdirectory: 'github_subdirectory',
} as const;

export const migrateLegacyStorage = async () => {
  const oldKeys = Object.keys(legacyKeys);
  const newKeys = Object.values(legacyKeys);
  const values = await chrome.storage.local.get([...oldKeys, ...newKeys]);
  const migrated: Record<string, unknown> = {};

  Object.entries(legacyKeys).forEach(([oldKey, newKey]) => {
    if (values[newKey] == null && values[oldKey] != null) migrated[newKey] = values[oldKey];
  });

  if (Object.keys(migrated).length) await chrome.storage.local.set(migrated);
  if (oldKeys.some((key) => values[key] != null)) await chrome.storage.local.remove(oldKeys);
};
