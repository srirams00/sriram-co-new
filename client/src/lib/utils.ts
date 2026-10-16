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
 * Resolves display original price (MRP). Returns explicit originalPrice if valid and greater than price,
 * or derives an authentic retail MRP based on product price tier so cards consistently showcase savings.
 */
export function getEffectiveOriginalPrice(price: number, originalPrice?: number): number {
  if (originalPrice && originalPrice > price) {
    return originalPrice;
  }
  if (!price || price <= 0) return 0;
  if (price < 150) return Math.round((price * 1.6) / 10) * 10 - 1;
  if (price <= 500) return Math.round((price * 1.4) / 10) * 10 - 1;
  if (price <= 1500) return Math.round((price * 1.3) / 50) * 50 - 1;
  if (price <= 3000) return Math.round((price * 1.25) / 50) * 50 - 1;
  return Math.round((price * 1.22) / 100) * 100 - 1;
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

/**
 * Optimize image URL for Cloudinary, Unsplash, or static assets
 */
export function getOptimizedImageUrl(url?: string, width: number = 600): string {
  if (!url) return '/logo.webp';

  // Cloudinary dynamic transformation
  if (url.includes('res.cloudinary.com') && url.includes('/upload/')) {
    if (url.includes('/f_auto,q_auto')) {
      return url;
    }
    return url.replace('/upload/', `/upload/f_auto,q_auto,w_${width},c_limit/`);
  }

  // Unsplash dynamic transformation
  if (url.includes('images.unsplash.com')) {
    const cleanUrl = url.split('?')[0];
    return `${cleanUrl}?auto=format&fit=crop&w=${width}&q=80`;
  }

  // Local static JPEG/PNG to WebP mapping
  if (url === '/logo.png') return '/logo.webp';
  if (url === '/mop.jpeg') return '/mop.webp';
  if (url === '/fan.jpeg') return '/fan.webp';

  return url;
}
