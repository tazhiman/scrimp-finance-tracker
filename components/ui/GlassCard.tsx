import React from 'react';
import { View, StyleSheet, Platform, ViewStyle, StyleProp } from 'react-native';
import { BlurView } from 'expo-blur';
import { useTheme } from '@/context/ThemeContext';
import { Radius } from '@/constants/design';

let GlassView: any = null;
let isLiquidGlassAvailable: (() => boolean) | null = null;
let isGlassEffectAPIAvailable: (() => boolean) | null = null;

try {
  const glassModule = require('expo-glass-effect');
  GlassView = glassModule.GlassView;
  isLiquidGlassAvailable = glassModule.isLiquidGlassAvailable;
  isGlassEffectAPIAvailable = glassModule.isGlassEffectAPIAvailable;
} catch {}

const intensityMap = {
  subtle: { blur: 25, opacity: 0.6 },
  medium: { blur: 40, opacity: 0.5 },
  strong: { blur: 60, opacity: 0.4 },
} as const;

type GlassIntensity = keyof typeof intensityMap;

interface GlassCardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  intensity?: GlassIntensity;
  borderRadius?: number;
}

export function GlassCard({
  children,
  style,
  intensity = 'medium',
  borderRadius = Radius.md,
}: GlassCardProps) {
  const { theme, themeMode } = useTheme();
  const config = intensityMap[intensity];

  const useLiquidGlass =
    Platform.OS === 'ios' &&
    GlassView &&
    isLiquidGlassAvailable?.() &&
    isGlassEffectAPIAvailable?.();

  const useBlur = Platform.OS === 'ios' && !useLiquidGlass;

  if (useLiquidGlass) {
    return (
      <GlassView
        style={[{ borderRadius, overflow: 'hidden' }, style]}
        glassEffectStyle="regular"
        colorScheme={themeMode}
      >
        {children}
      </GlassView>
    );
  }

  if (useBlur) {
    return (
      <View style={[{ borderRadius, overflow: 'hidden' }, style]}>
        <BlurView
          intensity={config.blur}
          tint={themeMode === 'dark' ? 'dark' : 'light'}
          style={StyleSheet.absoluteFill}
        />
        <View
          style={[
            StyleSheet.absoluteFill,
            {
              backgroundColor:
                themeMode === 'dark'
                  ? `rgba(10, 15, 15, ${config.opacity})`
                  : `rgba(245, 243, 244, ${config.opacity})`,
              borderWidth: 1,
              borderColor:
                themeMode === 'dark'
                  ? 'rgba(255, 255, 255, 0.08)'
                  : 'rgba(0, 0, 0, 0.06)',
              borderRadius,
            },
          ]}
        />
        <View style={{ position: 'relative' }}>{children}</View>
      </View>
    );
  }

  return (
    <View
      style={[
        {
          borderRadius,
          backgroundColor: theme.cardBackground,
          borderWidth: 1,
          borderColor: theme.cardBorder,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}
