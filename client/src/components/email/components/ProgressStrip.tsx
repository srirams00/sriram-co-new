import React from 'react';
import { Check } from 'lucide-react';
import { theme, tableProps } from '../data/emailTheme';

interface ProgressStripProps {
  completed: number;
  current?: number;
  partialAfter?: number;
}

type StepState = 'done' | 'current' | 'upcoming';

const steps = ['Placed', 'Confirmed', 'Out for delivery', 'Delivered'];

export function ProgressStrip({ completed, current, partialAfter }: ProgressStripProps) {
  const stateOf = (i: number): StepState => (i < completed ? 'done' : i === current ? 'current' : 'upcoming');
  const isActive = (i: number) => stateOf(i) !== 'upcoming';

  const line = (visible: boolean, green: boolean) => (
    <div
      style={{
        height: 2,
        background: visible ? (green ? theme.green : theme.border) : 'transparent',
        fontSize: 1,
        lineHeight: '2px',
      }}
    >
      {'\u00a0'}
    </div>
  );

  return (
    <table {...tableProps} width="100%" style={{ tableLayout: 'fixed' }}>
      <tbody>
        <tr>
          {steps.map((label, i) => {
            const state = stateOf(i);
            const leftGreen = i > 0 && isActive(i);
            const rightGreen = i < steps.length - 1 && (isActive(i + 1) || partialAfter === i);
            return (
              <td key={label} width="25%" style={{ verticalAlign: 'top', textAlign: 'center' }}>
                <table {...tableProps} width="100%">
                  <tbody>
                    <tr>
                      <td style={{ verticalAlign: 'middle' }}>{line(i > 0, leftGreen)}</td>
                      <td style={{ width: 24, verticalAlign: 'middle' }}>
                        <StepDot state={state} />
                      </td>
                      <td style={{ verticalAlign: 'middle' }}>{line(i < steps.length - 1, rightGreen)}</td>
                    </tr>
                  </tbody>
                </table>
                <p
                  style={{
                    margin: '8px 2px 0',
                    fontFamily: theme.font,
                    fontSize: 13,
                    lineHeight: 1.35,
                    fontWeight: state === 'current' ? 600 : state === 'done' ? 500 : 400,
                    color: state === 'upcoming' ? theme.muted : theme.text,
                  }}
                >
                  {label}
                </p>
              </td>
            );
          })}
        </tr>
      </tbody>
    </table>
  );
}

function StepDot({ state }: { state: StepState }) {
  const base: React.CSSProperties = {
    width: 24,
    height: 24,
    borderRadius: 999,
    boxSizing: 'border-box',
    textAlign: 'center',
    lineHeight: 0,
    margin: '0 auto',
  };

  if (state === 'done') {
    return (
      <div style={{ ...base, background: theme.green, paddingTop: 5 }}>
        <Check size={14} color="#ffffff" strokeWidth={3} aria-hidden="true" style={{ margin: '0 auto' }} />
      </div>
    );
  }

  if (state === 'current') {
    return (
      <div style={{ ...base, background: '#ffffff', border: `2px solid ${theme.green}`, paddingTop: 6 }}>
        <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: 999, background: theme.green }} />
      </div>
    );
  }

  return <div style={{ ...base, background: theme.neutralBg, border: `2px solid ${theme.border}` }} />;
}
