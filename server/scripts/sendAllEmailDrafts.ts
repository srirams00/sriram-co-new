import dns from 'dns';
dns.setServers(['8.8.8.8', '1.1.1.1']);

import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  compileOrderEmailHtml,
  compileMerchantCancellationEmailHtml,
  compileMerchantReturnEmailHtml,
  compileCustomerReturnAckEmailHtml,
  compileCustomerReturnResolutionEmailHtml,
  compilePasswordResetEmailHtml,
} from '../src/services/emailTemplates.js';
import { sendEmail } from '../src/services/emailService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const TARGET_EMAIL = 'ramkumar@sriramandco.in';

const sampleOrder = {
  orderNumber: 'SRC-202610-8901',
  customerInfo: {
    name: 'Ram Kumar',
    email: 'ramkumar@sriramandco.in',
    phone: '9345403136',
    address: '5 West Boulevard Road, Near Singaram Pillai School',
    city: 'Tiruchirappalli',
    postalCode: '620008',
  },
  orderItems: [
    {
      name: 'Prestige Deluxe Alpha Stainless Steel Pressure Cooker 3L',
      quantity: 1,
      price: 2450,
      image: 'https://images.unsplash.com/photo-1584269600464-37b1b58a9fe7?w=200',
    },
    {
      name: 'Vidiem Eva Vstar 750W Mixer Grinder (3 Jars)',
      quantity: 1,
      price: 3899,
      image: 'https://images.unsplash.com/photo-1544816155-12df9643f363?w=200',
    },
  ],
  pricing: {
    subtotal: 6349,
    shipping: 0,
    discount: 350,
    tax: 0,
    total: 5999,
  },
  paymentMethod: 'razorpay',
  paymentStatus: 'paid',
  razorpayPaymentId: 'pay_PreviewLiveDemo991',
  orderStatus: 'placed',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

const sampleReturnRequest = {
  status: 'requested' as const,
  item: {
    productId: 'prod_prestige_3l',
    name: 'Prestige Deluxe Alpha Stainless Steel Pressure Cooker 3L',
    quantity: 1,
    price: 2450,
    image: 'https://images.unsplash.com/photo-1584269600464-37b1b58a9fe7?w=200',
  },
  reason: 'Gasket leak / Defective pressure safety valve',
  faultDetails: 'Steam leaks from the side of the lid during boiling, safety valve whistle not engaging.',
  agreedToPolicy: true,
  requestedAt: new Date(),
};

async function run() {
  console.log(`Starting Transactional Email Previews Dispatch to ${TARGET_EMAIL}...\n`);

  const drafts: Array<{ name: string; getCompiled: () => { subject: string; html: string; text?: string } }> = [
    {
      name: '1. Order Placed (Customer Confirmation)',
      getCompiled: () => compileOrderEmailHtml(sampleOrder, 'placed'),
    },
    {
      name: '2. Order Confirmed (Trichy Store Allocation)',
      getCompiled: () => compileOrderEmailHtml(sampleOrder, 'confirmed'),
    },
    {
      name: '3. Order Processing (Packing & QC Check)',
      getCompiled: () => compileOrderEmailHtml(sampleOrder, 'processing'),
    },
    {
      name: '4. Order Shipped (Courier Dispatch & Tracking)',
      getCompiled: () => compileOrderEmailHtml(sampleOrder, 'shipped'),
    },
    {
      name: '5. Order Out for Delivery (Live Agent & Doorstep Verification)',
      getCompiled: () => compileOrderEmailHtml(sampleOrder, 'out_for_delivery', {
        driverName: 'Murugan K (Trichy Express Logistics)',
        driverPhone: '+91 94431 27658',
        deliveryWindow: 'today between 2:00 PM and 5:00 PM',
      }),
    },
    {
      name: '6. Order Delivered (With 5-Day Store Replacement Policy & Warranty Notice)',
      getCompiled: () => compileOrderEmailHtml(sampleOrder, 'delivered'),
    },
    {
      name: '7. Order Cancelled (Customer Confirmation & 5-7 Days Refund SLA)',
      getCompiled: () => compileOrderEmailHtml(sampleOrder, 'cancelled', {
        cancellationReason: 'Found lower price elsewhere / customer requested prior to dispatch',
        cancelledBy: 'customer',
      }),
    },
    {
      name: '8. Merchant Cancellation Alert (Urgent Pre-Dispatch Notification)',
      getCompiled: () => compileMerchantCancellationEmailHtml(sampleOrder, {
        reason: 'Found lower price elsewhere / customer requested prior to dispatch',
        cancelledBy: 'customer',
      }),
    },
    {
      name: '9. Customer Return Request Acknowledged (Pickup SLA 24-48 Hours)',
      getCompiled: () => compileCustomerReturnAckEmailHtml(sampleOrder, sampleReturnRequest),
    },
    {
      name: '10. Merchant Return Alert (Urgent Return Request Notice to Ramkumar)',
      getCompiled: () => compileMerchantReturnEmailHtml(sampleOrder, sampleReturnRequest),
    },
    {
      name: '11. Customer Return Resolution: Approved (Doorstep Reverse Pickup Scheduled)',
      getCompiled: () => compileCustomerReturnResolutionEmailHtml(
        sampleOrder,
        sampleReturnRequest,
        'approved',
        'Our courier partner Ecom Express will collect the boxed pressure cooker tomorrow between 11 AM - 3 PM.'
      ),
    },
    {
      name: '12. Customer Return Resolution: Refund Processed (₹2,450 Credited Back)',
      getCompiled: () => compileCustomerReturnResolutionEmailHtml(
        sampleOrder,
        sampleReturnRequest,
        'refunded',
        'Item inspected and verified at Trichy hub. Gateway refund ID rzp_rfnd_99281 settled to original UPI account.'
      ),
    },
    {
      name: '13. Customer Return Resolution: Rejected (Outside Replacement Terms)',
      getCompiled: () => compileCustomerReturnResolutionEmailHtml(
        sampleOrder,
        sampleReturnRequest,
        'rejected',
        'Product has physical impact dents not covered under manufacturing defect warranty.'
      ),
    },
    {
      name: '14. Security: Customer Password Recovery Reset Link',
      getCompiled: () => compilePasswordResetEmailHtml(
        'Ram Kumar',
        'https://www.sriramandco.in/reset-password?token=src_demo_sec_preview_99a8b7c6d5'
      ),
    },
  ];

  const results: Array<{ name: string; success: boolean; messageId?: string; error?: string }> = [];

  for (const draft of drafts) {
    try {
      const compiled = draft.getCompiled();
      console.log(`Sending: ${draft.name}`);
      console.log(`  Subject: ${compiled.subject}`);
      
      const result = await sendEmail({
        to: TARGET_EMAIL,
        subject: `[DRAFT PREVIEW] ${compiled.subject}`,
        html: compiled.html,
        text: compiled.text,
      });

      if (result.success) {
        console.log(`  -> Sent OK! MessageId: ${result.messageId} (Simulated: ${result.simulated || false})\n`);
        results.push({ name: draft.name, success: true, messageId: result.messageId });
      } else {
        console.warn(`  -> Failed: ${result.error || result.reason}\n`);
        results.push({ name: draft.name, success: false, error: result.error || result.reason });
      }

      // 600ms delay between emails to respect SMTP throughput limits
      await new Promise((r) => setTimeout(r, 600));
    } catch (err: any) {
      console.error(`  -> Exception on ${draft.name}:`, err.message);
      results.push({ name: draft.name, success: false, error: err.message });
    }
  }

  console.log('\n================== DISPATCH REPORT ==================');
  console.log(`Target: ${TARGET_EMAIL}`);
  console.log(`Total Templates: ${drafts.length}`);
  console.log(`Successfully Dispatched: ${results.filter((r) => r.success).length}`);
  console.log(`Failed: ${results.filter((r) => !r.success).length}`);
  console.log('====================================================\n');
}

run().catch((e) => {
  console.error('Fatal dispatch script failure:', e);
  process.exit(1);
});
