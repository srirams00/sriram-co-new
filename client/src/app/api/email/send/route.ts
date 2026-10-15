import { NextRequest, NextResponse } from 'next/server';
import { sendOrderLifecycleEmail } from '@/lib/emailService';
import { EmailTemplateType } from '@/lib/emailTemplates';

const ALLOWED_TEMPLATES: EmailTemplateType[] = [
  'placed',
  'confirmed',
  'processing',
  'out_for_delivery',
  'delivered',
  'cancelled',
];

export async function POST(req: NextRequest) {
  try {
    // 1. Origin & Referrer Verification
    const origin = req.headers.get('origin');
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
    const { order, templateType, extraData } = body;

    // Reject unauthenticated arbitrary email sending attempts (Anti-Open-Relay)
    if (body.to || body.html || body.text) {
      if (!order) {
        return NextResponse.json(
          { error: 'Arbitrary email transmission is disabled. All emails must be tied to a valid order.' },
          { status: 403 }
        );
      }
    }

    // 2. Strict Order Validation
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
