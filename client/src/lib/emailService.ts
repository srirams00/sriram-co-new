import nodemailer, { Transporter } from 'nodemailer';
import {
  compileOrderEmailHtml,
  EmailTemplateType,
  EmailMetadataOptions,
  CompiledEmail,
} from './emailTemplates';

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
  error?: string;
}

const SMTP_HOST = process.env.SMTP_HOST || 'smtppro.zoho.in';
const SMTP_PORT = Number(process.env.SMTP_PORT) || 465;
const SMTP_SECURE = process.env.SMTP_SECURE !== 'false';
const SMTP_USER = process.env.SMTP_USER || 'ramkumar@sriramandco.in';
const SMTP_PASS = process.env.SMTP_PASS || 'bJkg6TKzyNSb';
const EMAIL_FROM = { name: 'Sri Ram & Co', address: process.env.SMTP_USER || 'ramkumar@sriramandco.in' };

let cachedTransporter: Transporter | null = null;

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
      connectionTimeout: 10000,
      greetingTimeout: 10000,
      socketTimeout: 10000,
    });
  }
  return cachedTransporter;
}

export async function sendEmail(payload: SendEmailPayload): Promise<SendEmailResult> {
  const { to, subject, html, text, replyTo } = payload;

  if (!to || !to.includes('@')) {
    return { success: false, error: 'Invalid recipient email address' };
  }

  if (!SMTP_PASS) {
    console.warn('[Zoho Mail] SMTP_PASS is not configured in environment variables.');
    return { success: false, error: 'SMTP credentials not configured on server' };
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

    console.log(`[Zoho Mail Vercel] Email sent to ${to} (MessageId: ${info.messageId})`);
    return {
      success: true,
      messageId: info.messageId,
    };
  } catch (error: any) {
    console.error(`[Zoho Mail Vercel Error] Failed to send to ${to}:`, error.message);
    return {
      success: false,
      error: error.message || 'SMTP transmission failure',
    };
  }
}

export async function sendOrderLifecycleEmail(
  order: any,
  type: EmailTemplateType,
  options: EmailMetadataOptions = {}
): Promise<SendEmailResult> {
  try {
    const customerEmail = order.customerInfo?.email?.trim();

    if (!customerEmail || !customerEmail.includes('@')) {
      return { success: false, error: 'Order has no customer email address' };
    }

    const compiled: CompiledEmail = compileOrderEmailHtml(order, type, options);

    return await sendEmail({
      to: customerEmail,
      subject: compiled.subject,
      html: compiled.html,
      text: compiled.text,
    });
  } catch (err: any) {
    console.error(`[Zoho Mail] Error compiling or dispatching email:`, err);
    return { success: false, error: err.message };
  }
}
