export interface ContactFormData {
  name: string;
  phone: string;
  email?: string;
  storeBranch: string;
  inquiryType: string;
  message: string;
}

export function compileOwnerNotificationEmail(data: ContactFormData): { subject: string; html: string; text: string } {
  const cleanPhone = data.phone.replace(/[^0-9]/g, '');
  const waPhone = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
  const waUrl = `https://wa.me/${waPhone}?text=${encodeURIComponent(`Hello ${data.name}, this is Sri Ram & Co regarding your inquiry.`)}`;
  const submittedAt = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', dateStyle: 'medium', timeStyle: 'short' });

  const subject = `[Website Inquiry] ${data.inquiryType} from ${data.name} (${data.storeBranch})`;

  const text = `
New Customer Inquiry - Sri Ram & Co
------------------------------------
Customer Name: ${data.name}
Phone: ${data.phone}
Email: ${data.email || 'Not provided'}
Store Branch: ${data.storeBranch}
Inquiry Type: ${data.inquiryType}
Submitted: ${submittedAt}

Message:
"${data.message}"

Quick Contact:
WhatsApp: ${waUrl}
Call: tel:${cleanPhone}
  `.trim();

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>${subject}</title>
</head>
<body style="margin: 0; padding: 24px 0; background-color: #F7F8F5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #174A2B;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 0 auto; background-color: #FFFFFF; border-radius: 16px; border: 1px solid #E5EDE7; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.04);">
    <!-- Brand Header -->
    <tr>
      <td style="background-color: #174A2B; padding: 28px 32px; color: #FFFFFF;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td>
              <span style="display: inline-block; background-color: #18A957; color: #FFFFFF; font-weight: 700; font-size: 11px; padding: 4px 10px; border-radius: 999px; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 8px;">
                Customer Inquiry
              </span>
              <h1 style="margin: 0; font-size: 22px; font-weight: 700; color: #FFFFFF; letter-spacing: -0.02em;">
                New Website Inquiry
              </h1>
              <p style="margin: 4px 0 0; font-size: 13px; color: #D1E7DD;">
                Branch: <strong>${data.storeBranch}</strong> &bull; Reason: <strong>${data.inquiryType}</strong>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>

    <!-- Body Content -->
    <tr>
      <td style="padding: 32px;">
        <!-- Customer Details Box -->
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #F8FAF9; border: 1px solid #E5EDE7; border-radius: 12px; margin-bottom: 24px; padding: 18px 20px;">
          <tr>
            <td style="padding: 6px 0; font-size: 13px; color: #68786D; width: 35%;">Customer Name:</td>
            <td style="padding: 6px 0; font-size: 14px; font-weight: 700; color: #174A2B;">${data.name}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; font-size: 13px; color: #68786D;">Phone Number:</td>
            <td style="padding: 6px 0; font-size: 14px; font-weight: 700; color: #174A2B;">
              <a href="tel:${cleanPhone}" style="color: #174A2B; text-decoration: none;">${data.phone}</a>
            </td>
          </tr>
          ${
            data.email
              ? `<tr>
            <td style="padding: 6px 0; font-size: 13px; color: #68786D;">Email Address:</td>
            <td style="padding: 6px 0; font-size: 14px; font-weight: 600; color: #174A2B;">
              <a href="mailto:${data.email}" style="color: #18A957; text-decoration: underline;">${data.email}</a>
            </td>
          </tr>`
              : ''
          }
          <tr>
            <td style="padding: 6px 0; font-size: 13px; color: #68786D;">Preferred Branch:</td>
            <td style="padding: 6px 0; font-size: 14px; font-weight: 600; color: #174A2B;">${data.storeBranch}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; font-size: 13px; color: #68786D;">Inquiry Type:</td>
            <td style="padding: 6px 0; font-size: 14px; font-weight: 600; color: #174A2B;">${data.inquiryType}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; font-size: 13px; color: #68786D;">Received At:</td>
            <td style="padding: 6px 0; font-size: 13px; color: #68786D;">${submittedAt}</td>
          </tr>
        </table>

        <!-- Message Box -->
        <div style="margin-bottom: 24px;">
          <h3 style="margin: 0 0 10px; font-size: 14px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: #174A2B;">
            Customer Message
          </h3>
          <div style="background-color: #FFFFFF; border: 1px solid #D5E2D8; border-left: 4px solid #18A957; border-radius: 8px; padding: 16px 20px; font-size: 14px; line-height: 1.6; color: #2D3748; white-space: pre-wrap;">
${data.message}
          </div>
        </div>

        <!-- Quick Action Buttons -->
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top: 24px;">
          <tr>
            <td align="center">
              <a href="${waUrl}" target="_blank" style="display: inline-block; background-color: #25D366; color: #FFFFFF; font-weight: 700; font-size: 14px; text-decoration: none; padding: 12px 24px; border-radius: 8px; margin: 4px;">
                Chat on WhatsApp &rarr;
              </a>
              <a href="tel:${cleanPhone}" style="display: inline-block; background-color: #174A2B; color: #FFFFFF; font-weight: 700; font-size: 14px; text-decoration: none; padding: 12px 24px; border-radius: 8px; margin: 4px;">
                Call Customer
              </a>
              ${
                data.email
                  ? `<a href="mailto:${data.email}?subject=${encodeURIComponent(`Re: Your inquiry with Sri Ram & Co (${data.inquiryType})`)}" style="display: inline-block; background-color: #F3F4F6; color: #1F2937; font-weight: 600; font-size: 14px; text-decoration: none; padding: 12px 20px; border-radius: 8px; margin: 4px; border: 1px solid #D1D5DB;">
                Reply by Email
              </a>`
                  : ''
              }
            </td>
          </tr>
        </table>
      </td>
    </tr>

    <!-- Footer -->
    <tr>
      <td style="background-color: #F8FAF9; padding: 20px 32px; border-top: 1px solid #E5EDE7; text-align: center; font-size: 12px; color: #68786D;">
        This notification was automatically dispatched from the Sri Ram &amp; Co website contact form.
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();

  return { subject, html, text };
}

