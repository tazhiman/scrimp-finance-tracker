import React from 'react';
import {
  View,
  Modal,
  Pressable,
  StyleSheet,
  Platform,
  ViewStyle,
  StyleProp,
  ModalProps,
} from 'react-native';
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

interface GlassModalProps {
  visible: boolean;
  onClose: () => void;
  children: React.ReactNode;
  cardStyle?: StyleProp<ViewStyle>;
  position?: 'center' | 'bottom';
  animationType?: ModalProps['animationType'];
}

export function GlassModal({
  visible,
  onClose,
  children,
  cardStyle,
  position = 'center',
  animationType = 'fade',
}: GlassModalProps) {
  const { theme, themeMode } = useTheme();

  const useLiquidGlass =
    Platform.OS === 'ios' &&
    GlassView &&
    isLiquidGlassAvailable?.() &&
    isGlassEffectAPIAvailable?.();

  const useBlur = Platform.OS === 'ios' && !useLiquidGlass;

  const overlayStyle =
    position === 'bottom' ? styles.overlayBottom : styles.overlayCenter;

  const renderCard = () => {
    const borderRadius = position === 'bottom'
      ? { borderTopLeftRadius: Radius.xl, borderTopRightRadius: Radius.xl }
      : { borderRadius: Radius.xl };

    if (useLiquidGlass) {
      return (
        <GlassView
          style={[styles.card, borderRadius, cardStyle]}
          glassEffectStyle="regular"
          colorScheme={themeMode}
        >
          {children}
        </GlassView>
      );
    }

    if (useBlur) {
      return (
        <View style={[styles.card, borderRadius, { overflow: 'hidden' }, cardStyle]}>
          <BlurView
            intensity={50}
            tint={themeMode === 'dark' ? 'dark' : 'light'}
            style={StyleSheet.absoluteFill}
          />
          <View
            style={[
              StyleSheet.absoluteFill,
              {
                backgroundColor:
                  themeMode === 'dark'
                    ? 'rgba(10, 15, 15, 0.55)'
                    : 'rgba(245, 243, 244, 0.55)',
                borderWidth: 1,
                borderColor:
                  themeMode === 'dark'
                    ? 'rgba(255, 255, 255, 0.08)'
                    : 'rgba(0, 0, 0, 0.06)',
                ...borderRadius,
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
          styles.card,
          borderRadius,
          {
            backgroundColor: theme.cardBackground,
            borderWidth: 1,
            borderColor: theme.cardBorder,
          },
          cardStyle,
        ]}
      >
        {children}
      </View>
    );
  };

  return (
    <Modal
      visible={visible}
      animationType={animationType}
      transparent
      onRequestClose={onClose}
    >
      <View style={overlayStyle}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        {renderCard()}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlayCenter: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  overlayBottom: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'flex-end',
  },
  card: {
    width: '100%',
    maxWidth: 420,
  },
});
