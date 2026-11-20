# Releasing Markora

Releases are automated. Pushing a `v*` tag runs `.github/workflows/release.yml`.

## Cut a release

```powershell
pnpm exec release-it 1.5.0 --ci
```

This bumps `package.json`, `src-tauri/tauri.conf.json` and `src-tauri/Cargo.toml`, commits, tags `v1.5.0` and pushes.

## What CI does

1. Builds the MSI and Authenticode-signs it with the certificate secrets.
2. Uploads it as a workflow artifact.
3. Creates the GitHub release with generated notes and the MSI as `Markora-MD_<version>.msi`.
4. Signs the MSI for the in-app updater, writes `docs/latest.json` and pushes it to `main`.

The landing page reads the latest GitHub release for the version, download link and notes. The app's updater reads `https://kelvink96.github.io/markora/latest.json`.

## Required repository secrets

- `TAURI_SIGNING_PRIVATE_KEY` and `TAURI_SIGNING_PRIVATE_KEY_PASSWORD`: must match the `pubkey` in `src-tauri/tauri.conf.json`.
- `WINDOWS_CERTIFICATE` and `WINDOWS_CERTIFICATE_PASSWORD`: Authenticode certificate.

## Manual fallback

`pnpm publish:signed -Version <v> -SignedMsiPath <msi>` (`scripts/publish-signed-release.ps1`) does the same publishing steps from a local machine. It needs the tag and release to exist and the Tauri signing env vars set.
