import nodemailer, { Transporter } from 'nodemailer';
import dotenv from 'dotenv';
import path from 'path';
import {
  compileOrderEmailHtml,
  EmailTemplateType,
  EmailMetadataOptions,
  CompiledEmail,
} from './emailTemplates';

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
const EMAIL_FROM = process.env.EMAIL_FROM || '"Sri Ram & Co" <ramkumar@sriramandco.in>';

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
export async function sendEmail(payload: SendEmailPayload): Promise<SendEmailResult> {
  const { to, subject, html, text, replyTo } = payload;

  if (!to || !to.includes('@')) {
    return { success: false, reason: 'INVALID_RECIPIENT_EMAIL' };
  }

  // Simulated mode for offline/dev or unconfigured password
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
    const info = await transporter.sendMail({
      from: EMAIL_FROM,
      to,
      subject,
      html,
      text: text || subject,
      replyTo: replyTo || 'ramkumar@sriramandco.in',
    });

    console.log(`[Zoho Mail] Transactional email sent to ${to} (MessageId: ${info.messageId})`);
    return {
      success: true,
      messageId: info.messageId,
      simulated: false,
    };
  } catch (error: any) {
    console.error(`[Zoho Mail Error] Failed to send email to ${to}:`, error.message);
    return {
      success: false,
      error: error.message || 'SMTP transmission failure',
    };
  }
}

/**
 * High-level order lifecycle helper. Compiles the appropriate HTML template
 * and dispatches to the customer's order email address.
 */
export async function sendOrderLifecycleEmail(
  order: any,
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
  } catch (err: any) {
    console.error(`[Zoho Mail] Error compiling or dispatching lifecycle email for #${order?.orderNumber}:`, err);
    return { success: false, error: err.message };
  }
}
