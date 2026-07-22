# Personal LeetSync

A private, hardened Chrome extension that syncs accepted LeetCode submissions to one GitHub
repository. It preserves LeetSync's solution, README, notes, subdirectory, streak, statistics, and
success-icon features while narrowing access to the minimum practical scope.

This project is based on [LeetSync](https://github.com/LeetSync/LeetSync) and retains its MIT
license.

## Security design

- Uses a fine-grained GitHub personal access token restricted to one selected repository.
- Stores configuration in device-local extension storage, not Chrome Sync.
- Restricts storage access to trusted extension pages and the background worker.
- Performs authenticated GitHub requests only in the background worker. The LeetCode content
  script never receives the token.
- Uses the existing signed-in LeetCode page session without reading or copying its session cookie.
- Has no OAuth client secret, callback script, analytics, remote code, or third-party server.
- Requests only `storage` and `webRequest`, plus host access to LeetCode and the GitHub API.
- Validates repository write access and rejects unsafe repository subdirectory paths.

Chrome does not provide a general-purpose OS credential vault to extensions. The GitHub token is
therefore stored locally in the Chrome profile so automatic syncing continues after a browser
restart. Limit the token to one repository, give it an expiry date, and use a dedicated repository
to contain the impact of browser-profile compromise.

## Create the GitHub token

1. Open [GitHub fine-grained token settings](https://github.com/settings/personal-access-tokens/new).
2. Give the token a short expiry date.
3. Under Repository access, choose **Only select repositories** and select the destination
   repository.
4. Under Repository permissions, set **Contents** to **Read and write**. Leave every other
   permission at its default.
5. Generate the token and paste it into Personal LeetSync. GitHub only shows the token once.

The extension validates both the token and write access before saving the selected repository.

## Install locally

Requirements: Node.js 20 or newer and npm.

```bash
npm ci
npm run verify
```

Then:

1. Open `chrome://extensions`.
2. Enable Developer mode.
3. Choose **Load unpacked**.
4. Select this project's `build` directory.
5. Open the extension and complete the two setup steps.

Sign in to LeetCode normally. When an accepted submission finishes, the extension uploads:

- `README.md` with the problem statement and difficulty badge
- `Notes.md` when the submission contains notes
- the solution file using the language's normal extension

## Verify changes

```bash
npm run typecheck
npm test
npm run build
npm audit
```

The security-contract tests fail if cookie access, Chrome Sync storage, broad GitHub page injection,
or additional manifest permissions are reintroduced.

## Revoke access

Delete the token from [GitHub token settings](https://github.com/settings/personal-access-tokens),
then choose **Reset All** in the extension. Removing the extension also deletes its local storage.

## Maintenance

Dependabot checks npm and GitHub Actions dependencies weekly. The verification workflow runs type
checking, behavioral and security tests, a production build, and `npm audit` for every push and pull
request.
