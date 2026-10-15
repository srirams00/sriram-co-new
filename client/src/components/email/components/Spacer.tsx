import React from 'react';

interface SpacerProps {
  size: number;
}

export function Spacer({ size }: SpacerProps) {
  return (
    <div aria-hidden="true" style={{ height: size, lineHeight: `${size}px`, fontSize: 1 }}>
      {'\u00a0'}
    </div>
  );
}
