import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  ContactInquirySchema,
  compileContactInquiryOwnerEmail,
  compileContactInquiryCustomerAckEmail,
} from '../routes/contactRoutes.js';

describe('Contact Section Inquiry & Email Notification Suite', () => {
  it('validates a complete and legitimate contact form submission', () => {
    const validData = {
      name: 'Anandha Krishnan',
      phone: '+91 94432 00000',
      email: 'anandha@example.com',
      storeBranch: 'Trichy' as const,
      inquiryType: 'Product Inquiry' as const,
      message: 'I would like to inquire about the commercial wet grinder 5L capacity.',
    };

    const parsed = ContactInquirySchema.parse(validData);
    assert.strictEqual(parsed.name, 'Anandha Krishnan');
    assert.strictEqual(parsed.storeBranch, 'Trichy');
    assert.strictEqual(parsed.inquiryType, 'Product Inquiry');
  });

  it('rejects submissions with missing or short names', () => {
    const invalidData = {
      name: 'A',
      phone: '+91 94432 00000',
      message: 'Hello, need help with mixer',
    };

    assert.throws(() => ContactInquirySchema.parse(invalidData));
  });

  it('rejects submissions with invalid phone numbers under 10 digits', () => {
    const invalidPhone = {
      name: 'Karthik',
      phone: '12345',
      message: 'Need price list',
    };

    assert.throws(() => ContactInquirySchema.parse(invalidPhone));
  });

  it('rejects submissions with message under 5 characters', () => {
    const shortMessage = {
      name: 'Karthik',
      phone: '+91 94432 00000',
      message: 'Hi',
    };

    assert.throws(() => ContactInquirySchema.parse(shortMessage));
  });

  it('compiles an informative owner email with WhatsApp link and store branch', () => {
    const inquiry = {
      name: 'Murugan Raja',
      phone: '98421 55555',
      email: 'murugan@example.com',
      storeBranch: 'Chennai' as const,
      inquiryType: 'Service Request' as const,
      message: 'My table top wet grinder motor has stopped spinning. Can I bring it to T. Nagar store?',
    };

    const compiled = compileContactInquiryOwnerEmail(inquiry);
    assert.ok(compiled.subject.includes('Service Request'));
    assert.ok(compiled.subject.includes('Murugan Raja'));
    assert.ok(compiled.subject.includes('Chennai'));

    assert.ok(compiled.html.includes('Murugan Raja'));
    assert.ok(compiled.html.includes('98421 55555'));
    assert.ok(compiled.html.includes('murugan@example.com'));
    assert.ok(compiled.html.includes('Chennai'));
    assert.ok(compiled.html.includes('Service Request'));
    assert.ok(compiled.html.includes('table top wet grinder motor'));
    assert.ok(compiled.html.includes('wa.me'));
  });

  it('compiles customer acknowledgment email when customer provides email address', () => {
    const inquiry = {
      name: 'Selva Kumar',
      phone: '94433 22222',
      email: 'selva@example.com',
      storeBranch: 'Trichy' as const,
      inquiryType: 'Bulk Order' as const,
      message: 'Need 10 units of 2L wet grinders for restaurant setup.',
    };

    const ack = compileContactInquiryCustomerAckEmail(inquiry);
    assert.ok(ack.subject.includes('Bulk Order'));
    assert.ok(ack.html.includes('Selva Kumar'));
    assert.ok(ack.html.includes('Trichy'));
    assert.ok(ack.html.includes('2 business hours'));
    assert.ok(ack.html.includes('94433 22222'));
  });
});
