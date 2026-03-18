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

function MockTabBar({ theme, pulseAnim, activeTab }: { theme: any; pulseAnim: Animated.Value; activeTab: number }) {
  const tabs = ['Shortcuts', 'Automation', 'Gallery'];
  return (
    <View style={[mockStyles.phone, { borderColor: theme.cardBorder }]}>
      <View style={[mockStyles.phoneScreen, { backgroundColor: '#1C1C1E' }]}>
        <Text style={mockStyles.phoneTitle}>Shortcuts</Text>
        <View style={mockStyles.phoneContent}>
          <View style={[mockStyles.placeholderRow, { backgroundColor: '#2C2C2E' }]} />
          <View style={[mockStyles.placeholderRow, { backgroundColor: '#2C2C2E' }]} />
        </View>
        <View style={[mockStyles.tabBar, { borderTopColor: '#3A3A3C' }]}>
          {tabs.map((tab, i) => (
            <Animated.View
              key={tab}
              style={[
                mockStyles.tab,
                i === activeTab && {
                  transform: [{ scale: pulseAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 1.08] }) }],
                },
              ]}
            >
              <Ionicons
                name={i === 0 ? 'apps' : i === 1 ? 'flash' : 'compass'}
                size={20}
                color={i === activeTab ? '#007AFF' : '#8E8E93'}
              />
              <Text style={[mockStyles.tabLabel, { color: i === activeTab ? '#007AFF' : '#8E8E93' }]}>
                {tab}
              </Text>
            </Animated.View>
          ))}
        </View>
      </View>
    </View>
  );
}

function MockPlusButton({ theme, pulseAnim }: { theme: any; pulseAnim: Animated.Value }) {
  return (
    <View style={[mockStyles.phone, { borderColor: theme.cardBorder }]}>
      <View style={[mockStyles.phoneScreen, { backgroundColor: '#1C1C1E' }]}>
        <View style={mockStyles.navBar}>
          <Text style={[mockStyles.navTitle, { color: '#FFF' }]}>Automation</Text>
          <Animated.View style={{
            transform: [{ scale: pulseAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 1.15] }) }],
          }}>
            <View style={[mockStyles.plusCircle, { backgroundColor: '#007AFF' }]}>
              <Ionicons name="add" size={22} color="#FFF" />
            </View>
          </Animated.View>
        </View>
        <View style={mockStyles.phoneContent}>
          <Text style={mockStyles.emptyText}>No Automations Yet</Text>
        </View>
      </View>
    </View>
  );
}

function MockTriggerList({ theme, pulseAnim }: { theme: any; pulseAnim: Animated.Value }) {
  const items = ['Arrive', 'Leave', 'Time of Day', 'Wallet', 'Wi-Fi'];
  return (
    <View style={[mockStyles.phone, { borderColor: theme.cardBorder }]}>
      <View style={[mockStyles.phoneScreen, { backgroundColor: '#1C1C1E' }]}>
        <Text style={[mockStyles.phoneTitle, { fontSize: 15 }]}>New Automation</Text>
        {items.map((item, i) => (
          <Animated.View
            key={item}
            style={[
              mockStyles.listRow,
              { borderBottomColor: '#2C2C2E' },
              item === 'Wallet' && {
                backgroundColor: '#007AFF20',
                borderRadius: 8,
                transform: [{ scale: pulseAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 1.03] }) }],
              },
            ]}
          >
            <Ionicons
              name={i === 0 ? 'location' : i === 1 ? 'exit' : i === 2 ? 'time' : i === 3 ? 'wallet' : 'wifi'}
              size={18}
              color={item === 'Wallet' ? '#007AFF' : '#8E8E93'}
            />
            <Text style={[
              mockStyles.listText,
              { color: item === 'Wallet' ? '#007AFF' : '#FFF' },
              item === 'Wallet' && { fontWeight: '700' },
            ]}>
              {item}
            </Text>
            {item === 'Wallet' && (
              <Ionicons name="chevron-forward" size={16} color="#007AFF" style={{ marginLeft: 'auto' }} />
            )}
          </Animated.View>
        ))}
      </View>
    </View>
  );
}

function MockCardSelection({ theme, pulseAnim }: { theme: any; pulseAnim: Animated.Value }) {
  return (
    <View style={[mockStyles.phone, { borderColor: theme.cardBorder }]}>
      <View style={[mockStyles.phoneScreen, { backgroundColor: '#1C1C1E' }]}>
        <Text style={[mockStyles.phoneTitle, { fontSize: 15 }]}>Select Cards</Text>
        <Text style={[mockStyles.helperText]}>When I tap any of these:</Text>
        {['Visa ••4532', 'Mastercard ••8821'].map((card) => (
          <Animated.View
            key={card}
            style={[
              mockStyles.listRow,
              { borderBottomColor: '#2C2C2E' },
              {
                transform: [{ scale: pulseAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 1.02] }) }],
              },
            ]}
          >
            <Ionicons name="card" size={18} color="#007AFF" />
            <Text style={[mockStyles.listText, { color: '#FFF' }]}>{card}</Text>
            <Ionicons name="checkmark-circle" size={18} color="#30D158" style={{ marginLeft: 'auto' }} />
          </Animated.View>
        ))}
      </View>
    </View>
  );
}

