import React, { useState } from 'react';
import {
  Receipt,
  Search,
  Printer,
  Calendar,
  CreditCard,
  Banknote,
  QrCode,
  Layers,
  ChevronRight,
  Trash2,
} from 'lucide-react';
import { usePos } from '../../context/PosContext';
import { SaleTransaction, PaymentMethod, PriceType } from '../../types';
import {
  formatRupiah,
  formatDateTime,
  formatNumber,
} from '../../utils/formatters';
import { ReceiptModal } from '../pos/ReceiptModal';

export const TransactionHistoryView: React.FC = () => {
  const { transactions, currentRole, deleteTransaction } = usePos();

  const [search, setSearch] = useState('');
  const [filterMethod, setFilterMethod] = useState<string>('semua');
  const [filterType, setFilterType] = useState<string>('semua');
  const [selectedTrx, setSelectedTrx] = useState<SaleTransaction | null>(null);
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);

  // Filter transactions
  const filtered = transactions.filter((trx) => {
    const matchMethod = filterMethod === 'semua' || trx.paymentMethod === filterMethod;
    const matchType = filterType === 'semua' || trx.customerType === filterType;
    const q = search.toLowerCase();
    const matchQuery =
      !q ||
      trx.id.toLowerCase().includes(q) ||
      (trx.customerName && trx.customerName.toLowerCase().includes(q)) ||
      trx.cashierName.toLowerCase().includes(q);
    return matchMethod && matchType && matchQuery;
  });

  // Calculate quick metrics
  const totalOmzet = filtered.reduce((acc, t) => acc + t.grandTotal, 0);
  const totalCash = filtered
    .filter((t) => t.paymentMethod === 'tunai')
    .reduce((acc, t) => acc + t.grandTotal, 0);
  const totalNonCash = filtered
    .filter((t) => t.paymentMethod !== 'tunai')
    .reduce((acc, t) => acc + t.grandTotal, 0);

  const handleOpenReceipt = (trx: SaleTransaction) => {
    setSelectedTrx(trx);
    setIsReceiptOpen(true);
  };

  const methodIcons: Record<PaymentMethod, React.ReactNode> = {
    tunai: <Banknote className="w-3.5 h-3.5 text-emerald-600" />,
    qris: <QrCode className="w-3.5 h-3.5 text-blue-600" />,
    transfer: <CreditCard className="w-3.5 h-3.5 text-purple-600" />,
    debit: <CreditCard className="w-3.5 h-3.5 text-amber-600" />,
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      <div className="border-b border-neutral-200 pb-4">
        <h1 className="text-xl font-bold text-neutral-900 tracking-tight">
          Riwayat Transaksi Penjualan & Cetak Ulang Struk
        </h1>
        <p className="text-xs text-neutral-500 mt-0.5">
          Semua struk transaksi penjualan kasir tersimpan dan dapat dicetak kembali kapan saja.
        </p>
      </div>

      {/* Metric Cards Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white border border-neutral-200 rounded-2xl p-4 shadow-2xs">
          <span className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider block">
            Total Transaksi
          </span>
          <span className="text-xl font-bold font-mono text-neutral-900 mt-1 block">
            {filtered.length} struk
          </span>
        </div>

        <div className="bg-white border border-neutral-200 rounded-2xl p-4 shadow-2xs">
          <span className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider block">
            Total Omzet Penjualan
          </span>
          <span className="text-xl font-bold font-mono text-emerald-700 mt-1 block">
            {formatRupiah(totalOmzet)}
          </span>
        </div>

        <div className="bg-white border border-neutral-200 rounded-2xl p-4 shadow-2xs">
          <span className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider block">
            Penerimaan Tunai
          </span>
          <span className="text-xl font-bold font-mono text-neutral-900 mt-1 block">
            {formatRupiah(totalCash)}
          </span>
        </div>

        <div className="bg-white border border-neutral-200 rounded-2xl p-4 shadow-2xs">
          <span className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider block">
            Penerimaan Non-Tunai
          </span>
          <span className="text-xl font-bold font-mono text-blue-700 mt-1 block">
            {formatRupiah(totalNonCash)}
          </span>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3 border border-neutral-200 rounded-xl">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari no. struk / pembeli..."
              className="pl-8 pr-3 py-1.5 border border-neutral-200 rounded-lg text-xs w-56 focus:outline-none focus:ring-1 focus:ring-neutral-900"
            />
          </div>

          <select
            value={filterMethod}
            onChange={(e) => setFilterMethod(e.target.value)}
            className="px-3 py-1.5 border border-neutral-200 rounded-lg text-xs bg-white focus:outline-none focus:ring-1 focus:ring-neutral-900"
          >
            <option value="semua">Semua Pembayaran</option>
            <option value="tunai">Tunai (Cash)</option>
            <option value="qris">QRIS</option>
            <option value="transfer">Transfer Bank</option>
            <option value="debit">Kartu Debit/EDC</option>
          </select>

          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-3 py-1.5 border border-neutral-200 rounded-lg text-xs bg-white focus:outline-none focus:ring-1 focus:ring-neutral-900"
          >
            <option value="semua">Semua Jenis Penjualan</option>
            <option value="ecer">Eceran</option>
            <option value="grosir">Grosir</option>
          </select>
        </div>

        <div className="text-xs text-neutral-500">
          Menampilkan {filtered.length} transaksi
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-white border border-neutral-200 rounded-2xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-neutral-50 border-b border-neutral-200 text-neutral-600 font-semibold">
              <tr>
                <th className="py-3 px-4">No. Struk & Waktu</th>
                <th className="py-3 px-4">Kasir</th>
                <th className="py-3 px-4">Pelanggan</th>
                <th className="py-3 px-4">Jenis Jual</th>
                <th className="py-3 px-4">Jumlah Item</th>
                <th className="py-3 px-4">Metode Bayar</th>
                <th className="py-3 px-4 text-right">Total Transaksi</th>
                <th className="py-3 px-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {filtered.map((trx) => (
                <tr
                  key={trx.id}
                  onClick={() => handleOpenReceipt(trx)}
                  className="hover:bg-neutral-50/80 transition-colors cursor-pointer"
                >
                  <td className="py-3.5 px-4">
                    <span className="font-mono font-bold text-neutral-900 block">
                      {trx.id}
                    </span>
                    <span className="text-[10px] text-neutral-400">
                      {formatDateTime(trx.timestamp)}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 font-medium text-neutral-700">{trx.cashierName}</td>
                  <td className="py-3.5 px-4 text-neutral-600">
                    {trx.customerName || <span className="text-neutral-400">Pelanggan Umum</span>}
                  </td>
                  <td className="py-3.5 px-4">
                    <span
                      className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                        trx.customerType === 'grosir'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-neutral-100 text-neutral-600'
                      }`}
                    >
                      {trx.customerType === 'grosir' ? 'GROSIR' : 'ECERAN'}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 font-mono">
                    {trx.totalQty} item ({trx.items.length} macam)
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="inline-flex items-center gap-1.5 font-medium uppercase text-[11px] text-neutral-800">
                      {methodIcons[trx.paymentMethod]}
                      {trx.paymentMethod}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right font-mono font-bold text-sm text-neutral-900">
                    {formatRupiah(trx.grandTotal)}
                  </td>
                  <td className="py-3.5 px-4 text-center space-x-1.5 whitespace-nowrap">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenReceipt(trx);
                      }}
                      className="px-2.5 py-1 text-xs font-semibold bg-neutral-100 hover:bg-neutral-900 hover:text-white rounded-lg transition-colors inline-flex items-center gap-1 cursor-pointer"
                    >
                      <Printer className="w-3 h-3" />
                      <span>Cetak</span>
                    </button>

                    {currentRole === 'admin' && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (
                            confirm(
                              `Apakah Anda yakin ingin menghapus struk ${trx.id} secara permanen?\n\nPERINGATAN: Stok sebanyak ${trx.totalQty} barang dalam transaksi ini akan dikembalikan otomatis ke inventaris!`
                            )
                          ) {
                            deleteTransaction(trx.id);
                          }
                        }}
                        className="px-2.5 py-1 text-xs font-semibold bg-rose-50 text-rose-700 hover:bg-rose-600 hover:text-white rounded-lg transition-colors inline-flex items-center gap-1 cursor-pointer"
                        title="Hapus struk transaksi & kembalikan stok"
                      >
                        <Trash2 className="w-3 h-3" />
                        <span>Hapus</span>
                      </button>
                    )}
                  </td>
                </tr>
              ))}

              {filtered.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-xs text-neutral-500">
                    Belum ada riwayat transaksi yang cocok dengan filter yang dipilih.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Receipt Modal for Viewing/Reprinting */}
      <ReceiptModal
        transaction={selectedTrx}
        isOpen={isReceiptOpen}
        onClose={() => setIsReceiptOpen(false)}
      />
    </div>
  );
};
