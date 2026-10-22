/**
 * Server-Side Transactional Email Template Compiler for Sri Ram & Co
 * Generates universal, responsive, table-based HTML compatible with all major email clients.
 */

export type EmailTemplateType =
  | 'placed'
  | 'shipped'
  | 'confirmed'
  | 'processing'
  | 'out_for_delivery'
  | 'delivered'
  | 'cancelled';

export interface EmailMetadataOptions {
  driverName?: string;
  driverPhone?: string;
  deliveryWindow?: string;
  cancellationReason?: string;
  cancelledBy?: 'store' | 'customer';
  storeBranch?: string;
  expectedDelivery?: string;
}

export interface CompiledEmail {
  subject: string;
  html: string;
  text: string;
}

// Brand Design Constants
const THEME = {
  pageBg: '#fbfcfa',
  cardBg: '#ffffff',
  surfaceBg: '#f7faf7',
  iconBg: '#f4faf5',
  neutralBg: '#eef2ef',
  border: '#dce8de',
  green: '#147b3d',
  whatsapp: '#18a957',
  text: '#1c2b21',
  muted: '#617568',
  font: "'Poppins', Arial, Helvetica, sans-serif",
};

const STORE_CONFIG = {
  name: 'Sri Ram & Co',
  tagline: 'Reliable appliances, genuine products, direct store delivery across Tamil Nadu.',
  gstin: '33ARHPR6139B1ZX',
  phoneDisplay: '+91 93454 03136',
  telUrl: 'tel:+919345403136',
  whatsappUrl: 'https://wa.me/919345403136',
  siteUrl: 'https://sriram-co-new.vercel.app',
  stores: [
    {
      city: 'Trichy',
      address: 'No. 11, Vinola Complex, Thanjai Main Road, Trichy',
      hours: 'Mon–Sat 9:30 AM–8:30 PM, Sun 10 AM–2 PM',
    },
    {
      city: 'Chennai',
      address: 'No. 99/2, Kothaval Chavadi Street, West Saidapet, Chennai',
      hours: 'Mon–Sun 10 AM–9 PM',
    },
  ],
};

function formatCurrency(amount: number): string {
  return `₹${Number(amount || 0).toLocaleString('en-IN')}`;
}

