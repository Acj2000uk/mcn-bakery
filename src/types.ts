export type UserRole = 'admin' | 'kitchen' | 'venue';

export interface UserProfile {
  uid: string;
  email: string;
  role: UserRole;
  venueId?: string;
  displayName?: string;
}

export interface Venue {
  id: string;
  name: string;
  location?: string;
  type: 'kitchen' | 'retail';
}

export interface Product {
  id: string;
  name: string;
  description?: string;
  category?: string;
  imageUrl?: string;
  price: number;
  active?: boolean;
  parStock?: number;
}

export interface InventoryItem {
  venueId: string;
  productId: string;
  quantity: number;
  lastUpdated: any; // Firestore Timestamp
}

export type OrderStatus = 'pending' | 'shipped' | 'received' | 'cancelled';

export interface OrderItem {
  productId: string;
  quantity: number;
}

export interface DistributionOrder {
  id: string;
  venueId: string;
  items: OrderItem[];
  status: OrderStatus;
  statusHistory?: {
    status: OrderStatus;
    timestamp: any;
    updatedBy: string;
  }[];
  orderedBy: string;
  createdAt: any; // Firestore Timestamp
  updatedAt?: any; // Firestore Timestamp
  deliveryDate?: string; // ISO string for the requested delivery day
  notes?: string;
}

export interface VenueMessage {
  id: string;
  content: string;
  type: 'global' | 'individual';
  persistence: 'one-time' | 'persistent';
  targetVenueId?: string;
  active: boolean;
  readBy?: string[];
  createdAt: any; // Firestore Timestamp
}
