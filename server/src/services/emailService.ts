import nodemailer, { Transporter } from 'nodemailer';
import dotenv from 'dotenv';
import path from 'path';
import {
  compileOrderEmailHtml,
  EmailTemplateType,
  EmailMetadataOptions,
  CompiledEmail,
  OrderEmailData,
} from './emailTemplates.js';
import { getErrorMessage } from '../utils/typeGuards.js';

// Ensure server environment variables are loaded
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

export interface SendEmailPayload {
  to: string;
  subject: string;
  html: string;
  text?: string;
  replyTo?: string;
}

export interface SendEmailResult {
  success: boolean;
  messageId?: string;
  simulated?: boolean;
  reason?: string;
  error?: string;
}

const SMTP_HOST = process.env.SMTP_HOST || 'smtppro.zoho.in';
const SMTP_PORT = Number(process.env.SMTP_PORT) || 465;
const SMTP_SECURE = process.env.SMTP_SECURE === 'true' || SMTP_PORT === 465;
const SMTP_USER = process.env.SMTP_USER || 'ramkumar@sriramandco.in';
const SMTP_PASS = process.env.SMTP_PASS || '';
const EMAIL_FROM = { name: 'Sri Ram & Co', address: process.env.SMTP_USER || 'ramkumar@sriramandco.in' };
const EMAIL_RELAY_SECRET = process.env.EMAIL_RELAY_SECRET || 'src_sec_8f93b2a1c0d45e67a9b8c7d6e5f4a3b2';

export function sanitizeEmailHeader(val?: string): string {
  return (val || '').replace(/[\r\n\x00-\x1F]/g, '').trim();
}

let cachedTransporter: Transporter | null = null;

/**
 * Checks whether SMTP credentials (specifically password) are configured for live transmission.
 */
export function isSmtpConfigured(): boolean {
  return Boolean(SMTP_USER && SMTP_PASS && SMTP_PASS.trim().length > 0);
}

/**
 * Returns a singleton Nodemailer transporter configured for Zoho Mail.
 */
function getTransporter(): Transporter {
  if (!cachedTransporter) {
    cachedTransporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port: SMTP_PORT,
      secure: SMTP_SECURE,
      auth: {
        user: SMTP_USER,
        pass: SMTP_PASS,
      },
      connectionTimeout: 8000,
      greetingTimeout: 8000,
      socketTimeout: 8000,
    });
  }
  return cachedTransporter;
}

/**
 * Universal email sender. Dispatches via Zoho Mail SMTP if configured,
 * or safely logs to console in simulated dev mode if password is not yet configured.
 * Never throws exceptions that could crash checkout or order mutations.
 */
