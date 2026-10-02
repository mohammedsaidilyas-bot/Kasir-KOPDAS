import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import {
  collection,
  doc,
  onSnapshot,
  setDoc,
  deleteDoc,
  writeBatch,
  getDoc,
} from 'firebase/firestore';
import { db } from '../firebase';
import {
  Product,
  CartItem,
  SaleTransaction,
  StockMovement,
  StoreSettings,
  UserRole,
  PriceType,
  PaymentMethod,
  StockReason,
  CashierUser,
} from '../types';
import {
  INITIAL_CASHIERS,
  INITIAL_PRODUCTS,
  INITIAL_SETTINGS,
  INITIAL_STOCK_MOVEMENTS,
  INITIAL_TRANSACTIONS,
} from '../data/initialData';

interface PosContextType {
  // Authentication & Access
  isAuthenticated: boolean;
  setIsAuthenticated: (auth: boolean) => void;
  logout: (targetRole?: UserRole) => void;
  initialRoleForLogin: UserRole;
  currentRole: UserRole;
  currentUserName: string;
  currentCashier: CashierUser | null;
  cashiers: CashierUser[];
  addCashier: (name: string, pin: string) => CashierUser;
  updateCashier: (id: string, name: string, pin: string, isActive: boolean) => void;
  deleteCashier: (id: string) => void;
  loginCashier: (cashierId: string, pin: string) => boolean;
  isPinModalOpen: boolean;
  pinModalMode: 'switch_role' | 'verify_action';
  pendingAction: (() => void) | null;
  targetRoleForModal: UserRole | null;
  openPinModal: (role?: UserRole, onAuthorized?: () => void) => void;
  closePinModal: () => void;
  verifyPin: (role: UserRole, pin: string) => boolean;
  switchRole: (role: UserRole, pin: string) => boolean;
  loginAsRole: (
    role: UserRole,
    targetTab?: 'pos' | 'history' | 'inventory' | 'products' | 'reports' | 'settings'
  ) => void;

  // Active view tab
  activeTab: 'pos' | 'history' | 'inventory' | 'products' | 'reports' | 'settings';
  setActiveTab: (tab: 'pos' | 'history' | 'inventory' | 'products' | 'reports' | 'settings') => void;
  canAccessTab: (tab: string) => boolean;

  // Products
  products: Product[];
  addProduct: (product: Omit<Product, 'id'>) => Promise<void>;
  updateProduct: (product: Product) => Promise<void>;
  deleteProduct: (productId: string) => Promise<void>;

  // Cart & POS
  cart: CartItem[];
  customerType: PriceType;
  setCustomerType: (type: PriceType) => void;
  customerName: string;
  setCustomerName: (name: string) => void;
  discount: number;
  setDiscount: (discount: number) => void;
  addToCart: (product: Product, forcedType?: PriceType, customQty?: number) => void;
  updateCartItemQty: (cartItemId: string, qty: number) => void;
  toggleItemPriceType: (cartItemId: string) => void;
  setItemPriceType: (cartItemId: string, type: PriceType) => void;
  removeFromCart: (cartItemId: string) => void;
  clearCart: () => void;
  cartSubtotal: number;
  cartGrandTotal: number;
  cartTotalQty: number;
  cartWholesaleSavings: number;

  // Transactions
  transactions: SaleTransaction[];
  completeTransaction: (
    paymentMethod: PaymentMethod,
    cashReceived?: number,
    changeDue?: number,
    referenceNo?: string
  ) => Promise<any>;
  deleteTransaction: (id: string) => Promise<void>;
  latestTransaction: SaleTransaction | null;
  setLatestTransaction: (trx: SaleTransaction | null) => void;

  // Stock Management (In & Out)
  stockMovements: StockMovement[];
  recordStockIn: (
    productId: string,
    qty: number,
    costPrice?: number,
    supplier?: string,
    notes?: string
  ) => Promise<void>;
  recordStockOut: (
    productId: string,
    qty: number,
    reason: StockReason,
    notes?: string
  ) => Promise<void>;

  // Settings
  settings: StoreSettings;
  updateSettings: (newSettings: Partial<StoreSettings>) => Promise<void>;
  resetAllData: () => Promise<void>;

  // Cloud Sync
  forceRefreshFromServer: () => Promise<boolean>;
}

const PosContext = createContext<PosContextType | undefined>(undefined);

