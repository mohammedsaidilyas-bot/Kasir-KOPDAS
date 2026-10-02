import React from 'react';
import { PosProvider, usePos } from './context/PosContext';
import { Navbar } from './components/Navbar';
import { PinModal } from './components/PinModal';
import { LoginScreen } from './components/auth/LoginScreen';
import { PosView } from './components/pos/PosView';
import { TransactionHistoryView } from './components/history/TransactionHistoryView';
import { StockManagementView } from './components/inventory/StockManagementView';
import { ProductCatalogView } from './components/products/ProductCatalogView';
import { ReportsView } from './components/reports/ReportsView';
import { SettingsView } from './components/settings/SettingsView';
import { PwaInstallBanner } from './components/common/PwaInstallBanner';
import { Lock, Shield, LogOut } from 'lucide-react';

const MainContent: React.FC = () => {
  const { activeTab, canAccessTab, loginAsRole, openPinModal, settings } = usePos();

  if (!canAccessTab(activeTab)) {
    const required = activeTab === 'settings' ? 'admin' : 'pengelola';
    const requiredPin = required === 'admin' ? settings.pinAdmin : settings.pinPengelola;

    return (
      <div className="max-w-md mx-auto my-16 px-4 text-center space-y-4">
        <div className="w-14 h-14 rounded-2xl bg-neutral-900 text-white flex items-center justify-center mx-auto shadow-md">
          <Lock className="w-7 h-7 text-emerald-400" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-neutral-900">Akses Terkunci</h2>
          <p className="text-xs text-neutral-500 mt-1">
            Menu ini membutuhkan hak akses <strong className="capitalize">{required}</strong>.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-2 pt-2">
          {/* Direct 1-Click login button */}
          <button
            type="button"
            onClick={() => loginAsRole(required, activeTab)}
            className="w-full sm:w-auto px-5 py-2.5 bg-neutral-900 hover:bg-neutral-800 text-white font-semibold text-xs rounded-xl shadow-xs transition-all inline-flex items-center justify-center gap-2 cursor-pointer"
          >
            <Shield className="w-4 h-4 text-emerald-400" />
            <span>Langsung Masuk sebagai {required} ({requiredPin})</span>
          </button>

          <button
            type="button"
            onClick={() => openPinModal(required)}
            className="w-full sm:w-auto px-4 py-2.5 border border-neutral-300 hover:bg-neutral-100 text-neutral-700 font-semibold text-xs rounded-xl transition-all"
          >
            Ketik PIN Manual
          </button>
        </div>
      </div>
    );
  }

  switch (activeTab) {
    case 'pos':
      return <PosView />;
    case 'history':
      return <TransactionHistoryView />;
    case 'inventory':
      return <StockManagementView />;
    case 'products':
      return <ProductCatalogView />;
    case 'reports':
      return <ReportsView />;
    case 'settings':
      return <SettingsView />;
    default:
      return <PosView />;
  }
};

const FooterBar: React.FC = () => {
  const { loginAsRole, logout, settings } = usePos();

  return (
    <footer className="border-t border-neutral-200 bg-white py-3 text-xs text-neutral-500">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-neutral-800">KasirKu POS Online</span>
          <span>·</span>
          <span>Grosir & Eceran</span>
          <span>·</span>
          <span>Struk Thermal Siap Cetak</span>
        </div>

        <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-neutral-500">
          <span>Pindah Peran (Kembali ke Awal):</span>
          <button
            type="button"
            onClick={() => logout('kasir')}
            className="px-2 py-0.5 rounded-md bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 font-mono font-semibold transition-colors cursor-pointer"
            title="Klik untuk pindah ke Kasir dan kembali ke tampilan awal"
          >
            Pindah Kasir
          </button>
          <span>·</span>
          <button
            type="button"
            onClick={() => logout('pengelola')}
            className="px-2 py-0.5 rounded-md bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-200 font-mono font-semibold transition-colors cursor-pointer"
            title="Klik untuk pindah ke Pengelola dan kembali ke tampilan awal"
          >
            Pindah Pengelola
          </button>
          <span>·</span>
          <button
            type="button"
            onClick={() => logout('admin')}
            className="px-2 py-0.5 rounded-md bg-purple-50 hover:bg-purple-100 text-purple-800 border border-purple-200 font-mono font-semibold transition-colors cursor-pointer"
            title="Klik untuk pindah ke Admin dan kembali ke tampilan awal"
          >
            Pindah Admin
          </button>
          <span>·</span>
          <button
            type="button"
            onClick={() => logout()}
            className="px-2 py-0.5 rounded-md bg-neutral-100 hover:bg-neutral-200 text-neutral-700 border border-neutral-300 font-semibold transition-colors cursor-pointer flex items-center gap-1"
            title="Kembali ke Tampilan Awal Kode Akses"
          >
            <LogOut className="w-3 h-3 text-neutral-500" />
            <span>Keluar ke Awal</span>
          </button>
        </div>
      </div>
    </footer>
  );
};

const MainAppLayout: React.FC = () => {
  const { isAuthenticated } = usePos();

  // If not yet authenticated, immediately show the Access/Login Screen!
  if (!isAuthenticated) {
    return <LoginScreen />;
  }

  return (
    <div className="min-h-screen flex flex-col bg-neutral-50/80 text-neutral-900 selection:bg-neutral-900 selection:text-white">
      <Navbar />
      <main className="flex-1 pb-16">
        <MainContent />
      </main>
      <PinModal />
      <FooterBar />
      <PwaInstallBanner />
    </div>
  );
};

export default function App() {
  return (
    <PosProvider>
      <MainAppLayout />
    </PosProvider>
  );
}
