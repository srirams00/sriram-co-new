'use client';

import React, { useState } from 'react';
import { Phone, Mail, MapPin, Clock, MessageCircle, Send, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { STORES } from '@/data/stores';
import { getWhatsAppUrl } from '@/lib/utils';
import { api } from '@/lib/api';
import styles from './contact.module.css';

export default function ContactPage() {
  const [formSubmitted, setFormSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    storeBranch: 'Trichy',
    inquiryType: 'Product Inquiry',
    message: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      await api.sendContactInquiry({
        name: formData.name.trim(),
        phone: formData.phone.trim(),
        email: formData.email.trim() || undefined,
        storeBranch: formData.storeBranch,
        inquiryType: formData.inquiryType,
        message: formData.message.trim(),
      });
      setFormSubmitted(true);
    } catch (err: any) {
      setSubmitError(
        err.message || 'Unable to deliver your message right now. Please call us directly or chat on WhatsApp.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetForm = () => {
    setFormSubmitted(false);
    setSubmitError(null);
    setFormData((prev) => ({
      ...prev,
      message: '',
    }));
  };

  const whatsappUrl = getWhatsAppUrl('9345403136', 'Hello Sriram & Co, I am visiting your contact page and would like direct assistance.');

  return (
    <div className={styles.contactPage}>
      {/* Banner */}
      <section className={styles.banner}>
        <div className="container">
          <span className="text-eyebrow">Local Support</span>
          <h1 className="heading-hero">Contact Sriram &amp; Co</h1>
          <p className={styles.bannerSubtitle}>
            Whether you want product recommendations, need after-sales service, or prefer placing an order over the phone, our team is always ready to assist.
          </p>
        </div>
      </section>

      <div className="container">
        {/* Quick Action Ribbon */}
        <div className={styles.quickBar}>
          <div className={styles.quickItem}>
            <Phone size={22} className={styles.quickIcon} />
            <div>
              <strong>Call Us Directly</strong>
              <span>+91 93454 03136 / 91713 14888</span>
            </div>
          </div>
          <div className={styles.quickDivider} />
          <div className={styles.quickItem}>
            <MessageCircle size={22} className={styles.whatsappColor} />
            <div>
              <strong>WhatsApp Support</strong>
              <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className={styles.waLink}>
                Chat with our technician now →
              </a>
            </div>
          </div>
          <div className={styles.quickDivider} />
          <div className={styles.quickItem}>
            <Mail size={22} className={styles.quickIcon} />
            <div>
              <strong>Email Inquiries</strong>
              <span>ramkumar@sriramandco.in</span>
            </div>
          </div>
        </div>

        {/* 2-Column Store Locations + Form */}
        <div className={styles.contentGrid}>
          {/* Left Column: Physical Store Branches */}
          <div className={styles.branchesCol}>
            <h2 className="heading-section">Our Store Locations</h2>
            <p className={styles.branchesDesc}>
              Visit either of our physical locations for hands-on demos, instant counter pickup, or warranty servicing.
            </p>

            <div className={styles.branchesList}>
              {STORES.map((store) => (
                <div key={store.id} className={styles.branchCard}>
                  <div className={styles.branchHeader}>
                    <span className={styles.branchTag}>{store.isMainStore ? 'Main Retail Store' : 'Experience Store'}</span>
                    <h3 className={styles.branchCity}>{store.city}</h3>
                  </div>

                  <div className={styles.branchDetails}>
                    <div className={styles.detailRow}>
                      <MapPin size={18} className={styles.detailIcon} />
                      <div>
                        <p className={styles.addressLine}>{store.address}</p>
                        <p className={styles.landmarkLine}>{store.landmark}</p>
                      </div>
                    </div>

                    <div className={styles.detailRow}>
                      <Phone size={18} className={styles.detailIcon} />
                      <a href={`tel:${store.phone}`} className={styles.phoneLink}>
                        {store.phone}
                      </a>
                    </div>

                    <div className={styles.detailRow}>
                      <Clock size={18} className={styles.detailIcon} />
                      <span className={styles.hoursLine}>{store.hours}</span>
                    </div>
                  </div>

                  <a
                    href={store.mapUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-secondary btn-sm"
                  >
                    Open in Google Maps
                  </a>
                </div>
              ))}
            </div>
          </div>

          {/* Right Column: Contact Inquiry Form */}
          <div className={styles.formCol}>
            <div className={styles.formCard}>
              <h3 className={styles.formTitle}>Send Us a Message</h3>
              <p className={styles.formDesc}>
                Fill out the details below and our store manager will get back to you within 2 business hours.
              </p>

              {submitError && (
                <div
                  role="alert"
                  aria-live="assertive"
                  style={{
                    backgroundColor: '#FEF2F2',
                    border: '1px solid #FCA5A5',
                    borderRadius: '8px',
                    padding: '12px 16px',
                    marginBottom: '16px',
                    color: '#991B1B',
                    fontSize: '0.875rem',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '10px',
                  }}
                >
                  <AlertCircle size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
                  <div>
                    <strong>Delivery issue:</strong> {submitError}
                  </div>
                </div>
              )}

              {formSubmitted ? (
                <div className={styles.formSuccess}>
                  <CheckCircle2 size={48} color="#16a34a" />
                  <h4>Message Received!</h4>
                  <p>
                    Thank you, <strong>{formData.name}</strong>. Our {formData.storeBranch} store team has received your message and will call or WhatsApp you at <strong>{formData.phone}</strong> shortly.
                  </p>
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={handleResetForm}
                  >
                    Send Another Inquiry
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className={styles.inquiryForm}>
                  <div className={styles.formGroup}>
                    <label htmlFor="name">Your Name *</label>
                    <input
                      id="name"
                      type="text"
                      required
                      placeholder="e.g. Anandha Krishnan"
                      value={formData.name}
                      onChange={(e) => {
                        setFormData({ ...formData, name: e.target.value });
                        if (submitError) setSubmitError(null);
                      }}
                      disabled={isSubmitting}
                    />
                  </div>

                  <div className={styles.formRow}>
                    <div className={styles.formGroup}>
                      <label htmlFor="phone">Phone / WhatsApp Number *</label>
                      <input
                        id="phone"
                        type="tel"
                        required
                        placeholder="+91 94432 00000"
                        value={formData.phone}
                        onChange={(e) => {
                          setFormData({ ...formData, phone: e.target.value });
                          if (submitError) setSubmitError(null);
                        }}
                        disabled={isSubmitting}
                      />
                    </div>
                    <div className={styles.formGroup}>
                      <label htmlFor="email">Email Address</label>
                      <input
                        id="email"
                        type="email"
                        placeholder="name@example.com"
                        value={formData.email}
                        onChange={(e) => {
                          setFormData({ ...formData, email: e.target.value });
                          if (submitError) setSubmitError(null);
                        }}
                        disabled={isSubmitting}
                      />
                    </div>
                  </div>

                  <div className={styles.formRow}>
                    <div className={styles.formGroup}>
                      <label htmlFor="storeBranch">Nearest Branch</label>
                      <select
                        id="storeBranch"
                        value={formData.storeBranch}
                        onChange={(e) => setFormData({ ...formData, storeBranch: e.target.value })}
                        disabled={isSubmitting}
                      >
                        <option value="Trichy">Trichy (Main Store)</option>
                        <option value="Chennai">Chennai (T. Nagar Store)</option>
                      </select>
                    </div>

                    <div className={styles.formGroup}>
                      <label htmlFor="inquiryType">Reason for Inquiry</label>
                      <select
                        id="inquiryType"
                        value={formData.inquiryType}
                        onChange={(e) => setFormData({ ...formData, inquiryType: e.target.value })}
                        disabled={isSubmitting}
                      >
                        <option value="Product Inquiry">Product Inquiry / Price</option>
                        <option value="Service Request">Warranty / Spare Part Request</option>
                        <option value="Bulk Order">Bulk / Commercial Order</option>
                        <option value="Other">General Question</option>
                      </select>
                    </div>
                  </div>

                  <div className={styles.formGroup}>
                    <label htmlFor="message">Your Message *</label>
                    <textarea
                      id="message"
                      rows={4}
                      required
                      placeholder="Please let us know how we can help you..."
                      value={formData.message}
                      onChange={(e) => {
                        setFormData({ ...formData, message: e.target.value });
                        if (submitError) setSubmitError(null);
                      }}
                      disabled={isSubmitting}
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className={`btn btn-primary btn-lg ${styles.submitBtn}`}
                    style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 size={18} className="animate-spin" />
                        <span>Sending Message...</span>
                      </>
                    ) : (
                      <>
                        <Send size={18} />
                        <span>Submit Inquiry</span>
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
