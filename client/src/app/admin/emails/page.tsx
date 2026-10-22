'use client';

import React, { useState } from 'react';
import { Send, Eye, Code, AlertCircle, CheckCircle2, RefreshCw } from 'lucide-react';
import { emails } from '@/components/email/data/emails';
import { EmailPreview } from '@/components/email/components/EmailPreview';
import type { EmailId, CancelledBy } from '@/types/email';

export default function AdminEmailStudioPage() {
  const [activeTab, setActiveTab] = useState<EmailId>('placed');
  const [showMergeTags, setShowMergeTags] = useState(false);
  const [cancelledBy, setCancelledBy] = useState<CancelledBy>('store');

  // Test send state
  const [testEmail, setTestEmail] = useState('ramkumar@sriramandco.in');
  const [isSending, setIsSending] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  const activeEmailMeta = emails.find((e) => e.id === activeTab) || emails[0];

  const handleSendTestEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!testEmail || !testEmail.includes('@')) {
      setTestResult({ success: false, message: 'Please provide a valid recipient email address.' });
      return;
    }

    setIsSending(true);
    setTestResult(null);

    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('src_auth_token') || undefined : undefined;
      const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000/api';

      const res = await fetch(`${API_BASE}/orders/admin/test-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          email: testEmail,
          templateType: activeTab === 'out-for-delivery' ? 'out_for_delivery' : activeTab,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setTestResult({
          success: true,
          message: data.result?.simulated
            ? `Simulated dispatch logged to server console (Zoho Mail SMTP_PASS unconfigured in .env)`
            : `Email successfully sent to ${testEmail} via Zoho Mail!`,
        });
      } else {
        setTestResult({
          success: false,
          message: data.message || 'Failed to dispatch test email.',
        });
      }
    } catch (err: any) {
      setTestResult({
        success: false,
        message: err.message || 'Network error connecting to backend email service.',
      });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '8px 16px 40px' }}>
      {/* Top Banner */}
      <div style={{ background: '#ffffff', borderRadius: 16, border: '1px solid #dce8de', padding: '24px 28px', marginBottom: 28, boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16 }}>
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: '#f4faf5', border: '1px solid #dce8de', padding: '4px 12px', borderRadius: 999, marginBottom: 10 }}>
              <span style={{ width: 8, height: 8, borderRadius: 999, background: '#147b3d' }}></span>
              <span style={{ fontSize: 12, fontWeight: 700, color: '#147b3d' }}>Zoho Mail Connected</span>
              <span style={{ fontSize: 12, color: '#617568' }}>•</span>
              <span style={{ fontSize: 12, color: '#617568' }}>ramkumar@sriramandco.in</span>
            </div>
            <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700, color: '#1c2b21' }}>Transactional Email Studio</h1>
            <p style={{ margin: '6px 0 0', fontSize: 14, color: '#617568', maxWidth: 640 }}>
              Four order-stage emails plus cancellation, rendered at desktop (600px) and mobile (375px) viewports with real store metadata and responsive HTML table styling.
            </p>
          </div>

          {/* Test Dispatch Form */}
          <form onSubmit={handleSendTestEmail} style={{ display: 'flex', flexDirection: 'column', gap: 8, background: '#f7faf7', padding: '14px 18px', borderRadius: 12, border: '1px solid #dce8de', minWidth: 320 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: '#1c2b21' }}>Send Live Sample via Zoho Mail</span>
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                type="email"
                value={testEmail}
                onChange={(e) => setTestEmail(e.target.value)}
                placeholder="ramkumar@sriramandco.in"
                style={{ flex: 1, padding: '8px 12px', fontSize: 13, border: '1px solid #dce8de', borderRadius: 8, outline: 'none' }}
              />
              <button
                type="submit"
                disabled={isSending}
                style={{ background: '#147b3d', color: '#ffffff', border: 'none', padding: '8px 16px', borderRadius: 8, fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6, cursor: isSending ? 'not-allowed' : 'pointer' }}
              >
                {isSending ? <RefreshCw size={14} className="animate-spin" /> : <Send size={14} />}
                <span>{isSending ? 'Sending...' : 'Send'}</span>
              </button>
            </div>
            {testResult && (
              <div style={{ fontSize: 12, color: testResult.success ? '#15803d' : '#b91c1c', display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
                {testResult.success ? <CheckCircle2 size={14} /> : <AlertCircle size={14} />}
                <span>{testResult.message}</span>
              </div>
            )}
          </form>
        </div>

        {/* Tab Switcher & Toggles */}
        <div style={{ marginTop: 24, paddingTop: 20, borderTop: '1px solid #eef2ef', display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
          {/* Tabs */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {emails.map((email) => {
              const isActive = email.id === activeTab;
              return (
                <button
                  key={email.id}
                  type="button"
                  onClick={() => setActiveTab(email.id)}
                  style={{
                    padding: '8px 16px',
                    borderRadius: 999,
                    fontSize: 13,
                    fontWeight: isActive ? 700 : 500,
                    border: `1px solid ${isActive ? '#147b3d' : '#dce8de'}`,
                    background: isActive ? '#147b3d' : '#ffffff',
                    color: isActive ? '#ffffff' : '#1c2b21',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  {email.number}. {email.label}
                </button>
              );
            })}
          </div>

          {/* Merge Tags & Cancellation Toggles */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <button
              type="button"
              onClick={() => setShowMergeTags(!showMergeTags)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '6px 14px',
                borderRadius: 8,
                fontSize: 13,
                fontWeight: 600,
                border: '1px solid #dce8de',
                background: showMergeTags ? '#f4faf5' : '#ffffff',
                color: showMergeTags ? '#147b3d' : '#617568',
                cursor: 'pointer',
              }}
            >
              {showMergeTags ? <Code size={14} /> : <Eye size={14} />}
              <span>{showMergeTags ? 'Raw Merge Tags (ON)' : 'Sample Values'}</span>
            </button>

            {activeTab === 'cancelled' && (
              <div style={{ display: 'inline-flex', borderRadius: 8, border: '1px solid #dce8de', overflow: 'hidden' }}>
                <button
                  type="button"
                  onClick={() => setCancelledBy('store')}
                  style={{
                    padding: '6px 12px',
                    fontSize: 12,
                    fontWeight: cancelledBy === 'store' ? 700 : 500,
                    background: cancelledBy === 'store' ? '#147b3d' : '#ffffff',
                    color: cancelledBy === 'store' ? '#ffffff' : '#1c2b21',
                    border: 'none',
                    cursor: 'pointer',
                  }}
                >
                  By Store
                </button>
                <button
                  type="button"
                  onClick={() => setCancelledBy('customer')}
                  style={{
                    padding: '6px 12px',
                    fontSize: 12,
                    fontWeight: cancelledBy === 'customer' ? 700 : 500,
                    background: cancelledBy === 'customer' ? '#147b3d' : '#ffffff',
                    color: cancelledBy === 'customer' ? '#ffffff' : '#1c2b21',
                    border: 'none',
                    borderLeft: '1px solid #dce8de',
                    cursor: 'pointer',
                  }}
                >
                  By Customer
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Email Preview Section */}
      <EmailPreview
        meta={activeEmailMeta}
        showTags={showMergeTags}
        cancelledBy={cancelledBy}
      />
    </div>
  );
}
