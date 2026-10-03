import React, { useState, useEffect } from 'react';
import {
  X,
  Banknote,
  QrCode,
  CreditCard,
  Building,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
} from 'lucide-react';
import { usePos } from '../../context/PosContext';
import { PaymentMethod } from '../../types';
import { formatRupiah } from '../../utils/formatters';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const { cartGrandTotal, completeTransaction, settings } = usePos();
  const [method, setMethod] = useState<PaymentMethod>('tunai');

  // Tunai state
  const [cashReceived, setCashReceived] = useState<number>(cartGrandTotal);
  const [cashInputString, setCashInputString] = useState<string>(cartGrandTotal.toString());

  // Non-tunai states
  const [selectedBank, setSelectedBank] = useState<string>('BCA');
  const [referenceNo, setReferenceNo] = useState<string>('');
  const [copiedBank, setCopiedBank] = useState(false);
  const [isQrisSimulatedSuccess, setIsQrisSimulatedSuccess] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setCashReceived(cartGrandTotal);
      setCashInputString(cartGrandTotal.toString());
      setReferenceNo('');
      setIsQrisSimulatedSuccess(false);
      setMethod('tunai');
    }
  }, [isOpen, cartGrandTotal]);

  if (!isOpen) return null;

  const changeDue = Math.max(0, cashReceived - cartGrandTotal);
  const isCashSufficient = cashReceived >= cartGrandTotal;

  const handleCashInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawVal = e.target.value.replace(/\D/g, '');
    const num = Number(rawVal) || 0;
    setCashInputString(rawVal);
    setCashReceived(num);
  };

  const handleQuickCash = (amount: number) => {
    setCashReceived(amount);
    setCashInputString(amount.toString());
  };

  const handleAddCash = (amount: number) => {
    const newVal = cashReceived + amount;
    setCashReceived(newVal);
    setCashInputString(newVal.toString());
  };

  const handleCopyRekening = (accNumber: string) => {
    navigator.clipboard.writeText(accNumber);
    setCopiedBank(true);
    setTimeout(() => setCopiedBank(false), 2000);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (method === 'tunai') {
      if (!isCashSufficient) return;
      completeTransaction('tunai', cashReceived, changeDue);
    } else if (method === 'qris') {
      const ref = referenceNo || `QRIS-${Date.now().toString().slice(-8)}`;
      completeTransaction('qris', undefined, undefined, ref);
    } else if (method === 'transfer') {
      const ref = referenceNo || `TRF-${selectedBank}-${Date.now().toString().slice(-6)}`;
      completeTransaction('transfer', undefined, undefined, ref);
    } else if (method === 'debit') {
      const ref = referenceNo || `EDC-AUTH-${Math.floor(100000 + Math.random() * 900000)}`;
      completeTransaction('debit', undefined, undefined, ref);
    }

    onSuccess();
  };

  const bankAccounts = [
    { bank: 'BCA', no: '821-0492-811', an: settings.storeName },
    { bank: 'Mandiri', no: '137-00-19283-91', an: settings.storeName },
    { bank: 'BRI', no: '0129-01-098273-50-4', an: settings.storeName },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-neutral-200 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-neutral-100 flex items-center justify-between bg-neutral-50/70">
          <div>
            <h2 className="text-base font-bold text-neutral-900">Pembayaran Transaksi</h2>
            <p className="text-xs text-neutral-500">Pilih metode pembayaran tunai atau non-tunai</p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Total Banner */}
        <div className="bg-neutral-900 text-white px-6 py-4 flex items-center justify-between">
          <span className="text-xs font-medium text-neutral-400">Total Tagihan:</span>
          <span className="text-2xl font-bold font-mono tracking-tight text-emerald-400">
            {formatRupiah(cartGrandTotal)}
          </span>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Method Tabs */}
          <div>
            <label className="block text-xs font-semibold text-neutral-700 mb-2">
              Metode Pembayaran:
            </label>
            <div className="grid grid-cols-4 gap-2">
              <button
                type="button"
                onClick={() => setMethod('tunai')}
                className={`flex flex-col items-center justify-center gap-1.5 py-2.5 px-2 rounded-xl border text-xs font-semibold transition-all ${
                  method === 'tunai'
                    ? 'border-neutral-900 bg-neutral-900 text-white shadow-xs'
                    : 'border-neutral-200 bg-neutral-50 text-neutral-700 hover:bg-neutral-100'
                }`}
              >
                <Banknote className="w-4 h-4" />
                <span>Tunai</span>
              </button>

              <button
                type="button"
                onClick={() => setMethod('qris')}
                className={`flex flex-col items-center justify-center gap-1.5 py-2.5 px-2 rounded-xl border text-xs font-semibold transition-all ${
                  method === 'qris'
                    ? 'border-neutral-900 bg-neutral-900 text-white shadow-xs'
                    : 'border-neutral-200 bg-neutral-50 text-neutral-700 hover:bg-neutral-100'
                }`}
              >
                <QrCode className="w-4 h-4" />
                <span>QRIS</span>
              </button>

              <button
                type="button"
                onClick={() => setMethod('transfer')}
                className={`flex flex-col items-center justify-center gap-1.5 py-2.5 px-2 rounded-xl border text-xs font-semibold transition-all ${
                  method === 'transfer'
                    ? 'border-neutral-900 bg-neutral-900 text-white shadow-xs'
                    : 'border-neutral-200 bg-neutral-50 text-neutral-700 hover:bg-neutral-100'
                }`}
              >
                <Building className="w-4 h-4" />
                <span>Transfer</span>
              </button>

              <button
                type="button"
                onClick={() => setMethod('debit')}
                className={`flex flex-col items-center justify-center gap-1.5 py-2.5 px-2 rounded-xl border text-xs font-semibold transition-all ${
                  method === 'debit'
                    ? 'border-neutral-900 bg-neutral-900 text-white shadow-xs'
                    : 'border-neutral-200 bg-neutral-50 text-neutral-700 hover:bg-neutral-100'
                }`}
              >
                <CreditCard className="w-4 h-4" />
                <span>Kartu / EDC</span>
              </button>
            </div>
          </div>

          {/* Conditional content by Method */}
          {method === 'tunai' && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1.5">
                  Uang Tunai Diterima:
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-mono text-sm font-semibold text-neutral-500">
                    Rp
                  </span>
                  <input
                    type="text"
                    value={cashInputString ? Number(cashInputString).toLocaleString('id-ID') : ''}
                    onChange={handleCashInputChange}
                    placeholder="0"
                    autoFocus
                    className="w-full pl-12 pr-4 py-2.5 border border-neutral-300 rounded-xl font-mono text-lg font-bold text-neutral-900 focus:outline-none focus:ring-2 focus:ring-neutral-900/20 focus:border-neutral-900"
                  />
                </div>
              </div>

              {/* Quick Cash Buttons */}
              <div className="space-y-1.5">
                <div className="text-[11px] font-medium text-neutral-500">Pilihan Nominal Cepat:</div>
                <div className="flex flex-wrap gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleQuickCash(cartGrandTotal)}
                    className="px-2.5 py-1.5 bg-neutral-100 hover:bg-neutral-200 text-xs font-semibold rounded-lg text-neutral-800 transition-colors"
                  >
                    Uang Pas
                  </button>
                  {[50000, 100000, 200000, 500000].map((val) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => handleQuickCash(val)}
                      className="px-2.5 py-1.5 bg-neutral-100 hover:bg-neutral-200 text-xs font-mono font-medium rounded-lg text-neutral-800 transition-colors"
                    >
                      {formatRupiah(val)}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => handleAddCash(50000)}
                    className="px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-xs font-semibold rounded-lg text-emerald-800 border border-emerald-200 transition-colors"
                  >
                    +50rb
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAddCash(100000)}
                    className="px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-xs font-semibold rounded-lg text-emerald-800 border border-emerald-200 transition-colors"
                  >
                    +100rb
                  </button>
                </div>
              </div>

              {/* Kembalian Calculation Box */}
              <div
                className={`p-3 rounded-xl border flex items-center justify-between transition-colors ${
                  isCashSufficient
                    ? 'bg-emerald-50/70 border-emerald-200 text-emerald-950'
                    : 'bg-rose-50/70 border-rose-200 text-rose-950'
                }`}
              >
                <div className="flex items-center gap-2">
                  {isCashSufficient ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
                  )}
                  <div>
                    <span className="text-xs font-medium block">
                      {isCashSufficient ? 'Kembalian:' : 'Uang Kurang:'}
                    </span>
                    <span className="text-lg font-bold font-mono">
                      {isCashSufficient
                        ? formatRupiah(changeDue)
                        : formatRupiah(cartGrandTotal - cashReceived)}
                    </span>
                  </div>
                </div>
                {isCashSufficient && changeDue === 0 && (
                  <span className="text-xs font-semibold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md">
                    Uang Pas
                  </span>
                )}
              </div>
            </div>
          )}

          {method === 'qris' && (
            <div className="space-y-4 text-center">
              <div className="p-4 bg-neutral-50 rounded-2xl border border-neutral-200 inline-block mx-auto">
                {/* Visual QRIS Stamp */}
                <div className="bg-white p-3 rounded-xl shadow-xs border border-neutral-200 inline-block">
                  <div className="text-[10px] font-bold tracking-widest text-neutral-800 mb-2 border-b pb-1">
                    QRIS · STANDAR PEMBAYARAN NASIONAL
                  </div>
                  {settings.qrisImageBase64 ? (
                    <div className="w-52 h-52 mx-auto flex items-center justify-center overflow-hidden border border-neutral-100 rounded-lg p-1 bg-white">
                      <img
                        src={settings.qrisImageBase64}
                        alt="QRIS Code Toko"
                        className="max-w-full max-h-full object-contain"
                      />
                    </div>
                  ) : (
                    /* Clean SVG QR code representation */
                    <svg
                      className="w-44 h-44 mx-auto text-neutral-900"
                      viewBox="0 0 100 100"
                      fill="currentColor"
                    >
                      {/* Corner anchors */}
                      <rect x="5" y="5" width="25" height="25" fill="none" stroke="currentColor" strokeWidth="4" />
                      <rect x="11" y="11" width="13" height="13" />
                      <rect x="70" y="5" width="25" height="25" fill="none" stroke="currentColor" strokeWidth="4" />
                      <rect x="76" y="11" width="13" height="13" />
                      <rect x="5" y="70" width="25" height="25" fill="none" stroke="currentColor" strokeWidth="4" />
                      <rect x="11" y="76" width="13" height="13" />
                      {/* Matrix pattern dots */}
                      <rect x="36" y="8" width="6" height="6" />
                      <rect x="48" y="8" width="6" height="6" />
                      <rect x="36" y="20" width="6" height="6" />
                      <rect x="54" y="20" width="8" height="6" />
                      <rect x="8" y="42" width="6" height="6" />
                      <rect x="20" y="42" width="6" height="6" />
                      <rect x="8" y="54" width="6" height="6" />
                      <rect x="36" y="36" width="28" height="28" fill="#10B981" />
                      <rect x="42" y="42" width="16" height="16" fill="white" />
                      <rect x="70" y="40" width="8" height="6" />
                      <rect x="84" y="46" width="6" height="8" />
                      <rect x="72" y="60" width="6" height="6" />
                      <rect x="86" y="60" width="6" height="6" />
                      <rect x="40" y="72" width="8" height="8" />
                      <rect x="54" y="80" width="8" height="6" />
                      <rect x="74" y="78" width="14" height="10" />
                    </svg>
                  )}
                  <div className="mt-2 font-semibold text-xs text-neutral-800">
                    {settings.storeName}
                  </div>
                  <div className="text-[11px] font-mono text-emerald-600 font-bold">
                    {formatRupiah(cartGrandTotal)}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsQrisSimulatedSuccess(true);
                    setReferenceNo(`QRIS-${Math.floor(10000000 + Math.random() * 90000000)}`);
                  }}
                  className={`text-xs font-semibold px-3 py-1.5 rounded-lg border transition-all ${
                    isQrisSimulatedSuccess
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                      : 'bg-neutral-100 hover:bg-neutral-200 text-neutral-700 border-neutral-300'
                  }`}
                >
                  {isQrisSimulatedSuccess ? '✓ Simulasi Pembayaran QRIS Sukses' : 'Simulasikan Pembayaran Pelanggan'}
                </button>
              </div>

              <div className="text-left">
                <label className="block text-[11px] font-semibold text-neutral-600 mb-1">
                  Nomor Referensi / RRN (Opsional):
                </label>
                <input
                  type="text"
                  value={referenceNo}
                  onChange={(e) => setReferenceNo(e.target.value)}
                  placeholder="Contoh: QRIS-992019482"
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-xs font-mono focus:outline-none focus:ring-1 focus:ring-neutral-900"
                />
              </div>
            </div>
          )}

          {method === 'transfer' && (
            <div className="space-y-3">
              <label className="block text-xs font-semibold text-neutral-700">
                Pilih Rekening Tujuan Transfer:
              </label>
              <div className="space-y-2">
                {bankAccounts.map((acc) => (
                  <div
                    key={acc.bank}
                    onClick={() => setSelectedBank(acc.bank)}
                    className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                      selectedBank === acc.bank
                        ? 'border-neutral-900 bg-neutral-50 shadow-xs'
                        : 'border-neutral-200 hover:bg-neutral-50'
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-neutral-900 bg-neutral-200 px-2 py-0.5 rounded">
                          {acc.bank}
                        </span>
                        <span className="font-mono text-xs font-bold text-neutral-800">
                          {acc.no}
                        </span>
                      </div>
                      <span className="text-[11px] text-neutral-500 block mt-0.5">
                        a.n. {acc.an}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedBank(acc.bank);
                        handleCopyRekening(acc.no);
                      }}
                      className="p-1.5 rounded-lg text-neutral-500 hover:text-neutral-900 hover:bg-neutral-200"
                      title="Salin nomor rekening"
                    >
                      {copiedBank && selectedBank === acc.bank ? (
                        <Check className="w-4 h-4 text-emerald-600" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                ))}
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">
                  Nomor Bukti Transfer / Nama Pengirim:
                </label>
                <input
                  type="text"
                  value={referenceNo}
                  onChange={(e) => setReferenceNo(e.target.value)}
                  placeholder="Contoh: TRF-BCA-Budi / 98214"
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-xs font-mono focus:outline-none focus:ring-1 focus:ring-neutral-900"
                />
              </div>
            </div>
          )}

          {method === 'debit' && (
            <div className="space-y-3">
              <div className="p-3 bg-neutral-50 border border-neutral-200 rounded-xl text-xs text-neutral-600">
                Gesek atau masukkan kartu pelanggan ke mesin EDC kasir untuk nominal{' '}
                <strong className="text-neutral-900 font-mono">
                  {formatRupiah(cartGrandTotal)}
                </strong>
                .
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">
                  Kode Approval / Nomor Kartu Terakhir:
                </label>
                <input
                  type="text"
                  value={referenceNo}
                  onChange={(e) => setReferenceNo(e.target.value)}
                  placeholder="Contoh: EDC-BCA-654321 / Card *4321"
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-xs font-mono focus:outline-none focus:ring-1 focus:ring-neutral-900"
                />
              </div>
            </div>
          )}

          {/* Action Button */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={method === 'tunai' && !isCashSufficient}
              className="w-full py-3.5 bg-neutral-900 hover:bg-neutral-800 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-sm rounded-xl transition-all shadow-xs flex items-center justify-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Selesaikan Transaksi & Cetak Struk</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