function escapeHtml(text: string): string {
  if (!text) return '';
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export interface OrderEmailData {
  orderNumber?: string;
  customerInfo?: {
    name?: string;
    email?: string;
    phone?: string;
    address?: string;
    city?: string;
    postalCode?: string;
  };
  orderItems?: Array<{
    name?: string;
    price?: number;
    quantity?: number;
    image?: string;
  }>;
  pricing?: {
    subtotal?: number;
    deliveryFee?: number;
    discount?: number;
    total?: number;
  };
  orderStatus?: string;
  paymentMethod?: string;
  paymentStatus?: string;
  razorpayPaymentId?: string;
  createdAt?: string | Date;
}

/**
 * Compiles a full HTML email for an order and a given lifecycle stage.
 */
export function compileOrderEmailHtml(
  order: OrderEmailData,
  type: EmailTemplateType,
  options: EmailMetadataOptions = {}
): CompiledEmail {
  const customerName = order.customerInfo?.name || 'Valued Customer';
  const firstName = customerName.split(' ')[0] || customerName;
  const orderNumber = order.orderNumber || 'SR-000000';
  const items = order.orderItems || [];
  const defaultSubtotal = items.reduce(
    (s: number, i: { price?: number; quantity?: number }) => s + ((i.price || 0) * (i.quantity || 1)),
    0
  );
  const pricing = {
    subtotal: order.pricing?.subtotal ?? defaultSubtotal,
    deliveryFee: order.pricing?.deliveryFee ?? 0,
    total: order.pricing?.total ?? defaultSubtotal,
  };
  const storeBranch = options.storeBranch || order.customerInfo?.city || 'Trichy';
  const expectedDelivery = options.expectedDelivery || 'in 1–2 business days';

  let subject = '';
  let preheader = '';
  let statusTitle = '';
  let statusBodyHtml = '';
  let progressStep = 0; // 1 = order placed, 2 = shipped, 3 = out for delivery, 4 = delivered
  let showHighlightCard = false;
  let showDriverCard = false;
  let showNumberedList = false;
  let showWarrantyNotice = false;
  let isCancelled = false;

  const driverName = options.driverName || 'Murugan';
  const driverPhone = options.driverPhone || '+91 94431 27658';
  const deliveryWindow = options.deliveryWindow || 'today between 2 PM and 5 PM';
  const cancellationReason = options.cancellationReason || 'Requested by customer / item temporarily out of stock';

  switch (type) {
    case 'placed':
      subject = `We’ve received your order ${orderNumber} | Sri Ram & Co`;
      preheader = 'We’ll call you shortly to confirm it.';
      statusTitle = `Thanks, ${escapeHtml(firstName)}. We’ve got your order.`;
      statusBodyHtml = `Your order has been placed. Our store fulfillment team is verifying the products and delivery schedule. Please keep your phone nearby.`;
      progressStep = 1;
      break;

    case 'shipped':
      subject = `Your order ${orderNumber} has shipped | Sri Ram & Co`;
      preheader = `Expected delivery ${expectedDelivery}.`;
      statusTitle = `Your order has shipped.`;
      statusBodyHtml = `Your order has been dispatched from our ${escapeHtml(storeBranch)} store and is moving through our delivery process. We’ll notify you when it is out for delivery.`;
      progressStep = 2;
      showHighlightCard = true;
      break;

    case 'confirmed':
      subject = `Your order ${orderNumber} is confirmed | Sri Ram & Co`;
      preheader = `Expected delivery ${expectedDelivery}.`;
      statusTitle = `Your order is confirmed.`;
      statusBodyHtml = `Thanks for confirming with us, ${escapeHtml(firstName)}. We’ll pack it at our ${escapeHtml(storeBranch)} store and deliver it directly to your door.`;
      progressStep = 2;
      showHighlightCard = true;
      break;

    case 'processing':
      subject = `We’re packing your order ${orderNumber} | Sri Ram & Co`;
      preheader = 'Checked, packed and nearly ready to dispatch.';
      statusTitle = `We’re getting your order ready.`;
      statusBodyHtml = `Our store team is inspecting and safely packing your items at the ${escapeHtml(storeBranch)} store. We’ll notify you as soon as the driver leaves.`;
      progressStep = 2;
      break;

    case 'out_for_delivery':
      subject = `Your order ${orderNumber} is on its way | Sri Ram & Co`;
      preheader = `Arriving ${deliveryWindow}. Please keep your phone nearby.`;
      statusTitle = `Your order is on its way.`;
      statusBodyHtml = `${escapeHtml(driverName)} from our store is bringing your order to you and will call when nearby.`;
      progressStep = 3;
      showDriverCard = true;
      showNumberedList = true;
      break;

    case 'delivered':
      subject = `Delivered: your order ${orderNumber} | Sri Ram & Co`;
      preheader = 'Thank you for shopping with Sri Ram & Co.';
      statusTitle = `Your order has been delivered.`;
      statusBodyHtml = `Thank you, ${escapeHtml(firstName)}. We hope you enjoy your new appliances!`;
      progressStep = 4;
      showWarrantyNotice = true;
      break;

    case 'cancelled':
      subject = `Your order ${orderNumber} has been cancelled | Sri Ram & Co`;
      preheader = 'Here’s what this means for your payment.';
      statusTitle = `Your order has been cancelled.`;
      statusBodyHtml = `We’ve cancelled order <strong>${escapeHtml(orderNumber)}</strong>. Reason: <em>${escapeHtml(cancellationReason)}</em>`;
      isCancelled = true;
      break;
  }

  // Compile Items HTML
  const itemsRowsHtml = items
    .map(
      (item: { image?: string; name?: string; quantity?: number; price?: number }, idx: number) => {
        const itemImg = item.image || 'https://images.unsplash.com/photo-1584269600464-37b1b58a9fe7?w=100';
        const itemName = item.name || 'Item';
        const itemQty = item.quantity || 1;
        const itemPrice = item.price || 0;
        return `
      <tr>
        <td style="width: 52px; padding: 12px 0; border-top: ${idx === 0 ? 'none' : `1px solid ${THEME.border}`}; vertical-align: middle;">
          <img src="${escapeHtml(itemImg)}" alt="${escapeHtml(itemName)}" width="52" height="52" style="display: block; border-radius: 8px; border: 1px solid ${THEME.border}; object-fit: cover;" />
        </td>
        <td style="padding: 12px 14px; border-top: ${idx === 0 ? 'none' : `1px solid ${THEME.border}`}; vertical-align: middle; font-family: ${THEME.font};">
          <p style="margin: 0; font-size: 14px; line-height: 1.4; font-weight: 600; color: ${isCancelled ? THEME.muted : THEME.text};">${escapeHtml(itemName)}</p>
          <p style="margin: 2px 0 0; font-size: 13px; color: ${THEME.muted};">Qty ${itemQty}${itemQty > 1 ? ` · ${formatCurrency(itemPrice)} each` : ''}</p>
        </td>
        <td style="padding: 12px 0; border-top: ${idx === 0 ? 'none' : `1px solid ${THEME.border}`}; vertical-align: middle; text-align: right; font-family: ${THEME.font}; font-size: 14px; font-weight: 600; color: ${isCancelled ? THEME.muted : THEME.text}; white-space: nowrap;">
          ${formatCurrency(itemPrice * itemQty)}
        </td>
      </tr>`;
      }
    )
    .join('');

  // Progress Bar HTML (Omitted on cancelled orders)
  const progressSteps = ['Order Placed', 'Shipped', 'Out for Delivery', 'Delivered'];
  const progressHtml = isCancelled
    ? ''
    : `
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin: 24px 0 20px;">
      <tr>
        ${progressSteps
          .map((label, i) => {
            const isDone = i < progressStep;
            const isCurrent = i === progressStep - 1;
            const circleColor = isDone ? THEME.green : isCurrent ? '#ffffff' : THEME.neutralBg;
            const borderColor = isDone || isCurrent ? THEME.green : THEME.border;
            const textColor = isCurrent ? THEME.text : isDone ? THEME.text : THEME.muted;
            const dotContent = isDone
              ? '&#10003;'
              : isCurrent
              ? `<span style="display:inline-block;width:8px;height:8px;border-radius:999px;background:${THEME.green};"></span>`
              : '';

            return `
            <td align="center" style="vertical-align: top; width: 25%;">
              <div style="width: 26px; height: 26px; border-radius: 999px; background: ${circleColor}; border: 2px solid ${borderColor}; line-height: 24px; text-align: center; color: #ffffff; font-size: 12px; font-weight: 700; margin: 0 auto;">
                ${dotContent}
              </div>
              <p style="margin: 6px 0 0; font-family: ${THEME.font}; font-size: 12px; font-weight: ${isCurrent ? '700' : '500'}; color: ${textColor}; line-height: 1.3;">${label}</p>
            </td>`;
          })
          .join('')}
      </tr>
    </table>`;

  // Highlight Card for Confirmed
  const highlightCardHtml = showHighlightCard
    ? `
    <div style="border: 1px solid ${THEME.border}; border-radius: 12px; padding: 14px 18px; margin: 18px 0; background: #ffffff;">
      <table role="presentation" width="100%">
        <tr>
          <td style="width: 60%; vertical-align: top;">
            <span style="font-size: 12px; color: ${THEME.muted}; text-transform: uppercase; font-weight: 600; letter-spacing: 0.5px;">Expected delivery</span>
            <p style="margin: 3px 0 0; font-size: 16px; font-weight: 700; color: ${THEME.text};">${escapeHtml(expectedDelivery)}</p>
          </td>
          <td style="border-left: 1px solid ${THEME.border}; padding-left: 16px; vertical-align: top;">
            <span style="font-size: 12px; color: ${THEME.muted}; text-transform: uppercase; font-weight: 600; letter-spacing: 0.5px;">Delivery</span>
            <p style="margin: 3px 0 0; font-size: 16px; font-weight: 700; color: ${THEME.green};">${pricing.deliveryFee > 0 ? formatCurrency(pricing.deliveryFee) : 'Free Direct Delivery'}</p>
          </td>
        </tr>
      </table>
    </div>`
    : '';

  // Driver Card for Out For Delivery
  const driverCardHtml = showDriverCard
    ? `
    <div style="background: ${THEME.surfaceBg}; border: 1px solid ${THEME.border}; border-radius: 12px; padding: 16px 20px; margin: 18px 0;">
      <table role="presentation" width="100%">
        <tr>
          <td style="width: 44px; vertical-align: middle;">
            <div style="width: 44px; height: 44px; border-radius: 999px; background: ${THEME.iconBg}; border: 1px solid ${THEME.border}; text-align: center; line-height: 44px; font-size: 18px; font-weight: 700; color: ${THEME.green}; font-family: ${THEME.font};">
              ${escapeHtml(driverName.charAt(0).toUpperCase())}
            </div>
          </td>
          <td style="padding: 0 14px; vertical-align: middle; font-family: ${THEME.font};">
            <p style="margin: 0; font-size: 15px; font-weight: 700; color: ${THEME.text};">${escapeHtml(driverName)} (Store Dispatch)</p>
            <p style="margin: 2px 0 0; font-size: 13px; color: ${THEME.muted};">${escapeHtml(driverPhone)} · Arriving <strong>${escapeHtml(deliveryWindow)}</strong></p>
          </td>
          <td style="text-align: right; vertical-align: middle;">
            <a href="tel:${escapeHtml(driverPhone.replace(/\s+/g, ''))}" style="display: inline-block; padding: 8px 18px; border-radius: 999px; border: 1px solid ${THEME.green}; color: ${THEME.green}; text-decoration: none; font-weight: 600; font-size: 13px; font-family: ${THEME.font};">Call Driver</a>
          </td>
        </tr>
      </table>
    </div>`
    : '';

  // Numbered Checklist for Delivery Steps
  const numberedListHtml = showNumberedList
    ? `
    <div style="margin: 20px 0;">
      <h3 style="margin: 0 0 10px; font-size: 14px; font-weight: 700; color: ${THEME.text}; font-family: ${THEME.font};">At the door</h3>
      <table role="presentation" width="100%" style="font-family: ${THEME.font}; font-size: 13px; line-height: 1.5; color: ${THEME.text};">
        <tr>
          <td style="width: 24px; vertical-align: top; padding-bottom: 8px;"><div style="width: 20px; height: 20px; border-radius: 999px; background: ${THEME.iconBg}; color: ${THEME.green}; text-align: center; line-height: 20px; font-weight: 700; font-size: 11px;">1</div></td>
          <td style="padding-left: 8px; padding-bottom: 8px;">Check the parcel in front of the delivery person; tell us right away if anything looks damaged.</td>
        </tr>
        <tr>
          <td style="width: 24px; vertical-align: top; padding-bottom: 8px;"><div style="width: 20px; height: 20px; border-radius: 999px; background: ${THEME.iconBg}; color: ${THEME.green}; text-align: center; line-height: 20px; font-weight: 700; font-size: 11px;">2</div></td>
          <td style="padding-left: 8px; padding-bottom: 8px;">All online payments are verified. No additional cash collection is required at door.</td>
        </tr>
        <tr>
          <td style="width: 24px; vertical-align: top;"><div style="width: 20px; height: 20px; border-radius: 999px; background: ${THEME.iconBg}; color: ${THEME.green}; text-align: center; line-height: 20px; font-weight: 700; font-size: 11px;">3</div></td>
          <td style="padding-left: 8px;">Sign the digital or paper delivery slip to confirm safe handover.</td>
        </tr>
      </table>
    </div>`
    : '';

  // Warranty and Returns info for Delivered
  const warrantyNoticeHtml = showWarrantyNotice
    ? `
    <div style="border-top: 1px solid ${THEME.border}; margin: 20px 0; padding-top: 16px; font-family: ${THEME.font};">
      <table role="presentation" width="100%">
        <tr>
          <td style="width: 50%; vertical-align: top; padding-right: 12px;">
            <p style="margin: 0; font-size: 13px; font-weight: 700; color: ${THEME.text};">7-Day Store Replacement</p>
            <p style="margin: 4px 0 0; font-size: 12px; color: ${THEME.muted}; line-height: 1.5;">If any item is damaged or faulty within 7 days of delivery, contact our store directly for immediate replacement.</p>
            <a href="${STORE_CONFIG.siteUrl}/refund-policy" style="display: inline-block; margin-top: 6px; font-size: 12px; font-weight: 600; color: ${THEME.green}; text-decoration: underline;">Returns &amp; Refunds</a>
          </td>
          <td style="width: 50%; vertical-align: top; padding-left: 12px; border-left: 1px solid ${THEME.border};">
            <p style="margin: 0; font-size: 13px; font-weight: 700; color: ${THEME.text};">Keep Your GST Invoice</p>
            <p style="margin: 4px 0 0; font-size: 12px; color: ${THEME.muted}; line-height: 1.5;">Retain your tax invoice for 1-year brand authorized manufacturer warranty coverage across Tamil Nadu.</p>
            <a href="${STORE_CONFIG.siteUrl}/warranty-policy" style="display: inline-block; margin-top: 6px; font-size: 12px; font-weight: 600; color: ${THEME.green}; text-decoration: underline;">Warranty Policy</a>
          </td>
        </tr>
      </table>
    </div>`
    : '';

  // Cancellation Refund Box
  const cancellationBoxHtml = isCancelled
    ? `
    <div style="background: ${THEME.surfaceBg}; border: 1px solid ${THEME.border}; border-radius: 12px; padding: 16px 20px; margin: 18px 0; font-family: ${THEME.font};">
      <p style="margin: 0; font-size: 13px; font-weight: 700; color: ${THEME.text};">Refund Status</p>
      <p style="margin: 6px 0 0; font-size: 13px; color: ${THEME.text}; line-height: 1.5;">
        ${order.paymentStatus === 'paid'
          ? `We’ll refund <strong>${formatCurrency(pricing.total)}</strong> to your original payment method within 5–7 working days.`
          : 'No payment was captured for this order, so no refund is necessary.'}
      </p>
    </div>`
    : '';

  // Primary Call-To-Action Button
  const ctaUrl = isCancelled ? `${STORE_CONFIG.siteUrl}/shop` : `${STORE_CONFIG.siteUrl}/orders`;
  const ctaLabel = isCancelled ? 'Continue Shopping' : 'Track Your Order';
  const ctaButtonHtml = `
    <div style="text-align: center; margin: 28px 0 20px;">
      <a href="${ctaUrl}" style="display: inline-block; background: ${THEME.green}; color: #ffffff; text-decoration: none; padding: 13px 36px; border-radius: 999px; font-family: ${THEME.font}; font-size: 14px; font-weight: 700; letter-spacing: 0.3px;">
        ${ctaLabel}
      </a>
    </div>`;

  // Full HTML Construction
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(subject)}</title>
  <!--[if mso]>
  <style type="text/css">
    body, table, td { font-family: Arial, Helvetica, sans-serif !important; }
  </style>
  <![endif]-->
</head>
<body style="margin: 0; padding: 0; background-color: ${THEME.pageBg}; font-family: ${THEME.font}; color: ${THEME.text}; -webkit-font-smoothing: antialiased;">
  <!-- Preheader preview text (hidden from view) -->
  <div style="display: none; max-height: 0px; overflow: hidden; opacity: 0; font-size: 1px; line-height: 1px; color: #fff;">
    ${escapeHtml(preheader)} &#847; &zwnj; &nbsp;
  </div>

  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color: ${THEME.pageBg}; padding: 24px 12px;">
    <tr>
      <td align="center">
        <!-- Main Card Container (max-width 600px) -->
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="max-width: 600px; background-color: ${THEME.cardBg}; border: 1px solid ${THEME.border}; border-radius: 16px; overflow: hidden; border-collapse: separate;">
          
          <!-- Header -->
          <tr>
            <td style="padding: 20px 28px; border-bottom: 1px solid ${THEME.border};">
              <table role="presentation" width="100%">
                <tr>
                  <td style="vertical-align: middle;">
                    <a href="${STORE_CONFIG.siteUrl}" style="text-decoration: none; color: ${THEME.text}; display: inline-block;">
                      <table role="presentation" cellpadding="0" cellspacing="0">
                        <tr>
                          <td style="width: 32px; height: 32px; background: ${THEME.green}; border-radius: 8px; text-align: center; vertical-align: middle; color: #ffffff; font-weight: 700; font-size: 18px; line-height: 32px; font-family: ${THEME.font};">S</td>
                          <td style="padding-left: 10px; font-size: 17px; font-weight: 700; color: ${THEME.text}; font-family: ${THEME.font};">Sri Ram &amp; Co</td>
                        </tr>
                      </table>
                    </a>
                  </td>
                  <td style="text-align: right; vertical-align: middle; font-family: ${THEME.font}; font-size: 13px; color: ${THEME.muted};">
                    Order <strong>#${escapeHtml(orderNumber)}</strong>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Main Body -->
          <tr>
            <td style="padding: 28px 28px 20px;">
              <!-- Status Header -->
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 16px;">
                <tr>
                  <td style="width: 48px; height: 48px; border-radius: 999px; background: ${isCancelled ? THEME.neutralBg : THEME.iconBg}; text-align: center; vertical-align: middle; font-size: 20px;">
                    ${isCancelled ? '&#10005;' : '&#128722;'}
                  </td>
                </tr>
              </table>
              <h1 style="margin: 0 0 10px; font-size: 22px; font-weight: 700; color: ${THEME.text}; font-family: ${THEME.font}; line-height: 1.3;">
                ${statusTitle}
              </h1>
              <p style="margin: 0 0 16px; font-size: 14px; line-height: 1.6; color: ${THEME.muted}; font-family: ${THEME.font};">
                ${statusBodyHtml}
              </p>

              <!-- Progress Indicator -->
              ${progressHtml}

              <!-- Highlight Cards -->
              ${highlightCardHtml}
              ${driverCardHtml}
              ${numberedListHtml}
              ${cancellationBoxHtml}

              <!-- Order Summary Section -->
              <div style="background: ${THEME.surfaceBg}; border-radius: 12px; padding: 18px 20px; margin: 20px 0;">
                <table role="presentation" width="100%">
                  <tr>
                    <td style="font-family: ${THEME.font}; font-size: 14px; font-weight: 700; color: ${THEME.text};">${isCancelled ? 'Cancelled Items' : 'Order Summary'}</td>
                    <td style="text-align: right; font-family: ${THEME.font}; font-size: 12px; color: ${THEME.muted};">Placed on ${new Date(order.createdAt || Date.now()).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</td>
                  </tr>
                </table>

                <table role="presentation" width="100%" style="margin-top: 8px;">
                  ${itemsRowsHtml}
                </table>

                <!-- Pricing Rows -->
                <table role="presentation" width="100%" style="border-top: 1px solid ${THEME.border}; margin-top: 8px;">
                  <tr>
                    <td style="padding-top: 12px; font-family: ${THEME.font}; font-size: 13px; color: ${THEME.muted};">Subtotal</td>
                    <td style="padding-top: 12px; font-family: ${THEME.font}; font-size: 13px; text-align: right; color: ${THEME.text}; font-weight: 600;">${formatCurrency(pricing.subtotal)}</td>
                  </tr>
                  <tr>
                    <td style="padding-top: 6px; font-family: ${THEME.font}; font-size: 13px; color: ${THEME.muted};">Delivery Fee</td>
                    <td style="padding-top: 6px; font-family: ${THEME.font}; font-size: 13px; text-align: right; color: ${pricing.deliveryFee > 0 ? THEME.text : THEME.green}; font-weight: 600;">
                      ${pricing.deliveryFee > 0 ? formatCurrency(pricing.deliveryFee) : 'Free Direct Store Delivery'}
                    </td>
                  </tr>
                  <tr>
                    <td style="padding-top: 10px; font-family: ${THEME.font}; font-size: 16px; font-weight: 700; color: ${THEME.text};">Total</td>
                    <td style="padding-top: 10px; font-family: ${THEME.font}; font-size: 16px; font-weight: 700; text-align: right; color: ${THEME.green};">
                      ${formatCurrency(pricing.total)}
                    </td>
                  </tr>
                </table>
              </div>

              <!-- Delivery & Payment Meta Columns -->
              <table role="presentation" width="100%" style="margin: 20px 0; font-family: ${THEME.font}; font-size: 13px; line-height: 1.5;">
                <tr>
                  <td style="width: 50%; vertical-align: top; padding-right: 12px;">
                    <span style="font-size: 11px; text-transform: uppercase; font-weight: 700; color: ${THEME.muted}; letter-spacing: 0.5px;">Delivery Address</span>
                    <p style="margin: 4px 0 0; font-weight: 600; color: ${THEME.text};">${escapeHtml(order.customerInfo?.name || '')}</p>
                    <p style="margin: 2px 0 0; color: ${THEME.muted};">${escapeHtml(order.customerInfo?.address || '')}</p>
                    <p style="margin: 2px 0 0; color: ${THEME.muted};">${escapeHtml(order.customerInfo?.city || '')} ${escapeHtml(order.customerInfo?.postalCode || '')}</p>
                    <p style="margin: 2px 0 0; color: ${THEME.green}; font-weight: 600;">Ph: ${escapeHtml(order.customerInfo?.phone || '')}</p>
                  </td>
                  <td style="width: 50%; vertical-align: top; padding-left: 12px; border-left: 1px solid ${THEME.border};">
                    <span style="font-size: 11px; text-transform: uppercase; font-weight: 700; color: ${THEME.muted}; letter-spacing: 0.5px;">Payment Details</span>
                    <p style="margin: 4px 0 0; font-weight: 600; color: ${THEME.text};">${order.paymentMethod === 'razorpay' ? 'Online Payment (Razorpay)' : String(order.paymentMethod || 'Online').toUpperCase()}</p>
                    <p style="margin: 2px 0 0; color: ${THEME.muted};">Status: <strong style="color: ${order.paymentStatus === 'paid' ? THEME.green : THEME.muted};">${String(order.paymentStatus || 'pending').toUpperCase()}</strong></p>
                    ${order.razorpayPaymentId ? `<p style="margin: 2px 0 0; font-size: 11px; color: ${THEME.muted};">Ref: ${escapeHtml(order.razorpayPaymentId)}</p>` : ''}
                  </td>
                </tr>
              </table>

              <!-- Warranty / Post-delivery Info -->
              ${warrantyNoticeHtml}

              <!-- CTA Button -->
              ${ctaButtonHtml}
            </td>
          </tr>

          <!-- Help / Store Support Strip -->
          <tr>
            <td style="padding: 0 28px 24px;">
              <div style="background: ${THEME.surfaceBg}; border-radius: 12px; padding: 18px 20px; font-family: ${THEME.font};">
                <p style="margin: 0; font-size: 14px; font-weight: 600; color: ${THEME.text};">Questions about your order?</p>
                <p style="margin: 4px 0 12px; font-size: 13px; color: ${THEME.muted};">Call us directly or message our store assistants on WhatsApp:</p>
                <table role="presentation" cellpadding="0" cellspacing="0">
                  <tr>
                    <td>
                      <a href="${STORE_CONFIG.telUrl}" style="display: inline-block; padding: 7px 16px; border-radius: 999px; border: 1px solid ${THEME.green}; color: ${THEME.green}; text-decoration: none; font-size: 12px; font-weight: 700; margin-right: 8px;">Call Store</a>
                    </td>
                    <td>
                      <a href="${STORE_CONFIG.whatsappUrl}" style="display: inline-block; padding: 7px 16px; border-radius: 999px; background: ${THEME.whatsapp}; color: #ffffff; text-decoration: none; font-size: 12px; font-weight: 700;">WhatsApp Us</a>
                    </td>
                  </tr>
                </table>
              </div>
            </td>
          </tr>
        </table>

        <!-- Footer -->
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="max-width: 600px; padding: 24px 16px; font-family: ${THEME.font}; font-size: 12px; color: ${THEME.muted}; line-height: 1.6;">
          <tr>
            <td align="center">
              <p style="margin: 0; font-weight: 700; color: ${THEME.text}; font-size: 13px;">Sri Ram &amp; Co</p>
              <p style="margin: 4px 0 10px; max-width: 440px;">${STORE_CONFIG.tagline}</p>

              <!-- Policy Links -->
              <p style="margin: 8px 0 14px;">
                <a href="${STORE_CONFIG.siteUrl}/orders" style="color: ${THEME.green}; text-decoration: none; margin: 0 6px;">Track Order</a> &bull;
                <a href="${STORE_CONFIG.siteUrl}/refund-policy" style="color: ${THEME.green}; text-decoration: none; margin: 0 6px;">Returns &amp; Refunds</a> &bull;
                <a href="${STORE_CONFIG.siteUrl}/shipping-policy" style="color: ${THEME.green}; text-decoration: none; margin: 0 6px;">Shipping</a> &bull;
                <a href="${STORE_CONFIG.siteUrl}/warranty-policy" style="color: ${THEME.green}; text-decoration: none; margin: 0 6px;">Warranty</a> &bull;
                <a href="${STORE_CONFIG.siteUrl}/terms" style="color: ${THEME.green}; text-decoration: none; margin: 0 6px;">Terms</a>
              </p>

              <!-- Physical Store Locations -->
              <div style="border-top: 1px solid ${THEME.border}; padding-top: 12px; margin-top: 8px; font-size: 11px;">
                <p style="margin: 2px 0;"><strong>Trichy Hub:</strong> ${STORE_CONFIG.stores[0].address} (${STORE_CONFIG.stores[0].hours})</p>
                <p style="margin: 2px 0;"><strong>Chennai Hub:</strong> ${STORE_CONFIG.stores[1].address} (${STORE_CONFIG.stores[1].hours})</p>
                <p style="margin: 8px 0 2px;">GSTIN <strong>${STORE_CONFIG.gstin}</strong> &bull; Verified Merchant</p>
                <p style="margin: 4px 0 0;">&copy; 2026 Sri Ram &amp; Co. All rights reserved.</p>
              </div>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  const text = `${subject}\n\n${statusTitle}\n\n${statusBodyHtml.replace(/<[^>]+>/g, '')}\n\nOrder #${orderNumber}\nTotal: ${formatCurrency(pricing.total)}\n\nTrack your order at: ${ctaUrl}\nSri Ram & Co | GSTIN ${STORE_CONFIG.gstin}`;

  return { subject, html, text };
}


/**
 * Compiles a branded, responsive password reset email for Sri Ram & Co customers.
 */
export function compilePasswordResetEmailHtml(name: string, resetUrl: string): CompiledEmail {
  const firstName = (name || 'Customer').trim().split(' ')[0];
  const subject = `Reset your Sri Ram & Co password`;
  const text = `Hello ${firstName},\n\nWe received a request to reset your password for your Sri Ram & Co account.\n\nPlease visit the link below to set a new password:\n${resetUrl}\n\nThis link is valid for 1 hour. If you did not request this, you can safely ignore this email.\n\nSri Ram & Co Customer Care: ${STORE_CONFIG.phoneDisplay}\nGSTIN: ${STORE_CONFIG.gstin}`;

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(subject)}</title>
</head>
<body style="margin: 0; padding: 0; background-color: ${THEME.pageBg}; font-family: ${THEME.font}; color: ${THEME.text};">
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color: ${THEME.pageBg}; padding: 32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="max-width: 600px; background-color: ${THEME.cardBg}; border: 1px solid ${THEME.border}; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.03);">
          <!-- Header -->
          <tr>
            <td style="background-color: ${THEME.green}; padding: 24px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 22px; font-weight: 700; letter-spacing: 0.5px;">Sri Ram &amp; Co</h1>
              <p style="margin: 4px 0 0; color: #eef7f0; font-size: 13px;">Kitchen &amp; Home Appliances &bull; Trichy &amp; Chennai</p>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding: 32px 28px;">
              <h2 style="margin: 0 0 16px; font-size: 18px; font-weight: 700; color: ${THEME.text};">Password Reset Request</h2>
              <p style="margin: 0 0 16px; font-size: 14px; line-height: 1.6; color: ${THEME.text};">
                Hello ${escapeHtml(firstName)},
              </p>
              <p style="margin: 0 0 24px; font-size: 14px; line-height: 1.6; color: ${THEME.muted};">
                We received a request to reset the password for your Sri Ram &amp; Co account. Click the button below to set a new password:
              </p>
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin: 0 auto 28px;">
                <tr>
                  <td align="center" style="border-radius: 999px; background-color: ${THEME.green};">
                    <a href="${escapeHtml(resetUrl)}" target="_blank" style="display: inline-block; padding: 14px 32px; font-family: ${THEME.font}; font-size: 14px; font-weight: 700; color: #ffffff; text-decoration: none; border-radius: 999px;">
                      Reset Password
                    </a>
                  </td>
                </tr>
              </table>
              <div style="background-color: ${THEME.surfaceBg}; border: 1px solid ${THEME.border}; border-radius: 12px; padding: 16px; margin-bottom: 24px;">
                <p style="margin: 0; font-size: 13px; color: ${THEME.muted}; line-height: 1.5;">
                  <strong>Note:</strong> This link is secure and will expire in <strong>1 hour</strong>. If you did not request this password reset, please ignore this email or contact our customer helpline.
                </p>
              </div>
              <p style="margin: 0; font-size: 12px; color: ${THEME.muted}; line-height: 1.5; word-break: break-all;">
                If the button above does not work, copy and paste this link into your browser:<br/>
                <a href="${escapeHtml(resetUrl)}" style="color: ${THEME.green}; text-decoration: underline;">${escapeHtml(resetUrl)}</a>
              </p>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background-color: ${THEME.surfaceBg}; border-top: 1px solid ${THEME.border}; padding: 20px 28px; text-align: center; font-size: 12px; color: ${THEME.muted};">
              <p style="margin: 0 0 6px;">Need help? Call our Helpline: <a href="${STORE_CONFIG.telUrl}" style="color: ${THEME.green}; font-weight: 600; text-decoration: none;">${STORE_CONFIG.phoneDisplay}</a></p>
              <p style="margin: 0;">&copy; 2026 Sri Ram &amp; Co. GSTIN: ${STORE_CONFIG.gstin}</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  return { subject, html, text };
}