export async function sendEmail(payload: SendEmailPayload, relayBaseUrl?: string): Promise<SendEmailResult> {
  const { to, subject, html, text, replyTo } = payload;

  if (!to || !to.includes('@')) {
    return { success: false, reason: 'INVALID_RECIPIENT_EMAIL' };
  }

  // Prevent real SMTP transmissions to dummy test domains or during test runs
  if (to.endsWith('@example.com') || to.endsWith('@test.com') || process.env.NODE_ENV === 'test') {
    return {
      success: true,
      messageId: `simulated-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
      simulated: true,
    };
  }

  // 1. Try Vercel Serverless Relay if in production or relayBaseUrl is provided
  // On Render Free tier, outbound SMTP ports (25, 465, 587) are strictly blocked by Render firewall.
  // The Vercel relay operates over HTTPS port 443 and connects to Zoho Mail without firewall blocks.
  // CRITICAL: Always use https://www.sriramandco.in as the production relay endpoint.
  // Preview domains like review.sriramandco.in or *.vercel.app have Vercel Authentication enabled,
  // which blocks backend-to-frontend HTTP calls with 401 Protected Deployment.
  const candidateRelayUrls: string[] = Array.from(
    new Set(
      [
        process.env.EMAIL_RELAY_URL,
        'https://sriram-co-new.vercel.app',
        'https://www.sriramandco.in',
        relayBaseUrl,
        process.env.CLIENT_URL,
      ].filter(Boolean) as string[]
    )
  );

  if (process.env.NODE_ENV !== 'test' && candidateRelayUrls.length > 0) {
    for (const rawUrl of candidateRelayUrls) {
      try {
        const cleanRelayUrl = rawUrl.replace(/\/+$/, '');
        const res = await fetch(`${cleanRelayUrl}/api/email/send`, {
          method: 'POST',
          signal: AbortSignal.timeout(8000),
          headers: {
            'Content-Type': 'application/json',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) SriRamAndCo/1.0',
            'x-relay-secret': EMAIL_RELAY_SECRET,
            'x-src-secret': EMAIL_RELAY_SECRET,
          },
          body: JSON.stringify({
            templateType: 'system_relay',
            secret: EMAIL_RELAY_SECRET,
            to: sanitizeEmailHeader(to),
            subject: sanitizeEmailHeader(subject),
            replyTo: replyTo ? sanitizeEmailHeader(replyTo) : undefined,
            html,
            text,
          }),
        });

        if (res.ok) {
          const data = (await res.json()) as { success: boolean; messageId?: string };
          console.log(`[Zoho Relay] Email successfully relayed via ${cleanRelayUrl} to ${to} (MessageId: ${data.messageId})`);
          return {
            success: true,
            messageId: data.messageId,
            simulated: false,
          };
        } else {
          const errorBody = await res.text();
          console.warn(`[Zoho Relay] Relay ${cleanRelayUrl} returned status ${res.status} (${errorBody}), trying fallback...`);
        }
      } catch (relayErr: any) {
        console.warn(`[Zoho Relay] Relay ${rawUrl} attempt error: ${relayErr.message}, trying fallback...`);
      }
    }
  }

  // 2. Direct SMTP transport (local development or when Render SMTP is unblocked)
  if (!isSmtpConfigured()) {
    console.log('\n================== [ZOHO MAIL: SIMULATED DISPATCH] ==================');
    console.log(`From:    ${EMAIL_FROM}`);
    console.log(`To:      ${to}`);
    console.log(`Subject: ${subject}`);
    console.log(`Host:    ${SMTP_HOST}:${SMTP_PORT} (User: ${SMTP_USER})`);
    console.log(`Preview: ${html.slice(0, 300).replace(/\s+/g, ' ')}...`);
    console.log('Status:  Simulated dispatch OK (Enter Zoho SMTP_PASS in server/.env for live delivery)');
    console.log('=====================================================================\n');

    return {
      success: true,
      messageId: `simulated-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
      simulated: true,
    };
  }

  try {
    const transporter = getTransporter();
    const cleanTo = sanitizeEmailHeader(to);
    const cleanSubject = sanitizeEmailHeader(subject);
    const cleanReplyTo = replyTo ? sanitizeEmailHeader(replyTo) : 'ramkumar@sriramandco.in';

    const info = await transporter.sendMail({
      from: EMAIL_FROM,
      to: cleanTo,
      subject: cleanSubject,
      html,
      text: text || cleanSubject,
      replyTo: cleanReplyTo,
    });

    console.log(`[Zoho Mail] Transactional email sent to ${to} (MessageId: ${info.messageId})`);
    return {
      success: true,
      messageId: info.messageId,
      simulated: false,
    };
  } catch (error: unknown) {
    console.error(`[Zoho Mail Error] Failed to send email to ${to}:`, getErrorMessage(error));
    return {
      success: false,
      error: getErrorMessage(error) || 'SMTP transmission failure',
    };
  }
}

/**
 * High-level order lifecycle helper. Compiles the appropriate HTML template
 * and dispatches to the customer's order email address.
 */
export async function sendOrderLifecycleEmail(
  order: OrderEmailData,
  type: EmailTemplateType,
  options: EmailMetadataOptions = {}
): Promise<SendEmailResult> {
  try {
    const customerEmail = order.customerInfo?.email?.trim();

    if (!customerEmail || !customerEmail.includes('@')) {
      console.warn(`[Zoho Mail] Order #${order.orderNumber} has no valid customer email. Skipping dispatch.`);
      return { success: false, reason: 'NO_RECIPIENT_EMAIL' };
    }

    const compiled: CompiledEmail = compileOrderEmailHtml(order, type, options);

    return await sendEmail({
      to: customerEmail,
      subject: compiled.subject,
      html: compiled.html,
      text: compiled.text,
    });
  } catch (err: unknown) {
    console.error(`[Zoho Mail] Error compiling or dispatching lifecycle email for #${order?.orderNumber}:`, err);
    return { success: false, error: getErrorMessage(err) };
  }
}
