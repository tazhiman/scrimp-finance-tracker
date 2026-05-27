import { SavingsGoal, Transaction } from '@/types';
import { loadNotificationSettings } from '@/utils/storage';
import { sendGoalReserveNotification } from '@/utils/notifications';
import { evaluateGoalReserve } from '@/utils/goalReserve';

/**
 * Re-evaluate linked goals and send notifications when reserve status worsens.
 * Multiple goals on one account each use their own watch window (v1).
 */
export async function checkAndNotifyGoalReserves(
  goals: SavingsGoal[],
  transactions: Transaction[],
  onUpdateGoal: (id: string, updates: Partial<SavingsGoal>) => void
): Promise<void> {
  const notificationsEnabled = await loadNotificationSettings();
  if (!notificationsEnabled) return;

  for (const goal of goals) {
    if (!goal.linkedAccountId || !goal.reserveAmount || goal.reserveAmount <= 0) {
      continue;
    }

    const status = evaluateGoalReserve(goal, transactions);
    const prev = goal.lastReserveStatus ?? 'ok';

    if (status === prev) {
      continue;
    }

    if (status === 'nearing' || status === 'negated') {
      await sendGoalReserveNotification(goal, status);
      onUpdateGoal(goal.id, {
        lastReserveStatus: status,
        lastReserveNotifiedAt: new Date().toISOString(),
      });
    } else {
      onUpdateGoal(goal.id, { lastReserveStatus: status });
    }
  }
}
