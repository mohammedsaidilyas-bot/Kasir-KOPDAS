import React, { useRef, useState } from 'react';
import { X, Camera, Zap, Sparkles } from 'lucide-react';
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
  title = 'Scan Barcode',
}) => {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleFileCapture = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsLoading(true);
      const html5QrCode = new Html5Qrcode('html5-qrcode-hidden-region');
      const decodedText = await html5QrCode.scanFile(file, true);
      setIsLoading(false);
      onScanSuccess(decodedText);
      onClose();
    } catch (err) {
      setIsLoading(false);
      alert('Barcode tidak terdeteksi pada foto. Pastikan pencahayaan cukup dan posisikan barcode tepat di tengah.');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-70 flex items-center justify-center bg-black/90 backdrop-blur-xs p-4 animate-in fade-in duration-200">
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
            <Sparkles className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Optimasi Khusus Aplikasi APK / WebIntoApp</span>
          </div>
          <p className="text-[11px] text-emerald-800 leading-relaxed">
            WebView Android (*WebIntoApp*) memblokir kamera langsung. Tombol di bawah langsung membuka **Kamera Bawaan HP** sehingga dijamin 100% berfungsi tanpa kendala izin!
          </p>
        </div>

        <div className="space-y-3">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isLoading}
            className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <Zap className="w-5 h-5 text-emerald-200 fill-emerald-200" />
            <span>{isLoading ? 'Mendekode Barcode...' : '📸 BUKA KAMERA & SCAN BARCODE'}</span>
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
          onChange={handleFileCapture}
        />

        <div id="html5-qrcode-hidden-region" className="hidden" />
      </div>
    </div>
  );
};
