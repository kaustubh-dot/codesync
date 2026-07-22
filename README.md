# CodeSync

A hardened Chrome extension that syncs accepted LeetCode and Codeforces submissions to one public
or private GitHub repository.

CodeSync preserves the original LeetSync solution, README, notes, subdirectory, streak, statistics,
and success-icon features. Codeforces support adds handle validation, accepted-submission detection,
source and problem extraction, duplicate prevention, language-aware filenames, and a separate synced
count.

This project is based on [LeetSync](https://github.com/LeetSync/LeetSync). Codeforces behavior was
informed by [CodeforcesSync](https://github.com/mhdnazrul/CodeforcesSync) and
[cf-pusher](https://github.com/SarJ2004/cf-pusher). Attribution links are retained here because this
is a private derivative project.

## Security design

- Uses a fine-grained GitHub token restricted to one selected repository.
- Stores configuration in device-local extension storage, not Chrome Sync.
- Restricts storage access to trusted extension pages and the background worker.
- Performs authenticated GitHub requests only in the background worker. Coding-platform scripts
  never receive the token.
- Uses signed-in LeetCode and Codeforces pages without reading or copying browser cookies.
- Has no OAuth client secret, callback script, analytics, remote code, or third-party server.
- Requests only `storage` and `webRequest`, plus host access to LeetCode, Codeforces, and GitHub's
  API. It does not request cookie, browsing-history, or broad tab-control permissions.
- Validates repository write access and rejects unsafe repository subdirectory paths.
- Blocks common credential formats found in solution code or LeetCode notes before uploading.

Chrome does not provide a general-purpose OS credential vault to extensions. The GitHub token is
stored locally in the Chrome profile so syncing continues after a restart. Limit it to one
repository, give it an expiry date, and revoke it if the browser profile or computer is compromised.

## Create the GitHub token

1. Open [GitHub fine-grained token settings](https://github.com/settings/personal-access-tokens/new).
2. Give the token a short expiry date.
3. Choose **Only select repositories** and select the destination repository.
4. Set repository **Contents** permission to **Read and write**. Leave all other permissions at
   their defaults.
5. Generate the `github_pat_...` token and paste it into CodeSync.

Public and private repositories use the same narrow permission. Do not use a classic token or the
broader `gho_...` token used by GitHub CLI.

## Install locally

Requirements: Node.js 20 or newer and npm.

```bash
npm ci
npm run verify
```

Then open `chrome://extensions`, enable Developer mode, choose **Load unpacked**, and select this
project's `build` directory.

## Configure platforms

### LeetCode

Sign in to LeetCode normally and reload open problem tabs after installing or updating CodeSync.
An accepted submission uploads:

- `README.md` with the problem statement and difficulty
- `Notes.md` when notes exist
- the solution using the language's normal extension

Existing LeetCode paths and statistics remain unchanged.

### Codeforces

1. Open CodeSync's Settings menu.
2. Choose **Connect Codeforces**.
3. Enter your Codeforces handle and save it.
4. Stay signed in to Codeforces and reload open Codeforces tabs.

When a recent submission becomes accepted, CodeSync uses Codeforces' public API for metadata and the
signed-in Codeforces page for your source. It uploads to:

```text
Codeforces/<contest-and-index>-<problem-name>/
├── README.md
└── <problem-name>.<language-extension>
```

If a custom repository subdirectory is configured, the `Codeforces` directory is created inside it.
CodeSync does not backfill historical submissions. A Codeforces tab must be open when a new
submission is accepted because the extension intentionally avoids broad tab-control permission.

## Verify changes

```bash
npm run typecheck
npm test
npm run build
npm audit
```

Security-contract tests fail if cookie access, Chrome Sync storage, page exposure of the GitHub
token, or additional manifest permissions are introduced.

## Revoke access

Delete the token from [GitHub token settings](https://github.com/settings/personal-access-tokens),
then choose **Reset All** in CodeSync. Removing the extension also deletes its local storage.

## Maintenance

Dependabot checks compatible npm and GitHub Actions updates weekly. GitHub Actions runs type
checking, behavioral and security tests, a production build, and `npm audit` for every push and pull
request.
