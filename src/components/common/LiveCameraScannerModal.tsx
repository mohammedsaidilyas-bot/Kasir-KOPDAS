import React, { useEffect, useRef, useState } from 'react';
import { X, Camera, ShieldCheck, AlertCircle, Zap } from 'lucide-react';
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
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const intervalRef = useRef<any>(null);
  const isScanningRef = useRef<boolean>(false);

  const stopCamera = () => {
    isScanningRef.current = false;
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  const startCamera = async () => {
    if (!isOpen) return;
    setIsLoading(true);
    setErrorMsg('');
    await stopCamera();

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: 'environment' },
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: false,
      });

      streamRef.current = stream;
      setPermissionState('granted');
      setIsLoading(false);
      isScanningRef.current = true;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play().catch(() => {});
      }

      const html5QrCode = new Html5Qrcode('html5-qrcode-hidden-decoder');
      
      intervalRef.current = setInterval(async () => {
        if (!isScanningRef.current || !videoRef.current) return;
        const video = videoRef.current;
        if (video.videoWidth === 0 || video.videoHeight === 0) return;

        try {
          const canvas = document.createElement('canvas');
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          const ctx = canvas.getContext('2d');
          if (!ctx) return;
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

          canvas.toBlob(async (blob) => {
            if (!blob || !isScanningRef.current) return;
            const file = new File([blob], 'frame.jpg', { type: 'image/jpeg' });
            try {
              const decodedText = await html5QrCode.scanFile(file, false);
              if (decodedText && isScanningRef.current) {
                isScanningRef.current = false;
                stopCamera();
                setPermissionState('prompt');
                onScanSuccess(decodedText);
                onClose();
              }
            } catch (err) {
              // Frame not decoded yet, keep scanning
            }
          }, 'image/jpeg', 0.85);
        } catch (e) {
          // Ignore frame capture error
        }
      }, 300);

    } catch (err: any) {
      console.error('Fast camera start error:', err);
      setIsLoading(false);
      setPermissionState('denied');
      setErrorMsg(
        'Kamera gagal dimulai. Pastikan izin kamera diizinkan di aplikasi WebIntoApp.'
      );
    }
  };

  const handleManualSnap = async () => {
    if (!videoRef.current || !isScanningRef.current) return;
    const video = videoRef.current;
    if (video.videoWidth === 0) return;

    try {
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      canvas.toBlob(async (blob) => {
        if (!blob) return;
        const file = new File([blob], 'snapshot.jpg', { type: 'image/jpeg' });
        try {
          const html5QrCode = new Html5Qrcode('html5-qrcode-hidden-decoder');
          const decodedText = await html5QrCode.scanFile(file, true);
          if (decodedText && isScanningRef.current) {
            isScanningRef.current = false;
            stopCamera();
            setPermissionState('prompt');
            onScanSuccess(decodedText);
            onClose();
          }
        } catch (e) {
          alert('Barcode belum terdeteksi. Posisikan barcode tepat di tengah kotak.');
        }
      }, 'image/jpeg', 0.95);
    } catch (e) {
      alert('Gagal memindai foto.');
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
              <span>Kamera Super Cepat</span>
            </div>
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
              <span>Izin Kamera</span>
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

        {/* Ultra-Fast Video Stream Viewport */}
        <div className={`space-y-3 ${permissionState !== 'granted' ? 'hidden' : 'block'}`}>
          <div className="relative rounded-2xl overflow-hidden bg-neutral-900 border-2 border-emerald-500 min-h-[260px] flex items-center justify-center shadow-inner">
            <video
              ref={videoRef}
              playsInline
              muted
              autoPlay
              className="w-full h-[260px] object-cover"
            />
            
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
              <div className="w-64 h-36 border-2 border-emerald-400 rounded-xl shadow-2xl relative flex items-center justify-center animate-pulse">
                <div className="absolute w-full h-0.5 bg-rose-500 top-1/2 -translate-y-1/2 animate-bounce" />
              </div>
            </div>

            {isLoading && (
              <div className="absolute inset-0 bg-neutral-900 flex flex-col items-center justify-center gap-2 text-white text-xs z-20">
                <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                <span>Membuka kamera kilat...</span>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={handleManualSnap}
            className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-sm flex items-center justify-center gap-2 cursor-pointer"
          >
            <Zap className="w-4 h-4 text-emerald-200 fill-emerald-200" />
            <span>📸 AMBIL & SCAN BARCODE SEKARANG</span>
          </button>

          <p className="text-xs text-neutral-600 font-medium">
            ⚡ Kamera menyala seketika. Arahkan ke barcode atau tekan tombol <strong>Ambil & Scan</strong> untuk deteksi kilat.
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

        <div id="html5-qrcode-hidden-decoder" className="hidden" />
      </div>
    </div>
  );
};
