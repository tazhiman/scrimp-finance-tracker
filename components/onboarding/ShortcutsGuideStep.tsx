import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
  Platform,
  Alert,
  Image,
} from 'react-native';
import * as Linking from 'expo-linking';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/context/ThemeContext';
import {
  getScrimpWalletShortcutInstallUrl,
  SCRIMP_WALLET_AUTOMATION_SHORTCUT_NAME,
} from '@/config/shortcutsWallet';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface GuideStep {
  title: string;
  description: string;
  mockUI: (theme: any, pulseAnim: Animated.Value) => React.ReactNode;
}

function MockShortcutsIcon({ theme }: { theme: any }) {
  return (
    <View style={[mockStyles.appIconContainer]}>
      <Image
        source={require('@/assets/shortcuts-icon.png')}
        style={mockStyles.appIcon}
        resizeMode="cover"
      />
      <Text style={[mockStyles.appLabel, { color: theme.text }]}>Shortcuts</Text>
    </View>
  );
}

/** Automation tab + empty state + New Automation (matches iOS Shortcuts light UI). */
function MockAutomationHome({ theme, pulseAnim }: { theme: any; pulseAnim: Animated.Value }) {
  const IOS_BLUE = '#007AFF';
  return (
    <View style={[mockStyles.phone, mockStyles.automationPhoneFrame, { borderColor: theme.cardBorder }]}>
      {/* No phoneScreen + flex:1 here — parent has no height, so flex children collapse to ~0 (thin line). */}
      <View style={mockStyles.automationLightRoot}>
        <Text style={mockStyles.automationLargeTitle}>Automation</Text>

        <View style={mockStyles.automationEmptyCenter}>
          <Ionicons name="sparkles" size={44} color="#AEAEB2" />
          <Text style={mockStyles.automationEmptyTitle}>No Automations</Text>
          <Text style={mockStyles.automationEmptySubtitle}>Make shortcuts run automatically.</Text>
          <Animated.View
            style={{
              marginTop: 20,
              transform: [
                { scale: pulseAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 1.05] }) },
              ],
            }}
          >
            <View style={mockStyles.automationNewButton}>
              <Text style={mockStyles.automationNewButtonText}>New Automation</Text>
            </View>
          </Animated.View>
        </View>

        <View style={mockStyles.automationFloatingTabs}>
          <View style={mockStyles.automationTabItem}>
            <Ionicons name="albums-outline" size={22} color="#8E8E93" />
            <Text style={mockStyles.automationTabLabelInactive}>Library</Text>
          </View>
          <View style={mockStyles.automationTabItemActive}>
            <Ionicons name="checkmark-circle" size={22} color={IOS_BLUE} />
            <Text style={[mockStyles.automationTabLabelActive, { color: IOS_BLUE }]}>Automation</Text>
          </View>
          <View style={mockStyles.automationTabItem}>
            <Ionicons name="compass-outline" size={22} color="#8E8E93" />
            <Text style={mockStyles.automationTabLabelInactive}>Gallery</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

type TriggerPickerRow = {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  iconColor: string;
  title: string;
  subtitle: string;
  wallet?: boolean;
};

