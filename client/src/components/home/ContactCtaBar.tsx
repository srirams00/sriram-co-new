import React from 'react';
import { MessageCircle, Phone, Mail } from 'lucide-react';
import { getWhatsAppUrl } from '@/lib/utils';
import styles from './ContactCtaBar.module.css';

export default function ContactCtaBar() {
  const whatsappUrl = getWhatsAppUrl('9345403136', 'Hello Sriram & Co! I have a question before placing an order.');

  return (
    <section className={styles.section}>
      <div className={`container ${styles.bar}`}>
        <div className={styles.content}>
          <h2 className={styles.title}>Have a question before you buy?</h2>
          <p className={styles.subtitle}>
            Message us on WhatsApp. We usually reply within a few minutes during shop hours. Or call our stores directly.
          </p>
        </div>

        <div className={styles.actions}>
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={`btn btn-whatsapp ${styles.whatsappBtn}`}
          >
            <MessageCircle size={18} />
            <span>Message +91 9345403136</span>
          </a>

          <a href="tel:+919345403136" className={`btn btn-secondary ${styles.callBtn}`}>
            <Phone size={16} />

            <span>Call us</span>
          </a>
        </div>
      </div>
    </section>
  );
}
