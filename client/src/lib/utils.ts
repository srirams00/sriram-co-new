/**
 * Format a number into Indian Rupee format (e.g. ₹14,499)
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Calculate discount percentage
 */
export function calculateDiscount(price: number, originalPrice?: number): number {
  if (!originalPrice || originalPrice <= price) return 0;
  return Math.round(((originalPrice - price) / originalPrice) * 100);
}

/**
 * Create a direct WhatsApp chat URL with pre-filled message
 */
export function getWhatsAppUrl(phone: string = '919443212345', text?: string): string {
  const cleanPhone = phone.replace(/[^0-9]/g, '');
  const message = text 
    ? encodeURIComponent(text)
    : encodeURIComponent('Hello Sriram & Co! I would like to inquire about your products.');
  return `https://wa.me/${cleanPhone}?text=${message}`;
}
