import React, { useEffect, useRef, useState } from 'react';
import { X, Camera, AlertCircle, Upload, CheckCircle2 } from 'lucide-react';
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
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const elementId = 'html5-qrcode-reader-container';

  const startCamera = async () => {
    setIsLoading(true);
    setErrorMsg('');

    if (scannerRef.current) {
      try {
        await scannerRef.current.stop();
      } catch (e) {
        // ignore
      }
      scannerRef.current = null;
    }

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('API Kamera tidak didukung oleh browser ini.');
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      });
      stream.getTracks().forEach((track) => track.stop());

      setTimeout(() => {
        try {
          const html5QrCode = new Html5Qrcode(elementId);
          scannerRef.current = html5QrCode;

          html5QrCode
            .start(
              { facingMode: 'environment' },
              {
                fps: 10,
                qrbox: { width: 250, height: 150 },
              },
              (decodedText) => {
                html5QrCode
                  .stop()
                  .catch(() => {})
                  .finally(() => {
                    scannerRef.current = null;
                    setIsLoading(false);
                    onScanSuccess(decodedText);
                    onClose();
                  });
              },
              () => {}
            )
            .catch((err) => {
              console.error('Html5Qrcode start error:', err);
              setErrorMsg('Kamera aktif tetapi gagal memulai pemindai live. Silakan gunakan tombol "Ambil Foto Barcode" di bawah.');
              setIsLoading(false);
            });
        } catch (initErr) {
          console.error('Html5Qrcode init error:', initErr);
          setErrorMsg('Gagal memuat modul pemindai.');
          setIsLoading(false);
        }
      }, 300);
    } catch (err: any) {
      console.error('getUserMedia error:', err);
      setErrorMsg(
        err?.message ||
          'Akses kamera dibatasi oleh lingkungan iframe/browser. Gunakan tombol "Ambil Foto Barcode dengan Kamera" di bawah untuk hasil instan.'
      );
      setIsLoading(false);
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
      setErrorMsg('');
      setIsLoading(false);
      return;
    }

    startCamera();

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

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsLoading(true);
      const html5QrCode = new Html5Qrcode('html5-qrcode-file-reader-hidden');
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

        {/* Scanner container MUST always be in DOM so Html5Qrcode can mount */}
        <div className={`space-y-3 ${errorMsg ? 'hidden' : 'block'}`}>
          <div
            id={elementId}
            className="w-full rounded-xl overflow-hidden bg-neutral-900 border-2 border-emerald-500 min-h-[220px] flex items-center justify-center"
          />
          {isLoading && (
            <p className="text-xs text-emerald-600 font-semibold animate-pulse">
              Meminta izin dan membuka kamera...
            </p>
          )}
          <div className="flex items-center justify-between pt-1">
            <p className="text-[11px] text-neutral-500">
              Arahkan kamera ke barcode produk.
            </p>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="text-[11px] text-emerald-700 hover:underline font-bold inline-flex items-center gap-1 cursor-pointer"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Ambil / Unggah Foto</span>
            </button>
          </div>
        </div>

        {/* Error / Permission Block */}
        {errorMsg && (
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 space-y-3 text-left">
            <div className="flex items-center gap-2 font-semibold">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>Akses Kamera Dibatasi Iframe</span>
            </div>
            <p className="text-[11px] leading-relaxed">{errorMsg}</p>
            
            <div className="pt-2 space-y-2">
              <button
                type="button"
                onClick={() => {
                  console.log('Capture photo clicked');
                  fileInputRef.current?.click();
                }}
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold cursor-pointer flex items-center justify-center gap-2 shadow-sm"
              >
                <Camera className="w-4 h-4" />
                <span>📷 Ambil Foto Barcode dengan Kamera</span>
              </button>

              <button
                type="button"
                onClick={startCamera}
                disabled={isLoading}
                className="w-full py-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 rounded-xl text-xs font-semibold cursor-pointer"
              >
                {isLoading ? 'Mencoba...' : 'Coba Live Kamera Lagi'}
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
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={handleFileUpload}
        />
        <div id="html5-qrcode-file-reader-hidden" className="hidden" />
      </div>
    </div>
  );
};