/** iOS Shortcuts “New Automation” trigger list: grouped white cards on system gray + floating search. */
function MockTriggerList({ theme, pulseAnim }: { theme: any; pulseAnim: Animated.Value }) {
  const groups: TriggerPickerRow[][] = [
    [
      {
        icon: 'airplane',
        iconColor: '#FF9500',
        title: 'Airplane Mode',
        subtitle: 'When Airplane Mode is turned on',
      },
      {
        icon: 'wifi',
        iconColor: '#007AFF',
        title: 'Wi-Fi',
        subtitle: 'When my iPhone joins the Home network',
      },
      {
        icon: 'bluetooth',
        iconColor: '#007AFF',
        title: 'Bluetooth',
        subtitle: 'When my iPhone connects to AirPods',
      },
    ],
    [
      {
        icon: 'open-outline',
        iconColor: '#8E8E93',
        title: 'App',
        subtitle: 'When Weather is opened or closed',
      },
      {
        icon: 'wallet',
        iconColor: '#007AFF',
        title: 'Wallet',
        subtitle: 'When I tap a Wallet Card or Pass',
        wallet: true,
      },
    ],
    [
      {
        icon: 'battery-half-outline',
        iconColor: '#8E8E93',
        title: 'Battery Level',
        subtitle: 'When battery level rises above 50%',
      },
    ],
  ];

  return (
    <View style={[mockStyles.phone, mockStyles.automationPhoneFrame, { borderColor: theme.cardBorder }]}>
      <View style={mockStyles.triggerPickerRoot}>
        <View style={mockStyles.triggerPickerNav}>
          <View style={mockStyles.triggerCloseCircle}>
            <Ionicons name="close" size={20} color="#000000" />
          </View>
        </View>

        {groups.map((rows, gi) => (
          <View key={gi} style={mockStyles.triggerCard}>
            {rows.map((row, ri) => {
              const isLast = ri === rows.length - 1;
              const RowWrapper = row.wallet ? Animated.View : View;
              const rowWrapperProps = row.wallet
                ? {
                    style: [
                      mockStyles.triggerRow,
                      !isLast && mockStyles.triggerRowDivider,
                      mockStyles.triggerRowWallet,
                      {
                        transform: [
                          {
                            scale: pulseAnim.interpolate({
                              inputRange: [0, 1],
                              outputRange: [1, 1.02],
                            }),
                          },
                        ],
                      },
                    ],
                  }
                : {
                    style: [mockStyles.triggerRow, !isLast && mockStyles.triggerRowDivider],
                  };

              return (
                <RowWrapper key={row.title} {...rowWrapperProps}>
                  <View style={mockStyles.triggerIconSlot}>
                    <Ionicons name={row.icon} size={22} color={row.iconColor} />
                  </View>
                  <View style={mockStyles.triggerTextCol}>
                    <Text
                      style={[
                        mockStyles.triggerRowTitle,
                        row.wallet && mockStyles.triggerRowTitleWallet,
                      ]}
                      numberOfLines={1}
                    >
                      {row.title}
                    </Text>
                    <Text style={mockStyles.triggerRowSubtitle} numberOfLines={2}>
                      {row.subtitle}
                    </Text>
                  </View>
                  <Ionicons
                    name="chevron-forward"
                    size={18}
                    color={row.wallet ? '#007AFF' : '#C7C7CC'}
                  />
                </RowWrapper>
              );
            })}
          </View>
        ))}

        <View style={mockStyles.triggerSearchPill}>
          <Ionicons name="search" size={18} color="#8E8E93" />
          <Text style={mockStyles.triggerSearchLabel}>Search</Text>
          <View style={mockStyles.triggerSearchFlexFill} />
          <Ionicons name="mic" size={20} color="#8E8E93" />
        </View>
      </View>
    </View>
  );
}

/** Wallet pass picker + Run Immediately + Notify When Run (iOS Shortcuts light UI). */
function MockCardSelection({ theme, pulseAnim }: { theme: any; pulseAnim: Animated.Value }) {
  const passes = ['Visa ••4532', 'Mastercard ••8821'];
  return (
    <View style={[mockStyles.phone, mockStyles.automationPhoneFrame, { borderColor: theme.cardBorder }]}>
      <View style={mockStyles.walletConfigRoot}>
        <View style={mockStyles.walletConfigNav}>
          <View style={mockStyles.triggerCloseCircle}>
            <Ionicons name="chevron-back" size={22} color="#000000" />
          </View>
          <View style={mockStyles.walletNextPill}>
            <Text style={mockStyles.walletNextPillText}>Next</Text>
          </View>
        </View>

        <Text style={mockStyles.walletSectionCaption}>WHEN I TAP</Text>
        <View style={mockStyles.triggerCard}>
          {passes.map((card, i) => (
            <View
              key={card}
              style={[mockStyles.walletPassRow, i < passes.length - 1 && mockStyles.triggerRowDivider]}
            >
              <Ionicons name="card" size={22} color="#007AFF" />
              <Text style={mockStyles.walletPassTitle}>{card}</Text>
              <Ionicons name="checkmark-circle" size={22} color="#007AFF" />
            </View>
          ))}
        </View>

        <Text style={[mockStyles.walletSectionCaption, mockStyles.walletSectionCaptionSpaced]}>RUN</Text>
        <View style={mockStyles.triggerCard}>
          <View style={[mockStyles.walletRunChoiceRow, mockStyles.triggerRowDivider]}>
            <Text style={mockStyles.walletRunLabel}>Run After Confirmation</Text>
            <View style={mockStyles.walletRadioEmpty} />
          </View>
          <Animated.View
            style={[
              mockStyles.walletRunChoiceRow,
              mockStyles.walletRunChoiceRowSelected,
              {
                transform: [
                  {
                    scale: pulseAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [1, 1.02],
                    }),
                  },
                ],
              },
            ]}
          >
            <Text style={mockStyles.walletRunLabelSelected}>Run Immediately</Text>
            <Ionicons name="checkmark-circle" size={22} color="#007AFF" />
          </Animated.View>
        </View>

        <Text style={[mockStyles.walletSectionCaption, mockStyles.walletSectionCaptionSpaced]}>NOTIFY</Text>
        <View style={[mockStyles.triggerCard, mockStyles.walletNotifyCard]}>
          <View style={mockStyles.walletNotifyRow}>
            <Text style={mockStyles.walletRunLabel}>Notify When Run</Text>
            <View style={mockStyles.notifyToggleTrackOff}>
              <View style={mockStyles.notifyToggleThumb} />
            </View>
          </View>
        </View>
      </View>
    </View>
  );
}

