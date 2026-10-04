import React from 'react';
import Link from 'next/link';
import { Phone, Mail, MapPin } from 'lucide-react';
import styles from './Footer.module.css';

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={`container ${styles.footerInner}`}>
        {/* Col 1: Brand Info */}
        <div className={styles.brandCol}>
          <div className={styles.logo}>
            <span className={styles.logoIcon}>
              <span className={styles.logoDot} />
            </span>
            <span className={styles.logoText}>Sriram &amp; Co</span>
          </div>
          <p className={styles.brandDesc}>
            Reliable appliances, power tools, and genuine home essentials backed by personal after-sales care. Direct store delivery across Tamil Nadu.
          </p>
          <div className={styles.trustTag}>
            <span>✓ Registered GST Retailer</span>
            <span>✓ Genuine Manufacturer Warranty</span>
          </div>
        </div>

        {/* Col 2: Shop */}
        <div className={styles.col}>
          <h4 className={styles.colTitle}>Shop</h4>
          <ul className={styles.linkList}>
            <li><Link href="/category/cleaning-appliances">Cleaning</Link></li>
            <li><Link href="/category/kitchen-essentials">Kitchen</Link></li>
            <li><Link href="/category/power-tools">Power Tools</Link></li>
            <li><Link href="/category/garden-outdoor">Garden &amp; Outdoor</Link></li>
            <li><Link href="/category/personal-care">Personal Care</Link></li>
          </ul>
        </div>

        {/* Col 3: Help */}
        <div className={styles.col}>
          <h4 className={styles.colTitle}>Help</h4>
          <ul className={styles.linkList}>
            <li><Link href="/orders">Track your order</Link></li>
            <li><Link href="/contact">Warranty &amp; Service</Link></li>
            <li><Link href="/contact">Store Locations</Link></li>
            <li><Link href="/about">About Us</Link></li>
            <li><Link href="/contact">Delivery terms</Link></li>
          </ul>
        </div>

        {/* Col 4: Get in touch */}
        <div className={styles.col}>
          <h4 className={styles.colTitle}>Get in touch</h4>
          <ul className={styles.contactList}>
            <li className={styles.contactItem}>
              <Phone size={16} className={styles.contactIcon} />
              <span>+91 94432 12345 / 98410 67890</span>
            </li>
            <li className={styles.contactItem}>
              <Mail size={16} className={styles.contactIcon} />
              <span>support@sriramandco.com</span>
            </li>
            <li className={styles.contactItem}>
              <MapPin size={16} className={styles.contactIcon} />
              <span>West Boulevard Rd, Trichy &amp; T. Nagar, Chennai</span>
            </li>
          </ul>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className={styles.bottomBar}>
        <div className={`container ${styles.bottomInner}`}>
          <p>© {new Date().getFullYear()} Sriram &amp; Co. All rights reserved.</p>
          <div className={styles.bottomLinks}>
            <span>Terms of Service</span>
            <span>•</span>
            <span>Privacy Policy</span>
            <span>•</span>
            <span>Verified Merchant</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
