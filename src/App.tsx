import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  LayoutDashboard, 
  Package, 
  Truck, 
  Store, 
  Settings, 
  LogOut, 
  Plus, 
  ChevronLeft,
  ChevronRight, 
  AlertCircle,
  CheckCircle2,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  User as UserIcon,
  Lightbulb,
  Calendar,
  Coffee,
  Baby,
  Leaf,
  RotateCcw,
  ChevronDown,
  Printer,
  FileText,
  MessageSquare,
  Bell,
  Globe,
  Download,
  Upload,
  FileUp,
  FileSearch,
  UploadCloud,
  FileCheck,
  AlertTriangle,
  TrendingUp,
  History,
  Info,
  Check,
  Trash2,
  Users,
  Type,
  Wheat,
  Pencil,
  ChefHat,
  UtensilsCrossed,
  ShoppingBag,
  BarChart3,
  MapPin,
  ClipboardList
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  auth, 
  db, 
  handleFirestoreError, 
  OperationType 
} from './firebase';
import { 
  signOut, 
  onAuthStateChanged, 
  signInAnonymously,
  User as FirebaseUser 
} from 'firebase/auth';
import { 
  doc, 
  getDoc, 
  getDocs,
  setDoc, 
  collection, 
  onSnapshot, 
  query, 
  where, 
  addDoc, 
  updateDoc,
  deleteDoc,
  runTransaction,
  writeBatch,
  arrayUnion,
  Timestamp, 
  serverTimestamp,
  orderBy
} from 'firebase/firestore';
import { UserProfile, Venue, Product, InventoryItem, OrderItem, DistributionOrder, OrderStatus, UserRole, VenueMessage } from './types';
import { 
  BarChart, 
  Bar, 
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';
import { 
  format, 
  addDays, 
  isSameDay, 
  startOfToday, 
  startOfWeek, 
  endOfWeek, 
  eachDayOfInterval,
  startOfMonth,
  endOfMonth,
  isWithinInterval,
  subMonths,
  addMonths,
  parseISO
} from 'date-fns';
import { read, utils, write } from 'xlsx';
import mammoth from 'mammoth';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import html2pdf from 'html2pdf.js';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// --- Components ---

const Button = React.forwardRef<HTMLButtonElement, React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger', size?: 'sm' | 'md' | 'lg' }>(
  ({ className, variant = 'primary', size = 'md', ...props }, ref) => {
    const variants = {
      primary: 'bg-orange-600 text-white hover:bg-orange-700 shadow-sm',
      secondary: 'bg-zinc-900 text-white hover:bg-zinc-800 shadow-sm',
      outline: 'border border-zinc-200 bg-transparent hover:bg-zinc-50 text-zinc-900',
      ghost: 'bg-transparent hover:bg-zinc-100 text-zinc-600',
      danger: 'bg-red-600 text-white hover:bg-red-700 shadow-sm',
    };
    const sizes = {
      sm: 'px-3 py-1.5 text-xs',
      md: 'px-4 py-2 text-sm',
      lg: 'px-6 py-3 text-base',
    };
    return (
      <button
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center rounded-lg font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-orange-500 disabled:pointer-events-none disabled:opacity-50',
          variants[variant],
          sizes[size],
          className
        )}
        {...props}
      />
    );
  }
);

const Card = ({ children, className, id, onClick }: { children: React.ReactNode, className?: string, id?: string, onClick?: () => void }) => (
  <div id={id} onClick={onClick} className={cn('bg-white border border-zinc-200 rounded-xl shadow-sm overflow-hidden', className)}>
    {children}
  </div>
);

const Badge = ({ children, variant = 'default', className }: { children: React.ReactNode, variant?: 'default' | 'success' | 'warning' | 'error' | 'info' | 'secondary', className?: string }) => {
  const variants = {
    default: 'bg-zinc-100 text-zinc-600',
    success: 'bg-emerald-50 text-emerald-700 border border-emerald-100',
    warning: 'bg-amber-50 text-amber-700 border border-amber-100',
    error: 'bg-red-50 text-red-700 border border-red-100',
    info: 'bg-blue-50 text-blue-700 border border-blue-100',
    secondary: 'bg-zinc-100 text-zinc-600 border border-zinc-200'
  };
  return (
    <span className={cn('px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider', variants[variant], className)}>
      {children}
    </span>
  );
};

// --- Error Boundary ---

class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean, error: any }> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: any) {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      let errorMessage = "An unexpected error occurred.";
      try {
        const parsed = JSON.parse(this.state.error.message);
        errorMessage = `Firestore Error: ${parsed.operationType} at ${parsed.path || 'unknown path'}. ${parsed.error}`;
      } catch (e) {
        errorMessage = this.state.error.message || errorMessage;
      }

      return (
        <div className="h-screen w-full flex items-center justify-center bg-red-50 p-6">
          <Card className="max-w-lg w-full p-8 border-red-200">
            <div className="flex items-center gap-3 text-red-600 mb-4">
              <AlertCircle size={24} />
              <h2 className="text-xl font-bold">System Error</h2>
            </div>
            <p className="text-zinc-600 mb-6">{errorMessage}</p>
            <Button variant="primary" onClick={() => window.location.reload()}>
              Reload Application
            </Button>
          </Card>
        </div>
      );
    }
    return this.props.children;
  }
}

// --- Main App ---

const PIN_MAP: Record<string, { role: UserRole, name: string, venueId?: string }> = {
  '1111': { role: 'venue', name: 'The Parlour', venueId: 'the-parlour' },
  '2222': { role: 'venue', name: 'Shotton Grange', venueId: 'shotton-grange' },
  '3333': { role: 'venue', name: 'Marshall Meadows', venueId: 'marshall-meadows' },
  '4444': { role: 'venue', name: 'The Gib', venueId: 'the-gib' },
  '5555': { role: 'kitchen', name: 'Central Kitchen' },
  '1664': { role: 'admin', name: 'Administrator' },
  '2610': { role: 'admin', name: 'Administrator' },
};

export default function App() {
  return (
    <ErrorBoundary>
      <AppContent />
    </ErrorBoundary>
  );
}

