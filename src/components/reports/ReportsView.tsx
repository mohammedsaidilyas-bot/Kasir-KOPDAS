import React, { useState } from 'react';
import {
  TrendingUp,
  DollarSign,
  Package,
  Layers,
  ShoppingBag,
  Download,
  Calendar,
  PieChart,
  Send,
} from 'lucide-react';
import { usePos } from '../../context/PosContext';
import {
  formatRupiah,
  formatNumber,
  generateMonthlyReportText,
  formatWhatsAppUrl,
} from '../../utils/formatters';
import { ClosingStoreModal } from '../pos/ClosingStoreModal';

export const ReportsView: React.FC = () => {
  const { transactions, products, settings, currentUserName } = usePos();
  const [isClosingModalOpen, setIsClosingModalOpen] = useState(false);

  // Filter States
  const [filterType, setFilterType] = useState<'all' | 'daily' | 'monthly'>('all');
  const [selectedDay, setSelectedDay] = useState<string>(new Date().toISOString().slice(0, 10));
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());

  const MONTHS_ID = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];

  // Filtering Logic over transactions
  const filteredTransactions = transactions.filter((t) => {
    if (filterType === 'daily') {
      return t.timestamp.slice(0, 10) === selectedDay;
    }
    if (filterType === 'monthly') {
      const tDate = new Date(t.timestamp);
      return (
        tDate.getMonth() === selectedMonth &&
        tDate.getFullYear() === selectedYear
      );
    }
    return true; // 'all'
  });

  // Metrics computation based on filtered transactions
  const totalRevenue = filteredTransactions.reduce((acc, t) => acc + t.grandTotal, 0);

  // Compute Cost of Goods Sold (COGS / HPP) & Net Profit
  let totalHpp = 0;
  filteredTransactions.forEach((trx) => {
    trx.items.forEach((item) => {
      totalHpp += item.product.costPrice * item.qty;
    });
  });

  const grossProfit = totalRevenue - totalHpp;
  const profitMargin = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0;
  const totalItemsSold = filteredTransactions.reduce((acc, t) => acc + t.totalQty, 0);

  // Grosir vs Eceran breakdown
  const grosirRevenue = filteredTransactions
    .filter((t) => t.customerType === 'grosir')
    .reduce((acc, t) => acc + t.grandTotal, 0);
  const ecerRevenue = filteredTransactions
    .filter((t) => t.customerType === 'ecer')
    .reduce((acc, t) => acc + t.grandTotal, 0);

  // Top selling products computation
  const productSalesMap: Record<
    string,
    { name: string; category: string; qty: number; totalSales: number; profit: number }
  > = {};

  filteredTransactions.forEach((trx) => {
    trx.items.forEach((item) => {
      const pid = item.product.id;
      if (!productSalesMap[pid]) {
        productSalesMap[pid] = {
          name: item.product.name,
          category: item.product.category,
          qty: 0,
          totalSales: 0,
          profit: 0,
        };
      }
      productSalesMap[pid].qty += item.qty;
      productSalesMap[pid].totalSales += item.subtotal;
      productSalesMap[pid].profit += (item.appliedPrice - item.product.costPrice) * item.qty;
    });
  });

  const topProducts = Object.values(productSalesMap).sort((a, b) => b.qty - a.qty);

  // Export CSV
  const handleExportCSV = () => {
    const headers = ['No Struk', 'Waktu', 'Kasir', 'Tipe Penjualan', 'Metode Bayar', 'Total Tagihan'];
    const rows = filteredTransactions.map((t) => [
      t.id,
      t.timestamp,
      t.cashierName,
      t.customerType,
      t.paymentMethod,
      t.grandTotal,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    const filename = filterType === 'daily'
      ? `laporan_penjualan_harian_${selectedDay}.csv`
      : filterType === 'monthly'
      ? `laporan_penjualan_bulanan_${MONTHS_ID[selectedMonth]}_${selectedYear}.csv`
      : `laporan_penjualan_semua_waktu.csv`;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // WhatsApp Monthly Report trigger
  const handleSendMonthlyReportWA = () => {
    const reportText = generateMonthlyReportText(
      filteredTransactions,
      settings,
      currentUserName,
      MONTHS_ID[selectedMonth],
      selectedYear
    );
    const waUrl = formatWhatsAppUrl(settings.adminWaPhone || '085704800313', reportText);
    window.open(waUrl, '_blank');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-200 pb-4">
        <div>
          <h1 className="text-xl font-bold text-neutral-900 tracking-tight">
            Laporan Penjualan & Analisis Keuntungan
          </h1>
          <p className="text-xs text-neutral-500 mt-0.5">
            Ringkasan omzet, laba bersih (profit), dan produk terlaris grosir & eceran.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setIsClosingModalOpen(true)}
            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-xl shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Kirim Rekap Tutup Toko (Harian) ke WA</span>
          </button>

          <button
            type="button"
            onClick={handleExportCSV}
            className="px-3.5 py-2 bg-neutral-900 hover:bg-neutral-800 text-white font-semibold text-xs rounded-xl shadow-xs flex items-center gap-1.5 transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-emerald-400" />
            <span>Ekspor CSV</span>
          </button>
        </div>
      </div>

      {/* Filter Periode Laporan Toolbar */}
      <div className="bg-white border border-neutral-200 rounded-2xl p-4 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 shadow-2xs">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold text-neutral-700 uppercase tracking-wider block mr-2">
            Periode Laporan:
          </span>
          <div className="inline-flex rounded-xl p-1 bg-neutral-100 border border-neutral-200">
            <button
              type="button"
              onClick={() => setFilterType('all')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                filterType === 'all'
                  ? 'bg-neutral-900 text-white shadow-xs'
                  : 'text-neutral-500 hover:text-neutral-950'
              }`}
            >
              Semua Waktu
            </button>
            <button
              type="button"
              onClick={() => setFilterType('daily')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                filterType === 'daily'
                  ? 'bg-neutral-900 text-white shadow-xs'
                  : 'text-neutral-500 hover:text-neutral-950'
              }`}
            >
              Harian
            </button>
            <button
              type="button"
              onClick={() => setFilterType('monthly')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                filterType === 'monthly'
                  ? 'bg-neutral-900 text-white shadow-xs'
                  : 'text-neutral-500 hover:text-neutral-950'
              }`}
            >
              Bulanan
            </button>
          </div>
        </div>

        {/* Conditional Controls for Day / Month selection */}
        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
          {filterType === 'daily' && (
            <div className="flex items-center gap-1.5 w-full sm:w-auto">
              <span className="text-xs font-semibold text-neutral-500">Pilih Tanggal:</span>
              <input
                type="date"
                value={selectedDay}
                onChange={(e) => setSelectedDay(e.target.value)}
                className="px-3 py-2 border border-neutral-300 rounded-xl text-xs font-mono font-semibold focus:outline-none focus:ring-1 focus:ring-neutral-950 bg-white"
              />
            </div>
          )}

          {filterType === 'monthly' && (
            <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-semibold text-neutral-500">Bulan:</span>
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                  className="px-3 py-2 border border-neutral-300 rounded-xl text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-neutral-950 bg-white cursor-pointer"
                >
                  {MONTHS_ID.map((name, index) => (
                    <option key={index} value={index}>
                      {name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-1.5">
                <span className="text-xs font-semibold text-neutral-500">Tahun:</span>
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                  className="px-3 py-2 border border-neutral-300 rounded-xl text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-neutral-950 bg-white cursor-pointer"
                >
                  {[2024, 2025, 2026, 2027, 2028].map((year) => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="button"
                onClick={handleSendMonthlyReportWA}
                className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Send className="w-3.5 h-3.5 text-white" />
                <span>Kirim Rekap Bulanan ke WA</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-neutral-200 rounded-2xl p-5 shadow-2xs">
          <span className="text-xs font-semibold text-neutral-500 uppercase tracking-wider block">
            Total Omzet Penjualan
          </span>
          <div className="text-2xl font-bold font-mono text-neutral-900 mt-1">
            {formatRupiah(totalRevenue)}
          </div>
          <span className="text-[11px] text-neutral-500 mt-1 block">
            Dari {filteredTransactions.length} transaksi selesai
          </span>
        </div>

        <div className="bg-white border border-neutral-200 rounded-2xl p-5 shadow-2xs">
          <span className="text-xs font-semibold text-neutral-500 uppercase tracking-wider block">
            Laba Bersih (Estimasi Margin)
          </span>
          <div className="text-2xl font-bold font-mono text-emerald-700 mt-1">
            {formatRupiah(grossProfit)}
          </div>
          <span className="text-[11px] text-emerald-600 font-semibold mt-1 block">
            Margin Keuntungan {profitMargin.toFixed(1)}%
          </span>
        </div>

        <div className="bg-white border border-neutral-200 rounded-2xl p-5 shadow-2xs">
          <span className="text-xs font-semibold text-neutral-500 uppercase tracking-wider block">
            Barang Terjual
          </span>
          <div className="text-2xl font-bold font-mono text-neutral-900 mt-1">
            {totalItemsSold} item
          </div>
          <span className="text-[11px] text-neutral-500 mt-1 block">
            Rata-rata {(totalItemsSold / (filteredTransactions.length || 1)).toFixed(1)} item/struk
          </span>
        </div>

        <div className="bg-white border border-neutral-200 rounded-2xl p-5 shadow-2xs">
          <span className="text-xs font-semibold text-neutral-500 uppercase tracking-wider block">
            Total Modal Produk (HPP)
          </span>
          <div className="text-2xl font-bold font-mono text-neutral-600 mt-1">
            {formatRupiah(totalHpp)}
          </div>
          <span className="text-[11px] text-neutral-500 mt-1 block">
            Beban pokok pengadaan barang
          </span>
        </div>
      </div>

      {/* Grosir vs Eceran Revenue Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="bg-white border border-neutral-200 rounded-2xl p-5 shadow-2xs space-y-4">
          <h2 className="text-sm font-bold text-neutral-900 flex items-center gap-2">
            <Layers className="w-4 h-4 text-emerald-600" />
            <span>Distribusi Penjualan: Grosir vs Eceran</span>
          </h2>

          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="font-semibold text-neutral-700">Penjualan Grosir</span>
                <span className="font-mono font-bold">{formatRupiah(grosirRevenue)}</span>
              </div>
              <div className="w-full bg-neutral-100 rounded-full h-2.5 overflow-hidden">
                <div
                  className="bg-emerald-600 h-2.5 rounded-full"
                  style={{
                    width: totalRevenue > 0 ? `${(grosirRevenue / totalRevenue) * 100}%` : '0%',
                  }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="font-semibold text-neutral-700">Penjualan Eceran</span>
                <span className="font-mono font-bold">{formatRupiah(ecerRevenue)}</span>
              </div>
              <div className="w-full bg-neutral-100 rounded-full h-2.5 overflow-hidden">
                <div
                  className="bg-neutral-800 h-2.5 rounded-full"
                  style={{
                    width: totalRevenue > 0 ? `${(ecerRevenue / totalRevenue) * 100}%` : '0%',
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white border border-neutral-200 rounded-2xl p-5 shadow-2xs space-y-3">
          <h2 className="text-sm font-bold text-neutral-900 flex items-center gap-2">
            <PieChart className="w-4 h-4 text-blue-600" />
            <span>Kinerja Kasir & Toko</span>
          </h2>
          <div className="text-xs text-neutral-600 space-y-2">
            <div className="flex justify-between py-1.5 border-b border-neutral-100">
              <span>Rata-rata Nilai Belanja Per Struk (AOV):</span>
              <strong className="font-mono text-neutral-900">
                {formatRupiah(totalRevenue / (filteredTransactions.length || 1))}
              </strong>
            </div>
            <div className="flex justify-between py-1.5 border-b border-neutral-100">
              <span>Metode Pembayaran Paling Sering:</span>
              <strong className="text-neutral-900 uppercase">
                {filteredTransactions.length > 0 ? filteredTransactions[0].paymentMethod : '-'}
              </strong>
            </div>
            <div className="flex justify-between py-1.5">
              <span>Stok Produk Menipis Saat Ini:</span>
              <strong className="text-amber-700 font-bold">
                {products.filter((p) => p.stock <= p.minStockAlert).length} Produk
              </strong>
            </div>
          </div>
        </div>
      </div>

      {/* Top Selling Products Table */}
      <div className="bg-white border border-neutral-200 rounded-2xl overflow-hidden shadow-xs">
        <div className="p-4 border-b border-neutral-100 bg-neutral-50/70">
          <h2 className="text-sm font-bold text-neutral-900 flex items-center gap-2">
            <ShoppingBag className="w-4 h-4 text-neutral-700" />
            <span>Peringkat Produk Terlaris</span>
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-neutral-50 border-b border-neutral-200 text-neutral-600 font-semibold">
              <tr>
                <th className="py-3 px-4 text-center w-12">#</th>
                <th className="py-3 px-4">Nama Produk</th>
                <th className="py-3 px-4">Kategori</th>
                <th className="py-3 px-4 text-center">Jumlah Terjual</th>
                <th className="py-3 px-4 text-right">Total Penjualan</th>
                <th className="py-3 px-4 text-right">Kontribusi Laba</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {topProducts.map((item, index) => (
                <tr key={index} className="hover:bg-neutral-50/80 transition-colors">
                  <td className="py-3 px-4 text-center font-bold font-mono text-neutral-400">
                    {index + 1}
                  </td>
                  <td className="py-3 px-4 font-semibold text-neutral-900">{item.name}</td>
                  <td className="py-3 px-4 text-neutral-600">{item.category}</td>
                  <td className="py-3 px-4 text-center font-mono font-bold">{item.qty} unit</td>
                  <td className="py-3 px-4 text-right font-mono font-bold text-neutral-900">
                    {formatRupiah(item.totalSales)}
                  </td>
                  <td className="py-3 px-4 text-right font-mono font-bold text-emerald-700">
                    +{formatRupiah(item.profit)}
                  </td>
                </tr>
              ))}

              {topProducts.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-xs text-neutral-500">
                    Belum ada data transaksi untuk menyusun peringkat produk terlaris.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Closing Store Modal */}
      <ClosingStoreModal
        isOpen={isClosingModalOpen}
        onClose={() => setIsClosingModalOpen(false)}
      />
    </div>
  );
};
