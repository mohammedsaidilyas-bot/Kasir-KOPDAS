import React, { useState, useEffect } from 'react';
import {
  Printer,
  Share2,
  Copy,
  Check,
  PlusCircle,
  X,
  FileText,
  Camera,
  Upload,
  Image as ImageIcon,
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
  const { settings, updateTransaction } = usePos();
  const [copied, setCopied] = useState(false);

  // Send Proof WhatsApp States
  const [isProofModalOpen, setIsProofModalOpen] = useState(false);
  const [proofImageBase64, setProofImageBase64] = useState('');
  const [adminWaInput, setAdminWaInput] = useState('');
  const [isUploadingProof, setIsUploadingProof] = useState(false);

  useEffect(() => {
    if (isOpen && settings) {
      setAdminWaInput(settings.adminWaPhone || '');
      setProofImageBase64('');
    }
  }, [isOpen, settings]);

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

        {/* Reassurance Banner */}
        <div className="bg-emerald-50 border-b border-emerald-200 px-5 py-2.5 flex items-center gap-2 text-xs text-emerald-800">
          <div className="w-4 h-4 rounded-full bg-emerald-500 text-white flex items-center justify-center text-[10px] font-bold shrink-0">
            ✓
          </div>
          <div>
            <span className="font-bold block text-[11px]">Selesai & Tersimpan Aman!</span>
            <span className="text-[10px] text-emerald-700 block">
              Transaksi ini sudah otomatis tersimpan permanen di cloud & Riwayat Struk.
            </span>
          </div>
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
          {/* Kirim Bukti Pembayaran ke WhatsApp Admin Button */}
          <button
            type="button"
            onClick={() => setIsProofModalOpen(true)}
            className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition-all shadow-xs cursor-pointer"
          >
            <Camera className="w-4 h-4 text-emerald-300" />
            <span>Kirim Bukti Pembayaran ke WhatsApp Admin</span>
          </button>

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
              className="py-2.5 px-3 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 font-semibold text-xs rounded-xl flex items-center justify-center gap-2 shadow-xs transition-colors"
            >
              <Share2 className="w-4 h-4 text-neutral-600" />
              <span>Kirim WhatsApp Struk</span>
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

      {/* Proof Confirmation Modal (Popup) */}
      {isProofModalOpen && (
        <div className="fixed inset-0 z-55 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl border border-neutral-200 w-full max-w-md my-auto overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-neutral-100 flex items-center justify-between bg-neutral-50/70">
              <div className="flex items-center gap-2">
                <Camera className="w-4 h-4 text-emerald-600" />
                <h3 className="text-sm font-bold text-neutral-900">
                  Kirim Bukti Bayar ke WhatsApp Admin
                </h3>
              </div>
              <button
                onClick={() => setIsProofModalOpen(false)}
                className="p-1 rounded-md text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={async (e) => {
                e.preventDefault();
                if (!adminWaInput.trim()) {
                  alert("Masukkan nomor WhatsApp admin terlebih dahulu.");
                  return;
                }
                setIsUploadingProof(true);
                try {
                  if (proofImageBase64) {
                    await updateTransaction(transaction.id, {
                      paymentProofBase64: proofImageBase64,
                    });
                    transaction.paymentProofBase64 = proofImageBase64;
                  }
                  const cleanPhone = adminWaInput.replace(/\D/g, "");
                  const formattedPhone = cleanPhone.startsWith("0") ? "62" + cleanPhone.slice(1) : cleanPhone;
                  const text = `*KONFIRMASI BUKTI PEMBAYARAN QRIS/TRANSFER* 🧾✨\n\nHalo Admin, berikut adalah pemberitahuan pembayaran dari Kasir:\n\n- *No. Struk*: ${transaction.id}\n- *Waktu*: ${formatDateTime(transaction.timestamp)}\n- *Kasir*: ${transaction.cashierName}\n- *Metode Bayar*: ${paymentLabels[transaction.paymentMethod] || transaction.paymentMethod.toUpperCase()}\n- *Total Tagihan*: *${formatRupiah(transaction.grandTotal)}*\n- *Status*: LUNAS / SUKSES\n\n${proofImageBase64 ? "📸 _(Gambar bukti pembayaran sudah diunggah ke sistem kasir cloud)_" : ""}\n\nSilakan periksa mutasi rekening Anda. Terima kasih!`;
                  const encodedText = encodeURIComponent(text);
                  window.open(`https://api.whatsapp.com/send?phone=${formattedPhone}&text=${encodedText}`, '_blank');
                  setIsProofModalOpen(false);
                } catch (err) {
                  console.error(err);
                  alert("Gagal memproses bukti pembayaran.");
                } finally {
                  setIsUploadingProof(false);
                }
              }}
              className="p-6 space-y-4"
            >
              {/* WhatsApp Input */}
              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1">
                  Nomor WhatsApp Admin Tujuan:
                </label>
                <input
                  type="text"
                  required
                  value={adminWaInput}
                  onChange={(e) => setAdminWaInput(e.target.value)}
                  placeholder="Contoh: 081234567890"
                  className="w-full px-3 py-2 border border-neutral-300 rounded-xl text-xs font-mono font-bold tracking-wide focus:outline-none focus:ring-1 focus:ring-neutral-900"
                />
                <span className="text-[10px] text-neutral-400 mt-1 block">
                  Nomor pre-filled dari pengaturan toko, Anda bisa merubahnya jika diperlukan.
                </span>
              </div>

              {/* File Uploader / Image capture */}
              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1.5">
                  Lampirkan Gambar Bukti Pembayaran / Screenshot:
                </label>

                <div className="flex flex-col items-center justify-center p-5 border-2 border-dashed border-neutral-200 hover:border-neutral-400 bg-neutral-50 rounded-xl transition-all text-center space-y-2">
                  {proofImageBase64 ? (
                    <div className="relative w-full max-h-48 rounded-lg overflow-hidden border bg-white flex items-center justify-center p-1">
                      <img
                        src={proofImageBase64}
                        alt="Preview Bukti Bayar"
                        className="max-w-full max-h-44 object-contain"
                      />
                      <button
                        type="button"
                        onClick={() => setProofImageBase64('')}
                        className="absolute top-1.5 right-1.5 p-1 bg-rose-600 hover:bg-rose-700 text-white rounded-full shadow-xs cursor-pointer"
                        title="Hapus foto"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-2 py-2">
                      <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
                        <Upload className="w-5 h-5" />
                      </div>
                      <div>
                        <span className="text-xs font-semibold text-neutral-700 block">
                          Pilih / Ambil Foto Bukti Bayar
                        </span>
                        <span className="text-[10px] text-neutral-400 block mt-0.5">
                          Format JPG/PNG. Kamera didukung otomatis.
                        </span>
                      </div>
                    </div>
                  )}

                  <label className="px-3.5 py-1.5 bg-neutral-900 hover:bg-neutral-800 text-white font-bold text-[11px] rounded-lg cursor-pointer transition-colors inline-block shadow-2xs">
                    <span>{proofImageBase64 ? 'Ganti Foto Bukti' : 'Pilih File / Kamera'}</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;

                        const reader = new FileReader();
                        reader.onload = (event) => {
                          const img = new Image();
                          img.onload = () => {
                            const canvas = document.createElement('canvas');
                            const maxDimension = 600; // light quality image for cloud database
                            let width = img.width;
                            let height = img.height;

                            if (width > height) {
                              if (width > maxDimension) {
                                height *= maxDimension / width;
                                width = maxDimension;
                              }
                            } else {
                              if (height > maxDimension) {
                                width *= maxDimension / height;
                                height = maxDimension;
                              }
                            }

                            canvas.width = width;
                            canvas.height = height;
                            const ctx = canvas.getContext('2d');
                            ctx?.drawImage(img, 0, 0, width, height);

                            const base64 = canvas.toDataURL('image/jpeg', 0.7);
                            setProofImageBase64(base64);
                          };
                          img.src = event.target?.result as string;
                        };
                        reader.readAsDataURL(file);
                      }}
                    />
                  </label>
                </div>
              </div>

              {/* Form Action Button */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isUploadingProof}
                  className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2"
                >
                  {isUploadingProof ? (
                    <span>Sedang Menyimpan...</span>
                  ) : (
                    <>
                      <Share2 className="w-4 h-4 text-emerald-200" />
                      <span>Kirim via WhatsApp & Simpan</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