/** Preview of Apple’s Shortcuts “add shortcut” sheet (light iOS style). */
function MockGetShortcut({ theme, pulseAnim }: { theme: any; pulseAnim: Animated.Value }) {
  const IOS_BLUE = '#007AFF';
  return (
    <View style={[mockStyles.phone, { borderColor: theme.cardBorder, width: SCREEN_WIDTH * 0.88, maxWidth: 360 }]}>
      <View style={[mockStyles.phoneScreen, mockStyles.installSheetRoot]}>
        <View style={mockStyles.installSheetNav}>
          <View style={mockStyles.installNavIcon}>
            <Ionicons name="close" size={18} color="#8E8E93" />
          </View>
          <View style={{ width: 28 }} />
          <Ionicons name="share-outline" size={22} color={IOS_BLUE} />
        </View>

        <Text style={mockStyles.installTitle} numberOfLines={2}>
          {SCRIMP_WALLET_AUTOMATION_SHORTCUT_NAME}
        </Text>
        <Text style={mockStyles.installSubtitle}>Shared from iCloud</Text>

        <View style={mockStyles.installShortcutTile}>
          <View style={mockStyles.installTileHeader}>
            <View style={mockStyles.installTileAppIcon}>
              <Ionicons name="wallet" size={20} color={theme.primary} />
            </View>
            <Ionicons name="ellipsis-horizontal" size={18} color="rgba(255,255,255,0.9)" />
          </View>
          <Text style={mockStyles.installTileTitle} numberOfLines={2}>
            {SCRIMP_WALLET_AUTOMATION_SHORTCUT_NAME}
          </Text>
        </View>

        <Text style={mockStyles.installAboutLabel}>ABOUT THIS SHORTCUT</Text>
        <View style={mockStyles.installAboutRow}>
          <Ionicons name="watch-outline" size={20} color="#000" />
          <Text style={mockStyles.installAboutText}>Appears on Apple Watch</Text>
        </View>

        <Animated.View
          style={[
            mockStyles.installFakeCta,
            {
              transform: [
                { scale: pulseAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 1.07] }) },
              ],
              opacity: pulseAnim.interpolate({ inputRange: [0, 1], outputRange: [0.88, 1] }),
            },
          ]}
        >
          <Ionicons name="add-circle" size={22} color="#FFF" />
          <Text style={mockStyles.installFakeCtaText}>Add Shortcut</Text>
        </Animated.View>
        <Text style={mockStyles.installPreviewHint}>You’ll see this after tapping Get shortcut</Text>
      </View>
    </View>
  );
}

/** Compact QWERTY strip (visual only) under the floating search bar. */
function MockRunShortcutKeyboard() {
  const r1 = 'QWERTYUIOP'.split('');
  const r2 = 'ASDFGHJKL'.split('');
  const r3 = 'ZXCVBNM'.split('');
  return (
    <View style={mockStyles.kbRoot}>
      <View style={mockStyles.kbRow}>
        {r1.map((k) => (
          <View key={k} style={mockStyles.kbKey}>
            <Text style={mockStyles.kbKeyText}>{k}</Text>
          </View>
        ))}
      </View>
      <View style={[mockStyles.kbRow, mockStyles.kbRowPad]}>
        {r2.map((k) => (
          <View key={k} style={mockStyles.kbKey}>
            <Text style={mockStyles.kbKeyText}>{k}</Text>
          </View>
        ))}
      </View>
      <View style={mockStyles.kbRow}>
        <View style={mockStyles.kbKeyUtility}>
          <Ionicons name="arrow-up" size={11} color="#000000" />
        </View>
        {r3.map((k) => (
          <View key={k} style={mockStyles.kbKey}>
            <Text style={mockStyles.kbKeyText}>{k}</Text>
          </View>
        ))}
        <View style={mockStyles.kbKeyUtility}>
          <Ionicons name="backspace-outline" size={13} color="#000000" />
        </View>
      </View>
      <View style={[mockStyles.kbRow, mockStyles.kbRowLast]}>
        <View style={mockStyles.kbKey123}>
          <Text style={mockStyles.kbKeyTextSmall}>123</Text>
        </View>
        <View style={mockStyles.kbKeySpace}>
          <Text style={mockStyles.kbKeyTextSmall}>space</Text>
        </View>
        <View style={mockStyles.kbKeyGo}>
          <Ionicons name="search" size={14} color="#FFFFFF" />
        </View>
      </View>
    </View>
  );
}

