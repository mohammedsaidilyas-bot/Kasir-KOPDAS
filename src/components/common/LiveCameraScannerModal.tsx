import React, { useRef, useState } from 'react';
import { X, Camera, CheckCircle2 } from 'lucide-react';
import { Html5Qrcode } from 'html5-qrcode';

interface LiveCameraScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScanSuccess: (decodedText: string) => void;
  title?: string;
}

export const LiveCameraScannerModal: React.FC<LiveCameraScannerModalProps> = ({
  isOpen,
  onClose,
  onScanSuccess,
  title = 'Scan Barcode Kamera',
}) => {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsLoading(true);
      const html5QrCode = new Html5Qrcode('html5-qrcode-file-hidden');
      const decodedText = await html5QrCode.scanFile(file, true);
      setIsLoading(false);
      onScanSuccess(decodedText);
      onClose();
    } catch (err) {
      setIsLoading(false);
      alert('Gagal mendeteksi barcode dari foto. Pastikan pencahayaan cukup dan foto fokus pada barcode.');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-70 flex items-center justify-center bg-black/85 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 space-y-5 text-center">
        <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
          <h3 className="text-sm font-bold text-neutral-900 flex items-center gap-2">
            <Camera className="w-4 h-4 text-emerald-600 animate-pulse" />
            <span>{title}</span>
          </h3>
          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-neutral-700 p-1 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl space-y-2 text-left">
          <div className="flex items-center gap-2 text-emerald-900 font-bold text-xs">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Dioptimalkan untuk WebIntoApp / Android APK</span>
          </div>
          <p className="text-[11px] text-emerald-700 leading-relaxed">
            Karena pembatasan WebView Android (*WebIntoApp*), metode **Kamera Instan Perangkat** di bawah ini dijamin 100% tembus, langsung membuka kamera HP, dan tidak memerlukan izin rumit.
          </p>
        </div>

        <div className="space-y-3">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isLoading}
            className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs inline-flex items-center justify-center gap-2 shadow-sm cursor-pointer disabled:opacity-50"
          >
            <Camera className="w-5 h-5 text-emerald-200" />
            <span>{isLoading ? 'Mendekode Barcode...' : '📷 Buka Kamera & Scan Barcode'}</span>
          </button>

          <button
            type="button"
            onClick={() => {
              const simulated = `899${Math.floor(100000000 + Math.random() * 900000000)}`;
              onScanSuccess(simulated);
              onClose();
            }}
            className="w-full py-2.5 bg-neutral-900 hover:bg-neutral-800 text-white font-semibold text-xs rounded-xl cursor-pointer"
          >
            Gunakan Barcode Otomatis (Simulasi)
          </button>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={handleFileUpload}
        />
        <div id="html5-qrcode-file-hidden" className="hidden" />
      </div>
    </div>
  );
};
