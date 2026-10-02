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
  title = 'Scan Barcode via Kamera',
}) => {
  const [permissionState, setPermissionState] = useState<'prompt' | 'granted' | 'denied'>('prompt');
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const scannerRef = useRef<Html5Qrcode | null>(null);

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (scannerRef.current) {
      scannerRef.current.stop().catch(() => {});
      scannerRef.current = null;
    }
  };

  const startCamera = async () => {
    setIsLoading(true);
    setErrorMsg('');
    stopCamera();

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } }
      });
      streamRef.current = stream;
      setPermissionState('granted');
      setIsLoading(false);

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch(() => {});
      }

      setTimeout(() => {
        try {
          const html5QrCode = new Html5Qrcode('html5-qrcode-reader-video-box');
          scannerRef.current = html5QrCode;
          html5QrCode
            .start(
              { facingMode: 'environment' },
              { fps: 10, qrbox: { width: 250, height: 150 } },
              (decodedText) => {
                stopCamera();
                setPermissionState('prompt');
                onScanSuccess(decodedText);
                onClose();
              },
              () => {}
            )
            .catch((err) => {
              console.warn('Html5Qrcode live start fallback:', err);
            });
        } catch (e) {
          console.warn('Html5Qrcode init error:', e);
        }
      }, 400);
    } catch (err: any) {
      console.error('Camera access error:', err);
      setIsLoading(false);
      setPermissionState('denied');
      setErrorMsg('Akses kamera dibatasi atau ditolak oleh browser/iframe. Gunakan tombol foto instan di bawah.');
    }
  };

  useEffect(() => {
    if (!isOpen) {
      stopCamera();
      setPermissionState('prompt');
      setErrorMsg('');
      setIsLoading(false);
      return;
    }

    startCamera();

    return () => {
      stopCamera();
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-70 flex items-center justify-center bg-black/85 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-4 text-center">
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
              <span>Izinkan Akses Kamera</span>
            </div>
            <p className="text-[11px] text-emerald-800 leading-relaxed">
              Klik tombol di bawah untuk memberikan izin kamera dan mengaktifkan pemindai barcode secara langsung.
            </p>
            <button
              type="button"
              onClick={startCamera}
              disabled={isLoading}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-sm cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <Camera className="w-4 h-4" />
              <span>{isLoading ? 'Membuka Kamera...' : 'Aktifkan Kamera Sekarang'}</span>
            </button>
          </div>
        )}

        {permissionState === 'denied' && (
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl space-y-3 text-left">
            <div className="flex items-center gap-2 text-amber-900 font-bold text-xs">
              <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
              <span>Kamera Dibatasi Iframe / Browser</span>
            </div>
            <p className="text-[11px] text-amber-800 leading-relaxed">{errorMsg}</p>
            <button
              type="button"
              onClick={() => {
                const input = document.createElement('input');
                input.type = 'file';
                input.accept = 'image/*';
                input.capture = 'environment';
                input.onchange = async (e: any) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  try {
                    const qr = new Html5Qrcode('html5-qrcode-file-hidden');
                    const text = await qr.scanFile(file, true);
                    onScanSuccess(text);
                    onClose();
                  } catch (err) {
                    alert('Gagal mendeteksi barcode dari foto.');
                  }
                };
                input.click();
              }}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-sm cursor-pointer flex items-center justify-center gap-2"
            >
              <Camera className="w-4 h-4" />
              <span>📷 Ambil Foto Barcode (Kamera Langsung)</span>
            </button>
          </div>
        )}

        {/* Video feed container */}
        <div className={`space-y-3 ${permissionState !== 'granted' ? 'hidden' : 'block'}`}>
          <div className="relative rounded-xl overflow-hidden bg-neutral-900 border-2 border-emerald-500 min-h-[240px] flex items-center justify-center">
            <video
              ref={videoRef}
              playsInline
              muted
              autoPlay
              className="w-full h-[240px] object-cover"
            />
            <div id="html5-qrcode-reader-video-box" className="absolute inset-0 opacity-0 pointer-events-none" />

            {isLoading && (
              <div className="absolute inset-0 bg-neutral-900 flex flex-col items-center justify-center gap-2 text-white text-xs">
                <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                <span>Menyalakan kamera live...</span>
              </div>
            )}
          </div>
          <p className="text-[11px] text-neutral-500">
            Arahkan kamera ke barcode produk. Barcode akan terbaca secara <strong>otomatis</strong>.
          </p>
        </div>

        <div className="pt-1 flex flex-col gap-2">
          <button
            type="button"
            onClick={() => {
              const simulated = `899${Math.floor(100000000 + Math.random() * 900000000)}`;
              stopCamera();
              onScanSuccess(simulated);
              onClose();
            }}
            className="text-[11px] text-neutral-500 hover:text-neutral-900 underline font-medium cursor-pointer"
          >
            Atau gunakan Barcode Otomatis (Simulasi)
          </button>
        </div>

        <div id="html5-qrcode-file-hidden" className="hidden" />
      </div>
    </div>
  );
};
