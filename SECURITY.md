# Security policy

CodeSync supports public or private solution repositories. Do not publish GitHub tokens, extension
storage exports, browser profiles, or built packages containing personal data in an issue or commit.

## Supported version

Only the current `main` branch is maintained.

## Credential handling

Use a fine-grained GitHub token restricted to the one or two configured solution repositories with
only Contents read/write access. Set an expiry date and revoke the token if the browser profile,
extension directory, or computer may have been compromised.

The token is stored in `chrome.storage.local` with access restricted to trusted extension contexts.
It is not encrypted by this extension. This design avoids cloud synchronization and page access but
cannot protect a token from malware or an attacker who already controls the Chrome profile.

Before uploading, the extension blocks common GitHub, cloud, package-registry, payment, Slack, and
private-key credential formats found in solution code or notes. This is defense in depth, not a
complete secret scanner; revoke any credential that is ever published.

## Reporting

Revoke the affected token before investigating a suspected credential leak. Record only sanitized
error messages; never include the token or coding-platform browser data.
