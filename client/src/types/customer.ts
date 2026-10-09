export interface CustomerAddress {
  street?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  landmark?: string;
}

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone?: string;
  address?: CustomerAddress;
  role: 'customer' | 'admin';
  createdAt: string;
  ordersCount: number;
  totalSpent: number;
  lastOrderDate?: string | null;
}

export interface CustomerStats {
  totalCustomers: number;
  activeCustomers: number;
  totalRevenue: number;
}
