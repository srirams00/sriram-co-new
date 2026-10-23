'use client';

import React, { useEffect, useState } from 'react';
import {
  Users,
  ShoppingBag,
  TrendingUp,
  Search,
  RefreshCw,
  Mail,
  Phone,
  MapPin,
  Calendar,
  AlertCircle,
  ShieldCheck,
  Trash2,
} from 'lucide-react';
import { api } from '@/lib/api';
import { formatCurrency } from '@/lib/utils';
import { Customer, CustomerStats } from '@/types/customer';
import styles from './customers.module.css';

export default function AdminCustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [stats, setStats] = useState<CustomerStats>({
    totalCustomers: 0,
    activeCustomers: 0,
    totalRevenue: 0,
  });
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [deletingCustomerId, setDeletingCustomerId] = useState<string | null>(null);

  const fetchCustomers = async () => {
    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('src_auth_token') || undefined : undefined;
      const res = await api.getAdminCustomers(token, searchQuery);
      if (res) {
        setCustomers(res.customers || []);
        if (res.stats) setStats(res.stats);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to fetch customer directory');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCustomer = async (customer: Customer) => {
    const confirmed = window.confirm(
      `Permanently delete the account for ${customer.name} (${customer.email})? Their sign-in and profile will be removed, but their order history will be kept.`
    );
    if (!confirmed) return;

    setDeletingCustomerId(customer.id);
    setErrorMsg(null);
    setSuccessMsg(null);
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('src_auth_token') || undefined : undefined;
      const result = await api.deleteAdminCustomer(customer.id, token);
      setCustomers((prev) => prev.filter((item) => item.id !== customer.id));
      setStats((prev) => ({
        totalCustomers: Math.max(0, prev.totalCustomers - 1),
        activeCustomers: Math.max(0, prev.activeCustomers - (customer.ordersCount > 0 ? 1 : 0)),
        totalRevenue: Math.max(0, prev.totalRevenue - customer.totalSpent),
      }));
      setSuccessMsg(result.message);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to delete customer account');
    } finally {
      setDeletingCustomerId(null);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchCustomers();
  };

  const getInitials = (name: string) => {
    if (!name) return 'CU';
    return name
      .split(' ')
      .map((part) => part[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();
  };

  return (
    <div className={styles.customersContainer}>
      {/* Header */}
      <div className={styles.customersHeader}>
        <div className={styles.headerText}>
          <h2 className={styles.title}>Customer Directory</h2>
          <span className={styles.subtitle}>
            Manage registered accounts, view purchase history, and track customer engagement.
          </span>
        </div>
        <div>
          <button type="button" onClick={fetchCustomers} className={styles.refreshBtn}>
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {errorMsg && (
        <div style={{ background: '#FEECEC', color: '#DC2626', padding: '12px 16px', borderRadius: '10px', fontSize: '0.86rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <AlertCircle size={16} />
          <span>{errorMsg}</span>
        </div>
      )}

      {successMsg && (
        <div role="status" style={{ background: '#ECFDF5', color: '#065F46', padding: '12px 16px', borderRadius: '10px', fontSize: '0.86rem' }}>
          {successMsg}
        </div>
      )}

      {/* KPI Metrics */}
      <div className={styles.kpiGrid}>
        <div className={styles.kpiCard}>
          <div className={styles.kpiTopRow}>
            <span className={styles.kpiLabel}>Total Accounts</span>
            <div className={styles.kpiIconWrapper}>
              <Users size={18} />
            </div>
          </div>
          <span className={styles.kpiValue}>{stats.totalCustomers}</span>
          <span className={styles.kpiSubtext}>Verified customer profiles</span>
        </div>

        <div className={styles.kpiCard}>
          <div className={styles.kpiTopRow}>
            <span className={styles.kpiLabel}>Active Buyers</span>
            <div className={styles.kpiIconWrapper} style={{ backgroundColor: '#EBF8F1', color: '#16A34A' }}>
              <ShoppingBag size={18} />
            </div>
          </div>
          <span className={styles.kpiValue}>{stats.activeCustomers}</span>
          <span className={styles.kpiSubtext}>Placed at least 1 order</span>
        </div>

        <div className={styles.kpiCard}>
          <div className={styles.kpiTopRow}>
            <span className={styles.kpiLabel}>Customer Lifetime Value</span>
            <div className={styles.kpiIconWrapper} style={{ backgroundColor: '#EDE9FE', color: '#7C3AED' }}>
              <TrendingUp size={18} />
            </div>
          </div>
          <span className={styles.kpiValue}>{formatCurrency(stats.totalRevenue)}</span>
          <span className={styles.kpiSubtext}>Aggregated customer spend</span>
        </div>
      </div>

      {/* Search Input */}
      <form onSubmit={handleSearchSubmit} className={styles.searchBox}>
        <Search size={16} className={styles.searchIcon} />
        <input
          type="text"
          placeholder="Search by name, email, phone, or city..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className={styles.searchInput}
        />
      </form>

      {/* Customers Table */}
      <div className={styles.tableCard}>
        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#68786D' }}>
            Loading customer profiles...
          </div>
        ) : customers.length === 0 ? (
          <div className={styles.emptyState}>
            <Users size={42} style={{ margin: '0 auto 12px auto', opacity: 0.4 }} />
            <p style={{ fontWeight: 600, color: '#174A2B' }}>No customers found</p>
            <span style={{ fontSize: '0.84rem' }}>
              {searchQuery ? 'Try adjusting your search criteria.' : 'Registered users will appear here.'}
            </span>
          </div>
        ) : (
          <table className={styles.customersTable}>
            <thead>
              <tr>
                <th>Customer</th>
                <th>Phone</th>
                <th>Location</th>
                <th>Orders</th>
                <th>Total Spend</th>
                <th>Joined</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {customers.map((customer) => (
                <tr key={customer.id} className={styles.customerRow}>
                  <td>
                    <div className={styles.customerProfileCell}>
                      <div className={styles.avatarBadge}>{getInitials(customer.name)}</div>
                      <div>
                        <span className={styles.customerName}>{customer.name}</span>
                        <span className={styles.customerEmail}>{customer.email}</span>
                      </div>
                    </div>
                  </td>

                  <td>
                    <span className={styles.phoneText}>
                      {customer.phone || '—'}
                    </span>
                  </td>

                  <td>
                    <span className={styles.cityText}>
                      {customer.address?.city || 'Trichy'}
                    </span>
                  </td>

                  <td>
                    <span className={styles.ordersBadge}>
                      <ShoppingBag size={12} />
                      <span>{customer.ordersCount} orders</span>
                    </span>
                  </td>

                  <td>
                    <span className={styles.totalSpentText}>
                      {formatCurrency(customer.totalSpent)}
                    </span>
                  </td>

                  <td>
                    <span className={styles.joinedDate}>
                      {new Date(customer.createdAt).toLocaleDateString('en-IN', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </span>
                  </td>

                  <td>
                    <button
                      type="button"
                      onClick={() => handleDeleteCustomer(customer)}
                      className={styles.deleteBtn}
                      title={`Delete ${customer.name}'s account`}
                      disabled={deletingCustomerId !== null}
                    >
                      <Trash2 size={13} />
                      <span>{deletingCustomerId === customer.id ? 'Deleting…' : 'Delete'}</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
