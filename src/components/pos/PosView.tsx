import React, { useState, useMemo } from 'react';
import {
  Search,
  ShoppingCart,
  Trash2,
  Plus,
  Minus,
  Barcode,
  Layers,
  ShoppingBag,
  CreditCard,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  Tag,
  Check,
  Send,
} from 'lucide-react';
import { usePos } from '../../context/PosContext';
import { Product, PriceType } from '../../types';
import { formatRupiah, formatNumber } from '../../utils/formatters';
import { PaymentModal } from './PaymentModal';
import { ReceiptModal } from './ReceiptModal';
import { ClosingStoreModal } from './ClosingStoreModal';

export const PosView: React.FC = () => {
  const {
    products,
    cart,
    addToCart,
    updateCartItemQty,
    toggleItemPriceType,
    setItemPriceType,
    removeFromCart,
    clearCart,
    customerType,
    setCustomerType,
    customerName,
    setCustomerName,
    discount,
    setDiscount,
    cartSubtotal,
    cartGrandTotal,
    cartTotalQty,
    cartWholesaleSavings,
    latestTransaction,
    setLatestTransaction,
  } = usePos();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('Semua');
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
  const [isClosingModalOpen, setIsClosingModalOpen] = useState(false);
  const [barcodeInput, setBarcodeInput] = useState('');

  // Extract categories
  const categories = useMemo(() => {
    const cats = Array.from(new Set(products.map((p) => p.category)));
    return ['Semua', ...cats];
  }, [products]);

  // Filter products
  const filteredProducts = useMemo(() => {
    return products.filter((prod) => {
      const matchCat = selectedCategory === 'Semua' || prod.category === selectedCategory;
      const q = searchQuery.toLowerCase().trim();
      const matchQuery =
        !q ||
        prod.name.toLowerCase().includes(q) ||
        prod.sku.toLowerCase().includes(q) ||
        prod.category.toLowerCase().includes(q);
      return matchCat && matchQuery;
    });
  }, [products, selectedCategory, searchQuery]);

  // Barcode quick add
  const handleBarcodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!barcodeInput.trim()) return;

    const found = products.find(
      (p) => p.sku.toLowerCase() === barcodeInput.trim().toLowerCase()
    );

    if (found) {
      if (found.stock > 0) {
        addToCart(found);
        setBarcodeInput('');
      } else {
        alert(`Stok produk "${found.name}" habis!`);
      }
    } else {
      alert(`Produk dengan barcode/SKU "${barcodeInput}" tidak ditemukan.`);
    }
  };

  const handleCheckout = () => {
    if (cart.length === 0) return;
    setIsPaymentModalOpen(true);
  };

  const handlePaymentSuccess = () => {
    setIsPaymentModalOpen(false);
    setIsReceiptModalOpen(true);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-5">
      {/* Active Mode Notice Banner */}
      <div className="mb-4 bg-white border border-neutral-200 rounded-xl p-3 flex flex-wrap items-center justify-between gap-3 shadow-2xs">
        <div className="flex items-center gap-2.5">
          <div
            className={`w-3 h-3 rounded-full ${
              customerType === 'grosir' ? 'bg-emerald-500 animate-pulse' : 'bg-neutral-800'
            }`}
          />
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-neutral-800">
                {customerType === 'grosir'
                  ? 'Mode Kasir: GROSIR (Harga Khusus Toko / Warung)'
                  : 'Mode Kasir: ECERAN (Harga Konsumen Satuan)'}
              </span>
              <span className="text-[10px] bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded-full font-bold">
                Jual: Ecer · Grosir Otomatis (Min. 6) · Per Dus
              </span>
            </div>
            <p className="text-[11px] text-neutral-500 mt-0.5">
              Tersedia tombol <strong className="text-neutral-800">+1 Item</strong>,{' '}
              <strong className="text-emerald-700">+6 Grosir (Otomatis)</strong>, dan{' '}
              <strong className="text-blue-700">+1 Dus</strong> pada setiap produk. Beli ≥6 item otomatis dapat harga grosir!
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsClosingModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-neutral-900 hover:bg-neutral-800 text-white shadow-2xs transition-colors cursor-pointer"
            title="Klik untuk rekap pendapatan dan laba hari ini lalu kirim ke WhatsApp Admin"
          >
            <Send className="w-3.5 h-3.5 text-emerald-400" />
            <span>Tutup Kasir (Rekap WA)</span>
          </button>

          <span className="text-xs text-neutral-400 font-medium hidden sm:inline">|</span>

          <div className="flex p-0.5 bg-neutral-100 rounded-lg border border-neutral-200">
            <button
              type="button"
              onClick={() => setCustomerType('ecer')}
              className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${
                customerType === 'ecer'
                  ? 'bg-white text-neutral-900 shadow-xs'
                  : 'text-neutral-500 hover:text-neutral-900'
              }`}
            >
              Mode Ecer
            </button>
            <button
              type="button"
              onClick={() => setCustomerType('grosir')}
              className={`px-3 py-1 text-xs font-semibold rounded-md transition-all flex items-center gap-1 ${
                customerType === 'grosir'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-neutral-500 hover:text-neutral-900'
              }`}
            >
              <Layers className="w-3 h-3" />
              <span>Mode Grosir</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main 2-Column POS Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Left Column: Product Catalog & Search (7 Cols) */}
        <div className="lg:col-span-7 xl:col-span-8 space-y-4">
          {/* Search Bar & Barcode Scanner Simulator */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
            <div className="sm:col-span-7 relative">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari nama barang atau barcode/SKU..."
                className="w-full pl-9 pr-4 py-2 bg-white border border-neutral-200 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-neutral-900 shadow-2xs"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-neutral-400 hover:text-neutral-700"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Quick Barcode Scanner Input */}
            <form onSubmit={handleBarcodeSubmit} className="sm:col-span-5 relative flex gap-1">
              <div className="relative flex-1">
                <Barcode className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                <input
                  type="text"
                  value={barcodeInput}
                  onChange={(e) => setBarcodeInput(e.target.value)}
                  placeholder="Scan barcode..."
                  className="w-full pl-8 pr-2 py-2 bg-white border border-neutral-200 rounded-xl text-xs font-mono focus:outline-none focus:ring-1 focus:ring-neutral-900 shadow-2xs"
                />
              </div>
              <button
                type="submit"
                className="px-2.5 py-2 bg-neutral-900 hover:bg-neutral-800 text-white rounded-xl text-xs font-medium shrink-0 transition-colors shadow-xs"
                title="Tekan Enter untuk input barcode"
              >
                Scan
              </button>
            </form>
          </div>

          {/* Category Filter Pills (Functional Buttons) */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-lg whitespace-nowrap font-medium transition-colors ${
                  selectedCategory === cat
                    ? 'bg-neutral-900 text-white shadow-xs'
                    : 'bg-white border border-neutral-200 text-neutral-600 hover:bg-neutral-50'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Product Cards Grid with Explicit Dual Pricing */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3.5">
            {filteredProducts.map((prod) => {
              const isOutOfStock = prod.stock <= 0;
              const isLowStock = prod.stock > 0 && prod.stock <= prod.minStockAlert;
              const diffPrice = prod.retailPrice - prod.wholesalePrice;
              const percentDiff = ((diffPrice / prod.retailPrice) * 100).toFixed(0);

              // Check if in cart
              const inCart = cart.find((c) => c.product.id === prod.id);

              return (
                <div
                  key={prod.id}
                  className={`bg-white border rounded-2xl p-3.5 transition-all flex flex-col justify-between shadow-2xs ${
                    isOutOfStock
                      ? 'opacity-60 border-neutral-200 bg-neutral-50'
                      : 'hover:border-neutral-400 hover:shadow-xs border-neutral-200'
                  }`}
                >
                  {/* Top card metadata */}
                  <div>
                    <div className="flex items-start justify-between gap-1 mb-1.5">
                      <span className="text-[10px] text-neutral-400 font-mono">
                        {prod.sku.slice(-6)}
                      </span>
                      <span
                        className={`text-[10px] font-medium px-2 py-0.5 rounded-md ${
                          isOutOfStock
                            ? 'bg-rose-50 text-rose-700 font-semibold'
                            : isLowStock
                            ? 'bg-amber-50 text-amber-700 font-medium'
                            : 'bg-neutral-100 text-neutral-600'
                        }`}
                      >
                        {isOutOfStock
                          ? 'Habis'
                          : `Stok: ${prod.stock} ${prod.unit}`}
                      </span>
                    </div>

                    <h3 className="font-bold text-xs text-neutral-900 line-clamp-2 leading-snug">
                      {prod.name}
                    </h3>
                    <p className="text-[10px] text-neutral-400 mt-0.5">
                      {prod.category} · Satuan: {prod.unit}
                    </p>
                  </div>

                  {/* Explicit Pricing Comparison Box */}
                  <div className="mt-3 pt-2.5 border-t border-neutral-100 space-y-2">
                    <div className="bg-neutral-50/90 rounded-xl p-2.5 border border-neutral-200/80 space-y-1.5 text-xs">
                      {/* 1. Ecer price */}
                      <div className="flex items-center justify-between">
                        <span className="text-neutral-600 font-medium flex items-center gap-1">
                          <Tag className="w-3 h-3 text-neutral-400" />
                          <span>1. Ecer (Satuan):</span>
                        </span>
                        <span className="font-bold font-mono text-neutral-900">
                          {formatRupiah(prod.retailPrice)}{' '}
                          <span className="text-[10px] font-normal text-neutral-500">/{prod.unit}</span>
                        </span>
                      </div>

                      {/* 2. Grosir price (min 6 otomatis) */}
                      <div className="flex items-center justify-between pt-1 border-t border-dashed border-neutral-200">
                        <div>
                          <span className="text-emerald-700 font-bold flex items-center gap-1">
                            <Layers className="w-3 h-3 text-emerald-600" />
                            <span>2. Grosir (Min. {prod.minWholesaleQty || 6}):</span>
                          </span>
                          <span className="text-[10px] text-emerald-600 font-semibold block">
                            Otomatis aktif beli ≥{prod.minWholesaleQty || 6}
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="font-bold font-mono text-emerald-700">
                            {formatRupiah(prod.wholesalePrice)}{' '}
                            <span className="text-[10px] font-normal">/{prod.unit}</span>
                          </span>
                          <span className="text-[9px] text-neutral-400 block">
                            Hemat {formatRupiah(diffPrice)}/item
                          </span>
                        </div>
                      </div>

                      {/* 3. Dus / Karton price */}
                      {prod.hasBox && prod.boxPrice > 0 && (
                        <div className="flex items-center justify-between pt-1 border-t border-dashed border-neutral-200">
                          <span className="text-blue-700 font-bold flex items-center gap-1">
                            <span>📦 3. Per Dus (Isi {prod.boxQty} {prod.unit}):</span>
                          </span>
                          <div className="text-right">
                            <span className="font-bold font-mono text-blue-700">
                              {formatRupiah(prod.boxPrice)}{' '}
                              <span className="text-[10px] font-normal">/{prod.boxUnit || 'dus'}</span>
                            </span>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* 3 Quick Action Buttons: Ecer, Grosir (x6), Dus */}
                    <div className="grid grid-cols-3 gap-1.5 pt-0.5">
                      <button
                        type="button"
                        disabled={isOutOfStock}
                        onClick={() => addToCart(prod, 'ecer')}
                        className="py-2 px-1 bg-neutral-100 hover:bg-neutral-200 disabled:opacity-40 disabled:cursor-not-allowed text-neutral-800 text-[10px] font-bold rounded-xl transition-all flex flex-col items-center justify-center border border-neutral-200/80 active:scale-95 cursor-pointer"
                        title={`Beli 1 item satuan (${formatRupiah(prod.retailPrice)})`}
                      >
                        <span className="text-neutral-500 text-[9px]">+1 Item</span>
                        <span className="font-mono text-neutral-900 leading-tight">Ecer</span>
                      </button>

                      <button
                        type="button"
                        disabled={isOutOfStock}
                        onClick={() => addToCart(prod, 'grosir', prod.minWholesaleQty || 6)}
                        className="py-2 px-1 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-[10px] font-bold rounded-xl transition-all flex flex-col items-center justify-center shadow-2xs active:scale-95 cursor-pointer"
                        title={`Beli langsung ${prod.minWholesaleQty || 6} pcs dengan harga grosir otomatis`}
                      >
                        <span className="text-emerald-100 text-[9px]">+{prod.minWholesaleQty || 6} Auto</span>
                        <span className="font-mono leading-tight">Grosir</span>
                      </button>

                      <button
                        type="button"
                        disabled={isOutOfStock || (prod.stock < (prod.boxQty || 1))}
                        onClick={() => addToCart(prod, 'dus')}
                        className="py-2 px-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-[10px] font-bold rounded-xl transition-all flex flex-col items-center justify-center shadow-2xs active:scale-95 cursor-pointer"
                        title={`Beli 1 Dus (Isi ${prod.boxQty} ${prod.unit} @ ${formatRupiah(prod.boxPrice)})`}
                      >
                        <span className="text-blue-100 text-[9px]">+1 Dus</span>
                        <span className="font-mono leading-tight">Karton</span>
                      </button>
                    </div>

                    {/* In-cart indicator */}
                    {inCart && (
                      <div className="flex items-center justify-between bg-neutral-100 text-neutral-800 text-[10px] font-medium px-2 py-1 rounded-lg">
                        <span>Di keranjang:</span>
                        <span className="font-mono font-bold text-emerald-800">
                          {inCart.qty} {inCart.unitLabel} ({inCart.priceType.toUpperCase()})
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {filteredProducts.length === 0 && (
            <div className="bg-white border border-neutral-200 rounded-xl p-8 text-center space-y-2">
              <ShoppingBag className="w-8 h-8 text-neutral-300 mx-auto" />
              <p className="text-xs font-semibold text-neutral-700">Produk tidak ditemukan</p>
              <p className="text-[11px] text-neutral-400">
                Coba sesuaikan kata kunci pencarian atau kategori filter
              </p>
            </div>
          )}
        </div>

        {/* Right Column: Active Cart & Rapid Checkout (5 Cols) */}
        <div className="lg:col-span-5 xl:col-span-4 bg-white border border-neutral-200 rounded-2xl shadow-xs overflow-hidden sticky top-20">
          {/* Cart Header */}
          <div className="p-4 border-b border-neutral-100 flex items-center justify-between bg-neutral-50/70">
            <div className="flex items-center gap-2">
              <ShoppingCart className="w-4 h-4 text-emerald-600" />
              <h2 className="text-sm font-bold text-neutral-900">Keranjang Belanja</h2>
              {cartTotalQty > 0 && (
                <span className="text-[11px] bg-emerald-100 text-emerald-800 font-semibold px-2 py-0.2 rounded-full font-mono">
                  {cartTotalQty} item
                </span>
              )}
            </div>

            {cart.length > 0 && (
              <button
                type="button"
                onClick={clearCart}
                className="text-[11px] text-neutral-400 hover:text-rose-600 transition-colors flex items-center gap-1"
                title="Kosongkan keranjang"
              >
                <Trash2 className="w-3 h-3" />
                <span>Reset</span>
              </button>
            )}
          </div>

          {/* Customer Name Field */}
          <div className="px-4 py-2.5 bg-neutral-50/30 border-b border-neutral-100">
            <input
              type="text"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder="Nama pelanggan (contoh: Toko Bu Siti / Pelanggan Umum)..."
              className="w-full px-3 py-1.5 bg-white border border-neutral-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-neutral-900"
            />
          </div>

          {/* Cart Items List */}
          <div className="max-h-[380px] overflow-y-auto divide-y divide-neutral-100 p-2.5">
            {cart.length === 0 ? (
              <div className="py-12 px-4 text-center space-y-2">
                <ShoppingCart className="w-10 h-10 text-neutral-300 mx-auto" />
                <p className="text-xs font-semibold text-neutral-700">Keranjang Masih Kosong</p>
                <p className="text-[11px] text-neutral-400 max-w-xs mx-auto">
                  Klik tombol <strong>+ Ecer</strong> atau <strong>+ Grosir</strong> pada produk di sebelah kiri.
                </p>
              </div>
            ) : (
              cart.map((item) => {
                const isDus = item.priceType === 'dus';
                const isWholesaleActive = item.priceType === 'grosir';
                const minQty = item.product.minWholesaleQty || 6;
                const savingsPerItem =
                  item.product.retailPrice - item.product.wholesalePrice;
                const totalItemSavings = isWholesaleActive
                  ? savingsPerItem * item.qty
                  : isDus
                  ? Math.max(0, (item.product.retailPrice * item.product.boxQty - item.product.boxPrice) * item.qty)
                  : 0;

                return (
                  <div
                    key={item.cartItemId}
                    className="p-2.5 rounded-xl hover:bg-neutral-50/80 transition-colors space-y-2 border border-neutral-100"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="font-bold text-xs text-neutral-900 truncate">
                          {item.product.name}
                        </div>
                        <div className="flex flex-wrap items-center gap-1 mt-0.5">
                          {isDus ? (
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                              📦 Kemasan Dus (Isi {item.product.boxQty} {item.product.unit})
                            </span>
                          ) : isWholesaleActive ? (
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                              ★ Grosir Otomatis (≥{minQty} {item.product.unit})
                            </span>
                          ) : (
                            <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-neutral-100 text-neutral-600">
                              Eceran Satuan
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <div className="font-bold font-mono text-xs text-neutral-900">
                          {formatRupiah(item.subtotal)}
                        </div>
                        <button
                          type="button"
                          onClick={() => removeFromCart(item.cartItemId)}
                          className="text-[10px] text-neutral-400 hover:text-rose-600 mt-0.5 cursor-pointer"
                        >
                          Hapus
                        </button>
                      </div>
                    </div>

                    {/* Pricing Selector Tabs: Ecer | Grosir (Min 6) | Dus */}
                    <div className="bg-neutral-100 p-1 rounded-lg flex items-center justify-between text-[10px]">
                      <span className="font-semibold text-neutral-500 pl-1">Harga:</span>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => setItemPriceType(item.cartItemId, 'ecer')}
                          className={`px-2 py-0.5 rounded-md font-semibold transition-all cursor-pointer ${
                            !isDus && !isWholesaleActive
                              ? 'bg-white text-neutral-900 shadow-2xs font-bold'
                              : 'text-neutral-500 hover:text-neutral-800'
                          }`}
                        >
                          Ecer ({formatRupiah(item.product.retailPrice)})
                        </button>

                        <button
                          type="button"
                          onClick={() => setItemPriceType(item.cartItemId, 'grosir')}
                          className={`px-2 py-0.5 rounded-md font-semibold transition-all flex items-center gap-0.5 cursor-pointer ${
                            isWholesaleActive
                              ? 'bg-emerald-600 text-white shadow-2xs font-bold'
                              : 'text-neutral-500 hover:text-neutral-800'
                          }`}
                        >
                          <Layers className="w-2.5 h-2.5" />
                          <span>Grosir ({formatRupiah(item.product.wholesalePrice)})</span>
                        </button>

                        {item.product.hasBox && item.product.boxPrice > 0 && (
                          <button
                            type="button"
                            onClick={() => setItemPriceType(item.cartItemId, 'dus')}
                            className={`px-2 py-0.5 rounded-md font-semibold transition-all cursor-pointer ${
                              isDus
                                ? 'bg-blue-600 text-white shadow-2xs font-bold'
                                : 'text-neutral-500 hover:text-neutral-800'
                            }`}
                          >
                            Dus ({formatRupiah(item.product.boxPrice)})
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Qty controls & Wholesale Savings notification */}
                    <div className="flex items-center justify-between pt-0.5">
                      <div className="flex items-center gap-1 bg-neutral-100 rounded-lg p-0.5 border border-neutral-200">
                        <button
                          type="button"
                          onClick={() => updateCartItemQty(item.cartItemId, item.qty - 1)}
                          className="w-6 h-6 rounded-md bg-white hover:bg-neutral-200 flex items-center justify-center text-neutral-700 transition-colors cursor-pointer"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <input
                          type="number"
                          min="1"
                          value={item.qty}
                          onChange={(e) => {
                            const val = parseInt(e.target.value, 10);
                            if (!isNaN(val)) updateCartItemQty(item.cartItemId, val);
                          }}
                          className="w-12 text-center font-mono font-bold text-xs bg-transparent focus:outline-none"
                        />
                        <button
                          type="button"
                          onClick={() => updateCartItemQty(item.cartItemId, item.qty + 1)}
                          className="w-6 h-6 rounded-md bg-white hover:bg-neutral-200 flex items-center justify-center text-neutral-700 transition-colors cursor-pointer"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                      {/* Savings info or automatic wholesale status */}
                      <div className="text-right">
                        <span className="text-[10px] text-neutral-500 block">
                          @ {formatRupiah(item.appliedPrice)} / {isDus ? item.product.boxUnit || 'dus' : item.product.unit}
                        </span>
                        {totalItemSavings > 0 ? (
                          <div className="text-[10px] text-emerald-700 font-bold flex items-center justify-end gap-1">
                            <Check className="w-3 h-3 text-emerald-600" />
                            <span>Hemat {formatRupiah(totalItemSavings)}!</span>
                          </div>
                        ) : !isDus && item.qty < minQty ? (
                          <span className="text-[9px] text-neutral-400 block">
                            (Beli +{minQty - item.qty} lagi otomatis dapat Grosir)
                          </span>
                        ) : null}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Calculation & Checkout Footer */}
          <div className="p-4 bg-neutral-50/70 border-t border-neutral-200 space-y-3">
            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between text-neutral-600">
                <span>Subtotal ({cartTotalQty} item)</span>
                <span className="font-mono">{formatRupiah(cartSubtotal)}</span>
              </div>

              {/* Wholesale Savings Banner */}
              {cartWholesaleSavings > 0 && (
                <div className="flex justify-between items-center text-emerald-700 font-semibold bg-emerald-50 px-2.5 py-1.5 rounded-lg border border-emerald-200 text-xs">
                  <span className="flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Total Hemat Beli Grosir:</span>
                  </span>
                  <span className="font-mono font-bold">
                    -{formatRupiah(cartWholesaleSavings)}
                  </span>
                </div>
              )}

              {/* Discount Input */}
              <div className="flex items-center justify-between text-neutral-600">
                <span>Potongan / Diskon (Rp)</span>
                <div className="w-28 relative">
                  <input
                    type="number"
                    min="0"
                    max={cartSubtotal}
                    value={discount || ''}
                    onChange={(e) => setDiscount(Math.max(0, Number(e.target.value) || 0))}
                    placeholder="0"
                    className="w-full text-right px-2 py-1 bg-white border border-neutral-300 rounded-md text-xs font-mono focus:outline-none focus:ring-1 focus:ring-neutral-900"
                  />
                </div>
              </div>

              {/* Grand Total */}
              <div className="flex justify-between items-baseline pt-2 border-t border-neutral-200">
                <span className="font-bold text-sm text-neutral-900">Total Tagihan</span>
                <span className="font-bold font-mono text-xl text-neutral-900">
                  {formatRupiah(cartGrandTotal)}
                </span>
              </div>
            </div>

            {/* Checkout Action Button */}
            <button
              type="button"
              onClick={handleCheckout}
              disabled={cart.length === 0}
              className="w-full py-3.5 bg-neutral-900 hover:bg-neutral-800 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold text-sm rounded-xl transition-all shadow-xs flex items-center justify-center gap-2"
            >
              <CreditCard className="w-4 h-4 text-emerald-400" />
              <span>Bayar Transaksi</span>
            </button>
          </div>
        </div>
      </div>

      {/* Payment Modal */}
      <PaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        onSuccess={handlePaymentSuccess}
      />

      {/* Receipt Modal */}
      <ReceiptModal
        transaction={latestTransaction}
        isOpen={isReceiptModalOpen}
        onClose={() => setIsReceiptModalOpen(false)}
      />

      {/* Closing Store Modal */}
      <ClosingStoreModal
        isOpen={isClosingModalOpen}
        onClose={() => setIsClosingModalOpen(false)}
      />
    </div>
  );
};
