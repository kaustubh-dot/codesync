import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const read = (path: string) => readFileSync(path, 'utf8');

describe('extension security contract', () => {
  it('keeps the manifest permissions narrow', () => {
    const manifest = JSON.parse(read('public/manifest.json'));
    expect(manifest.permissions).toEqual(['storage', 'webRequest']);
    expect(manifest.host_permissions).toEqual([
      'https://leetcode.com/*',
      'https://codeforces.com/*',
      'https://api.github.com/*',
    ]);
    expect(manifest.content_scripts).toHaveLength(2);
    expect(manifest.content_scripts[0].matches).toEqual(['https://leetcode.com/problems/*']);
    expect(manifest.content_scripts[1].matches).toEqual(['https://codeforces.com/*']);
    expect(manifest.content_security_policy.extension_pages).toContain("object-src 'none'");
    expect(manifest.content_security_policy.extension_pages).toContain(
      'connect-src https://api.github.com https://codeforces.com',
    );
  });

  it('never extracts cookies or synchronizes secrets', () => {
    const source = [
      read('src/background.ts'),
      read('src/handlers/GithubHandler.ts'),
      read('src/scripts/leetcode.ts'),
      read('src/scripts/codeforces.ts'),
    ].join('\n');
    expect(source).not.toContain('chrome.cookies');
    expect(source).not.toContain('storage.sync');
    expect(read('src/scripts/leetcode.ts')).not.toContain('github_token');
    expect(read('src/scripts/codeforces.ts')).not.toContain('github_token');
    expect(read('src/background.ts')).toContain("accessLevel: 'TRUSTED_CONTEXTS'");
  });

  it('requests only submission fields used for uploads', () => {
    const query = read('src/api/submissions/submission.query.ts');
    expect(query).not.toContain('realName');
    expect(query).not.toContain('userAvatar');
    expect(query).not.toContain('lastTestcase');
    expect(query).not.toContain('runtimeError');
    expect(query).not.toContain('compileError');
  });
});