/** Add Action: type shortcut name in search, then tap the blue tile (iOS light UI). */
function MockRunShortcut({ theme, pulseAnim }: { theme: any; pulseAnim: Animated.Value }) {
  const shortcutName = SCRIMP_WALLET_AUTOMATION_SHORTCUT_NAME;
  return (
    <View style={[mockStyles.phone, mockStyles.automationPhoneFrame, { borderColor: theme.cardBorder }]}>
      <View style={mockStyles.actionPickerRoot}>
        <View style={mockStyles.actionPickerNavRow}>
          <View style={mockStyles.triggerCloseCircle}>
            <Ionicons name="chevron-back" size={22} color="#000000" />
          </View>
        </View>
        <Text style={mockStyles.actionPickerTitle} numberOfLines={2}>
          When I tap any of 2 Wallet passes or paym…
        </Text>

        <View style={mockStyles.actionSectionHeader}>
          <View style={mockStyles.shortcutsPurpleBadge}>
            <Ionicons name="grid" size={12} color="#FFFFFF" />
          </View>
          <Text style={mockStyles.actionSectionTitle}>My Shortcuts</Text>
          <Ionicons name="chevron-forward" size={16} color="#C7C7CC" />
        </View>

        <Animated.View
          style={[
            mockStyles.actionShortcutBlueCard,
            {
              transform: [
                {
                  scale: pulseAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [1, 1.03],
                  }),
                },
              ],
            },
          ]}
        >
          <View style={mockStyles.actionScrimpMiniIcon}>
            <View style={mockStyles.actionScrimpMiniInner}>
              <View style={[mockStyles.actionScrimpLogoDot, { backgroundColor: theme.primary }]} />
            </View>
          </View>
          <Text style={mockStyles.actionShortcutBlueTitle} numberOfLines={2}>
            {shortcutName}
          </Text>
        </Animated.View>

        <View style={[mockStyles.triggerSearchPill, mockStyles.actionPickerBottomSearch]}>
          <Ionicons name="search" size={18} color="#8E8E93" />
          <Text
            style={mockStyles.actionBottomSearchQuery}
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            {shortcutName}
          </Text>
          <View style={mockStyles.triggerSearchFlexFill} />
          <Ionicons name="mic" size={20} color="#8E8E93" />
        </View>

        <MockRunShortcutKeyboard />
      </View>
    </View>
  );
}

/** Final sheet: tap Done (Run / Notify already set on the Wallet screen). */
function MockSaveAutomation({ theme, pulseAnim }: { theme: any; pulseAnim: Animated.Value }) {
  return (
    <View style={[mockStyles.phone, mockStyles.automationPhoneFrame, { borderColor: theme.cardBorder }]}>
      <View style={mockStyles.saveAutomationRoot}>
        <View style={mockStyles.saveAutomationNav}>
          <Text style={mockStyles.saveAutomationNavSide}>Cancel</Text>
          <Text style={mockStyles.saveAutomationNavTitle}>New Automation</Text>
          <Animated.View
            style={[
              mockStyles.saveAutomationNavSideRight,
              {
                transform: [
                  { scale: pulseAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 1.08] }) },
                ],
              },
            ]}
          >
            <Text style={mockStyles.saveAutomationDone}>Done</Text>
          </Animated.View>
        </View>
        <View style={mockStyles.saveAutomationHintCard}>
          <Ionicons name="checkmark-circle" size={22} color="#34C759" />
          <Text style={mockStyles.saveAutomationHintText}>
            Wallet trigger and Run Shortcut are set. Tap Done to save.
          </Text>
        </View>
      </View>
    </View>
  );
}


const STEPS: GuideStep[] = [
  {
    title: 'Add the Scrimp shortcut',
    description: 'Tap the get shortcut button below to add it to your device.',
    mockUI: (theme, pulse) => <MockGetShortcut theme={theme} pulseAnim={pulse} />,
  },
  {
    title: 'Open the Shortcuts App',
    description: 'Find the Shortcuts app on your iPhone. It comes pre-installed with iOS.',
    mockUI: (theme) => <MockShortcutsIcon theme={theme} />,
  },
  {
    title: 'Open Automation',
    description:
      'Tap the Automation tab in the bottom bar (next to Library), then tap the blue New Automation button.',
    mockUI: (theme, pulse) => <MockAutomationHome theme={theme} pulseAnim={pulse} />,
  },
  {
    title: 'Choose "Wallet" Trigger',
    description: 'Scroll down and select Wallet as your trigger. This fires when you tap to pay.',
    mockUI: (theme, pulse) => <MockTriggerList theme={theme} pulseAnim={pulse} />,
  },
  {
    title: 'Select Your Wallet Cards',
    description:
      'Choose which cards or passes should trigger the automation, select Run Immediately (not Run After Confirmation), and turn Notify When Run off so logging stays silent.',
    mockUI: (theme, pulse) => <MockCardSelection theme={theme} pulseAnim={pulse} />,
  },
  {
    title: 'Add "Run Shortcut"',
    description: `Search ${SCRIMP_WALLET_AUTOMATION_SHORTCUT_NAME} and tap on the shortcut.`,
    mockUI: (theme, pulse) => <MockRunShortcut theme={theme} pulseAnim={pulse} />,
  },
  {
    title: 'Save Automation',
    description: 'Tap Done in Shortcuts to save. Your automation runs when you pay with Wallet.',
    mockUI: (theme, pulse) => <MockSaveAutomation theme={theme} pulseAnim={pulse} />,
  },
];

