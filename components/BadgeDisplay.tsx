import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Badge } from '@/types';
import { useTheme } from '@/context/ThemeContext';

interface BadgeDisplayProps {
  badge: Badge;
  size?: 'small' | 'medium' | 'large';
  onPress?: () => void;
}

export const BadgeDisplay: React.FC<BadgeDisplayProps> = ({
  badge,
  size = 'medium',
  onPress,
}) => {
  const { theme } = useTheme();
  
  const sizeMap = {
    small: { icon: 32, container: 64 },
    medium: { icon: 40, container: 80 },
    large: { icon: 64, container: 128 },
  };

  const dimensions = sizeMap[size];

  const content = (
    <View
      style={[
        styles.container,
        {
          width: dimensions.container,
          opacity: badge.unlocked ? 1 : 0.3,
        },
      ]}
    >
      <View
        style={[
          styles.badgeCircle,
          {
            width: dimensions.container,
            height: dimensions.container,
            backgroundColor: badge.unlocked
              ? theme.backgroundSecondary
              : theme.backgroundTertiary,
            borderColor: theme.cardBorder,
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
    marginHorizontal: 4,
    marginVertical: 8,
  },
  badgeCircle: {
    borderRadius: 999,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
  },
  icon: {
    textAlign: 'center',
  },
  name: {
    fontWeight: '600',
    marginTop: 6,
    textAlign: 'center',
    width: '100%',
    paddingHorizontal: 2,
  },
});

