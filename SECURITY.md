# Security policy

CodeSync supports public or private solution repositories. Do not publish GitHub tokens, extension
storage exports, browser profiles, or built packages containing personal data in an issue or commit.

## Supported versions

| Version | Supported |
| --- | --- |
| 3.x | Yes |
| 2.x and earlier | No |

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

## Reporting a vulnerability

Use GitHub's
[private vulnerability reporting](https://github.com/kaustubh-dot/codesync/security/advisories/new).
Do not open a public issue for a suspected vulnerability.

Include the affected version, impact, sanitized reproduction steps, and any suggested mitigation.
Never include a token, private solution, storage export, cookie, or browser-profile data. You should
receive an acknowledgement within seven days. The maintainer will coordinate remediation and public
disclosure based on severity.

Revoke the affected token before investigating a suspected credential leak. Removing a secret from
Git history does not make that secret safe to reuse.
