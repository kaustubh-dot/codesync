<p align="center">
  <img src="public/logo192.png" width="144" height="144" alt="CodeSync logo">
</p>

<h1 align="center">CodeSync</h1>

<p align="center">
  A personal Chrome extension that sends accepted LeetCode and Codeforces submissions to one GitHub repository.
</p>

CodeSync is a private, self-built extension. It is not published in the Chrome Web Store and it does
not use a hosted backend. You build it from this repository, load the resulting `build` directory in
Chrome, and connect it to a GitHub repository with a narrowly scoped fine-grained token.

The destination repository may be public or private. A public repository exposes your solutions,
notes, commit history, and problem-solving activity. It does not expose the GitHub token unless you
put that token inside a solution or note. CodeSync checks uploads for common credential formats, but
that check is a safety net rather than a substitute for reviewing public content.

## Contents

- [What CodeSync does](#what-codesync-does)
- [How it works](#how-it-works)
- [Requirements](#requirements)
- [Installation](#installation)
- [GitHub setup](#github-setup)
- [First-time CodeSync setup](#first-time-codesync-setup)
- [Using LeetCode](#using-leetcode)
- [Using Codeforces](#using-codeforces)
- [Repository layout](#repository-layout)
- [Settings](#settings)
- [Security model](#security-model)
- [Updating CodeSync](#updating-codesync)
- [Troubleshooting](#troubleshooting)
- [Removing CodeSync](#removing-codesync)
- [Development and verification](#development-and-verification)
- [Project history](#project-history)

## What CodeSync does

CodeSync keeps the original LeetSync behavior for LeetCode and adds Codeforces support without
giving coding-platform pages access to the GitHub token.

| Capability | LeetCode | Codeforces |
| --- | --- | --- |
| Detect a new accepted submission | Yes | Yes |
| Upload source code | Yes | Yes |
| Choose the normal file extension | Yes | Yes, with `.txt` as the fallback |
| Upload a problem README | Yes | Yes |
| Upload personal notes | Yes, when notes exist | No |
| Avoid duplicate uploads | Existing file update | Accepted submission ID tracking |
| Show local solved statistics | Yes | Separate synced count |
| Historical backfill | No | No |

After a successful upload, the toolbar icon changes to a flame for five seconds. The extension then
restores the CodeSync logo.

## How it works

```text
LeetCode problem tab ─┐
                     ├─> trusted background worker ─> GitHub Contents API ─> selected repository
Codeforces tab ──────┘              │
                                    └─ fine-grained token in local extension storage
```

The content scripts read submission data from the signed-in LeetCode or Codeforces page. They send
that data to the extension's background worker. Only the background worker can read the token and
make authenticated GitHub requests.

CodeSync does not copy browser cookies. Normal browser requests made from the open coding-platform
page still use that page's signed-in session, which is how CodeSync reads source code that the site
only shows to you.

## Requirements

You need:

- Google Chrome 102 or newer. Other Chromium browsers have not been tested.
- Git.
- Node.js 20 or newer. GitHub Actions currently verifies the project with Node.js 24.
- npm, which is included with Node.js.
- Access to the private `kaustubh-dot/codesync` repository.
- A separate GitHub repository that will hold your solutions.

Check the local tools before continuing:

```powershell
git --version
node --version
npm --version
```

If `node --version` reports a version below 20, install a current Node.js release before building.

## Installation

### 1. Clone the private repository

Using GitHub CLI:

```powershell
gh auth status
gh repo clone kaustubh-dot/codesync
Set-Location codesync
```

Using Git over HTTPS:

```powershell
git clone https://github.com/kaustubh-dot/codesync.git
Set-Location codesync
```

GitHub may ask you to sign in because the source repository is private. Do not place a GitHub token
directly in the clone URL.

You can also download the repository from GitHub with **Code > Download ZIP**. Extract the archive
to a permanent folder before building it. Chrome remembers the path used for an unpacked extension,
so moving or deleting that folder later can disable the installation.

### 2. Install the locked dependencies

Run this from the repository root, the directory containing `package.json`:

```powershell
npm ci
```

Use `npm ci`, not `npm install`, for a normal installation. It installs the exact versions recorded
in `package-lock.json` and replaces any stale `node_modules` directory.

### 3. Verify and build

```powershell
npm run verify
npm audit
```

`npm run verify` performs a strict TypeScript check, runs the automated tests, and creates a fresh
production build. `npm audit` checks the installed dependency versions against npm's vulnerability
advisories.

Both commands should finish successfully. The extension that Chrome needs is now in:

```text
codesync/build/
```

Do not select the repository root when loading the extension. The root contains source code;
`build` contains the compiled extension and its `manifest.json`.

### 4. Load the extension in Chrome

1. Open a new Chrome tab.
2. Enter `chrome://extensions` in the address bar.
3. Turn on **Developer mode** in the upper-right corner.
4. Select **Load unpacked**.
5. Browse to the cloned CodeSync folder.
6. Select the `build` directory inside it.
7. Confirm that the extension card says **CodeSync** and shows no errors.

These are Chrome's standard steps for a locally loaded extension. See Chrome's
[Load an unpacked extension](https://developer.chrome.com/docs/extensions/get-started/tutorial/hello-world#load-unpacked)
instructions if the controls have moved in your Chrome version.

### 5. Pin CodeSync

1. Select Chrome's extensions puzzle icon in the toolbar.
2. Find **CodeSync**.
3. Select the pin beside it.
4. Select the colored Xiaohei icon to open the popup.

Chrome may show a developer-mode warning after a restart. That warning is expected for any unpacked
extension. Confirm that the extension path still points to this repository's `build` directory.

## GitHub setup

CodeSync needs one destination repository and one fine-grained personal access token. Create the
repository first because GitHub asks you to select it while creating the token.

### 1. Create the solution repository

1. Open [GitHub's new repository page](https://github.com/new).
2. Choose the account that should own the solutions.
3. Enter a repository name, such as `coding-solutions`.
4. Choose **Public** if you want anyone to see the files, or **Private** if you do not.
5. Initialize the repository with a README. This gives the repository a default branch before the
   first CodeSync upload.
6. Create the repository.
7. Copy its complete URL, for example:

   ```text
   https://github.com/your-user/coding-solutions
   ```

Changing the solution repository between public and private later does not require a new CodeSync
installation. The token must continue to have access to that repository.

### 2. Decide whether the solution repository should be public

A public solution repository is reasonable if you are comfortable exposing:

- solution source code and languages used;
- LeetCode notes that you chose to save;
- Codeforces ratings, tags, submission links, and problem statements;
- commit timestamps and your GitHub identity;
- the directory names and optional subdirectory structure.

Do not put API keys, passwords, session values, private URLs, customer data, or employer code in a
solution or note. This rule still applies when CodeSync's credential scanner does not recognize the
format.

### 3. Create a fine-grained token

1. Open [GitHub's fine-grained token page](https://github.com/settings/personal-access-tokens/new).
2. Enter a clear token name, such as `CodeSync coding-solutions`.
3. Add a short description so you remember why the token exists.
4. Choose an expiration date. A short renewable period is safer than no expiration.
5. Under **Resource owner**, choose the account or organization that owns the solution repository.
6. Under **Repository access**, choose **Only select repositories**.
7. Select only the solution repository created above.
8. Open **Repository permissions**.
9. Set **Contents** to **Read and write**.
10. Leave every other permission at its default unless GitHub requires read-only metadata.
11. Select **Generate token**.
12. Copy the token while GitHub still displays it. It should start with `github_pat_`.

GitHub documents the same resource-owner and selected-repository controls in
[Managing your personal access tokens](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/managing-your-personal-access-tokens#creating-a-fine-grained-personal-access-token).

Do not use:

- the `gho_...` token used by GitHub CLI;
- a classic personal access token;
- a token that can access all repositories;
- a token with workflow, administration, issues, or account permissions.

CodeSync only reads and creates or updates files through GitHub's repository Contents API. The
selected repository's **Contents: Read and write** permission is sufficient.

If an organization owns the repository, its policy may require an administrator to approve the
token. CodeSync cannot use it until that approval is complete.

## First-time CodeSync setup

### 1. Validate the token

1. Select the CodeSync toolbar icon.
2. Select **Complete setup**.
3. Paste the `github_pat_...` token into **Fine-grained GitHub token**.
4. Select **Validate token**.
5. Wait for CodeSync to display the repository step.

CodeSync asks GitHub for the account associated with the token. A failed validation usually means
the token is malformed, expired, pending organization approval, or blocked by a network problem.

### 2. Link the repository

1. Paste the complete repository URL into the repository field.
2. Use this exact form:

   ```text
   https://github.com/owner/repository
   ```

3. Do not paste a file, branch, issue, or settings URL.
4. Select **Link repository**.
5. Wait for the CodeSync dashboard to appear.

CodeSync verifies that the repository exists and that the token can write to it. It also records
whether the destination is currently public or private.

### 3. Reload coding-platform tabs

Chrome does not inject a newly installed or reloaded content script into tabs that were already
open. Reload every open LeetCode problem tab and every Codeforces tab after:

- installing CodeSync;
- reloading it from `chrome://extensions`;
- rebuilding it after an update.

This small step prevents most first-run sync failures.

## Using LeetCode

1. Sign in at [leetcode.com](https://leetcode.com/).
2. Open a problem at a URL beginning with `https://leetcode.com/problems/`.
3. Reload the tab if CodeSync was installed or updated after you opened it.
4. Write and submit the solution from that problem page.
5. Wait for LeetCode to mark the submission **Accepted**.
6. Allow several seconds for CodeSync to read the accepted submission and commit its files.
7. Look for the five-second flame icon, then check the destination repository's default branch.

CodeSync reacts to LeetCode's submission request, waits five seconds, and checks the latest accepted
submission for that problem. It ignores submissions older than one minute. This prevents an old
accepted answer from being uploaded merely because you opened a problem page.

For each accepted problem, CodeSync creates or updates:

```text
<question-number>-<problem-slug>/
|-- README.md
|-- Notes.md                  # only when LeetCode notes exist
`-- <problem-slug>.<extension>
```

The README contains the problem statement and difficulty badge. The solution commit records the
runtime and memory values reported by LeetCode. Submitting the same problem again updates the
existing files instead of creating another directory.

LeetCode support is limited to `leetcode.com`. LeetCode China and historical backfill are not
supported.

## Using Codeforces

### 1. Connect a handle

1. Sign in at [codeforces.com](https://codeforces.com/).
2. Open the CodeSync popup.
3. Select the gear icon in the popup.
4. Select **Connect Codeforces**.
5. Enter your Codeforces handle.
6. Select **Save**.
7. Confirm that the dashboard says `Codeforces @your-handle enabled`.

CodeSync validates the handle through Codeforces' public API. Handle matching follows Codeforces'
canonical capitalization.

### 2. Submit a solution

1. Keep a Codeforces tab open and signed in.
2. Reload the tab if CodeSync was installed or updated after it was opened.
3. Submit from a normal contest, problemset, or gym page on `codeforces.com`.
4. Wait for the verdict to become **Accepted**.
5. Keep the page open while judging completes.
6. Allow up to about 35 seconds for polling and upload.
7. Look for the five-second flame icon, then check the repository.

After a Codeforces submit request, CodeSync waits five seconds and polls the handle's latest
submission while its verdict is `TESTING`. It checks up to 15 times with a two-second delay. The
accepted submission must still be the latest submission and must be no more than three minutes old.

CodeSync then reads the source from the signed-in submission page and the statement from the problem
page. If Codeforces does not show the source to the current browser session, CodeSync cannot upload
it.

Each accepted Codeforces submission is stored under a separate `Codeforces` directory:

```text
Codeforces/<contest-id-and-index>-<problem-slug>/
|-- README.md
`-- <problem-slug>.<extension>
```

The README includes the rating when available, tags, and a link to the submission. CodeSync tracks
accepted submission IDs in local extension storage and does not upload the same ID twice.

Codeforces historical backfill is not supported. CodeSync only checks the recent submission that
triggered the current browser event.

## Repository layout

Without a custom subdirectory, a repository may look like this:

```text
coding-solutions/
|-- 1-two-sum/
|   |-- README.md
|   `-- two-sum.py
|-- 20-valid-parentheses/
|   |-- README.md
|   |-- Notes.md
|   `-- valid-parentheses.cpp
`-- Codeforces/
    `-- 4a-watermelon/
        |-- README.md
        `-- watermelon.cpp
```

CodeSync writes to the repository's default branch. A single accepted problem may create more than
one commit because the README, notes, and source file are uploaded separately.

## Settings

Open the CodeSync popup and select the gear icon after completing setup.

### Set a subdirectory

Use **Set a subdirectory** to place future uploads below a path such as:

```text
DSA/Practice
```

LeetCode files will then appear under `DSA/Practice/<problem>`. Codeforces files will appear under
`DSA/Practice/Codeforces/<problem>`.

A valid subdirectory:

- may contain multiple segments separated by `/`;
- may use letters, digits, `_`, `-`, and `.` inside each segment;
- may not contain `..` as a segment;
- may not contain spaces or other punctuation.

Clear the field and save it to return future uploads to the repository root. Changing the
subdirectory does not move files that CodeSync already uploaded.

### Change or unlink the repository

Use **Change or unlink repo** to paste another complete GitHub repository URL. The existing token
must have **Contents: Read and write** access to the new repository. If the token was restricted to
the old repository, create or edit a fine-grained token before changing the link.

Selecting **Unlink Repo** removes the saved repository owner and name but keeps the token. The popup
returns to the repository-linking step.

### Disconnect Codeforces

Open the Codeforces setting and select **Disconnect**. This removes the saved handle. It does not
delete files already uploaded to GitHub or clear the locally tracked submission IDs.

### Reset all local data

Use **Reset All** only when you want to erase the extension's local configuration and statistics.
It removes the token, linked repository, subdirectory, Codeforces handle, solved counts, and locally
tracked Codeforces submission IDs. It does not delete any GitHub repository or committed solution.

## Security model

### Token storage

The GitHub token is stored in `chrome.storage.local` inside the current Chrome profile. CodeSync
sets that storage area to `TRUSTED_CONTEXTS`, so LeetCode and Codeforces content scripts cannot read
it. The token is not synchronized through your Google account.

Chrome extensions do not have a general OS credential vault. Malware, a compromised Chrome profile,
or an attacker who controls the computer may still recover locally stored extension data. Keep the
token narrow, set an expiration date, and revoke it when you no longer use CodeSync.

### Upload credential check

Before an upload, CodeSync checks source code and LeetCode notes for formats resembling:

- GitHub tokens;
- AWS access keys;
- private-key headers;
- Slack tokens;
- Stripe secret keys;
- OpenAI API keys;
- Google API keys;
- npm access tokens.

If the check matches, CodeSync blocks the upload. It may produce false positives, and it cannot
recognize every possible secret. Never intentionally store a real credential in a solution. If a
credential has already appeared in a public repository, delete or rotate the credential first.
Removing it from Git history alone does not make the old value safe.

### Chrome permissions

| Permission | Why CodeSync needs it |
| --- | --- |
| `storage` | Store the token, repository choice, optional handle, and local statistics |
| `webRequest` | Detect completed submission requests without reading general browsing history |
| `https://leetcode.com/*` | Run the LeetCode content script and query submission details |
| `https://codeforces.com/*` | Validate the handle and read recent submission pages |
| `https://api.github.com/*` | Validate the token and create or update repository files |

CodeSync does not request `cookies`, `history`, broad `tabs`, clipboard, downloads, or all-sites host
access. Its extension pages use a restrictive Content Security Policy and do not execute remote code.

Read [SECURITY.md](SECURITY.md) for reporting and incident-response guidance.

## Updating CodeSync

The unpacked extension does not update itself. Use the same local folder for each update so Chrome
keeps the extension registration and its stored settings.

1. Open PowerShell in the CodeSync repository.
2. Check for local changes:

   ```powershell
   git status
   ```

3. If the working tree is clean, download the latest `main` branch:

   ```powershell
   git pull --ff-only origin main
   ```

4. Reinstall the exact locked dependencies:

   ```powershell
   npm ci
   ```

5. Rebuild and verify:

   ```powershell
   npm run verify
   npm audit
   ```

6. Open `chrome://extensions`.
7. Find CodeSync and select its reload button.
8. Confirm that the extension card shows no errors.
9. Reload open LeetCode and Codeforces tabs.

If `git status` lists your own changes, commit them or save them before pulling. Do not discard local
work just to update the extension.

## Troubleshooting

### Chrome says the manifest is missing

You selected the wrong directory. Run `npm run build`, then load `codesync/build`, which directly
contains `manifest.json`.

### Chrome shows an extension error after a rebuild

1. Run `npm run verify` and fix the reported error.
2. Open `chrome://extensions`.
3. Select **Errors** on the CodeSync card for details.
4. Select the reload button after a successful build.
5. Reload the coding-platform tab.

### The token is rejected

Check that:

- the token begins with `github_pat_`;
- it has not expired or been revoked;
- its resource owner owns the destination repository;
- **Only select repositories** includes the destination;
- **Contents** is set to **Read and write**;
- any required organization approval is complete.

Create a new fine-grained token if you cannot confirm the old token's scope. Do not broaden an
unknown token merely to make the error disappear.

### The repository cannot be linked

Use the repository's root URL with no path after its name. Confirm that the repository exists, has
an initialized default branch, and appears in the token's selected repository list. If an
organization owns it, confirm that you have write access.

### An accepted LeetCode solution does not appear

1. Confirm that CodeSync is enabled in `chrome://extensions`.
2. Confirm that setup is complete and the dashboard shows the intended repository.
3. Reload the LeetCode problem tab.
4. Stay signed in and submit again from `leetcode.com/problems/...`.
5. Confirm that the latest submission is accepted and less than one minute old.
6. Check whether the language is supported by CodeSync.
7. Review the solution and notes for anything resembling a credential.
8. Wait several seconds, then refresh the GitHub repository's default branch.

### An accepted Codeforces solution does not appear

1. Confirm that the saved Codeforces handle matches the submitting account.
2. Keep the Codeforces page open and signed in until judging completes.
3. Reload the page after every CodeSync installation, update, or extension reload.
4. Confirm that the accepted submission is still the account's latest submission.
5. Confirm that the submission is less than three minutes old.
6. Open the submission page and verify that your browser can see the source code.
7. Check whether Codeforces or its API is temporarily unavailable.
8. Review the source for anything resembling a credential.

CodeSync does not search backward through submission history. If a newer submission replaced the
accepted submission as the latest result, submit the intended solution again.

### The flame appears but files are not where expected

Check the configured subdirectory and the repository's default branch. Codeforces always adds a
`Codeforces` segment below the configured subdirectory. Changing the setting does not move older
files.

### The extension stopped working after moving the folder

Return the folder to its old location, or remove the broken CodeSync entry from
`chrome://extensions` and load the new `build` directory. A new installation path may create a new
extension identity and empty local settings, so you may need to configure it again.

### GitHub refuses an upload

Check the token's expiration, repository access, and organization approval. Also check whether the
default branch is protected against direct commits. CodeSync writes directly through the Contents
API and does not open pull requests.

## Removing CodeSync

Use this order if you no longer need the extension:

1. Open [GitHub token settings](https://github.com/settings/personal-access-tokens).
2. Find the token created for CodeSync.
3. Revoke or delete it.
4. Open CodeSync and use **Reset All** if the extension still loads.
5. Open `chrome://extensions` and select **Remove** on the CodeSync card.
6. Delete the local cloned repository if you do not need the source.

Removing CodeSync does not delete the destination repository or any uploaded solutions. Deleting
the local source folder is recoverable by cloning this private repository again. Revoking the token
cannot be undone, but you can create a replacement later.

## Development and verification

Install dependencies once with `npm ci`, then use these commands from the repository root:

| Command | Purpose |
| --- | --- |
| `npm run typecheck` | Run strict TypeScript checks, including unused symbols and parameters |
| `npm test` | Run behavioral and security-contract tests with Vitest |
| `npm run build` | Delete and recreate the production `build` directory |
| `npm run verify` | Run type checking, tests, and the production build in sequence |
| `npm audit` | Check installed packages for published vulnerabilities |

The main source areas are:

```text
src/
|-- background.ts            # trusted message handling and submission detection
|-- scripts/
|   |-- leetcode.ts          # LeetCode page integration
|   `-- codeforces.ts        # Codeforces page integration
|-- handlers/
|   |-- GithubHandler.ts     # token validation and GitHub uploads
|   |-- LeetCodeHandler.ts   # LeetCode submission retrieval
|   `-- CodeforcesHandler.ts # Codeforces validation and source retrieval
|-- modules/                 # onboarding and dashboard UI
|-- components/              # popup components
`-- __tests__/               # behavior and security-contract tests
```

After changing source code:

1. Run `npm run verify`.
2. Run `npm audit` when dependencies or the lockfile change.
3. Reload CodeSync in `chrome://extensions`.
4. Reload any LeetCode and Codeforces tabs used for manual testing.

GitHub Actions repeats `npm ci`, `npm run verify`, and `npm audit` for every push and pull request.
Dependabot checks compatible npm and GitHub Actions updates each week.

## Project history

CodeSync is based on [LeetSync](https://github.com/LeetSync/LeetSync). Its Codeforces behavior was
informed by [CodeforcesSync](https://github.com/mhdnazrul/CodeforcesSync) and
[cf-pusher](https://github.com/SarJ2004/cf-pusher). The links are retained because this private
repository is a derivative project.
