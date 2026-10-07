'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Save, Image as ImageIcon, AlertCircle } from 'lucide-react';
import { api } from '@/lib/api';
import styles from '../form.module.css';

const DEFAULT_CATEGORIES = [
  'Kitchen',
  'Cleaning',
  'Power Tools',
  'Home Appliances',
  'Garden',
  'Electricals',
];

export default function NewProductPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    category: 'Kitchen',
    sku: '',
    price: '',
    originalPrice: '',
    inventoryCount: '15',
    inStock: true,
    badge: '',
    image: '',
    additionalImages: '',
    shortDescription: '',
    fullDescription: '',
    features: '',
  });

  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const validate = () => {
    const errors: Record<string, string> = {};
    if (!formData.name.trim()) errors.name = 'Product name is required';
    if (!formData.category.trim()) errors.category = 'Category is required';
    if (!formData.price || Number(formData.price) <= 0) errors.price = 'Valid price is required';
    if (!formData.image.trim()) {
      errors.image = 'Primary image URL is required';
    } else if (!formData.image.startsWith('https://') && !formData.image.startsWith('/')) {
      errors.image = 'Image URL must use secure https:// protocol or /path';
    }
    if (!formData.shortDescription.trim()) errors.shortDescription = 'Short description is required';
    if (!formData.fullDescription.trim()) errors.fullDescription = 'Full description is required';
    return errors;
  };

  const errors = validate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData((prev) => ({ ...prev, [name]: checked }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleBlur = (field: string) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched({
      name: true,
      category: true,
      price: true,
      image: true,
      shortDescription: true,
      fullDescription: true,
    });

    const currentErrors = validate();
    if (Object.keys(currentErrors).length > 0) {
      setFormError('Please resolve all required fields highlighted in red.');
      return;
    }

    setLoading(true);
    setFormError(null);

    try {
      const token = localStorage.getItem('src_auth_token') || undefined;

      // Parse feature strings
      const featuresArray = formData.features
        .split('\n')
        .map((f) => f.trim())
        .filter(Boolean);

      // Parse additional images
      const addImagesArray = formData.additionalImages
        .split('\n')
        .map((img) => img.trim())
        .filter((img) => img.startsWith('https://') || img.startsWith('/'));

      await api.createProduct(
        {
          name: formData.name.trim(),
          category: formData.category.trim(),
          sku: formData.sku.trim() || undefined,
          price: Number(formData.price),
          originalPrice: formData.originalPrice ? Number(formData.originalPrice) : undefined,
          inventoryCount: Number(formData.inventoryCount) || 0,
          inStock: formData.inStock,
          badge: (formData.badge as any) || null,
          image: formData.image.trim(),
          additionalImages: addImagesArray,
          shortDescription: formData.shortDescription.trim(),
          fullDescription: formData.fullDescription.trim(),
          features: featuresArray,
        },
        token
      );

      router.push('/admin/products');
    } catch (err: any) {
      setFormError(err.message || 'Failed to create product');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.formContainer}>
      <Link href="/admin/products" className={styles.backLink}>
        <ArrowLeft size={16} />
        <span>Back to catalog</span>
      </Link>

      <div className={styles.formHeader}>
        <h2 className={styles.formTitle}>Add New Product</h2>
        <p className={styles.formSubtitle}>Create a new appliance or tool item in the Sri Ram &amp; Co catalog.</p>
      </div>

      {formError && (
        <div style={{ background: '#FEECEC', color: '#DC2626', padding: '12px 16px', borderRadius: '10px', fontSize: '0.86rem', border: '1px solid #FCD3D3', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <AlertCircle size={16} />
          <span>{formError}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className={styles.formCard} noValidate>
        {/* Name & SKU */}
        <div className={styles.grid2}>
          <div className={styles.fieldGroup}>
            <label className={styles.fieldLabel}>
              <span>Product Name <span className={styles.requiredMarker}>*</span></span>
            </label>
            <input
              type="text"
              name="name"
              placeholder="e.g. Prestige 750W Mixer Grinder"
              value={formData.name}
              onChange={handleChange}
              onBlur={() => handleBlur('name')}
              className={`${styles.inputField} ${touched.name && errors.name ? styles.fieldError : ''}`}
            />
            {touched.name && errors.name && <span className={styles.errorText}>{errors.name}</span>}
          </div>

          <div className={styles.fieldGroup}>
            <label className={styles.fieldLabel}>
              <span>SKU / Product Code</span>
            </label>
            <input
              type="text"
              name="sku"
              placeholder="e.g. PRE-MIX-750 (leave empty to auto-generate)"
              value={formData.sku}
              onChange={handleChange}
              className={styles.inputField}
            />
            <span className={styles.hintText}>Auto-generated if left blank</span>
          </div>
        </div>

        {/* Category & Badge */}
        <div className={styles.grid2}>
          <div className={styles.fieldGroup}>
            <label className={styles.fieldLabel}>
              <span>Category <span className={styles.requiredMarker}>*</span></span>
            </label>
            <select
              name="category"
              value={formData.category}
              onChange={handleChange}
              className={styles.selectField}
            >
              {DEFAULT_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div className={styles.fieldGroup}>
            <label className={styles.fieldLabel}>
              <span>Promotional Badge</span>
            </label>
            <select
              name="badge"
              value={formData.badge}
              onChange={handleChange}
              className={styles.selectField}
            >
              <option value="">No Badge</option>
              <option value="Best Seller">Best Seller</option>
              <option value="New">New</option>
              <option value="Top Rated">Top Rated</option>
              <option value="Popular">Popular</option>
              <option value="Sale">Sale</option>
            </select>
          </div>
        </div>

        {/* Price, Original Price, Inventory */}
        <div className={styles.grid3}>
          <div className={styles.fieldGroup}>
            <label className={styles.fieldLabel}>
              <span>Price (₹) <span className={styles.requiredMarker}>*</span></span>
            </label>
            <input
              type="number"
              name="price"
              placeholder="e.g. 4299"
              value={formData.price}
              onChange={handleChange}
              onBlur={() => handleBlur('price')}
              className={`${styles.inputField} ${touched.price && errors.price ? styles.fieldError : ''}`}
            />
            {touched.price && errors.price && <span className={styles.errorText}>{errors.price}</span>}
          </div>

          <div className={styles.fieldGroup}>
            <label className={styles.fieldLabel}>
              <span>Original Price (₹)</span>
            </label>
            <input
              type="number"
              name="originalPrice"
              placeholder="e.g. 5499"
              value={formData.originalPrice}
              onChange={handleChange}
              className={styles.inputField}
            />
            <span className={styles.hintText}>For strikethrough discount display</span>
          </div>

          <div className={styles.fieldGroup}>
            <label className={styles.fieldLabel}>
              <span>Inventory Units</span>
            </label>
            <input
              type="number"
              name="inventoryCount"
              placeholder="15"
              value={formData.inventoryCount}
              onChange={handleChange}
              className={styles.inputField}
            />
          </div>
        </div>

        {/* Image Preview & URL */}
        <div className={styles.fieldGroup}>
          <label className={styles.fieldLabel}>
            <span>Primary Image URL <span className={styles.requiredMarker}>*</span></span>
          </label>
          <div className={styles.imageSection}>
            <div className={styles.imageInputs}>
              <input
                type="text"
                name="image"
                placeholder="https://images.unsplash.com/... or /images/..."
                value={formData.image}
                onChange={handleChange}
                onBlur={() => handleBlur('image')}
                className={`${styles.inputField} ${touched.image && errors.image ? styles.fieldError : ''}`}
                style={{ width: '100%' }}
              />
              {touched.image && errors.image && <span className={styles.errorText}>{errors.image}</span>}
              <span className={styles.hintText} style={{ display: 'block', marginTop: '4px' }}>
                Must start with secure https:// or local path
              </span>
            </div>

            {/* Live Preview Box */}
            <div className={styles.previewBox}>
              {formData.image ? (
                <img
                  src={formData.image}
                  alt="Preview"
                  className={styles.previewImg}
                  onError={(e) => {
                    (e.target as HTMLImageElement).src =
                      'https://images.unsplash.com/photo-1584269600464-37b1b58a9fe7?w=200&q=80';
                  }}
                />
              ) : (
                <div className={styles.previewPlaceholder}>
                  <ImageIcon size={22} style={{ margin: '0 auto 4px auto', opacity: 0.5 }} />
                  <span>Preview</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Short Description */}
        <div className={styles.fieldGroup}>
          <label className={styles.fieldLabel}>
            <span>Short Description <span className={styles.requiredMarker}>*</span></span>
          </label>
          <textarea
            name="shortDescription"
            rows={2}
            placeholder="Crisp 1-2 sentence overview for catalog cards..."
            value={formData.shortDescription}
            onChange={handleChange}
            onBlur={() => handleBlur('shortDescription')}
            className={`${styles.textareaField} ${touched.shortDescription && errors.shortDescription ? styles.fieldError : ''}`}
          />
          {touched.shortDescription && errors.shortDescription && (
            <span className={styles.errorText}>{errors.shortDescription}</span>
          )}
        </div>

        {/* Full Description */}
        <div className={styles.fieldGroup}>
          <label className={styles.fieldLabel}>
            <span>Full Description <span className={styles.requiredMarker}>*</span></span>
          </label>
          <textarea
            name="fullDescription"
            rows={4}
            placeholder="Detailed product information, specifications, warranty..."
            value={formData.fullDescription}
            onChange={handleChange}
            onBlur={() => handleBlur('fullDescription')}
            className={`${styles.textareaField} ${touched.fullDescription && errors.fullDescription ? styles.fieldError : ''}`}
          />
          {touched.fullDescription && errors.fullDescription && (
            <span className={styles.errorText}>{errors.fullDescription}</span>
          )}
        </div>

        {/* Features list */}
        <div className={styles.fieldGroup}>
          <label className={styles.fieldLabel}>
            <span>Key Features (One feature per line)</span>
          </label>
          <textarea
            name="features"
            rows={3}
            placeholder="100% Copper Winding Motor&#10;3 Speed Control with Pulse&#10;2 Year Warranty"
            value={formData.features}
            onChange={handleChange}
            className={styles.textareaField}
          />
          <span className={styles.hintText}>Enter one feature per line</span>
        </div>

        {/* In-stock toggle */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '10px' }}>
          <input
            type="checkbox"
            id="inStock"
            name="inStock"
            checked={formData.inStock}
            onChange={handleChange}
            style={{ width: '18px', height: '18px', accentColor: '#18A957' }}
          />
          <label htmlFor="inStock" style={{ fontSize: '0.88rem', fontWeight: 600, color: '#174A2B', cursor: 'pointer' }}>
            Visible and Available in Storefront
          </label>
        </div>

        {/* Form Actions */}
        <div className={styles.actionsRow}>
          <Link href="/admin/products" className={styles.cancelBtn}>
            Cancel
          </Link>
          <button type="submit" disabled={loading} className={styles.submitBtn}>
            <Save size={16} />
            <span>{loading ? 'Creating...' : 'Create Product'}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