interface ShortcutsGuideStepProps {
  onDone: () => void;
  onSkip?: () => void;
  onBack?: () => void;
  standalone?: boolean;
}

export function ShortcutsGuideStep({ onDone, onSkip, onBack, standalone = false }: ShortcutsGuideStepProps) {
  const { theme, themeMode } = useTheme();
  const [currentStep, setCurrentStep] = useState(0);
  const slideAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const pulseAnim = useRef(new Animated.Value(0)).current;

  const buttonTextColor = themeMode === 'dark' ? '#000505' : '#FEFCFD';
  const isLast = currentStep === STEPS.length - 1;

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 0, duration: 800, useNativeDriver: true }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, []);

  const animateTransition = (next: number) => {
    const direction = next > currentStep ? 1 : -1;
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 0, duration: 120, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: -direction * 30, duration: 120, useNativeDriver: true }),
    ]).start(() => {
      setCurrentStep(next);
      slideAnim.setValue(direction * 30);
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
        Animated.timing(slideAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
      ]).start();
    });
  };

  const handleOpenShortcuts = () => {
    Linking.openURL('shortcuts://').catch(() => {
      Alert.alert('Cannot Open', 'Shortcuts app could not be opened. Make sure it is installed.');
    });
  };

  const handleGetShortcut = async () => {
    const url = getScrimpWalletShortcutInstallUrl();
    const target = url ?? 'shortcuts://';
    try {
      const supported = await Linking.canOpenURL(target);
      if (supported) {
        await Linking.openURL(target);
      } else {
        await Linking.openURL('shortcuts://');
      }
    } catch {
      Alert.alert(
        'Could not open link',
        url
          ? 'Try copying the shortcut link from scrimp.app or our support page.'
          : 'Set EXPO_PUBLIC_SCRIMP_WALLET_SHORTCUT_URL for a one-tap install, or open Shortcuts and add the shortcut manually. See docs/shortcuts-wallet.md.'
      );
    }
  };

  const step = STEPS[currentStep];

  return (
    <View style={[styles.container, { width: standalone ? undefined : SCREEN_WIDTH }]}>
      <View style={styles.header}>
        {onBack && currentStep === 0 && !standalone ? (
          <TouchableOpacity onPress={onBack} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
            <Ionicons name="arrow-back" size={24} color={theme.text} />
          </TouchableOpacity>
        ) : (
          <View style={{ width: 24 }} />
        )}
        {(onSkip || standalone) && (
          <TouchableOpacity
            onPress={onSkip || onDone}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <Text style={[styles.skipText, { color: theme.textSecondary }]}>
              {standalone ? 'Close' : "I'll set this up later"}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.stepHeader}>
        <View style={styles.progressDots}>
          {STEPS.map((_, i) => (
            <View
              key={i}
              style={[
                styles.progressDot,
                {
                  backgroundColor: i <= currentStep ? theme.primary : theme.cardBorder,
                  width: i === currentStep ? 20 : 8,
                },
              ]}
            />
          ))}
        </View>
      </View>

      <Animated.View style={[
        styles.stepContent,
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        },
      ]}>
        <Text style={[styles.stepTitle, { color: theme.text }]}>{step.title}</Text>
        <Text
          style={[
            styles.stepDescription,
            { color: theme.textSecondary },
            currentStep === 0 && styles.stepDescriptionTightBottom,
          ]}
        >
          {step.description}
        </Text>

        {Platform.OS === 'ios' && currentStep === 0 && (
          <TouchableOpacity
            style={styles.getShortcutPrimary}
            onPress={handleGetShortcut}
            activeOpacity={0.85}
          >
            <Ionicons name="add-circle-outline" size={22} color="#FFFFFF" />
            <Text style={styles.getShortcutPrimaryText}>Get shortcut</Text>
          </TouchableOpacity>
        )}

        <View style={[styles.mockContainer, currentStep === 0 && styles.mockContainerAfterCta]}>
          {step.mockUI(theme, pulseAnim)}
        </View>
      </Animated.View>

      <View style={styles.actions}>
        <View style={styles.utilButtons}>
          {Platform.OS === 'ios' && currentStep > 0 && (
            <TouchableOpacity
              style={[styles.utilButton, { backgroundColor: theme.cardBackground, borderColor: theme.cardBorder }]}
              onPress={handleOpenShortcuts}
              activeOpacity={0.7}
            >
              <Ionicons name="open-outline" size={16} color={theme.primary} />
              <Text style={[styles.utilButtonText, { color: theme.primary }]}>Open Shortcuts</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.navButtons}>
          {currentStep > 0 && (
            <TouchableOpacity
              style={[styles.navButton, { backgroundColor: theme.cardBackground, borderColor: theme.cardBorder }]}
              onPress={() => animateTransition(currentStep - 1)}
              activeOpacity={0.7}
            >
              <Ionicons name="arrow-back" size={20} color={theme.text} />
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={[styles.nextButton, { backgroundColor: theme.primary, flex: 1 }]}
            onPress={() => isLast ? onDone() : animateTransition(currentStep + 1)}
            activeOpacity={0.8}
          >
            <Text style={[styles.nextButtonText, { color: buttonTextColor }]}>
              {isLast ? 'Done' : 'Next'}
            </Text>
            {!isLast && <Ionicons name="arrow-forward" size={18} color={buttonTextColor} />}
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingBottom: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 16,
  },
  skipText: {
    fontSize: 15,
    fontWeight: '600',
  },
  stepHeader: {
    alignItems: 'center',
    paddingTop: 12,
    paddingBottom: 8,
  },
  progressDots: {
    flexDirection: 'row',
    gap: 6,
    alignItems: 'center',
  },
  progressDot: {
    height: 8,
    borderRadius: 4,
  },
  stepContent: {
    flex: 1,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  stepTitle: {
    fontSize: 22,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 8,
    marginTop: 8,
  },
  stepDescription: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 20,
    paddingHorizontal: 8,
  },
  stepDescriptionTightBottom: {
    marginBottom: 14,
  },
  getShortcutPrimary: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: '#007AFF',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 14,
    marginBottom: 18,
  },
  getShortcutPrimaryText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
  },
  mockContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  mockContainerAfterCta: {
    marginTop: 4,
  },
  actions: {
    paddingHorizontal: 24,
    gap: 12,
  },
  utilButtons: {
    flexDirection: 'row',
    gap: 10,
    justifyContent: 'center',
  },
  utilButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
    borderWidth: 1,
  },
  utilButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  navButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  navButton: {
    width: 48,
    height: 48,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    borderRadius: 14,
  },
  nextButtonText: {
    fontSize: 17,
    fontWeight: '700',
  },
});