/**
 * Compiles a structured merchant alert email for product return requests.
 * Sent directly to ramkumar@sriramandco.in with customer email as replyTo.
 */
export function compileMerchantReturnEmailHtml(order: any, returnRequest: any): CompiledEmail {
  const customer = order.customerInfo || {};
  const item = returnRequest.item || {};
  const orderNumber = order.orderNumber || order.id || 'N/A';
  const subject = `[Return Request] Order #${orderNumber} - ${item.name || 'Product'}`;
  
  const text = `URGENT: Product Return Request Received\n\n` +
    `Order Number: #${orderNumber}\n` +
    `Customer Name: ${customer.name || 'N/A'}\n` +
    `Customer Phone: ${customer.phone || 'N/A'}\n` +
    `Customer Email: ${customer.email || 'N/A'}\n` +
    `Delivery Address: ${customer.address || ''}, ${customer.city || ''} ${customer.postalCode || ''}\n\n` +
    `RETURN ITEM DETAILS:\n` +
    `Product: ${item.name || 'N/A'}\n` +
    `Quantity: ${item.quantity || 1}\n` +
    `Price: ₹${item.price || 0}\n\n` +
    `RETURN REASON:\n` +
    `Reason: ${returnRequest.reason}\n` +
    `Customer Fault Review: ${returnRequest.faultDetails}\n` +
    `Policy Acknowledged: ${returnRequest.agreedToPolicy ? 'YES' : 'NO'}\n` +
    `Requested At: ${new Date(returnRequest.requestedAt || Date.now()).toLocaleString('en-IN')}\n\n` +
    `Please review in Admin Dashboard and arrange reverse logistics.`;

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>${escapeHtml(subject)}</title>
</head>
<body style="margin:0;padding:0;background-color:${THEME.pageBg};font-family:${THEME.font};color:${THEME.text};">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:${THEME.pageBg};padding:32px 16px;">
    <tr>
      <td align="center">
        <table width="100%" style="max-width:600px;background-color:${THEME.cardBg};border:1px solid ${THEME.border};border-radius:16px;overflow:hidden;">
          <tr>
            <td style="background-color:#b91c1c;padding:24px;text-align:center;">
              <span style="background-color:rgba(255,255,255,0.2);color:#ffffff;font-size:11px;font-weight:700;padding:4px 10px;border-radius:999px;text-transform:uppercase;">Action Required</span>
              <h1 style="margin:8px 0 0;color:#ffffff;font-size:20px;font-weight:700;">Customer Return Request</h1>
              <p style="margin:4px 0 0;color:#fee2e2;font-size:13px;">Order #${escapeHtml(orderNumber)}</p>
            </td>
          </tr>
          <tr>
            <td style="padding:28px;">
              <h2 style="font-size:16px;font-weight:700;margin:0 0 12px;color:${THEME.text};">Return Item Details</h2>
              <table width="100%" style="border-collapse:collapse;margin-bottom:20px;background-color:${THEME.surfaceBg};border-radius:12px;padding:12px;">
                <tr>
                  <td style="padding:12px;font-size:14px;font-weight:600;color:${THEME.text};">${escapeHtml(item.name || 'Product')}</td>
                  <td style="padding:12px;font-size:14px;text-align:right;color:${THEME.text};">Qty: ${escapeHtml(String(item.quantity || 1))} &bull; <strong>₹${Number(item.price || 0).toLocaleString('en-IN')}</strong></td>
                </tr>
              </table>

              <h2 style="font-size:16px;font-weight:700;margin:0 0 12px;color:${THEME.text};">Customer Fault Reason &amp; Feedback</h2>
              <div style="background-color:#fff7ed;border:1px solid #ffedd5;border-radius:12px;padding:16px;margin-bottom:20px;">
                <p style="margin:0 0 6px;font-size:13px;color:#9a3412;"><strong>Fault Category:</strong> ${escapeHtml(returnRequest.reason)}</p>
                <p style="margin:0;font-size:13px;color:#431407;line-height:1.5;"><strong>Customer Detailed Review:</strong><br/>"${escapeHtml(returnRequest.faultDetails)}"</p>
              </div>

              <h2 style="font-size:16px;font-weight:700;margin:0 0 12px;color:${THEME.text};">Customer &amp; Pickup Address</h2>
              <table width="100%" style="font-size:13px;color:${THEME.muted};line-height:1.6;margin-bottom:20px;">
                <tr><td width="30%"><strong>Customer Name:</strong></td><td>${escapeHtml(customer.name || '')}</td></tr>
                <tr><td><strong>Phone:</strong></td><td><a href="tel:${escapeHtml(customer.phone || '')}" style="color:${THEME.green};text-decoration:none;">${escapeHtml(customer.phone || '')}</a></td></tr>
                <tr><td><strong>Email:</strong></td><td><a href="mailto:${escapeHtml(customer.email || '')}" style="color:${THEME.green};text-decoration:none;">${escapeHtml(customer.email || '')}</a></td></tr>
                <tr><td><strong>Address:</strong></td><td>${escapeHtml(customer.address || '')}, ${escapeHtml(customer.city || '')} ${escapeHtml(customer.postalCode || '')}</td></tr>
                <tr><td><strong>Policy Acknowledged:</strong></td><td>Yes (7-day warranty agreement ticked)</td></tr>
              </table>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  return { subject, html, text };
}