export function compileCustomerAcknowledgmentEmail(data: ContactFormData): { subject: string; html: string; text: string } {
  const subject = `We received your message - Sri Ram & Co (${data.inquiryType})`;
  const text = `
Hello ${data.name},

Thank you for reaching out to Sri Ram & Co. We have received your inquiry regarding "${data.inquiryType}" for our ${data.storeBranch} store.

Our team will review your message and contact you via phone or WhatsApp at ${data.phone} within 2 business hours.

Your message summary:
"${data.message}"

Need urgent assistance?
Call our store helpline: +91 93454 03136 / +91 91713 14888
Trichy Main Store: 40, Chinnakkadai St, Melapudur, Tiruchirappalli

Warm regards,
Sri Ram & Co Team
https://www.sriramandco.in
  `.trim();

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>${subject}</title>
</head>
<body style="margin: 0; padding: 24px 0; background-color: #F7F8F5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #174A2B;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 0 auto; background-color: #FFFFFF; border-radius: 16px; border: 1px solid #E5EDE7; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.04);">
    <tr>
      <td style="background-color: #174A2B; padding: 28px 32px; color: #FFFFFF;">
        <span style="display: inline-block; background-color: #18A957; color: #FFFFFF; font-weight: 700; font-size: 11px; padding: 4px 10px; border-radius: 999px; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 8px;">
          Message Received
        </span>
        <h1 style="margin: 0; font-size: 22px; font-weight: 700; color: #FFFFFF;">
          Thank you for contacting us, ${data.name}!
        </h1>
        <p style="margin: 4px 0 0; font-size: 13px; color: #D1E7DD;">
          Our ${data.storeBranch} team is on it.
        </p>
      </td>
    </tr>
    <tr>
      <td style="padding: 32px;">
        <p style="font-size: 15px; line-height: 1.6; color: #2D3748; margin-top: 0;">
          We have received your message regarding <strong>${data.inquiryType}</strong>. Our customer support team will get in touch with you at <strong>${data.phone}</strong> within <strong>2 business hours</strong>.
        </p>

        <div style="background-color: #F8FAF9; border: 1px solid #E5EDE7; border-left: 4px solid #18A957; border-radius: 8px; padding: 16px 20px; margin: 24px 0; font-size: 13px; color: #4A5568; line-height: 1.6;">
          <strong style="display: block; color: #174A2B; margin-bottom: 4px; font-size: 12px; text-transform: uppercase; letter-spacing: 0.05em;">Your Inquiry:</strong>
          "${data.message}"
        </div>

        <p style="font-size: 13px; color: #68786D; line-height: 1.5;">
          Need immediate support? Call our direct helpline at <a href="tel:9345403136" style="color: #18A957; font-weight: 700; text-decoration: none;">+91 93454 03136</a> or WhatsApp us directly.
        </p>
      </td>
    </tr>
    <tr>
      <td style="background-color: #F8FAF9; padding: 18px 32px; border-top: 1px solid #E5EDE7; text-align: center; font-size: 12px; color: #68786D;">
        Sri Ram &amp; Co &bull; Quality Home Essentials Since 2004 &bull; Trichy &amp; Chennai
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();

  return { subject, html, text };
}