const mockStyles = StyleSheet.create({
  appIconContainer: {
    alignItems: 'center',
    gap: 8,
  },
  appIcon: {
    width: 80,
    height: 80,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shortcutsIconInner: {
    width: 40,
    height: 40,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shortcutsSquare: {
    width: 16,
    height: 16,
    borderRadius: 3,
  },
  appLabel: {
    fontSize: 13,
    fontWeight: '600',
  },
  phone: {
    width: SCREEN_WIDTH * 0.65,
    borderRadius: 20,
    borderWidth: 1,
    overflow: 'hidden',
  },
  phoneScreen: {
    paddingVertical: 16,
    minHeight: 220,
  },
  phoneTitle: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 12,
  },
  phoneContent: {
    flex: 1,
    paddingHorizontal: 12,
    gap: 8,
    justifyContent: 'center',
  },
  placeholderRow: {
    height: 36,
    borderRadius: 8,
  },
  tabBar: {
    flexDirection: 'row',
    borderTopWidth: 0.5,
    paddingTop: 8,
    paddingHorizontal: 8,
    marginTop: 12,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: '600',
  },
  navBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  navTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  plusCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    color: '#8E8E93',
    textAlign: 'center',
    fontSize: 14,
    marginTop: 24,
  },
  listRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 11,
    paddingHorizontal: 14,
    borderBottomWidth: 0.5,
    borderBottomColor: '#2C2C2E',
  },
  listText: {
    fontSize: 14,
    fontWeight: '500',
  },
  listSubtext: {
    fontSize: 11,
    color: '#8E8E93',
    marginTop: 1,
  },
  helperText: {
    color: '#8E8E93',
    fontSize: 12,
    paddingHorizontal: 14,
    marginBottom: 4,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 12,
    marginBottom: 12,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 8,
  },
  appIconSmall: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toggleTrack: {
    width: 44,
    height: 26,
    borderRadius: 13,
    justifyContent: 'center',
    alignItems: 'flex-end',
    paddingHorizontal: 2,
  },
  toggleThumb: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#FFF',
  },
  doneButton: {
    marginHorizontal: 12,
    marginBottom: 12,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  installSheetRoot: {
    backgroundColor: '#F2F2F7',
    minHeight: 380,
    paddingBottom: 12,
  },
  installSheetNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    paddingBottom: 8,
  },
  installNavIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#E5E5EA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  installTitle: {
    color: '#000000',
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
    paddingHorizontal: 12,
    marginBottom: 6,
  },
  installSubtitle: {
    color: '#8E8E93',
    fontSize: 13,
    textAlign: 'center',
    marginBottom: 16,
  },
  installShortcutTile: {
    backgroundColor: '#007AFF',
    borderRadius: 22,
    marginHorizontal: 16,
    padding: 14,
    minHeight: 100,
    justifyContent: 'space-between',
  },
  installTileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  installTileAppIcon: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#000000',
    alignItems: 'center',
    justifyContent: 'center',
  },
  installTileTitle: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
    marginTop: 12,
    textAlign: 'center',
  },
  installAboutLabel: {
    color: '#8E8E93',
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.3,
    marginTop: 22,
    marginBottom: 8,
    paddingHorizontal: 20,
  },
  installAboutRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  installAboutText: {
    color: '#000000',
    fontSize: 16,
  },
  installFakeCta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#007AFF',
    marginHorizontal: 16,
    marginTop: 12,
    paddingVertical: 14,
    borderRadius: 14,
  },
  installFakeCtaText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '600',
  },
  installPreviewHint: {
    color: '#8E8E93',
    fontSize: 11,
    textAlign: 'center',
    marginTop: 10,
    paddingHorizontal: 16,
    fontStyle: 'italic',
  },
  automationPhoneFrame: {
    width: SCREEN_WIDTH * 0.88,
    maxWidth: 360,
  },
  automationLightRoot: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    minHeight: 460,
    paddingTop: 8,
    paddingBottom: 14,
    justifyContent: 'space-between',
  },
  automationLargeTitle: {
    color: '#000000',
    fontSize: 32,
    fontWeight: '800',
    paddingHorizontal: 16,
    paddingTop: 10,
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  automationEmptyCenter: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  automationEmptyTitle: {
    color: '#000000',
    fontSize: 20,
    fontWeight: '700',
    marginTop: 14,
  },
  automationEmptySubtitle: {
    color: '#8E8E93',
    fontSize: 15,
    marginTop: 6,
    textAlign: 'center',
    maxWidth: 260,
    lineHeight: 20,
  },
  automationNewButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    paddingHorizontal: 28,
    borderRadius: 999,
  },
  automationNewButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '600',
  },
  automationFloatingTabs: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 12,
    marginTop: 4,
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 28,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 6,
  },
  automationTabItem: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
  },
  automationTabItemActive: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
    paddingVertical: 8,
    paddingHorizontal: 4,
    backgroundColor: '#E5E5EA',
    borderRadius: 18,
    marginHorizontal: 2,
  },
  automationTabLabelInactive: {
    fontSize: 10,
    color: '#8E8E93',
    fontWeight: '600',
  },
  automationTabLabelActive: {
    fontSize: 10,
    fontWeight: '600',
  },
  triggerPickerRoot: {
    width: '100%',
    minHeight: 500,
    backgroundColor: '#F2F2F7',
    paddingTop: 4,
    paddingBottom: 12,
  },
  triggerPickerNav: {
    paddingHorizontal: 12,
    paddingBottom: 6,
  },
  triggerCloseCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
  },
  triggerCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginHorizontal: 10,
    marginBottom: 9,
    overflow: 'hidden',
  },
  triggerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  triggerRowDivider: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#C6C6C8',
  },
  triggerRowWallet: {
    backgroundColor: 'rgba(0, 122, 255, 0.12)',
  },
  triggerIconSlot: {
    width: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  triggerTextCol: {
    flex: 1,
    marginLeft: 8,
    minWidth: 0,
  },
  triggerRowTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#000000',
  },
  triggerRowTitleWallet: {
    color: '#007AFF',
  },
  triggerRowSubtitle: {
    fontSize: 12,
    color: '#8E8E93',
    marginTop: 3,
    lineHeight: 16,
  },
  triggerSearchPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 14,
    marginTop: 2,
    paddingVertical: 11,
    paddingHorizontal: 14,
    borderRadius: 24,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  triggerSearchLabel: {
    fontSize: 16,
    color: '#8E8E93',
    marginLeft: 8,
    fontWeight: '400',
  },
  triggerSearchFlexFill: {
    flex: 1,
  },
  walletConfigRoot: {
    width: '100%',
    backgroundColor: '#F2F2F7',
    paddingTop: 4,
    paddingBottom: 0,
  },
  walletConfigNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
    paddingBottom: 6,
  },
  walletNextPill: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 22,
    paddingVertical: 8,
    borderRadius: 20,
  },
  walletNextPillText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  walletSectionCaption: {
    fontSize: 11,
    fontWeight: '600',
    color: '#8E8E93',
    letterSpacing: 0.6,
    marginLeft: 20,
    marginBottom: 6,
  },
  walletSectionCaptionSpaced: {
    marginTop: 12,
  },
  walletNotifyCard: {
    marginBottom: 0,
  },
  walletPassRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
    gap: 12,
  },
  walletPassTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
  },
  walletRunChoiceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 14,
  },
  walletRunChoiceRowSelected: {
    backgroundColor: 'rgba(0, 122, 255, 0.10)',
  },
  walletRunLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000000',
  },
  walletRunLabelSelected: {
    fontSize: 16,
    fontWeight: '600',
    color: '#007AFF',
  },
  walletRadioEmpty: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#C7C7CC',
  },
  walletNotifyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  notifyToggleTrackOff: {
    width: 51,
    height: 31,
    borderRadius: 16,
    backgroundColor: '#E9E9EA',
    padding: 2,
    justifyContent: 'center',
  },
  notifyToggleThumb: {
    width: 27,
    height: 27,
    borderRadius: 13.5,
    backgroundColor: '#FFFFFF',
    alignSelf: 'flex-start',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  actionPickerRoot: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    paddingTop: 4,
    paddingBottom: 0,
  },
  actionPickerNavRow: {
    paddingHorizontal: 10,
    paddingBottom: 4,
  },
  actionPickerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#000000',
    paddingHorizontal: 16,
    marginBottom: 12,
    lineHeight: 26,
    letterSpacing: -0.3,
  },
  actionBottomSearchQuery: {
    flex: 1,
    marginLeft: 8,
    marginRight: 4,
    minWidth: 0,
    fontSize: 13,
    fontWeight: '500',
    color: '#000000',
  },
  actionSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginTop: 8,
    marginBottom: 10,
    gap: 8,
  },
  shortcutsPurpleBadge: {
    width: 26,
    height: 26,
    borderRadius: 6,
    backgroundColor: '#5856D6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionSectionTitle: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: '#000000',
  },
  actionShortcutBlueCard: {
    backgroundColor: '#007AFF',
    marginHorizontal: 14,
    borderRadius: 18,
    padding: 14,
    minHeight: 96,
  },
  actionScrimpMiniIcon: {
    alignSelf: 'flex-start',
    marginBottom: 10,
  },
  actionScrimpMiniInner: {
    width: 30,
    height: 30,
    borderRadius: 7,
    backgroundColor: '#000000',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionScrimpLogoDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
  },
  actionShortcutBlueTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    lineHeight: 21,
  },
  actionPickerBottomSearch: {
    marginTop: 10,
    marginBottom: 0,
  },
  kbRoot: {
    backgroundColor: '#D2D4DA',
    paddingTop: 6,
    paddingBottom: 0,
    paddingHorizontal: 4,
    marginTop: 6,
    marginBottom: 0,
    marginHorizontal: 0,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#AEB0B6',
    borderBottomLeftRadius: 18,
    borderBottomRightRadius: 18,
  },
  kbRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 5,
    paddingHorizontal: 2,
  },
  kbRowLast: {
    marginBottom: 0,
  },
  kbRowPad: {
    paddingHorizontal: 14,
  },
  kbKey: {
    flex: 1,
    marginHorizontal: 2,
    paddingVertical: 5,
    minHeight: 28,
    borderRadius: 4,
    backgroundColor: '#FCFCFE',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.12,
    shadowRadius: 0,
    elevation: 1,
  },
  kbKeyText: {
    fontSize: 9,
    fontWeight: '600',
    color: '#000000',
  },
  kbKeyTextSmall: {
    fontSize: 8,
    fontWeight: '500',
    color: '#000000',
  },
  kbKeyUtility: {
    flex: 1.15,
    marginHorizontal: 2,
    paddingVertical: 5,
    minHeight: 28,
    borderRadius: 4,
    backgroundColor: '#ACB0B9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  kbKey123: {
    flex: 1.35,
    marginHorizontal: 2,
    paddingVertical: 5,
    minHeight: 28,
    borderRadius: 4,
    backgroundColor: '#ACB0B9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  kbKeySpace: {
    flex: 4,
    marginHorizontal: 2,
    paddingVertical: 5,
    minHeight: 28,
    borderRadius: 4,
    backgroundColor: '#FCFCFE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  kbKeyGo: {
    flex: 1.5,
    marginHorizontal: 2,
    paddingVertical: 5,
    minHeight: 28,
    borderRadius: 4,
    backgroundColor: '#007AFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveAutomationRoot: {
    width: '100%',
    minHeight: 260,
    backgroundColor: '#F2F2F7',
    paddingTop: 8,
    paddingBottom: 16,
  },
  saveAutomationNav: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 14,
    backgroundColor: '#FFFFFF',
    marginHorizontal: 10,
    borderRadius: 12,
  },
  saveAutomationNavSide: {
    width: 64,
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '400',
  },
  saveAutomationNavSideRight: {
    width: 64,
    alignItems: 'flex-end',
  },
  saveAutomationNavTitle: {
    flex: 1,
    fontSize: 17,
    fontWeight: '700',
    color: '#000000',
    textAlign: 'center',
  },
  saveAutomationDone: {
    fontSize: 17,
    fontWeight: '700',
    color: '#007AFF',
  },
  saveAutomationHintCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    backgroundColor: '#FFFFFF',
    marginHorizontal: 10,
    marginTop: 12,
    padding: 16,
    borderRadius: 12,
  },
  saveAutomationHintText: {
    flex: 1,
    fontSize: 14,
    color: '#3C3C43',
    lineHeight: 20,
    fontWeight: '500',
  },
});
