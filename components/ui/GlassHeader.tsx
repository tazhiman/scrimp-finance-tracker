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
  /** Hide the bottom separator for a seamless look */
  borderless?: boolean;
}

export function GlassHeader({ children, style, borderless = false }: GlassHeaderProps) {
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
        {!borderless && (
          <View
            style={[
              styles.bottomBorder,
              { backgroundColor: themeMode === 'dark' ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)' },
            ]}
          />
        )}
      </GlassView>
    );
  }

  if (useBlur) {
    return (
      <View style={[styles.header, { overflow: 'hidden' }, style]}>
        <BlurView
          intensity={40}
          tint={themeMode === 'dark' ? 'dark' : 'light'}
          style={StyleSheet.absoluteFill}
        />
        <View
          style={[
            StyleSheet.absoluteFill,
            {
              backgroundColor:
                themeMode === 'dark'
                  ? 'rgba(0, 5, 5, 0.85)'
                  : 'rgba(254, 252, 253, 0.85)',
            },
          ]}
        />
        <View style={{ position: 'relative', flex: 1 }}>{children}</View>
        {!borderless && (
          <View
            style={[
              styles.bottomBorder,
              { backgroundColor: theme.cardBorder },
            ]}
          />
        )}
      </View>
    );
  }

  return (
    <View
      style={[
        styles.header,
        {
          backgroundColor: theme.background,
          ...(borderless ? {} : { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: theme.cardBorder }),
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
