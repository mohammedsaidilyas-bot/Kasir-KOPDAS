import React, { useState } from 'react';
import {
  ShoppingCart,
  Receipt,
  ArrowDownUp,
  Package,
  TrendingUp,
  Settings,
  Lock,
  UserCheck,
  Store,
  Layers,
  Send,
  LogOut,
} from 'lucide-react';
import { usePos } from '../context/PosContext';
import { UserRole } from '../types';
import { ClosingStoreModal } from './pos/ClosingStoreModal';

export const Navbar: React.FC = () => {
  const {
    currentRole,
    currentUserName,
    activeTab,
    setActiveTab,
    canAccessTab,
    openPinModal,
    loginAsRole,
    logout,
    customerType,
    setCustomerType,
    cartTotalQty,
    settings,
    cashiers,
  } = usePos();

  const [isClosingModalOpen, setIsClosingModalOpen] = useState(false);

  const navItems = [
    {
      id: 'pos' as const,
      label: 'Kasir POS',
      icon: ShoppingCart,
      badge: cartTotalQty > 0 ? cartTotalQty : null,
      requiredRole: 'kasir' as UserRole,
    },
    {
      id: 'history' as const,
      label: 'Riwayat Struk',
      icon: Receipt,
      requiredRole: 'kasir' as UserRole,
    },
    {
      id: 'inventory' as const,
      label: 'Barang Masuk & Keluar',
      icon: ArrowDownUp,
      requiredRole: 'pengelola' as UserRole,
    },
    {
      id: 'products' as const,
      label: 'Katalog Produk',
      icon: Package,
      requiredRole: 'pengelola' as UserRole,
    },
    {
      id: 'reports' as const,
      label: 'Laporan & Laba',
      icon: TrendingUp,
      requiredRole: 'admin' as UserRole,
    },
    {
      id: 'settings' as const,
      label: 'Kelola Kasir & Toko',
      icon: Settings,
      badge: currentRole === 'admin' ? `${cashiers.length} Kasir` : null,
      requiredRole: 'admin' as UserRole,
    },
  ];

  const roleColorBadge = {
    kasir: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    pengelola: 'bg-blue-50 text-blue-700 border-blue-200',
    admin: 'bg-purple-50 text-purple-700 border-purple-200',
  }[currentRole];

  const roleTitle = {
    kasir: 'Kasir (Jual Beli)',
    pengelola: 'Pengelola (Stok & Barang)',
    admin: 'Admin (Akses Penuh)',
  }[currentRole];

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-neutral-200 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between h-16">
        {/* Zone 1: Brand & Store Identity */}
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-neutral-900 text-white flex items-center justify-center font-bold shadow-xs">
            <Store className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-neutral-900 tracking-tight text-lg leading-tight">
                {settings.storeName}
              </span>
            </div>
            <p className="text-xs text-neutral-500 font-normal truncate max-w-[200px] sm:max-w-xs">
              {settings.tagline}
            </p>
          </div>
        </div>

        {/* Zone 2: Navigation Links with Role Authorization Indicators */}
        <nav className="hidden lg:flex items-center gap-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const hasAccess = canAccessTab(item.id);
            const isActive = activeTab === item.id;

            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center gap-2 px-3 py-2 text-xs font-medium rounded-lg transition-colors whitespace-nowrap ${
                  isActive
                    ? 'bg-neutral-900 text-white'
                    : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100'
                }`}
                title={
                  !hasAccess
                    ? `Perlu PIN ${
                        item.requiredRole === 'admin' ? 'Admin' : 'Pengelola'
                      } untuk membuka menu ini`
                    : undefined
                }
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{item.label}</span>
                {item.badge && (
                  <span className="ml-1 px-1.5 py-0.2 bg-emerald-500 text-white text-[10px] font-bold rounded-full">
                    {item.badge}
                  </span>
                )}
                {!hasAccess && (
                  <Lock className="w-3 h-3 text-neutral-400 ml-0.5 shrink-0" />
                )}
              </button>
            );
          })}
        </nav>

        {/* Zone 3: Quick Ecer/Grosir Mode Toggle & User Switcher */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Active Pricing Mode Switcher (POS quick action) */}
          <div className="hidden sm:flex items-center p-1 bg-neutral-100 rounded-lg border border-neutral-200">
            <button
              type="button"
              onClick={() => setCustomerType('ecer')}
              className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all ${
                customerType === 'ecer'
                  ? 'bg-white text-neutral-900 shadow-xs'
                  : 'text-neutral-500 hover:text-neutral-800'
              }`}
            >
              Mode Ecer
            </button>
            <button
              type="button"
              onClick={() => setCustomerType('grosir')}
              className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all flex items-center gap-1 ${
                customerType === 'grosir'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-neutral-500 hover:text-neutral-800'
              }`}
            >
              <Layers className="w-3 h-3" />
              <span>Mode Grosir</span>
            </button>
          </div>

          {/* User Role Switcher Button & Dropdown */}
          <div className="relative group">
            <button
              onClick={() => logout()}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-medium transition-all hover:shadow-xs cursor-pointer ${roleColorBadge}`}
              title="Klik untuk keluar / ganti peran (kembali ke tampilan awal kode akses)"
            >
              <UserCheck className="w-3.5 h-3.5 shrink-0" />
              <div className="text-left hidden sm:block">
                <span className="block font-semibold leading-tight">{currentUserName}</span>
                <span className="block text-[10px] opacity-80 leading-none">{roleTitle}</span>
              </div>
              <span className="sm:hidden font-semibold capitalize">{currentRole}</span>
            </button>

            {/* Hover / Dropdown Quick Switcher Menu */}
            <div className="absolute right-0 top-full pt-1.5 hidden group-hover:block z-50 min-w-[220px]">
              <div className="bg-white rounded-xl shadow-xl border border-neutral-200 p-2 space-y-1 animate-in fade-in zoom-in-95 duration-150">
                <div className="px-2 py-1 text-[10px] font-bold text-neutral-400 uppercase tracking-wider">
                  Pindah Peran (Kembali ke Awal):
                </div>
                
                <button
                  type="button"
                  onClick={() => logout('kasir')}
                  className={`w-full px-2.5 py-2 text-left rounded-lg text-xs flex items-center justify-between transition-colors cursor-pointer ${
                    currentRole === 'kasir'
                      ? 'bg-emerald-50 text-emerald-800 font-bold'
                      : 'hover:bg-neutral-100 text-neutral-700'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                    <span>Pindah ke Kasir</span>
                  </div>
                  <span className="text-[10px] text-neutral-400 font-mono">Kode Awal</span>
                </button>

                <button
                  type="button"
                  onClick={() => logout('pengelola')}
                  className={`w-full px-2.5 py-2 text-left rounded-lg text-xs flex items-center justify-between transition-colors cursor-pointer ${
                    currentRole === 'pengelola'
                      ? 'bg-blue-50 text-blue-800 font-bold'
                      : 'hover:bg-neutral-100 text-neutral-700'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                    <span>Pindah ke Pengelola</span>
                  </div>
                  <span className="text-[10px] text-neutral-400 font-mono">Kode Awal</span>
                </button>

                <button
                  type="button"
                  onClick={() => logout('admin')}
                  className={`w-full px-2.5 py-2 text-left rounded-lg text-xs flex items-center justify-between transition-colors cursor-pointer ${
                    currentRole === 'admin'
                      ? 'bg-purple-50 text-purple-800 font-bold'
                      : 'hover:bg-neutral-100 text-neutral-700'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-purple-500"></span>
                    <span>Pindah ke Admin</span>
                  </div>
                  <span className="text-[10px] text-neutral-400 font-mono">Kode Awal</span>
                </button>

                <div className="border-t border-neutral-100 pt-1 mt-1">
                  <button
                    type="button"
                    onClick={() => logout()}
                    className="w-full text-left px-2.5 py-1.5 text-xs text-rose-600 hover:bg-rose-50 rounded-lg font-semibold flex items-center gap-2 transition-colors cursor-pointer"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Keluar ke Tampilan Awal</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Lock / Switch User Button */}
          <button
            type="button"
            onClick={() => logout()}
            className="p-1.5 rounded-lg border border-neutral-200 text-neutral-500 hover:text-rose-600 hover:bg-rose-50 hover:border-rose-200 transition-all cursor-pointer"
            title="Keluar / Pindah Kasir (Kembali ke Tampilan Awal)"
          >
            <LogOut className="w-4 h-4" />
          </button>

          {/* Tutup Toko & Rekap WA Button */}
          <button
            type="button"
            onClick={() => setIsClosingModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-2xs transition-all cursor-pointer whitespace-nowrap active:scale-95"
            title="Klik saat toko tutup untuk kirim laporan omzet & laba hari ini ke WhatsApp Admin"
          >
            <Send className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Tutup Toko (Rekap WA)</span>
            <span className="sm:hidden">Tutup Toko</span>
          </button>
        </div>
      </div>

      {/* Closing Store WhatsApp Modal */}
      <ClosingStoreModal
        isOpen={isClosingModalOpen}
        onClose={() => setIsClosingModalOpen(false)}
      />

      {/* Mobile Horizontal Navigation Bar */}
      <div className="lg:hidden flex items-center gap-1 overflow-x-auto px-3 py-2 border-t border-neutral-200 bg-neutral-50 text-xs">
        {navItems.map((item) => {
          const Icon = item.icon;
          const hasAccess = canAccessTab(item.id);
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md whitespace-nowrap shrink-0 font-medium ${
                isActive
                  ? 'bg-neutral-900 text-white shadow-xs'
                  : 'text-neutral-600 hover:bg-neutral-200/60'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{item.label}</span>
              {!hasAccess && <Lock className="w-2.5 h-2.5 text-neutral-400" />}
            </button>
          );
        })}
      </div>
    </header>
  );
};
