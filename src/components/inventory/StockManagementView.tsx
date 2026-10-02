import React, { useState } from 'react';
import {
  ArrowDownLeft,
  ArrowUpRight,
  Package,
  History,
  AlertTriangle,
  PlusCircle,
  MinusCircle,
  CheckCircle2,
  Filter,
  Barcode,
} from 'lucide-react';
import { usePos } from '../../context/PosContext';
import { StockReason } from '../../types';
import {
  formatRupiah,
  formatDateTime,
  formatNumber,
} from '../../utils/formatters';

export const StockManagementView: React.FC = () => {
  const { products, stockMovements, recordStockIn, recordStockOut } = usePos();

  const [activeSubTab, setActiveSubTab] = useState<'masuk' | 'keluar' | 'status' | 'riwayat'>('masuk');

  // Scanner inputs
  const [scanBarcodeIn, setScanBarcodeIn] = useState('');
  const [scanBarcodeOut, setScanBarcodeOut] = useState('');

  // Form Stock In states
  const [inProductId, setInProductId] = useState<string>(products[0]?.id || '');
  const [inQty, setInQty] = useState<number>(10);
  const [inCostPrice, setInCostPrice] = useState<number>(
    products[0]?.costPrice || 0
  );
  const [inSupplier, setInSupplier] = useState<string>('');
  const [inNotes, setInNotes] = useState<string>('');
  const [inSuccessMsg, setInSuccessMsg] = useState<string>('');

  // Form Stock Out states
  const [outProductId, setOutProductId] = useState<string>(products[0]?.id || '');
  const [outQty, setOutQty] = useState<number>(1);
  const [outReason, setOutReason] = useState<StockReason>('rusak_kadaluarsa');
  const [outNotes, setOutNotes] = useState<string>('');
  const [outSuccessMsg, setOutSuccessMsg] = useState<string>('');

  // History filter
  const [historyFilterType, setHistoryFilterType] = useState<'semua' | 'masuk' | 'keluar'>('semua');
  const [historySearch, setHistorySearch] = useState('');

  // Status stock filter
  const [stockStatusFilter, setStockStatusFilter] = useState<'semua' | 'menipis' | 'habis'>('semua');

  // Handle Product Change for Stock In
  const handleInProductChange = (prodId: string) => {
    setInProductId(prodId);
    const prod = products.find((p) => p.id === prodId);
    if (prod) {
      setInCostPrice(prod.costPrice);
    }
  };

  const handleStockInSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inProductId || inQty <= 0) return;

    recordStockIn(inProductId, inQty, inCostPrice, inSupplier, inNotes);
    const prod = products.find((p) => p.id === inProductId);
    setInSuccessMsg(`Berhasil menambahkan ${inQty} ${prod?.unit || 'unit'} untuk "${prod?.name}"!`);
    setInQty(10);
    setInNotes('');
    setInSupplier('');
    setTimeout(() => setInSuccessMsg(''), 4000);
  };

  const handleStockOutSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!outProductId || outQty <= 0) return;

    const prod = products.find((p) => p.id === outProductId);
    if (prod && outQty > prod.stock) {
      alert(`Jumlah barang keluar (${outQty}) melebihi stok yang ada (${prod.stock})!`);
      return;
    }

    recordStockOut(outProductId, outQty, outReason, outNotes);
    setOutSuccessMsg(`Berhasil mencatat pengeluaran ${outQty} ${prod?.unit || 'unit'} "${prod?.name}".`);
    setOutQty(1);
    setOutNotes('');
    setTimeout(() => setOutSuccessMsg(''), 4000);
  };

  // Filtered Stock Movements
  const filteredMovements = stockMovements.filter((mov) => {
    const matchType = historyFilterType === 'semua' || mov.type === historyFilterType;
    const matchQuery =
      !historySearch ||
      mov.productName.toLowerCase().includes(historySearch.toLowerCase()) ||
      mov.notes.toLowerCase().includes(historySearch.toLowerCase()) ||
      mov.operator.toLowerCase().includes(historySearch.toLowerCase());
    return matchType && matchQuery;
  });

  // Filtered Products for Stock Status
  const filteredStockProducts = products.filter((prod) => {
    if (stockStatusFilter === 'habis') return prod.stock <= 0;
    if (stockStatusFilter === 'menipis') return prod.stock > 0 && prod.stock <= prod.minStockAlert;
    return true;
  });

  const reasonLabels: Record<StockReason, string> = {
    pembelian_supplier: 'Pembelian dari Supplier / Restock',
    penjualan: 'Penjualan Kasir',
    retur_supplier: 'Retur ke Supplier',
    retur_pelanggan: 'Retur dari Pelanggan',
    rusak_kadaluarsa: 'Barang Rusak / Kadaluarsa / Pecah',
    koreksi_stok: 'Penyesuaian Fisik / Stock Opname',
    keperluan_toko: 'Keperluan Operasional Toko',
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Title & Sub-navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-200 pb-4">
        <div>
          <h1 className="text-xl font-bold text-neutral-900 tracking-tight">
            Manajemen Barang Masuk & Keluar
          </h1>
          <p className="text-xs text-neutral-500 mt-0.5">
            Kelola restock supplier, catat barang rusak/retur, dan pantau mutasi inventaris toko.
          </p>
        </div>

        {/* Sub-tabs */}
        <div className="flex items-center gap-1 p-1 bg-neutral-100 rounded-xl border border-neutral-200 text-xs">
          <button
            type="button"
            onClick={() => setActiveSubTab('masuk')}
            className={`px-3 py-1.5 font-semibold rounded-lg transition-all flex items-center gap-1.5 ${
              activeSubTab === 'masuk'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-neutral-600 hover:text-neutral-900'
            }`}
          >
            <ArrowDownLeft className="w-3.5 h-3.5" />
            <span>Input Masuk</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('keluar')}
            className={`px-3 py-1.5 font-semibold rounded-lg transition-all flex items-center gap-1.5 ${
              activeSubTab === 'keluar'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'text-neutral-600 hover:text-neutral-900'
            }`}
          >
            <ArrowUpRight className="w-3.5 h-3.5" />
            <span>Input Keluar</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('status')}
            className={`px-3 py-1.5 font-semibold rounded-lg transition-all flex items-center gap-1.5 ${
              activeSubTab === 'status'
                ? 'bg-neutral-900 text-white shadow-xs'
                : 'text-neutral-600 hover:text-neutral-900'
            }`}
          >
            <Package className="w-3.5 h-3.5" />
            <span>Status Stok</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('riwayat')}
            className={`px-3 py-1.5 font-semibold rounded-lg transition-all flex items-center gap-1.5 ${
              activeSubTab === 'riwayat'
                ? 'bg-neutral-900 text-white shadow-xs'
                : 'text-neutral-600 hover:text-neutral-900'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>Riwayat Mutasi</span>
          </button>
        </div>
      </div>

      {/* Tab 1: Input Barang Masuk */}
      {activeSubTab === 'masuk' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-7 bg-white border border-neutral-200 rounded-2xl p-6 shadow-xs">
            <div className="flex items-center gap-2 mb-4 pb-3 border-b border-neutral-100">
              <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <ArrowDownLeft className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-neutral-900">
                  Formulir Barang Masuk (Restock / Pembelian)
                </h2>
                <p className="text-xs text-neutral-500">
                  Tambah stok barang yang baru diterima dari pemasok atau distributor
                </p>
              </div>
            </div>

            {inSuccessMsg && (
              <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-semibold text-emerald-800 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{inSuccessMsg}</span>
              </div>
            )}

            <form onSubmit={handleStockInSubmit} className="space-y-4">
              <div className="bg-neutral-50 p-2.5 rounded-xl border border-neutral-200">
                <label className="block text-[11px] font-bold text-neutral-700 mb-1 flex items-center gap-1.5">
                  <Barcode className="w-3.5 h-3.5 text-neutral-600" />
                  <span>Scan Barcode / SKU Cepat:</span>
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={scanBarcodeIn}
                    onChange={(e) => setScanBarcodeIn(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        const found = products.find(
                          (p) => p.sku.toLowerCase() === scanBarcodeIn.trim().toLowerCase()
                        );
                        if (found) {
                          handleInProductChange(found.id);
                          setScanBarcodeIn('');
                          setInSuccessMsg(`Produk "${found.name}" terpilih via scan!`);
                          setTimeout(() => setInSuccessMsg(''), 3000);
                        } else {
                          alert(`Produk dengan barcode "${scanBarcodeIn}" tidak ditemukan.`);
                        }
                      }
                    }}
                    placeholder="Scan atau ketik barcode lalu Enter..."
                    className="flex-1 px-3 py-1.5 bg-white border border-neutral-200 rounded-lg text-xs font-mono focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const found = products.find(
                        (p) => p.sku.toLowerCase() === scanBarcodeIn.trim().toLowerCase()
                      );
                      if (found) {
                        handleInProductChange(found.id);
                        setScanBarcodeIn('');
                        setInSuccessMsg(`Produk "${found.name}" terpilih via scan!`);
                        setTimeout(() => setInSuccessMsg(''), 3000);
                      } else {
                        alert(`Produk dengan barcode "${scanBarcodeIn}" tidak ditemukan.`);
                      }
                    }}
                    className="px-3 py-1.5 bg-neutral-900 hover:bg-neutral-800 text-white rounded-lg text-xs font-semibold cursor-pointer"
                  >
                    Cari
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">
                  Pilih Produk:
                </label>
                <select
                  value={inProductId}
                  onChange={(e) => handleInProductChange(e.target.value)}
                  className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-1 focus:ring-neutral-900"
                >
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} (Stok Saat Ini: {p.stock} {p.unit})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1">
                    Jumlah Masuk:
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={inQty}
                    onChange={(e) => setInQty(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-full px-3 py-2 border border-neutral-200 rounded-xl text-xs font-mono font-bold focus:outline-none focus:ring-1 focus:ring-neutral-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1">
                    Harga Beli / Modal Satuan (Rp):
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={inCostPrice}
                    onChange={(e) => setInCostPrice(Math.max(0, parseInt(e.target.value) || 0))}
                    className="w-full px-3 py-2 border border-neutral-200 rounded-xl text-xs font-mono font-bold focus:outline-none focus:ring-1 focus:ring-neutral-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1">
                    Nama Supplier / Distributor:
                  </label>
                  <input
                    type="text"
                    value={inSupplier}
                    onChange={(e) => setInSupplier(e.target.value)}
                    placeholder="Contoh: PT Beras Nusantara"
                    className="w-full px-3 py-2 border border-neutral-200 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-neutral-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1">
                    Catatan / Nomor Faktur:
                  </label>
                  <input
                    type="text"
                    value={inNotes}
                    onChange={(e) => setInNotes(e.target.value)}
                    placeholder="Contoh: PO-8921 / Kiriman Sore"
                    className="w-full px-3 py-2 border border-neutral-200 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-neutral-900"
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>Simpan Barang Masuk</span>
                </button>
              </div>
            </form>
          </div>

          {/* Quick Info Sidecard */}
          <div className="lg:col-span-5 bg-neutral-50 border border-neutral-200 rounded-2xl p-5 space-y-3">
            <h3 className="text-xs font-bold text-neutral-800 uppercase tracking-wider">
              Panduan Barang Masuk
            </h3>
            <ul className="text-xs text-neutral-600 space-y-2 list-disc list-inside">
              <li>
                Stok produk akan <strong>otomatis bertambah</strong> begitu disimpan.
              </li>
              <li>
                Harga modal (HPP) produk di sistem akan disesuaikan dengan nilai terbaru yang Anda masukkan.
              </li>
              <li>
                Setiap mutasi masuk dicatat dalam audit log permanen lengkap dengan nama operator, tanggal, dan faktur.
              </li>
            </ul>
          </div>
        </div>
      )}

      {/* Tab 2: Input Barang Keluar */}
      {activeSubTab === 'keluar' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-7 bg-white border border-neutral-200 rounded-2xl p-6 shadow-xs">
            <div className="flex items-center gap-2 mb-4 pb-3 border-b border-neutral-100">
              <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
                <ArrowUpRight className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-neutral-900">
                  Formulir Barang Keluar (Non-Penjualan)
                </h2>
                <p className="text-xs text-neutral-500">
                  Catat pengurangan stok akibat barang rusak, expired, retur ke pabrik, atau pemakaian toko
                </p>
              </div>
            </div>

            {outSuccessMsg && (
              <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs font-semibold text-rose-800 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{outSuccessMsg}</span>
              </div>
            )}

            <form onSubmit={handleStockOutSubmit} className="space-y-4">
              <div className="bg-neutral-50 p-2.5 rounded-xl border border-neutral-200">
                <label className="block text-[11px] font-bold text-neutral-700 mb-1 flex items-center gap-1.5">
                  <Barcode className="w-3.5 h-3.5 text-neutral-600" />
                  <span>Scan Barcode / SKU Cepat:</span>
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={scanBarcodeOut}
                    onChange={(e) => setScanBarcodeOut(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        const found = products.find(
                          (p) => p.sku.toLowerCase() === scanBarcodeOut.trim().toLowerCase()
                        );
                        if (found) {
                          setOutProductId(found.id);
                          setScanBarcodeOut('');
                        } else {
                          alert(`Produk dengan barcode "${scanBarcodeOut}" tidak ditemukan.`);
                        }
                      }
                    }}
                    placeholder="Scan atau ketik barcode lalu Enter..."
                    className="flex-1 px-3 py-1.5 bg-white border border-neutral-200 rounded-lg text-xs font-mono focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const found = products.find(
                        (p) => p.sku.toLowerCase() === scanBarcodeOut.trim().toLowerCase()
                      );
                      if (found) {
                        setOutProductId(found.id);
                        setScanBarcodeOut('');
                      } else {
                        alert(`Produk dengan barcode "${scanBarcodeOut}" tidak ditemukan.`);
                      }
                    }}
                    className="px-3 py-1.5 bg-neutral-900 hover:bg-neutral-800 text-white rounded-lg text-xs font-semibold cursor-pointer"
                  >
                    Cari
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">
                  Pilih Produk:
                </label>
                <select
                  value={outProductId}
                  onChange={(e) => setOutProductId(e.target.value)}
                  className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-1 focus:ring-neutral-900"
                >
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} (Stok Saat Ini: {p.stock} {p.unit})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1">
                    Jumlah Keluar:
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={outQty}
                    onChange={(e) => setOutQty(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-full px-3 py-2 border border-neutral-200 rounded-xl text-xs font-mono font-bold focus:outline-none focus:ring-1 focus:ring-neutral-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1">
                    Alasan Pengeluaran:
                  </label>
                  <select
                    value={outReason}
                    onChange={(e) => setOutReason(e.target.value as StockReason)}
                    className="w-full px-3 py-2 border border-neutral-200 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-neutral-900"
                  >
                    <option value="rusak_kadaluarsa">Barang Rusak / Pecah / Expired</option>
                    <option value="retur_supplier">Retur ke Supplier / Pemasok</option>
                    <option value="keperluan_toko">Keperluan Operasional Toko</option>
                    <option value="koreksi_stok">Penyesuaian Fisik / Selisih Opname</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">
                  Keterangan / Catatan Detail:
                </label>
                <textarea
                  rows={3}
                  value={outNotes}
                  onChange={(e) => setOutNotes(e.target.value)}
                  placeholder="Contoh: Kemasan sobek saat pemindahan rak gudang..."
                  className="w-full px-3 py-2 border border-neutral-200 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-neutral-900"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-3 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2"
                >
                  <MinusCircle className="w-4 h-4" />
                  <span>Catat Barang Keluar</span>
                </button>
              </div>
            </form>
          </div>

          <div className="lg:col-span-5 bg-neutral-50 border border-neutral-200 rounded-2xl p-5 space-y-3">
            <h3 className="text-xs font-bold text-neutral-800 uppercase tracking-wider">
              Perhatian Barang Keluar
            </h3>
            <p className="text-xs text-neutral-600 leading-relaxed">
              Pengeluaran barang di halaman ini dikhususkan untuk kejadian non-penjualan.
            </p>
            <p className="text-xs text-neutral-600 leading-relaxed">
              Untuk transaksi penjualan biasa kepada pembeli/pelanggan, gunakan menu{' '}
              <strong>Kasir POS</strong> karena sistem akan otomatis memotong stok dan mencetak struk secara otomatis.
            </p>
          </div>
        </div>
      )}

      {/* Tab 3: Status Stok & Peringatan Stok Menipis */}
      {activeSubTab === 'status' && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3 border border-neutral-200 rounded-xl">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-neutral-700">Filter Status:</span>
              <div className="flex p-0.5 bg-neutral-100 rounded-lg border border-neutral-200 text-xs">
                {(['semua', 'menipis', 'habis'] as const).map((filter) => (
                  <button
                    key={filter}
                    type="button"
                    onClick={() => setStockStatusFilter(filter)}
                    className={`px-3 py-1 font-semibold rounded-md capitalize transition-all ${
                      stockStatusFilter === filter
                        ? 'bg-white text-neutral-900 shadow-xs'
                        : 'text-neutral-500 hover:text-neutral-800'
                    }`}
                  >
                    {filter === 'menipis' ? 'Stok Menipis' : filter}
                  </button>
                ))}
              </div>
            </div>

            <div className="text-xs text-neutral-500">
              Menampilkan {filteredStockProducts.length} dari {products.length} produk
            </div>
          </div>

          <div className="bg-white border border-neutral-200 rounded-2xl overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-neutral-50 border-b border-neutral-200 text-neutral-600 font-semibold">
                  <tr>
                    <th className="py-3 px-4">Nama Produk</th>
                    <th className="py-3 px-4">Kategori</th>
                    <th className="py-3 px-4">Harga Modal (HPP)</th>
                    <th className="py-3 px-4">Harga Ecer / Grosir</th>
                    <th className="py-3 px-4 text-center">Stok Fisik</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Aksi Cepat</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {filteredStockProducts.map((p) => {
                    const isOutOfStock = p.stock <= 0;
                    const isLow = p.stock > 0 && p.stock <= p.minStockAlert;

                    return (
                      <tr key={p.id} className="hover:bg-neutral-50/80 transition-colors">
                        <td className="py-3 px-4 font-semibold text-neutral-900">
                          <div>{p.name}</div>
                          <span className="text-[10px] font-mono text-neutral-400">{p.sku}</span>
                        </td>
                        <td className="py-3 px-4 text-neutral-600">{p.category}</td>
                        <td className="py-3 px-4 font-mono text-neutral-600">
                          {formatRupiah(p.costPrice)}
                        </td>
                        <td className="py-3 px-4 font-mono">
                          <div>{formatRupiah(p.retailPrice)} (Ecer)</div>
                          <div className="text-neutral-500 text-[10px]">
                            {formatRupiah(p.wholesalePrice)} (Grosir)
                          </div>
                        </td>
                        <td className="py-3 px-4 text-center font-mono font-bold text-sm">
                          {p.stock} <span className="text-xs font-normal text-neutral-500">{p.unit}</span>
                        </td>
                        <td className="py-3 px-4">
                          {isOutOfStock ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800">
                              <AlertTriangle className="w-3 h-3" /> Habis
                            </span>
                          ) : isLow ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                              <AlertTriangle className="w-3 h-3" /> Menipis (Min: {p.minStockAlert})
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-50 text-emerald-700">
                              Aman
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            type="button"
                            onClick={() => {
                              handleInProductChange(p.id);
                              setActiveSubTab('masuk');
                            }}
                            className="px-2.5 py-1 text-xs font-semibold bg-neutral-900 hover:bg-neutral-800 text-white rounded-lg transition-colors"
                          >
                            + Restock
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: Riwayat Mutasi Stok (Audit Trail) */}
      {activeSubTab === 'riwayat' && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3 border border-neutral-200 rounded-xl">
            <div className="flex items-center gap-3">
              <input
                type="text"
                value={historySearch}
                onChange={(e) => setHistorySearch(e.target.value)}
                placeholder="Cari barang atau catatan mutasi..."
                className="px-3 py-1.5 border border-neutral-200 rounded-lg text-xs w-64 focus:outline-none focus:ring-1 focus:ring-neutral-900"
              />

              <div className="flex p-0.5 bg-neutral-100 rounded-lg border border-neutral-200 text-xs">
                {(['semua', 'masuk', 'keluar'] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setHistoryFilterType(t)}
                    className={`px-3 py-1 font-semibold rounded-md capitalize transition-all ${
                      historyFilterType === t
                        ? 'bg-white text-neutral-900 shadow-xs'
                        : 'text-neutral-500 hover:text-neutral-800'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            <div className="text-xs text-neutral-500">
              Total {filteredMovements.length} catatan mutasi
            </div>
          </div>

          <div className="bg-white border border-neutral-200 rounded-2xl overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-neutral-50 border-b border-neutral-200 text-neutral-600 font-semibold">
                  <tr>
                    <th className="py-3 px-4">Waktu</th>
                    <th className="py-3 px-4">Produk</th>
                    <th className="py-3 px-4">Tipe Mutasi</th>
                    <th className="py-3 px-4">Jumlah</th>
                    <th className="py-3 px-4">Perubahan Stok</th>
                    <th className="py-3 px-4">Keterangan / Alasan</th>
                    <th className="py-3 px-4">Operator</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {filteredMovements.map((mov) => {
                    const isMasuk = mov.type === 'masuk';

                    return (
                      <tr key={mov.id} className="hover:bg-neutral-50/80 transition-colors">
                        <td className="py-3 px-4 text-neutral-500 whitespace-nowrap">
                          {formatDateTime(mov.timestamp)}
                        </td>
                        <td className="py-3 px-4 font-semibold text-neutral-900">
                          {mov.productName}
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold ${
                              isMasuk
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : 'bg-rose-50 text-rose-700 border border-rose-200'
                            }`}
                          >
                            {isMasuk ? (
                              <ArrowDownLeft className="w-3 h-3" />
                            ) : (
                              <ArrowUpRight className="w-3 h-3" />
                            )}
                            {isMasuk ? 'Masuk' : 'Keluar'}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-mono font-bold">
                          <span className={isMasuk ? 'text-emerald-700' : 'text-rose-700'}>
                            {isMasuk ? `+${mov.qty}` : `-${mov.qty}`}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-mono text-neutral-500">
                          {mov.previousStock} → <strong className="text-neutral-900">{mov.newStock}</strong>
                        </td>
                        <td className="py-3 px-4 text-neutral-600 max-w-xs">
                          <div className="font-medium text-neutral-800">
                            {reasonLabels[mov.reason] || mov.reason}
                          </div>
                          {mov.notes && (
                            <div className="text-[11px] text-neutral-500 truncate">{mov.notes}</div>
                          )}
                          {mov.supplier && (
                            <div className="text-[10px] text-neutral-400">Pemasok: {mov.supplier}</div>
                          )}
                        </td>
                        <td className="py-3 px-4 text-neutral-500">{mov.operator}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
