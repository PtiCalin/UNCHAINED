# Security Policy

## Supported Versions
| Version | Status |
|---------|--------|
| 0.1.x   | Supported (alpha) |

## Reporting a Vulnerability
Please email `security@placeholder.example` with details and reproduction steps.
Include:
- Affected endpoints or components
- Version (`tauri.conf.json` & CHANGELOG)
- Steps to reproduce
- Potential impact

We aim to acknowledge within 72 hours.

## Handling Process
1. Triage & confirm
2. Assign CVSS-like internal score
3. Patch in private branch
4. Release security advisory + patched version

## Secure Development Guidelines
- Avoid storing secrets in repo
- Validate and sanitize user input
- Prefer parameterized queries (already in use with SQLite)
- Limit external requests to user-triggered operations

## Updater Signing
Updater manifest will be signed (Ed25519). Placeholder pubkey currently in config; will be replaced before public beta.

## Disclosure Policy
Please refrain from public disclosure until a fix is released.
