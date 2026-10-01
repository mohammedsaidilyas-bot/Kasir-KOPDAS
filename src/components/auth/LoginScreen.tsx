import React, { useState } from 'react';
import {
  Store,
  Shield,
  ArrowRight,
  ShoppingCart,
  ArrowDownUp,
  KeyRound,
  ShieldAlert,
  Sparkles,
  Users,
  Check,
  UserCheck,
} from 'lucide-react';
import { usePos } from '../../context/PosContext';
import { UserRole } from '../../types';

export const LoginScreen: React.FC = () => {
  const {
    settings,
    cashiers,
    loginCashier,
    loginAsRole,
    verifyPin,
    initialRoleForLogin,
  } = usePos();

  const [selectedRole, setSelectedRole] = useState<UserRole>(initialRoleForLogin || 'kasir');
  const [selectedCashierId, setSelectedCashierId] = useState<string>(
    cashiers[0]?.id || ''
  );
  const [pin, setPin] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');

  React.useEffect(() => {
    if (initialRoleForLogin) {
      setSelectedRole(initialRoleForLogin);
      setPin('');
      setErrorMessage('');
    }
  }, [initialRoleForLogin]);

  const activeCashiers = cashiers.filter((c) => c.isActive);
  const currentSelectedCashier =
    activeCashiers.find((c) => c.id === selectedCashierId) || activeCashiers[0];

  const handleKeyPress = (digit: string) => {
    if (pin.length < 6) {
      const newPin = pin + digit;
      setPin(newPin);
      setErrorMessage('');

      // Auto-check PIN
      if (selectedRole === 'kasir' && currentSelectedCashier) {
        if (newPin === currentSelectedCashier.pin || newPin === settings.pinKasir) {
          setTimeout(() => {
            loginCashier(currentSelectedCashier.id, newPin);
          }, 120);
        }
      } else if (selectedRole === 'pengelola') {
        if (newPin === settings.pinPengelola) {
          setTimeout(() => {
            loginAsRole('pengelola');
          }, 120);
        }
      } else if (selectedRole === 'admin') {
        if (newPin === settings.pinAdmin) {
          setTimeout(() => {
            loginAsRole('admin');
          }, 120);
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

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    if (!pin) {
      setErrorMessage('Silakan masukkan kode PIN akses');
      return;
    }

    if (selectedRole === 'kasir') {
      if (!currentSelectedCashier) {
        setErrorMessage('Silakan pilih petugas kasir');
        return;
      }
      const success = loginCashier(currentSelectedCashier.id, pin);
      if (!success) {
        setErrorMessage('Kode PIN kasir salah! Silakan coba lagi.');
        setPin('');
      }
    } else {
      const isValid = verifyPin(selectedRole, pin);
      if (isValid) {
        loginAsRole(selectedRole);
      } else {
        setErrorMessage('Kode PIN salah! Silakan coba lagi.');
        setPin('');
      }
    }
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-white flex flex-col justify-between p-3 sm:p-6 selection:bg-emerald-500 selection:text-white">
      {/* Top Brand Header */}
      <div className="max-w-md w-full mx-auto text-center pt-2 sm:pt-4 space-y-1.5">
        <div className="w-12 h-12 rounded-2xl bg-neutral-900 border border-neutral-800 text-emerald-400 flex items-center justify-center mx-auto shadow-lg shadow-black/50">
          <Store className="w-6 h-6" />
        </div>
        <h1 className="text-lg sm:text-xl font-bold tracking-tight text-white">
          {settings.storeName}
        </h1>
        <p className="text-xs text-neutral-400">
          {settings.tagline || 'Aplikasi Kasir Grosir & Eceran · Multi-Kasir'}
        </p>
      </div>

      {/* Main Terminal Card */}
      <div className="max-w-sm w-full mx-auto my-auto bg-neutral-900/90 border border-neutral-800 rounded-3xl p-5 sm:p-6 shadow-2xl backdrop-blur-md space-y-4">
        {/* Top Role Selector Buttons */}
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 block text-center mb-1.5">
            Pilih Peran Akses Masuk:
          </span>
          <div className="grid grid-cols-3 gap-1.5 p-1 bg-neutral-950 rounded-2xl border border-neutral-800">
            <button
              type="button"
              onClick={() => {
                setSelectedRole('kasir');
                setPin('');
                setErrorMessage('');
              }}
              className={`py-2 px-1 text-xs font-bold rounded-xl transition-all flex flex-col items-center justify-center gap-1 cursor-pointer ${
                selectedRole === 'kasir'
                  ? 'bg-emerald-600 text-white shadow-xs border border-emerald-500'
                  : 'text-neutral-400 hover:text-white hover:bg-neutral-900'
              }`}
            >
              <ShoppingCart className="w-3.5 h-3.5" />
              <span>Kasir</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setSelectedRole('pengelola');
                setPin('');
                setErrorMessage('');
              }}
              className={`py-2 px-1 text-xs font-bold rounded-xl transition-all flex flex-col items-center justify-center gap-1 cursor-pointer ${
                selectedRole === 'pengelola'
                  ? 'bg-blue-600 text-white shadow-xs border border-blue-500'
                  : 'text-neutral-400 hover:text-white hover:bg-neutral-900'
              }`}
            >
              <ArrowDownUp className="w-3.5 h-3.5" />
              <span>Pengelola</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setSelectedRole('admin');
                setPin('');
                setErrorMessage('');
              }}
              className={`py-2 px-1 text-xs font-bold rounded-xl transition-all flex flex-col items-center justify-center gap-1 cursor-pointer ${
                selectedRole === 'admin'
                  ? 'bg-purple-600 text-white shadow-xs border border-purple-500'
                  : 'text-neutral-400 hover:text-white hover:bg-neutral-900'
              }`}
            >
              <Shield className="w-3.5 h-3.5" />
              <span>Admin</span>
            </button>
          </div>
        </div>

        {/* If Kasir: Multiple Cashiers Selector Chips */}
        {selectedRole === 'kasir' && (
          <div className="space-y-1.5 bg-neutral-950/70 p-2.5 rounded-2xl border border-neutral-800">
            <div className="flex items-center justify-between text-[11px] text-neutral-300 font-semibold px-1">
              <span className="flex items-center gap-1 text-emerald-400">
                <Users className="w-3 h-3" />
                <span>Pilih Petugas Kasir ({activeCashiers.length} Kasir):</span>
              </span>
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full">
              {activeCashiers.map((csh) => {
                const isSelected = (currentSelectedCashier?.id || '') === csh.id;
                return (
                  <button
                    key={csh.id}
                    type="button"
                    onClick={() => {
                      setSelectedCashierId(csh.id);
                      setPin('');
                      setErrorMessage('');
                    }}
                    className={`px-2.5 py-1.5 rounded-xl border text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer ${
                      isSelected
                        ? 'bg-emerald-950/80 border-emerald-500 text-emerald-300 shadow-2xs'
                        : 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:text-neutral-200 hover:bg-neutral-850'
                    }`}
                  >
                    <UserCheck className={`w-3 h-3 ${isSelected ? 'text-emerald-400' : 'text-neutral-500'}`} />
                    <span>{csh.name}</span>
                    <span className="text-[10px] opacity-70 font-mono">({csh.pin})</span>
                    {isSelected && <Check className="w-3 h-3 text-emerald-400" />}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Role Description Badge */}
        <div className="text-center px-2">
          {selectedRole === 'kasir' && currentSelectedCashier && (
            <p className="text-[11px] text-neutral-400">
              Petugas: <strong className="text-emerald-400">{currentSelectedCashier.name}</strong> · Akses Jual Beli & Cetak Struk
            </p>
          )}
          {selectedRole === 'pengelola' && (
            <p className="text-[11px] text-neutral-400">
              Akses Pengelola: <strong className="text-blue-400">Input Barang Masuk & Keluar, Stok & Katalog</strong>
            </p>
          )}
          {selectedRole === 'admin' && (
            <p className="text-[11px] text-neutral-400">
              Akses Admin: <strong className="text-purple-400">Laporan Omzet/Laba, Kelola Banyak Kasir & Tutup Toko</strong>
            </p>
          )}
        </div>

        {/* Direct PIN Input Display Indicators ("Langsung Kode") */}
        <div className="flex flex-col items-center justify-center">
          <span className="text-[11px] font-semibold text-neutral-400 mb-2">
            Masukkan Kode PIN:
          </span>
          <div className="flex items-center gap-2.5">
            {[0, 1, 2, 3].map((index) => {
              const filled = pin.length > index;
              return (
                <div
                  key={index}
                  className={`w-11 h-12 rounded-xl flex items-center justify-center border-2 transition-all ${
                    filled
                      ? 'border-emerald-500 bg-neutral-950 text-white shadow-xs'
                      : 'border-neutral-800 bg-neutral-950/60'
                  }`}
                >
                  {filled ? (
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  ) : (
                    <span className="w-1.5 h-1.5 rounded-full bg-neutral-700"></span>
                  )}
                </div>
              );
            })}
          </div>

          {errorMessage && (
            <div className="flex items-center gap-1.5 text-xs text-rose-400 mt-2 font-medium">
              <ShieldAlert className="w-3.5 h-3.5 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}
        </div>

        {/* Numeric Keypad */}
        <div className="grid grid-cols-3 gap-1.5 max-w-[270px] mx-auto">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((num) => (
            <button
              key={num}
              type="button"
              onClick={() => handleKeyPress(num)}
              className="h-10 rounded-xl bg-neutral-950 hover:bg-neutral-800 text-white text-base font-mono font-bold transition-all active:scale-95 border border-neutral-800/80 cursor-pointer"
            >
              {num}
            </button>
          ))}
          <button
            type="button"
            onClick={handleClear}
            className="h-10 rounded-xl bg-neutral-950/70 hover:bg-rose-950/60 text-neutral-400 hover:text-rose-400 text-xs font-semibold transition-all border border-neutral-800/80 cursor-pointer"
          >
            Hapus
          </button>
          <button
            type="button"
            onClick={() => handleKeyPress('0')}
            className="h-10 rounded-xl bg-neutral-950 hover:bg-neutral-800 text-white text-base font-mono font-bold transition-all active:scale-95 border border-neutral-800/80 cursor-pointer"
          >
            0
          </button>
          <button
            type="button"
            onClick={handleBackspace}
            className="h-10 rounded-xl bg-neutral-950 hover:bg-neutral-800 text-neutral-300 text-sm font-bold transition-all border border-neutral-800/80 cursor-pointer"
          >
            ⌫
          </button>
        </div>

        {/* 1-Click Instant Enter Shortcut Button */}
        <div>
          {selectedRole === 'kasir' && currentSelectedCashier && (
            <button
              type="button"
              onClick={() => {
                loginCashier(currentSelectedCashier.id, currentSelectedCashier.pin);
              }}
              className="w-full py-2.5 px-3 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl transition-all flex items-center justify-between shadow-xs cursor-pointer active:scale-98"
            >
              <span className="flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-emerald-200" />
                <span>Langsung Masuk sebagai {currentSelectedCashier.name} ({currentSelectedCashier.pin})</span>
              </span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}

          {selectedRole === 'pengelola' && (
            <button
              type="button"
              onClick={() => loginAsRole('pengelola')}
              className="w-full py-2.5 px-3 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl transition-all flex items-center justify-between shadow-xs cursor-pointer active:scale-98"
            >
              <span className="flex items-center gap-1.5">
                <ArrowDownUp className="w-3.5 h-3.5 text-blue-200" />
                <span>Langsung Masuk sebagai Pengelola ({settings.pinPengelola})</span>
              </span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}

          {selectedRole === 'admin' && (
            <button
              type="button"
              onClick={() => loginAsRole('admin')}
              className="w-full py-2.5 px-3 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold rounded-xl transition-all flex items-center justify-between shadow-xs cursor-pointer active:scale-98"
            >
              <span className="flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-purple-200" />
                <span>Langsung Masuk sebagai Admin ({settings.pinAdmin})</span>
              </span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* PIN Submit Button if user typed pin manually */}
        {pin.length >= 4 && (
          <button
            type="button"
            onClick={() => handleSubmit()}
            className="w-full py-2.5 bg-white hover:bg-neutral-100 text-neutral-950 font-bold text-xs rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
          >
            <KeyRound className="w-3.5 h-3.5 text-emerald-600" />
            <span>Verifikasi & Masuk Aplikasi</span>
          </button>
        )}
      </div>

      {/* Bottom Footer Information with 1-Click Fast Jump Pills */}
      <div className="max-w-md w-full mx-auto text-center pb-2 space-y-1.5">
        <div className="flex flex-wrap items-center justify-center gap-1.5 text-xs">
          <span className="text-neutral-500 text-[10px] block w-full sm:w-auto">Akses Cepat Pengujian:</span>
          <button
            type="button"
            onClick={() => {
              if (currentSelectedCashier) {
                loginCashier(currentSelectedCashier.id, currentSelectedCashier.pin);
              } else {
                loginAsRole('kasir');
              }
            }}
            className="px-2 py-0.5 bg-neutral-900 hover:bg-neutral-800 text-emerald-400 border border-neutral-800 rounded-lg text-xs font-mono font-semibold transition-all cursor-pointer"
          >
            Kasir ({settings.pinKasir})
          </button>
          <button
            type="button"
            onClick={() => loginAsRole('pengelola')}
            className="px-2 py-0.5 bg-neutral-900 hover:bg-neutral-800 text-blue-400 border border-neutral-800 rounded-lg text-xs font-mono font-semibold transition-all cursor-pointer"
          >
            Pengelola ({settings.pinPengelola})
          </button>
          <button
            type="button"
            onClick={() => loginAsRole('admin')}
            className="px-2 py-0.5 bg-neutral-900 hover:bg-neutral-800 text-purple-400 border border-neutral-800 rounded-lg text-xs font-mono font-semibold transition-all cursor-pointer"
          >
            Admin ({settings.pinAdmin})
          </button>
        </div>
        <p className="text-[10px] text-neutral-500">
          KasirKu POS · Multi-Kasir Dikelola oleh Admin & Laporan Tutup Toko WhatsApp
        </p>
      </div>
    </div>
  );
};
