import React from 'react';
import Link from 'next/link';
import { User, MapPin, Package, ShieldCheck, Phone, LogOut } from 'lucide-react';
import styles from './account.module.css';

export default function AccountPage() {
  return (
    <div className={styles.accountPage}>
      <div className={styles.banner}>
        <div className="container">
          <span className="text-eyebrow">Customer Portal</span>
          <h1 className="heading-section">My Account</h1>
        </div>
      </div>

      <div className="container">
        <div className={styles.layout}>
          {/* Sidebar */}
          <aside className={styles.sidebar}>
            <div className={styles.userProfile}>
              <div className={styles.avatar}>
                <User size={32} />
              </div>
              <div className={styles.userInfo}>
                <h3>Karthik Narayanan</h3>
                <span>+91 98401 23456</span>
                <p>karthik.n@example.com</p>
              </div>
            </div>

            <nav className={styles.navMenu}>
              <Link href="/account" className={`${styles.navItem} ${styles.activeNav}`}>
                <User size={18} />
                <span>Profile &amp; Settings</span>
              </Link>
              <Link href="/orders" className={styles.navItem}>
                <Package size={18} />
                <span>Orders &amp; Tracking</span>
              </Link>
              <Link href="/contact" className={styles.navItem}>
                <Phone size={18} />
                <span>Store Support</span>
              </Link>
              <Link href="/login" className={styles.logoutBtn}>
                <LogOut size={18} />
                <span>Sign Out</span>
              </Link>
            </nav>
          </aside>

          {/* Main Area */}
          <main className={styles.mainContent}>
            {/* Personal Details */}
            <div className={styles.card}>
              <div className={styles.cardHeader}>
                <h3>Personal Information</h3>
                <button type="button" className="btn btn-secondary btn-sm">Edit</button>
              </div>
              <div className={styles.infoGrid}>
                <div>
                  <label>Full Name</label>
                  <p>Karthik Narayanan</p>
                </div>
                <div>
                  <label>Primary Phone</label>
                  <p>+91 98401 23456</p>
                </div>
                <div>
                  <label>Email Address</label>
                  <p>karthik.n@example.com</p>
                </div>
                <div>
                  <label>Preferred Store</label>
                  <p>Chennai Experience Store (T. Nagar)</p>
                </div>
              </div>
            </div>

            {/* Saved Addresses */}
            <div className={styles.card}>
              <div className={styles.cardHeader}>
                <h3>Saved Delivery Addresses</h3>
                <button type="button" className="btn btn-primary btn-sm">+ Add New Address</button>
              </div>

              <div className={styles.addressList}>
                <div className={styles.addressCard}>
                  <div className={styles.addressTag}>
                    <MapPin size={16} />
                    <span>Home (Default)</span>
                  </div>
                  <p className={styles.addressText}>
                    Flat 3B, Sri Krishna Apartments, 14th Cross Street, Indira Nagar, Adyar, Chennai - 600020
                  </p>
                  <span className={styles.addressPhone}>Phone: +91 98401 23456</span>
                </div>

                <div className={styles.addressCard}>
                  <div className={styles.addressTag}>
                    <MapPin size={16} />
                    <span>Family Home (Trichy)</span>
                  </div>
                  <p className={styles.addressText}>
                    18, Salai Road, Thillai Nagar, Trichy - 620018
                  </p>
                  <span className={styles.addressPhone}>Phone: +91 94432 99887</span>
                </div>
              </div>
            </div>

            {/* Warranty Status */}
            <div className={styles.card}>
              <div className={styles.cardHeader}>
                <h3>Active Warranties &amp; Care</h3>
              </div>
              <div className={styles.warrantyBox}>
                <ShieldCheck size={24} className={styles.shieldIcon} />
                <div>
                  <strong>All past purchases from Sriram &amp; Co are recorded by phone number.</strong>
                  <p>You do not need to preserve paper warranty cards. Bring your phone number to any branch for instant coverage.</p>
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