function MockSearchScrimp({ theme, pulseAnim }: { theme: any; pulseAnim: Animated.Value }) {
  return (
    <View style={[mockStyles.phone, { borderColor: theme.cardBorder }]}>
      <View style={[mockStyles.phoneScreen, { backgroundColor: '#1C1C1E' }]}>
        <Text style={[mockStyles.phoneTitle, { fontSize: 14 }]}>New Automation</Text>
        <View style={{ paddingHorizontal: 12, marginBottom: 10 }}>
          <View style={[mockStyles.searchBar, { backgroundColor: '#2C2C2E', marginHorizontal: 0 }]}>
            <Ionicons name="search" size={16} color="#8E8E93" />
            <Text style={{ color: '#FFF', fontSize: 14, marginLeft: 6 }}>Scrimp</Text>
          </View>
        </View>
        <Text style={{ color: '#8E8E93', fontSize: 11, paddingHorizontal: 14, marginBottom: 6 }}>Actions</Text>
        <Animated.View style={[
          mockStyles.listRow,
          {
            backgroundColor: '#007AFF15',
            borderRadius: 8,
            marginHorizontal: 6,
            transform: [{ scale: pulseAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 1.03] }) }],
          },
        ]}>
          <View style={[mockStyles.appIconSmall, { backgroundColor: theme.primary + '30' }]}>
            <Ionicons name="wallet" size={16} color={theme.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[mockStyles.listText, { color: '#FFF', fontWeight: '600' }]}>Log Transaction</Text>
            <Text style={[mockStyles.listSubtext]}>Scrimp</Text>
          </View>
          <Ionicons name="add-circle" size={22} color="#007AFF" />
        </Animated.View>
      </View>
    </View>
  );
}

function MockConfigureParams({ theme, pulseAnim }: { theme: any; pulseAnim: Animated.Value }) {
  return (
    <View style={{ alignItems: 'center', width: '100%', gap: 12 }}>
      <View style={[mockStyles.phone, { borderColor: theme.cardBorder, width: SCREEN_WIDTH * 0.78 }]}>
        <View style={{ backgroundColor: '#1C1C1E', paddingVertical: 12, paddingHorizontal: 14 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 }}>
            <Ionicons name="flash" size={14} color="#FFCC00" />
            <Text style={{ color: '#8E8E93', fontSize: 11 }}>Receive transaction as input</Text>
          </View>

          <View style={{ backgroundColor: '#2C2C2E', borderRadius: 12, padding: 14 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 }}>
              <View style={[mockStyles.appIconSmall, { backgroundColor: theme.primary + '30', width: 24, height: 24, borderRadius: 6 }]}>
                <Ionicons name="wallet" size={12} color={theme.primary} />
              </View>
              <Text style={{ color: '#FFF', fontSize: 13, fontWeight: '600' }}>Import</Text>
              <Animated.View style={[
                { backgroundColor: '#007AFF', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 5, flexDirection: 'row', alignItems: 'center', gap: 3 },
                { transform: [{ scale: pulseAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 1.06] }) }] },
              ]}>
                <Ionicons name="pricetag" size={10} color="#FFF" />
                <Text style={{ color: '#FFF', fontSize: 12, fontWeight: '700' }}>Amount</Text>
              </Animated.View>
              <Text style={{ color: '#FFF', fontSize: 13 }}>from</Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginLeft: 30 }}>
              <Animated.View style={[
                { backgroundColor: '#007AFF', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 5, flexDirection: 'row', alignItems: 'center', gap: 3 },
                { transform: [{ scale: pulseAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 1.06] }) }] },
              ]}>
                <Ionicons name="pricetag" size={10} color="#FFF" />
                <Text style={{ color: '#FFF', fontSize: 12, fontWeight: '700' }}>Merchant</Text>
              </Animated.View>
              <Ionicons name="chevron-forward-circle" size={16} color="#8E8E93" />
            </View>
          </View>
        </View>
      </View>

      <View style={{ backgroundColor: '#2C2C2E20', borderRadius: 12, padding: 14, width: SCREEN_WIDTH * 0.78 }}>
        <Text style={{ color: theme.textSecondary, fontSize: 12, lineHeight: 18, textAlign: 'center' }}>
          Tap each blue field to choose the matching variable from the Shortcut Input list.{'\n\n'}
          <Text style={{ fontWeight: '700', color: theme.text }}>Amount</Text> field  {'->'}  select <Text style={{ fontWeight: '700', color: '#007AFF' }}>Amount</Text>{'\n'}
          <Text style={{ fontWeight: '700', color: theme.text }}>Merchant</Text> field  {'->'}  select <Text style={{ fontWeight: '700', color: '#007AFF' }}>Merchant</Text>
        </Text>
      </View>
    </View>
  );
}

