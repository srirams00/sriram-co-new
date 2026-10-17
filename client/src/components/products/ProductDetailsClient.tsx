'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  Check, 
  Plus, 
  Minus, 
  ShoppingBag, 
  MessageCircle, 
  ShieldCheck, 
  Truck, 
  RotateCcw,
  Heart
} from 'lucide-react';
import { Product } from '@/types/product';
import { useCart } from '@/context/CartContext';
import { useWishlist } from '@/context/WishlistContext';
import { formatCurrency, calculateDiscount, getWhatsAppUrl, getOptimizedImageUrl, getEffectiveOriginalPrice } from '@/lib/utils';
import ProductReviews from './ProductReviews';
import styles from './ProductDetailsClient.module.css';

interface ProductDetailsClientProps {
  product: Product;
  relatedProducts: Product[];
}

export default function ProductDetailsClient({ product, relatedProducts }: ProductDetailsClientProps) {
  const router = useRouter();
  const { addToCart } = useCart();
  const { isInWishlist, toggleWishlist } = useWishlist();

  const [selectedImage, setSelectedImage] = useState(product.image);
  const [quantity, setQuantity] = useState(1);
  const inWishlist = isInWishlist(product.id);

  const images = [product.image, ...(product.additionalImages || [])];
  const effectiveOriginalPrice = getEffectiveOriginalPrice(product.price, product.originalPrice);
  const discount = calculateDiscount(product.price, effectiveOriginalPrice);

  const handleAddToCart = () => {
    addToCart(product, quantity);
  };

  const handleBuyNow = () => {
    addToCart(product, quantity);
    router.push('/checkout');
  };

  const whatsappInquiryUrl = getWhatsAppUrl(
    '919443212345',
    `Hello Sriram & Co! I am interested in: "${product.name}" (${formatCurrency(product.price)}). Could you tell me more about its availability and delivery?`
  );

  return (
    <div className={styles.productDetails}>
      {/* Breadcrumbs */}
      <nav className={styles.breadcrumb}>
        <div className="container">
          <Link href="/">Home</Link>
          <span>/</span>
          <Link href="/shop">Shop</Link>
          <span>/</span>
          <Link href={`/category/${product.categorySlug}`}>{product.category}</Link>
          <span>/</span>
          <span className={styles.breadcrumbCurrent}>{product.name}</span>
        </div>
      </nav>

      <div className="container">
        {/* Main Product Showcase Section */}
        <div className={styles.mainGrid}>
          {/* Left Column: Gallery */}
          <div className={styles.galleryColumn}>
            <div className={styles.mainImageWrapper}>
              {product.badge && (
                <span className={styles.badge}>{product.badge}</span>
              )}
              <img
                src={getOptimizedImageUrl(selectedImage, 800)}
                alt={product.name}
                className={styles.mainImage}
                width={600}
                height={600}
              />
            </div>

            {/* Thumbnail Selectors */}
            {images.length > 1 && (
              <div className={styles.thumbnailRow}>
                {images.map((img, idx) => (
                  <button
                    key={idx}
                    type="button"
                    className={`${styles.thumbBtn} ${selectedImage === img ? styles.activeThumb : ''}`}
                    onClick={() => setSelectedImage(img)}
                    aria-label={`View product image ${idx + 1}`}
                    aria-pressed={selectedImage === img}
                  >
                    <img
                      src={getOptimizedImageUrl(img, 120)}
                      alt=""
                      className={styles.thumbImage}
                      width={60}
                      height={60}
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Right Column: Info & Actions */}
          <div className={styles.infoColumn}>
            <div className={styles.categoryBadge}>{product.category}</div>
            <h1 className={styles.productTitle}>{product.name}</h1>

            {/* Price Box */}
            <div className={styles.priceSection}>
              <div className={styles.priceRow}>
                <span className={styles.currentPrice}>{formatCurrency(product.price)}</span>
                {effectiveOriginalPrice > product.price && (
                  <span className={styles.originalPrice}>
                    {formatCurrency(effectiveOriginalPrice)}
                  </span>
                )}
                {discount > 0 && (
                  <span className={styles.discountBadge}>Save {discount}%</span>
                )}
              </div>
              <p className={styles.taxInclusive}>Inclusive of all taxes • Free direct delivery</p>
            </div>

            {/* Stock status */}
            <div className={styles.stockStatus}>
              <div className={styles.stockDot} />
              <span>In Stock — Ready for immediate dispatch from Trichy &amp; Chennai</span>
            </div>

            {/* Short Description */}
            <p className={styles.shortDescription}>{product.shortDescription}</p>

            {/* Key Features Bullet List */}
            {product.features && product.features.length > 0 && (
              <div className={styles.featuresList}>
                <h4 className={styles.featuresHeading}>Key Highlights:</h4>
                <ul>
                  {product.features.map((feat, i) => (
                    <li key={i} className={styles.featureItem}>
                      <Check size={16} className={styles.checkIcon} />
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Quantity & CTA Bar */}
            <div className={styles.purchaseControls}>
              <div className={styles.quantityPicker}>
                <button
                  type="button"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className={styles.qtyBtn}
                  aria-label="Reduce quantity"
                >
                  <Minus size={16} />
                </button>
                <span className={styles.qtyDisplay}>{quantity}</span>
                <button
                  type="button"
                  onClick={() => setQuantity(quantity + 1)}
                  className={styles.qtyBtn}
                  aria-label="Increase quantity"
                >
                  <Plus size={16} />
                </button>
              </div>

              <button
                type="button"
                onClick={handleAddToCart}
                className={`btn btn-primary ${styles.addToCartBtn}`}
              >
                <ShoppingBag size={18} />
                <span>Add to Cart</span>
              </button>

              <button
                type="button"
                onClick={() => toggleWishlist(product.id)}
                className={`${styles.wishlistToggle} ${inWishlist ? styles.activeWish : ''}`}
                title={inWishlist ? 'Remove from Wishlist' : 'Add to Wishlist'}
                aria-label="Wishlist"
              >
                <Heart size={20} fill={inWishlist ? 'currentColor' : 'none'} />
              </button>
            </div>

            {/* Buy Now & WhatsApp Actions */}
            <div className={styles.secondaryActions}>
              <button
                type="button"
                onClick={handleBuyNow}
                className={`btn btn-secondary ${styles.buyNowBtn}`}
              >
                Buy Now (Fast Checkout)
              </button>

              <a
                href={whatsappInquiryUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={`btn btn-whatsapp ${styles.whatsappInquiryBtn}`}
              >
                <MessageCircle size={18} />
                <span>Ask on WhatsApp</span>
              </a>
            </div>

            {/* Value Guarantees */}
            <div className={styles.guaranteeBox}>
              <div className={styles.guaranteeItem}>
                <Truck size={20} className={styles.guaranteeIcon} />
                <div>
                  <strong>Free Direct Delivery</strong>
                  <span>Delivered safely within 24 to 48 hours</span>
                </div>
              </div>
              <div className={styles.guaranteeItem}>
                <ShieldCheck size={20} className={styles.guaranteeIcon} />
                <div>
                  <strong>Store &amp; Brand Warranty</strong>
                  <span>100% genuine backing with store service</span>
                </div>
              </div>
              <div className={styles.guaranteeItem}>
                <RotateCcw size={20} className={styles.guaranteeIcon} />
                <div>
                  <strong>UPI or Card Payment</strong>
                  <span>Pay by UPI or debit/credit card when your order arrives</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Detailed Tabs / Specifications */}
        <div className={styles.specsSection}>
          <div className={styles.sectionHeader}>
            <h2 className="heading-section">Product Details &amp; Specifications</h2>
          </div>

          <div className={styles.specsGrid}>
            <div className={styles.narrativeCol}>
              <h3>Detailed Overview</h3>
              <p className={styles.narrativeText}>{product.fullDescription}</p>
            </div>

            <div className={styles.tableCol}>
              <h3>Technical Specifications</h3>
              <table className={styles.specsTable}>
                <tbody>
                  {Object.entries(product.specifications || {}).map(([key, value]) => (
                    <tr key={key}>
                      <td className={styles.specKey}>{key}</td>
                      <td className={styles.specVal}>{value}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <ProductReviews productId={product.id} />

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <div className={styles.relatedSection}>
            <h2 className="heading-section">Related Products</h2>
            <div className={styles.relatedGrid}>
              {relatedProducts.slice(0, 4).map((rel) => (
                <Link key={rel.id} href={`/product/${encodeURIComponent(rel.slug || rel.id)}`} className={styles.relatedCard}>
                  <div className={styles.relatedImgWrapper}>
                    <img
                      src={getOptimizedImageUrl(rel.image, 400)}
                      alt={rel.name}
                      className={styles.relatedImg}
                      width={250}
                      height={250}
                      loading="lazy"
                      decoding="async"
                    />
                  </div>
                  <div className={styles.relatedInfo}>
                    <span className={styles.relatedCategory}>{rel.category}</span>
                    <h3 className={styles.relatedTitle}>{rel.name}</h3>
                    <span className={styles.relatedPrice}>{formatCurrency(rel.price)}</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
