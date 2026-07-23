# Contributing to CodeSync

Thanks for helping improve CodeSync.

## Before opening a change

- Search existing issues and pull requests.
- Open an issue first for major behavior, permission, storage, or architecture changes.
- Never include credentials, browser data, private solutions, or storage exports.
- Keep new Chrome permissions and network origins to the minimum required.

## Development

Use Node.js 20 or newer:

```sh
npm ci
npm run verify
npm audit
```

Reload the unpacked `build` directory in `chrome://extensions` after rebuilding. Manually exercise
the affected LeetCode or Codeforces flow when a change touches content scripts, storage, messaging,
or GitHub uploads.

## Pull requests

Keep each pull request focused. Describe the user-visible behavior, security impact, tests run, and
any new permissions or data handling. By contributing, you agree that your contribution is licensed
under the repository's MIT License.

Report vulnerabilities privately as described in [SECURITY.md](SECURITY.md), not in a public issue.
