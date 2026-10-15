'use client';

import React from 'react';
import { useEmailView } from '../contexts/EmailViewContext';
import { splitMergeTags } from '../utils/mergeTags';
import { theme } from '../data/emailTheme';

interface MergeTextProps {
  text: string;
}

export function MergeText({ text }: MergeTextProps) {
  const { showTags, values } = useEmailView();
  const parts = splitMergeTags(text);

  return (
    <>
      {parts.map((part, i) => {
        if (part.type === 'text') return <React.Fragment key={i}>{part.value}</React.Fragment>;
        if (showTags) {
          return (
            <span
              key={i}
              style={{
                background: theme.iconBg,
                color: theme.green,
                border: `1px dashed ${theme.border}`,
                borderRadius: 4,
                padding: '0 4px',
                fontFamily: "ui-monospace, Menlo, Consolas, monospace",
                fontSize: '0.9em',
                fontWeight: 500,
                whiteSpace: 'nowrap',
              }}
            >
              {`{{${part.name}}}`}
            </span>
          );
        }
        return <React.Fragment key={i}>{values[part.name] ?? `{{${part.name}}}`}</React.Fragment>;
      })}
    </>
  );
}
