# Manual Release Signing

This project uses a manual MSI signing flow for Microsoft Store releases.

## 1. Build the unsigned MSI

Push a tag like `v1.2.0`.

The `Release` workflow will build the Windows MSI and upload an unsigned artifact named:

- `markora-windows-unsigned-v1.2.0`

Download that artifact from GitHub Actions.

## 2. Sign the MSI locally

Sign the MSI on your Windows machine with your trusted code-signing certificate.

Example:

```powershell
signtool sign /fd SHA256 /tr http://timestamp.digicert.com /td SHA256 /a "C:\path\to\Markora MD_1.2.0_x64_en-US.msi"
```

Verify it:

```powershell
Get-AuthenticodeSignature "C:\path\to\Markora MD_1.2.0_x64_en-US.msi" | Format-List Status,SignerCertificate
```

You want:

- `Status : Valid`

## 3. Publish the signed MSI locally

Run:

```powershell
.\scripts\publish-signed-release.ps1 -Version 1.2.0 -SignedMsiPath "C:\path\to\Markora MD_1.2.0_x64_en-US.msi"
```

Or with npm:

```powershell
npm run publish:signed -- -Version 1.2.0 -SignedMsiPath "C:\path\to\Markora MD_1.2.0_x64_en-US.msi"
```

This script will:

- verify the MSI signature
- copy it into `docs/releases/<version>/`
- update `docs/releases.json`
- commit and push the release metadata to `main`
- upload the MSI to the GitHub Release tag using `gh`

Requirements:

- `git` configured for this repo
- GitHub CLI `gh` installed and authenticated
- the tag `v<version>` already exists on GitHub

## 4. Use the direct download URL

After the script succeeds, use:

`https://kelvink96.github.io/markora/releases/<version>/Markora-MD_<version>.msi`

Example:

`https://kelvink96.github.io/markora/releases/1.2.0/Markora-MD_1.2.0.msi`