/**
 * Compiles customer acknowledgment email confirming return request submission.
 */
export function compileCustomerReturnAckEmailHtml(order: any, returnRequest: any): CompiledEmail {
  const customer = order.customerInfo || {};
  const item = returnRequest.item || {};
  const orderNumber = order.orderNumber || order.id || 'N/A';
  const firstName = (customer.name || 'Customer').trim().split(' ')[0];
  const subject = `Return Request Received: Order #${orderNumber}`;

  const text = `Hello ${firstName},\n\nWe have received your return request for "${item.name}" from Order #${orderNumber}.\n\n` +
    `Reason: ${returnRequest.reason}\n\n` +
    `What happens next?\n` +
    `1. Our support team will inspect the request within 2 business days.\n` +
    `2. A reverse pickup agent will be scheduled at your registered delivery address.\n` +
    `3. Once the product passes quality check at our hub, your refund will be credited within 5-7 business days.\n\n` +
    `Helpline: ${STORE_CONFIG.phoneDisplay}\nSri Ram & Co`;

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>${escapeHtml(subject)}</title>
</head>
<body style="margin:0;padding:0;background-color:${THEME.pageBg};font-family:${THEME.font};color:${THEME.text};">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:${THEME.pageBg};padding:32px 16px;">
    <tr>
      <td align="center">
        <table width="100%" style="max-width:600px;background-color:${THEME.cardBg};border:1px solid ${THEME.border};border-radius:16px;overflow:hidden;">
          <tr>
            <td style="background-color:${THEME.green};padding:24px;text-align:center;">
              <h1 style="margin:0;color:#ffffff;font-size:22px;font-weight:700;">Sri Ram &amp; Co</h1>
              <p style="margin:4px 0 0;color:#eef7f0;font-size:13px;">Return Request Acknowledgment</p>
            </td>
          </tr>
          <tr>
            <td style="padding:28px;">
              <h2 style="font-size:18px;margin:0 0 12px;color:${THEME.text};">We've Received Your Return Request</h2>
              <p style="font-size:14px;line-height:1.6;color:${THEME.muted};margin:0 0 20px;">
                Hello ${escapeHtml(firstName)}, your return request for <strong>${escapeHtml(item.name || 'Product')}</strong> (Order #${escapeHtml(orderNumber)}) has been successfully recorded.
              </p>
              <div style="background-color:${THEME.surfaceBg};border:1px solid ${THEME.border};border-radius:12px;padding:16px;margin-bottom:24px;">
                <p style="margin:0 0 8px;font-size:13px;font-weight:700;color:${THEME.text};">Next Steps:</p>
                <ol style="margin:0;padding-left:18px;font-size:13px;color:${THEME.muted};line-height:1.6;">
                  <li>Our support specialist will review your request within 24–48 hours.</li>
                  <li>Our courier partner will arrange reverse pickup from your doorstep.</li>
                  <li>After inspection at our hub, your refund will be processed per our 7-day refund SLA.</li>
                </ol>
              </div>
              <p style="font-size:12px;color:${THEME.muted};margin:0;">Need immediate assistance? Call us at <a href="${STORE_CONFIG.telUrl}" style="color:${THEME.green};font-weight:600;text-decoration:none;">${STORE_CONFIG.phoneDisplay}</a></p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  return { subject, html, text };
}