function MockSaveAutomation({ theme, pulseAnim }: { theme: any; pulseAnim: Animated.Value }) {
  return (
    <View style={[mockStyles.phone, { borderColor: theme.cardBorder }]}>
      <View style={[mockStyles.phoneScreen, { backgroundColor: '#1C1C1E' }]}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 14, marginBottom: 16 }}>
          <Text style={{ color: '#007AFF', fontSize: 14 }}>Cancel</Text>
          <Text style={{ color: '#FFF', fontSize: 16, fontWeight: '700' }}>New Automation</Text>
          <Animated.View style={{
            transform: [{ scale: pulseAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 1.1] }) }],
          }}>
            <Text style={{ color: '#007AFF', fontSize: 14, fontWeight: '700' }}>Done</Text>
          </Animated.View>
        </View>

        <Animated.View style={[
          mockStyles.listRow,
          {
            justifyContent: 'space-between',
            transform: [{ scale: pulseAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 1.03] }) }],
          },
        ]}>
          <Text style={[mockStyles.listText, { color: '#FFF' }]}>Run Immediately</Text>
          <View style={[mockStyles.toggleTrack, { backgroundColor: '#30D158' }]}>
            <View style={mockStyles.toggleThumb} />
          </View>
        </Animated.View>
        <View style={[mockStyles.listRow, { borderBottomColor: '#2C2C2E' }]}>
          <Text style={[mockStyles.listText, { color: '#8E8E93', fontSize: 12 }]}>
            Runs without asking when triggered
          </Text>
        </View>

        <View style={{ flex: 1 }} />
        <View style={{ alignItems: 'center', paddingVertical: 16 }}>
          <Ionicons name="checkmark-circle" size={40} color="#30D158" />
          <Text style={{ color: '#30D158', fontSize: 13, fontWeight: '600', marginTop: 6 }}>You're all set!</Text>
        </View>
      </View>
    </View>
  );
}


const STEPS: GuideStep[] = [
  {
    title: 'Open the Shortcuts App',
    description: 'Find the Shortcuts app on your iPhone. It comes pre-installed with iOS.',
    mockUI: (theme) => <MockShortcutsIcon theme={theme} />,
  },
  {
    title: 'Go to the Automation Tab',
    description: 'Tap the Automation tab at the bottom of the screen.',
    mockUI: (theme, pulse) => <MockTabBar theme={theme} pulseAnim={pulse} activeTab={1} />,
  },
  {
    title: 'Create New Automation',
    description: 'Tap the + button in the top right corner to create a new automation.',
    mockUI: (theme, pulse) => <MockPlusButton theme={theme} pulseAnim={pulse} />,
  },
  {
    title: 'Choose "Wallet" Trigger',
    description: 'Scroll down and select Wallet as your trigger. This fires when you tap to pay.',
    mockUI: (theme, pulse) => <MockTriggerList theme={theme} pulseAnim={pulse} />,
  },
  {
    title: 'Select Your Wallet Cards',
    description: 'Choose which wallet cards or passes should trigger the automation.',
    mockUI: (theme, pulse) => <MockCardSelection theme={theme} pulseAnim={pulse} />,
  },
  {
    title: 'Add "Log Transaction" Action',
    description: 'Tap "New Blank Automation", then search for "Scrimp" in the search bar and select "Log Transaction".',
    mockUI: (theme, pulse) => <MockSearchScrimp theme={theme} pulseAnim={pulse} />,
  },
  {
    title: 'Map Amount & Merchant',
    description: 'Tap the Amount field and pick "Amount" from the variable list. Then tap the Merchant field and pick "Merchant". This links your payment details to Scrimp automatically.',
    mockUI: (theme, pulse) => <MockConfigureParams theme={theme} pulseAnim={pulse} />,
  },
  {
    title: 'Save Automation',
    description: 'Toggle on "Run Immediately" so transactions are logged silently. Then tap Done — you\'re all set!',
    mockUI: (theme, pulse) => <MockSaveAutomation theme={theme} pulseAnim={pulse} />,
  },
];

interface ShortcutsGuideStepProps {
  onDone: () => void;
  onSkip?: () => void;
  standalone?: boolean;
}

export function ShortcutsGuideStep({ onDone, onSkip, standalone = false }: ShortcutsGuideStepProps) {
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

  const step = STEPS[currentStep];

  return (
    <View style={[styles.container, { width: standalone ? undefined : SCREEN_WIDTH }]}>
      {(onSkip || standalone) && (
        <View style={styles.header}>
          <TouchableOpacity
            onPress={onSkip || onDone}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <Text style={[styles.skipText, { color: theme.textSecondary }]}>
              {standalone ? 'Close' : "I'll set this up later"}
            </Text>
          </TouchableOpacity>
        </View>
      )}

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
        <Text style={[styles.stepDescription, { color: theme.textSecondary }]}>
          {step.description}
        </Text>

        <View style={styles.mockContainer}>
          {step.mockUI(theme, pulseAnim)}
        </View>
      </Animated.View>

      <View style={styles.actions}>
        <View style={styles.utilButtons}>
          {Platform.OS === 'ios' && (
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
    paddingBottom: 60,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
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
  mockContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
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
});
