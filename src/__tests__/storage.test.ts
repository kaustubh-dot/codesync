import { migrateLegacyStorage } from '../lib/storage';

describe('storage migration', () => {
  it('moves legacy LeetSync keys without overwriting CodeSync values', async () => {
    const values: Record<string, unknown> = {
      github_leetsync_token: 'old-token',
      github_leetsync_repo: 'old-repo',
      github_leetsync_subdirectory: 'old-path',
      github_repo: 'current-repo',
    };
    const set = vi.fn(async (updates: Record<string, unknown>) => Object.assign(values, updates));
    const remove = vi.fn(async (keys: string[]) => keys.forEach((key) => delete values[key]));

    global.chrome = {
      storage: {
        local: {
          get: vi.fn(async () => ({ ...values })),
          set,
          remove,
        },
      },
    } as unknown as typeof chrome;

    await migrateLegacyStorage();

    expect(set).toHaveBeenCalledWith({
      github_token: 'old-token',
      github_subdirectory: 'old-path',
    });
    expect(values.github_repo).toBe('current-repo');
    expect(remove).toHaveBeenCalledWith([
      'github_leetsync_token',
      'github_leetsync_repo',
      'github_leetsync_subdirectory',
    ]);
  });
});
