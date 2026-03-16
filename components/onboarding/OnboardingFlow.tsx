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
import { Spacing } from '@/constants/design';
import { saveUserCards } from '@/utils/storage';
import { saveBankAccounts, completeOnboarding } from '@/utils/onboarding';
import { UserCard, BankAccount } from '@/types';
import { WelcomeStep } from './WelcomeStep';
import { CardSelectionStep, AccountType } from './CardSelectionStep';
import { CreditCardSetupStep } from './CreditCardSetupStep';
import { BankAccountStep } from './BankAccountStep';
import { ShortcutsGuideStep } from './ShortcutsGuideStep';

type Step =
  | 'welcome'
  | 'account_type'
  | 'credit_card_setup'
  | 'bank_account_setup'
  | 'shortcuts_guide';

interface OnboardingFlowProps {
  onComplete: () => void;
}

export function OnboardingFlow({ onComplete }: OnboardingFlowProps) {
  const { theme } = useTheme();
  const [currentStep, setCurrentStep] = useState<Step>('welcome');
  const [firstChoice, setFirstChoice] = useState<AccountType | null>(null);
  const [didCreditCards, setDidCreditCards] = useState(false);
  const [didBankAccounts, setDidBankAccounts] = useState(false);
  const fadeAnim = useRef(new Animated.Value(1)).current;

  const transitionTo = useCallback((nextStep: Step) => {
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
  }, [fadeAnim]);

  const finish = async () => {
    await completeOnboarding();
    onComplete();
  };

  const getNextAfterFirst = (): Step => {
    if (firstChoice === 'credit_card') return 'bank_account_setup';
    return 'credit_card_setup';
  };

  const handleAccountTypeSelected = (type: AccountType) => {
    setFirstChoice(type);
    if (type === 'credit_card') {
      transitionTo('credit_card_setup');
    } else {
      transitionTo('bank_account_setup');
    }
  };

  const handleCreditCardsDone = async (cards: UserCard[]) => {
    if (cards.length > 0) {
      await saveUserCards(cards);
    }
    setDidCreditCards(true);
    if (!didBankAccounts && firstChoice === 'credit_card') {
      transitionTo('bank_account_setup');
    } else {
      transitionTo('shortcuts_guide');
    }
  };

  const handleBankAccountsDone = async (accounts: BankAccount[]) => {
    if (accounts.length > 0) {
      await saveBankAccounts(accounts);
    }
    setDidBankAccounts(true);
    if (!didCreditCards && firstChoice === 'bank_account') {
      transitionTo('credit_card_setup');
    } else {
      transitionTo('shortcuts_guide');
    }
  };

  const handleSkipAccountType = () => {
    transitionTo('shortcuts_guide');
  };

  const handleSkipCreditCards = () => {
    setDidCreditCards(true);
    if (!didBankAccounts && firstChoice === 'credit_card') {
      transitionTo('bank_account_setup');
    } else {
      transitionTo('shortcuts_guide');
    }
  };

  const handleSkipBankAccounts = () => {
    setDidBankAccounts(true);
    if (!didCreditCards && firstChoice === 'bank_account') {
      transitionTo('credit_card_setup');
    } else {
      transitionTo('shortcuts_guide');
    }
  };

  const stepOrder: Step[] = ['welcome', 'account_type'];
  if (firstChoice === 'credit_card') {
    stepOrder.push('credit_card_setup', 'bank_account_setup');
  } else if (firstChoice === 'bank_account') {
    stepOrder.push('bank_account_setup', 'credit_card_setup');
  }
  stepOrder.push('shortcuts_guide');

  const currentIndex = stepOrder.indexOf(currentStep);
  const totalDots = stepOrder.length;

  const renderStep = () => {
    switch (currentStep) {
      case 'welcome':
        return <WelcomeStep onNext={() => transitionTo('account_type')} />;
      case 'account_type':
        return (
          <CardSelectionStep
            onNext={handleAccountTypeSelected}
            onSkip={handleSkipAccountType}
          />
        );
      case 'credit_card_setup':
        return (
          <CreditCardSetupStep
            onNext={handleCreditCardsDone}
            onSkip={handleSkipCreditCards}
          />
        );
      case 'bank_account_setup':
        return (
          <BankAccountStep
            onNext={handleBankAccountsDone}
            onSkip={handleSkipBankAccounts}
          />
        );
      case 'shortcuts_guide':
        return (
          <ShortcutsGuideStep
            onDone={finish}
            onSkip={finish}
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
    paddingBottom: Platform.OS === 'ios' ? Spacing.md : Spacing['2xl'],
  },
  dot: {
    height: 6,
    borderRadius: 3,
  },
});
