import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
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
  addProduct: (product: Omit<Product, 'id'>) => void;
  updateProduct: (product: Product) => void;
  deleteProduct: (productId: string) => void;

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
  ) => SaleTransaction | null;
  deleteTransaction: (id: string) => void;
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
  ) => void;
  recordStockOut: (
    productId: string,
    qty: number,
    reason: StockReason,
    notes?: string
  ) => void;

  // Settings
  settings: StoreSettings;
  updateSettings: (newSettings: Partial<StoreSettings>) => void;
  resetAllData: () => void;

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
    try {
      const res = await fetch(getApiUrl('/api/data'));
      const resData = await res.json();
      if (resData.success && resData.data) {
        const d = resData.data;
        isUpdatingFromServerRef.current = true;
        if (d.settings) {
          if (!d.settings.storeName || d.settings.storeName === 'Toko Berkah Bersama') {
            d.settings.storeName = 'KOPDES SENDANG DAJAH';
            d.settings.address = 'Jl. Temor Leke Desa Sendang Dajah Kec. Labang Bangkalan';
            d.settings.adminWaPhone = '085704800313';
          }
          setSettings(d.settings);
          localStorage.setItem('kasirku_settings', JSON.stringify(d.settings));
        }
        if (Array.isArray(d.products)) {
          setProducts(d.products);
          localStorage.setItem('kasirku_products', JSON.stringify(d.products));
        }
        if (d.stockMovements) {
          setStockMovements(d.stockMovements);
          localStorage.setItem('kasirku_movements', JSON.stringify(d.stockMovements));
        }
        if (d.transactions) {
          setTransactions(d.transactions);
          localStorage.setItem('kasirku_transactions', JSON.stringify(d.transactions));
        }
        if (d.cashiers) {
          setCashiers(d.cashiers);
          localStorage.setItem('kasirku_cashiers', JSON.stringify(d.cashiers));
        }
        return true;
      }
    } catch (e) {
      console.error("Force refresh error:", e);
    }
    return false;
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

  // 1. Initial Load from Server
  useEffect(() => {
    fetch(getApiUrl('/api/data'))
      .then((res) => res.json())
      .then((resData) => {
        if (resData.success && resData.data) {
          const d = resData.data;
          isUpdatingFromServerRef.current = true;
          if (d.settings) {
            if (!d.settings.storeName || d.settings.storeName === 'Toko Berkah Bersama') {
              d.settings.storeName = 'KOPDES SENDANG DAJAH';
              d.settings.address = 'Jl. Temor Leke Desa Sendang Dajah Kec. Labang Bangkalan';
              d.settings.adminWaPhone = '085704800313';
            }
            setSettings(d.settings);
            localStorage.setItem('kasirku_settings', JSON.stringify(d.settings));
          }
          if (Array.isArray(d.products)) {
            setProducts(d.products);
            localStorage.setItem('kasirku_products', JSON.stringify(d.products));
          }
          if (d.stockMovements) {
            setStockMovements(d.stockMovements);
            localStorage.setItem('kasirku_movements', JSON.stringify(d.stockMovements));
          }
          if (d.transactions) {
            setTransactions(d.transactions);
            localStorage.setItem('kasirku_transactions', JSON.stringify(d.transactions));
          }
          if (d.cashiers) {
            setCashiers(d.cashiers);
            localStorage.setItem('kasirku_cashiers', JSON.stringify(d.cashiers));
          }
        }
        setHasLoadedFromServer(true);
      })
      .catch((err) => {
        console.error("Failed to load from server, using localStorage:", err);
        setHasLoadedFromServer(true);
      });
  }, []);

  // 2. Continuous Polling from Server every 1.5s to stay in real-time sync across all APKs
  useEffect(() => {
    if (!hasLoadedFromServer) return;
    const interval = setInterval(() => {
      fetch(getApiUrl('/api/data'))
        .then((res) => res.json())
        .then((resData) => {
          if (resData.success && resData.data) {
            const d = resData.data;
            let updated = false;

            if (d.settings) {
              if (!d.settings.storeName || d.settings.storeName === 'Toko Berkah Bersama') {
                d.settings.storeName = 'KOPDES SENDANG DAJAH';
                d.settings.address = 'Jl. Temor Leke Desa Sendang Dajah Kec. Labang Bangkalan';
                d.settings.adminWaPhone = '085704800313';
              }
              if (JSON.stringify(d.settings) !== JSON.stringify(settings)) {
                setSettings(d.settings);
                localStorage.setItem('kasirku_settings', JSON.stringify(d.settings));
                updated = true;
              }
            }
            if (Array.isArray(d.products) && JSON.stringify(d.products) !== JSON.stringify(products)) {
              setProducts(d.products);
              localStorage.setItem('kasirku_products', JSON.stringify(d.products));
              updated = true;
            }
            if (d.stockMovements && JSON.stringify(d.stockMovements) !== JSON.stringify(stockMovements)) {
              setStockMovements(d.stockMovements);
              localStorage.setItem('kasirku_movements', JSON.stringify(d.stockMovements));
              updated = true;
            }
            if (d.transactions && JSON.stringify(d.transactions) !== JSON.stringify(transactions)) {
              setTransactions(d.transactions);
              localStorage.setItem('kasirku_transactions', JSON.stringify(d.transactions));
              updated = true;
            }
            if (d.cashiers && JSON.stringify(d.cashiers) !== JSON.stringify(cashiers)) {
              setCashiers(d.cashiers);
              localStorage.setItem('kasirku_cashiers', JSON.stringify(d.cashiers));
              updated = true;
            }

            if (updated) {
              isUpdatingFromServerRef.current = true;
            }
          }
        })
        .catch((err) => console.error("Polling error:", err));
    }, 1500); // Fast 1.5-second polling interval

    return () => clearInterval(interval);
  }, [hasLoadedFromServer, settings, products, stockMovements, transactions, cashiers]);

  // 3. Save to server whenever state changes from LOCAL USER action
  useEffect(() => {
    if (!hasLoadedFromServer) return;

    if (isUpdatingFromServerRef.current) {
      // Received update from server, do not echo back
      isUpdatingFromServerRef.current = false;
      return;
    }

    // Save to localStorage as local backup
    localStorage.setItem('kasirku_settings', JSON.stringify(settings));
    localStorage.setItem('kasirku_products', JSON.stringify(products));
    localStorage.setItem('kasirku_movements', JSON.stringify(stockMovements));
    localStorage.setItem('kasirku_transactions', JSON.stringify(transactions));
    localStorage.setItem('kasirku_cashiers', JSON.stringify(cashiers));

    // Post to Express backend
    fetch(getApiUrl('/api/save'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        data: {
          settings,
          products,
          stockMovements,
          transactions,
          cashiers,
        },
      }),
    })
      .then((res) => res.json())
      .then((resData) => {
        if (!resData.success) {
          console.error("Server save returned success=false");
        }
      })
      .catch((err) => console.error("Failed to save to server:", err));
  }, [hasLoadedFromServer, settings, products, stockMovements, transactions, cashiers]);

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
    setCashiers((prev) => [...prev, newCashier]);
    return newCashier;
  };

  const updateCashier = (id: string, name: string, pin: string, isActive: boolean) => {
    setCashiers((prev) =>
      prev.map((c) => (c.id === id ? { ...c, name: name.trim(), pin: pin.trim(), isActive } : c))
    );
    if (currentCashier?.id === id) {
      setCurrentCashier((prev) => (prev ? { ...prev, name: name.trim(), pin: pin.trim(), isActive } : null));
    }
  };

  const deleteCashier = (id: string) => {
    setCashiers((prev) => prev.filter((c) => c.id !== id));
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
  // - pengelola: 'pos', 'history', 'inventory', 'products'
  // - admin: all tabs
  const canAccessTab = (tab: string): boolean => {
    if (currentRole === 'admin') return true;
    if (currentRole === 'pengelola') {
      return ['pos', 'history', 'inventory', 'products'].includes(tab);
    }
    // kasir:
    return ['pos', 'history'].includes(tab);
  };

  const setActiveTab = (tab: 'pos' | 'history' | 'inventory' | 'products' | 'reports' | 'settings') => {
    if (!canAccessTab(tab)) {
      // Require PIN of required role
      const requiredRole: UserRole = ['reports', 'settings'].includes(tab) ? 'admin' : 'pengelola';
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
  const completeTransaction = (
    paymentMethod: PaymentMethod,
    cashReceived?: number,
    changeDue?: number,
    referenceNo?: string
  ): SaleTransaction | null => {
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

    setProducts(updatedProducts);
    setStockMovements((prev) => [...newStockMovements, ...prev]);
    setTransactions((prev) => [newTrx, ...prev]);
    setLatestTransaction(newTrx);
    clearCart();

    return newTrx;
  };

  const deleteTransaction = (trxId: string) => {
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

    // 3. Update states
    setProducts(updatedProducts);
    setStockMovements((prev) => [...stockReversals, ...prev]);
    setTransactions((prev) => prev.filter((t) => t.id !== trxId));

    if (latestTransaction?.id === trxId) {
      setLatestTransaction(null);
    }
  };

  // Stock In (Barang Masuk)
  const recordStockIn = (
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

    setProducts((prev) =>
      prev.map((p) =>
        p.id === productId
          ? {
              ...p,
              stock: newStock,
              costPrice: costPrice !== undefined ? costPrice : p.costPrice,
            }
          : p
      )
    );
    setStockMovements((prev) => [movement, ...prev]);
  };

  // Stock Out (Barang Keluar non-penjualan)
  const recordStockOut = (
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

    setProducts((prev) =>
      prev.map((p) => (p.id === productId ? { ...p, stock: newStock } : p))
    );
    setStockMovements((prev) => [movement, ...prev]);
  };

  // Product CRUD
  const addProduct = (newProd: Omit<Product, 'id'>) => {
    isUpdatingFromServerRef.current = false;
    const id = `prod-${Date.now()}`;
    const product: Product = { ...newProd, id };
    const nextProducts = [product, ...products];
    setProducts(nextProducts);

    let nextMovements = stockMovements;
    // Record initial stock if > 0
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
      nextMovements = [movement, ...stockMovements];
      setStockMovements(nextMovements);
    }

    localStorage.setItem('kasirku_products', JSON.stringify(nextProducts));
    localStorage.setItem('kasirku_movements', JSON.stringify(nextMovements));

    fetch(getApiUrl('/api/save'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        data: {
          settings,
          products: nextProducts,
          stockMovements: nextMovements,
          transactions,
          cashiers,
        },
      }),
    }).catch((e) => console.error('Direct add save error:', e));
  };

  const updateProduct = (updated: Product) => {
    isUpdatingFromServerRef.current = false;
    const nextProducts = products.map((p) => (p.id === updated.id ? updated : p));
    setProducts(nextProducts);
    localStorage.setItem('kasirku_products', JSON.stringify(nextProducts));

    fetch(getApiUrl('/api/save'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        data: {
          settings,
          products: nextProducts,
          stockMovements,
          transactions,
          cashiers,
        },
      }),
    }).catch((e) => console.error('Direct update save error:', e));
  };

  const deleteProduct = (productId: string) => {
    isUpdatingFromServerRef.current = false;
    const nextProducts = products.filter((p) => p.id !== productId);
    setProducts(nextProducts);
    removeFromCart(productId);
    localStorage.setItem('kasirku_products', JSON.stringify(nextProducts));

    fetch(getApiUrl('/api/save'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        data: {
          settings,
          products: nextProducts,
          stockMovements,
          transactions,
          cashiers,
        },
      }),
    }).catch((e) => console.error('Direct delete save error:', e));
  };

  // Settings
  const updateSettings = (newSettings: Partial<StoreSettings>) => {
    setSettings((prev) => ({ ...prev, ...newSettings }));
  };

  const resetAllData = () => {
    setSettings(INITIAL_SETTINGS);
    setProducts(INITIAL_PRODUCTS);
    setStockMovements(INITIAL_STOCK_MOVEMENTS);
    setTransactions(INITIAL_TRANSACTIONS);
    setCashiers(INITIAL_CASHIERS);
    setCurrentCashier(INITIAL_CASHIERS[0]);
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
