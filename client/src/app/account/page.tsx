'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { User, MapPin, Package, ShieldCheck, Phone, LogOut, Edit2, Plus, Loader2 } from 'lucide-react';
import styles from './account.module.css';

interface UserAddress {
  street?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  landmark?: string;
}

interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: string;
  address?: UserAddress;
}

export default function AccountPage() {
  const router = useRouter();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Edit personal info state
  const [isEditingInfo, setIsEditingInfo] = useState(false);
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [savingInfo, setSavingInfo] = useState(false);

  // Edit address state
  const [isEditingAddress, setIsEditingAddress] = useState(false);
  const [editStreet, setEditStreet] = useState('');
  const [editCity, setEditCity] = useState('');
  const [editPostalCode, setEditPostalCode] = useState('');
  const [savingAddress, setSavingAddress] = useState(false);

  const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000/api';

  useEffect(() => {
    async function loadUserProfile() {
      try {
        const token = localStorage.getItem('src_auth_token');
        const storedUser = localStorage.getItem('src_user');

        if (!token) {
          router.replace('/login?redirect=/account');
          return;
        }

        // Hydrate from localStorage first for instant display
        if (storedUser) {
          try {
            const parsed = JSON.parse(storedUser);
            setUser(parsed);
            setEditName(parsed.name || '');
            setEditPhone(parsed.phone || '');
          } catch {}
        }

        // Fetch authoritative fresh profile from MongoDB
        const res = await fetch(`${API_BASE}/auth/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (res.ok) {
          const freshUser = await res.json();
          setUser(freshUser);
          setEditName(freshUser.name || '');
          setEditPhone(freshUser.phone || '');
          if (freshUser.address) {
            setEditStreet(freshUser.address.street || '');
            setEditCity(freshUser.address.city || '');
            setEditPostalCode(freshUser.address.postalCode || '');
          }
          localStorage.setItem('src_user', JSON.stringify(freshUser));
        } else if (res.status === 401) {
          localStorage.removeItem('src_auth_token');
          localStorage.removeItem('src_user');
          router.replace('/login?redirect=/account');
          return;
        }
      } catch (err) {
        console.error('Failed to load user profile', err);
      } finally {
        setLoading(false);
      }
    }

    loadUserProfile();
  }, [API_BASE, router]);

  const handleLogout = () => {
    localStorage.removeItem('src_auth_token');
    localStorage.removeItem('src_user');
    window.dispatchEvent(new Event('auth-change'));
    router.replace('/login');
  };

  const handleSavePersonalInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem('src_auth_token');
    if (!token) return;

    setSavingInfo(true);
    try {
      const res = await fetch(`${API_BASE}/auth/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: editName.trim(),
          phone: editPhone.trim(),
        }),
      });

      if (res.ok) {
        const updated = await res.json();
        setUser(updated);
        localStorage.setItem('src_user', JSON.stringify(updated));
        window.dispatchEvent(new Event('auth-change'));
        setIsEditingInfo(false);
      }
    } catch (err) {
      console.error('Failed to update personal info', err);
    } finally {
      setSavingInfo(false);
    }
  };

  const handleSaveAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem('src_auth_token');
    if (!token) return;

    setSavingAddress(true);
    try {
      const res = await fetch(`${API_BASE}/auth/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          address: {
            street: editStreet.trim(),
            city: editCity.trim(),
            postalCode: editPostalCode.trim(),
            state: 'Tamil Nadu',
          },
        }),
      });

      if (res.ok) {
        const updated = await res.json();
        setUser(updated);
        localStorage.setItem('src_user', JSON.stringify(updated));
        setIsEditingAddress(false);
      }
    } catch (err) {
      console.error('Failed to update address', err);
    } finally {
      setSavingAddress(false);
    }
  };

  if (loading && !user) {
    return (
      <div className={styles.accountPage}>
        <div className={styles.loadingWrapper}>
          <Loader2 className={styles.spinner} size={28} />
          <span style={{ marginLeft: 12 }}>Loading your account details...</span>
        </div>
      </div>
    );
  }

  // Derive initials for avatar
  const initials = user?.name
    ? user.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .slice(0, 2)
        .toUpperCase()
    : 'U';

  const hasSavedAddress = Boolean(user?.address?.street);

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
                {initials ? (
                  <span style={{ fontSize: '1.25rem', fontWeight: 700 }}>{initials}</span>
                ) : (
                  <User size={32} />
                )}
              </div>
              <div className={styles.userInfo}>
                <h3>{user?.name || 'Customer'}</h3>
                <span>{user?.phone || 'No phone added'}</span>
                <p>{user?.email || ''}</p>
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
              <button
                type="button"
                onClick={handleLogout}
                className={styles.logoutBtn}
                style={{ width: '100%', border: 'none', background: 'transparent', cursor: 'pointer', textAlign: 'left' }}
              >
                <LogOut size={18} />
                <span>Sign Out</span>
              </button>
            </nav>
          </aside>

          {/* Main Area */}
          <main className={styles.mainContent}>
            {/* Personal Details */}
            <div className={styles.card}>
              <div className={styles.cardHeader}>
                <h3>Personal Information</h3>
                {!isEditingInfo && (
                  <button
                    type="button"
                    onClick={() => setIsEditingInfo(true)}
                    className="btn btn-secondary btn-sm"
                  >
                    Edit
                  </button>
                )}
              </div>

              {isEditingInfo ? (
                <form onSubmit={handleSavePersonalInfo} className={styles.editForm}>
                  <div className={styles.editRow}>
                    <div className={styles.editGroup}>
                      <label htmlFor="edit-name">Full Name</label>
                      <input
                        id="edit-name"
                        type="text"
                        className={styles.editInput}
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        required
                      />
                    </div>
                    <div className={styles.editGroup}>
                      <label htmlFor="edit-phone">Primary Phone</label>
                      <input
                        id="edit-phone"
                        type="text"
                        className={styles.editInput}
                        value={editPhone}
                        onChange={(e) => setEditPhone(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className={styles.editActions}>
                    <button type="submit" disabled={savingInfo} className={styles.saveBtn}>
                      {savingInfo ? 'Saving...' : 'Save Changes'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsEditingInfo(false)}
                      className={styles.cancelBtn}
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              ) : (
                <div className={styles.infoGrid}>
                  <div>
                    <label>Full Name</label>
                    <p>{user?.name || 'Customer'}</p>
                  </div>
                  <div>
                    <label>Primary Phone</label>
                    <p>{user?.phone || 'Not provided'}</p>
                  </div>
                  <div>
                    <label>Email Address</label>
                    <p>{user?.email || 'Not provided'}</p>
                  </div>
                  <div>
                    <label>Preferred Store</label>
                    <p>Chennai Experience Store (T. Nagar)</p>
                  </div>
                </div>
              )}
            </div>

            {/* Saved Addresses */}
            <div className={styles.card}>
              <div className={styles.cardHeader}>
                <h3>Saved Delivery Addresses</h3>
                {!isEditingAddress && (
                  <button
                    type="button"
                    onClick={() => setIsEditingAddress(true)}
                    className="btn btn-primary btn-sm"
                  >
                    {hasSavedAddress ? 'Edit Address' : '+ Add New Address'}
                  </button>
                )}
              </div>

              {isEditingAddress ? (
                <form onSubmit={handleSaveAddress} className={styles.editForm}>
                  <div className={styles.editGroup}>
                    <label htmlFor="edit-street">Street Address</label>
                    <input
                      id="edit-street"
                      type="text"
                      className={styles.editInput}
                      placeholder="e.g. 15, Anna Nagar 2nd Street"
                      value={editStreet}
                      onChange={(e) => setEditStreet(e.target.value)}
                      required
                    />
                  </div>

                  <div className={styles.editRow}>
                    <div className={styles.editGroup}>
                      <label htmlFor="edit-city">City</label>
                      <input
                        id="edit-city"
                        type="text"
                        className={styles.editInput}
                        placeholder="e.g. Chennai"
                        value={editCity}
                        onChange={(e) => setEditCity(e.target.value)}
                        required
                      />
                    </div>
                    <div className={styles.editGroup}>
                      <label htmlFor="edit-pincode">Postal Code</label>
                      <input
                        id="edit-pincode"
                        type="text"
                        className={styles.editInput}
                        placeholder="e.g. 600040"
                        value={editPostalCode}
                        onChange={(e) => setEditPostalCode(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div className={styles.editActions}>
                    <button type="submit" disabled={savingAddress} className={styles.saveBtn}>
                      {savingAddress ? 'Saving...' : 'Save Address'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsEditingAddress(false)}
                      className={styles.cancelBtn}
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              ) : hasSavedAddress ? (
                <div className={styles.addressList}>
                  <div className={styles.addressCard}>
                    <div className={styles.addressTag}>
                      <MapPin size={16} />
                      <span>Primary Delivery Address</span>
                    </div>
                    <p className={styles.addressText}>
                      {user?.address?.street}
                      {user?.address?.city ? `, ${user.address.city}` : ''}
                      {user?.address?.state ? `, ${user.address.state}` : ''}
                      {user?.address?.postalCode ? ` - ${user.address.postalCode}` : ''}
                    </p>
                    <span className={styles.addressPhone}>
                      Phone: {user?.phone || 'Not provided'}
                    </span>
                  </div>
                </div>
              ) : (
                <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem' }}>
                  No saved addresses yet. Click &quot;+ Add New Address&quot; above to add your delivery address.
                </p>
              )}
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
                  <p>You do not need to preserve paper warranty cards. Bring your phone number ({user?.phone || 'your registered mobile'}) to any branch for instant coverage.</p>
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
