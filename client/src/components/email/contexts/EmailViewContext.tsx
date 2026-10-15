'use client';

import React, { createContext, useContext } from 'react';
import type { CancelledBy } from '@/types/email';

export interface EmailViewValue {
  mobile: boolean;
  showTags: boolean;
  cancelledBy: CancelledBy;
  values: Record<string, string>;
}

const EmailViewContext = createContext<EmailViewValue>({
  mobile: false,
  showTags: false,
  cancelledBy: 'store',
  values: {},
});

interface EmailViewProviderProps {
  value: EmailViewValue;
  children: React.ReactNode;
}

export function EmailViewProvider({ value, children }: EmailViewProviderProps) {
  return <EmailViewContext.Provider value={value}>{children}</EmailViewContext.Provider>;
}

export function useEmailView() {
  return useContext(EmailViewContext);
}
