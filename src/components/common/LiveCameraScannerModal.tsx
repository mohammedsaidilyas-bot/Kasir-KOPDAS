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

      const config = {
        fps: 20,
        qrbox: (width: number, height: number) => {
          const boxWidth = Math.min(width * 0.85, 300);
          const boxHeight = Math.min(height * 0.45, 150);
          return { width: boxWidth, height: boxHeight };
        },
        aspectRatio: 1.777778,
      };

      const handleScanSuccess = (decodedText: string) => {
        stopCamera();
        setPermissionState('prompt');
        onScanSuccess(decodedText);
        onClose();
      };

      // Multi-stage camera selection for maximum device compatibility across all Android & iOS phones
      let cameraSelectedId: string | null = null;

      try {
        const devices = await Html5Qrcode.getCameras();
        if (devices && devices.length > 0) {
          // Detect back/rear camera or select last camera in array (standard main rear camera on Android)
          const backCam = devices.find((d) => {
            const label = (d.label || '').toLowerCase();
            return (
              label.includes('back') ||
              label.includes('rear') ||
              label.includes('environment') ||
              label.includes('belakang') ||
              label.includes('0')
            );
          });
          cameraSelectedId = backCam ? backCam.id : devices[devices.length - 1].id;
        }
      } catch (camErr) {
        console.warn('Could not enumerate cameras, using facingMode fallback:', camErr);
      }

      // Stage 1: Attempt exact hardware camera ID
      if (cameraSelectedId) {
        try {
          await scanner.start(cameraSelectedId, config, handleScanSuccess, () => {});
          return;
        } catch (e) {
          console.warn('Failed with selected cameraId, trying facingMode environment:', e);
        }
      }

      // Stage 2: Fallback to facingMode environment
      try {
        await scanner.start({ facingMode: 'environment' }, config, handleScanSuccess, () => {});
        return;
      } catch (e) {
        console.warn('Failed with facingMode environment, trying facingMode user:', e);
      }

      // Stage 3: Fallback to any active camera (user facing)
      await scanner.start({ facingMode: 'user' }, config, handleScanSuccess, () => {});

    } catch (err: any) {
      console.error('Fast camera start error:', err);
      setIsLoading(false);
      setPermissionState('denied');
      setErrorMsg(
        'Kamera gagal dibuka. Silakan berikan izin kamera pada aplikasi APK Anda di Pengaturan HP > Aplikasi > Izin Kamera.'
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
              <span>Kamera Universal & Sensitif</span>
            </div>
            <p className="text-xs text-neutral-600">
              Aplikasi ini menggunakan sistem kamera pintar yang mendukung semua tipe HP Android (Samsung, Xiaomi, Oppo, Vivo, Realme, Infinix) & iPhone.
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

        {/* Universal Real-time HTML5-QRCode Scanner Viewport */}
        <div className={`space-y-3 ${permissionState !== 'granted' ? 'hidden' : 'block'}`}>
          <div className="relative rounded-2xl overflow-hidden bg-neutral-900 border-2 border-emerald-500 shadow-inner">
            <div id="html5-qrcode-scanner-view" className="w-full min-h-[260px] overflow-hidden bg-black" />
            
            {isLoading && (
              <div className="absolute inset-0 bg-neutral-900 flex flex-col items-center justify-center gap-2 text-white text-xs z-20">
                <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                <span>Mendeteksi kamera HP...</span>
              </div>
            )}
          </div>

          <p className="text-xs text-neutral-600 font-medium">
            ⚡ <strong>Deteksi Instan Aktif</strong>: Arahkan barcode tepat ke tengah kotak. Kamera akan memindai secara otomatis di semua jenis HP!
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
