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
  const html5QrCodeRef = useRef<Html5Qrcode | null>(null);

  const stopCamera = async () => {
    if (html5QrCodeRef.current) {
      try {
        if (html5QrCodeRef.current.isScanning) {
          await html5QrCodeRef.current.stop();
        }
      } catch (err) {
        console.error('Error stopping scanner:', err);
      }
      html5QrCodeRef.current = null;
    }
  };

  const startCamera = async () => {
    if (!isOpen) return;
    setIsLoading(true);
    setErrorMsg('');
    await stopCamera();

    try {
      const elementId = 'html5-qrcode-scanner-view';
      const scanner = new Html5Qrcode(elementId);
      html5QrCodeRef.current = scanner;

      setPermissionState('granted');
      setIsLoading(false);

      // Highly sensitive config for barcodes (high fps, multiple formats)
      const config = {
        fps: 24, // 24 frames per second scan rate for ultra-sensitivity
        qrbox: (width: number, height: number) => {
          // Wider box optimized for reading linear 1D barcodes
          const boxWidth = Math.min(width * 0.85, 320);
          const boxHeight = Math.min(height * 0.45, 160);
          return { width: boxWidth, height: boxHeight };
        },
        aspectRatio: 1.777778, // 16:9 viewport
      };

      await scanner.start(
        { facingMode: 'environment' },
        config,
        (decodedText) => {
          // Success callback
          stopCamera();
          setPermissionState('prompt');
          onScanSuccess(decodedText);
          onClose();
        },
        () => {
          // Failure callback - silent, continues scanning
        }
      );
    } catch (err: any) {
      console.error('Fast camera start error:', err);
      setIsLoading(false);
      setPermissionState('denied');
      setErrorMsg(
        'Kamera gagal dimulai atau izin ditolak. Pastikan izin kamera telah diberikan di pengaturan browser/perangkat Anda.'
      );
    }
  };

  useEffect(() => {
    if (isOpen) {
      startCamera();
    } else {
      stopCamera();
      setPermissionState('prompt');
      setErrorMsg('');
      setIsLoading(false);
    }

    return () => {
      stopCamera();
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-70 flex items-center justify-center bg-black/95 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-5 space-y-4 text-center">
        <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
          <h3 className="text-sm font-bold text-neutral-900 flex items-center gap-2">
            <Camera className="w-4 h-4 text-emerald-600 animate-pulse" />
            <span>{title}</span>
          </h3>
          <button
            onClick={() => {
              stopCamera();
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
              <span>Kamera Sensitif & Kilat</span>
            </div>
            <p className="text-xs text-neutral-600">
              Aplikasi ini menggunakan scanner bar-code otomatis bersensitivitas tinggi. Deteksi langsung terjadi seketika saat kamera diarahkan ke barcode.
            </p>
            <button
              type="button"
              onClick={startCamera}
              disabled={isLoading}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-sm cursor-pointer"
            >
              {isLoading ? 'Menyiapkan...' : 'Buka Kamera'}
            </button>
          </div>
        )}

        {permissionState === 'denied' && (
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl space-y-3 text-left">
            <div className="flex items-center gap-2 text-amber-900 font-bold text-xs">
              <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
              <span>Izin Kamera Dibutuhkan</span>
            </div>
            <p className="text-[11px] text-amber-800 leading-relaxed">{errorMsg}</p>
            <button
              type="button"
              onClick={startCamera}
              className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-sm cursor-pointer"
            >
              Coba Ulang
            </button>
          </div>
        )}

        {/* Real-time HTML5-QRCode Scanner Viewport */}
        <div className={`space-y-3 ${permissionState !== 'granted' ? 'hidden' : 'block'}`}>
          <div className="relative rounded-2xl overflow-hidden bg-neutral-900 border-2 border-emerald-500 shadow-inner">
            {/* Target element for html5-qrcode */}
            <div id="html5-qrcode-scanner-view" className="w-full min-h-[260px] overflow-hidden bg-black" />
            
            {isLoading && (
              <div className="absolute inset-0 bg-neutral-900 flex flex-col items-center justify-center gap-2 text-white text-xs z-20">
                <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                <span>Membuka kamera sensitif...</span>
              </div>
            )}
          </div>

          <p className="text-xs text-neutral-600 font-medium">
            ⚡ <strong>Deteksi Instan Aktif</strong>: Arahkan barcode tepat ke tengah kotak pemindai. Kamera akan membaca secara instan & sensitif tanpa menekan tombol apapun!
          </p>
        </div>

        <div className="pt-1">
          <button
            type="button"
            onClick={() => {
              const simulated = `899${Math.floor(100000000 + Math.random() * 900000000)}`;
              stopCamera();
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
