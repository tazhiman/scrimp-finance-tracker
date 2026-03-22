# Scrimp Wallet shortcut (installable)

End users add tap-to-pay logging by installing a **shared shortcut** once, then creating a **Wallet** personal automation that **runs that shortcut**. Amount and merchant are wired **inside** the shortcut (by maintainers), not in the automation.

## Maintainer: author the shortcut (on a real iPhone)

Requires **Scrimp installed** (TestFlight or dev) so **Log Transaction** appears under the Scrimp app in Shortcuts.

1. Open **Shortcuts** → **+** → create a new shortcut.
2. Open the shortcut’s **details** (ⓘ) and enable **“Allow Running When Locked”** / automation-friendly options if shown, so it can run from Personal Automation without opening Shortcuts.
3. Ensure the shortcut can use **Shortcut Input** from automations (iOS may label this as input passed from the previous step / automation).
4. Add action: **Log Transaction** (Scrimp).
5. Set parameters:
   - **Amount** ← from Wallet / Shortcut Input (same source you use when mapping manually today).
   - **Merchant / Description** ← merchant from that input.
   - **Type**: Expense (default).
   - **Category**: Other (default), unless you want users to choose.
6. **Name** the shortcut exactly: **`Scrimp: Log from Wallet`** (must match `SCRIMP_WALLET_AUTOMATION_SHORTCUT_NAME` in [config/shortcutsWallet.ts](../config/shortcutsWallet.ts)).
7. **Test**: Personal Automation → **Wallet** → **Run Shortcut** → this shortcut → complete a test payment → open Scrimp and confirm one transaction syncs.
8. **Publish**: Share → **Copy iCloud Link** (or **Share Link**). Anyone with the link can add the shortcut.

If Wallet passes nested data, add intermediate actions (**Get Dictionary Value**, **Format Number**, etc.) so **Log Transaction** still receives a number and a string.

## Maintainer: wire the link into the app

1. Set **`EXPO_PUBLIC_SCRIMP_WALLET_SHORTCUT_URL`** in `.env` (see [.env.example](../.env.example)), **or** set `expo.extra.scrimpWalletShortcutUrl` in [app.json](../app.json).
2. Rebuild the app. The Tap-to-Pay guide’s **Get shortcut** button opens this URL; if unset, it falls back to opening the Shortcuts app.

## Optional: version the `.shortcut` file

Export the shortcut from Shortcuts (e.g. AirDrop to Mac) and save under `shortcuts/` if you want a backup in git. The app still expects users to install via the public iCloud link unless you document sideloading.

## When to update

- If **Log Transaction** parameters change in `LogTransactionIntent.swift`, re-publish the shortcut and bump the install link if needed.
- Keep the shortcut **name** stable, or update `SCRIMP_WALLET_AUTOMATION_SHORTCUT_NAME` and the in-app guide copy.
