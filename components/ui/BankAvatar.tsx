import React from 'react';
import { View, Text } from 'react-native';

const AVATAR_COLORS = [
  '#E53935', '#D81B60', '#8E24AA', '#5E35B1',
  '#3949AB', '#1E88E5', '#039BE5', '#00ACC1',
  '#00897B', '#43A047', '#7CB342', '#C0CA33',
  '#F4511E', '#6D4C41', '#546E7A', '#EF6C00',
];

function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

function getInitials(name: string): string {
  const words = name.trim().split(/\s+/);
  if (words.length >= 2) {
    return (words[0][0] + words[1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

interface BankAvatarProps {
  name: string;
  size?: number;
}

export function BankAvatar({ name, size = 20 }: BankAvatarProps) {
  const color = AVATAR_COLORS[hashString(name) % AVATAR_COLORS.length];
  const initials = getInitials(name);
  const fontSize = size * 0.45;

  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: color,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Text style={{ color: '#FFF', fontSize, fontWeight: '700', letterSpacing: -0.3 }}>
        {initials}
      </Text>
    </View>
  );
}
