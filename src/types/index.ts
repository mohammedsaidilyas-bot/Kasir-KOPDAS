export type UserRole = 'kasir' | 'pengelola' | 'admin';

export type PriceType = 'ecer' | 'grosir' | 'dus';

export type PaymentMethod = 'tunai' | 'qris' | 'transfer' | 'debit';

export interface Product {
  id: string;
  sku: string; // Barcode Eceran / Satuan
  boxSku?: string; // Barcode Perkanton / Dus / Karton
  name: string;
  category: string;
  unit: string; // 'pcs' | 'bks' | 'botol' | 'kg' | 'sachet' | 'pouch'
  costPrice: number; // Harga Modal / HPP per item
  retailPrice: number; // Harga Eceran per item
  wholesalePrice: number; // Harga Grosir per item (berlaku otomatis min. 6)
  minWholesaleQty: number; // Minimal beli grosir otomatis (default: 6)
  hasBox: boolean; // Apakah ada opsi jual per dus?
  boxQty: number; // Isi per dus (misal: 40 pcs / 24 pcs / 12 pcs)
  boxCostPrice: number; // Harga Modal / Kolakan per dus
  boxPrice: number; // Harga jual per 1 dus
  boxUnit?: string; // 'dus' | 'karton' | 'box'
  stock: number; // Total stok dalam satuan item dasar
  minStockAlert: number;
}

export interface CartItem {
  cartItemId: string; // unique id per cart entry (e.g. prod1-ecer, prod1-dus)
  product: Product;
  qty: number; // jumlah item yang dibeli (jika ecer/grosir: jumlah pcs; jika dus: jumlah dus)
  priceType: PriceType; // 'ecer' | 'grosir' | 'dus'
  appliedPrice: number; // Harga yang diterapkan saat ini
  subtotal: number;
  unitLabel: string; // e.g. 'pcs', 'dus (40 pcs)'
}

export interface SaleTransaction {
  id: string; // e.g. TRX-20261001-001
  timestamp: string;
  cashierName: string;
  cashierRole: UserRole;
  customerType: PriceType;
  customerName?: string;
  items: CartItem[];
  totalQty: number;
  subtotal: number;
  discount: number;
  grandTotal: number;
  paymentMethod: PaymentMethod;
  cashReceived?: number;
  changeDue?: number;
  referenceNo?: string;
  status: 'selesai' | 'dibatalkan';
  paymentProofBase64?: string; // Base64 string of receipt/payment proof
}

export type StockReason = 
  | 'pembelian_supplier' 
  | 'penjualan' 
  | 'retur_supplier' 
  | 'retur_pelanggan' 
  | 'rusak_kadaluarsa' 
  | 'koreksi_stok' 
  | 'keperluan_toko';

export interface StockMovement {
  id: string;
  productId: string;
  productName: string;
  type: 'masuk' | 'keluar';
  qty: number;
  previousStock: number;
  newStock: number;
  reason: StockReason;
  notes: string;
  supplier?: string;
  costPrice?: number;
  timestamp: string;
  operator: string;
}

export interface CashierUser {
  id: string;
  name: string;
  pin: string;
  role: 'kasir';
  isActive: boolean;
  createdAt: string;
}

export interface StoreSettings {
  storeName: string;
  tagline: string;
  address: string;
  phone: string;
  adminWaPhone: string; // Nomor WhatsApp Admin untuk laporan tutup toko
  receiptFooter: string;
  pinKasir: string;
  pinPengelola: string;
  pinAdmin: string;
  qrisImageBase64?: string; // Custom QRIS image Base64 string
}
