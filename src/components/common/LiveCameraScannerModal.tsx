import React, { useEffect, useRef, useState } from 'react';
import { X, Camera, ShieldCheck, AlertCircle } from 'lucide-react';
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
  const [permissionState, setPermissionState] = useState<'prompt' | 'granted' | 'denied'>('prompt');
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const elementId = 'reader-live-container';
  const isRunningRef = useRef<boolean>(false);

  const stopScanner = async () => {
    if (scannerRef.current && isRunningRef.current) {
      try {
        isRunningRef.current = false;
        await scannerRef.current.stop();
        scannerRef.current.clear();
      } catch (e) {
        // Ignore
      }
      scannerRef.current = null;
    }
  };

  const startScanner = async () => {
    setIsLoading(true);
    setErrorMsg('');
    await stopScanner();

    try {
      setPermissionState('granted');
      const html5QrCode = new Html5Qrcode(elementId);
      scannerRef.current = html5QrCode;
      isRunningRef.current = true;

      await html5QrCode.start(
        { facingMode: 'environment' },
        {
          fps: 20,
          qrbox: { width: 280, height: 160 },
          aspectRatio: 1.777778,
        },
        (decodedText) => {
          if (!isRunningRef.current) return;
          isRunningRef.current = false;
          stopScanner().then(() => {
            setPermissionState('prompt');
            onScanSuccess(decodedText);
            onClose();
          });
        },
        () => {}
      );
      setIsLoading(false);
    } catch (err: any) {
      console.error('Camera live start error in WebView:', err);
      setIsLoading(false);
      setPermissionState('denied');
      setErrorMsg(
        'Kamera tidak dapat diakses di aplikasi ini. Pastikan izin kamera Android di WebIntoApp telah diaktifkan, atau gunakan mode simulasi.'
      );
    }
  };

  useEffect(() => {
    if (!isOpen) {
      stopScanner();
      setPermissionState('prompt');
      setErrorMsg('');
      setIsLoading(false);
      return;
    }

    startScanner();

    return () => {
      stopScanner();
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-70 flex items-center justify-center bg-black/90 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-5 space-y-4 text-center">
        <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
          <h3 className="text-sm font-bold text-neutral-900 flex items-center gap-2">
            <Camera className="w-4 h-4 text-emerald-600 animate-pulse" />
            <span>{title}</span>
          </h3>
          <button
            onClick={() => {
              stopScanner();
              setPermissionState('prompt');
              onClose();
            }}
            className="text-neutral-400 hover:text-neutral-700 p-1 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {permissionState === 'prompt' && (
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl space-y-3 text-left">
            <div className="flex items-center gap-2 text-emerald-900 font-bold text-xs">
              <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
              <span>Memulai Kamera Otomatis</span>
            </div>
            <button
              type="button"
              onClick={startScanner}
              disabled={isLoading}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-sm cursor-pointer"
            >
              {isLoading ? 'Menyalakan Kamera...' : 'Buka Kamera Live'}
            </button>
          </div>
        )}

        {permissionState === 'denied' && (
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl space-y-3 text-left">
            <div className="flex items-center gap-2 text-amber-900 font-bold text-xs">
              <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
              <span>Akses Kamera WebView</span>
            </div>
            <p className="text-[11px] text-amber-800 leading-relaxed">{errorMsg}</p>
            <button
              type="button"
              onClick={startScanner}
              className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-sm cursor-pointer"
            >
              Coba Nyalakan Ulang
            </button>
          </div>
        )}

        {/* Html5Qrcode Live View Container */}
        <div className={`space-y-3 ${permissionState !== 'granted' ? 'hidden' : 'block'}`}>
          <div className="relative rounded-2xl overflow-hidden bg-neutral-900 border-2 border-emerald-500 min-h-[280px] flex items-center justify-center shadow-inner">
            <div id={elementId} className="w-full h-full" />

            {isLoading && (
              <div className="absolute inset-0 bg-neutral-900 flex flex-col items-center justify-center gap-2 text-white text-xs z-10">
                <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                <span>Menyalakan kamera live...</span>
              </div>
            )}
          </div>

          <p className="text-xs text-neutral-600 font-medium">
            🔍 Arahkan kamera ke barcode produk. Begitu terbaca, kode akan <strong>langsung masuk secara otomatis</strong>.
          </p>
        </div>

        <div className="pt-1">
          <button
            type="button"
            onClick={() => {
              const simulated = `899${Math.floor(100000000 + Math.random() * 900000000)}`;
              stopScanner();
              setPermissionState('prompt');
              onScanSuccess(simulated);
              onClose();
            }}
            className="text-[11px] text-neutral-500 hover:text-neutral-900 underline font-medium cursor-pointer"
          >
            Atau gunakan Barcode Otomatis (Simulasi)
          </button>
        </div>
      </div>
    </div>
  );
};
