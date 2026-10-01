import React, { useState, useEffect } from 'react';
import { Lock, X, KeyRound, ShieldAlert, ArrowRight, ShoppingCart, ArrowDownUp, TrendingUp, Sparkles } from 'lucide-react';
import { usePos } from '../context/PosContext';
import { UserRole } from '../types';

export const PinModal: React.FC = () => {
  const {
    isPinModalOpen,
    closePinModal,
    switchRole,
    loginAsRole,
    verifyPin,
    targetRoleForModal,
    pinModalMode,
    pendingAction,
    settings,
  } = usePos();

  const [selectedRole, setSelectedRole] = useState<UserRole>('kasir');
  const [pin, setPin] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');

  useEffect(() => {
    if (isPinModalOpen) {
      if (targetRoleForModal) {
        setSelectedRole(targetRoleForModal);
      }
      setPin('');
      setErrorMessage('');
    }
  }, [isPinModalOpen, targetRoleForModal]);

  if (!isPinModalOpen) return null;

  const handleKeyPress = (digit: string) => {
    if (pin.length < 6) {
      const newPin = pin + digit;
      setPin(newPin);
      setErrorMessage('');

      // Auto-submit if PIN length matches the 4-digit code
      const defaultPin = {
        kasir: settings.pinKasir,
        pengelola: settings.pinPengelola,
        admin: settings.pinAdmin,
      }[selectedRole];

      if (newPin.length === defaultPin.length) {
        if (newPin === defaultPin) {
          setTimeout(() => {
            loginAsRole(selectedRole);
          }, 150);
        }
      }
    }
  };

  const handleBackspace = () => {
    setPin((prev) => prev.slice(0, -1));
    setErrorMessage('');
  };

  const handleClear = () => {
    setPin('');
    setErrorMessage('');
  };

  const handleSubmit = () => {
    if (!pin) {
      setErrorMessage('Silakan masukkan kode PIN');
      return;
    }

    if (pinModalMode === 'verify_action') {
      const isValid = verifyPin(selectedRole, pin);
      if (isValid) {
        if (pendingAction) {
          pendingAction();
        }
        closePinModal();
      } else {
        setErrorMessage('Kode PIN salah! Silakan coba lagi.');
        setPin('');
      }
    } else {
      const success = switchRole(selectedRole, pin);
      if (success) {
        closePinModal();
      } else {
        setErrorMessage('Kode PIN salah! Silakan coba lagi.');
        setPin('');
      }
    }
  };

  const roleOptions: Array<{
    role: UserRole;
    title: string;
    pin: string;
    pageLabel: string;
    icon: React.ReactNode;
    color: string;
    border: string;
  }> = [
    {
      role: 'kasir',
      title: 'Kasir',
      pin: settings.pinKasir,
      pageLabel: 'Masuk Kasir POS (Jual Beli)',
      icon: <ShoppingCart className="w-4 h-4 text-emerald-600" />,
      color: 'bg-emerald-50 hover:bg-emerald-100/80 text-emerald-900',
      border: 'border-emerald-200',
    },
    {
      role: 'pengelola',
      title: 'Pengelola',
      pin: settings.pinPengelola,
      pageLabel: 'Masuk Input Barang Masuk & Keluar',
      icon: <ArrowDownUp className="w-4 h-4 text-blue-600" />,
      color: 'bg-blue-50 hover:bg-blue-100/80 text-blue-900',
      border: 'border-blue-200',
    },
    {
      role: 'admin',
      title: 'Admin Toko',
      pin: settings.pinAdmin,
      pageLabel: 'Masuk Laporan & Analisis Laba',
      icon: <TrendingUp className="w-4 h-4 text-purple-600" />,
      color: 'bg-purple-50 hover:bg-purple-100/80 text-purple-900',
      border: 'border-purple-200',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-neutral-200 w-full max-w-md my-auto overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-neutral-100 flex items-center justify-between bg-neutral-50/70">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-neutral-900 text-white flex items-center justify-center">
              <Lock className="w-4 h-4 text-emerald-400" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-neutral-900">
                Pilih Kode Akses Pengguna
              </h2>
              <p className="text-xs text-neutral-500">
                Klik peran/kode untuk langsung masuk ke halaman
              </p>
            </div>
          </div>
          <button
            onClick={closePinModal}
            className="p-1 rounded-md text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-4">
          {/* Quick Direct-Access Buttons (1-Click เข้าสู่หน้าทันที) */}
          <div>
            <label className="block text-xs font-semibold text-neutral-700 mb-2 flex items-center justify-between">
              <span>Klik Kode untuk Langsung Masuk ke Halaman:</span>
              <span className="text-[11px] text-emerald-600 font-normal flex items-center gap-1">
                <Sparkles className="w-3 h-3" /> 1-Klik Langsung Masuk
              </span>
            </label>

            <div className="space-y-2">
              {roleOptions.map((opt) => (
                <button
                  key={opt.role}
                  type="button"
                  onClick={() => {
                    loginAsRole(opt.role);
                  }}
                  className={`w-full p-3 rounded-xl border ${opt.border} ${opt.color} flex items-center justify-between text-left transition-all active:scale-[0.98] shadow-2xs group`}
                >
                  <div className="flex items-center gap-2.5">
                    <div className="p-1.5 rounded-lg bg-white shadow-2xs">
                      {opt.icon}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs">{opt.title}</span>
                        <span className="text-[10px] font-mono px-1.5 py-0.2 bg-white/80 rounded border font-semibold">
                          Kode: {opt.pin}
                        </span>
                      </div>
                      <span className="text-[11px] opacity-80 block">{opt.pageLabel}</span>
                    </div>
                  </div>

                  <div className="flex items-center text-xs font-bold gap-1 group-hover:translate-x-0.5 transition-transform">
                    <span>Masuk</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="relative flex py-1 items-center">
            <div className="flex-grow border-t border-neutral-200"></div>
            <span className="flex-shrink mx-3 text-[10px] text-neutral-400 uppercase tracking-wider font-semibold">
              atau ketik kode PIN manual
            </span>
            <div className="flex-grow border-t border-neutral-200"></div>
          </div>

          {/* Role selector tabs for manual input */}
          <div className="grid grid-cols-3 gap-1.5 p-1 bg-neutral-100 rounded-xl">
            {(['kasir', 'pengelola', 'admin'] as UserRole[]).map((role) => (
              <button
                key={role}
                type="button"
                onClick={() => {
                  setSelectedRole(role);
                  setPin('');
                  setErrorMessage('');
                }}
                className={`py-1.5 px-2 text-xs font-semibold rounded-lg transition-all text-center capitalize ${
                  selectedRole === role
                    ? 'bg-white text-neutral-900 shadow-xs'
                    : 'text-neutral-500 hover:text-neutral-800'
                }`}
              >
                {role}
              </button>
            ))}
          </div>

          {/* PIN Input Display */}
          <div className="flex flex-col items-center justify-center pt-1 pb-1">
            <div className="flex items-center gap-3">
              {[0, 1, 2, 3].map((index) => {
                const filled = pin.length > index;
                return (
                  <div
                    key={index}
                    className={`w-9 h-11 rounded-xl flex items-center justify-center border-2 transition-all ${
                      filled
                        ? 'border-neutral-900 bg-neutral-900 text-white shadow-xs'
                        : 'border-neutral-300 bg-neutral-50'
                    }`}
                  >
                    {filled ? (
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-400"></span>
                    ) : (
                      <span className="w-1.5 h-1.5 rounded-full bg-neutral-300"></span>
                    )}
                  </div>
                );
              })}
            </div>

            {errorMessage && (
              <div className="flex items-center gap-1.5 text-xs text-rose-600 mt-2 font-medium">
                <ShieldAlert className="w-3.5 h-3.5" />
                <span>{errorMessage}</span>
              </div>
            )}
          </div>

          {/* Numeric Keypad */}
          <div className="grid grid-cols-3 gap-1.5 max-w-xs mx-auto">
            {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((num) => (
              <button
                key={num}
                type="button"
                onClick={() => handleKeyPress(num)}
                className="h-10 rounded-xl bg-neutral-100 hover:bg-neutral-200 text-neutral-800 text-base font-mono font-semibold transition-all active:scale-95"
              >
                {num}
              </button>
            ))}
            <button
              type="button"
              onClick={handleClear}
              className="h-10 rounded-xl bg-neutral-100 hover:bg-rose-50 hover:text-rose-600 text-neutral-600 text-xs font-semibold transition-all"
            >
              Hapus
            </button>
            <button
              type="button"
              onClick={() => handleKeyPress('0')}
              className="h-10 rounded-xl bg-neutral-100 hover:bg-neutral-200 text-neutral-800 text-base font-mono font-semibold transition-all active:scale-95"
            >
              0
            </button>
            <button
              type="button"
              onClick={handleBackspace}
              className="h-10 rounded-xl bg-neutral-100 hover:bg-neutral-200 text-neutral-600 text-xs font-semibold transition-all"
            >
              ⌫
            </button>
          </div>

          {/* Action Button */}
          <div className="pt-1">
            <button
              type="button"
              onClick={handleSubmit}
              disabled={pin.length < 4}
              className="w-full py-2.5 bg-neutral-900 hover:bg-neutral-800 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold text-xs rounded-xl transition-all shadow-xs flex items-center justify-center gap-2"
            >
              <KeyRound className="w-3.5 h-3.5 text-emerald-400" />
              <span>Verifikasi & Masuk Halaman</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