export const PosProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Session authentication state (starts false on initial app load as requested)
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return sessionStorage.getItem('kasirku_authenticated') === 'true';
  });

  // Multiple Cashiers state
  const [cashiers, setCashiers] = useState<CashierUser[]>(() => {
    const saved = localStorage.getItem('kasirku_cashiers');
    return saved ? JSON.parse(saved) : INITIAL_CASHIERS;
  });

  const [currentCashier, setCurrentCashier] = useState<CashierUser | null>(() => {
    const savedId = localStorage.getItem('kasirku_current_cashier_id');
    const list = localStorage.getItem('kasirku_cashiers')
      ? JSON.parse(localStorage.getItem('kasirku_cashiers')!)
      : INITIAL_CASHIERS;
    return list.find((c: CashierUser) => c.id === savedId) || list[0] || null;
  });

  // Load initial states from LocalStorage or fallbacks
  const [currentRole, setCurrentRole] = useState<UserRole>(() => {
    const saved = localStorage.getItem('kasirku_role');
    return (saved as UserRole) || 'kasir';
  });

  const [activeTab, setActiveTabInternal] = useState<'pos' | 'history' | 'inventory' | 'products' | 'reports' | 'settings'>('pos');

  const [settings, setSettings] = useState<StoreSettings>(() => {
    const saved = localStorage.getItem('kasirku_settings');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (!parsed.storeName || parsed.storeName === 'Toko Berkah Bersama') {
          parsed.storeName = 'KOPDES SENDANG DAJAH';
          parsed.address = 'Jl. Temor Leke Desa Sendang Dajah Kec. Labang Bangkalan';
          parsed.adminWaPhone = '085704800313';
        }
        return parsed;
      } catch (e) {
        // Fallback
      }
    }
    return INITIAL_SETTINGS;
  });

  const [products, setProducts] = useState<Product[]>(() => {
    const saved = localStorage.getItem('kasirku_products');
    return saved ? JSON.parse(saved) : INITIAL_PRODUCTS;
  });

  const [stockMovements, setStockMovements] = useState<StockMovement[]>(() => {
    const saved = localStorage.getItem('kasirku_movements');
    return saved ? JSON.parse(saved) : INITIAL_STOCK_MOVEMENTS;
  });

  const [transactions, setTransactions] = useState<SaleTransaction[]>(() => {
    const saved = localStorage.getItem('kasirku_transactions');
    return saved ? JSON.parse(saved) : INITIAL_TRANSACTIONS;
  });

  // Cart state
  const [cart, setCart] = useState<CartItem[]>([]);
  const [customerType, setCustomerTypeState] = useState<PriceType>('ecer');
  const [customerName, setCustomerName] = useState<string>('');
  const [discount, setDiscount] = useState<number>(0);
  const [latestTransaction, setLatestTransaction] = useState<SaleTransaction | null>(null);

  // PIN modal state
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);
  const [pinModalMode, setPinModalMode] = useState<'switch_role' | 'verify_action'>('switch_role');
  const [targetRoleForModal, setTargetRoleForModal] = useState<UserRole | null>(null);
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);

  // Sync to Storage
  const [hasLoadedFromServer, setHasLoadedFromServer] = useState(false);
  const isUpdatingFromServerRef = useRef<boolean>(false);
  const lastMutationTimeRef = useRef<number>(0);

  const getApiUrl = (path: string) => {
    // If running in Cloud Run or Vercel web domain directly in browser
    const isCloudWebDomain =
      window.location.hostname.endsWith('run.app') ||
      window.location.hostname.endsWith('vercel.app');

    // If running in an APK, Capacitor WebView, file://, or localhost inside APK,
    // we MUST target the absolute live cloud server endpoint!
    if (!isCloudWebDomain) {
      return `https://ais-pre-5ifxiuva2vp7wnisdevtp3-459294540144.asia-southeast1.run.app${path}`;
    }
    return path;
  };

  const forceRefreshFromServer = async (): Promise<boolean> => {
    return true;
  };

  useEffect(() => {
    sessionStorage.setItem('kasirku_authenticated', isAuthenticated ? 'true' : 'false');
  }, [isAuthenticated]);

  useEffect(() => {
    if (currentCashier) {
      localStorage.setItem('kasirku_current_cashier_id', currentCashier.id);
    }
  }, [currentCashier]);

  useEffect(() => {
    localStorage.setItem('kasirku_role', currentRole);
  }, [currentRole]);

  // 1. Initial Load & Real-time Listeners from Firestore
  useEffect(() => {
    // 1. Settings Listener
    const unsubSettings = onSnapshot(doc(db, 'settings', 'config'), async (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data() as StoreSettings;
        setSettings(data);
        localStorage.setItem('kasirku_settings', JSON.stringify(data));
      } else {
        // Very first boot of the entire app: Seed everything!
        try {
          const batch = writeBatch(db);
          
          // Seed settings
          batch.set(doc(db, 'settings', 'config'), INITIAL_SETTINGS);

          // Seed products
          INITIAL_PRODUCTS.forEach((p) => {
            batch.set(doc(db, 'products', p.id), p);
          });

          // Seed stock movements
          INITIAL_STOCK_MOVEMENTS.forEach((m) => {
            batch.set(doc(db, 'stockMovements', m.id), m);
          });

          // Seed transactions
          INITIAL_TRANSACTIONS.forEach((t) => {
            batch.set(doc(db, 'transactions', t.id), t);
          });

          // Seed cashiers
          INITIAL_CASHIERS.forEach((c) => {
            batch.set(doc(db, 'cashiers', c.id), c);
          });

          await batch.commit();
        } catch (e) {
          console.error("Failed to seed initial database:", e);
        }
      }
    }, (err) => console.error("Firestore settings error:", err));

    // 2. Products Listener
    const unsubProducts = onSnapshot(collection(db, 'products'), (snapshot) => {
      const items: Product[] = [];
      snapshot.forEach((doc) => {
        items.push(doc.data() as Product);
      });
      setProducts(items);
      localStorage.setItem('kasirku_products', JSON.stringify(items));
    }, (err) => console.error("Firestore products error:", err));

    // 3. Stock Movements Listener
    const unsubMovements = onSnapshot(collection(db, 'stockMovements'), (snapshot) => {
      const items: StockMovement[] = [];
      snapshot.forEach((doc) => {
        items.push(doc.data() as StockMovement);
      });
      items.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      setStockMovements(items);
      localStorage.setItem('kasirku_movements', JSON.stringify(items));
    }, (err) => console.error("Firestore movements error:", err));

    // 4. Transactions Listener
    const unsubTransactions = onSnapshot(collection(db, 'transactions'), (snapshot) => {
      const items: SaleTransaction[] = [];
      snapshot.forEach((doc) => {
        items.push(doc.data() as SaleTransaction);
      });
      items.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      setTransactions(items);
      localStorage.setItem('kasirku_transactions', JSON.stringify(items));
    }, (err) => console.error("Firestore transactions error:", err));

    // 5. Cashiers Listener
    const unsubCashiers = onSnapshot(collection(db, 'cashiers'), (snapshot) => {
      const items: CashierUser[] = [];
      snapshot.forEach((doc) => {
        items.push(doc.data() as CashierUser);
      });
      setCashiers(items);
      localStorage.setItem('kasirku_cashiers', JSON.stringify(items));
    }, (err) => console.error("Firestore cashiers error:", err));

    setHasLoadedFromServer(true);

    return () => {
      unsubSettings();
      unsubProducts();
      unsubMovements();
      unsubTransactions();
      unsubCashiers();
    };
  }, []);

  // 3. Central explicit function to save settings or other states to Firestore
  const saveToServer = async (overrides?: {
    settings?: StoreSettings;
    products?: Product[];
    stockMovements?: StockMovement[];
    transactions?: SaleTransaction[];
    cashiers?: CashierUser[];
  }) => {
    try {
      if (overrides?.settings) {
        await setDoc(doc(db, 'settings', 'config'), overrides.settings);
      }
    } catch (err) {
      console.error("Firestore saveToServer error:", err);
    }
  };

  // Cashier management
  const addCashier = (name: string, pin: string): CashierUser => {
    const newCashier: CashierUser = {
      id: `csh-${Date.now()}`,
      name: name.trim(),
      pin: pin.trim() || '1234',
      role: 'kasir',
      isActive: true,
      createdAt: new Date().toISOString(),
    };
    setDoc(doc(db, 'cashiers', newCashier.id), newCashier).catch((err) =>
      console.error("Firestore addCashier error:", err)
    );
    return newCashier;
  };

  const updateCashier = (id: string, name: string, pin: string, isActive: boolean) => {
    const cashier = cashiers.find((c) => c.id === id);
    if (!cashier) return;
    const updated: CashierUser = {
      ...cashier,
      name: name.trim(),
      pin: pin.trim(),
      isActive,
    };
    setDoc(doc(db, 'cashiers', id), updated).catch((err) =>
      console.error("Firestore updateCashier error:", err)
    );
    if (currentCashier?.id === id) {
      setCurrentCashier(updated);
    }
  };

  const deleteCashier = (id: string) => {
    deleteDoc(doc(db, 'cashiers', id)).catch((err) =>
      console.error("Firestore deleteCashier error:", err)
    );
    if (currentCashier?.id === id) {
      const remaining = cashiers.filter((c) => c.id !== id);
      setCurrentCashier(remaining[0] || null);
    }
  };

  const loginCashier = (cashierId: string, pin: string): boolean => {
    const target = cashiers.find((c) => c.id === cashierId && c.isActive);
    if (!target) return false;

    // Check personal PIN or master cashier PIN
    if (target.pin === pin || settings.pinKasir === pin) {
      setCurrentCashier(target);
      setCurrentRole('kasir');
      setIsAuthenticated(true);
      setActiveTabInternal('pos');
      setIsPinModalOpen(false);
      return true;
    }
    return false;
  };

  const [initialRoleForLogin, setInitialRoleForLogin] = useState<UserRole>('kasir');

  const logout = (targetRole?: UserRole) => {
    setIsAuthenticated(false);
    sessionStorage.removeItem('kasirku_authenticated');
    if (targetRole) {
      setInitialRoleForLogin(targetRole);
    }
  };

  // Role permissions:
  // - kasir: 'pos', 'history'
  // - pengelola: 'pos', 'history', 'inventory', 'products', 'reports'
  // - admin: all tabs
  const canAccessTab = (tab: string): boolean => {
    if (currentRole === 'admin') return true;
    if (currentRole === 'pengelola') {
      return ['pos', 'history', 'inventory', 'products', 'reports'].includes(tab);
    }
    // kasir:
    return ['pos', 'history'].includes(tab);
  };

  const setActiveTab = (tab: 'pos' | 'history' | 'inventory' | 'products' | 'reports' | 'settings') => {
    if (!canAccessTab(tab)) {
      // Require PIN of required role
      const requiredRole: UserRole = tab === 'settings' ? 'admin' : 'pengelola';
      openPinModal(requiredRole, () => {
        setActiveTabInternal(tab);
      });
      return;
    }
    setActiveTabInternal(tab);
  };

  const currentUserName =
    currentRole === 'kasir'
      ? currentCashier?.name || 'Kasir Utama'
      : currentRole === 'pengelola'
      ? 'Pengelola Gudang'
      : 'Administrator Toko';

  // PIN Verification
  const verifyPin = (role: UserRole, pin: string): boolean => {
    if (role === 'kasir') {
      // Check either specific cashier PIN or master cashier PIN
      return (
        pin === settings.pinKasir ||
        cashiers.some((c) => c.isActive && c.pin === pin)
      );
    }
    if (role === 'pengelola') return pin === settings.pinPengelola;
    if (role === 'admin') return pin === settings.pinAdmin;
    return false;
  };

  const getDefaultTabForRole = (role: UserRole): 'pos' | 'history' | 'inventory' | 'products' | 'reports' | 'settings' => {
    switch (role) {
      case 'kasir':
        return 'pos';
      case 'pengelola':
        return 'inventory';
      case 'admin':
        return 'reports';
      default:
        return 'pos';
    }
  };

  const loginAsRole = (
    role: UserRole,
    targetTab?: 'pos' | 'history' | 'inventory' | 'products' | 'reports' | 'settings'
  ) => {
    setCurrentRole(role);
    setIsAuthenticated(true);
    setIsPinModalOpen(false);
    if (pendingAction) {
      pendingAction();
      setPendingAction(null);
    } else {
      const destination = targetTab || getDefaultTabForRole(role);
      setActiveTabInternal(destination);
    }
  };

  const switchRole = (role: UserRole, pin: string): boolean => {
    if (verifyPin(role, pin)) {
      loginAsRole(role);
      return true;
    }
    return false;
  };

  const openPinModal = (role?: UserRole, onAuthorized?: () => void) => {
    setTargetRoleForModal(role || null);
    if (onAuthorized) {
      setPinModalMode('verify_action');
      setPendingAction(() => onAuthorized);
    } else {
      setPinModalMode('switch_role');
      setPendingAction(null);
    }
    setIsPinModalOpen(true);
  };

  const closePinModal = () => {
    setIsPinModalOpen(false);
    setPendingAction(null);
  };

  // Cart operations
  const setCustomerType = (type: PriceType) => {
    setCustomerTypeState(type);
    // Recalculate cart items pricing based on selected mode
    setCart((prevCart) =>
      prevCart.map((item) => {
        if (item.priceType === 'dus') return item;
        const minQty = item.product.minWholesaleQty || 6;
        const effectiveType: PriceType =
          type === 'grosir' || item.qty >= minQty ? 'grosir' : 'ecer';
        const appliedPrice =
          effectiveType === 'grosir' ? item.product.wholesalePrice : item.product.retailPrice;
        return {
          ...item,
          priceType: effectiveType,
          appliedPrice,
          subtotal: appliedPrice * item.qty,
        };
      })
    );
  };

  const addToCart = (product: Product, forcedType?: PriceType, customQty?: number) => {
    setCart((prev) => {
      const isDus = forcedType === 'dus';
      const targetCartId = isDus ? `${product.id}-dus` : `${product.id}-unit`;
      const existingIndex = prev.findIndex(
        (item) =>
          item.cartItemId === targetCartId ||
          (isDus
            ? item.priceType === 'dus' && item.product.id === product.id
            : item.priceType !== 'dus' && item.product.id === product.id)
      );

      if (existingIndex > -1) {
        const item = prev[existingIndex];
        const addedQty = customQty || 1;
        const newQty = item.qty + addedQty;

        if (item.priceType === 'dus') {
          const appliedPrice = product.boxPrice;
          const updated = [...prev];
          updated[existingIndex] = {
            ...item,
            qty: newQty,
            appliedPrice,
            subtotal: appliedPrice * newQty,
          };
          return updated;
        } else {
          // Unit item (ecer / grosir)
          const minQty = product.minWholesaleQty || 6;
          // AUTOMATIC GROSIR: if qty >= minQty, automatically change to grosir!
          const effectiveType: PriceType =
            forcedType === 'grosir' || customerType === 'grosir' || newQty >= minQty
              ? 'grosir'
              : 'ecer';
          const appliedPrice =
            effectiveType === 'grosir' ? product.wholesalePrice : product.retailPrice;
          const updated = [...prev];
          updated[existingIndex] = {
            ...item,
            qty: newQty,
            priceType: effectiveType,
            appliedPrice,
            subtotal: appliedPrice * newQty,
          };
          return updated;
        }
      } else {
        // New cart entry
        if (isDus) {
          const qty = customQty || 1;
          const appliedPrice = product.boxPrice;
          return [
            ...prev,
            {
              cartItemId: targetCartId,
              product,
              qty,
              priceType: 'dus',
              appliedPrice,
              subtotal: appliedPrice * qty,
              unitLabel: `${product.boxUnit || 'dus'} (${product.boxQty} ${product.unit})`,
            },
          ];
        } else {
          const minQty = product.minWholesaleQty || 6;
          let initialQty = customQty || 1;
          if (forcedType === 'grosir' && initialQty < minQty) {
            initialQty = minQty; // If clicked +6 Grosir, start with at least 6
          }
          const effectiveType: PriceType =
            forcedType === 'grosir' || customerType === 'grosir' || initialQty >= minQty
              ? 'grosir'
              : 'ecer';
          const appliedPrice =
            effectiveType === 'grosir' ? product.wholesalePrice : product.retailPrice;
          return [
            ...prev,
            {
              cartItemId: targetCartId,
              product,
              qty: initialQty,
              priceType: effectiveType,
              appliedPrice,
              subtotal: appliedPrice * initialQty,
              unitLabel: product.unit,
            },
          ];
        }
      }
    });
  };

  const updateCartItemQty = (cartItemId: string, qty: number) => {
    if (qty <= 0) {
      removeFromCart(cartItemId);
      return;
    }
    setCart((prev) =>
      prev.map((item) => {
        if (item.cartItemId !== cartItemId && item.product.id !== cartItemId) return item;
        if (item.priceType === 'dus') {
          return {
            ...item,
            qty,
            subtotal: item.appliedPrice * qty,
          };
        } else {
          const minQty = item.product.minWholesaleQty || 6;
          // AUTOMATIC GROSIR: If customer buys 6 or more, price automatically changes to grosir!
          const effectiveType: PriceType =
            customerType === 'grosir' || qty >= minQty ? 'grosir' : 'ecer';
          const appliedPrice =
            effectiveType === 'grosir' ? item.product.wholesalePrice : item.product.retailPrice;
          return {
            ...item,
            qty,
            priceType: effectiveType,
            appliedPrice,
            subtotal: appliedPrice * qty,
          };
        }
      })
    );
  };

  const toggleItemPriceType = (cartItemId: string) => {
    setCart((prev) =>
      prev.map((item) => {
        if (item.cartItemId !== cartItemId && item.product.id !== cartItemId) return item;
        const newType: PriceType = item.priceType === 'ecer' ? 'grosir' : 'ecer';
        const appliedPrice =
          newType === 'grosir' ? item.product.wholesalePrice : item.product.retailPrice;
        return {
          ...item,
          priceType: newType,
          appliedPrice,
          subtotal: appliedPrice * item.qty,
        };
      })
    );
  };

  const setItemPriceType = (cartItemId: string, type: PriceType) => {
    setCart((prev) =>
      prev.map((item) => {
        if (item.cartItemId !== cartItemId && item.product.id !== cartItemId) return item;
        if (type === 'dus') {
          const appliedPrice = item.product.boxPrice;
          return {
            ...item,
            cartItemId: `${item.product.id}-dus`,
            priceType: 'dus',
            appliedPrice,
            unitLabel: `${item.product.boxUnit || 'dus'} (${item.product.boxQty} ${item.product.unit})`,
            subtotal: appliedPrice * item.qty,
          };
        } else if (type === 'grosir') {
          const minQty = item.product.minWholesaleQty || 6;
          const newQty = item.qty < minQty ? minQty : item.qty;
          const appliedPrice = item.product.wholesalePrice;
          return {
            ...item,
            cartItemId: `${item.product.id}-unit`,
            qty: newQty,
            priceType: 'grosir',
            appliedPrice,
            unitLabel: item.product.unit,
            subtotal: appliedPrice * newQty,
          };
        } else {
          // 'ecer'
          const appliedPrice = item.product.retailPrice;
          return {
            ...item,
            cartItemId: `${item.product.id}-unit`,
            priceType: 'ecer',
            appliedPrice,
            unitLabel: item.product.unit,
            subtotal: appliedPrice * item.qty,
          };
        }
      })
    );
  };

  const removeFromCart = (cartItemId: string) => {
    setCart((prev) =>
      prev.filter(
        (item) => item.cartItemId !== cartItemId && item.product.id !== cartItemId
      )
    );
  };

  const clearCart = () => {
    setCart([]);
    setCustomerName('');
    setDiscount(0);
  };

  const cartSubtotal = cart.reduce((sum, item) => sum + item.subtotal, 0);
  const cartGrandTotal = Math.max(0, cartSubtotal - discount);
  const cartTotalQty = cart.reduce((sum, item) => sum + item.qty, 0);
  const cartWholesaleSavings = cart.reduce((sum, item) => {
    if (item.priceType === 'grosir') {
      const diff = item.product.retailPrice - item.product.wholesalePrice;
      return sum + Math.max(0, diff * item.qty);
    } else if (item.priceType === 'dus') {
      const singleEquivalentTotal = item.product.retailPrice * (item.product.boxQty || 1);
      const diff = singleEquivalentTotal - item.product.boxPrice;
      return sum + Math.max(0, diff * item.qty);
    }
    return sum;
  }, 0);

  // Complete Sale & Auto deduct stock & Auto log stock movement
  const completeTransaction = async (
    paymentMethod: PaymentMethod,
    cashReceived?: number,
    changeDue?: number,
    referenceNo?: string
  ): Promise<any> => {
    if (cart.length === 0) return null;

    const trxId = `TRX-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(
      1000 + Math.random() * 9000
    )}`;

    const newTrx: SaleTransaction = {
      id: trxId,
      timestamp: new Date().toISOString(),
      cashierName: currentUserName,
      cashierRole: currentRole,
      customerType,
      customerName: customerName.trim() || undefined,
      items: [...cart],
      totalQty: cartTotalQty,
      subtotal: cartSubtotal,
      discount,
      grandTotal: cartGrandTotal,
      paymentMethod,
      cashReceived,
      changeDue,
      referenceNo,
      status: 'selesai',
    };

    // Deduct stock for all items accurately (if dus, deduct qty * boxQty)
    const newStockMovements: StockMovement[] = [];
    const updatedProducts = products.map((prod) => {
      const soldItems = cart.filter((c) => c.product.id === prod.id);
      if (soldItems.length > 0) {
        const totalDeducted = soldItems.reduce((acc, itm) => {
          if (itm.priceType === 'dus') {
            return acc + itm.qty * (itm.product.boxQty || 1);
          }
          return acc + itm.qty;
        }, 0);

        const prevStock = prod.stock;
        const newStock = Math.max(0, prod.stock - totalDeducted);
        newStockMovements.push({
          id: `MOV-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          productId: prod.id,
          productName: prod.name,
          type: 'keluar',
          qty: totalDeducted,
          previousStock: prevStock,
          newStock,
          reason: 'penjualan',
          notes: `Penjualan No. ${trxId} (${soldItems.map((s) => `${s.qty} ${s.unitLabel}`).join(', ')})`,
          timestamp: new Date().toISOString(),
          operator: currentUserName,
        });
        return {
          ...prod,
          stock: newStock,
        };
      }
      return prod;
    });

    try {
      const batch = writeBatch(db);
      
      // Update products stock
      updatedProducts.forEach((p) => {
        batch.set(doc(db, 'products', p.id), p);
      });

      // Write new stock movements
      newStockMovements.forEach((m) => {
        batch.set(doc(db, 'stockMovements', m.id), m);
      });

      // Write transaction
      batch.set(doc(db, 'transactions', trxId), newTrx);

      await batch.commit();
    } catch (err) {
      console.error("Firestore completeTransaction error:", err);
    }

    setLatestTransaction(newTrx);
    clearCart();

    return newTrx;
  };

  const deleteTransaction = async (trxId: string) => {
    // 1. Find transaction to delete
    const targetTrx = transactions.find((t) => t.id === trxId);
    if (!targetTrx) return;

    // 2. Perform Stock Reversal for each item in the transaction
    const stockReversals: StockMovement[] = [];
    const updatedProducts = products.map((prod) => {
      const soldItems = targetTrx.items.filter((item) => item.product.id === prod.id);
      if (soldItems.length > 0) {
        const totalPcsToRestore = soldItems.reduce((acc, itm) => {
          if (itm.priceType === 'dus') {
            return acc + itm.qty * (itm.product.boxQty || 1);
          }
          return acc + itm.qty;
        }, 0);

        const prevStock = prod.stock;
        const newStock = prevStock + totalPcsToRestore;

        stockReversals.push({
          id: `MOV-REV-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          productId: prod.id,
          productName: prod.name,
          type: 'masuk',
          qty: totalPcsToRestore,
          previousStock: prevStock,
          newStock,
          reason: 'retur_pelanggan',
          notes: `Reversal / Pembatalan Struk ${trxId} oleh Admin`,
          timestamp: new Date().toISOString(),
          operator: currentUserName,
        });

        return {
          ...prod,
          stock: newStock,
        };
      }
      return prod;
    });

    // 3. Commit batch to Firestore
    try {
      const batch = writeBatch(db);

      // Restore products stock
      updatedProducts.forEach((p) => {
        batch.set(doc(db, 'products', p.id), p);
      });

      // Write reversals
      stockReversals.forEach((r) => {
        batch.set(doc(db, 'stockMovements', r.id), r);
      });

      // Delete transaction
      batch.delete(doc(db, 'transactions', trxId));

      await batch.commit();
    } catch (err) {
      console.error("Firestore deleteTransaction error:", err);
    }

    if (latestTransaction?.id === trxId) {
      setLatestTransaction(null);
    }
  };

  // Stock In (Barang Masuk)
  const recordStockIn = async (
    productId: string,
    qty: number,
    costPrice?: number,
    supplier?: string,
    notes: string = ''
  ) => {
    const product = products.find((p) => p.id === productId);
    if (!product || qty <= 0) return;

    const previousStock = product.stock;
    const newStock = previousStock + qty;

    const movement: StockMovement = {
      id: `MOV-IN-${Date.now()}`,
      productId: product.id,
      productName: product.name,
      type: 'masuk',
      qty,
      previousStock,
      newStock,
      reason: 'pembelian_supplier',
      notes: notes || 'Penerimaan barang masuk dari supplier',
      supplier: supplier || 'Supplier Umum',
      costPrice: costPrice !== undefined ? costPrice : product.costPrice,
      timestamp: new Date().toISOString(),
      operator: currentUserName,
    };

    const updatedProduct = {
      ...product,
      stock: newStock,
      costPrice: costPrice !== undefined ? costPrice : product.costPrice,
    };

    try {
      const batch = writeBatch(db);
      batch.set(doc(db, 'products', productId), updatedProduct);
      batch.set(doc(db, 'stockMovements', movement.id), movement);
      await batch.commit();
    } catch (err) {
      console.error("Firestore recordStockIn error:", err);
    }
  };

  // Stock Out (Barang Keluar non-penjualan)
  const recordStockOut = async (
    productId: string,
    qty: number,
    reason: StockReason,
    notes: string = ''
  ) => {
    const product = products.find((p) => p.id === productId);
    if (!product || qty <= 0) return;

    const previousStock = product.stock;
    const newStock = Math.max(0, previousStock - qty);

    const movement: StockMovement = {
      id: `MOV-OUT-${Date.now()}`,
      productId: product.id,
      productName: product.name,
      type: 'keluar',
      qty,
      previousStock,
      newStock,
      reason,
      notes: notes || 'Barang keluar',
      timestamp: new Date().toISOString(),
      operator: currentUserName,
    };

    const updatedProduct = {
      ...product,
      stock: newStock,
    };

    try {
      const batch = writeBatch(db);
      batch.set(doc(db, 'products', productId), updatedProduct);
      batch.set(doc(db, 'stockMovements', movement.id), movement);
      await batch.commit();
    } catch (err) {
      console.error("Firestore recordStockOut error:", err);
    }
  };

  // Product CRUD
  const addProduct = async (newProd: Omit<Product, 'id'>) => {
    const id = `prod-${Date.now()}`;
    const product: Product = { ...newProd, id };
    
    try {
      await setDoc(doc(db, 'products', id), product);

      if (product.stock > 0) {
        const movement: StockMovement = {
          id: `MOV-INIT-${Date.now()}`,
          productId: id,
          productName: product.name,
          type: 'masuk',
          qty: product.stock,
          previousStock: 0,
          newStock: product.stock,
          reason: 'koreksi_stok',
          notes: 'Stok awal penambahan produk baru',
          timestamp: new Date().toISOString(),
          operator: currentUserName,
        };
        await setDoc(doc(db, 'stockMovements', movement.id), movement);
      }
    } catch (err) {
      console.error("Firestore addProduct error:", err);
    }
  };

  const updateProduct = async (updated: Product) => {
    try {
      await setDoc(doc(db, 'products', updated.id), updated);
    } catch (err) {
      console.error("Firestore updateProduct error:", err);
    }
  };

  const deleteProduct = async (productId: string) => {
    try {
      await deleteDoc(doc(db, 'products', productId));
      removeFromCart(productId);
    } catch (err) {
      console.error("Firestore deleteProduct error:", err);
    }
  };

  // Settings
  const updateSettings = async (newSettings: Partial<StoreSettings>) => {
    try {
      const next = { ...settings, ...newSettings };
      await setDoc(doc(db, 'settings', 'config'), next);
    } catch (err) {
      console.error("Firestore updateSettings error:", err);
    }
  };

  const resetAllData = async () => {
    try {
      const batch = writeBatch(db);
      
      // Delete current products from Firestore
      products.forEach((p) => {
        batch.delete(doc(db, 'products', p.id));
      });
      // Delete current stock movements
      stockMovements.forEach((m) => {
        batch.delete(doc(db, 'stockMovements', m.id));
      });
      // Delete current transactions
      transactions.forEach((t) => {
        batch.delete(doc(db, 'transactions', t.id));
      });
      // Delete current cashiers
      cashiers.forEach((c) => {
        batch.delete(doc(db, 'cashiers', c.id));
      });

      // Write initial settings, products and cashiers
      batch.set(doc(db, 'settings', 'config'), INITIAL_SETTINGS);
      INITIAL_PRODUCTS.forEach((p) => {
        batch.set(doc(db, 'products', p.id), p);
      });
      INITIAL_CASHIERS.forEach((c) => {
        batch.set(doc(db, 'cashiers', c.id), c);
      });

      await batch.commit();
    } catch (err) {
      console.error("Firestore resetAllData error:", err);
    }

    setCart([]);
    setCurrentRole('kasir');
    setIsAuthenticated(false);
    localStorage.clear();
    sessionStorage.clear();
  };

  return (
    <PosContext.Provider
      value={{
        isAuthenticated,
        setIsAuthenticated,
        logout,
        initialRoleForLogin,
        currentRole,
        currentUserName,
        currentCashier,
        cashiers,
        addCashier,
        updateCashier,
        deleteCashier,
        loginCashier,
        isPinModalOpen,
        pinModalMode,
        pendingAction,
        targetRoleForModal,
        openPinModal,
        closePinModal,
        verifyPin,
        switchRole,
        loginAsRole,
        activeTab,
        setActiveTab,
        canAccessTab,
        products,
        addProduct,
        updateProduct,
        deleteProduct,
        cart,
        customerType,
        setCustomerType,
        customerName,
        setCustomerName,
        discount,
        setDiscount,
        addToCart,
        updateCartItemQty,
        toggleItemPriceType,
        setItemPriceType,
        removeFromCart,
        clearCart,
        cartSubtotal,
        cartGrandTotal,
        cartTotalQty,
        cartWholesaleSavings,
        transactions,
        completeTransaction,
        deleteTransaction,
        latestTransaction,
        setLatestTransaction,
        stockMovements,
        recordStockIn,
        recordStockOut,
        settings,
        updateSettings,
        resetAllData,
        forceRefreshFromServer,
      }}
    >
      {children}
    </PosContext.Provider>
  );
};

export const usePos = () => {
  const context = useContext(PosContext);
  if (!context) {
    throw new Error('usePos must be used within a PosProvider');
  }
  return context;
};
