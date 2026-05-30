import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { useTheme } from '@/context/ThemeContext';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

interface ProgressRingProps {
  progress: number; // 0-100
  size?: number;
  strokeWidth?: number;
  color?: string;
  backgroundColor?: string;
  label?: string;
  value?: string;
  showPercentage?: boolean;
  /** Animate arc sweep when progress changes */
  animated?: boolean;
}

export const ProgressRing: React.FC<ProgressRingProps> = ({
  progress,
  size = 120,
  strokeWidth = 12,
  color,
  backgroundColor,
  label,
  value,
  showPercentage = false,
  animated = false,
}) => {
  const { theme } = useTheme();
  const ringColor = color || theme.ringGreen;
  const bgColor = backgroundColor || theme.backgroundTertiary;
  const clampedProgress = Number.isFinite(progress) ? Math.min(Math.max(progress, 0), 100) : 0;

  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const center = size / 2;

  const animatedProgress = useRef(new Animated.Value(clampedProgress)).current;
  const [displayProgress, setDisplayProgress] = React.useState(clampedProgress);

  useEffect(() => {
    if (!animated) {
      animatedProgress.setValue(clampedProgress);
      setDisplayProgress(clampedProgress);
      return;
    }

    const listenerId = animatedProgress.addListener(({ value }) => {
      setDisplayProgress(value);
    });

    Animated.spring(animatedProgress, {
      toValue: clampedProgress,
      useNativeDriver: false,
      tension: 60,
      friction: 8,
    }).start();

    return () => {
      animatedProgress.removeListener(listenerId);
    };
  }, [clampedProgress, animated, animatedProgress]);

  const strokeDashoffset = animated
    ? circumference * (1 - displayProgress / 100)
    : circumference * (1 - clampedProgress / 100);

  const displayValue =
    value ||
    (showPercentage
      ? `${Math.round(animated ? displayProgress : clampedProgress)}%`
      : '');

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Svg width={size} height={size}>
        <Circle
          cx={center}
          cy={center}
          r={radius}
          stroke={bgColor}
          strokeWidth={strokeWidth}
          fill="transparent"
        />
        <AnimatedCircle
          cx={center}
          cy={center}
          r={radius}
          stroke={ringColor}
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          transform={`rotate(-90 ${center} ${center})`}
        />
      </Svg>
      <View style={styles.content}>
        {label && (
          <Text style={[styles.label, { color: theme.textSecondary }]} numberOfLines={1} ellipsizeMode="tail">
            {label}
          </Text>
        )}
        {displayValue && (
          <Text
            style={[styles.value, { fontSize: size * 0.17, color: theme.text }]}
            numberOfLines={1}
            ellipsizeMode="tail"
            adjustsFontSizeToFit
            minimumFontScale={0.6}
          >
            {displayValue}
          </Text>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
    width: '70%',
    height: '100%',
    paddingHorizontal: 8,
  },
  label: {
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 4,
    textAlign: 'center',
  },
  value: {
    fontWeight: '700',
    textAlign: 'center',
  },
});
