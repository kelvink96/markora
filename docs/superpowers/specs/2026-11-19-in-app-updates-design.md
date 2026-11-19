# In-app updates — design

## Intent

Direct-download users should stop running old versions. Markora shows its current version, lets the user check for updates, and installs an update without leaving the app. Why: today a user must notice a new release and re-download the MSI by hand.

## Goals

- Quiet check once at launch; an "Update available" badge if a newer version exists.
- Settings "Updates" card: current version, "Check for updates" button, and these states: up to date, available (with release notes), downloading (with progress), downloaded / restart to install, error.
- "Check automatically" toggle in settings, on by default.
- Install only on an explicit click. Never download or install unprompted.
- Releases publish a signed update manifest, so shipping a version is still one tag push.

## Non-goals

- Microsoft Store builds (not shipping there for now; the Store forbids self-updating, so revisit if that changes).
- macOS and Linux build jobs. Windows MSI is the only target today.
- Release channels (beta/stable), delta updates, rollback.
- Web: no-op. The service worker already handles new web versions.

## Anti-goals

- Updating without the user's say-so.
- Installing anything whose signature does not verify.
- Blocking the editor or losing unsaved work during an update.

## Constraints

- Architecture rule: `invoke`/Tauri plugin calls live only in platform adapters, never in components. Add `src/platform/updates/` (`types.ts`, `desktop.ts`, `web.ts`, `index.ts`), mirroring `files/` and `markdown/`.
- Settings are persisted through `settings-schema.ts`, so the toggle is a new `MarkoraSettings` field with a default.
- `tauri.conf.json` CSP `connect-src` must allow GitHub (manifest at `github.com`, redirecting to `objects.githubusercontent.com`).
- `release.yml` already passes `TAURI_SIGNING_PRIVATE_KEY(_PASSWORD)` to the build, so the updater keypair is partly in place. The public key still has to go in `tauri.conf.json`.
- The updater compares against the `tauri.conf.json` version. `Cargo.toml` says 1.0.0 while the config says 1.4.0; align them as part of this.
- The MSI is also Authenticode-signed after the build in `release.yml`. The updater signature (`.sig`) must be produced from the final signed MSI, or the manifest signature won't match the file users download.

## Approaches considered

- **A. Updater plugin + GitHub Releases (chosen).** `tauri-action` builds, creates the Release, uploads the MSI and `latest.json`. App reads `releases/latest/download/latest.json`. No extra hosting.
- **B. Same plugin, manifest on GitHub Pages.** Lets the manifest URL move without an app release, but adds a second deploy target to keep in sync.
- **C. GitHub API check, open the download page.** Least code but no in-app install, so it misses the goal.

Chosen first: A. **Revised after reading the real release flow:** B, with the manifest on GitHub Pages. Releases are published by `scripts/publish-signed-release.ps1`, which already copies the Authenticode-signed MSI to `docs/releases/<v>/` (served at `kelvink96.github.io/markora/releases/<v>/`) and updates `docs/releases.json`. The latest GitHub Release is v1.1.5; 1.2.0 to 1.4.0 were never published there, so `releases/latest` is stale. The user picked B (extend the script) over restarting GitHub Releases.

## Design (decided)

**Release pipeline (revised).** `release.yml` is unchanged: it builds and Authenticode-signs the MSI, and the maintainer runs `npm run publish:signed`. That script gains two steps, after the Authenticode check: sign the final MSI with the updater key (`tauri signer sign`, key from `TAURI_SIGNING_PRIVATE_KEY` / `_PASSWORD` in the environment) to get the `.sig`, then write `docs/latest.json` (version, notes, `pub_date`, `platforms."windows-x86_64"` with `url` = the Pages MSI URL and `signature` = the `.sig` contents) and commit it with the MSI and `releases.json`. The app's endpoint is `https://kelvink96.github.io/markora/latest.json`. The public key is in `tauri.conf.json` under `plugins.updater.pubkey`; install mode is `passive`. Updater artifacts are not enabled in the build (`createUpdaterArtifacts` stays off) because a signature made before the Authenticode step would not match the shipped MSI. The signing step runs on the maintainer's machine, so the private key is needed locally; the repo secrets from the earlier decision are not required by this flow.

**Version bump.** `release-it` bumps `package.json` and `tauri.conf.json` (via the bumper). `src-tauri/Cargo.toml` is added to the bumper config so all three stay aligned.

**CSP.** `connect-src` gains `https://kelvink96.github.io`; the MSI download is from the same host.

**Decided by the designer (calls, not agreed with the user):**
- First updater release ships as 1.5.0. Existing 1.4.0 and earlier installs cannot self-update, so they download 1.5.0 manually once. Release notes say so.
- `tauri.conf.json` is the canonical version. `Cargo.toml` and `package.json` are aligned to it in the same change.
- Default MSI installs per-machine, so Windows may show a UAC prompt during the update. Accepted for now; switching to a per-user install is out of scope.
- Desktop has no workspace persistence (web only). Before installing (which closes the app), if any tab has unsaved changes, refuse and ask the user to save rather than relying on restore.
- `releases/latest` ignores pre-releases, so end-to-end testing uses a test build whose updater endpoint points at a separate test release, not a real production release.
- The "Update available" badge shows whenever the store is in `available`, whether the check was automatic or manual.

**Updater key (decided by the user):** generate a new keypair; the old `TAURI_SIGNING_PRIVATE_KEY` secret is replaced, since no updater has shipped yet. The user generates it locally so the private key and password never pass through the agent; the public key goes in `tauri.conf.json` and the private key and password replace the repo secrets. The redundant-looking `TAURI_SIGNING_PRIVATE_KEY_PATH` secret is checked for use and removed if unused.

**Rust.** Add `tauri-plugin-updater` and `tauri-plugin-process` (for relaunch); register in `lib.rs`; add capabilities.

**Adapter.** `UpdateAdapter` with `checkForUpdate()` (returns none or `{version, notes, date}`), `download(onProgress)`, `install()` and `relaunch()`. Download and install are separate because on Windows the plugin's install step launches the MSI installer and then exits the app (`install()` never returns there); the installer reopens Markora. On macOS/Linux `install()` returns and the store calls `relaunch()`. Desktop wraps the plugins; web returns "no updates" and rejects the rest.

**State.** A small Zustand store `src/features/updates/update-store.ts` owns the status machine (`idle | checking | up-to-date | available | downloading | ready | error`), progress, and the available version/notes. `download()` ends in `ready`; `restart()` re-checks for unsaved tabs itself (and refuses with "Save your changes before restarting.") before calling `install()`, so nothing closes the app while work is unsaved. Components read it; the launch check runs from `App.tsx` and is gated on desktop and the auto-check setting.

**UI.** "Updates" card in the settings page: "Download update", then "Update downloaded" with a "Restart to install" button (disabled while any tab is unsaved) and the note "Markora will close and reopen. Windows may ask for permission."; a small "Update available" badge in the existing chrome that links to it; the version already shown in the settings footer/About stays as is. Add a command-palette entry "Check for updates".

**Errors.** Offline or failed checks on launch are silent; a manual check shows the error inline with a retry.

## Left to the builder

- Exact badge placement and copy.
- Whether to render release notes as markdown through the existing preview pipeline or as plain text.
- Test seams for the adapter (mock the plugin modules).
- How to verify the Authenticode-then-updater-signature ordering in CI without publishing a real release (e.g. a dry-run on a pre-release tag).
