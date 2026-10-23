import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  compileOwnerNotificationEmail,
  compileCustomerAcknowledgmentEmail,
} from './contactTemplates';

describe('Client Contact Inquiry Email Suite', () => {
  it('compiles owner notification email with all customer contact attributes', () => {
    const data = {
      name: 'Ramesh Sundaram',
      phone: '9345403136',
      email: 'ramesh@example.com',
      storeBranch: 'Trichy',
      inquiryType: 'Product Inquiry',
      message: 'Looking for spare drum and roller stones for 2L grinder.',
    };

    const compiled = compileOwnerNotificationEmail(data);
    assert.ok(compiled.subject.includes('Product Inquiry'));
    assert.ok(compiled.subject.includes('Ramesh Sundaram'));
    assert.ok(compiled.subject.includes('Trichy'));

    assert.ok(compiled.html.includes('Ramesh Sundaram'));
    assert.ok(compiled.html.includes('9345403136'));
    assert.ok(compiled.html.includes('ramesh@example.com'));
    assert.ok(compiled.html.includes('Trichy'));
    assert.ok(compiled.html.includes('Looking for spare drum'));
    assert.ok(compiled.html.includes('wa.me/919345403136'));
  });

  it('compiles polite customer acknowledgment email with helpline reference', () => {
    const data = {
      name: 'Lakshmi Narayanan',
      phone: '9171314888',
      email: 'lakshmi@example.com',
      storeBranch: 'Chennai',
      inquiryType: 'Service Request',
      message: 'Need urgent belt replacement for Chennai shop.',
    };

    const ack = compileCustomerAcknowledgmentEmail(data);
    assert.ok(ack.subject.includes('Service Request'));
    assert.ok(ack.html.includes('Lakshmi Narayanan'));
    assert.ok(ack.html.includes('Chennai'));
    assert.ok(ack.html.includes('9171314888'));
    assert.ok(ack.html.includes('+91 93454 03136'));
  });
});
