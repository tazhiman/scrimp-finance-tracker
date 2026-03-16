import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Badge } from '@/types';
import { useTheme } from '@/context/ThemeContext';
import { Spacing, Radius } from '@/constants/design';

interface BadgeDisplayProps {
  badge: Badge;
  size?: 'small' | 'medium' | 'large';
  onPress?: () => void;
}

const sizeMap = {
  small: { icon: 28, container: 56 },
  medium: { icon: 36, container: 72 },
  large: { icon: 56, container: 112 },
};

export const BadgeDisplay: React.FC<BadgeDisplayProps> = ({
  badge,
  size = 'medium',
  onPress,
}) => {
  const { theme } = useTheme();
  const dimensions = sizeMap[size];

  const content = (
    <View style={[styles.container, { width: dimensions.container }]}>
      <View
        style={[
          styles.badgeCircle,
          {
            width: dimensions.container,
            height: dimensions.container,
            backgroundColor: badge.unlocked ? theme.backgroundSecondary : theme.backgroundTertiary,
            borderColor: badge.unlocked ? theme.cardBorder : theme.backgroundTertiary,
            opacity: badge.unlocked ? 1 : 0.35,
          },
        ]}
      >
        <Text style={[styles.icon, { fontSize: dimensions.icon }]}>
          {badge.icon}
        </Text>
      </View>
      <Text
        style={[styles.name, { fontSize: size === 'small' ? 10 : 11, color: theme.text }]}
        numberOfLines={2}
      >
        {badge.name}
      </Text>
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
        {content}
      </TouchableOpacity>
    );
  }

  return content;
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginHorizontal: Spacing.xs,
    marginVertical: Spacing.md,
  },
  badgeCircle: {
    borderRadius: Radius.full,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
  },
  icon: {
    textAlign: 'center',
  },
  name: {
    fontWeight: '600',
    marginTop: Spacing.sm,
    textAlign: 'center',
    width: '100%',
    paddingHorizontal: 2,
  },
});
