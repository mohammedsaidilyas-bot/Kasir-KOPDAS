import React, { useState } from 'react';
import {
  X,
  Share2,
  Copy,
  Printer,
  Check,
  Building,
  TrendingUp,
  Banknote,
  Layers,
  Sparkles,
  Phone,
  MessageSquare,
  AlertCircle,
  LogOut,
  CheckCircle2,
} from 'lucide-react';
import { usePos } from '../../context/PosContext';
import {
  formatRupiah,
  formatDateTime,
  formatWhatsAppUrl,
  generateClosingReportText,
} from '../../utils/formatters';

interface ClosingStoreModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ClosingStoreModal: React.FC<ClosingStoreModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { transactions, settings, currentUserName, updateSettings, logout } = usePos();

  const [adminPhone, setAdminPhone] = useState(settings.adminWaPhone || '081234567890');
  const [initialFloat, setInitialFloat] = useState<number>(0);
  const [notes, setNotes] = useState('');
  const [copied, setCopied] = useState(false);
  const [isClosingSuccess, setIsClosingSuccess] = useState(false);

  if (!isOpen) return null;

  // Compute summary numbers
  const totalOmzet = transactions.reduce((sum, t) => sum + t.grandTotal, 0);

  let totalHpp = 0;
  transactions.forEach((trx) => {
    trx.items.forEach((item) => {
      totalHpp += item.product.costPrice * item.qty;
    });
  });

  const grossProfit = totalOmzet - totalHpp;
  const profitMargin = totalOmzet > 0 ? (grossProfit / totalOmzet) * 100 : 0;

  const totalCash = transactions
    .filter((t) => t.paymentMethod === 'tunai')
    .reduce((sum, t) => sum + t.grandTotal, 0);
  const totalNonCash = transactions
    .filter((t) => t.paymentMethod !== 'tunai')
    .reduce((sum, t) => sum + t.grandTotal, 0);

  const totalGrosir = transactions
    .filter((t) => t.customerType === 'grosir')
    .reduce((sum, t) => sum + t.grandTotal, 0);
  const totalEcer = transactions
    .filter((t) => t.customerType === 'ecer')
    .reduce((sum, t) => sum + t.grandTotal, 0);

  const handleSendWhatsAppAndExit = () => {
    // Save updated admin phone to settings
    if (adminPhone !== settings.adminWaPhone) {
      updateSettings({ adminWaPhone: adminPhone });
    }

    const reportText = generateClosingReportText(
      transactions,
      settings,
      currentUserName,
      initialFloat,
      notes
    );

    const waUrl = formatWhatsAppUrl(adminPhone, reportText);
    window.open(waUrl, '_blank');

    setIsClosingSuccess(true);
    // User requested: "di saat toko udh tutup dan selesai laporan maka aplikasi otomatis keluar"
    setTimeout(() => {
      onClose();
      logout();
    }, 1200);
  };

  const handleFinishAndExit = () => {
    setIsClosingSuccess(true);
    setTimeout(() => {
      onClose();
      logout();
    }, 800);
  };

  const handleCopyText = () => {
    const reportText = generateClosingReportText(
      transactions,
      settings,
      currentUserName,
      initialFloat,
      notes
    );
    navigator.clipboard.writeText(reportText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-neutral-200 w-full max-w-lg my-auto overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-neutral-100 flex items-center justify-between bg-neutral-900 text-white">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
              <Building className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold tracking-tight">
                Laporan Tutup Toko & Rekap Kasir
              </h2>
              <p className="text-xs text-neutral-400">
                Pemasukan, laba bersih, dan pengiriman otomatis ke WhatsApp Owner/Admin
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          {/* Key Financial Summary Cards */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-neutral-50 border border-neutral-200 rounded-xl p-3">
              <span className="text-[11px] font-semibold text-neutral-500 block">
                Total Pemasukan (Omzet)
              </span>
              <span className="text-lg font-bold font-mono text-neutral-900 mt-0.5 block">
                {formatRupiah(totalOmzet)}
              </span>
              <span className="text-[10px] text-neutral-400 block mt-0.5">
                {transactions.length} transaksi selesai
              </span>
            </div>

            <div className="bg-emerald-50/80 border border-emerald-200 rounded-xl p-3">
              <span className="text-[11px] font-semibold text-emerald-800 block">
                Estimasi Laba Bersih
              </span>
              <span className="text-lg font-bold font-mono text-emerald-700 mt-0.5 block">
                {formatRupiah(grossProfit)}
              </span>
              <span className="text-[10px] text-emerald-600 font-semibold block mt-0.5">
                Margin Keuntungan {profitMargin.toFixed(1)}%
              </span>
            </div>
          </div>

          {/* Breakdown: Cash vs Non-Cash */}
          <div className="bg-neutral-50 border border-neutral-200 rounded-xl p-3.5 space-y-2">
            <span className="text-xs font-bold text-neutral-800 flex items-center gap-1.5">
              <Banknote className="w-3.5 h-3.5 text-neutral-600" />
              <span>Rincian Pembayaran & Fisik Uang Kasir</span>
            </span>

            <div className="grid grid-cols-2 gap-2 text-xs pt-1">
              <div className="bg-white p-2.5 rounded-lg border border-neutral-200/80">
                <span className="text-[11px] text-neutral-500 block">Uang Tunai di Laci</span>
                <span className="font-mono font-bold text-neutral-900 text-sm">
                  {formatRupiah(totalCash)}
                </span>
              </div>

              <div className="bg-white p-2.5 rounded-lg border border-neutral-200/80">
                <span className="text-[11px] text-neutral-500 block">Non-Tunai (QRIS/EDC)</span>
                <span className="font-mono font-bold text-blue-700 text-sm">
                  {formatRupiah(totalNonCash)}
                </span>
              </div>
            </div>

            <div className="flex justify-between items-center text-xs text-neutral-600 pt-1 border-t border-neutral-200/60">
              <span>Penjualan Grosir: <strong>{formatRupiah(totalGrosir)}</strong></span>
              <span>Penjualan Ecer: <strong>{formatRupiah(totalEcer)}</strong></span>
            </div>
          </div>

          {/* Form Options for WhatsApp Report */}
          <div className="space-y-3 pt-1">
            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1 flex items-center justify-between">
                <span className="flex items-center gap-1">
                  <Phone className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Nomor WhatsApp Admin / Owner:</span>
                </span>
                <span className="text-[10px] text-neutral-400">Format: 08xx atau 628xx</span>
              </label>
              <input
                type="text"
                value={adminPhone}
                onChange={(e) => setAdminPhone(e.target.value)}
                placeholder="Contoh: 081234567890"
                className="w-full px-3 py-2 border border-neutral-300 rounded-xl text-xs font-mono font-semibold focus:outline-none focus:ring-1 focus:ring-neutral-900"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">
                  Modal Kas Awal di Laci (Opsional):
                </label>
                <input
                  type="number"
                  min="0"
                  value={initialFloat || ''}
                  onChange={(e) => setInitialFloat(Math.max(0, parseInt(e.target.value) || 0))}
                  placeholder="0"
                  className="w-full px-3 py-2 border border-neutral-300 rounded-xl text-xs font-mono focus:outline-none focus:ring-1 focus:ring-neutral-900"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">
                  Catatan Penutupan Kasir (Opsional):
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Contoh: Kas sesuai, laci rapi"
                  className="w-full px-3 py-2 border border-neutral-300 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-neutral-900"
                />
              </div>
            </div>
          </div>

          {/* Quick Preview Badge */}
          <div className="bg-emerald-50/70 border border-emerald-200 p-3 rounded-xl flex items-start gap-2 text-xs text-emerald-900">
            <Sparkles className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold block">Format Otomatis WhatsApp Siap Dikirim:</span>
              <p className="text-[11px] text-emerald-800/80 mt-0.5">
                Pesan WhatsApp akan merinci total omzet, laba bersih, penerimaan tunai, QRIS/debit, dan 3 produk terlaris hari ini secara otomatis.
              </p>
            </div>
          </div>

          {/* Closing Success Notice */}
          {isClosingSuccess && (
            <div className="bg-emerald-600 text-white p-3 rounded-xl flex items-center gap-2.5 text-xs font-semibold animate-in fade-in">
              <CheckCircle2 className="w-5 h-5 text-emerald-200 shrink-0" />
              <div>
                <span>Laporan Tutup Toko Selesai!</span>
                <p className="text-[11px] text-emerald-100 font-normal">
                  Aplikasi otomatis keluar dan kembali ke tampilan awal kode akses...
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-neutral-50 border-t border-neutral-200 space-y-2">
          {/* Primary WhatsApp Button with Auto Logout */}
          <button
            type="button"
            disabled={isClosingSuccess}
            onClick={handleSendWhatsAppAndExit}
            className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
          >
            <Share2 className="w-4 h-4" />
            <span>Kirim Laporan ke WhatsApp & Tutup Toko (Otomatis Keluar)</span>
          </button>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <button
              type="button"
              disabled={isClosingSuccess}
              onClick={handleFinishAndExit}
              className="py-2 px-2.5 border border-emerald-300 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-semibold text-xs rounded-xl transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              title="Tutup toko dan langsung kembali ke tampilan awal"
            >
              <LogOut className="w-3.5 h-3.5 text-emerald-600" />
              <span>Tutup & Keluar</span>
            </button>

            <button
              type="button"
              disabled={isClosingSuccess}
              onClick={handleCopyText}
              className="py-2 px-2.5 border border-neutral-200 bg-white hover:bg-neutral-100 text-neutral-700 font-semibold text-xs rounded-xl transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-emerald-700">Tersalin!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Salin Teks</span>
                </>
              )}
            </button>

            <button
              type="button"
              disabled={isClosingSuccess}
              onClick={onClose}
              className="py-2 px-2.5 bg-neutral-200 hover:bg-neutral-300 text-neutral-800 font-semibold text-xs rounded-xl transition-colors cursor-pointer"
            >
              Kembali
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
