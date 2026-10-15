import { NextRequest, NextResponse } from 'next/server';
import { sendOrderLifecycleEmail, sendEmail } from '@/lib/emailService';
import { EmailTemplateType } from '@/lib/emailTemplates';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { order, templateType, extraData, to, subject, html, text } = body;

    // Direct single email send
    if (to && (html || text)) {
      const result = await sendEmail({
        to,
        subject: subject || 'Notification from Sri Ram & Co',
        html: html || `<p>${text}</p>`,
        text,
      });

      if (!result.success) {
        return NextResponse.json({ error: result.error || 'Failed to dispatch email' }, { status: 500 });
      }

      return NextResponse.json({ success: true, messageId: result.messageId });
    }

    // Order lifecycle email send
    if (!order) {
      return NextResponse.json({ error: 'Order object is required' }, { status: 400 });
    }

    const type: EmailTemplateType = templateType || order.orderStatus || 'placed';
    const result = await sendOrderLifecycleEmail(order, type, extraData || {});

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
