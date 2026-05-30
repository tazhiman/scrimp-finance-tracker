import React, { useState, useCallback, useRef } from 'react';
import {
  View,
  StyleSheet,
  Dimensions,
  Animated,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@/context/ThemeContext';
import { useFinance } from '@/context/FinanceContext';
import { useBankAccounts } from '@/context/BankAccountsContext';
import { Spacing } from '@/constants/design';
import { saveUserCards, saveSalarySkippedAt } from '@/utils/storage';
import { saveBankAccounts, completeOnboarding } from '@/utils/onboarding';
import { UserCard, BankAccount } from '@/types';
import { WelcomeStep } from './WelcomeStep';
import { SavingsGoalStep, GoalFormData } from './SavingsGoalStep';
import { LinkAccountStep, LinkAccountResult } from './LinkAccountStep';
import { CardSelectionStep, AccountType } from './CardSelectionStep';
import { CreditCardSetupStep } from './CreditCardSetupStep';
import { BankAccountStep } from './BankAccountStep';
import { ShortcutsGuideStep } from './ShortcutsGuideStep';
import { SalaryStep, SalaryFormData } from './SalaryStep';
import { buildInitialReserveFields } from '@/utils/goalReserve';
import { ENV } from '@/config/env';

type Step =
  | 'welcome'
  | 'savings_goal'
  | 'link_account'
  | 'add_salary'
  | 'account_type'
  | 'credit_card_setup'
  | 'bank_account_setup'
  | 'shortcuts_guide';

interface OnboardingFlowProps {
  onComplete: () => void;
}

function dedupeBankAccounts(accounts: BankAccount[]): BankAccount[] {
  const byId = new Map<string, BankAccount>();
  for (const account of accounts) {
    byId.set(account.id, account);
  }
  return Array.from(byId.values());
}

export function OnboardingFlow({ onComplete }: OnboardingFlowProps) {
  const { theme } = useTheme();
  const { addGoal, addRecurringExpense } = useFinance();
  const { reloadAccounts } = useBankAccounts();
  const [currentStep, setCurrentStep] = useState<Step>('welcome');
  const [firstChoice, setFirstChoice] = useState<AccountType | null>(null);
  const [didCreditCards, setDidCreditCards] = useState(false);
  const [didBankAccounts, setDidBankAccounts] = useState(false);
  const [goalData, setGoalData] = useState<GoalFormData | null>(null);
  const [linkAccountResult, setLinkAccountResult] = useState<LinkAccountResult | null>(null);
  const [salaryData, setSalaryData] = useState<SalaryFormData | null>(null);
  const [creditCards, setCreditCards] = useState<UserCard[] | null>(null);
  const [extraBankAccounts, setExtraBankAccounts] = useState<BankAccount[] | null>(null);
  const [history, setHistory] = useState<Step[]>([]);
  const fadeAnim = useRef(new Animated.Value(1)).current;

  const linkedAccount = linkAccountResult?.account ?? null;

  const transitionTo = useCallback((nextStep: Step) => {
    setHistory(prev => [...prev, currentStep]);
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 150,
      useNativeDriver: true,
    }).start(() => {
      setCurrentStep(nextStep);
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }).start();
    });
  }, [fadeAnim, currentStep]);

  const goBack = useCallback(() => {
    if (history.length === 0) return;
    const prev = history[history.length - 1];
    setHistory(h => h.slice(0, -1));
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 150,
      useNativeDriver: true,
    }).start(() => {
      setCurrentStep(prev);
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }).start();
    });
  }, [fadeAnim, history]);

  const commitOnboardingData = async () => {
    const today = new Date().toISOString().split('T')[0];

    if (goalData && linkAccountResult) {
      const { existingSavings, account } = linkAccountResult;
      addGoal({
        name: goalData.name,
        targetAmount: goalData.targetAmount,
        currentAmount: existingSavings,
        contributionAmount: goalData.contributionAmount,
        frequency: goalData.frequency,
        startDate: today,
        endDate: goalData.endDate,
        contributions: [],
        ...buildInitialReserveFields(account.id, existingSavings, today),
      });
    }

    if (salaryData) {
      addRecurringExpense({
        kind: 'recurring',
        title: salaryData.title,
        amount: salaryData.amount,
        category: 'salary',
        transactionType: 'income',
        startDate: salaryData.startDate,
        frequency: salaryData.frequency,
        createdAt: new Date().toISOString(),
      });
    }

    const bankAccounts: BankAccount[] = [];
    if (linkAccountResult) {
      bankAccounts.push(linkAccountResult.account);
    }
    if (extraBankAccounts?.length) {
      bankAccounts.push(...extraBankAccounts);
    }
    const deduped = dedupeBankAccounts(bankAccounts);
    if (deduped.length > 0) {
      await saveBankAccounts(deduped);
    }

    if (creditCards && creditCards.length > 0) {
      await saveUserCards(creditCards);
    }
  };

  const finish = async () => {
    await commitOnboardingData();
    await reloadAccounts();
    await completeOnboarding();
    onComplete();
  };

  const handleGoalCreated = (data: GoalFormData) => {
    setGoalData(data);
    transitionTo('link_account');
  };

  const handleAccountLinked = (result: LinkAccountResult) => {
    if (!goalData) return;
    setLinkAccountResult(result);
    transitionTo('add_salary');
  };

  const goToPostSalaryStep = () => {
    transitionTo(ENV.enableCreditCards ? 'account_type' : 'bank_account_setup');
  };

  const handleSalaryDone = (data: SalaryFormData) => {
    setSalaryData(data);
    goToPostSalaryStep();
  };

  const handleSkipSalary = async () => {
    setSalaryData(null);
    await saveSalarySkippedAt();
    goToPostSalaryStep();
  };

  const handleAccountTypeSelected = (type: AccountType) => {
    setFirstChoice(type);
    if (type === 'credit_card') {
      transitionTo('credit_card_setup');
    } else {
      transitionTo('bank_account_setup');
    }
  };

  const handleCreditCardsDone = (cards: UserCard[]) => {
    setCreditCards(cards);
    setDidCreditCards(true);
    if (!didBankAccounts && firstChoice === 'credit_card') {
      transitionTo('bank_account_setup');
    } else {
      transitionTo('shortcuts_guide');
    }
  };

  const handleBankAccountsDone = (accounts: BankAccount[]) => {
    setExtraBankAccounts(accounts);
    setDidBankAccounts(true);
    if (
      ENV.enableCreditCards &&
      !didCreditCards &&
      firstChoice === 'bank_account'
    ) {
      transitionTo('credit_card_setup');
    } else {
      transitionTo('shortcuts_guide');
    }
  };

  const handleSkipAccountType = () => {
    transitionTo('shortcuts_guide');
  };

  const handleSkipCreditCards = () => {
    setCreditCards([]);
    setDidCreditCards(true);
    if (!didBankAccounts && firstChoice === 'credit_card') {
      transitionTo('bank_account_setup');
    } else {
      transitionTo('shortcuts_guide');
    }
  };

  const handleSkipBankAccounts = () => {
    setExtraBankAccounts([]);
    setDidBankAccounts(true);
    if (
      ENV.enableCreditCards &&
      !didCreditCards &&
      firstChoice === 'bank_account'
    ) {
      transitionTo('credit_card_setup');
    } else {
      transitionTo('shortcuts_guide');
    }
  };

  const stepOrder: Step[] = ['welcome', 'savings_goal', 'link_account', 'add_salary'];
  if (ENV.enableCreditCards) {
    stepOrder.push('account_type');
    if (firstChoice === 'credit_card') {
      stepOrder.push('credit_card_setup', 'bank_account_setup');
    } else if (firstChoice === 'bank_account') {
      stepOrder.push('bank_account_setup', 'credit_card_setup');
    }
  } else {
    stepOrder.push('bank_account_setup');
  }
  stepOrder.push('shortcuts_guide');

  const currentIndex = stepOrder.indexOf(currentStep);
  const totalDots = stepOrder.length;

  const canGoBack = history.length > 0;

  const renderStep = () => {
    switch (currentStep) {
      case 'welcome':
        return <WelcomeStep onNext={() => transitionTo('savings_goal')} />;
      case 'savings_goal':
        return (
          <SavingsGoalStep
            initialValues={goalData ?? undefined}
            onNext={handleGoalCreated}
            onBack={canGoBack ? goBack : undefined}
          />
        );
      case 'link_account':
        return (
          <LinkAccountStep
            goalName={goalData?.name ?? ''}
            initialValues={linkAccountResult ?? undefined}
            onNext={handleAccountLinked}
            onBack={canGoBack ? goBack : undefined}
          />
        );
      case 'add_salary':
        return (
          <SalaryStep
            linkedAccountName={linkedAccount?.name}
            initialValues={salaryData ?? undefined}
            onNext={handleSalaryDone}
            onSkip={handleSkipSalary}
            onBack={canGoBack ? goBack : undefined}
          />
        );
      case 'account_type':
        return (
          <CardSelectionStep
            onNext={handleAccountTypeSelected}
            onSkip={handleSkipAccountType}
            onBack={canGoBack ? goBack : undefined}
          />
        );
      case 'credit_card_setup':
        return (
          <CreditCardSetupStep
            initialCards={creditCards ?? undefined}
            onNext={handleCreditCardsDone}
            onSkip={handleSkipCreditCards}
            onBack={canGoBack ? goBack : undefined}
          />
        );
      case 'bank_account_setup':
        return (
          <BankAccountStep
            initialAccounts={extraBankAccounts ?? undefined}
            onNext={handleBankAccountsDone}
            onSkip={handleSkipBankAccounts}
            onBack={canGoBack ? goBack : undefined}
          />
        );
      case 'shortcuts_guide':
        return (
          <ShortcutsGuideStep
            onDone={finish}
            onSkip={finish}
            onBack={canGoBack ? goBack : undefined}
          />
        );
    }
  };

  return (
    <View style={[styles.overlay, { backgroundColor: theme.background }]}>
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        <Animated.View style={[styles.stepContainer, { opacity: fadeAnim }]}>
          {renderStep()}
        </Animated.View>

        <View style={styles.dotsContainer}>
          {Array.from({ length: totalDots }).map((_, i) => (
            <View
              key={i}
              style={[
                styles.dot,
                {
                  backgroundColor: i === currentIndex ? theme.primary : theme.cardBorder,
                  width: i === currentIndex ? 20 : 8,
                },
              ]}
            />
          ))}
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 100,
  },
  safeArea: {
    flex: 1,
  },
  stepContainer: {
    flex: 1,
  },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingTop: Spacing.xl,
    paddingBottom: Platform.OS === 'ios' ? Spacing.lg : Spacing['3xl'],
  },
  dot: {
    height: 6,
    borderRadius: 3,
  },
});
