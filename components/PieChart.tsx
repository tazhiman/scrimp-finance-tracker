import React from 'react';
import { View } from 'react-native';
import Svg, { G, Path } from 'react-native-svg';

export type PieSlice = {
  id: string;
  label: string;
  value: number;
  color: string;
};

type Props = {
  size?: number;
  strokeWidth?: number;
  slices: PieSlice[];
  onPressSlice?: (slice: PieSlice) => void;
  selectedId?: string | null;
};

const TAU = Math.PI * 2;
const EPS = 1e-6;

const polarToCartesian = (cx: number, cy: number, r: number, angleRad: number) => {
  return {
    x: cx + r * Math.cos(angleRad),
    y: cy + r * Math.sin(angleRad),
  };
};

const describeArc = (
  cx: number,
  cy: number,
  r: number,
  startAngle: number,
  endAngle: number
) => {
  const start = polarToCartesian(cx, cy, r, startAngle);
  const end = polarToCartesian(cx, cy, r, endAngle);
  const largeArcFlag = endAngle - startAngle > Math.PI ? 1 : 0;

  // Pie slice path: center -> start -> arc -> center
  return [
    `M ${cx} ${cy}`,
    `L ${start.x} ${start.y}`,
    `A ${r} ${r} 0 ${largeArcFlag} 1 ${end.x} ${end.y}`,
    'Z',
  ].join(' ');
};

const describeFullCircle = (cx: number, cy: number, r: number) => {
  // Full circle pie slice: draw two 180° arcs (SVG can't draw a full circle with one arc command)
  return [
    `M ${cx} ${cy}`,
    `L ${cx} ${cy - r}`,
    `A ${r} ${r} 0 1 1 ${cx} ${cy + r}`,
    `A ${r} ${r} 0 1 1 ${cx} ${cy - r}`,
    'Z',
  ].join(' ');
};

export function PieChart({
  size = 220,
  strokeWidth = 0,
  slices,
  onPressSlice,
  selectedId,
}: Props) {
  const total = slices.reduce((sum, s) => sum + Math.max(s.value, 0), 0);
  const cx = size / 2;
  const cy = size / 2;
  // Keep some padding so a "selected" slice can expand without being cropped by the SVG bounds.
  const SELECT_EXPAND = 6;
  const OUTER_PADDING = 8;
  const r = (size - strokeWidth) / 2 - OUTER_PADDING - SELECT_EXPAND;

  if (total <= 0) {
    return <View style={{ width: size, height: size }} />;
  }

  let startAngle = -Math.PI / 2; // start at top

  return (
    <Svg width={size} height={size}>
      <G>
        {slices.map((slice) => {
          const value = Math.max(slice.value, 0);
          const angle = (value / total) * TAU;
          const endAngle = startAngle + angle;

          const isSelected = selectedId === slice.id;
          const sliceR = isSelected ? r + SELECT_EXPAND : r;

          const d =
            angle >= TAU - EPS
              ? describeFullCircle(cx, cy, sliceR)
              : describeArc(cx, cy, sliceR, startAngle, endAngle);
          startAngle = endAngle;

          return (
            <Path
              key={slice.id}
              d={d}
              fill={slice.color}
              opacity={selectedId ? (isSelected ? 1 : 0.55) : 1}
              onPress={() => onPressSlice?.(slice)}
            />
          );
        })}
      </G>
    </Svg>
  );
}

