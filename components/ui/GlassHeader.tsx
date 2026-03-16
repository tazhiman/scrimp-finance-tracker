import React from 'react';
import { View, StyleSheet, Platform, ViewStyle, StyleProp } from 'react-native';
import { BlurView } from 'expo-blur';
import { useTheme } from '@/context/ThemeContext';

let GlassView: any = null;
let isLiquidGlassAvailable: (() => boolean) | null = null;
let isGlassEffectAPIAvailable: (() => boolean) | null = null;

try {
  const glassModule = require('expo-glass-effect');
  GlassView = glassModule.GlassView;
  isLiquidGlassAvailable = glassModule.isLiquidGlassAvailable;
  isGlassEffectAPIAvailable = glassModule.isGlassEffectAPIAvailable;
} catch {}

interface GlassHeaderProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}

export function GlassHeader({ children, style }: GlassHeaderProps) {
  const { theme, themeMode } = useTheme();

  const useLiquidGlass =
    Platform.OS === 'ios' &&
    GlassView &&
    isLiquidGlassAvailable?.() &&
    isGlassEffectAPIAvailable?.();

  const useBlur = Platform.OS === 'ios' && !useLiquidGlass;

  if (useLiquidGlass) {
    return (
      <GlassView
        style={[styles.header, style]}
        glassEffectStyle="regular"
        colorScheme={themeMode}
      >
        {children}
        <View
          style={[
            styles.bottomBorder,
            { backgroundColor: themeMode === 'dark' ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)' },
          ]}
        />
      </GlassView>
    );
  }

  if (useBlur) {
    return (
      <View style={[styles.header, { overflow: 'hidden' }, style]}>
        <BlurView
          intensity={80}
          tint={themeMode === 'dark' ? 'dark' : 'light'}
          style={StyleSheet.absoluteFill}
        />
        <View
          style={[
            StyleSheet.absoluteFill,
            {
              backgroundColor:
                themeMode === 'dark'
                  ? 'rgba(0, 5, 5, 0.65)'
                  : 'rgba(254, 252, 253, 0.65)',
            },
          ]}
        />
        <View style={{ position: 'relative', flex: 1 }}>{children}</View>
        <View
          style={[
            styles.bottomBorder,
            { backgroundColor: theme.cardBorder },
          ]}
        />
      </View>
    );
  }

  return (
    <View
      style={[
        styles.header,
        {
          backgroundColor: theme.background,
          borderBottomWidth: 1,
          borderBottomColor: theme.cardBorder,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    zIndex: 10,
  },
  bottomBorder: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: StyleSheet.hairlineWidth,
  },
});
