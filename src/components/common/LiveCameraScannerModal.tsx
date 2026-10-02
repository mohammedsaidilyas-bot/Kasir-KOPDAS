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
  const [isProcessingSnap, setIsProcessingSnap] = useState<boolean>(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const readerDivId = 'html5-qr-reader-live-view';

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

  const startLiveCamera = async () => {
    setIsLoading(true);
    setErrorMsg('');
    stopCamera();

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: 'environment' },
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      });
      streamRef.current = stream;
      setPermissionState('granted');
      setIsLoading(false);

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch(() => {});
      }

      setTimeout(async () => {
        try {
          const html5QrCode = new Html5Qrcode(readerDivId);
          scannerRef.current = html5QrCode;

          await html5QrCode.start(
            { facingMode: 'environment' },
            {
              fps: 15,
              qrbox: { width: 280, height: 160 },
            },
            (decodedText) => {
              stopCamera();
              setPermissionState('prompt');
              onScanSuccess(decodedText);
              onClose();
            },
            () => {}
          );
        } catch (err: any) {
          console.warn('Html5Qrcode live start warning:', err);
        }
      }, 400);

    } catch (err: any) {
      console.error('Live camera error:', err);
      setIsLoading(false);
      setPermissionState('denied');
      setErrorMsg(
        'Akses kamera dibatasi. Pastikan izin kamera diaktifkan.'
      );
    }
  };

  const handleSnapAndDecode = async () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    if (video.videoWidth === 0 || video.videoHeight === 0) {
      alert('Kamera belum siap sepenuhnya. Mohon tunggu 1 detik.');
      return;
    }

    try {
      setIsProcessingSnap(true);
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        setIsProcessingSnap(false);
        return;
      }

      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      canvas.toBlob(async (blob) => {
        if (!blob) {
          setIsProcessingSnap(false);
          alert('Gagal mengambil foto dari kamera.');
          return;
        }

        const file = new File([blob], 'barcode-snapshot.jpg', { type: 'image/jpeg' });
        try {
          const qr = new Html5Qrcode('html5-qrcode-snapshot-hidden');
          const decodedText = await qr.scanFile(file, true);
          setIsProcessingSnap(false);
          stopCamera();
          setPermissionState('prompt');
          onScanSuccess(decodedText);
          onClose();
        } catch (scanErr) {
          setIsProcessingSnap(false);
          alert('Barcode tidak terdeteksi pada foto ini. Pastikan posisi barcode tepat di tengah kotak dan pencahayaan terang.');
        }
      }, 'image/jpeg', 0.95);

    } catch (err) {
      setIsProcessingSnap(false);
      alert('Terjadi kesalahan saat memindai foto.');
    }
  };

  useEffect(() => {
    if (!isOpen) {
      stopCamera();
      setPermissionState('prompt');
      setErrorMsg('');
      setIsLoading(false);
      setIsProcessingSnap(false);
      return;
    }

    startLiveCamera();

    return () => {
      stopCamera();
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
              <span>Izin Kamera Live</span>
            </div>
            <button
              type="button"
              onClick={startLiveCamera}
              disabled={isLoading}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-sm cursor-pointer"
            >
              Aktifkan Kamera
            </button>
          </div>
        )}

        {permissionState === 'denied' && (
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl space-y-3 text-left">
            <div className="flex items-center gap-2 text-amber-900 font-bold text-xs">
              <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
              <span>Kamera Belum Diizinkan</span>
            </div>
            <p className="text-[11px] text-amber-800">{errorMsg}</p>
            <button
              type="button"
              onClick={startLiveCamera}
              className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-sm cursor-pointer"
            >
              Coba Ulang
            </button>
          </div>
        )}

        {/* Live Camera Viewport */}
        <div className={`space-y-3 ${permissionState !== 'granted' ? 'hidden' : 'block'}`}>
          <div className="relative rounded-2xl overflow-hidden bg-neutral-900 border-2 border-emerald-500 min-h-[240px] flex items-center justify-center shadow-inner">
            <video
              ref={videoRef}
              playsInline
              muted
              autoPlay
              className="w-full h-[240px] object-cover"
            />
            
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
              <div className="w-64 h-32 border-2 border-emerald-400 rounded-xl shadow-2xl relative flex items-center justify-center">
                <div className="absolute w-full h-0.5 bg-rose-500 top-1/2 -translate-y-1/2 animate-pulse" />
              </div>
            </div>

            <div id={readerDivId} className="absolute inset-0 opacity-0 pointer-events-none" />

            {isLoading && (
              <div className="absolute inset-0 bg-neutral-900 flex flex-col items-center justify-center gap-2 text-white text-xs">
                <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                <span>Menyalakan kamera...</span>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={handleSnapAndDecode}
            disabled={isProcessingSnap}
            className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <Zap className="w-4 h-4 text-emerald-200 fill-emerald-200" />
            <span>{isProcessingSnap ? 'Memproses Barcode...' : '📸 AMBIL & DETEKSI BARCODE SEKARANG'}</span>
          </button>

          <p className="text-[11px] text-neutral-500">
            Arahkan barcode ke dalam kotak merah, lalu tekan tombol <strong>Ambil & Deteksi</strong> di atas agar terbaca seketika.
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

        <div id="html5-qrcode-snapshot-hidden" className="hidden" />
      </div>
    </div>
  );
};
