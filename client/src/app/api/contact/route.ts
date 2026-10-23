import { NextRequest, NextResponse } from 'next/server';
import { sendEmail } from '@/lib/emailService';
import {
  ContactFormData,
  compileOwnerNotificationEmail,
  compileCustomerAcknowledgmentEmail,
} from '@/lib/contactTemplates';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, phone, email, storeBranch, inquiryType, message } = body;

    // Validation
    if (!name || typeof name !== 'string' || name.trim().length < 2) {
      return NextResponse.json({ error: 'Name must be at least 2 characters.' }, { status: 400 });
    }

    if (!phone || typeof phone !== 'string' || phone.trim().replace(/[^0-9]/g, '').length < 10) {
      return NextResponse.json({ error: 'Please enter a valid 10-digit phone or WhatsApp number.' }, { status: 400 });
    }

    if (!message || typeof message !== 'string' || message.trim().length < 5) {
      return NextResponse.json({ error: 'Message must be at least 5 characters.' }, { status: 400 });
    }

    const payloadData: ContactFormData = {
      name: name.trim(),
      phone: phone.trim(),
      email: typeof email === 'string' && email.trim().length > 0 ? email.trim() : undefined,
      storeBranch: storeBranch || 'Trichy',
      inquiryType: inquiryType || 'Product Inquiry',
      message: message.trim(),
    };

    // 1. Dispatch email to store owner
    const storeOwnerEmail = process.env.STORE_OWNER_EMAIL || 'ramkumar@sriramandco.in';
    const ownerEmailContent = compileOwnerNotificationEmail(payloadData);

    const ownerResult = await sendEmail({
      to: storeOwnerEmail,
      subject: ownerEmailContent.subject,
      html: ownerEmailContent.html,
      text: ownerEmailContent.text,
      replyTo: payloadData.email || undefined,
    });

    if (!ownerResult.success) {
      console.error('[Contact] Failed to dispatch owner notification:', ownerResult.error);
      return NextResponse.json({ error: 'Failed to send inquiry email. Please try again or WhatsApp us.' }, { status: 500 });
    }

    // 2. Dispatch customer confirmation if email was provided
    if (payloadData.email) {
      const customerEmailContent = compileCustomerAcknowledgmentEmail(payloadData);
      sendEmail({
        to: payloadData.email,
        subject: customerEmailContent.subject,
        html: customerEmailContent.html,
        text: customerEmailContent.text,
        replyTo: storeOwnerEmail,
      }).catch((err) => {
        console.warn('[Contact] Non-fatal customer ack error:', err.message);
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Your inquiry has been submitted successfully. Our store team will reach out shortly.',
      messageId: ownerResult.messageId,
    });
  } catch (error: any) {
    console.error('[Contact API Error]:', error);
    return NextResponse.json({ error: error.message || 'An unexpected error occurred.' }, { status: 500 });
  }
}
