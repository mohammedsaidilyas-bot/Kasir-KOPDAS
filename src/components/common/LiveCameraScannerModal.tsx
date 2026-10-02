import React, { useEffect, useRef, useState } from 'react';
import { X, Camera, AlertCircle } from 'lucide-react';
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
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const elementId = 'html5-qrcode-reader-live-container';

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
      setErrorMsg('');
      setIsLoading(true);
      return;
    }

    let isMounted = true;
    setIsLoading(true);
    setErrorMsg('');

    const startLiveScanner = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' }
        });
        stream.getTracks().forEach((t) => t.stop());

        if (!isMounted) return;

        setTimeout(async () => {
          if (!isMounted) return;
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
                if (!isMounted) return;
                html5QrCode
                  .stop()
                  .catch(() => {})
                  .finally(() => {
                    scannerRef.current = null;
                    onScanSuccess(decodedText);
                    onClose();
                  });
              },
              () => {}
            );
            setIsLoading(false);
          } catch (startErr: any) {
            console.error('Html5Qrcode start error:', startErr);
            if (isMounted) {
              setErrorMsg('Gagal memulai pemindai live kamera. Pastikan izin kamera aktif.');
              setIsLoading(false);
            }
          }
        }, 300);
      } catch (err: any) {
        console.error('getUserMedia error:', err);
        if (isMounted) {
          setErrorMsg(
            'Akses kamera diblokir atau belum diizinkan oleh browser. Mohon berikan izin akses kamera.'
          );
          setIsLoading(false);
        }
      }
    };

    startLiveScanner();

    return () => {
      isMounted = false;
      if (scannerRef.current) {
        scannerRef.current
          .stop()
          .catch(() => {})
          .finally(() => {
            scannerRef.current = null;
          });
      }
    };
  }, [isOpen, onScanSuccess, onClose]);

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
                    onClose();
                  });
              } else {
                onClose();
              }
            }}
            className="text-neutral-400 hover:text-neutral-700 p-1 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {errorMsg ? (
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 space-y-3 text-left">
            <div className="flex items-center gap-2 font-semibold">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>Izin Kamera Diperlukan</span>
            </div>
            <p className="text-[11px] leading-relaxed">{errorMsg}</p>
            
            <div className="pt-2 space-y-2">
              <button
                type="button"
                onClick={() => {
                  window.location.reload();
                }}
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold cursor-pointer"
              >
                Muat Ulang Halaman untuk Izin Kamera
              </button>

              <button
                type="button"
                onClick={() => {
                  const simulated = `899${Math.floor(100000000 + Math.random() * 900000000)}`;
                  onScanSuccess(simulated);
                  onClose();
                }}
                className="w-full py-2 bg-neutral-900 hover:bg-neutral-800 text-white rounded-xl text-xs font-semibold cursor-pointer"
              >
                Gunakan Barcode Otomatis (Simulasi)
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="relative rounded-xl overflow-hidden bg-neutral-900 border-2 border-emerald-500 min-h-[240px] flex items-center justify-center">
              <div id={elementId} className="w-full" />
              {isLoading && (
                <div className="absolute inset-0 bg-neutral-900 flex flex-col items-center justify-center gap-2 text-white text-xs">
                  <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                  <span>Mengaktifkan kamera live...</span>
                </div>
              )}
            </div>
            <p className="text-[11px] text-neutral-500">
              Arahkan kamera ke barcode produk. Barcode akan terbaca secara <strong>otomatis</strong>.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
