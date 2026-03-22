import Constants from 'expo-constants';

/**
 * Exact name of the shared shortcut users must select in the Wallet automation.
 * Must match the shortcut title when published from the Shortcuts app.
 */
export const SCRIMP_WALLET_AUTOMATION_SHORTCUT_NAME = 'Scrimp: Log from Wallet';

/**
 * Public iCloud Shortcuts install link (set via EXPO_PUBLIC_SCRIMP_WALLET_SHORTCUT_URL
 * or app.json `extra.scrimpWalletShortcutUrl`).
 */
export function getScrimpWalletShortcutInstallUrl(): string | null {
  const fromEnv =
    typeof process.env.EXPO_PUBLIC_SCRIMP_WALLET_SHORTCUT_URL === 'string'
      ? process.env.EXPO_PUBLIC_SCRIMP_WALLET_SHORTCUT_URL.trim()
      : '';
  const fromExtra = String(
    Constants.expoConfig?.extra?.scrimpWalletShortcutUrl ?? ''
  ).trim();
  const raw = fromEnv || fromExtra;
  if (!raw || raw === 'REPLACE_WITH_ICLOUD_LINK') {
    return null;
  }
  return raw;
}
