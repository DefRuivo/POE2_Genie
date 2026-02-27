# CI Security Checks Policy

This repository uses separate quality and security checks on GitHub Actions.

## Workflows

- `.github/workflows/on_pull_request.yml`
  - `quality-lint-test`: runs `pnpm lint` and `pnpm test`
  - `quality-build`: runs `pnpm build`
- `.github/workflows/security_checks.yml`
  - `security-dependency-review`
  - `security-pnpm-audit`
  - `security-trivy-fs`
  - `security-codeql`

## Triggers

- Pull requests targeting `main`
- Pushes to `main`
- Nightly schedule at `06:00 UTC`
- Manual run (`workflow_dispatch`)

## Security Gate Policy

- Threshold: High/Critical
- Merge is blocked when any required security check fails.

## CodeQL Toggle

- CodeQL is enabled by default.
- To disable CodeQL without disabling the other checks, set repository variable:
  - `ENABLE_CODEQL=false`

## Branch Protection Setup (GitHub UI)

Configure branch protection for `main` and require the checks below:

- `quality-lint-test`
- `quality-build`
- `security-dependency-review`
- `security-pnpm-audit`
- `security-trivy-fs`
- `security-codeql` (when enabled)

Recommended additional options:

- Require a pull request before merging
- Require branches to be up to date before merging

## Security Features to Enable in Repository Settings

- Dependabot alerts
- Secret scanning
- Push protection (if your plan supports it)

## Temporary Exception Process

When a false positive or temporary exception is required:

1. Open an issue describing the finding, impact, and mitigation.
2. Link the issue in the PR.
3. Add a time-boxed exception with clear expiration date.
4. Remove the exception as soon as mitigation is merged.
