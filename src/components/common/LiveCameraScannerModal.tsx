import React, { useEffect, useRef, useState } from 'react';
import { X, Camera, ShieldCheck } from 'lucide-react';
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
  const [permissionGranted, setPermissionGranted] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const elementId = 'html5-qrcode-reader-live-container';

  const requestCameraAndStart = async () => {
    setIsLoading(true);
    setErrorMsg('');

    if (scannerRef.current) {
      try {
        await scannerRef.current.stop();
      } catch (e) {}
      scannerRef.current = null;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      });
      stream.getTracks().forEach((t) => t.stop());

      setPermissionGranted(true);
      setIsLoading(false);

      setTimeout(async () => {
        try {
          const html5QrCode = new Html5Qrcode(elementId);
          scannerRef.current = html5QrCode;

          await html5QrCode.start(
            { facingMode: 'environment' },
            {
              fps: 15,
              qrbox: { width: 250, height: 160 },
            },
            (decodedText) => {
              html5QrCode
                .stop()
                .catch(() => {})
                .finally(() => {
                  scannerRef.current = null;
                  setPermissionGranted(false);
                  onScanSuccess(decodedText);
                  onClose();
                });
            },
            () => {}
          );
        } catch (err: any) {
          console.error('Start error:', err);
          setErrorMsg('Gagal mengaktifkan pemindai kamera live.');
        }
      }, 300);
    } catch (err: any) {
      console.error('Permission error:', err);
      setIsLoading(false);
      setPermissionGranted(false);
      setErrorMsg(
        'Akses kamera ditolak atau dibatasi. Mohon klik tombol di bawah untuk memberikan izin akses kamera.'
      );
    }
  };

  useEffect(() => {
    if (!isOpen) {
      if (scannerRef.current) {
        scannerRef.current
          .stop()
          .catch(() => {})
          .finally(() => {
            scannerRef.current = null;
          });
      }
      setPermissionGranted(false);
      setErrorMsg('');
      setIsLoading(false);
      return;
    }

    requestCameraAndStart();

    return () => {
      if (scannerRef.current) {
        scannerRef.current
          .stop()
          .catch(() => {})
          .finally(() => {
            scannerRef.current = null;
          });
      }
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
              if (scannerRef.current) {
                scannerRef.current
                  .stop()
                  .catch(() => {})
                  .finally(() => {
                    scannerRef.current = null;
                    setPermissionGranted(false);
                    onClose();
                  });
              } else {
                setPermissionGranted(false);
                onClose();
              }
            }}
            className="text-neutral-400 hover:text-neutral-700 p-1 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Permission Request Prompt Banner / Overlay */}
        {(!permissionGranted || errorMsg) && (
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl space-y-3 text-left">
            <div className="flex items-center gap-2 text-emerald-900 font-bold text-xs">
              <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
              <span>Izin Akses Kamera Diperlukan</span>
            </div>
            <p className="text-[11px] text-emerald-800 leading-relaxed">
              {errorMsg || 'Aplikasi membutuhkan izin kamera Anda untuk memindai barcode produk secara otomatis secara real-time.'}
            </p>
            <button
              type="button"
              onClick={requestCameraAndStart}
              disabled={isLoading}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-sm cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <Camera className="w-4 h-4" />
              <span>{isLoading ? 'Meminta Izin Kamera...' : 'Izinkan & Aktifkan Kamera Sekarang'}</span>
            </button>
          </div>
        )}

        {/* Live Camera View */}
        <div className={`space-y-3 ${!permissionGranted ? 'hidden' : 'block'}`}>
          <div className="relative rounded-xl overflow-hidden bg-neutral-900 border-2 border-emerald-500 min-h-[240px] flex items-center justify-center">
            <div id={elementId} className="w-full" />
            {isLoading && (
              <div className="absolute inset-0 bg-neutral-900 flex flex-col items-center justify-center gap-2 text-white text-xs">
                <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                <span>Menyiapkan kamera live...</span>
              </div>
            )}
          </div>
          <p className="text-[11px] text-neutral-500">
            Arahkan kamera ke barcode produk. Barcode akan terbaca secara <strong>otomatis</strong>.
          </p>
        </div>

        <div className="pt-1">
          <button
            type="button"
            onClick={() => {
              const simulated = `899${Math.floor(100000000 + Math.random() * 900000000)}`;
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
