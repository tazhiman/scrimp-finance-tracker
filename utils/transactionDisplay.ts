import type { Transaction } from '@/types';

/**
 * Primary + subtitle lines for compact transaction rows (list, calendar day modal).
 * When a merchant is set, it is the bold top line; category moves to the subtitle with optional description.
 */
export function getTransactionRowLabels(
  item: Transaction,
  categoryLabel: string
): { primary: string; subtitle: string | null } {
  const merchant = (item.merchant ?? '').trim();
  const desc = (item.description ?? '').trim();

  if (merchant) {
    const subtitleParts = [categoryLabel, desc].filter((s) => (s ?? '').trim().length > 0);
    return {
      primary: merchant,
      subtitle: subtitleParts.length > 0 ? subtitleParts.join(' · ') : null,
    };
  }

  return {
    primary: categoryLabel,
    subtitle: desc.length > 0 ? desc : null,
  };
}