function AppContent() {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [dataLoading, setDataLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [seedError, setSeedError] = useState<string | null>(null);
  const [venueMessages, setVenueMessages] = useState<VenueMessage[]>([]);
  const [showMessages, setShowMessages] = useState(false);
  const [dismissedMessages, setDismissedMessages] = useState<string[]>([]);
  const [selectedVenueId, setSelectedVenueId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallButton, setShowInstallButton] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handler = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstallButton(true);
    };

    window.addEventListener('beforeinstallprompt', handler);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  const triggerInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      console.log('User accepted the install prompt');
    }
    setDeferredPrompt(null);
    setShowInstallButton(false);
  };
  const [isLargeFont, setIsLargeFont] = useState(() => localStorage.getItem('largeFont') === 'true');
  const [whatsappEnabled, setWhatsappEnabled] = useState(true);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const lastOrderCountRef = useRef<number | null>(null);

  const popupMessages = useMemo(() => {
    const activeVenueId = profile?.role === 'venue' ? profile.venueId : selectedVenueId;
    return venueMessages.filter(msg => {
      // Don't show if already dismissed in this session
      if (dismissedMessages.includes(msg.id)) return false;

      // Check if message is relevant to current context
      const isGlobal = msg.type === 'global';
      const isForThisVenue = activeVenueId && msg.targetVenueId === activeVenueId;
      if (!isGlobal && !isForThisVenue) return false;

      // Check if it should be shown (persistent or not yet read)
      const isPersistent = msg.persistence === 'persistent';
      const isUnread = activeVenueId && !(msg.readBy || []).includes(activeVenueId);
      
      // Global messages show for everyone if persistent or unread
      // If no venue selected (admin), we only show global messages
      if (!activeVenueId) return isGlobal && isPersistent;

      return isPersistent || isUnread;
    });
  }, [venueMessages, profile, selectedVenueId, dismissedMessages]);

  useEffect(() => {
    if (popupMessages.length > 0) {
      setShowMessages(true);
    } else {
      setShowMessages(false);
    }
  }, [popupMessages]);

  const isSuperAdmin = profile?.role === 'admin' && (
    profile?.email === '2610@mcn-bakery.internal' || 
    profile?.email === 'alexcjarvis@gmail.com'
  );

  useEffect(() => {
    document.title = 'MCN Bakery Portal';
  }, []);

  useEffect(() => {
    localStorage.setItem('largeFont', String(isLargeFont));
    if (isLargeFont) {
      document.documentElement.classList.add('large-font');
    } else {
      document.documentElement.classList.remove('large-font');
    }
  }, [isLargeFont]);

  useEffect(() => {
    // Removed auto-redirect to orders to allow users to see the dashboard notice board
  }, [profile, activeTab]);

  const [pin, setPin] = useState('');
  const [pinError, setPinError] = useState(false);
  const [orderSuccessMessage, setOrderSuccessMessage] = useState<string | null>(null);
  
  // Data State
  const [venues, setVenues] = useState<Venue[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [orders, setOrders] = useState<DistributionOrder[]>([]);

  useEffect(() => {
    // Safety timeout: If Firebase takes too long, stop loading anyway
    const timeout = setTimeout(() => {
      if (loading) {
        console.warn('Auth check timed out after 5s - forcing loading to false');
        setLoading(false);
      }
    }, 5000);

    const unsubscribe = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      setDismissedMessages([]); // Reset dismissed messages on auth change
      if (u) {
        try {
          const profileDoc = await getDoc(doc(db, 'users', u.uid));
          if (profileDoc.exists()) {
            setProfile(profileDoc.data() as UserProfile);
          } else if (u.email === 'alexcjarvis@gmail.com') {
            // Auto-create profile for super admin if they log in via Google
            const newProfile: UserProfile = {
              uid: u.uid,
              email: u.email,
              role: 'admin',
              displayName: u.displayName || 'Alex Jarvis'
            };
            await setDoc(doc(db, 'users', u.uid), newProfile);
            setProfile(newProfile);
          } else {
            setProfile(null);
          }
        } catch (error) {
          console.error('Error fetching profile', error);
          setProfile(null);
        }
      } else {
        setProfile(null);
      }
      setLoading(false);
      clearTimeout(timeout);
    });
    return () => {
      unsubscribe();
      clearTimeout(timeout);
    };
  }, []);

  // Real-time Listeners
  useEffect(() => {
    if (!user || !profile) return;

    const unsubVenues = onSnapshot(collection(db, 'venues'), (snapshot) => {
      setVenues(snapshot.docs
        .map(d => ({ id: d.id, ...d.data() } as Venue))
        .filter(v => v.id !== 'central-kitchen')
      );
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'venues'));

    const unsubProducts = onSnapshot(collection(db, 'products'), (snapshot) => {
      const pList = snapshot.docs.map(d => {
        const data = d.data();
        return { ...data, id: d.id } as Product;
      });
      console.log('Products updated:', pList.length);
      setProducts(pList);
      setDataLoading(false);
    }, (err) => {
      handleFirestoreError(err, OperationType.LIST, 'products');
      setDataLoading(false);
    });

    const unsubInventory = onSnapshot(collection(db, 'inventory'), (snapshot) => {
      setInventory(snapshot.docs.map(d => d.data() as InventoryItem));
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'inventory'));

    const unsubOrders = onSnapshot(query(collection(db, 'orders'), orderBy('createdAt', 'desc')), (snapshot) => {
      const newOrders = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as DistributionOrder));
      
      // Audio notification for new orders (Admin/Kitchen only)
      if (profile && (profile.role === 'admin' || profile.role === 'kitchen')) {
        if (lastOrderCountRef.current !== null && newOrders.length > lastOrderCountRef.current) {
          // Only play if the most recent order is new (created within last 30 seconds to avoid noise on reload)
          const latestOrder = newOrders[0];
          if (latestOrder && latestOrder.createdAt) {
            const orderTime = latestOrder.createdAt.toDate().getTime();
            const now = Date.now();
            if (now - orderTime < 30000) {
              audioRef.current?.play().catch(e => console.log('Audio play blocked:', e));
            }
          }
        }
      }
      
      lastOrderCountRef.current = newOrders.length;
      setOrders(newOrders);
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'orders'));

    const unsubSettings = onSnapshot(doc(db, 'settings', 'global'), (snapshot) => {
      if (snapshot.exists()) {
        setWhatsappEnabled(snapshot.data().whatsappEnabled);
      }
    }, (err) => handleFirestoreError(err, OperationType.GET, 'settings/global'));

    return () => {
      unsubVenues();
      unsubProducts();
      unsubInventory();
      unsubOrders();
      unsubSettings();
    };
  }, [user, profile]);

  // Auto-seed if empty
  useEffect(() => {
    if (user && (products.length === 0 || venues.length === 0) && !dataLoading && !loading) {
      seedInitialData();
    }
  }, [user, products, venues, dataLoading, loading]);

  const handlePinSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const account = PIN_MAP[pin];
    if (account) {
      console.log('PIN matched:', account.role, account.name);
      setLoading(true);
      try {
        // Use anonymous auth for PIN-based sessions
        const cred = await signInAnonymously(auth);
        setOrderSuccessMessage(null);
        const newProfile: UserProfile = {
          uid: cred.user.uid,
          email: `${pin}@mcn-bakery.internal`,
          role: account.role,
          displayName: account.name,
          ...(account.venueId ? { venueId: account.venueId } : {})
        };
        await setDoc(doc(db, 'users', cred.user.uid), newProfile);
        setProfile(newProfile);
        setActiveTab('orders');
        setPin('');
        setPinError(false);
      } catch (error: any) {
        console.error('Login error:', error);
        setPinError(true);
        setPin('');
      } finally {
        setLoading(false);
      }
    } else {
      setPinError(true);
      setPin('');
    }
  };

  useEffect(() => {
    if (pin.length === 4) {
      handlePinSubmit();
    }
  }, [pin]);

  useEffect(() => {
    setDismissedMessages([]);
  }, [selectedVenueId, profile?.venueId]);

  useEffect(() => {
    // Only fetch messages if authenticated
    if (!profile) {
      setVenueMessages([]);
      setShowMessages(false);
      return;
    }

    const q = query(
      collection(db, 'venueMessages'), 
      where('active', '==', true),
      orderBy('createdAt', 'desc')
    );
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const allActive = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as VenueMessage));
      const activeVenueId = profile?.role === 'venue' ? profile.venueId : selectedVenueId;
      
      const relevant = allActive.filter(msg => 
        msg.type === 'global' || (activeVenueId && msg.targetVenueId === activeVenueId)
      );
      
      setVenueMessages(relevant);
    }, (error) => handleFirestoreError(error, OperationType.GET, 'venueMessages'));

    return unsubscribe;
  }, [profile, selectedVenueId]);

  const handleDismissMessages = async () => {
    const activeVenueId = profile?.role === 'venue' ? profile.venueId : selectedVenueId;
    if (activeVenueId) {
      try {
        const batch = writeBatch(db);
        // Only mark unread messages as read
        const unreadMessages = venueMessages.filter(msg => !(msg.readBy || []).includes(activeVenueId));
        
        unreadMessages.forEach(msg => {
          const msgRef = doc(db, 'venueMessages', msg.id);
          const updates: any = {
            readBy: arrayUnion(activeVenueId)
          };
          if (msg.persistence === 'one-time') {
            updates.active = false;
          }
          batch.update(msgRef, updates);
        });
        await batch.commit();
      } catch (error) {
        console.error('Error marking messages as read:', error);
      }
    }
    setDismissedMessages(prev => [...prev, ...venueMessages.map(m => m.id)]);
    setShowMessages(false);
  };

  const handleLogout = () => signOut(auth);

  const performSeed = async () => {
    try {
      // Delete existing products and ALL their inventory first for a clean seed
      const productsSnap = await getDocs(collection(db, 'products'));
      for (const p of productsSnap.docs) {
        await deleteDoc(p.ref);
      }
      
      const inventorySnap = await getDocs(collection(db, 'inventory'));
      for (const inv of inventorySnap.docs) {
        await deleteDoc(inv.ref);
      }

      const initialVenues: Venue[] = [
        { id: 'central-kitchen', name: 'Central Kitchen', type: 'kitchen', location: 'Main Hub' },
        { id: 'the-parlour', name: 'The Parlour', type: 'retail', location: 'Venue 1' },
        { id: 'shotton-grange', name: 'Shotton Grange', type: 'retail', location: 'Venue 2' },
        { id: 'marshall-meadows', name: 'Marshall Meadows', type: 'retail', location: 'Venue 3' },
        { id: 'the-gib', name: 'The Gib', type: 'retail', location: 'Tynemouth' },
      ];

      for (const v of initialVenues) {
        await setDoc(doc(db, 'venues', v.id), v);
      }

      const initialProducts = [
        { id: 'sticky-toffee', name: 'Sticky Toffee Pudding', price: 6.50, category: 'Venue Menu', parStock: 1000 },
        { id: 'passionfruit-cheesecake', name: 'Passionfruit Cheesecake, Mango and Mint Salsa (V)', price: 7.00, category: 'Venue Menu', parStock: 1000 },
        { id: 'raspberry-cheesecake', name: 'Raspberry Cheesecake, Prosecco Jelly, Raspberry Gel (V)', price: 7.50, category: 'Venue Menu', parStock: 1000 },
        { id: 'lemon-meringue-pie', name: 'Lemon Meringue Pie (V)', price: 6.50, category: 'Venue Menu', parStock: 1000 },
        { id: 'glazed-lemon-tart', name: 'Glazed Lemon Tart (V)', price: 6.50, category: 'Venue Menu', parStock: 1000 },
        { id: 'strawberry-delice', name: 'Strawberry Delice, Strawberry Jelly, Poppy Seed Tuile (V)', price: 7.00, category: 'Venue Menu', parStock: 1000 },
        { id: 'apple-pear-crumble', name: 'Apple and Pear Crumble, Vanilla Custard (V)', price: 6.50, category: 'Venue Menu', parStock: 1000 },
        { id: 'pear-apricot-crumble', name: 'Pear and Apricot Crumate (V)', price: 6.00, category: 'Venue Menu', parStock: 1000 },
        { id: 'apple-delice', name: 'Apple Delice, Crème Anglaise (V)', price: 6.50, category: 'Venue Menu', parStock: 1000 },
        { id: 'milk-chocolate-pave', name: 'Milk Chocolate Pavé, Caramel Cream (V)', price: 7.00, category: 'Venue Menu', parStock: 1000 },
        { id: 'chocolate-hazelnut-terrine', name: 'Chocolate and Hazelnut Terrine, Praline (V)', price: 7.00, category: 'Venue Menu', parStock: 1000 },
        { id: 'platter-chocolate', name: 'Platter of Chocolate (V)', price: 8.00, category: 'Venue Menu', parStock: 1000 },
        { id: 'platter-chocolate-deluxe', name: 'Platter of Chocolate, Dark Chocolate and Hazelnut Terrine, White Chocolate Panna Cotta, Milk Chocolate and Caramel Dome (V)', price: 8.50, category: 'Venue Menu', parStock: 1000 },
        { id: 'brioche-pudding', name: 'Brioche Bread and Butter Pudding, Vanilla Custard (V)', price: 6.50, category: 'Venue Menu', parStock: 1000 },
        { id: 'rhubarb-creme-brulee', name: 'Rhubarb Crème Brûlée, Shortbread Biscuit, Rhubarb Compote (V)', price: 7.00, category: 'Venue Menu', parStock: 1000 },
        { id: 'children-brownie', name: 'Chocolate Brownie with Vanilla Ice Cream', price: 4.50, category: "Children’s", parStock: 500 },
        { id: 'afternoon-tea', name: 'Afternoon Tea (Total Servings)', price: 15.00, category: 'Afternoon Tea', parStock: 200 },
        { id: 'vegan-mousse', name: 'Chocolate and Hazelnut Mousse', price: 7.00, category: 'Vegan & Gluten Free', parStock: 300 },
        { id: 'vegan-panna-cotta', name: 'Coconut and Mango Panna Cotta', price: 7.00, category: 'Vegan & Gluten Free', parStock: 300 },
        { id: 'vegan-lemon-tart', name: 'Lemon Tart', price: 7.00, category: 'Vegan & Gluten Free', parStock: 300 },
        { id: 'vegan-caramel-tart', name: 'Chocolate Caramel Tart', price: 7.00, category: 'Vegan & Gluten Free', parStock: 300 }
      ];

      for (const p of initialProducts) {
        await setDoc(doc(db, 'products', p.id), p);
        
        // Assign to ALL venues by default
        for (const v of initialVenues) {
          await setDoc(doc(db, 'inventory', `${v.id}_${p.id}`), {
            venueId: v.id,
            productId: p.id,
            quantity: v.type === 'kitchen' ? p.parStock : 0,
            lastUpdated: Timestamp.now()
          });
        }
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'seed');
    }
  };

  const toggleWhatsapp = async () => {
    try {
      await setDoc(doc(db, 'settings', 'global'), { 
        whatsappEnabled: !whatsappEnabled,
        updatedAt: Timestamp.now()
      }, { merge: true });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'settings/global');
    }
  };

  const handleMasterReset = async () => {
    if (seeding) return;
    setSeeding(true);
    setSeedError(null);
    setShowResetConfirm(false);

    try {
      console.log('Starting Master Reset...');
      
      // Collections to clear
      const collectionsToClear = ['orders', 'venueMessages', 'inventory', 'products', 'venues'];
      
      for (const collName of collectionsToClear) {
        const snapshot = await getDocs(collection(db, collName));
        console.log(`Found ${snapshot.docs.length} documents in ${collName}`);
        
        // Firestore batch limit is 500 operations
        const docs = snapshot.docs;
        for (let i = 0; i < docs.length; i += 500) {
          const batch = writeBatch(db);
          const chunk = docs.slice(i, i + 500);
          chunk.forEach(doc => {
            batch.delete(doc.ref);
          });
          await batch.commit();
        }
        console.log(`Cleared collection: ${collName}`);
      }

      // Re-seed initial data
      await performSeed();
      setDismissedMessages([]);
      console.log('Master Reset completed successfully.');
      // Force a reload to ensure all local state and caches are cleared
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (error: any) {
      console.error('Master Reset failed:', error);
      setSeedError(error.message);
    } finally {
      setSeeding(false);
    }
  };

  const seedInitialData = async () => {
    console.log('Starting seedInitialData...');
    const isEmpty = products.length === 0 || venues.length === 0;
    // Allow seeding if admin OR if the database is completely empty
    if (profile?.role !== 'admin' && !isEmpty) return;
    if (seeding) return;
    
    setSeeding(true);
    setSeedError(null);
    try {
      await performSeed();
      console.log('Seeding complete');
    } catch (error: any) {
      console.error('Seeding error:', error);
      setSeedError(error.message || 'Failed to seed menu. Please check your permissions.');
    } finally {
      setSeeding(false);
    }
  };

  if (loading) {
    return (
      <div 
        className="h-screen w-full flex flex-col items-center justify-center bg-zinc-950 p-6 relative overflow-hidden"
        style={{ 
          backgroundImage: "url('https://images.unsplash.com/photo-1517433367423-c7e5b0f35086?auto=format&fit=crop&q=80&w=2000')",
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }}
      >
        <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px]" />
        <div className="relative z-10 flex flex-col items-center gap-8">
          <div className="space-y-4 text-center">
            <div className="w-20 h-20 bg-white/10 backdrop-blur-md border border-white/20 rounded-3xl flex items-center justify-center mx-auto shadow-2xl overflow-hidden">
              <img 
                src="https://storage.googleapis.com/static-assets-public/ais-studio/mcn-collection-logo.png" 
                alt="MCN Logo" 
                className="w-14 h-14 object-contain"
                referrerPolicy="no-referrer"
              />
            </div>
            <h1 className="text-4xl font-serif italic text-white drop-shadow-lg tracking-tight">MCN Bakery</h1>
          </div>
          <motion.div 
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="w-10 h-10 border-4 border-white/20 border-t-orange-500 rounded-full"
          />
          <p className="text-white/40 text-xs font-mono animate-pulse uppercase tracking-widest pt-2">Initializing System</p>
        </div>
      </div>
    );
  }

  if (!user || !profile) {
    return (
      <div 
        className="h-screen w-full flex flex-col items-center justify-center bg-zinc-950 p-6 relative overflow-hidden"
        style={{ 
          backgroundImage: "url('https://images.unsplash.com/photo-1517433367423-c7e5b0f35086?auto=format&fit=crop&q=80&w=2000')",
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }}
      >
        {/* Dark Overlay for readability */}
        <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px]" />
        
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md w-full text-center space-y-8 relative z-10"
        >
          <div className="space-y-2">
            <div className="w-20 h-20 bg-white/10 backdrop-blur-md border border-white/20 rounded-3xl flex items-center justify-center mx-auto shadow-2xl group transition-all hover:scale-105 overflow-hidden">
              <img 
                src="https://storage.googleapis.com/static-assets-public/ais-studio/mcn-collection-logo.png" 
                alt="MCN Logo" 
                className="w-14 h-14 object-contain"
                referrerPolicy="no-referrer"
              />
            </div>
            <h1 className="text-4xl font-serif italic text-white pt-4 drop-shadow-lg tracking-tight">MCN Bakery</h1>
          </div>
          
          <Card className="p-8 space-y-8 border-white/10 bg-white/90 backdrop-blur-xl shadow-2xl rounded-[2.5rem]">
            <div className="space-y-2">
              <h2 className="text-xl font-semibold text-zinc-900">Enter Access PIN</h2>
              <p className="text-sm text-zinc-500">Please enter your 4-digit venue or admin PIN.</p>
            </div>

            {orderSuccessMessage && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }} 
                animate={{ opacity: 1, y: 0 }} 
                className="p-4 bg-emerald-50 border border-emerald-100 rounded-2xl flex items-center gap-3 text-emerald-700"
              >
                <CheckCircle2 size={20} className="shrink-0" />
                <p className="text-sm font-medium">{orderSuccessMessage}</p>
              </motion.div>
            )}

            <div className="flex justify-center gap-3">
              {[0, 1, 2, 3].map((i) => (
                <div 
                  key={i} 
                  className={cn(
                    "w-12 h-16 rounded-xl border-2 flex items-center justify-center text-2xl font-bold transition-all",
                    pin.length > i ? "border-orange-500 bg-orange-50 text-orange-600" : "border-zinc-200 bg-zinc-50 text-zinc-300"
                  )}
                >
                  {pin.length > i ? "•" : ""}
                </div>
              ))}
            </div>

            {pinError && (
              <motion.p 
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }} 
                className="text-red-500 text-sm font-medium"
              >
                Invalid PIN. Please try again.
              </motion.p>
            )}

            <div className="grid grid-cols-3 gap-3">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                <button
                  key={num}
                  onClick={() => {
                    setPinError(false);
                    if (pin.length < 4) setPin(prev => prev + num);
                  }}
                  className="h-16 rounded-xl bg-zinc-50 hover:bg-zinc-100 text-xl font-bold text-zinc-700 transition-colors active:scale-95"
                >
                  {num}
                </button>
              ))}
              <button
                onClick={() => setPin('')}
                className="h-16 rounded-xl bg-zinc-50 hover:bg-zinc-100 text-sm font-bold text-zinc-400 transition-colors"
              >
                Clear
              </button>
              <button
                onClick={() => {
                  setPinError(false);
                  if (pin.length < 4) setPin(prev => prev + '0');
                }}
                className="h-16 rounded-xl bg-zinc-50 hover:bg-zinc-100 text-xl font-bold text-zinc-700 transition-colors active:scale-95"
              >
                0
              </button>
              <button
                onClick={() => setPin(prev => prev.slice(0, -1))}
                className="h-16 rounded-xl bg-zinc-50 hover:bg-zinc-100 text-sm font-bold text-zinc-400 transition-colors"
              >
                Del
              </button>
            </div>

            {user && (
              <div className="pt-4 border-t border-zinc-100">
                <Button 
                  variant="ghost" 
                  className="w-full text-zinc-400 text-xs"
                  onClick={() => signOut(auth)}
                >
                  Clear Session
                </Button>
              </div>
            )}
          </Card>
          
          <p className="text-xs text-zinc-400">
            Authorized personnel only. Access is logged by PIN.
          </p>
        </motion.div>
      </div>
    );
  }

  return (
    <div 
      className="h-screen flex flex-col md:flex-row bg-zinc-50 text-zinc-900 overflow-hidden relative"
      style={{ 
        backgroundImage: "url('https://storage.googleapis.com/static-assets-public/ais-studio/mcn-collection-logo.png')",
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed'
      }}
    >
      <audio 
        ref={audioRef} 
        src="https://assets.mixkit.co/active_storage/sfx/2358/2358-preview.mp3" 
        preload="auto"
      />
      {/* Light Overlay for main app readability */}
      <div className="absolute inset-0 bg-white/90 backdrop-blur-[2px]" />

      {/* Mobile Header */}
      <div className="md:hidden flex items-center justify-between p-4 border-b border-zinc-200 bg-white/80 backdrop-blur-md relative z-20 no-print">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-zinc-900 rounded-lg flex items-center justify-center shadow-sm">
            <Wheat className="text-orange-400 w-5 h-5" />
          </div>
          <span className="font-serif italic text-lg tracking-tight">MCN Bakery</span>
        </div>
        <button 
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="p-2 text-zinc-600 hover:bg-zinc-100 rounded-lg transition-colors"
        >
          {isMobileMenuOpen ? <Plus className="rotate-45" size={24} /> : null}
          {!isMobileMenuOpen && <div className="space-y-1.5">
            <div className="w-6 h-0.5 bg-zinc-600"></div>
            <div className="w-6 h-0.5 bg-zinc-600"></div>
            <div className="w-6 h-0.5 bg-zinc-600"></div>
          </div>}
        </button>
      </div>

      {/* Sidebar */}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-50 w-64 border-r border-zinc-200 bg-white flex flex-col no-print transition-transform duration-300 md:relative md:translate-x-0 md:bg-white/80 md:backdrop-blur-md",
        isMobileMenuOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full"
      )}>
        <div className="p-6 border-bottom border-zinc-100 hidden md:block">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-zinc-900 rounded-xl flex items-center justify-center shadow-md">
              <Wheat className="text-orange-400 w-5 h-5" />
            </div>
            <div className="flex flex-col">
              <span className="font-serif italic text-xl leading-none">MCN Bakery</span>
              <span className="text-[8px] font-bold tracking-[0.2em] text-zinc-400 uppercase mt-1">Portal</span>
            </div>
          </div>
        </div>
        
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          <div className="mb-4 px-3 py-1 bg-zinc-100 rounded text-[9px] font-mono text-zinc-500 text-center uppercase tracking-tighter sm:hidden">
            Build: 2026-04-20 20:35
          </div>
          {isSuperAdmin && (
            <NavItem 
              icon={<ClipboardList size={20} />} 
              label="Product Management" 
              active={activeTab === 'inventory'} 
              onClick={() => { setActiveTab('inventory'); setIsMobileMenuOpen(false); }} 
            />
          )}
          {profile?.role === 'kitchen' && (
            <NavItem 
              icon={<LayoutDashboard size={20} />} 
              label="Dashboard" 
              active={activeTab === 'dashboard'} 
              onClick={() => { setActiveTab('dashboard'); setIsMobileMenuOpen(false); }} 
            />
          )}
          <NavItem 
            icon={<ShoppingBag size={20} />} 
            label={profile?.role === 'venue' ? 'Menu & Orders' : 'Orders'} 
            active={activeTab === 'orders'} 
            onClick={() => { setActiveTab('orders'); setIsMobileMenuOpen(false); }} 
          />
          {(profile?.role === 'admin' || profile?.role === 'kitchen') && (
            <>
              <NavItem 
                icon={<BarChart3 size={20} />} 
                label="Analytics" 
                active={activeTab === 'analytics'} 
                onClick={() => { setActiveTab('analytics'); setIsMobileMenuOpen(false); }} 
              />
              <NavItem 
                icon={<MessageSquare size={20} />} 
                label="Messaging" 
                active={activeTab === 'messaging'} 
                onClick={() => { setActiveTab('messaging'); setIsMobileMenuOpen(false); }} 
              />
              <NavItem 
                icon={<MapPin size={20} />} 
                label="Venues" 
                active={activeTab === 'venues'} 
                onClick={() => { setActiveTab('venues'); setIsMobileMenuOpen(false); }} 
              />
            </>
          )}

          {showInstallButton && (
            <button
              onClick={triggerInstall}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-bold transition-all bg-zinc-900 text-white shadow-lg shadow-zinc-100 mt-4 hover:bg-zinc-800 active:scale-95 animate-bounce"
            >
              <Download size={18} />
              <span>Install App</span>
            </button>
          )}
          <div className="mt-auto pt-4 text-[9px] font-mono text-zinc-400 text-center uppercase tracking-widest border-t border-zinc-50">
            Build: 2026-04-20 20:35 • PRODUCTION READY
          </div>
        </nav>

        <div className="p-4 border-t border-zinc-100 space-y-2">
          <button 
            onClick={() => setIsLargeFont(!isLargeFont)}
            className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest text-zinc-400 hover:bg-zinc-50 hover:text-zinc-900 transition-all group"
          >
            <div className="flex items-center gap-3">
              <Type size={14} className={cn(isLargeFont ? "text-orange-600" : "text-zinc-400")} />
              <span>Visibility Mode</span>
            </div>
            <div className={cn(
              "w-8 h-4 rounded-full relative transition-colors shrink-0",
              isLargeFont ? "bg-orange-600" : "bg-zinc-200"
            )}>
              <div className={cn(
                "absolute top-1 w-2 h-2 rounded-full bg-white transition-all",
                isLargeFont ? "left-5" : "left-1"
              )} />
            </div>
          </button>

          {profile?.role === 'admin' && (
            <button 
              onClick={toggleWhatsapp}
              className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest text-zinc-400 hover:bg-zinc-50 hover:text-zinc-900 transition-all group"
            >
              <div className="flex items-center gap-3">
                <MessageSquare size={14} className={cn(whatsappEnabled ? "text-emerald-600" : "text-zinc-400")} />
                <span>WhatsApp Feature</span>
              </div>
              <div className={cn(
                "w-8 h-4 rounded-full relative transition-colors shrink-0",
                whatsappEnabled ? "bg-emerald-600" : "bg-zinc-200"
              )}>
                <div className={cn(
                  "absolute top-1 w-2 h-2 rounded-full bg-white transition-all",
                  whatsappEnabled ? "left-5" : "left-1"
                )} />
              </div>
            </button>
          )}

          {isSuperAdmin && (
            <>
              <button 
                onClick={() => { seedInitialData(); setIsMobileMenuOpen(false); }}
                disabled={seeding}
                className={cn(
                  "w-full flex items-center justify-between px-3 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all group",
                  seeding ? "text-zinc-300 cursor-not-allowed" : "text-zinc-400 hover:bg-zinc-50 hover:text-zinc-900"
                )}
              >
                <div className="flex items-center gap-3">
                  <RotateCcw size={14} className={cn("transition-transform duration-500", seeding && "animate-spin")} />
                  <span>{seeding ? 'Syncing...' : 'Sync Products'}</span>
                </div>
              </button>
              <button 
                onClick={() => { setShowResetConfirm(true); setIsMobileMenuOpen(false); }}
                disabled={seeding}
                className={cn(
                  "w-full flex items-center justify-between px-3 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all group",
                  seeding ? "text-zinc-300 cursor-not-allowed" : "text-red-400 hover:bg-red-50 hover:text-red-600"
                )}
              >
                <div className="flex items-center gap-3">
                  <Trash2 size={14} />
                  <span>{seeding ? 'Resetting...' : 'Master Reset'}</span>
                </div>
              </button>
            </>
          )}

          <div className="flex items-center gap-3 p-2 rounded-lg bg-zinc-50">
            <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center text-orange-700 font-bold text-xs">
              {profile?.displayName?.[0] || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold truncate">{profile?.displayName}</p>
              <p className="text-[10px] text-zinc-500 uppercase tracking-wider">{profile?.role}</p>
            </div>
          </div>
          <Button variant="ghost" size="sm" className="w-full justify-start gap-2 text-zinc-500" onClick={handleLogout}>
            <LogOut size={16} />
            Sign Out
          </Button>
        </div>
      </aside>

      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-4 md:p-8 print:p-0 relative z-10">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 no-print">
          <div>
            <h2 className="text-2xl md:text-3xl font-serif italic text-zinc-900 capitalize">{activeTab}</h2>
            <p className="text-zinc-500 text-xs md:text-sm">Welcome back, {profile?.displayName}. Here's what's happening today.</p>
          </div>
        </header>

        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {activeTab === 'dashboard' && (
              <DashboardView 
                venues={venues} 
                products={products} 
                inventory={inventory} 
                orders={orders} 
                profile={profile}
                onNavigate={setActiveTab}
                messages={venueMessages}
              />
            )}
            {activeTab === 'inventory' && (
              <InventoryView 
                venues={venues} 
                products={products} 
                inventory={inventory} 
                profile={profile}
              />
            )}
            {activeTab === 'orders' && (
              <OrdersView 
                venues={venues} 
                products={products} 
                inventory={inventory}
                orders={orders} 
                profile={profile}
                dataLoading={dataLoading}
                onSeed={seedInitialData}
                seeding={seeding}
                seedError={seedError}
                whatsappEnabled={whatsappEnabled}
                setOrderSuccessMessage={setOrderSuccessMessage}
              />
            )}
            {activeTab === 'venues' && (
              <VenuesView 
                venues={venues} 
                products={products} 
                inventory={inventory} 
                orders={orders}
                profile={profile}
                selectedVenueId={selectedVenueId}
                setSelectedVenueId={setSelectedVenueId}
              />
            )}
            {activeTab === 'messaging' && <MessagingView venues={venues} profile={profile} />}
            {activeTab === 'analytics' && <AnalyticsView orders={orders} venues={venues} products={products} inventory={inventory} />}
          </motion.div>
        </AnimatePresence>
      </main>

      <AnimatePresence>
        {showMessages && (
          <MessagePopup 
            messages={popupMessages} 
            onDismiss={handleDismissMessages} 
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showResetConfirm && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-zinc-900/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8 text-center"
            >
              <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <AlertCircle size={32} />
              </div>
              <h3 className="text-xl font-bold mb-2">Master Reset</h3>
              <p className="text-zinc-500 mb-8">
                This will permanently delete all orders, messages, inventory, products, and venues. 
                The system will then be re-seeded with initial data. This action cannot be undone.
              </p>
              <div className="flex gap-4">
                <Button variant="outline" className="flex-1" onClick={() => setShowResetConfirm(false)}>
                  Cancel
                </Button>
                <Button variant="danger" className="flex-1" onClick={handleMasterReset}>
                  Reset Everything
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function NavItem({ icon, label, active, onClick }: { icon: React.ReactNode, label: string, active: boolean, onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all group',
        active 
          ? 'bg-orange-50 text-orange-700 shadow-sm shadow-orange-100' 
          : 'text-zinc-500 hover:bg-zinc-50 hover:text-zinc-900'
      )}
    >
      <span className={cn('transition-colors', active ? 'text-orange-600' : 'text-zinc-400 group-hover:text-zinc-600')}>
        {icon}
      </span>
      {label}
    </button>
  );
}

// --- Views ---

function DashboardView({ venues, products, inventory, orders, profile, onNavigate, messages }: { 
  venues: Venue[], 
  products: Product[], 
  inventory: InventoryItem[], 
  orders: DistributionOrder[], 
  profile: UserProfile | null, 
  onNavigate: (tab: string) => void,
  messages: VenueMessage[]
}) {
  const isVenueUser = profile?.role === 'venue';
  const isSuperAdmin = profile?.role === 'admin' && (profile?.email === '2610@mcn-bakery.internal' || profile?.email === 'alexcjarvis@gmail.com');
  
  const stats = useMemo(() => {
    if (isVenueUser) {
      const venueInventory = inventory.filter(i => i.venueId === profile?.venueId);
      const totalStock = venueInventory.reduce((acc, item) => acc + item.quantity, 0);
      const pendingOrders = orders.filter(o => o.venueId === profile?.venueId && o.status === 'pending').length;
      const lowStockItems = venueInventory.filter(i => i.quantity < 10).length;
      
      return [
        { label: 'Your Stock', value: totalStock, icon: <ShoppingBag className="text-zinc-600" />, trend: 'Current level', positive: true },
        { label: 'Pending Orders', value: pendingOrders, icon: <Truck className="text-orange-600" />, trend: 'Awaiting delivery', positive: false },
        { label: 'Low Stock Items', value: lowStockItems, icon: <AlertCircle className="text-red-600" />, trend: 'Needs attention', positive: false },
        { label: 'Last Order', value: orders.filter(o => o.venueId === profile?.venueId)[0]?.status || 'None', icon: <History className="text-emerald-600" />, trend: 'Most recent', positive: true },
      ];
    }

    if (!isSuperAdmin && profile?.role === 'admin') {
      const pendingOrders = orders.filter(o => o.status === 'pending').length;
      return [
        { label: 'Pending Orders', value: pendingOrders, icon: <Truck className="text-orange-600" />, trend: 'All venues', positive: false },
        { label: 'Active Venues', value: venues.length, icon: <MapPin className="text-emerald-600" />, trend: 'All operational', positive: true },
        { label: 'Total Products', value: products.length, icon: <ClipboardList className="text-zinc-600" />, trend: 'In catalog', positive: true },
        { label: 'Total Orders', value: orders.length, icon: <History className="text-zinc-600" />, trend: 'Lifetime', positive: true },
      ];
    }

    const totalStock = inventory.reduce((acc, item) => acc + item.quantity, 0);
    const pendingOrders = orders.filter(o => o.status === 'pending').length;
    const lowStockItems = inventory.filter(i => i.quantity < 10).length;
    
    return [
      { label: 'Total Stock', value: totalStock, icon: <ShoppingBag className="text-zinc-600" />, trend: '+12%', positive: true },
      { label: 'Pending Orders', value: pendingOrders, icon: <Truck className="text-orange-600" />, trend: 'All venues', positive: false },
      { label: 'Low Stock Alerts', value: lowStockItems, icon: <AlertCircle className="text-red-600" />, trend: '-2 since yesterday', positive: true },
      { label: 'Active Venues', value: venues.length, icon: <MapPin className="text-emerald-600" />, trend: 'All operational', positive: true },
    ];
  }, [venues, products, inventory, orders, isVenueUser, profile, isSuperAdmin]);

  const chartData = useMemo(() => {
    if (isVenueUser) {
      return inventory
        .filter(i => i.venueId === profile?.venueId)
        .map(i => ({
          name: products.find(p => p.id === i.productId)?.name || 'Unknown',
          stock: i.quantity
        }));
    }
    return venues.map(v => ({
      name: v.name,
      stock: inventory.filter(i => i.venueId === v.id).reduce((acc, curr) => acc + curr.quantity, 0)
    }));
  }, [venues, inventory, isVenueUser, profile, products]);

  return (
    <div className="space-y-8">
      {messages.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 px-1">
            <Bell size={18} className="text-orange-500" />
            <h3 className="text-sm font-bold text-zinc-800 uppercase tracking-wider">Notice Board</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {messages.map(msg => (
              <Card key={msg.id} className={cn(
                "p-4 border-l-4 relative overflow-hidden",
                msg.type === 'global' ? "border-l-blue-500 bg-blue-50/30" : "border-l-orange-500 bg-orange-50/30"
              )}>
                <div className="flex items-start gap-3">
                  <div className={cn(
                    "p-2 rounded-lg shrink-0",
                    msg.type === 'global' ? "bg-blue-100 text-blue-600" : "bg-orange-100 text-orange-600"
                  )}>
                    {msg.type === 'global' ? <Globe size={18} /> : <MessageSquare size={18} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">
                        {msg.type === 'global' ? 'Global Announcement' : 'Venue Message'}
                      </span>
                      <span className="text-[10px] text-zinc-400">
                        {format(msg.createdAt.toDate(), 'MMM d, h:mm a')}
                      </span>
                    </div>
                    <p className="text-sm text-zinc-800 leading-relaxed">{msg.content}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => {
          const isLowStock = stat.label.includes('Low Stock') && typeof stat.value === 'number' && stat.value > 0;
          return (
            <Card key={i} className={cn("p-6 transition-all", isLowStock && "border-red-100 bg-red-50/30 ring-1 ring-red-100")}>
              <div className="flex items-start justify-between mb-4">
                <div className="p-2 bg-zinc-50 rounded-lg">
                  {stat.icon}
                </div>
                <span className={cn('text-[10px] font-bold px-2 py-0.5 rounded-full', stat.positive ? 'bg-emerald-50 text-emerald-600' : 'bg-orange-50 text-orange-600')}>
                  {stat.trend}
                </span>
              </div>
              <p className="text-zinc-500 text-sm font-medium uppercase tracking-wider mb-1">{stat.label}</p>
              <h3 className={cn("text-3xl font-mono font-bold tracking-tighter", isLowStock && "text-red-600")}>{stat.value}</h3>
            </Card>
          );
        })}
      </div>

      <div className={cn("grid grid-cols-1 gap-8", isSuperAdmin || isVenueUser ? "lg:grid-cols-3" : "lg:grid-cols-1")}>
        {(isSuperAdmin || isVenueUser) && (
          <Card className="lg:col-span-2 p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-semibold text-lg">{isVenueUser ? 'Your Stock Levels' : 'Stock Levels by Venue'}</h3>
              {isVenueUser && (
                <Button variant="primary" size="sm" onClick={() => onNavigate('orders')}>Place New Order</Button>
              )}
            </div>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f1f1" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#888' }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#888' }} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                    cursor={{ fill: '#f9f9f9' }}
                  />
                  <Bar dataKey="stock" fill="#2563eb" radius={[4, 4, 0, 0]} barSize={40} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        )}

        <Card className={cn("p-6", !(isSuperAdmin || isVenueUser) && "w-full")}>
          <h3 className="font-semibold text-lg mb-6">Recent Activity</h3>
          <div className="space-y-6">
            {orders.slice(0, 5).map((order) => {
              const venue = venues.find(v => v.id === order.venueId);
              return (
                <div key={order.id} className="flex items-start gap-4">
                  <div className={cn(
                    'p-2 rounded-lg',
                    order.status === 'received' ? 'bg-emerald-50 text-emerald-600' : 
                    order.status === 'shipped' ? 'bg-blue-50 text-blue-600' : 'bg-amber-50 text-amber-600'
                  )}>
                    {order.status === 'received' ? <CheckCircle2 size={18} /> : 
                     order.status === 'shipped' ? <Truck size={18} /> : <Clock size={18} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-base font-semibold truncate">{isVenueUser ? 'Order ' + order.status : (venue?.name || 'Unknown Venue')}</p>
                    <p className="text-sm text-zinc-500">{order.items.length} items • {format(order.createdAt.toDate(), 'MMM d, h:mm a')}</p>
                  </div>
                  <Badge variant={order.status === 'received' ? 'success' : order.status === 'shipped' ? 'info' : 'warning'}>
                    {order.status}
                  </Badge>
                </div>
              );
            })}
            {orders.length === 0 && (
              <div className="text-center py-8 text-zinc-400">
                <Truck className="mx-auto mb-2 opacity-20" size={32} />
                <p className="text-sm">No orders found</p>
              </div>
            )}
          </div>
          <Button variant="ghost" size="sm" className="w-full mt-6 text-zinc-500" onClick={() => onNavigate('orders')}>View All Orders</Button>
        </Card>
      </div>
    </div>
  );
}

function InventoryView({ venues, products, inventory, profile }: { venues: Venue[], products: Product[], inventory: InventoryItem[], profile: UserProfile | null }) {
  const [activeSubTab, setActiveSubTab] = useState<'freezer' | 'desserts'>('freezer');
  const [editingItem, setEditingItem] = useState<{ 
    id: string, 
    name: string, 
    description: string,
    category: string,
    price: number,
    stock: number, 
    parStock: number,
    selectedVenues: string[],
    imageUrl?: string | null
  } | null>(null);
  const [isAddingProduct, setIsAddingProduct] = useState(false);
  const [newProduct, setNewProduct] = useState({ 
    name: '', 
    description: '', 
    category: 'Venue Menu', 
    price: 0, 
    parStock: 1000,
    selectedVenues: [] as string[],
    imageUrl: null as string | null
  });

  const kitchenInventory = useMemo(() => {
    return inventory.filter(i => i.venueId === 'central-kitchen');
  }, [inventory]);

  const filteredItems = useMemo(() => {
    let items = products.map(p => {
      const inv = kitchenInventory.find(i => i.productId === p.id);
      const parStock = p.parStock ?? 1000;
      return {
        ...p,
        stock: inv?.quantity ?? 0,
        target: parStock,
        status: (inv?.quantity ?? 0) >= parStock ? 'OK' : 'LOW'
      };
    });

    items.sort((a, b) => a.name.localeCompare(b.name));

    return items;
  }, [products, kitchenInventory]);

  const handleResetStock = async (productId: string) => {
    try {
      const product = products.find(p => p.id === productId);
      const parStock = product?.parStock ?? 1000;
      const id = `central-kitchen_${productId}`;
      await setDoc(doc(db, 'inventory', id), {
        venueId: 'central-kitchen',
        productId,
        quantity: parStock,
        lastUpdated: Timestamp.now()
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `inventory/central-kitchen_${productId}`);
    }
  };

  const handleResetAllStock = async () => {
    try {
      for (const p of products) {
        const parStock = p.parStock ?? 1000;
        const id = `central-kitchen_${p.id}`;
        await setDoc(doc(db, 'inventory', id), {
          venueId: 'central-kitchen',
          productId: p.id,
          quantity: parStock,
          lastUpdated: Timestamp.now()
        });
      }
      console.log('All stock levels reset to par!');
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'inventory/all');
    }
  };

  const handleUpdateInventory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;

    try {
      // Update Product details
      await updateDoc(doc(db, 'products', editingItem.id), {
        name: editingItem.name,
        category: editingItem.category ?? 'Other',
        price: editingItem.price,
        parStock: editingItem.parStock ?? 0,
        description: editingItem.description ?? '',
        imageUrl: editingItem.imageUrl ?? null
      });

      // Update Central Kitchen Inventory
      const kitchenInvId = `central-kitchen_${editingItem.id}`;
      await setDoc(doc(db, 'inventory', kitchenInvId), {
        venueId: 'central-kitchen',
        productId: editingItem.id,
        quantity: editingItem.stock,
        lastUpdated: Timestamp.now()
      });

      // Manage Retail Venue Inventories
      const retailVenues = venues.filter(v => v.type === 'retail');
      for (const venue of retailVenues) {
        const invId = `${venue.id}_${editingItem.id}`;
        const isSelected = editingItem.selectedVenues.includes(venue.id);
        const hasExisting = inventory.some(i => i.venueId === venue.id && i.productId === editingItem.id);

        if (isSelected && !hasExisting) {
          // Add to venue
          await setDoc(doc(db, 'inventory', invId), {
            venueId: venue.id,
            productId: editingItem.id,
            quantity: 0,
            lastUpdated: Timestamp.now()
          });
        } else if (!isSelected && hasExisting) {
          // Remove from venue
          await deleteDoc(doc(db, 'inventory', invId));
        }
      }

      setEditingItem(null);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'inventory/update');
    }
  };

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProduct.name || newProduct.price <= 0) return;

    try {
      const productId = newProduct.name.toLowerCase().replace(/\s+/g, '-');
      
      // Add Product
      const { selectedVenues, ...productData } = newProduct;
      await setDoc(doc(db, 'products', productId), {
        id: productId,
        name: productData.name,
        price: productData.price,
        category: productData.category ?? 'Other',
        description: productData.description ?? '',
        parStock: productData.parStock ?? 0,
        imageUrl: productData.imageUrl ?? null,
        active: true
      });

      // Initialize Inventory for Central Kitchen (always)
      const kitchenInvId = `central-kitchen_${productId}`;
      await setDoc(doc(db, 'inventory', kitchenInvId), {
        venueId: 'central-kitchen',
        productId: productId,
        quantity: newProduct.parStock,
        lastUpdated: Timestamp.now()
      });

      // Initialize Inventory for selected venues
      for (const venueId of selectedVenues) {
        if (venueId === 'central-kitchen') continue;
        const invId = `${venueId}_${productId}`;
        await setDoc(doc(db, 'inventory', invId), {
          venueId: venueId,
          productId: productId,
          quantity: 0, // Venues start with 0 stock
          lastUpdated: Timestamp.now()
        });
      }

      setIsAddingProduct(false);
      setNewProduct({ 
        name: '', 
        description: '', 
        category: 'Venue Menu', 
        price: 0, 
        parStock: 1000,
        selectedVenues: [],
        imageUrl: null
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'products/add');
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    try {
      await deleteDoc(doc(db, 'products', productId));
      
      // Delete inventory records for all venues
      for (const venue of venues) {
        await deleteDoc(doc(db, 'inventory', `${venue.id}_${productId}`));
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `products/${productId}`);
    }
  };

  if (profile?.role !== 'admin' || (profile?.email !== '2610@mcn-bakery.internal' && profile?.email !== 'alexcjarvis@gmail.com')) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-zinc-500">
        <AlertCircle size={48} className="mb-4 opacity-20" />
        <p>You do not have permission to access the Freezer Inventory.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-[1400px] mx-auto">
      {/* Header Section */}
      <div className="space-y-4">
        <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">KITCHEN</div>
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-orange-50 rounded-xl flex items-center justify-center">
                <Package className="text-orange-800 w-5 h-5" />
              </div>
              <div>
                <h1 className="text-xl md:text-2xl font-bold text-zinc-900">Freezer Inventory</h1>
                <p className="text-xs text-zinc-500">Manage stock levels and product information</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-4 sm:text-right">
            <div className="flex flex-col sm:items-end">
              <div className="text-xl md:text-2xl font-bold text-zinc-900">{products.length}</div>
              <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">products</div>
            </div>
          </div>
        </div>
      </div>

      {/* Manage Section */}
      <div className="space-y-6">
        <div className="flex items-center justify-between border-b border-zinc-100 pb-4">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 bg-orange-50 rounded flex items-center justify-center">
              <Settings size={12} className="text-orange-800" />
            </div>
            <h2 className="text-sm font-bold text-zinc-800">Manage</h2>
          </div>
          <div className="flex gap-2">
            <Button 
              size="sm" 
              className="bg-orange-800 hover:bg-orange-900 text-white gap-2"
              onClick={() => setIsAddingProduct(true)}
            >
              <Plus size={14} />
              <span className="hidden sm:inline">Add Product</span>
              <span className="sm:hidden">Add</span>
            </Button>
          </div>
        </div>

        {/* Sub Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
          <button 
            onClick={() => setActiveSubTab('freezer')}
            className={cn(
              "px-3 py-1.5 rounded-md text-[10px] font-bold uppercase tracking-wider transition-all whitespace-nowrap",
              activeSubTab === 'freezer' ? "bg-blue-600 text-white" : "bg-zinc-100 text-zinc-500 hover:bg-zinc-200"
            )}
          >
            Freezer Inventory
          </button>
          <button 
            onClick={() => setActiveSubTab('desserts')}
            className={cn(
              "px-3 py-1.5 rounded-md text-[10px] font-bold uppercase tracking-wider transition-all whitespace-nowrap",
              activeSubTab === 'desserts' ? "bg-blue-600 text-white" : "bg-zinc-100 text-zinc-500 hover:bg-zinc-200"
            )}
          >
            Dessert Descriptions
          </button>
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl border border-zinc-100 overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[600px]">
            <thead>
              <tr className="border-b border-zinc-100 bg-zinc-50/50">
                <th className="px-6 py-3 text-xs font-bold text-zinc-500 uppercase tracking-widest">Product</th>
                <th className="px-6 py-3 text-xs font-bold text-zinc-500 uppercase tracking-widest">Stock</th>
                <th className="px-6 py-3 text-xs font-bold text-zinc-500 uppercase tracking-widest">Target</th>
                <th className="px-6 py-3 text-xs font-bold text-zinc-500 uppercase tracking-widest">Status</th>
                <th className="px-6 py-3 text-right"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-50">
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-zinc-400 text-sm">
                    No products found. Click "Sync Products" in the sidebar to initialize your inventory.
                  </td>
                </tr>
              ) : filteredItems.map((item) => (
                <tr key={item.id} className="group hover:bg-zinc-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="text-base font-semibold text-zinc-900">{item.name}</div>
                    {activeSubTab === 'desserts' && (
                      <div className="text-sm text-zinc-600 mt-1">{item.description || 'No description available.'}</div>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-base font-bold text-zinc-900">{item.stock}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-base text-zinc-600">{item.target}</div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={cn(
                      "px-2 py-1 rounded border text-xs font-bold",
                      item.status === 'OK' 
                        ? "bg-emerald-50 text-emerald-700 border-emerald-100" 
                        : "bg-red-50 text-red-700 border-red-100"
                    )}>
                      {item.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button 
                        onClick={() => {
                          const productVenues = inventory
                            .filter(i => i.productId === item.id && i.venueId !== 'central-kitchen')
                            .map(i => i.venueId);
                          
                          setEditingItem({ 
                            id: item.id, 
                            name: item.name, 
                            description: item.description || '',
                            category: item.category || 'Venue Menu',
                            price: item.price || 0,
                            stock: item.stock, 
                            parStock: item.target,
                            selectedVenues: productVenues,
                            imageUrl: item.imageUrl || null
                          });
                        }}
                        className="p-2 text-zinc-300 hover:text-blue-600 transition-colors"
                        title="Manage Venues"
                      >
                        <Users size={16} />
                      </button>
                      <button 
                        onClick={() => {
                          const productVenues = inventory
                            .filter(i => i.productId === item.id && i.venueId !== 'central-kitchen')
                            .map(i => i.venueId);
                          
                          setEditingItem({ 
                            id: item.id, 
                            name: item.name, 
                            description: item.description || '',
                            category: item.category || 'Venue Menu',
                            price: item.price || 0,
                            stock: item.stock, 
                            parStock: item.target,
                            selectedVenues: productVenues,
                            imageUrl: item.imageUrl || null
                          });
                        }}
                        className="p-2 text-zinc-300 hover:text-orange-600 transition-colors"
                        title="Edit Product Details"
                      >
                        <Settings size={16} />
                      </button>
                      <button 
                        onClick={() => handleResetStock(item.id)}
                        className="p-2 text-zinc-300 hover:text-zinc-600 transition-colors"
                        title={`Reset to Par (${item.target})`}
                      >
                        <RotateCcw size={16} />
                      </button>
                      <button 
                        onClick={() => handleDeleteProduct(item.id)}
                        className="p-2 text-zinc-300 hover:text-red-600 transition-colors"
                        title="Delete Product"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Modal */}
      <AnimatePresence>
        {editingItem && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-900/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
            >
              <div className="p-6 border-b border-zinc-100 flex items-center justify-between">
                <h3 className="text-xl font-semibold">Edit Product: {editingItem.name}</h3>
                <button onClick={() => setEditingItem(null)} className="text-zinc-400 hover:text-zinc-600">×</button>
              </div>
              <form onSubmit={handleUpdateInventory} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-sm font-bold uppercase tracking-wider text-zinc-600">Product Name</label>
                    <input 
                      type="text" 
                      required
                      value={editingItem.name} 
                      onChange={(e) => setEditingItem(prev => prev ? { ...prev, name: e.target.value } : null)}
                      className="w-full bg-zinc-50 border border-zinc-200 rounded-lg px-4 py-2 text-base focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-bold uppercase tracking-wider text-zinc-600">Category</label>
                    <select 
                      value={editingItem.category} 
                      onChange={(e) => setEditingItem(prev => prev ? { ...prev, category: e.target.value } : null)}
                      className="w-full bg-zinc-50 border border-zinc-200 rounded-lg px-4 py-2 text-base focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                    >
                      <option value="Venue Menu">Venue Menu</option>
                      <option value="Children’s">Children’s</option>
                      <option value="Afternoon Tea">Afternoon Tea</option>
                      <option value="Vegan & Gluten Free">Vegan & Gluten Free</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-sm font-bold uppercase tracking-wider text-zinc-600">Price (£)</label>
                    <input 
                      type="number" 
                      step="0.01"
                      required
                      value={editingItem.price} 
                      onChange={(e) => setEditingItem(prev => prev ? { ...prev, price: parseFloat(e.target.value) || 0 } : null)}
                      className="w-full bg-zinc-50 border border-zinc-200 rounded-lg px-4 py-2 text-base focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-bold uppercase tracking-wider text-zinc-600">Par Stock (Target)</label>
                    <input 
                      type="number" 
                      required
                      value={editingItem.parStock} 
                      onChange={(e) => setEditingItem(prev => prev ? { ...prev, parStock: parseInt(e.target.value) || 0 } : null)}
                      className="w-full bg-zinc-50 border border-zinc-200 rounded-lg px-4 py-2 text-base focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-sm font-bold uppercase tracking-wider text-zinc-600">Current Kitchen Stock</label>
                  <div className="flex items-center gap-3">
                    <input 
                      type="number" 
                      value={editingItem.stock} 
                      onChange={(e) => setEditingItem(prev => prev ? { ...prev, stock: parseInt(e.target.value) || 0 } : null)}
                      className="flex-1 bg-zinc-50 border border-zinc-200 rounded-lg px-4 py-2 text-base focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                    />
                    <div className="flex gap-1">
                      <button 
                        type="button"
                        onClick={() => setEditingItem(prev => prev ? { ...prev, stock: prev.stock + 10 } : null)}
                        className="px-2 py-1 bg-zinc-100 rounded text-[10px] font-bold hover:bg-zinc-200"
                      >
                        +10
                      </button>
                      <button 
                        type="button"
                        onClick={() => setEditingItem(prev => prev ? { ...prev, stock: prev.stock + 50 } : null)}
                        className="px-2 py-1 bg-zinc-100 rounded text-[10px] font-bold hover:bg-zinc-200"
                      >
                        +50
                      </button>
                    </div>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-sm font-bold uppercase tracking-wider text-zinc-600">Description</label>
                  <textarea 
                    value={editingItem.description} 
                    onChange={(e) => setEditingItem(prev => prev ? { ...prev, description: e.target.value } : null)}
                    className="w-full bg-zinc-50 border border-zinc-200 rounded-lg px-4 py-2 text-base focus:outline-none focus:ring-2 focus:ring-orange-500/20 h-20 resize-none"
                    placeholder="Brief description for venues..."
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-bold uppercase tracking-wider text-zinc-600">Assigned Venues</label>
                    <button 
                      type="button"
                      onClick={() => {
                        const allRetailVenues = venues.filter(v => v.type === 'retail').map(v => v.id);
                        setEditingItem(prev => prev ? {
                          ...prev,
                          selectedVenues: prev.selectedVenues.length === allRetailVenues.length ? [] : allRetailVenues
                        } : null);
                      }}
                      className="text-xs font-bold text-orange-600 hover:text-orange-700 uppercase tracking-wider"
                    >
                      {editingItem.selectedVenues.length === venues.filter(v => v.type === 'retail').length ? 'Deselect All' : 'Select All'}
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto p-2 border border-zinc-100 rounded-lg bg-zinc-50">
                    {venues.filter(v => v.type === 'retail').map(venue => (
                      <label key={venue.id} className="flex items-center gap-2 cursor-pointer group">
                        <input 
                          type="checkbox"
                          checked={editingItem.selectedVenues.includes(venue.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setEditingItem(prev => prev ? { ...prev, selectedVenues: [...prev.selectedVenues, venue.id] } : null);
                            } else {
                              setEditingItem(prev => prev ? { ...prev, selectedVenues: prev.selectedVenues.filter(id => id !== venue.id) } : null);
                            }
                          }}
                          className="rounded border-zinc-300 text-orange-600 focus:ring-orange-500"
                        />
                        <span className="text-sm text-zinc-600 group-hover:text-zinc-900 transition-colors">{venue.name}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="pt-4 flex gap-3">
                  <Button type="button" variant="outline" className="flex-1" onClick={() => setEditingItem(null)}>Cancel</Button>
                  <Button type="submit" variant="primary" className="flex-1">Save Changes</Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Add Product Modal */}
      <AnimatePresence>
        {isAddingProduct && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-900/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
            >
              <div className="p-6 border-b border-zinc-100 flex items-center justify-between">
                <h3 className="text-xl font-semibold">Add New Product</h3>
                <button onClick={() => setIsAddingProduct(false)} className="text-zinc-400 hover:text-zinc-600">×</button>
              </div>
              <form onSubmit={handleAddProduct} className="p-6 space-y-4">
                <div className="space-y-1">
                  <label className="text-sm font-bold uppercase tracking-wider text-zinc-600">Product Name</label>
                  <input 
                    type="text" 
                    required
                    value={newProduct.name} 
                    onChange={(e) => setNewProduct(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full bg-zinc-50 border border-zinc-200 rounded-lg px-4 py-2 text-base focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                    placeholder="e.g. Chocolate Cake"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-bold uppercase tracking-wider text-zinc-600">Category</label>
                  <select 
                    value={newProduct.category} 
                    onChange={(e) => setNewProduct(prev => ({ ...prev, category: e.target.value }))}
                    className="w-full bg-zinc-50 border border-zinc-200 rounded-lg px-4 py-2 text-base focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                  >
                    <option value="Venue Menu">Venue Menu</option>
                    <option value="Children’s">Children’s</option>
                    <option value="Afternoon Tea">Afternoon Tea</option>
                    <option value="Vegan & Gluten Free">Vegan & Gluten Free</option>
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-sm font-bold uppercase tracking-wider text-zinc-600">Price (£)</label>
                    <input 
                      type="number" 
                      step="0.01"
                      required
                      value={newProduct.price} 
                      onChange={(e) => setNewProduct(prev => ({ ...prev, price: parseFloat(e.target.value) || 0 }))}
                      className="w-full bg-zinc-50 border border-zinc-200 rounded-lg px-4 py-2 text-base focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-bold uppercase tracking-wider text-zinc-600">Initial Par Stock</label>
                    <input 
                      type="number" 
                      required
                      value={newProduct.parStock} 
                      onChange={(e) => setNewProduct(prev => ({ ...prev, parStock: parseInt(e.target.value) || 0 }))}
                      className="w-full bg-zinc-50 border border-zinc-200 rounded-lg px-4 py-2 text-base focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-bold uppercase tracking-wider text-zinc-600">Description (Optional)</label>
                  <textarea 
                    value={newProduct.description} 
                    onChange={(e) => setNewProduct(prev => ({ ...prev, description: e.target.value }))}
                    className="w-full bg-zinc-50 border border-zinc-200 rounded-lg px-4 py-2 text-base focus:outline-none focus:ring-2 focus:ring-orange-500/20 h-20 resize-none"
                    placeholder="Brief description for venues..."
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-bold uppercase tracking-wider text-zinc-600">Add to Venues</label>
                    <button 
                      type="button"
                      onClick={() => {
                        const allRetailVenues = venues.filter(v => v.type === 'retail').map(v => v.id);
                        setNewProduct(prev => ({
                          ...prev,
                          selectedVenues: prev.selectedVenues.length === allRetailVenues.length ? [] : allRetailVenues
                        }));
                      }}
                      className="text-xs font-bold text-orange-600 hover:text-orange-700 uppercase tracking-wider"
                    >
                      {newProduct.selectedVenues.length === venues.filter(v => v.type === 'retail').length ? 'Deselect All' : 'Select All'}
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto p-2 border border-zinc-100 rounded-lg bg-zinc-50">
                    {venues.filter(v => v.type === 'retail').map(venue => (
                      <label key={venue.id} className="flex items-center gap-2 cursor-pointer group">
                        <input 
                          type="checkbox"
                          checked={newProduct.selectedVenues.includes(venue.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setNewProduct(prev => ({ ...prev, selectedVenues: [...prev.selectedVenues, venue.id] }));
                            } else {
                              setNewProduct(prev => ({ ...prev, selectedVenues: prev.selectedVenues.filter(id => id !== venue.id) }));
                            }
                          }}
                          className="rounded border-zinc-300 text-orange-600 focus:ring-orange-500"
                        />
                        <span className="text-sm text-zinc-600 group-hover:text-zinc-900 transition-colors">{venue.name}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="pt-4 flex gap-3">
                  <Button type="button" variant="outline" className="flex-1" onClick={() => setIsAddingProduct(false)}>Cancel</Button>
                  <Button type="submit" variant="primary" className="flex-1">Add Product</Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function WeeklySheet({ 
  venues, 
  products, 
  orders, 
  startDate, 
  endDate, 
  onBack, 
  onPrevWeek, 
  onNextWeek,
  onStartDateChange,
  onEndDateChange
}: { 
  venues: Venue[], 
  products: Product[], 
  orders: DistributionOrder[], 
  startDate: Date, 
  endDate: Date, 
  onBack: () => void, 
  onPrevWeek: () => void, 
  onNextWeek: () => void,
  onStartDateChange: (date: string) => void,
  onEndDateChange: (date: string) => void
}) {
  const [showAllActive, setShowAllActive] = useState(false);
  const [showTotals, setShowTotals] = useState(true);
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [tempNote, setTempNote] = useState('');
  const [addingItemId, setAddingItemId] = useState<string | null>(null);
  const [itemToAdd, setItemToAdd] = useState<{ productId: string, quantity: number }>({ productId: '', quantity: 1 });

  const handleAddItem = async (orderId: string) => {
    if (!itemToAdd.productId || itemToAdd.quantity <= 0) return;
    try {
      await runTransaction(db, async (transaction) => {
        const orderRef = doc(db, 'orders', orderId);
        const orderDoc = await transaction.get(orderRef);
        if (!orderDoc.exists()) throw new Error('Order not found');
        
        const order = orderDoc.data() as DistributionOrder;
        const existingItemIndex = order.items.findIndex(i => i.productId === itemToAdd.productId);
        let newItems = [...order.items];
        
        if (existingItemIndex > -1) {
          newItems[existingItemIndex] = {
            ...newItems[existingItemIndex],
            quantity: newItems[existingItemIndex].quantity + itemToAdd.quantity
          };
        } else {
          newItems.push({ productId: itemToAdd.productId, quantity: itemToAdd.quantity });
        }

        // Only update kitchen inventory if order is NOT cancelled
        if (order.status !== 'cancelled') {
          const kitchenInvRef = doc(db, 'inventory', `central-kitchen_${itemToAdd.productId}`);
          const kitchenInvDoc = await transaction.get(kitchenInvRef);
          if (kitchenInvDoc.exists()) {
            transaction.update(kitchenInvRef, {
              quantity: Math.max(0, (kitchenInvDoc.data().quantity || 0) - itemToAdd.quantity),
              lastUpdated: serverTimestamp()
            });
          }
        }

        transaction.update(orderRef, {
          items: newItems,
          updatedAt: serverTimestamp()
        });
      });
      setAddingItemId(null);
      setItemToAdd({ productId: '', quantity: 1 });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `orders/${orderId}`);
    }
  };

  const handleRemoveItem = async (orderId: string, productId: string) => {
    try {
      await runTransaction(db, async (transaction) => {
        const orderRef = doc(db, 'orders', orderId);
        const orderDoc = await transaction.get(orderRef);
        if (!orderDoc.exists()) throw new Error('Order not found');
        
        const order = orderDoc.data() as DistributionOrder;
        const removedItem = order.items.find(item => item.productId === productId);
        if (!removedItem) return;
        
        const newItems = order.items.filter(item => item.productId !== productId);

        // Only restore kitchen inventory if order was NOT cancelled
        if (order.status !== 'cancelled') {
          const kitchenInvRef = doc(db, 'inventory', `central-kitchen_${productId}`);
          const kitchenInvDoc = await transaction.get(kitchenInvRef);
          if (kitchenInvDoc.exists()) {
            transaction.update(kitchenInvRef, {
              quantity: (kitchenInvDoc.data().quantity || 0) + removedItem.quantity,
              lastUpdated: serverTimestamp()
            });
          }
        }

        transaction.update(orderRef, {
          items: newItems,
          updatedAt: serverTimestamp()
        });
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `orders/${orderId}`);
    }
  };

  const handleStartEditNote = (orderId: string, currentNote: string) => {
    setEditingNoteId(orderId);
    setTempNote(currentNote || '');
  };

  const handleSaveNote = async (orderId: string) => {
    try {
      await updateDoc(doc(db, 'orders', orderId), {
        notes: tempNote.trim(),
        updatedAt: Timestamp.now()
      });
      setEditingNoteId(null);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `orders/${orderId}`);
    }
  };

  const days = eachDayOfInterval({ start: startDate, end: endDate });
  
  const filteredOrders = useMemo(() => {
    if (showAllActive) {
      return orders.filter(o => o.status === 'pending' || o.status === 'shipped');
    }
    return orders.filter(o => {
      const d = new Date(o.deliveryDate);
      return d >= startDate && d <= endDate;
    });
  }, [orders, showAllActive, startDate, endDate]);

  const productTotals = useMemo(() => {
    const totals: Record<string, number> = {};
    filteredOrders.forEach(order => {
      order.items.forEach(item => {
        totals[item.productId] = (totals[item.productId] || 0) + item.quantity;
      });
    });
    return Object.entries(totals)
      .map(([productId, quantity]) => ({
        productId,
        quantity,
        name: products.find(p => p.id === productId)?.name || 'Unknown'
      }))
      .sort((a, b) => b.quantity - a.quantity);
  }, [filteredOrders, products]);

  const dailyData = useMemo(() => {
    // 1. Determine which dates we are showing
    let datesToShow: Date[] = [];
    if (showAllActive) {
      const uniqueDates = Array.from(new Set(filteredOrders.map(o => o.deliveryDate || 'No Date'))).sort();
      datesToShow = uniqueDates.map(dateStr => dateStr === 'No Date' ? new Date() : new Date(dateStr));
    } else {
      datesToShow = days;
    }

    // Sort dates soonest first
    datesToShow.sort((a, b) => a.getTime() - b.getTime());

    // 2. Group by date, then by venue
    return datesToShow.map(day => {
      const dayStr = format(day, 'yyyy-MM-dd');
      const dayOrders = filteredOrders.filter(o => {
        if (showAllActive && !o.deliveryDate) return format(new Date(), 'yyyy-MM-dd') === dayStr;
        return o.deliveryDate === dayStr;
      });

      if (dayOrders.length === 0) return null;

      // Group orders by venue for this specific day
      const venuesWithOrders = venues.map(venue => {
        const venueDayOrders = dayOrders.filter(o => o.venueId === venue.id);
        return { venue, orders: venueDayOrders };
      }).filter(v => v.orders.length > 0);

      return { day, venues: venuesWithOrders };
    }).filter(d => d !== null);
  }, [venues, filteredOrders, days, showAllActive]);

  const [isPrinting, setIsPrinting] = useState(false);
  const [isSavingPdf, setIsSavingPdf] = useState(false);

  const handlePrint = () => {
    try {
      setIsPrinting(true);
      // Give UI time to update spinner
      setTimeout(() => {
        window.focus();
        window.print();
        setIsPrinting(false);
      }, 200);
    } catch (err) {
      console.error(err);
      alert("Error triggering print. Try 'Open in New Tab' or Ctrl+P.");
      setIsPrinting(false);
    }
  };

  const handleOpenNewTab = () => {
    const element = document.getElementById('printable-area');
    if (!element) return;
    
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert("Pop-up blocked! Please allow pop-ups for this site to use the direct print feature.");
      return;
    }

    const content = element.innerHTML;
    printWindow.document.write(`
      <html>
        <head>
          <title>MCN Bakery Production Sheet</title>
          <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;700&display=swap" rel="stylesheet">
          <style>
            body { font-family: 'Inter', sans-serif; padding: 40px; color: #18181b; }
            * { box-sizing: border-box; }
            .bg-zinc-900 { background: #18181b !important; color: white !important; }
            .text-orange-400 { color: #fb923c !important; }
            .bg-zinc-50 { background: #fafafa !important; border: 1px solid #f4f4f5; }
            .border-b-8 { border-bottom: 8px solid #18181b; }
            .text-5xl { font-size: 3rem; font-weight: 900; }
            .font-serif { font-style: italic; }
            .flex { display: flex; }
            .flex-col { flex-direction: column; }
            .items-center { align-items: center; }
            .justify-between { justify-content: space-between; }
            .gap-4 { gap: 1rem; }
            .mb-10 { margin-bottom: 2.5rem; }
            .p-4 { padding: 1rem; }
            .rounded-xl { border-radius: 0.75rem; }
            /* Simple fallback styling for the new tab */
            @media print { .no-print { display: none; } }
          </style>
        </head>
        <body>
          <div class="no-print" style="background: #f4f4f5; padding: 10px; margin-bottom: 20px; border-radius: 8px; font-size: 14px; display: flex; justify-content: space-between; align-items: center;">
            <span>This is a simplified view for reliable printing. Use your browser's Print (Ctrl+P) to print this page.</span>
            <button onclick="window.print()" style="padding: 8px 16px; background: #18181b; color: white; border: none; border-radius: 6px; cursor: pointer;">Print Now</button>
          </div>
          ${content}
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const handleSavePdf = async () => {
    const element = document.getElementById('printable-area');
    if (!element) {
      console.error('Printable area not found');
      return;
    }

    setIsSavingPdf(true);
    try {
      const opt = {
        margin: [10, 10, 10, 10] as [number, number, number, number],
        filename: `Production-Sheet-${format(startDate, 'yyyy-MM-dd')}.pdf`,
        image: { type: 'jpeg' as const, quality: 0.98 },
        html2canvas: { 
          scale: 2, 
          useCORS: true, 
          logging: false,
          letterRendering: true,
          allowTaint: true,
          onclone: (clonedDoc: Document) => {
            // 1. Remove ALL existing style and link tags to wipe the slate clean
            const styleTags = clonedDoc.querySelectorAll('style, link[rel="stylesheet"]');
            styleTags.forEach(tag => tag.remove());

            // 2. Inject a completely fresh, HEX-ONLY stylesheet for the production sheet
            const style = clonedDoc.createElement('style');
            style.innerHTML = `
              /* Base PDF Styles */
              * { 
                box-sizing: border-box !important;
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
                font-family: Inter, ui-sans-serif, system-ui, sans-serif !important;
                margin: 0;
                padding: 0;
                border: 0 solid #e4e4e7;
                background: transparent;
                color: #18181b;
              }
              body { background: #ffffff !important; }
              
              /* Layout Utilities */
              .flex { display: flex !important; }
              .flex-col { flex-direction: column !important; }
              .items-center { align-items: center !important; }
              .items-baseline { align-items: baseline !important; }
              .justify-between { justify-content: space-between !important; }
              .gap-1 { gap: 0.25rem !important; }
              .gap-2 { gap: 0.5rem !important; }
              .gap-3 { gap: 0.75rem !important; }
              .gap-4 { gap: 1rem !important; }
              .gap-6 { gap: 1.5rem !important; }
              .gap-8 { gap: 2rem !important; }
              .grid { display: grid !important; }
              .grid-cols-1 { grid-template-columns: repeat(1, minmax(0, 1fr)) !important; }
              @media (min-width: 640px) { .sm\\:grid-cols-2 { grid-template-columns: repeat(2, minmax(0, 1fr)) !important; } }
              
              /* Spacing */
              .p-2 { padding: 0.5rem !important; }
              .p-4 { padding: 1rem !important; }
              .p-8 { padding: 2rem !important; }
              .px-2 { padding-left: 0.5rem !important; padding-right: 0.5rem !important; }
              .px-3 { padding-left: 0.75rem !important; padding-right: 0.75rem !important; }
              .py-1 { padding-top: 0.25rem !important; padding-bottom: 0.25rem !important; }
              .py-1\\.5 { padding-top: 0.375rem !important; padding-bottom: 0.375rem !important; }
              .py-2 { padding-top: 0.5rem !important; padding-bottom: 0.5rem !important; }
              .py-3 { padding-top: 0.75rem !important; padding-bottom: 0.75rem !important; }
              .mb-0\\.5 { margin-bottom: 0.125rem !important; }
              .mb-1 { margin-bottom: 0.25rem !important; }
              .mb-2 { margin-bottom: 0.5rem !important; }
              .mb-4 { margin-bottom: 1rem !important; }
              .mb-6 { margin-bottom: 1.5rem !important; }
              .mb-8 { margin-bottom: 2rem !important; }
              .mb-10 { margin-bottom: 2.5rem !important; }
              .mb-12 { margin-bottom: 3rem !important; }
              .mt-0\\.5 { margin-top: 0.125rem !important; }
              .mt-20 { margin-top: 5rem !important; }
              .pl-6 { padding-left: 1.5rem !important; }
              .pb-2 { padding-bottom: 0.5rem !important; }
              .pt-8 { padding-top: 2rem !important; }
              .space-y-1 > * + * { margin-top: 0.25rem !important; }
              .space-y-2 > * + * { margin-top: 0.5rem !important; }
              .space-y-4 > * + * { margin-top: 1rem !important; }
              .space-y-8 > * + * { margin-top: 2rem !important; }
              
              /* Colors & Borders */
              .bg-white { background-color: #ffffff !important; }
              .bg-zinc-50 { background-color: #fafafa !important; }
              .bg-zinc-100 { background-color: #f4f4f5 !important; }
              .bg-zinc-900 { background-color: #18181b !important; }
              .bg-orange-100 { background-color: #ffedd5 !important; }
              .bg-orange-50\\/30 { background-color: #fffaf5 !important; }
              .text-zinc-900 { color: #18181b !important; }
              .text-zinc-500 { color: #71717a !important; }
              .text-zinc-400 { color: #a1a1aa !important; }
              .text-zinc-800 { color: #27272a !important; }
              .text-orange-400 { color: #fb923c !important; }
              .text-orange-600 { color: #ea580c !important; }
              .text-white { color: #ffffff !important; }
              .border { border-width: 1px !important; }
              .border-b { border-bottom-width: 1px !important; }
              .border-b-4 { border-bottom-width: 4px !important; }
              .border-l-2 { border-left-width: 2px !important; }
              .border-t { border-top-width: 1px !important; }
              .border-zinc-100 { border-color: #f4f4f5 !important; }
              .border-zinc-200 { border-color: #e4e4e7 !important; }
              .border-orange-100 { border-color: #ffedd5 !important; }
              .border-dotted { border-style: dotted !important; }
              .divide-y > * + * { border-top-width: 1px !important; border-color: #f4f4f5 !important; }
              
              /* Typography */
              .text-xs { font-size: 0.75rem !important; }
              .text-sm { font-size: 0.875rem !important; }
              .text-base { font-size: 1rem !important; }
              .text-xl { font-size: 1.25rem !important; }
              .text-2xl { font-size: 1.5rem !important; }
              .text-5xl { font-size: 3rem !important; }
              .font-bold { font-weight: 700 !important; }
              .font-black { font-weight: 900 !important; }
              .font-medium { font-weight: 500 !important; }
              .uppercase { text-transform: uppercase !important; }
              .italic { font-style: italic !important; }
              .tracking-tight { letter-spacing: -0.025em !important; }
              .tracking-tighter { letter-spacing: -0.05em !important; }
              
              /* Special Components */
              .rounded-xl { border-radius: 0.75rem !important; }
              .rounded-2xl { border-radius: 1rem !important; }
              .rounded-3xl { border-radius: 1.5rem !important; }
              .rounded-lg { border-radius: 0.5rem !important; }
              .shrink-0 { flex-shrink: 0 !important; }
              .break-inside-avoid { break-inside: avoid !important; }
              .relative { position: relative !important; }
              .absolute { position: absolute !important; }
              .hidden { display: none !important; }
              .print\\:flex { display: flex !important; }
            `;
            clonedDoc.head.appendChild(style);

            // 3. One last sweep to remove inline styles that might still use oklab
            const elements = clonedDoc.getElementsByTagName('*');
            for (let i = 0; i < elements.length; i++) {
              const el = elements[i] as HTMLElement;
              const styleAttr = el.getAttribute('style') || '';
              if (styleAttr.toLowerCase().includes('oklch') || styleAttr.toLowerCase().includes('oklab')) {
                el.style.color = '';
                el.style.backgroundColor = '';
                el.style.borderColor = '';
                el.style.boxShadow = '';
              }
            }
          }
        },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' as const }
      };

      // Temporarily show hidden print elements for PDF generation
      const printOnlyElements = element.querySelectorAll('.hidden.print\\:flex');
      printOnlyElements.forEach(el => el.classList.remove('hidden'));

      // Use the promise-based API for html2pdf
      await html2pdf().set(opt).from(element).save();

      // Restore hidden state
      printOnlyElements.forEach(el => el.classList.add('hidden'));
    } catch (error) {
      console.error('PDF generation failed:', error);
      alert('Failed to generate PDF. You can try printing to PDF using the "Print" button instead.');
    } finally {
      setIsSavingPdf(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 no-print">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <Button variant="ghost" size="sm" onClick={onBack} className="gap-2 self-start">
            <ChevronLeft size={16} />
            Back
          </Button>
          <div className="hidden sm:block h-4 w-px bg-zinc-200" />
          <div className="flex flex-col sm:flex-row sm:items-center gap-2">
            <Button 
              variant={showAllActive ? "primary" : "outline"} 
              size="sm" 
              onClick={() => setShowAllActive(!showAllActive)}
              className="gap-2 h-8 w-full sm:w-auto"
            >
              {showAllActive ? "Showing All Active" : "Show All Active Orders"}
            </Button>
            {!showAllActive && (
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:ml-2">
                <div className="flex items-center gap-1 bg-white border border-zinc-200 rounded-xl p-1 shadow-sm">
                  <Button variant="ghost" size="sm" onClick={onPrevWeek} className="p-1 h-8 w-8 rounded-lg hover:bg-zinc-100">
                    <ChevronLeft size={18} />
                  </Button>
                  <div className="flex items-center gap-2 px-3 py-1 bg-zinc-50 rounded-lg border border-zinc-100">
                    <div className="flex flex-col">
                      <span className="text-[8px] font-bold text-zinc-400 uppercase leading-none mb-1">From</span>
                      <input 
                        type="date" 
                        value={format(startDate, 'yyyy-MM-dd')}
                        onChange={(e) => onStartDateChange(e.target.value)}
                        className="text-xs font-bold text-zinc-900 bg-transparent focus:outline-none cursor-pointer"
                      />
                    </div>
                    <div className="h-4 w-px bg-zinc-200 mx-1" />
                    <div className="flex flex-col">
                      <span className="text-[8px] font-bold text-zinc-400 uppercase leading-none mb-1">To</span>
                      <input 
                        type="date" 
                        value={format(endDate, 'yyyy-MM-dd')}
                        onChange={(e) => onEndDateChange(e.target.value)}
                        className="text-xs font-bold text-zinc-900 bg-transparent focus:outline-none cursor-pointer"
                      />
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" onClick={onNextWeek} className="p-1 h-8 w-8 rounded-lg hover:bg-zinc-100">
                    <ChevronRight size={18} />
                  </Button>
                </div>
              </div>
            )}
            <Button 
              variant={showTotals ? "primary" : "outline"} 
              size="sm" 
              onClick={() => setShowTotals(!showTotals)}
              className="gap-2 h-8 w-full sm:w-auto"
            >
              <BarChart3 size={16} />
              {showTotals ? "Hide Totals" : "Show Totals Summary"}
            </Button>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handlePrint} 
            disabled={isPrinting || isSavingPdf}
            className="flex-1 sm:flex-none gap-2 border-zinc-200 text-zinc-600"
          >
            {isPrinting ? (
              <div className="w-4 h-4 border-2 border-zinc-300 border-t-zinc-600 rounded-full animate-spin" />
            ) : (
              <Printer size={16} />
            )}
            {isPrinting ? "Opening..." : "Print"}
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleOpenNewTab}
            className="flex-1 sm:flex-none gap-2 border-zinc-200 text-zinc-600 hidden md:flex"
            title="Opens a clean version in a new tab for tricky browsers"
          >
            <ArrowUpRight size={16} />
            Open in Tab
          </Button>
          <Button 
            variant="primary" 
            size="sm" 
            onClick={handleSavePdf} 
            disabled={isSavingPdf || isPrinting}
            className="flex-1 sm:flex-none gap-2 shadow-sm"
          >
            {isSavingPdf ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <FileText size={16} />
            )}
            {isSavingPdf ? "Generating..." : "Save PDF"}
          </Button>
        </div>
      </div>

      <div id="printable-area" className="bg-white p-4 sm:p-12 rounded-2xl sm:rounded-3xl border border-zinc-100 shadow-sm print:shadow-none print:border-none print:p-0 print:m-0 print:text-[10pt]">
        {/* Print Header (Visible only on print) */}
        <div className="hidden print:flex justify-between text-[10px] text-zinc-500 mb-8">
          <div>{format(new Date(), 'dd/MM/yyyy, HH:mm')}</div>
          <div className="font-medium">Production Sheet</div>
        </div>

        <div className="mb-10 print:mb-4 flex items-center gap-4">
          <div className="w-12 h-12 bg-zinc-900 rounded-xl flex items-center justify-center shadow-sm shrink-0">
            <Wheat className="text-orange-400 w-7 h-7" />
          </div>
          <div>
            <h1 className="text-2xl print:text-xl font-bold text-zinc-900 mb-0.5">MCN Bakery — Production Sheet</h1>
            <div className="flex items-center gap-2 text-xs text-zinc-400 font-medium">
              {showAllActive ? (
                <span>All Active Orders (Pending & Shipped)</span>
              ) : (
                <span>Range: {format(startDate, 'dd MMM')} – {format(endDate, 'dd MMM yyyy')}</span>
              )}
              <span>|</span>
              <span>Printed {format(new Date(), 'dd MMM yyyy HH:mm')}</span>
            </div>
          </div>
        </div>

        {showTotals && productTotals.length > 0 && (
          <div className="mb-12 print:mb-6 p-8 print:p-4 bg-zinc-50 rounded-3xl border border-zinc-100 break-inside-avoid">
            <div className="flex items-center gap-3 mb-6 print:mb-2 text-zinc-900">
              <div className="w-10 h-10 bg-zinc-900 rounded-xl flex items-center justify-center shadow-sm print:w-8 print:h-8">
                <BarChart3 className="text-orange-400 w-6 h-6 print:w-5 print:h-5" />
              </div>
              <h2 className="text-xl print:text-base font-bold text-zinc-900 uppercase tracking-tight">Total Production Required</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-12 print:gap-x-6 gap-y-2 print:gap-y-1">
              {productTotals.map(item => (
                <div key={item.productId} className="flex items-baseline gap-2 py-2 border-b border-zinc-200/50 last:border-0 sm:last:border-b sm:[&:nth-last-child(-n+2)]:border-0">
                  <span className="text-zinc-900 font-medium print:text-sm">{item.name}</span>
                  <div className="flex-1 border-b border-dotted border-zinc-300 mb-1" />
                  <span className="font-sans font-bold text-zinc-900 text-xl print:text-lg tracking-tight">×{item.quantity}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="space-y-20 print:space-y-8">
          {dailyData.map((data) => {
            if (!data) return null;
            const { day, venues: venuesWithOrders } = data;
            
            return (
              <div key={day.toString()} className="space-y-10 print:space-y-4">
                <div className="flex flex-col md:flex-row md:items-baseline gap-4 border-b-8 border-zinc-900 pb-4 print:pb-2 print:border-b-4">
                  <div className="text-5xl print:text-2xl font-black text-zinc-900 tracking-tighter">
                    {format(day, 'EEEE').toUpperCase()}
                  </div>
                  <div className="text-2xl print:text-base font-serif italic text-zinc-400">
                    {format(day, 'dd MMMM yyyy')}
                  </div>
                </div>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 print:gap-6">
                  {venuesWithOrders.map(({ venue, orders }) => (
                    <div key={venue.id} className="break-inside-avoid relative">
                      <div className="flex items-center gap-3 mb-6 print:mb-2 text-zinc-900">
                        <div className="w-8 h-8 rounded-lg bg-orange-100 flex items-center justify-center text-orange-600 print:w-6 print:h-6">
                          <Store size={16} className="print:w-4 print:h-4" />
                        </div>
                        <h3 className="text-xl print:text-base font-bold text-zinc-900 tracking-tight underline decoration-orange-200">
                          {venue.name}
                        </h3>
                      </div>
                      
                      <div className="space-y-8 print:space-y-2 pl-11 print:pl-6 border-l-2 border-zinc-100">
                        {orders.map(order => (
                          <div key={order.id} className="space-y-4 print:space-y-1">
                            <div className="divide-y divide-zinc-100">
                              {order.items.map(item => {
                                const product = products.find(p => p.id === item.productId);
                                if (!item.quantity) return null;
                                return (
                                  <div key={item.productId} className="flex justify-between items-start gap-4 py-3 print:py-1.5 first:pt-0 group/wp-item">
                                    <div className="flex flex-col">
                                      <span className="text-base print:text-sm font-medium text-zinc-800 leading-tight">
                                        {product?.name}
                                      </span>
                                      <div className="flex items-center gap-2 mt-1 no-print">
                                        <button 
                                          onClick={() => {
                                            const newQty = Math.max(1, item.quantity - 1);
                                            const newItems = order.items.map(it => it.productId === item.productId ? { ...it, quantity: newQty } : it);
                                            updateDoc(doc(db, 'orders', order.id), { items: newItems, updatedAt: Timestamp.now() });
                                          }}
                                          className="p-1 bg-zinc-50 text-zinc-400 hover:text-orange-600 hover:bg-orange-50 rounded"
                                        >
                                          <ChevronDown size={12} />
                                        </button>
                                        <button 
                                          onClick={() => {
                                            const newQty = item.quantity + 1;
                                            const newItems = order.items.map(it => it.productId === item.productId ? { ...it, quantity: newQty } : it);
                                            updateDoc(doc(db, 'orders', order.id), { items: newItems, updatedAt: Timestamp.now() });
                                          }}
                                          className="p-1 bg-zinc-50 text-zinc-400 hover:text-orange-600 hover:bg-orange-50 rounded"
                                        >
                                          <Plus size={12} />
                                        </button>
                                        <button 
                                          onClick={() => handleRemoveItem(order.id, item.productId)}
                                          className="p-1 bg-zinc-50 text-zinc-400 hover:text-red-500 hover:bg-red-50 rounded ml-2"
                                        >
                                          <Trash2 size={12} />
                                        </button>
                                      </div>
                                    </div>
                                    <span className="font-mono font-bold text-zinc-900 text-xl print:text-base tracking-tight bg-zinc-100 px-3 py-1 print:px-2 print:py-0.5 rounded-lg shrink-0">
                                      ×{item.quantity}
                                    </span>
                                  </div>
                                );
                              })}
                            </div>
                            
                            {editingNoteId === order.id ? (
                              <div className="mt-4 p-4 bg-white rounded-xl border-2 border-orange-200 shadow-sm no-print">
                                <p className="text-[10px] font-bold text-orange-800 uppercase tracking-widest mb-2">Edit Notes</p>
                                <textarea 
                                  autoFocus
                                  value={tempNote}
                                  onChange={(e) => setTempNote(e.target.value)}
                                  className="w-full text-xs text-zinc-800 bg-zinc-50 rounded-lg p-3 border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-orange-500/20 mb-3 h-20 resize-none"
                                  placeholder="Add production notes..."
                                />
                                <div className="flex gap-2 justify-end">
                                  <Button size="sm" variant="ghost" className="text-[10px]" onClick={() => setEditingNoteId(null)}>Cancel</Button>
                                  <Button size="sm" variant="primary" className="text-[10px] px-4" onClick={() => handleSaveNote(order.id)}>Save Note</Button>
                                </div>
                              </div>
                            ) : order.notes ? (
                              <div className="relative p-4 print:p-2 bg-orange-50/30 rounded-2xl border border-orange-100/50 group/notes transition-all hover:bg-orange-50/50">
                                <div className="absolute -left-2 top-4 w-4 h-4 bg-orange-100 rotate-45 border-l border-b border-orange-100/50 print:hidden" />
                                <div className="flex items-start justify-between gap-2">
                                  <div className="flex items-start gap-2">
                                    <AlertCircle size={14} className="text-orange-600 mt-0.5 shrink-0 print:w-3 print:h-3" />
                                    <p className="text-xs print:text-[10px] font-medium text-orange-800 leading-relaxed italic">
                                      {order.notes}
                                    </p>
                                  </div>
                                  <button 
                                    onClick={() => handleStartEditNote(order.id, order.notes)}
                                    className="opacity-0 group-hover/notes:opacity-100 p-1 text-zinc-400 hover:text-orange-600 transition-all no-print"
                                  >
                                    <Pencil size={12} />
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <div className="flex gap-4 items-center">
                                <button 
                                  onClick={() => handleStartEditNote(order.id, '')}
                                  className="mt-2 flex items-center gap-2 text-[10px] font-bold text-zinc-400 uppercase tracking-widest hover:text-orange-600 transition-colors no-print"
                                >
                                  <Plus size={14} />
                                  Add Notes
                                </button>
                                <button 
                                  onClick={() => setAddingItemId(order.id)}
                                  className="mt-2 flex items-center gap-2 text-[10px] font-bold text-zinc-400 uppercase tracking-widest hover:text-orange-600 transition-colors no-print"
                                >
                                  <Plus size={14} />
                                  Add Item
                                </button>
                              </div>
                            )}

                            {addingItemId === order.id && (
                              <div className="mt-4 p-4 bg-orange-50/50 rounded-xl border border-orange-100 w-full no-print">
                                <div className="flex flex-col gap-3">
                                  <p className="text-[10px] font-bold text-orange-800 uppercase tracking-widest">Add Item to {venue.name}</p>
                                  <select 
                                    className="w-full bg-white border border-zinc-200 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-orange-500/20 focus:outline-none"
                                    value={itemToAdd.productId}
                                    onChange={(e) => setItemToAdd(prev => ({ ...prev, productId: e.target.value }))}
                                  >
                                    <option value="">Select product...</option>
                                    {products.map(p => (
                                      <option key={p.id} value={p.id}>{p.name}</option>
                                    ))}
                                  </select>
                                  <div className="flex items-center gap-2">
                                    <input 
                                      type="number"
                                      min="1"
                                      className="w-20 bg-white border border-zinc-200 rounded-lg p-2.5 text-sm focus:outline-none"
                                      value={itemToAdd.quantity}
                                      onChange={(e) => setItemToAdd(prev => ({ ...prev, quantity: parseInt(e.target.value) || 1 }))}
                                    />
                                    <Button size="sm" onClick={() => handleAddItem(order.id)}>Add</Button>
                                    <Button size="sm" variant="ghost" onClick={() => setAddingItemId(null)}>Cancel</Button>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
          {dailyData.length === 0 && (
            <p className="text-center py-20 text-zinc-400 italic font-serif text-xl">
              No orders found for the selected range.
            </p>
          )}
        </div>

        {/* Print Footer */}
        <div className="hidden print:flex justify-between items-center mt-20 pt-8 border-t border-zinc-100 text-[10px] text-zinc-400">
          <div>https://mcn-bakery-flow.com/kitchen</div>
          <div>1/1</div>
        </div>
      </div>
    </div>
  );
}

function AnalyticsView({ orders, venues, products, inventory }: { orders: DistributionOrder[], venues: Venue[], products: Product[], inventory: InventoryItem[] }) {
  const today = startOfToday();
  const [selectedMonth, setSelectedMonth] = useState(format(today, 'yyyy-MM'));
  
  const last30Days = eachDayOfInterval({ start: addDays(today, -29), end: today });
  
  // Monthly Report Data
  const monthlyReportData = useMemo(() => {
    const monthStart = startOfMonth(parseISO(`${selectedMonth}-01`));
    const monthEnd = endOfMonth(monthStart);
    
    const monthOrders = orders.filter(o => {
      const date = o.createdAt?.toDate?.() || new Date();
      return o.status !== 'cancelled' && isWithinInterval(date, { start: monthStart, end: monthEnd });
    });

    return venues.filter(v => v.type === 'retail').map(venue => {
      const venueOrders = monthOrders.filter(o => o.venueId === venue.id);
      let desserts = 0;
      let afternoonTeas = 0;
      let dessertCost = 0;
      let afternoonTeaCost = 0;

      venueOrders.forEach(order => {
        order.items.forEach(item => {
          const product = products.find(p => p.id === item.productId);
          if (product?.category === 'Afternoon Tea') {
            afternoonTeas += item.quantity;
            afternoonTeaCost += item.quantity * (product.price || 0);
          } else {
            // Everything else is considered a dessert in this context
            desserts += item.quantity;
            dessertCost += item.quantity * (product.price || 0);
          }
        });
      });

      return {
        name: venue.name,
        desserts,
        afternoonTeas,
        dessertCost,
        afternoonTeaCost,
        total: desserts + afternoonTeas,
        totalCost: dessertCost + afternoonTeaCost
      };
    });
  }, [orders, venues, products, selectedMonth]);

  const monthOptions = useMemo(() => {
    return Array.from({ length: 12 }, (_, i) => {
      const date = subMonths(today, i);
      return {
        label: format(date, 'MMMM yyyy'),
        value: format(date, 'yyyy-MM')
      };
    });
  }, [today]);

  // Weekly Comparison
  const thisWeekStart = startOfWeek(today, { weekStartsOn: 1 });
  const lastWeekStart = addDays(thisWeekStart, -7);
  
  const thisWeekOrders = orders.filter(o => {
    const date = o.createdAt?.toDate?.() || new Date();
    return o.status !== 'cancelled' && date >= thisWeekStart && date < addDays(thisWeekStart, 7);
  });
  
  const lastWeekOrders = orders.filter(o => {
    const date = o.createdAt?.toDate?.() || new Date();
    return o.status !== 'cancelled' && date >= lastWeekStart && date < thisWeekStart;
  });

  const growth = lastWeekOrders.length === 0 
    ? (thisWeekOrders.length > 0 ? 100 : 0) 
    : ((thisWeekOrders.length - lastWeekOrders.length) / lastWeekOrders.length) * 100;

  // Summary Stats
  const totalOrders = orders.filter(o => o.status !== 'cancelled').length;
  const totalDesserts = orders.filter(o => o.status !== 'cancelled').reduce((sum, o) => sum + o.items.reduce((iSum, item) => iSum + item.quantity, 0), 0);
  
  const venueOrderCounts = orders.filter(o => o.status !== 'cancelled').reduce((acc, o) => {
    acc[o.venueId] = (acc[o.venueId] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  const topVenueId = Object.entries(venueOrderCounts).sort((a, b) => b[1] - a[1])[0]?.[0];
  const topVenueName = venues.find(v => v.id === topVenueId)?.name || 'N/A';

  // Order Volume Chart Data
  const orderVolumeData = last30Days.map(date => {
    const count = orders.filter(o => o.status !== 'cancelled' && isSameDay(o.createdAt?.toDate?.() || new Date(), date)).length;
    return {
      date: format(date, 'MMM dd'),
      orders: count
    };
  });

  // Top 5 Products Data
  const productCounts = orders.filter(o => o.status !== 'cancelled').reduce((acc, o) => {
    o.items.forEach(item => {
      acc[item.productId] = (acc[item.productId] || 0) + item.quantity;
    });
    return acc;
  }, {} as Record<string, number>);

  const topProductsData = Object.entries(productCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([id, count]) => ({
      name: products.find(p => p.id === id)?.name || id,
      count
    }));

  // Venue Performance Data
  const venuePerformanceData = Object.entries(venueOrderCounts).map(([id, count]) => ({
    name: venues.find(v => v.id === id)?.name || id,
    value: count
  }));

  // Top Products by Venue Data
  const venueProductData = venues.filter(v => v.type === 'retail').map(venue => {
    const venueOrders = orders.filter(o => o.status !== 'cancelled' && o.venueId === venue.id);
    const counts: any = { name: venue.name };
    venueOrders.forEach(o => {
      o.items.forEach(item => {
        const pName = products.find(p => p.id === item.productId)?.name || item.productId;
        counts[pName] = (counts[pName] || 0) + item.quantity;
      });
    });
    return counts;
  });

  // Never Ordered Products
  const orderedProductIds = new Set(Object.keys(productCounts));
  const neverOrdered = products.filter(p => !orderedProductIds.has(p.id));

  const COLORS = ['#2563eb', '#dc2626', '#16a34a', '#ca8a04', '#9333ea', '#0891b2', '#db2777', '#4f46e5'];

  const suggestedProduction = useMemo(() => {
    return products.map(p => {
      const totalOrdered = orders.filter(o => o.status !== 'cancelled').reduce((acc, o) => {
        const item = o.items.find(i => i.productId === p.id);
        return acc + (item?.quantity || 0);
      }, 0);
      const avgDailyDemand = totalOrdered / 30;
      const currentStock = inventory.filter(i => i.venueId === 'central-kitchen' && i.productId === p.id)[0]?.quantity || 0;
      const suggested = Math.max(0, Math.ceil(avgDailyDemand * 7) - currentStock); // 7 days of stock
      
      return {
        ...p,
        avgDailyDemand: avgDailyDemand.toFixed(1),
        currentStock,
        suggested
      };
    }).filter(p => p.suggested > 0).sort((a, b) => b.suggested - a.suggested);
  }, [products, orders, inventory]);

  return (
    <div className="space-y-8 pb-12">
      {/* Monthly Report Section */}
      <Card className="p-8 space-y-6 border-zinc-200">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h3 className="text-xl font-bold text-zinc-900">Monthly Venue Report</h3>
            <p className="text-sm text-zinc-500">Breakdown of desserts and afternoon teas by venue.</p>
          </div>
          <div className="flex items-center gap-2 bg-zinc-50 p-1 rounded-xl border border-zinc-100">
            <Calendar size={16} className="ml-3 text-zinc-400" />
            <select 
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="bg-transparent border-none text-sm font-bold text-zinc-700 py-2 pl-2 pr-8 focus:ring-0 cursor-pointer"
            >
              {monthOptions.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-zinc-100">
                <th className="py-4 text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Venue</th>
                <th className="py-4 text-[10px] font-bold text-zinc-400 uppercase tracking-widest text-right">Desserts</th>
                <th className="py-4 text-[10px] font-bold text-zinc-400 uppercase tracking-widest text-right">Dessert Cost</th>
                <th className="py-4 text-[10px] font-bold text-zinc-400 uppercase tracking-widest text-right">Afternoon Teas</th>
                <th className="py-4 text-[10px] font-bold text-zinc-400 uppercase tracking-widest text-right">Total Items</th>
                <th className="py-4 text-[10px] font-bold text-zinc-400 uppercase tracking-widest text-right">Total Cost</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-50">
              {monthlyReportData.map((row) => (
                <tr key={row.name} className="group hover:bg-zinc-50/50 transition-colors">
                  <td className="py-4">
                    <span className="text-sm font-bold text-zinc-900">{row.name}</span>
                  </td>
                  <td className="py-4 text-right">
                    <span className="text-sm font-mono font-medium text-zinc-600">{row.desserts}</span>
                  </td>
                  <td className="py-4 text-right">
                    <span className="text-sm font-mono font-bold text-zinc-900">£{row.dessertCost.toFixed(2)}</span>
                  </td>
                  <td className="py-4 text-right">
                    <span className="text-sm font-mono font-medium text-zinc-600">{row.afternoonTeas}</span>
                  </td>
                  <td className="py-4 text-right">
                    <span className="text-sm font-bold text-zinc-900">{row.total}</span>
                  </td>
                  <td className="py-4 text-right">
                    <span className="text-sm font-bold text-orange-700">£{row.totalCost.toFixed(2)}</span>
                  </td>
                </tr>
              ))}
              {monthlyReportData.length === 0 && (
                <tr>
                  <td colSpan={4} className="py-10 text-center text-zinc-400 italic text-sm">
                    No order data found for this period.
                  </td>
                </tr>
              )}
            </tbody>
            {monthlyReportData.length > 0 && (
              <tfoot>
                <tr className="border-t-2 border-zinc-100 bg-zinc-50/30">
                  <td className="py-4 font-bold text-zinc-900 text-sm">Total Distribution</td>
                  <td className="py-4 text-right font-bold text-zinc-900 text-sm">
                    {monthlyReportData.reduce((sum, r) => sum + r.desserts, 0)}
                  </td>
                  <td className="py-4 text-right font-bold text-zinc-900 text-sm">
                    £{monthlyReportData.reduce((sum, r) => sum + r.dessertCost, 0).toFixed(2)}
                  </td>
                  <td className="py-4 text-right font-bold text-zinc-900 text-sm">
                    {monthlyReportData.reduce((sum, r) => sum + r.afternoonTeas, 0)}
                  </td>
                  <td className="py-4 text-right font-bold text-zinc-900 text-sm">
                    {monthlyReportData.reduce((sum, r) => sum + r.total, 0)}
                  </td>
                  <td className="py-4 text-right font-bold text-orange-800 text-sm">
                    £{monthlyReportData.reduce((sum, r) => sum + r.totalCost, 0).toFixed(2)}
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </Card>

      {/* Production Insights */}
      <Card className="p-4 md:p-8 border-orange-100 bg-orange-50/30">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center text-orange-600">
            <TrendingUp size={20} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-zinc-900">Suggested Production List</h3>
            <p className="text-xs md:text-sm text-zinc-500">Based on average daily demand vs current central stock.</p>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {suggestedProduction.slice(0, 6).map(p => (
            <div key={p.id} className="p-4 bg-white rounded-2xl border border-orange-100 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-zinc-900 truncate pr-2">{p.name}</span>
                  <Badge variant="warning">Low Stock</Badge>
                </div>
                <div className="flex items-center gap-4 text-[10px] text-zinc-400 mb-4">
                  <span>Daily Demand: {p.avgDailyDemand}</span>
                  <span>Current: {p.currentStock}</span>
                </div>
              </div>
              <div className="flex items-center justify-between pt-4 border-t border-zinc-50">
                <span className="text-[10px] font-bold text-zinc-400 uppercase">Suggested Batch</span>
                <span className="text-lg font-bold text-orange-600">+{p.suggested}</span>
              </div>
            </div>
          ))}
          {suggestedProduction.length === 0 && (
            <div className="col-span-full py-8 text-center text-zinc-400 italic text-sm">
              All stock levels are healthy based on current demand.
            </div>
          )}
        </div>
      </Card>

      {/* Growth Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6 bg-white border-zinc-100">
          <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1">Last Week</p>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-zinc-900">{lastWeekOrders.length}</span>
            <span className="text-xs text-zinc-500">orders</span>
          </div>
        </Card>
        <Card className={cn("p-6 border-none flex flex-col items-center justify-center", growth >= 0 ? "bg-emerald-50" : "bg-red-50")}>
          <span className={cn("text-3xl font-bold", growth >= 0 ? "text-emerald-600" : "text-red-600")}>
            {growth >= 0 ? '+' : ''}{growth.toFixed(0)}%
          </span>
          <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mt-1">growth</span>
        </Card>
        <Card className="p-6 bg-white border-zinc-100">
          <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1">This Week</p>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-zinc-900">{thisWeekOrders.length}</span>
            <span className="text-xs text-zinc-500">orders</span>
          </div>
        </Card>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6 space-y-1">
          <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Total Orders</p>
          <p className="text-4xl font-bold text-zinc-900">{totalOrders}</p>
        </Card>
        <Card className="p-6 space-y-1">
          <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Total Desserts</p>
          <p className="text-4xl font-bold text-zinc-900">{totalDesserts}</p>
        </Card>
        <Card className="p-6 space-y-1">
          <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Top Venue</p>
          <p className="text-4xl font-bold text-zinc-900 truncate">{topVenueName}</p>
        </Card>
      </div>

      {/* Order Volume Chart */}
      <Card className="p-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-zinc-900">Order Volume - Last 30 Days</h3>
            <p className="text-sm text-zinc-500">Daily distribution of orders across all venues.</p>
          </div>
        </div>
        <div className="h-[250px] md:h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={orderVolumeData}>
              <defs>
                <linearGradient id="colorOrders" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#2563eb" stopOpacity={0.1}/>
                  <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f4f4f5" />
              <XAxis 
                dataKey="date" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 14, fill: '#666' }}
                interval={window.innerWidth < 768 ? 8 : 4}
              />
              <YAxis 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 14, fill: '#666' }}
              />
              <Tooltip 
                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
              />
              <Area 
                type="monotone" 
                dataKey="orders" 
                stroke="#2563eb" 
                strokeWidth={2}
                fillOpacity={1} 
                fill="url(#colorOrders)" 
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top 5 Products */}
        <Card className="p-8 space-y-6">
          <h3 className="text-lg font-bold text-zinc-900">Top 5 Products</h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topProductsData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f4f4f5" />
                <XAxis type="number" hide />
                <YAxis 
                  dataKey="name" 
                  type="category" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fill: '#71717a' }}
                  width={150}
                />
                <Tooltip 
                  cursor={{ fill: '#fafafa' }}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                />
                <Bar dataKey="count" fill="#dc2626" radius={[0, 4, 4, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Venue Performance */}
        <Card className="p-8 space-y-6">
          <h3 className="text-lg font-bold text-zinc-900">Venue Performance</h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={venuePerformanceData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {venuePerformanceData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                />
                <Legend verticalAlign="bottom" height={36}/>
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* Top Products by Venue */}
      <Card className="p-8 space-y-6">
        <h3 className="text-lg font-bold text-zinc-900">Top Products by Venue</h3>
        <div className="h-[400px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={venueProductData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f4f4f5" />
              <XAxis 
                dataKey="name" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 10, fill: '#71717a' }}
              />
              <YAxis 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 10, fill: '#71717a' }}
              />
              <Tooltip 
                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
              />
              <Legend />
              {products.slice(0, 8).map((p, i) => (
                <Bar 
                  key={p.id} 
                  dataKey={p.name} 
                  stackId="a" 
                  fill={COLORS[i % COLORS.length]} 
                  radius={i === 0 ? [0, 0, 0, 0] : [0, 0, 0, 0]}
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* Never Ordered */}
      <Card className="p-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-zinc-900">Never Ordered</h3>
            <p className="text-sm text-zinc-500">Products that have not been included in any distribution orders.</p>
          </div>
          <span className="text-xs font-bold text-zinc-400 bg-zinc-50 px-2 py-1 rounded-md">{neverOrdered.length} products</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {neverOrdered.map(p => (
            <span key={p.id} className="px-3 py-1.5 bg-zinc-50 border border-zinc-100 rounded-full text-[10px] font-medium text-zinc-500">
              {p.name}
            </span>
          ))}
        </div>
      </Card>
    </div>
  );
}

function MessagingView({ venues, profile }: { venues: Venue[], profile: UserProfile | null }) {
  const [messages, setMessages] = useState<VenueMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [newMsgContent, setNewMsgContent] = useState('');
  const [newMsgType, setNewMsgType] = useState<'global' | 'individual'>('global');
  const [newMsgPersistence, setNewMsgPersistence] = useState<'one-time' | 'persistent'>('persistent');
  const [newMsgTarget, setNewMsgTarget] = useState('');

  useEffect(() => {
    if (!profile) return;
    
    const q = query(collection(db, 'venueMessages'), orderBy('createdAt', 'desc'));
    return onSnapshot(q, (snapshot) => {
      setMessages(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as VenueMessage)));
      setLoading(false);
    }, (error) => handleFirestoreError(error, OperationType.GET, 'venueMessages'));
  }, [profile]);

  const handleCreateMessage = async () => {
    if (!newMsgContent.trim()) return;
    if (newMsgType === 'individual' && !newMsgTarget) return;

    try {
      const messageData: any = {
        content: newMsgContent,
        type: newMsgType,
        persistence: newMsgPersistence,
        active: true,
        createdAt: Timestamp.now()
      };

      if (newMsgType === 'individual' && newMsgTarget) {
        messageData.targetVenueId = newMsgTarget;
      }

      await addDoc(collection(db, 'venueMessages'), messageData);
      setNewMsgContent('');
      setNewMsgTarget('');
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'venueMessages');
    }
  };

  const toggleActive = async (id: string, current: boolean) => {
    try {
      await updateDoc(doc(db, 'venueMessages', id), { active: !current });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, 'venueMessages');
    }
  };

  const deleteMessage = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'venueMessages', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, 'venueMessages');
    }
  };

  return (
    <div className="space-y-8 max-w-4xl">
      <Card className="p-4 md:p-6 space-y-4">
        <h3 className="text-lg font-bold">Create New Message</h3>
        <div className="space-y-4">
          <textarea
            value={newMsgContent}
            onChange={(e) => setNewMsgContent(e.target.value)}
            placeholder="Type your message here..."
            className="w-full p-3 border border-zinc-200 rounded-xl focus:ring-2 focus:ring-orange-500/20 focus:outline-none min-h-[100px] text-sm"
          />
          <div className="flex flex-col sm:flex-row gap-4 sm:items-end">
            <div className="flex-1 space-y-1">
              <label className="text-xs font-bold text-zinc-400 uppercase">Message Type</label>
              <select 
                value={newMsgType}
                onChange={(e) => setNewMsgType(e.target.value as any)}
                className="w-full p-2 border border-zinc-200 rounded-lg text-sm bg-white"
              >
                <option value="global">Global (All Venues)</option>
                <option value="individual">Individual Venue</option>
              </select>
            </div>
            <div className="flex-1 space-y-1">
              <label className="text-xs font-bold text-zinc-400 uppercase">Persistence</label>
              <select 
                value={newMsgPersistence}
                onChange={(e) => setNewMsgPersistence(e.target.value as any)}
                className="w-full p-2 border border-zinc-200 rounded-lg text-sm bg-white"
              >
                <option value="persistent">Persistent (Stays active)</option>
                <option value="one-time">One-time (Deactivates after read)</option>
              </select>
            </div>
            {newMsgType === 'individual' && (
              <div className="flex-1 space-y-1">
                <label className="text-xs font-bold text-zinc-400 uppercase">Target Venue</label>
                <select 
                  value={newMsgTarget}
                  onChange={(e) => setNewMsgTarget(e.target.value)}
                  className="w-full p-2 border border-zinc-200 rounded-lg text-sm bg-white"
                >
                  <option value="">Select Venue...</option>
                  {venues.filter(v => v.type === 'retail').map(v => (
                    <option key={v.id} value={v.id}>{v.name}</option>
                  ))}
                </select>
              </div>
            )}
            <Button onClick={handleCreateMessage} className="w-full sm:w-auto" disabled={!newMsgContent.trim() || (newMsgType === 'individual' && !newMsgTarget)}>
              Post Message
            </Button>
          </div>
        </div>
      </Card>

      <div className="space-y-4">
        <h3 className="text-lg font-bold">Message History</h3>
        {loading ? (
          <p className="text-zinc-400 italic">Loading messages...</p>
        ) : messages.length === 0 ? (
          <p className="text-zinc-400 italic">No messages posted yet.</p>
        ) : (
          <div className="grid gap-4">
            {messages.map(msg => (
              <Card key={msg.id} className={cn("p-4 flex flex-col sm:flex-row justify-between items-start gap-4", !msg.active && "opacity-60 bg-zinc-50")}>
                <div className="space-y-2 flex-1">
                  <div className="flex items-center gap-2">
                    <span className={cn(
                      "text-[10px] font-bold uppercase px-2 py-0.5 rounded-full",
                      msg.type === 'global' ? "bg-blue-100 text-blue-700" : "bg-purple-100 text-purple-700"
                    )}>
                      {msg.type === 'global' ? 'Global' : `To: ${venues.find(v => v.id === msg.targetVenueId)?.name || 'Unknown'}`}
                    </span>
                    <span className={cn(
                      "text-[10px] font-bold uppercase px-2 py-0.5 rounded-full",
                      msg.persistence === 'persistent' ? "bg-zinc-100 text-zinc-700" : "bg-orange-100 text-orange-700"
                    )}>
                      {msg.persistence === 'persistent' ? 'Persistent' : 'One-time'}
                    </span>
                    <span className="text-[10px] text-zinc-400">{format(msg.createdAt.toDate(), 'dd MMM, HH:mm')}</span>
                  </div>
                  <p className="text-sm text-zinc-700 whitespace-pre-wrap">{msg.content}</p>
                  {msg.readBy && msg.readBy.length > 0 && (
                    <div className="flex items-center gap-1 text-[10px] text-zinc-400">
                      <CheckCircle2 size={10} className="text-emerald-500" />
                      <span>Read by {msg.readBy.length} venue{msg.readBy.length !== 1 ? 's' : ''}</span>
                      <div className="group relative ml-1">
                        <Info size={10} className="cursor-help" />
                        <div className="absolute bottom-full left-0 mb-2 hidden group-hover:block bg-zinc-900 text-white p-2 rounded text-[10px] whitespace-nowrap z-10">
                          {msg.readBy.map(vid => venues.find(v => v.id === vid)?.name || vid).join(', ')}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                <div className="flex gap-2 w-full sm:w-auto">
                  <Button variant="ghost" size="sm" className="flex-1 sm:flex-none" onClick={() => toggleActive(msg.id, msg.active)}>
                    {msg.active ? 'Deactivate' : 'Activate'}
                  </Button>
                  <Button variant="danger" size="sm" className="flex-1 sm:flex-none" onClick={() => deleteMessage(msg.id)}>
                    Delete
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function MessagePopup({ messages, onDismiss }: { messages: VenueMessage[], onDismiss: () => void }) {
  if (messages.length === 0) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-6 bg-zinc-900/40 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-2xl md:rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden"
      >
        <div className="p-6 md:p-8 space-y-6">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 md:w-12 md:h-12 bg-orange-100 rounded-xl md:rounded-2xl flex items-center justify-center text-orange-600">
              <MessageSquare size={20} className="md:w-6 md:h-6" />
            </div>
            <div>
              <h3 className="text-lg md:text-xl font-bold text-zinc-900">New Message from the Bakery</h3>
              <p className="text-xs md:text-sm text-zinc-500">Important update for your venue.</p>
            </div>
          </div>

          <div className="space-y-4 max-h-[300px] md:max-h-[400px] overflow-y-auto pr-2">
            {messages.map(msg => (
              <div key={msg.id} className="p-4 bg-zinc-50 rounded-xl md:rounded-2xl border border-zinc-100 space-y-2">
                <div className="text-[9px] md:text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
                  {format(msg.createdAt.toDate(), 'EEEE, dd MMM HH:mm')}
                </div>
                <p className="text-xs md:text-sm text-zinc-700 leading-relaxed whitespace-pre-wrap">{msg.content}</p>
              </div>
            ))}
          </div>

          <Button variant="primary" className="w-full h-12 rounded-xl text-base md:text-lg shadow-lg" onClick={onDismiss}>
            Got it, thanks!
          </Button>
        </div>
      </motion.div>
    </div>
  );
}

function OrdersView({ venues, products, inventory, orders, profile, dataLoading, onSeed, seeding, seedError, whatsappEnabled, setOrderSuccessMessage }: { 
  venues: Venue[], 
  products: Product[], 
  inventory: InventoryItem[], 
  orders: DistributionOrder[], 
  profile: UserProfile | null, 
  dataLoading: boolean, 
  onSeed: () => void, 
  seeding: boolean, 
  seedError: string | null, 
  whatsappEnabled: boolean,
  setOrderSuccessMessage: (msg: string | null) => void
}) {
  const isVenueUser = profile?.role === 'venue';
  const scrollRef = useRef<HTMLDivElement>(null);

  const scrollCalendar = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = 200;
      scrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [viewType, setViewType] = useState<'list' | 'weekly'>('list');
  const [startDate, setStartDate] = useState(format(startOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState(format(endOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd'));
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [orderQuantities, setOrderQuantities] = useState<Record<string, number>>({});
  const [deliveryDate, setDeliveryDate] = useState(format(addDays(new Date(), 1), 'yyyy-MM-dd'));
  const [specialRequests, setSpecialRequests] = useState('');
  const [orderedBy, setOrderedBy] = useState('');
  const [isAddition, setIsAddition] = useState(false);
  const [viewMode, setViewMode] = useState<'order' | 'history'>(isVenueUser ? 'order' : 'history');
  const [selectedMonth, setSelectedMonth] = useState(format(new Date(), 'yyyy-MM'));
  const [selectedOrderIds, setSelectedOrderIds] = useState<string[]>([]);
  const [nameError, setNameError] = useState(false);
  const [showWhatsappForm, setShowWhatsappForm] = useState(false);
  const [whatsappName, setWhatsappName] = useState('');
  const [whatsappVenue, setWhatsappVenue] = useState('');
  const [whatsappQuestion, setWhatsappQuestion] = useState('');
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [tempNote, setTempNote] = useState('');
  const [addingItemId, setAddingItemId] = useState<string | null>(null);
  const [itemToAdd, setItemToAdd] = useState<{ productId: string, quantity: number }>({ productId: '', quantity: 1 });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionError, setSubmissionError] = useState<string | null>(null);

  const handleAddItem = async (orderId: string) => {
    if (!itemToAdd.productId || itemToAdd.quantity <= 0) return;
    try {
      await runTransaction(db, async (transaction) => {
        const orderRef = doc(db, 'orders', orderId);
        const orderDoc = await transaction.get(orderRef);
        if (!orderDoc.exists()) throw new Error('Order not found');
        
        const order = orderDoc.data() as DistributionOrder;
        const existingItemIndex = order.items.findIndex(i => i.productId === itemToAdd.productId);
        let newItems = [...order.items];
        
        if (existingItemIndex > -1) {
          newItems[existingItemIndex] = {
            ...newItems[existingItemIndex],
            quantity: newItems[existingItemIndex].quantity + itemToAdd.quantity
          };
        } else {
          newItems.push({ productId: itemToAdd.productId, quantity: itemToAdd.quantity });
        }

        // Only update kitchen inventory if order is NOT cancelled
        if (order.status !== 'cancelled') {
          const kitchenInvRef = doc(db, 'inventory', `central-kitchen_${itemToAdd.productId}`);
          const kitchenInvDoc = await transaction.get(kitchenInvRef);
          if (kitchenInvDoc.exists()) {
            transaction.update(kitchenInvRef, {
              quantity: Math.max(0, (kitchenInvDoc.data().quantity || 0) - itemToAdd.quantity),
              lastUpdated: serverTimestamp()
            });
          }
        }

        transaction.update(orderRef, {
          items: newItems,
          updatedAt: serverTimestamp()
        });
      });
      setAddingItemId(null);
      setItemToAdd({ productId: '', quantity: 1 });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `orders/${orderId}`);
    }
  };

  const handleRemoveItem = async (orderId: string, productId: string) => {
    try {
      await runTransaction(db, async (transaction) => {
        const orderRef = doc(db, 'orders', orderId);
        const orderDoc = await transaction.get(orderRef);
        if (!orderDoc.exists()) throw new Error('Order not found');
        
        const order = orderDoc.data() as DistributionOrder;
        const removedItem = order.items.find(item => item.productId === productId);
        if (!removedItem) return;
        
        const newItems = order.items.filter(item => item.productId !== productId);

        // Only restore kitchen inventory if order was NOT cancelled
        if (order.status !== 'cancelled') {
          const kitchenInvRef = doc(db, 'inventory', `central-kitchen_${productId}`);
          const kitchenInvDoc = await transaction.get(kitchenInvRef);
          if (kitchenInvDoc.exists()) {
            transaction.update(kitchenInvRef, {
              quantity: (kitchenInvDoc.data().quantity || 0) + removedItem.quantity,
              lastUpdated: serverTimestamp()
            });
          }
        }

        transaction.update(orderRef, {
          items: newItems,
          updatedAt: serverTimestamp()
        });
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `orders/${orderId}`);
    }
  };

  const handleStartEditNote = (orderId: string, currentNote: string) => {
    setEditingNoteId(orderId);
    setTempNote(currentNote || '');
  };

  const handleSaveNote = async (orderId: string) => {
    try {
      await updateDoc(doc(db, 'orders', orderId), {
        notes: tempNote.trim(),
        updatedAt: Timestamp.now()
      });
      setEditingNoteId(null);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `orders/${orderId}`);
    }
  };

  const openWhatsappForm = () => {
    setWhatsappName('');
    setWhatsappVenue(venues.find(v => v.id === profile?.venueId)?.name || '');
    setWhatsappQuestion('');
    setShowWhatsappForm(true);
  };

  const handleWhatsappSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const message = encodeURIComponent(`Name: ${whatsappName}\nVenue: ${whatsappVenue}\nQuestion: ${whatsappQuestion}`);
    window.open(`https://wa.me/447745724611?text=${message}`, '_blank');
    setShowWhatsappForm(false);
  };

  const handleBulkUpdateStatus = async (status: 'shipped' | 'received' | 'cancelled') => {
    if (selectedOrderIds.length === 0) return;
    try {
      await runTransaction(db, async (transaction) => {
        for (const id of selectedOrderIds) {
          const orderRef = doc(db, 'orders', id);
          const orderDoc = await transaction.get(orderRef);
          if (!orderDoc.exists()) continue;
          
          const orderData = orderDoc.data() as DistributionOrder;
          const oldStatus = orderData.status;
          if (oldStatus === status) continue;

          // Same logic as handleUpdateStatus
          if (status === 'cancelled' && oldStatus !== 'cancelled') {
            for (const item of orderData.items) {
              const kitchenInvRef = doc(db, 'inventory', `central-kitchen_${item.productId}`);
              const kitchenInvDoc = await transaction.get(kitchenInvRef);
              if (kitchenInvDoc.exists()) {
                transaction.update(kitchenInvRef, {
                  quantity: (kitchenInvDoc.data().quantity || 0) + item.quantity,
                  lastUpdated: serverTimestamp()
                });
              }
            }
          }

          if (status === 'received' && oldStatus !== 'received') {
            for (const item of orderData.items) {
              const venueInvId = `${orderData.venueId}_${item.productId}`;
              const venueInvRef = doc(db, 'inventory', venueInvId);
              const venueInvDoc = await transaction.get(venueInvRef);
              
              if (venueInvDoc.exists()) {
                transaction.update(venueInvRef, {
                  quantity: (venueInvDoc.data().quantity || 0) + item.quantity,
                  lastUpdated: serverTimestamp()
                });
              } else {
                transaction.set(venueInvRef, {
                  venueId: orderData.venueId,
                  productId: item.productId,
                  quantity: item.quantity,
                  lastUpdated: serverTimestamp()
                });
              }
            }
          }

          transaction.update(orderRef, {
            status,
            updatedAt: serverTimestamp(),
            statusHistory: arrayUnion({
              status,
              timestamp: Timestamp.now(),
              updatedBy: profile?.displayName || 'System'
            })
          });
        }
      });
      setSelectedOrderIds([]);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, 'orders/bulk');
    }
  };

  const toggleOrderSelection = (id: string) => {
    setSelectedOrderIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  // Initialize quantities
  useEffect(() => {
    if (isVenueUser && Object.keys(orderQuantities).length === 0) {
      const initial: Record<string, number> = {};
      products.forEach(p => initial[p.id] = 0);
      setOrderQuantities(initial);
    }
  }, [products, isVenueUser]);

  const activeOrders = useMemo(() => {
    let filtered = orders;
    if (isVenueUser) {
      filtered = filtered.filter(o => o.venueId === profile?.venueId);
      if (viewMode === 'history') {
        filtered = filtered.filter(o => {
          const date = o.createdAt?.toDate?.() || new Date();
          return format(date, 'yyyy-MM') === selectedMonth;
        });
      }
    } else if (selectedDate) {
      filtered = filtered.filter(o => o.deliveryDate === selectedDate);
    }
    
    // Sort by createdAt descending to ensure most recent is first
    return [...filtered].sort((a, b) => {
      const dateA = a.createdAt?.toDate?.()?.getTime() || 0;
      const dateB = b.createdAt?.toDate?.()?.getTime() || 0;
      return dateB - dateA;
    });
  }, [orders, isVenueUser, profile, selectedDate, viewMode, selectedMonth]);

  const handleQuantityChange = (productId: string, val: number) => {
    setOrderQuantities(prev => ({
      ...prev,
      [productId]: Math.max(0, val)
    }));
  };

  const selectedItems = useMemo(() => {
    return Object.entries(orderQuantities)
      .filter(([_, qty]) => qty > 0)
      .map(([productId, quantity]) => ({
        productId,
        quantity,
        name: products.find(p => p.id === productId)?.name || 'Unknown'
      }));
  }, [orderQuantities, products]);

  const handleSubmitOrder = async () => {
    if (selectedItems.length === 0) return;
    setIsSubmitting(true);
    setSubmissionError(null);

    try {
      await runTransaction(db, async (transaction) => {
        // 1. All Reads First
        const inventoryData: { ref: any, currentQty: number, item: any }[] = [];
        
        for (const item of selectedItems) {
          const invRef = doc(db, 'inventory', `central-kitchen_${item.productId}`);
          const invDoc = await transaction.get(invRef);
          if (invDoc.exists()) {
            inventoryData.push({
              ref: invRef,
              currentQty: invDoc.data().quantity || 0,
              item
            });
          }
        }

        // 2. All Writes After Reads
        const orderRef = doc(collection(db, 'orders'));
        const orderData = {
          venueId: profile?.venueId || 'unknown',
          items: selectedItems.map(({ productId, quantity }) => ({ productId, quantity })),
          status: 'pending',
          deliveryDate,
          orderedBy: orderedBy.trim(),
          notes: isAddition ? `[ADDITION] ${specialRequests}`.trim() : specialRequests.trim(),
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          statusHistory: [{
            status: 'pending',
            timestamp: Timestamp.now(),
            updatedBy: orderedBy.trim() || profile?.displayName || 'Venue User'
          }]
        };
        
        transaction.set(orderRef, orderData);

        for (const { ref, currentQty, item } of inventoryData) {
          transaction.update(ref, {
            quantity: Math.max(0, currentQty - item.quantity),
            lastUpdated: serverTimestamp()
          });
        }
      });

      setShowConfirmModal(false);
      // Reset quantities
      const reset: Record<string, number> = {};
      products.forEach(p => reset[p.id] = 0);
      setOrderQuantities(reset);
      setSpecialRequests('');
      setOrderedBy('');
      setIsAddition(false);
      
      // If it's a venue user, show success and log out
      if (isVenueUser) {
        setOrderSuccessMessage('Thanks for your order!');
        setTimeout(async () => {
          await signOut(auth);
        }, 1500);
      } else {
        setViewMode('history');
      }
    } catch (error) {
      console.error('Order submission failed:', error);
      setSubmissionError(error instanceof Error ? error.message : 'Unknown error occurred');
      // If it's a permission error, it might be the venueId issue we identified
      if (error instanceof Error && error.message.includes('permission-denied')) {
        setSubmissionError('Access Denied: Please check if your venue profile is correctly set up.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateStatus = async (orderId: string, status: OrderStatus) => {
    try {
      await runTransaction(db, async (transaction) => {
        const orderRef = doc(db, 'orders', orderId);
        const orderDoc = await transaction.get(orderRef);
        if (!orderDoc.exists()) throw new Error('Order not found');
        
        const orderData = orderDoc.data() as DistributionOrder;
        const oldStatus = orderData.status;
        
        if (oldStatus === status) return;

        const historyEntry = {
          status,
          timestamp: Timestamp.now(),
          updatedBy: profile?.displayName || profile?.email || 'System'
        };

        // 1. Restore inventory if cancelling an order that was NOT previously cancelled
        if (status === 'cancelled' && oldStatus !== 'cancelled') {
          for (const item of orderData.items) {
            const kitchenInvRef = doc(db, 'inventory', `central-kitchen_${item.productId}`);
            const kitchenInvDoc = await transaction.get(kitchenInvRef);
            if (kitchenInvDoc.exists()) {
              transaction.update(kitchenInvRef, {
                quantity: (kitchenInvDoc.data().quantity || 0) + item.quantity,
                lastUpdated: serverTimestamp()
              });
            }
          }
        }

        // 2. Addition to venue inventory if receiving an order that was NOT previously received
        if (status === 'received' && oldStatus !== 'received') {
          for (const item of orderData.items) {
            const venueInvId = `${orderData.venueId}_${item.productId}`;
            const venueInvRef = doc(db, 'inventory', venueInvId);
            const venueInvDoc = await transaction.get(venueInvRef);
            
            if (venueInvDoc.exists()) {
              transaction.update(venueInvRef, {
                quantity: (venueInvDoc.data().quantity || 0) + item.quantity,
                lastUpdated: serverTimestamp()
              });
            } else {
              transaction.set(venueInvRef, {
                venueId: orderData.venueId,
                productId: item.productId,
                quantity: item.quantity,
                lastUpdated: serverTimestamp()
              });
            }
          }
        }

        transaction.update(orderRef, {
          status,
          updatedAt: serverTimestamp(),
          statusHistory: arrayUnion(historyEntry)
        });
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `orders/${orderId}`);
    }
  };

  const handleBulkShip = async () => {
    const pendingOrders = activeOrders.filter(o => o.status === 'pending');
    if (pendingOrders.length === 0) return;

    try {
      const batch = writeBatch(db);
      const historyEntry = {
        status: 'shipped' as OrderStatus,
        timestamp: Timestamp.now(),
        updatedBy: profile?.displayName || profile?.email || 'System'
      };

      pendingOrders.forEach(order => {
        const orderRef = doc(db, 'orders', order.id);
        batch.update(orderRef, {
          status: 'shipped',
          updatedAt: serverTimestamp(),
          statusHistory: arrayUnion(historyEntry)
        });
      });

      await batch.commit();
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, 'orders/bulk-ship');
    }
  };

  const handleRepeatLastOrder = () => {
    const venueOrders = orders
      .filter(o => o.venueId === profile?.venueId)
      .sort((a, b) => {
        const timeA = a.createdAt?.toDate?.()?.getTime() || 0;
        const timeB = b.createdAt?.toDate?.()?.getTime() || 0;
        return timeB - timeA;
      });
    
    if (venueOrders.length > 0) {
      const lastOrder = venueOrders[0];
      const newQuantities: Record<string, number> = {};
      products.forEach(p => newQuantities[p.id] = 0);
      lastOrder.items.forEach(item => {
        newQuantities[item.productId] = item.quantity;
      });
      setOrderQuantities(newQuantities);
      setOrderedBy(lastOrder.orderedBy || '');
    }
  };

  const categories = useMemo(() => {
    const cats = Array.from(new Set(products.map(p => p.category || 'Other')));
    // Order categories as in the image
    const order = ['Venue Menu', "Children’s", 'Afternoon Tea', 'Vegan & Gluten Free'];
    return cats.sort((a, b) => {
      const idxA = order.indexOf(a);
      const idxB = order.indexOf(b);
      if (idxA === -1 && idxB === -1) return a.localeCompare(b);
      if (idxA === -1) return 1;
      if (idxB === -1) return -1;
      return idxA - idxB;
    });
  }, [products]);

  const filteredProducts = useMemo(() => {
    let baseProducts = products;
    if (isVenueUser && profile?.venueId) {
      const venueInventory = inventory.filter(i => i.venueId === profile.venueId);
      baseProducts = products.filter(p => venueInventory.some(i => i.productId === p.id));
    }
    
    return baseProducts.filter(p => p.active !== false);
  }, [products, inventory, isVenueUser, profile?.venueId]);

  const getCategoryIcon = (cat: string) => {
    switch (cat) {
      case 'Venue Menu': return <Store size={16} className="text-orange-800" />;
      case "Children’s": return <Baby size={16} className="text-orange-800" />;
      case 'Afternoon Tea': return <Coffee size={16} className="text-orange-800" />;
      case 'Vegan & Gluten Free': return <Leaf size={16} className="text-orange-800" />;
      default: return <Package size={16} className="text-orange-800" />;
    }
  };

  const venueName = venues.find(v => v.id === profile?.venueId)?.name || 'Venue';

  if (isVenueUser) {
    const dates = Array.from({ length: 14 }, (_, i) => addDays(startOfToday(), i));

    return (
      <div className="max-w-3xl mx-auto pb-20">
        {/* Header */}
        <div className="flex items-center justify-between py-4 border-b border-zinc-100 mb-6">
          <div>
            <h2 className="text-lg font-bold text-zinc-900">{venueName}</h2>
            <p className="text-xs text-zinc-500">Order Portal</p>
          </div>
          <div className="flex items-center gap-2">
            {whatsappEnabled && (
              <button 
                onClick={openWhatsappForm}
                className="h-9 px-3 text-[10px] font-bold uppercase tracking-wider gap-2 rounded-xl border border-emerald-200 text-emerald-700 hover:bg-emerald-50 flex items-center transition-colors"
              >
                <MessageSquare size={14} />
                <span className="hidden sm:inline">Message Bakery</span>
                <span className="sm:hidden">Message</span>
              </button>
            )}
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleRepeatLastOrder}
              className="h-9 px-3 text-[10px] font-bold uppercase tracking-wider gap-2 rounded-xl border-zinc-200"
            >
              <RotateCcw size={14} />
              Repeat Last
            </Button>
            <button onClick={() => signOut(auth)} className="p-2 text-zinc-400 hover:text-zinc-600">
              <LogOut size={20} />
            </button>
          </div>
        </div>

        {/* View Toggle */}
        <div className="flex p-1 bg-zinc-100 rounded-2xl mb-8">
          <button 
            onClick={() => setViewMode('order')}
            className={cn(
              "flex-1 py-2.5 text-xs font-bold rounded-xl transition-all",
              viewMode === 'order' ? "bg-white text-zinc-900 shadow-sm" : "text-zinc-500 hover:text-zinc-700"
            )}
          >
            New Order
          </button>
          <button 
            onClick={() => setViewMode('history')}
            className={cn(
              "flex-1 py-2.5 text-xs font-bold rounded-xl transition-all",
              viewMode === 'history' ? "bg-white text-zinc-900 shadow-sm" : "text-zinc-500 hover:text-zinc-700"
            )}
          >
            Order History
          </button>
        </div>

        {viewMode === 'order' ? (
          <>
            {/* Tip */}
            <div className="flex items-center justify-center gap-2 text-[10px] text-zinc-400 mb-8">
              <Lightbulb size={12} className="text-orange-400" />
              <span>Tip: Ctrl+Enter to submit • Esc to clear</span>
            </div>

            {/* Delivery Date */}
            <div className="space-y-4 mb-10">
              <div className="flex items-center gap-2 text-sm font-medium text-zinc-700">
                <Calendar size={16} className="text-orange-800" />
                <span>Delivery Date</span>
              </div>
              <p className="text-xs text-zinc-400">Select today for next-day delivery</p>
              
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => scrollCalendar('left')}
                  className="p-1 text-zinc-400 hover:text-zinc-800 transition-colors"
                >
                  <ChevronLeft size={20} />
                </button>
                <div 
                  ref={scrollRef}
                  className="flex-1 flex gap-2 overflow-x-auto pb-2 scrollbar-hide"
                >
                  {dates.map((date) => {
                    const dateStr = format(date, 'yyyy-MM-dd');
                    const isSelected = deliveryDate === dateStr;
                    const hasOrder = orders.some(o => o.venueId === profile?.venueId && o.deliveryDate === dateStr && o.status !== 'cancelled');
                    
                    return (
                      <button
                        key={dateStr}
                        onClick={() => setDeliveryDate(dateStr)}
                        className={cn(
                          "flex-shrink-0 px-4 py-2 rounded-lg text-xs font-medium transition-all border",
                          isSelected 
                            ? "bg-orange-800 border-orange-800 text-white shadow-md shadow-orange-200" 
                            : hasOrder
                              ? "bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100 shadow-sm shadow-emerald-50"
                              : "bg-white border-zinc-200 text-zinc-600 hover:border-orange-300"
                        )}
                      >
                        {format(date, 'EEE dd MMM')}
                      </button>
                    );
                  })}
                </div>
                <button 
                  onClick={() => scrollCalendar('right')}
                  className="p-1 text-zinc-800 hover:text-orange-800 transition-colors"
                >
                  <ChevronRight size={20} />
                </button>
              </div>
            </div>

            {/* Delivery Date Selection */}
            <div className="p-4 bg-zinc-50 border border-zinc-200 rounded-2xl mb-8 no-print">
              <div className="flex items-center gap-3 mb-4 text-zinc-900">
                <Calendar size={18} className="text-orange-600" />
                <span className="text-sm font-bold">Planned Delivery Date</span>
              </div>
              <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                {[1, 2, 3, 4, 5, 6, 7].map((daysCount) => {
                  const date = addDays(new Date(), daysCount);
                  const dateStr = format(date, 'yyyy-MM-dd');
                  const isSelected = deliveryDate === dateStr;
                  return (
                    <button
                      key={dateStr}
                      onClick={() => setDeliveryDate(dateStr)}
                      className={cn(
                        "flex-shrink-0 px-4 py-3 rounded-xl text-xs font-bold transition-all border flex flex-col items-center min-w-[80px]",
                        isSelected 
                          ? "bg-zinc-900 border-zinc-900 text-white shadow-lg shadow-zinc-200" 
                          : "bg-white border-zinc-100 text-zinc-500 hover:border-orange-200"
                      )}
                    >
                      <span className="opacity-60 mb-1">{format(date, 'EEE')}</span>
                      <span>{format(date, 'dd MMM')}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Menu Sections */}
            <div className="space-y-10">
              {dataLoading ? (
                <div className="flex flex-col items-center justify-center py-20">
                  <div className="w-10 h-10 border-4 border-orange-100 border-t-orange-800 rounded-full animate-spin mb-4" />
                  <p className="text-xs text-zinc-400">Loading menu items...</p>
                </div>
              ) : filteredProducts.length === 0 ? (
                <div className="text-center py-20 bg-zinc-50 rounded-3xl border-2 border-dashed border-zinc-200">
                  <Package size={48} className="mx-auto text-zinc-300 mb-4" />
                  <h3 className="text-zinc-900 font-bold">No products available</h3>
                  <p className="text-zinc-500 text-xs mt-1">Please contact the kitchen if you believe this is an error.</p>
                </div>
              ) : (
                categories
                  .map((cat) => {
                    const catProducts = filteredProducts.filter(p => (p.category || 'Other') === cat);
                    if (catProducts.length === 0) return null;
                    
                    return (
                      <div key={cat} className="space-y-4">
                        <div className="flex items-center gap-2 text-sm font-bold text-zinc-800">
                          <div className="w-1 h-1 rounded-full bg-orange-800" />
                          {getCategoryIcon(cat)}
                          <span>{cat}</span>
                        </div>
                        
                        <Card className="divide-y divide-zinc-50 border-zinc-100 overflow-hidden">
                          {catProducts.map((product) => (
                            <div key={product.id} className="flex items-center justify-between p-4 bg-white hover:bg-zinc-50/50 transition-colors group">
                              <div className="flex items-center gap-4 flex-1">
                                <div className="w-12 h-12 rounded-xl bg-zinc-100 overflow-hidden flex-shrink-0 border border-zinc-200">
                                  {product.imageUrl ? (
                                    <img 
                                      src={product.imageUrl} 
                                      alt={product.name} 
                                      className="w-full h-full object-cover"
                                      referrerPolicy="no-referrer"
                                    />
                                  ) : (
                                    <div className="w-full h-full flex items-center justify-center text-zinc-300">
                                      <Package size={20} />
                                    </div>
                                  )}
                                </div>
                                <div className="flex flex-col">
                                  <span className="text-xs font-bold text-zinc-900">{product.name}</span>
                                  {product.description && (
                                    <span className="text-[10px] text-zinc-400 line-clamp-1">{product.description}</span>
                                  )}
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <button 
                                  onClick={() => handleQuantityChange(product.id, (orderQuantities[product.id] || 0) - 1)}
                                  className="w-8 h-8 rounded-xl border border-zinc-200 flex items-center justify-center text-zinc-400 hover:bg-white hover:text-orange-800 hover:border-orange-200 transition-all active:scale-95"
                                >
                                  -
                                </button>
                                <input 
                                  type="number"
                                  value={orderQuantities[product.id] || 0}
                                  onChange={(e) => handleQuantityChange(product.id, parseInt(e.target.value) || 0)}
                                  className="w-10 bg-transparent text-center font-bold text-sm focus:outline-none"
                                />
                                <button 
                                  onClick={() => handleQuantityChange(product.id, (orderQuantities[product.id] || 0) + 1)}
                                  className="w-8 h-8 rounded-xl border border-zinc-200 flex items-center justify-center text-zinc-400 hover:bg-white hover:text-orange-800 hover:border-orange-200 transition-all active:scale-95"
                                >
                                  +
                                </button>
                              </div>
                            </div>
                          ))}
                        </Card>
                      </div>
                    );
                  })
              )}
            </div>

            {/* Ordered By & Special Requests */}
            <div className="mt-12 space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-bold text-zinc-800">Ordered By</div>
                  {nameError && (
                    <motion.span 
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="text-[10px] font-bold text-red-500 uppercase tracking-widest"
                    >
                      * Name required to continue
                    </motion.span>
                  )}
                </div>
                <input 
                  type="text"
                  value={orderedBy}
                  onChange={(e) => {
                    setOrderedBy(e.target.value);
                    if (e.target.value.trim()) setNameError(false);
                  }}
                  placeholder="Your full name..."
                  className={cn(
                    "w-full p-4 bg-white border rounded-2xl text-xs focus:outline-none focus:ring-2 transition-all",
                    nameError ? "border-red-300 ring-2 ring-red-500/10" : "border-zinc-200 focus:ring-orange-500/10"
                  )}
                  required
                />
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-bold text-zinc-800">Special Requests</div>
                  <label className="flex items-center gap-2 cursor-pointer group">
                    <div className={cn(
                      "w-4 h-4 rounded border transition-all flex items-center justify-center",
                      isAddition ? "bg-orange-600 border-orange-600" : "border-zinc-300 group-hover:border-orange-400"
                    )}>
                      {isAddition && <CheckCircle2 size={10} className="text-white" />}
                    </div>
                    <input 
                      type="checkbox" 
                      className="hidden" 
                      checked={isAddition}
                      onChange={(e) => setIsAddition(e.target.checked)}
                    />
                    <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">This is an addition</span>
                  </label>
                </div>
                <textarea 
                  value={specialRequests}
                  onChange={(e) => setSpecialRequests(e.target.value)}
                  placeholder="Any allergies, dietary requirements or special notes..."
                  className="w-full h-32 p-4 bg-white border border-zinc-200 rounded-2xl text-xs focus:outline-none focus:ring-2 focus:ring-orange-500/10 resize-none"
                />
              </div>
            </div>

            {/* Submit Bar */}
            <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-full max-w-md px-4">
              <Button 
                variant="primary" 
                size="lg" 
                className="w-full shadow-xl shadow-orange-200 h-14 rounded-2xl text-base font-bold tracking-tight"
                disabled={selectedItems.length === 0}
                onClick={() => {
                  if (!orderedBy.trim()) {
                    setNameError(true);
                    // Scroll to the input
                    const input = document.querySelector('input[placeholder="Your full name..."]');
                    input?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    return;
                  }
                  setShowConfirmModal(true);
                }}
              >
                Review Order ({selectedItems.length})
              </Button>
            </div>

            {/* Confirmation Modal */}
            <AnimatePresence>
              {showConfirmModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-900/60 backdrop-blur-sm">
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden"
                  >
                    <div className="p-8 border-b border-zinc-50">
                      <h3 className="text-2xl font-bold text-zinc-900">Confirm Order</h3>
                      <p className="text-sm text-zinc-500">Review your selection for {format(new Date(deliveryDate), 'MMM do')}</p>
                    </div>
                    <div className="p-8 max-h-[400px] overflow-y-auto space-y-4">
                      {selectedItems.map((item) => (
                        <div key={item.productId} className="flex justify-between items-center">
                          <span className="text-sm font-medium text-zinc-700">{item.name}</span>
                          <span className="text-sm font-bold text-orange-800">x{item.quantity}</span>
                        </div>
                      ))}
                      {specialRequests && (
                        <div className="pt-4 border-t border-zinc-50">
                          <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1">Notes</p>
                          <p className="text-xs text-zinc-600 italic">"{specialRequests}"</p>
                        </div>
                      )}
                      <div className="pt-4 border-t border-zinc-50">
                        <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1">Ordered By</p>
                        <p className="text-xs text-zinc-600">{orderedBy}</p>
                        {isAddition && <p className="text-[10px] font-bold text-orange-600 uppercase mt-1">This is an addition</p>}
                      </div>
                    </div>
                    <div className="p-8 bg-zinc-50/50 flex flex-col gap-4">
                      {submissionError && (
                        <div className="p-3 bg-red-50 border border-red-100 rounded-xl text-[10px] text-red-600 font-bold uppercase tracking-wider">
                          Error: {submissionError}
                        </div>
                      )}
                      <div className="flex gap-4">
                        <Button variant="outline" className="flex-1 rounded-xl h-12" onClick={() => setShowConfirmModal(false)} disabled={isSubmitting}>Back</Button>
                        <Button 
                          variant="primary" 
                          className="flex-1 rounded-xl h-12" 
                          onClick={handleSubmitOrder}
                          disabled={isSubmitting}
                        >
                          {isSubmitting ? 'Submitting...' : 'Submit'}
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                </div>
              )}
            </AnimatePresence>
          </>
        ) : (
          <div className="space-y-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-serif italic">Order History</h3>
              <div className="flex items-center gap-2">
                <select 
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="text-xs font-bold bg-white border border-zinc-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500/10"
                >
                  {Array.from({ length: 6 }, (_, i) => {
                    const d = addMonths(new Date(), -i);
                    return (
                      <option key={format(d, 'yyyy-MM')} value={format(d, 'yyyy-MM')}>
                        {format(d, 'MMMM yyyy')}
                      </option>
                    );
                  })}
                </select>
                <Button variant="ghost" size="sm" onClick={() => setViewMode('order')} className="text-orange-800 font-bold">
                  + New Order
                </Button>
              </div>
            </div>
            
            <div className="grid grid-cols-1 gap-4">
              {activeOrders.map((order) => (
                <Card key={order.id} className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-4">
                      <div className={cn(
                        "w-10 h-10 rounded-xl flex items-center justify-center",
                        order.status === 'received' ? 'bg-emerald-50 text-emerald-600' : 'bg-orange-50 text-orange-600'
                      )}>
                        <Truck size={20} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-zinc-900">Order #{order.id.slice(0, 6)}</span>
                          <Badge variant={order.status === 'received' ? 'success' : order.status === 'shipped' ? 'info' : 'warning'}>
                            {order.status}
                          </Badge>
                        </div>
                        <p className="text-xs text-zinc-500">
                          {format(order.createdAt.toDate(), 'MMM d, yyyy • HH:mm')}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {order.items.map((item, i) => {
                      const product = products.find(p => p.id === item.productId);
                      return (
                        <div key={i} className="flex items-center justify-between p-3 bg-zinc-50 rounded-lg border border-zinc-100">
                          <span className="text-xs font-medium text-zinc-800 truncate mr-2">{product?.name || 'Unknown'}</span>
                          <span className="text-xs font-bold text-orange-700">x{item.quantity}</span>
                        </div>
                      );
                    })}
                  </div>

                  {order.notes && (
                    <div className="mt-4 p-3 bg-orange-50/50 rounded-lg border border-orange-100/50">
                      <p className="text-[10px] font-bold text-orange-800 uppercase tracking-widest mb-1">Notes</p>
                      <p className="text-xs text-zinc-600 italic">"{order.notes}"</p>
                    </div>
                  )}

                  {order.status === 'shipped' && (
                    <Button 
                      className="w-full mt-4" 
                      variant="primary" 
                      size="sm"
                      onClick={() => handleUpdateStatus(order.id, 'received')}
                    >
                      Confirm Receipt
                    </Button>
                  )}
                </Card>
              ))}
              {activeOrders.length === 0 && (
                <div className="text-center py-20 bg-white border border-dashed border-zinc-200 rounded-2xl">
                  <Truck className="mx-auto mb-4 text-zinc-200" size={48} />
                  <p className="text-zinc-500">No orders found.</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    );
  }

  if (viewType === 'weekly' && !isVenueUser) {
    return (
      <WeeklySheet 
        venues={venues} 
        products={products} 
        orders={orders} 
        startDate={new Date(startDate)} 
        endDate={new Date(endDate)}
        onBack={() => setViewType('list')} 
        onStartDateChange={setStartDate}
        onEndDateChange={setEndDate}
        onPrevWeek={() => {
          const newStart = addDays(new Date(startDate), -7);
          const newEnd = addDays(new Date(endDate), -7);
          setStartDate(format(newStart, 'yyyy-MM-dd'));
          setEndDate(format(newEnd, 'yyyy-MM-dd'));
        }}
        onNextWeek={() => {
          const newStart = addDays(new Date(startDate), 7);
          const newEnd = addDays(new Date(endDate), 7);
          setStartDate(format(newStart, 'yyyy-MM-dd'));
          setEndDate(format(newEnd, 'yyyy-MM-dd'));
        }}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h3 className="text-xl font-serif italic">{isVenueUser ? 'Order History' : 'Venue Requirements'}</h3>
          <p className="text-sm text-zinc-500">
            {isVenueUser ? 'Track your previous and pending orders.' : 'Overview of what venues require and when.'}
          </p>
        </div>
        <div className="flex flex-wrap gap-2 items-center">
          {isVenueUser && (
            <div className="flex p-1 bg-zinc-100 rounded-xl mr-2">
              <button 
                onClick={() => setViewMode('order')}
                className={cn(
                  "px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest rounded-lg transition-all",
                  viewMode === 'order' ? "bg-white text-zinc-900 shadow-sm" : "text-zinc-500 hover:text-zinc-700"
                )}
              >
                New Order
              </button>
              <button 
                onClick={() => setViewMode('history')}
                className={cn(
                  "px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest rounded-lg transition-all",
                  viewMode === 'history' ? "bg-white text-zinc-900 shadow-sm" : "text-zinc-500 hover:text-zinc-700"
                )}
              >
                History
              </button>
            </div>
          )}
          {!isVenueUser && (
            <div className="flex items-center gap-2 bg-white border border-zinc-200 rounded-lg px-3 py-1.5 shadow-sm w-full sm:w-auto">
              <div className="flex flex-col flex-1 sm:flex-none">
                <span className="text-[10px] font-bold text-zinc-400 uppercase leading-none mb-1">From</span>
                <input 
                  type="date" 
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="text-xs font-medium text-zinc-700 focus:outline-none bg-transparent"
                />
              </div>
              <div className="h-6 w-px bg-zinc-100 mx-1" />
              <div className="flex flex-col flex-1 sm:flex-none">
                <span className="text-[10px] font-bold text-zinc-400 uppercase leading-none mb-1">To</span>
                <input 
                  type="date" 
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="text-xs font-medium text-zinc-700 focus:outline-none bg-transparent"
                />
              </div>
            </div>
          )}
          {!isVenueUser && (
            <Button 
              variant="secondary" 
              size="sm" 
              onClick={handleBulkShip}
              className="gap-2 h-10 bg-zinc-900 hover:bg-zinc-800 flex-1 sm:flex-none"
              disabled={activeOrders.filter(o => o.status === 'pending').length === 0}
            >
              <Truck size={16} />
              <span className="hidden sm:inline">Bulk Ship Pending</span>
              <span className="sm:hidden">Bulk Ship</span>
            </Button>
          )}
          {!isVenueUser && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setViewType('weekly')} 
              className="gap-2 border-orange-200 text-orange-800 h-10 flex-1 sm:flex-none"
            >
              <Printer size={16} />
              <span className="hidden sm:inline">Production Sheet</span>
              <span className="sm:hidden">Production</span>
            </Button>
          )}
          {isVenueUser && (
            <Button onClick={() => setViewMode('order')} className="gap-2 w-full sm:w-auto">
              <Plus size={16} />
              New Order
            </Button>
          )}
        </div>
      </div>

      {!isVenueUser && (
        <div className="space-y-4 mb-8">
          <div className="flex items-center gap-2 text-sm font-medium text-zinc-700">
            <Calendar size={16} className="text-orange-800" />
            <span>Filter by Delivery Date</span>
          </div>
          
          <div className="flex items-center gap-2">
            <button 
              onClick={() => scrollCalendar('left')}
              className="p-1 text-zinc-400 hover:text-zinc-800 transition-colors"
            >
              <ChevronLeft size={20} />
            </button>
            <div 
              ref={scrollRef}
              className="flex-1 flex gap-2 overflow-x-auto pb-2 scrollbar-hide"
            >
              <button
                onClick={() => setSelectedDate(null)}
                className={cn(
                  "flex-shrink-0 px-4 py-2 rounded-lg text-xs font-medium transition-all border",
                  selectedDate === null 
                    ? "bg-zinc-900 border-zinc-900 text-white shadow-md shadow-zinc-200" 
                    : "bg-white border-zinc-200 text-zinc-600 hover:border-zinc-300"
                )}
              >
                All Dates
              </button>
              {Array.from({ length: 14 }, (_, i) => addDays(startOfToday(), i)).map((date) => {
                const dateStr = format(date, 'yyyy-MM-dd');
                const isSelected = selectedDate === dateStr;
                const hasOrders = orders.some(o => o.deliveryDate === dateStr && o.status !== 'cancelled');
                
                return (
                  <button
                    key={dateStr}
                    onClick={() => setSelectedDate(dateStr)}
                    className={cn(
                      "flex-shrink-0 px-4 py-2 rounded-lg text-xs font-medium transition-all border",
                      isSelected 
                        ? "bg-orange-800 border-orange-800 text-white shadow-md shadow-orange-200" 
                        : hasOrders
                          ? "bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100"
                          : "bg-white border-zinc-200 text-zinc-600 hover:border-orange-300"
                    )}
                  >
                    {format(date, 'EEE dd MMM')}
                  </button>
                );
              })}
            </div>
            <button 
              onClick={() => scrollCalendar('right')}
              className="p-1 text-zinc-800 hover:text-orange-800 transition-colors"
            >
              <ChevronRight size={20} />
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4">
        {activeOrders.map((order) => {
          const venue = venues.find(v => v.id === order.venueId);
          const isSelected = selectedOrderIds.includes(order.id);
          return (
            <Card key={order.id} className={cn("p-6 transition-all", isSelected && "ring-2 ring-orange-500 bg-orange-50/10")}>
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                <div className="flex items-center gap-4">
                  {!isVenueUser && (
                    <button 
                      onClick={() => toggleOrderSelection(order.id)}
                      className={cn(
                        "w-5 h-5 rounded border-2 flex items-center justify-center transition-colors",
                        isSelected ? "bg-orange-600 border-orange-600 text-white" : "border-zinc-300 hover:border-orange-400"
                      )}
                    >
                      {isSelected && <Check size={14} strokeWidth={3} />}
                    </button>
                  )}
                  <div className={cn(
                    "w-12 h-12 rounded-xl flex items-center justify-center",
                    order.status === 'received' ? 'bg-emerald-50 text-emerald-600' : 'bg-orange-50 text-orange-600'
                  )}>
                    <Truck size={24} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-orange-900 text-xl underline decoration-orange-200 decoration-2 underline-offset-4">{venue?.name}</h4>
                      <Badge variant={order.status === 'received' ? 'success' : order.status === 'shipped' ? 'info' : 'warning'}>
                        {order.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-zinc-600">
                      Requested for: <span className="font-bold text-zinc-900">{order.deliveryDate ? format(new Date(order.deliveryDate), 'MMM d, yyyy') : 'Asap'}</span>
                    </p>
                    <p className="text-xs text-zinc-500 mt-1">
                      Ordered by: <span className="font-bold text-zinc-700">{order.orderedBy || 'Unknown'}</span>
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  {!isVenueUser && order.status === 'pending' && (
                    <div className="flex items-center gap-2 mr-2">
                      <Button 
                        size="sm" 
                        variant="primary" 
                        onClick={() => setAddingItemId(addingItemId === order.id ? null : order.id)}
                        className="bg-orange-600 hover:bg-orange-700"
                      >
                        <Plus size={14} className="mr-1" />
                        Add Item
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => handleUpdateStatus(order.id, 'shipped')}>Ship Order</Button>
                    </div>
                  )}
                  {isVenueUser && order.status === 'shipped' && (
                    <Button size="sm" variant="primary" onClick={() => handleUpdateStatus(order.id, 'received')}>Confirm Receipt</Button>
                  )}
                  <p className="text-[10px] text-zinc-400 uppercase font-bold ml-2">ID: {order.id.slice(0, 8)}</p>
                </div>
              </div>
              
              {addingItemId === order.id && (
                <div className="mb-6 animate-in fade-in slide-in-from-top-2">
                  <div className="p-4 bg-orange-50 border border-orange-200 rounded-xl">
                    <div className="flex flex-col sm:flex-row gap-3">
                      <select 
                        className="flex-1 bg-white border border-zinc-200 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-orange-500/20 focus:outline-none"
                        value={itemToAdd.productId}
                        onChange={(e) => setItemToAdd(prev => ({ ...prev, productId: e.target.value }))}
                      >
                        <option value="">Select product to add...</option>
                        {products.map(p => (
                          <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                      </select>
                      <div className="flex items-center gap-2">
                        <input 
                          type="number"
                          min="1"
                          className="w-24 bg-white border border-zinc-200 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-orange-500/20 focus:outline-none font-bold"
                          value={itemToAdd.quantity}
                          onChange={(e) => setItemToAdd(prev => ({ ...prev, quantity: Math.max(1, parseInt(e.target.value) || 1) }))}
                        />
                        <Button size="sm" variant="primary" onClick={() => handleAddItem(order.id)}>Add to Order</Button>
                        <Button size="sm" variant="ghost" onClick={() => setAddingItemId(null)}>Cancel</Button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {order.items.map((item, i) => {
                  const product = products.find(p => p.id === item.productId);
                  return (
                    <div key={i} className="flex items-center justify-between p-4 bg-zinc-50 rounded-lg border border-zinc-100 group/item relative">
                      <span className="text-sm font-semibold text-zinc-800 truncate mr-2">{product?.name || 'Unknown'}</span>
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-bold text-orange-700">x{item.quantity}</span>
                        {!isVenueUser && (
                          <div className="flex items-center gap-2">
                            <button 
                              onClick={() => {
                                const newQty = Math.max(1, item.quantity - 1);
                                const newItems = order.items.map(it => it.productId === item.productId ? { ...it, quantity: newQty } : it);
                                updateDoc(doc(db, 'orders', order.id), { items: newItems, updatedAt: Timestamp.now() });
                              }}
                              className="p-1.5 bg-zinc-100 text-zinc-600 hover:bg-orange-100 hover:text-orange-700 rounded-md transition-all sm:group-hover/item:bg-orange-50"
                              title="Decrease quantity"
                            >
                              <ChevronDown size={16} />
                            </button>
                            <button 
                              onClick={() => {
                                const newQty = item.quantity + 1;
                                const newItems = order.items.map(it => it.productId === item.productId ? { ...it, quantity: newQty } : it);
                                updateDoc(doc(db, 'orders', order.id), { items: newItems, updatedAt: Timestamp.now() });
                              }}
                              className="p-1.5 bg-zinc-100 text-zinc-600 hover:bg-orange-100 hover:text-orange-700 rounded-md transition-all sm:group-hover/item:bg-orange-50"
                              title="Increase quantity"
                            >
                              <Plus size={16} />
                            </button>
                            <button 
                              onClick={() => handleRemoveItem(order.id, item.productId)}
                              className="p-1.5 bg-zinc-100 text-zinc-400 hover:bg-red-50 hover:text-red-500 rounded-md transition-all sm:group-hover/item:bg-red-50"
                              title="Remove item"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {!isVenueUser && (
                <div className="mt-6 flex flex-wrap gap-4 border-t border-zinc-100 pt-6">
                  {!order.notes && editingNoteId !== order.id && (
                    <button 
                      onClick={() => handleStartEditNote(order.id, '')}
                      className="flex items-center gap-2 px-3 py-1.5 bg-zinc-100 text-zinc-600 rounded-lg text-xs font-bold uppercase tracking-widest hover:bg-zinc-200 transition-all font-sans"
                    >
                      <Plus size={14} />
                      Add Order Notes
                    </button>
                  )}
                  <p className="text-[10px] text-zinc-400 uppercase font-bold self-center">Admin Controls Enabled</p>
                </div>
              )}

              {editingNoteId === order.id ? (
                <div className="mt-4 p-4 bg-white rounded-xl border-2 border-orange-200 shadow-sm">
                  <p className="text-[10px] font-bold text-orange-800 uppercase tracking-widest mb-2">Edit Notes</p>
                  <textarea 
                    autoFocus
                    value={tempNote}
                    onChange={(e) => setTempNote(e.target.value)}
                    className="w-full text-xs text-zinc-800 bg-zinc-50 rounded-lg p-3 border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-orange-500/20 mb-3 h-20 resize-none"
                    placeholder="Add special instructions for this order..."
                  />
                  <div className="flex gap-2 justify-end">
                    <Button size="sm" variant="ghost" className="text-[10px]" onClick={() => setEditingNoteId(null)}>Cancel</Button>
                    <Button size="sm" variant="primary" className="text-[10px] px-4" onClick={() => handleSaveNote(order.id)}>Save Note</Button>
                  </div>
                </div>
              ) : order.notes ? (
                <div className="mt-4 p-3 bg-orange-50/50 rounded-lg border border-orange-100/50 group/notes relative">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-[10px] font-bold text-orange-800 uppercase tracking-widest">Special Requests</p>
                    {!profile?.role || profile.role !== 'venue' ? (
                      <button 
                        onClick={() => handleStartEditNote(order.id, order.notes)}
                        className="p-1 text-zinc-400 hover:text-orange-600 transition-all"
                      >
                        <Pencil size={12} />
                      </button>
                    ) : null}
                  </div>
                  <p className="text-xs text-zinc-600 italic">"{order.notes}"</p>
                </div>
              ) : null}

              {order.statusHistory && order.statusHistory.length > 0 && (
                <div className="mt-6 pt-6 border-t border-zinc-50">
                  <div className="flex items-center gap-2 mb-4">
                    <History size={14} className="text-zinc-400" />
                    <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Order Timeline</span>
                  </div>
                  <div className="space-y-4 relative before:absolute before:left-[7px] before:top-2 before:bottom-2 before:w-px before:bg-zinc-100">
                    {order.statusHistory.map((h, i) => (
                      <div key={i} className="flex items-start gap-4 relative">
                        <div className={cn(
                          "w-4 h-4 rounded-full border-2 border-white z-10 mt-1 shadow-sm",
                          h.status === 'received' ? 'bg-emerald-500' : 
                          h.status === 'shipped' ? 'bg-blue-500' : 
                          h.status === 'cancelled' ? 'bg-red-500' : 'bg-orange-500'
                        )} />
                        <div className="flex flex-col">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-zinc-900 capitalize">{h.status}</span>
                            <span className="text-[10px] text-zinc-400">{format(h.timestamp.toDate(), 'MMM d, HH:mm')}</span>
                          </div>
                          <span className="text-[10px] text-zinc-500">Updated by {h.updatedBy}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </Card>
          );
        })}
        {activeOrders.length === 0 && (
          <div className="text-center py-20 bg-white border border-dashed border-zinc-200 rounded-2xl">
            <Truck className="mx-auto mb-4 text-zinc-200" size={48} />
            <p className="text-zinc-500">No orders found.</p>
          </div>
        )}
      </div>

      <AnimatePresence>
        {selectedOrderIds.length > 0 && (
          <motion.div 
            initial={{ y: 100 }}
            animate={{ y: 0 }}
            exit={{ y: 100 }}
            className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 bg-zinc-900 text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-6 border border-zinc-800"
          >
            <div className="flex items-center gap-2 border-r border-zinc-700 pr-6 mr-2">
              <span className="text-xl font-bold text-orange-500">{selectedOrderIds.length}</span>
              <span className="text-xs font-bold uppercase tracking-widest text-zinc-400">Orders Selected</span>
            </div>
            <div className="flex gap-2">
              <Button size="sm" className="bg-orange-600 hover:bg-orange-700 h-10 px-4 rounded-xl" onClick={() => handleBulkUpdateStatus('shipped')}>
                Mark Shipped
              </Button>
              <Button size="sm" variant="outline" className="border-zinc-700 text-white hover:bg-zinc-800 h-10 px-4 rounded-xl" onClick={() => handleBulkUpdateStatus('received')}>
                Mark Received
              </Button>
              <Button size="sm" variant="ghost" className="text-zinc-400 hover:text-white h-10 px-4 rounded-xl" onClick={() => setSelectedOrderIds([])}>
                Cancel
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showWhatsappForm && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-zinc-900/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-md overflow-hidden"
            >
              <div className="p-8 border-b border-zinc-100 flex items-center justify-between bg-zinc-50/50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-emerald-100 text-emerald-600 rounded-xl flex items-center justify-center">
                    <MessageSquare size={20} />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-zinc-900">Message Bakery</h3>
                    <p className="text-xs text-zinc-500">Send a WhatsApp message</p>
                  </div>
                </div>
                <button onClick={() => setShowWhatsappForm(false)} className="p-2 text-zinc-400 hover:text-zinc-600">
                  <Plus className="rotate-45" size={24} />
                </button>
              </div>

              <form onSubmit={handleWhatsappSubmit} className="p-8 space-y-6">
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest ml-1">Your Name</label>
                    <input 
                      required
                      type="text" 
                      value={whatsappName}
                      onChange={(e) => setWhatsappName(e.target.value)}
                      placeholder="Enter your name"
                      className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest ml-1">Venue</label>
                    <input 
                      required
                      type="text" 
                      value={whatsappVenue}
                      onChange={(e) => setWhatsappVenue(e.target.value)}
                      placeholder="Enter venue name"
                      className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest ml-1">Your Question</label>
                    <textarea 
                      required
                      rows={4}
                      value={whatsappQuestion}
                      onChange={(e) => setWhatsappQuestion(e.target.value)}
                      placeholder="How can we help you today?"
                      className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all resize-none"
                    />
                  </div>
                </div>

                <div className="pt-2">
                  <Button type="submit" className="w-full h-12 bg-emerald-600 hover:bg-emerald-700 rounded-xl gap-2">
                    <MessageSquare size={18} />
                    Open WhatsApp
                  </Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function VenuesView({ venues, products, inventory, orders, profile, selectedVenueId, setSelectedVenueId }: { 
  venues: Venue[], 
  products: Product[], 
  inventory: InventoryItem[], 
  orders: DistributionOrder[],
  profile: UserProfile | null,
  selectedVenueId: string | null,
  setSelectedVenueId: (id: string | null) => void
}) {
  const [showAddProductModal, setShowAddProductModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [localInventoryIds, setLocalInventoryIds] = useState<string[]>([]);
  const [hasChanges, setHasChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const initializedVenueId = useRef<string | null>(null);
  
  const [selectedMonth, setSelectedMonth] = useState(format(new Date(), 'yyyy-MM'));

  const [showAddVenueModal, setShowAddVenueModal] = useState(false);
  const [newVenue, setNewVenue] = useState<Partial<Venue>>({ type: 'retail' });

  const selectedVenue = useMemo(() => venues.find(v => v.id === selectedVenueId), [venues, selectedVenueId]);
  
  // Initialize local state when venue changes
  useEffect(() => {
    if (selectedVenueId && (initializedVenueId.current !== selectedVenueId || !hasChanges)) {
      const ids = inventory
        .filter(i => i.venueId === selectedVenueId)
        .map(i => i.productId);
      setLocalInventoryIds(ids);
      if (initializedVenueId.current !== selectedVenueId) {
        setHasChanges(false);
        initializedVenueId.current = selectedVenueId;
      }
    }
  }, [selectedVenueId, inventory, hasChanges]);

  const venueProducts = useMemo(() => {
    if (!selectedVenueId) return [];
    return products.filter(p => localInventoryIds.includes(p.id));
  }, [localInventoryIds, products, selectedVenueId]);

  const availableProducts = useMemo(() => {
    if (!selectedVenueId) return [];
    return products.filter(p => !localInventoryIds.includes(p.id));
  }, [localInventoryIds, products, selectedVenueId]);

  const handleToggleProduct = (productId: string, action: 'add' | 'remove') => {
    if (!selectedVenueId) return;
    setLocalInventoryIds(prev => {
      const next = action === 'add' 
        ? [...prev, productId] 
        : prev.filter(id => id !== productId);
      setHasChanges(true);
      return next;
    });
  };

  const handleDiscardChanges = () => {
    if (selectedVenueId) {
      const ids = inventory
        .filter(i => i.venueId === selectedVenueId)
        .map(i => i.productId);
      setLocalInventoryIds(ids);
      setHasChanges(false);
    }
  };

  const handleSaveMenu = async () => {
    if (!selectedVenueId) return;
    setIsSaving(true);
    
    const currentIds = inventory
      .filter(i => i.venueId === selectedVenueId)
      .map(i => i.productId);
      
    const toAdd = localInventoryIds.filter(id => !currentIds.includes(id));
    const toRemove = currentIds.filter(id => !localInventoryIds.includes(id));
    
    const batch = writeBatch(db);
    
    toAdd.forEach(productId => {
      const invId = `${selectedVenueId}_${productId}`;
      batch.set(doc(db, 'inventory', invId), {
        venueId: selectedVenueId,
        productId,
        quantity: 0,
        lastUpdated: Timestamp.now()
      });
    });
    
    toRemove.forEach(productId => {
      const invId = `${selectedVenueId}_${productId}`;
      batch.delete(doc(db, 'inventory', invId));
    });
    
    try {
      await batch.commit();
      setHasChanges(false);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, 'inventory/batch');
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;
    try {
      if (!editingProduct.id) {
        // Create new product
        const id = editingProduct.name.toLowerCase().replace(/\s+/g, '-');
        await setDoc(doc(db, 'products', id), {
          id,
          name: editingProduct.name,
          price: editingProduct.price,
          category: editingProduct.category ?? 'Other',
          description: editingProduct.description ?? '',
          parStock: editingProduct.parStock ?? 0,
          imageUrl: editingProduct.imageUrl ?? null,
          active: true
        });
        
        // Add to local inventory AND Firestore immediately for the current venue
        if (selectedVenueId) {
          handleToggleProduct(id, 'add');
          
          const batch = writeBatch(db);
          
          // Add to current venue
          batch.set(doc(db, 'inventory', `${selectedVenueId}_${id}`), {
            venueId: selectedVenueId,
            productId: id,
            quantity: 0,
            lastUpdated: Timestamp.now()
          });
          
          // Still add to central kitchen inventory immediately as it's the master stock
          batch.set(doc(db, 'inventory', `central-kitchen_${id}`), {
            venueId: 'central-kitchen',
            productId: id,
            quantity: editingProduct.parStock || 0,
            lastUpdated: Timestamp.now()
          });

          await batch.commit();
        }
      } else {
        // Update existing product
        await updateDoc(doc(db, 'products', editingProduct.id), {
          name: editingProduct.name,
          category: editingProduct.category ?? 'Other',
          price: editingProduct.price,
          parStock: editingProduct.parStock ?? 0,
          description: editingProduct.description ?? '',
          imageUrl: editingProduct.imageUrl ?? null
        });
      }
      setEditingProduct(null);
    } catch (error) {
      handleFirestoreError(error, editingProduct.id ? OperationType.UPDATE : OperationType.CREATE, `products/${editingProduct.id || 'new'}`);
    }
  };

  const handleCreateVenue = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newVenue.name || !newVenue.id) return;
    try {
      await setDoc(doc(db, 'venues', newVenue.id), {
        ...newVenue,
        active: true
      });
      setShowAddVenueModal(false);
      setNewVenue({ type: 'retail' });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `venues/${newVenue.id}`);
    }
  };

  if (selectedVenueId && selectedVenue) {
    return (
      <div className="space-y-8">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => setSelectedVenueId(null)} className="gap-2">
            <ChevronLeft size={16} />
            Back to Venues
          </Button>
          <div className="h-8 w-px bg-zinc-200" />
          <div>
            <h2 className="text-xl font-bold text-zinc-900">{selectedVenue.name}</h2>
            <p className="text-xs text-zinc-500">{selectedVenue.location}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 bg-orange-50 rounded flex items-center justify-center">
                    <Package size={12} className="text-orange-800" />
                  </div>
                  <h3 className="text-sm font-bold text-zinc-800 uppercase tracking-wider">Venue Menu</h3>
                </div>
                {hasChanges && (
                  <Badge variant="warning" className="animate-pulse">
                    Unsaved Changes
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-2 mr-2">
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    onClick={handleDiscardChanges}
                    disabled={!hasChanges || isSaving}
                    className={cn(
                      "transition-all",
                      hasChanges ? "text-amber-600 hover:text-amber-700 hover:bg-amber-50" : "text-zinc-300 opacity-50 cursor-not-allowed"
                    )}
                  >
                    Discard
                  </Button>
                  <Button 
                    size="sm" 
                    onClick={handleSaveMenu}
                    disabled={!hasChanges || isSaving}
                    className={cn(
                      "transition-all gap-2",
                      hasChanges 
                        ? "bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-200" 
                        : "bg-zinc-100 text-zinc-400 border-zinc-200 cursor-not-allowed"
                    )}
                  >
                    {isSaving ? (
                      <RotateCcw size={14} className="animate-spin" />
                    ) : (
                      <Check size={14} />
                    )}
                    Save Menu
                  </Button>
                </div>
                <div className="w-px h-6 bg-zinc-200 mx-2" />
                <Button size="sm" variant="outline" onClick={() => setEditingProduct({ id: '', name: '', price: 0, category: 'Venue Menu', parStock: 100 } as Product)} className="gap-2">
                  <Plus size={14} />
                  New Product
                </Button>
                <Button size="sm" onClick={() => setShowAddProductModal(true)} className="gap-2">
                  <Plus size={14} />
                  Add Existing
                </Button>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-zinc-100 overflow-hidden shadow-sm">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-zinc-100 bg-zinc-50/50">
                    <th className="px-6 py-3 text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Product</th>
                    <th className="px-6 py-3 text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Category</th>
                    <th className="px-6 py-3 text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Price</th>
                    <th className="px-6 py-3 text-right"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-50">
                  {venueProducts.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-12 text-center text-zinc-400 text-sm">
                        No products in this venue's menu.
                      </td>
                    </tr>
                  ) : venueProducts.map((product) => (
                    <tr key={product.id} className="group hover:bg-zinc-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-zinc-900">{product.name}</div>
                        {product.description && <div className="text-[10px] text-zinc-500 mt-0.5 line-clamp-1">{product.description}</div>}
                      </td>
                      <td className="px-6 py-4">
                        <Badge variant="secondary" className="text-[10px]">{product.category || 'Other'}</Badge>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-bold text-zinc-900">£{product.price?.toFixed(2)}</div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button 
                            onClick={() => setEditingProduct(product)}
                            className="p-2 text-zinc-300 hover:text-orange-600 transition-colors"
                            title="Edit Product"
                          >
                            <Settings size={16} />
                          </button>
                          <button 
                            onClick={() => handleToggleProduct(product.id, 'remove')}
                            className="p-2 text-zinc-300 hover:text-red-600 transition-colors"
                            title="Remove from Menu"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="space-y-6">
            <Card className="p-6">
              <h4 className="text-sm font-bold text-zinc-800 uppercase tracking-wider mb-4">Venue Details</h4>
              <div className="space-y-4">
                <div>
                  <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block mb-1">Type</label>
                  <div className="flex items-center gap-2">
                    {selectedVenue.type === 'kitchen' ? <Package size={14} className="text-orange-600" /> : <Store size={14} className="text-blue-600" />}
                    <span className="text-sm font-medium capitalize">{selectedVenue.type}</span>
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block mb-1">Location</label>
                  <p className="text-sm text-zinc-700">{selectedVenue.location || 'Not specified'}</p>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block mb-1">Venue ID</label>
                  <code className="text-[10px] bg-zinc-100 px-1.5 py-0.5 rounded text-zinc-600">{selectedVenue.id}</code>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 bg-orange-50 rounded flex items-center justify-center">
                    <History size={12} className="text-orange-800" />
                  </div>
                  <h3 className="text-sm font-bold text-zinc-800 uppercase tracking-wider">Order History</h3>
                </div>
                <select 
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="text-xs font-bold bg-zinc-50 border border-zinc-200 rounded-lg px-2 py-1 focus:outline-none"
                >
                  {Array.from({ length: 6 }, (_, i) => {
                    const d = addMonths(new Date(), -i);
                    return (
                      <option key={format(d, 'yyyy-MM')} value={format(d, 'yyyy-MM')}>
                        {format(d, 'MMM yyyy')}
                      </option>
                    );
                  })}
                </select>
              </div>

              <div className="space-y-4">
                {orders
                  .filter(o => o.venueId === selectedVenueId && format(o.createdAt?.toDate?.() || new Date(), 'yyyy-MM') === selectedMonth)
                  .sort((a, b) => (b.createdAt?.toDate?.()?.getTime() || 0) - (a.createdAt?.toDate?.()?.getTime() || 0))
                  .map(order => (
                    <div key={order.id} className="p-4 bg-zinc-50 rounded-xl border border-zinc-100 flex items-center justify-between group">
                      <div className="flex items-center gap-4">
                        <div className={cn(
                          "w-8 h-8 rounded-lg flex items-center justify-center",
                          order.status === 'received' ? 'bg-emerald-50 text-emerald-600' : 'bg-orange-50 text-orange-600'
                        )}>
                          <Truck size={14} />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold">Order #{order.id.slice(0, 6)}</span>
                            <Badge variant={order.status === 'received' ? 'success' : order.status === 'shipped' ? 'info' : 'warning'} className="text-[10px] py-0 px-1.5 h-4">
                              {order.status}
                            </Badge>
                          </div>
                          <p className="text-[10px] text-zinc-500">{format(order.createdAt?.toDate?.() || new Date(), 'MMM d, h:mm a')}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs font-bold text-zinc-900">{order.items.reduce((sum, i) => sum + i.quantity, 0)} Items</div>
                      </div>
                    </div>
                  ))}
                {orders.filter(o => o.venueId === selectedVenueId && format(o.createdAt?.toDate?.() || new Date(), 'yyyy-MM') === selectedMonth).length === 0 && (
                  <div className="py-8 text-center bg-zinc-50/50 rounded-xl border border-dashed border-zinc-100 text-zinc-400 text-xs">
                    No orders for this month.
                  </div>
                )}
              </div>
            </Card>
          </div>
        </div>

        {/* Add Product to Menu Modal */}
        <AnimatePresence>
          {showAddProductModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-900/40 backdrop-blur-sm">
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
              >
                <div className="p-6 border-b border-zinc-100 flex items-center justify-between">
                  <h3 className="text-xl font-semibold">Add to {selectedVenue.name} Menu</h3>
                  <Button variant="ghost" size="sm" onClick={() => setShowAddProductModal(false)}>×</Button>
                </div>
                <div className="p-6 max-h-[400px] overflow-y-auto space-y-2">
                  {availableProducts.length === 0 ? (
                    <p className="text-center text-zinc-500 py-8 text-sm">All products are already in this menu.</p>
                  ) : availableProducts.map(product => (
                    <div key={product.id} className="flex items-center justify-between p-3 bg-zinc-50 rounded-xl hover:bg-zinc-100 transition-colors">
                      <div>
                        <div className="text-sm font-bold text-zinc-900">{product.name}</div>
                        <div className="text-[10px] text-zinc-500">{product.category}</div>
                      </div>
                      <Button size="sm" variant="outline" onClick={() => handleToggleProduct(product.id, 'add')} className="h-8">
                        Add
                      </Button>
                    </div>
                  ))}
                </div>
                <div className="p-6 bg-zinc-50 border-t border-zinc-100 flex gap-3">
                  <Button variant="outline" className="flex-1" onClick={() => setShowAddProductModal(false)}>Close</Button>
                  {hasChanges && (
                    <Button 
                      variant="primary" 
                      className="flex-1 gap-2 bg-emerald-600 hover:bg-emerald-700" 
                      onClick={async () => {
                        await handleSaveMenu();
                        setShowAddProductModal(false);
                      }}
                      disabled={isSaving}
                    >
                      {isSaving ? <RotateCcw size={14} className="animate-spin" /> : <Check size={14} />}
                      Save & Close
                    </Button>
                  )}
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Edit Product Modal */}
        <AnimatePresence>
          {editingProduct && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-900/40 backdrop-blur-sm">
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
              >
                <div className="p-6 border-b border-zinc-100 flex items-center justify-between">
                  <h3 className="text-xl font-semibold">Edit Product</h3>
                  <Button variant="ghost" size="sm" onClick={() => setEditingProduct(null)}>×</Button>
                </div>
                <form onSubmit={handleUpdateProduct} className="p-6 space-y-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold uppercase tracking-wider text-zinc-500">Name</label>
                    <input 
                      type="text" 
                      required
                      value={editingProduct.name} 
                      onChange={(e) => setEditingProduct(prev => prev ? { ...prev, name: e.target.value } : null)}
                      className="w-full bg-zinc-50 border border-zinc-200 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-bold uppercase tracking-wider text-zinc-500">Price (£)</label>
                      <input 
                        type="number" 
                        step="0.01"
                        required
                        value={editingProduct.price} 
                        onChange={(e) => setEditingProduct(prev => prev ? { ...prev, price: parseFloat(e.target.value) } : null)}
                        className="w-full bg-zinc-50 border border-zinc-200 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold uppercase tracking-wider text-zinc-500">Par Stock</label>
                      <input 
                        type="number" 
                        required
                        value={editingProduct.parStock} 
                        onChange={(e) => setEditingProduct(prev => prev ? { ...prev, parStock: parseInt(e.target.value) } : null)}
                        className="w-full bg-zinc-50 border border-zinc-200 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold uppercase tracking-wider text-zinc-500">Category</label>
                    <select 
                      value={editingProduct.category} 
                      onChange={(e) => setEditingProduct(prev => prev ? { ...prev, category: e.target.value } : null)}
                      className="w-full bg-zinc-50 border border-zinc-200 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                    >
                      <option value="Venue Menu">Venue Menu</option>
                      <option value="Children’s">Children’s</option>
                      <option value="Afternoon Tea">Afternoon Tea</option>
                      <option value="Vegan & Gluten Free">Vegan & Gluten Free</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold uppercase tracking-wider text-zinc-500">Description</label>
                    <textarea 
                      value={editingProduct.description} 
                      onChange={(e) => setEditingProduct(prev => prev ? { ...prev, description: e.target.value } : null)}
                      className="w-full bg-zinc-50 border border-zinc-200 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 min-h-[80px]"
                    />
                  </div>
                  <div className="pt-4 flex gap-3">
                    <Button type="button" variant="outline" className="flex-1" onClick={() => setEditingProduct(null)}>Cancel</Button>
                    <Button type="submit" variant="primary" className="flex-1">Save Changes</Button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-zinc-500 uppercase tracking-widest text-xs">Distribution Network</h3>
        <Button size="sm" onClick={() => setShowAddVenueModal(true)} className="gap-2">
          <Plus size={14} />
          Add New Venue
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {venues.map((venue) => (
          <Card 
            key={venue.id} 
            className="p-6 group hover:border-orange-200 transition-all cursor-pointer hover:shadow-md"
            onClick={() => setSelectedVenueId(venue.id)}
          >
            <div className="flex items-start justify-between mb-4">
              <div className="p-3 bg-zinc-50 rounded-xl group-hover:bg-orange-50 transition-colors">
                {venue.type === 'kitchen' ? <Package className="text-orange-600" /> : <Store className="text-blue-600" />}
              </div>
              <Badge variant={venue.type === 'kitchen' ? 'warning' : 'info'}>{venue.type}</Badge>
            </div>
            <h4 className="text-lg font-bold mb-1">{venue.name}</h4>
            <p className="text-sm text-zinc-500 mb-4 flex items-center gap-1">
              <AlertCircle size={14} />
              {venue.location || 'No location set'}
            </p>
            <div className="pt-4 border-t border-zinc-100 flex items-center justify-between">
              <span className="text-xs font-medium text-zinc-400">ID: {venue.id}</span>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <ChevronRight size={16} />
              </Button>
            </div>
          </Card>
        ))}
      </div>

      {/* Add Venue Modal */}
      <AnimatePresence>
        {showAddVenueModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-900/40 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
            >
              <div className="p-6 border-b border-zinc-100 flex items-center justify-between">
                <h3 className="text-xl font-semibold">Add New Venue</h3>
                <Button variant="ghost" size="sm" onClick={() => setShowAddVenueModal(false)}>×</Button>
              </div>
              <form onSubmit={handleCreateVenue} className="p-6 space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold uppercase tracking-wider text-zinc-500">Venue Name</label>
                  <input 
                    type="text" 
                    required
                    placeholder="e.g. The Riverside Cafe"
                    value={newVenue.name || ''} 
                    onChange={(e) => {
                      const name = e.target.value;
                      const id = name.toLowerCase().replace(/\s+/g, '-');
                      setNewVenue(prev => ({ ...prev, name, id }));
                    }}
                    className="w-full bg-zinc-50 border border-zinc-200 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold uppercase tracking-wider text-zinc-500">Venue ID (URL Friendly)</label>
                  <input 
                    type="text" 
                    required
                    value={newVenue.id || ''} 
                    onChange={(e) => setNewVenue(prev => ({ ...prev, id: e.target.value }))}
                    className="w-full bg-zinc-50 border border-zinc-200 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold uppercase tracking-wider text-zinc-500">Type</label>
                  <select 
                    value={newVenue.type} 
                    onChange={(e) => setNewVenue(prev => ({ ...prev, type: e.target.value as any }))}
                    className="w-full bg-zinc-50 border border-zinc-200 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                  >
                    <option value="retail">Retail (Cafe/Shop)</option>
                    <option value="kitchen">Kitchen (Production)</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold uppercase tracking-wider text-zinc-500">Location</label>
                  <input 
                    type="text" 
                    value={newVenue.location || ''} 
                    onChange={(e) => setNewVenue(prev => ({ ...prev, location: e.target.value }))}
                    className="w-full bg-zinc-50 border border-zinc-200 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                  />
                </div>
                <div className="pt-4 flex gap-3">
                  <Button type="button" variant="outline" className="flex-1" onClick={() => setShowAddVenueModal(false)}>Cancel</Button>
                  <Button type="submit" variant="primary" className="flex-1">Create Venue</Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

