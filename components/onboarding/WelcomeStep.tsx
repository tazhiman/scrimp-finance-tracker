import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Dimensions, Image, TouchableOpacity } from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import { Spacing, Radius, Shadow } from '@/constants/design';

const { width } = Dimensions.get('window');

interface WelcomeStepProps {
  onNext: () => void;
}

export function WelcomeStep({ onNext }: WelcomeStepProps) {
  const { theme, themeMode } = useTheme();
  const iconAnim = useRef(new Animated.Value(0)).current;
  const titleAnim = useRef(new Animated.Value(0)).current;
  const subtitleAnim = useRef(new Animated.Value(0)).current;
  const buttonAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.stagger(200, [
      Animated.timing(iconAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.timing(titleAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
      Animated.timing(subtitleAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
      Animated.timing(buttonAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
    ]).start();
  }, []);

  const buttonTextColor = themeMode === 'dark' ? '#000505' : '#FEFCFD';

  return (
    <View style={[styles.container, { width }]}>
      <View style={styles.content}>
        <Animated.View style={[styles.iconContainer, {
          opacity: iconAnim,
          transform: [{ translateY: iconAnim.interpolate({ inputRange: [0, 1], outputRange: [30, 0] }) }],
        }]}>
          <View style={[styles.iconGlow, { backgroundColor: theme.primary + '12' }]}>
            <Image
              source={require('@/assets/icon.png')}
              style={styles.appIcon}
              resizeMode="contain"
            />
          </View>
        </Animated.View>

        <Animated.View style={{
          opacity: titleAnim,
          transform: [{ translateY: titleAnim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }],
        }}>
          <Text style={[styles.title, { color: theme.text }]}>Welcome to Scrimp</Text>
        </Animated.View>

        <Animated.View style={{
          opacity: subtitleAnim,
          transform: [{ translateY: subtitleAnim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }],
        }}>
          <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
            Track your spending, set goals, and lets get scrimping!
          </Text>
        </Animated.View>
      </View>

      <Animated.View style={[styles.bottomSection, { opacity: buttonAnim }]}>
        <Animated.View style={{
          transform: [{ scale: buttonAnim.interpolate({ inputRange: [0, 1], outputRange: [0.9, 1] }) }],
        }}>
          <TouchableOpacity
            style={[styles.getStartedButton, { backgroundColor: theme.primary }, Shadow.medium]}
            onPress={onNext}
            activeOpacity={0.8}
          >
            <Text style={[styles.getStartedText, { color: buttonTextColor }]}>Get Started</Text>
          </TouchableOpacity>
        </Animated.View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'space-between',
    paddingHorizontal: Spacing['4xl'],
    paddingTop: 80,
    paddingBottom: 60,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainer: {
    marginBottom: Spacing['4xl'],
  },
  iconGlow: {
    width: 148,
    height: 148,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  appIcon: {
    width: 120,
    height: 120,
    borderRadius: Radius['2xl'],
  },
  title: {
    fontSize: 34,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: Spacing.xl,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 17,
    textAlign: 'center',
    lineHeight: 25,
    paddingHorizontal: Spacing.xl,
  },
  bottomSection: {
    alignItems: 'center',
  },
  getStartedButton: {
    paddingVertical: Spacing.xl,
    paddingHorizontal: Spacing['6xl'],
    borderRadius: Radius.lg,
    alignItems: 'center',
  },
  getStartedText: {
    fontSize: 17,
    fontWeight: '700',
  },
});
