import React from 'react';

interface HouseCheckIconProps {
  size?: number;
  color?: string;
  label?: string;
}

export function HouseCheckIcon({ size = 26, color = 'currentColor', label = 'Delivered' }: HouseCheckIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      role="img"
      aria-label={label}
    >
      <path d="M3 10.5 12 3l9 7.5" />
      <path d="M5 9v11a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V9" />
      <path d="m9 14.5 2 2 4-4" />
    </svg>
  );
}
