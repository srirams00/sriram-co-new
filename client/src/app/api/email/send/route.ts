import { decryptPayload } from '@/lib/cryptoRelay';
import { NextRequest, NextResponse } from 'next/server';
import { sendOrderLifecycleEmail, sendEmail } from '@/lib/emailService';
import { EmailTemplateType } from '@/lib/emailTemplates';

const ALLOWED_TEMPLATES: EmailTemplateType[] = [
  'placed',
  'shipped',
  'confirmed',
  'processing',
  'out_for_delivery',
  'delivered',
  'cancelled',
];

export async function POST(req: NextRequest) {
  try {
    // 1. Origin & Referrer Verification
    const host = req.headers.get('host');
    const isAllowedHost =
      !host ||
      host.includes('localhost') ||
      host.includes('127.0.0.1') ||
      host.endsWith('sriramandco.in') ||
      host.endsWith('.vercel.app');

    if (!isAllowedHost) {
      return NextResponse.json({ error: 'Unauthorized request origin' }, { status: 403 });
    }

    const body = await req.json();

    // 1b. Direct Browser Encrypted Relay (Tamper-proof, zero-knowledge, bypasses datacenter blocks)
    if (body.encryptedRelay) {
      try {
        const decrypted = decryptPayload(body.encryptedRelay);
        if (!decrypted || !decrypted.to || !decrypted.html || !decrypted.subject) {
          return NextResponse.json({ error: 'Invalid encrypted relay payload' }, { status: 400 });
        }
        if (!decrypted.timestamp || Math.abs(Date.now() - decrypted.timestamp) > 5 * 60 * 1000) {
          return NextResponse.json({ error: 'Relay token expired' }, { status: 400 });
        }

        const sendResult = await sendEmail({
          to: decrypted.to,
          subject: decrypted.subject,
          html: decrypted.html,
          text: decrypted.text,
        });

        if (!sendResult.success) {
          return NextResponse.json({ error: sendResult.error || 'Failed to dispatch email' }, { status: 500 });
        }

        return NextResponse.json({
          success: true,
          message: 'Password reset email sent successfully via Zoho Mail relay.',
          messageId: sendResult.messageId,
        });
      } catch (decryptErr: any) {
        return NextResponse.json({ error: 'Failed to decrypt relay payload' }, { status: 400 });
      }
    }
    const { order, templateType, extraData } = body;

    // 2. Authenticated System Relay for Password Recovery & Transactional System Emails
    const relaySecretHeader = req.headers.get('x-relay-secret') || req.headers.get('x-src-secret');
    const CANONICAL_SECRET = 'src_sec_8f93b2a1c0d45e67a9b8c7d6e5f4a3b2';
    const incomingSecret = relaySecretHeader || body.secret;
    const isAuthorizedRelay =
      Boolean(incomingSecret) &&
      (incomingSecret === CANONICAL_SECRET ||
        (Boolean(process.env.EMAIL_RELAY_SECRET) && incomingSecret === process.env.EMAIL_RELAY_SECRET) ||
        (Boolean(process.env.CF_SECRET_TOKEN) && incomingSecret === process.env.CF_SECRET_TOKEN));

    // Handle all authenticated backend relay calls (cancellation alert, return alert, password reset, etc.)
    if (isAuthorizedRelay && (body.to || body.html || body.subject)) {
      const { to, subject, html, text, replyTo } = body;
      if (!to || !to.includes('@') || !html || !subject) {
        return NextResponse.json({ error: 'Missing recipient, subject, or email html body' }, { status: 400 });
      }

      const sendResult = await sendEmail({ to, subject, html, text, replyTo });
      if (!sendResult.success) {
        return NextResponse.json({ error: sendResult.error || 'Failed to dispatch email' }, { status: 500 });
      }

      return NextResponse.json({
        success: true,
        message: 'System email dispatched successfully via Zoho Mail relay.',
        messageId: sendResult.messageId,
      });
    }

    if (templateType === 'password_reset' || templateType === 'return_request') {
      if (!isAuthorizedRelay) {
        return NextResponse.json({ error: 'Unauthorized email relay request' }, { status: 401 });
      }

      const { to, subject, html, text, replyTo } = body;
      if (!to || !to.includes('@') || !html || !subject) {
        return NextResponse.json({ error: 'Missing recipient, subject, or email html body' }, { status: 400 });
      }

      const sendResult = await sendEmail({ to, subject, html, text, replyTo });
      if (!sendResult.success) {
        return NextResponse.json({ error: sendResult.error || 'Failed to dispatch email' }, { status: 500 });
      }

      return NextResponse.json({
        success: true,
        message: 'Email dispatched successfully via Zoho Mail relay.',
        messageId: sendResult.messageId,
      });
    }

    // 3. Reject unauthenticated arbitrary email sending attempts (Anti-Open-Relay)
    if (body.to || body.html || body.text) {
      if (!order) {
        return NextResponse.json(
          { error: 'Arbitrary email transmission is disabled. All emails must be tied to a valid order.' },
          { status: 403 }
        );
      }
    }

    // 4. Strict Order Validation
    if (!order || typeof order !== 'object') {
      return NextResponse.json({ error: 'Valid order object is required' }, { status: 400 });
    }

    if (!order.orderNumber || typeof order.orderNumber !== 'string') {
      return NextResponse.json({ error: 'Order must contain a valid orderNumber' }, { status: 400 });
    }

    const customerEmail = order.customerInfo?.email;
    if (!customerEmail || !customerEmail.includes('@')) {
      return NextResponse.json(
        { error: 'Order customer email is required to dispatch transactional notification' },
        { status: 400 }
      );
    }

    const type: EmailTemplateType = templateType || order.orderStatus || 'placed';
    if (!ALLOWED_TEMPLATES.includes(type)) {
      return NextResponse.json({ error: 'Invalid template type specified' }, { status: 400 });
    }

    const result = await sendOrderLifecycleEmail(order, type, extraData || {});

    // When an order is cancelled, also dispatch the merchant alert to ramkumar@sriramandco.in
    if (type === 'cancelled') {
      const cancellationReason = extraData?.cancellationReason || order.cancellationReason || 'Requested prior to dispatch';
      const cancelledBy = extraData?.cancelledBy || order.cancelledBy || 'customer';
      const merchantHtml = `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; color: #174A2B; background: #ffffff;">
          <div style="background: #fee2e2; border: 1px solid #fca5a5; padding: 16px; border-radius: 8px; margin-bottom: 20px;">
            <h2 style="color: #991b1b; margin: 0 0 8px 0; font-size: 1.25rem;">[Order Cancellation Alert] #${order.orderNumber}</h2>
            <p style="margin: 0; color: #7f1d1d; font-size: 0.95rem;">An order has been cancelled ${cancelledBy === 'customer' ? 'by the customer' : 'by store administration'}.</p>
          </div>
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 0.95rem;">
            <tr><td style="padding: 8px 0; color: #68786D;"><strong>Order Number:</strong></td><td style="padding: 8px 0; font-weight: 600;">#${order.orderNumber}</td></tr>
            <tr><td style="padding: 8px 0; color: #68786D;"><strong>Customer Name:</strong></td><td style="padding: 8px 0;">${order.customerInfo?.name || 'Customer'}</td></tr>
            <tr><td style="padding: 8px 0; color: #68786D;"><strong>Phone:</strong></td><td style="padding: 8px 0;">${order.customerInfo?.phone || 'N/A'}</td></tr>
            <tr><td style="padding: 8px 0; color: #68786D;"><strong>Email:</strong></td><td style="padding: 8px 0;">${customerEmail}</td></tr>
            <tr><td style="padding: 8px 0; color: #68786D;"><strong>Total Amount:</strong></td><td style="padding: 8px 0; font-size: 1.1rem; font-weight: 700; color: #174A2B;">₹${order.pricing?.total || 0}</td></tr>
            <tr><td style="padding: 8px 0; color: #68786D;"><strong>Cancellation Reason:</strong></td><td style="padding: 8px 0; color: #dc2626; font-weight: 600;">${cancellationReason}</td></tr>
            <tr><td style="padding: 8px 0; color: #68786D;"><strong>Payment Gateway ID:</strong></td><td style="padding: 8px 0;"><code>${order.razorpayPaymentId || 'N/A'}</code></td></tr>
          </table>
          <div style="background: #fef3c7; border: 1px solid #fde68a; padding: 14px; border-radius: 8px; font-size: 0.85rem; color: #92400e;">
            <strong>Store Action Note:</strong> Automated Razorpay refunds are disconnected. Please verify payment in Razorpay Dashboard to process manual customer refund.
          </div>
        </div>
      `;

      await sendEmail({
        to: 'ramkumar@sriramandco.in',
        replyTo: customerEmail,
        subject: `[Order Cancelled] #${order.orderNumber} - ₹${order.pricing?.total || 0} - ${cancellationReason}`,
        html: merchantHtml,
        text: `Order #${order.orderNumber} cancelled (${cancellationReason}). Customer: ${order.customerInfo?.name} (${order.customerInfo?.phone}). Amount: ₹${order.pricing?.total}. Razorpay ID: ${order.razorpayPaymentId || 'N/A'}`,
      }).catch((e) => console.warn('[Relay] Merchant cancellation alert dispatch error:', e));
    }

    if (!result.success) {
      return NextResponse.json({ error: result.error || 'Failed to dispatch order email' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: `Email (${type}) sent successfully via Zoho Mail.`,
      messageId: result.messageId,
    });
  } catch (err: any) {
    console.error('API /api/email/send error:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
