import React, { useState } from 'react';
import {
  Printer,
  Share2,
  Copy,
  Check,
  PlusCircle,
  X,
  FileText,
} from 'lucide-react';
import { usePos } from '../../context/PosContext';
import { SaleTransaction } from '../../types';
import {
  formatRupiah,
  formatDateTime,
  generateReceiptText,
} from '../../utils/formatters';

interface ReceiptModalProps {
  transaction: SaleTransaction | null;
  isOpen: boolean;
  onClose: () => void;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({
  transaction,
  isOpen,
  onClose,
}) => {
  const { settings } = usePos();
  const [copied, setCopied] = useState(false);

  if (!isOpen || !transaction) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleCopy = () => {
    const text = generateReceiptText(transaction, settings);
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleWhatsApp = () => {
    const text = generateReceiptText(transaction, settings);
    const encoded = encodeURIComponent(text);
    window.open(`https://api.whatsapp.com/send?text=${encoded}`, '_blank');
  };

  const paymentLabels = {
    tunai: 'Tunai (Cash)',
    qris: 'QRIS',
    transfer: 'Transfer Bank',
    debit: 'Kartu Debit / EDC',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-neutral-200 w-full max-w-md my-auto overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-neutral-100 flex items-center justify-between bg-neutral-50/70">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-emerald-600" />
            <span className="text-sm font-bold text-neutral-900">
              Struk Pembelian Kasir
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Thermal Receipt Visual Preview (Target for printing) */}
        <div className="p-6 bg-neutral-100 flex justify-center">
          <div
            id="printable-receipt"
            className="w-full max-w-[340px] bg-white p-5 rounded-lg shadow-sm border border-neutral-200 text-neutral-900 font-mono text-xs leading-relaxed"
          >
            {/* Store Info Header */}
            <div className="text-center pb-3 border-b border-dashed border-neutral-300">
              <h1 className="text-sm font-bold tracking-tight uppercase">
                {settings.storeName}
              </h1>
              {settings.tagline && (
                <p className="text-[11px] text-neutral-600">{settings.tagline}</p>
              )}
              <p className="text-[10px] text-neutral-500 mt-1">{settings.address}</p>
              <p className="text-[10px] text-neutral-500">Telp: {settings.phone}</p>
            </div>

            {/* Transaction Metadata */}
            <div className="py-2.5 border-b border-dashed border-neutral-300 space-y-0.5 text-[11px]">
              <div className="flex justify-between">
                <span className="text-neutral-500">No. Struk</span>
                <span className="font-semibold">{transaction.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-500">Waktu</span>
                <span>{formatDateTime(transaction.timestamp)}</span>
              </div>
              <div className="flex justify-between items-center py-0.5">
                <span className="text-neutral-600 font-bold">Nama Kasir</span>
                <span className="font-bold text-neutral-900 bg-neutral-100 px-1.5 py-0.5 rounded border border-neutral-200">
                  {transaction.cashierName}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-500">Tipe Harga</span>
                <span className="font-semibold uppercase text-emerald-700">
                  {transaction.customerType === 'grosir' ? '★ GROSIR' : 'ECERAN'}
                </span>
              </div>
              {transaction.customerName && (
                <div className="flex justify-between">
                  <span className="text-neutral-500">Pelanggan</span>
                  <span>{transaction.customerName}</span>
                </div>
              )}
            </div>

            {/* Line Items Table */}
            <div className="py-2.5 border-b border-dashed border-neutral-300 space-y-2">
              {transaction.items.map((item, idx) => (
                <div key={idx} className="space-y-0.5">
                  <div className="flex justify-between font-semibold">
                    <span className="truncate pr-2">
                      {item.product.name}
                      {item.priceType === 'grosir' && (
                        <span className="text-[10px] text-emerald-600 ml-1">
                          [Grosir]
                        </span>
                      )}
                    </span>
                    <span className="shrink-0">{formatRupiah(item.subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-[11px] text-neutral-500">
                    <span>
                      {item.qty} {item.product.unit} x {formatRupiah(item.appliedPrice)}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Totals & Calculations */}
            <div className="py-2.5 border-b border-dashed border-neutral-300 space-y-1 text-[11px]">
              <div className="flex justify-between">
                <span className="text-neutral-500">Total Item</span>
                <span>{transaction.totalQty}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-500">Subtotal</span>
                <span>{formatRupiah(transaction.subtotal)}</span>
              </div>
              {(() => {
                const wholesaleSavings = transaction.items.reduce((sum, item) => {
                  if (item.priceType === 'grosir') {
                    const diff = item.product.retailPrice - item.product.wholesalePrice;
                    return sum + Math.max(0, diff * item.qty);
                  }
                  return sum;
                }, 0);

                if (wholesaleSavings > 0) {
                  return (
                    <div className="flex justify-between text-emerald-700 font-semibold">
                      <span>Hemat Beli Grosir</span>
                      <span>-{formatRupiah(wholesaleSavings)}</span>
                    </div>
                  );
                }
                return null;
              })()}
              {transaction.discount > 0 && (
                <div className="flex justify-between text-rose-600 font-medium">
                  <span>Diskon Tambahan</span>
                  <span>-{formatRupiah(transaction.discount)}</span>
                </div>
              )}
              <div className="flex justify-between text-sm font-bold pt-1 text-neutral-900 border-t border-neutral-200">
                <span>TOTAL AKHIR</span>
                <span>{formatRupiah(transaction.grandTotal)}</span>
              </div>
            </div>

            {/* Payment Summary */}
            <div className="py-2.5 border-b border-dashed border-neutral-300 space-y-1 text-[11px]">
              <div className="flex justify-between">
                <span className="text-neutral-500">Metode Bayar</span>
                <span className="font-semibold">
                  {paymentLabels[transaction.paymentMethod]}
                </span>
              </div>
              {transaction.paymentMethod === 'tunai' ? (
                <>
                  <div className="flex justify-between">
                    <span className="text-neutral-500">Tunai Diterima</span>
                    <span>
                      {formatRupiah(transaction.cashReceived || transaction.grandTotal)}
                    </span>
                  </div>
                  <div className="flex justify-between font-semibold">
                    <span className="text-neutral-500">Kembalian</span>
                    <span>{formatRupiah(transaction.changeDue || 0)}</span>
                  </div>
                </>
              ) : (
                transaction.referenceNo && (
                  <div className="flex justify-between text-[10px]">
                    <span className="text-neutral-500">Ref / RRN</span>
                    <span className="font-mono">{transaction.referenceNo}</span>
                  </div>
                )
              )}
            </div>

            {/* Receipt Footer Message */}
            <div className="pt-3 text-center text-[10px] text-neutral-500 space-y-1">
              <p className="font-semibold text-neutral-800">
                Dilayani oleh: <span className="underline">{transaction.cashierName}</span>
              </p>
              <p>{settings.receiptFooter || 'Terima kasih telah berbelanja'}</p>
              <p className="text-[9px]">Layanan Konsumen: {settings.phone}</p>
            </div>
          </div>
        </div>

        {/* Action Buttons Toolbar */}
        <div className="p-4 bg-white border-t border-neutral-200 space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="py-2.5 px-3 bg-neutral-900 hover:bg-neutral-800 text-white font-semibold text-xs rounded-xl flex items-center justify-center gap-2 shadow-xs transition-colors"
            >
              <Printer className="w-4 h-4 text-emerald-400" />
              <span>Cetak Struk (Print)</span>
            </button>

            <button
              type="button"
              onClick={handleWhatsApp}
              className="py-2.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-xl flex items-center justify-center gap-2 shadow-xs transition-colors"
            >
              <Share2 className="w-4 h-4" />
              <span>Kirim WhatsApp</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopy}
              className="flex-1 py-2 px-3 border border-neutral-200 hover:bg-neutral-50 text-neutral-700 font-medium text-xs rounded-xl flex items-center justify-center gap-1.5 transition-colors"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-emerald-700 font-semibold">
                    Struk Berhasil Disalin
                  </span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Salin Teks Struk</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2 px-3 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 font-semibold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-colors"
            >
              <PlusCircle className="w-3.5 h-3.5 text-neutral-600" />
              <span>Transaksi Baru</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
