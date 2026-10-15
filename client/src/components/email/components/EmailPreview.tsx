'use client';

import React, { useMemo } from 'react';
import type { EmailMeta, CancelledBy } from '@/types/email';
import { EmailViewProvider, type EmailViewValue } from '../contexts/EmailViewContext';
import { mergeTagValues, cancellationReasons } from '../data/order';
import { emailTemplates } from './emailRegistry';
import { MergeText } from './MergeText';
import { EmailFrame } from './EmailFrame';

interface EmailPreviewProps {
  meta: EmailMeta;
  showTags: boolean;
  cancelledBy: CancelledBy;
}

export function EmailPreview({ meta, showTags, cancelledBy }: EmailPreviewProps) {
  const Template = emailTemplates[meta.id];
  const values = useMemo(
    () => ({ ...mergeTagValues, cancellation_reason: cancellationReasons[cancelledBy] }),
    [cancelledBy],
  );
  const desktop: EmailViewValue = { mobile: false, showTags, cancelledBy, values };
  const mobile: EmailViewValue = { ...desktop, mobile: true };

  return (
    <section aria-labelledby={`email-${meta.id}-title`} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <EmailViewProvider value={desktop}>
        <div style={{ maxWidth: '100%', borderRadius: '12px', border: '1px solid #dce8de', background: '#ffffff', padding: '20px 24px', boxShadow: '0 2px 6px rgba(0,0,0,0.02)' }}>
          <p style={{ margin: 0, fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#147b3d' }}>
            Email {meta.number} of 6
          </p>
          <h2 id={`email-${meta.id}-title`} style={{ margin: '4px 0 14px', fontSize: '18px', fontWeight: 700, color: '#1c2b21' }}>
            {meta.label}
          </h2>
          <dl style={{ margin: 0, display: 'grid', gridTemplateColumns: '80px 1fr', rowGap: '8px', fontSize: '13px' }}>
            <dt style={{ color: '#617568', fontWeight: 500 }}>From</dt>
            <dd style={{ margin: 0, color: '#1c2b21', fontWeight: 600 }}>Sri Ram &amp; Co &lt;ramkumar@sriramandco.in&gt; (Zoho Mail)</dd>
            <dt style={{ color: '#617568', fontWeight: 500 }}>Subject</dt>
            <dd style={{ margin: 0, fontWeight: 600, color: '#1c2b21' }}>
              <MergeText text={meta.subject} />
            </dd>
            <dt style={{ color: '#617568', fontWeight: 500 }}>Preheader</dt>
            <dd style={{ margin: 0, color: '#617568' }}>
              <MergeText text={meta.preheader} />
            </dd>
          </dl>
        </div>
      </EmailViewProvider>

      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-start', gap: '32px' }}>
        <EmailFrame device="desktop">
          <EmailViewProvider value={desktop}>
            <Template />
          </EmailViewProvider>
        </EmailFrame>
        <EmailFrame device="mobile">
          <EmailViewProvider value={mobile}>
            <Template />
          </EmailViewProvider>
        </EmailFrame>
      </div>
    </section>
  );
}
