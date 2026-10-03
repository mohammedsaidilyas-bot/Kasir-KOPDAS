import React, { useState } from 'react';
import {
  Settings,
  Shield,
  Store,
  KeyRound,
  RotateCcw,
  Check,
  AlertTriangle,
  Users,
  Plus,
  Trash2,
  Edit2,
  X,
  UserCheck,
} from 'lucide-react';
import { usePos } from '../../context/PosContext';
import { CashierUser } from '../../types';

export const SettingsView: React.FC = () => {
  const {
    settings,
    updateSettings,
    resetAllData,
    cashiers,
    addCashier,
    updateCashier,
    deleteCashier,
  } = usePos();

  const [activeSubTab, setActiveSubTab] = useState<'store' | 'cashiers'>('cashiers');

  const [formData, setFormData] = useState({
    storeName: settings.storeName,
    tagline: settings.tagline,
    address: settings.address,
    phone: settings.phone,
    adminWaPhone: settings.adminWaPhone || '081234567890',
    receiptFooter: settings.receiptFooter,
    pinKasir: settings.pinKasir,
    pinPengelola: settings.pinPengelola,
    pinAdmin: settings.pinAdmin,
    qrisImageBase64: settings.qrisImageBase64 || '',
  });

  const [savedSuccess, setSavedSuccess] = useState(false);

  // Cashier modal states
  const [isCashierModalOpen, setIsCashierModalOpen] = useState(false);
  const [editingCashier, setEditingCashier] = useState<CashierUser | null>(null);
  const [cashierNameInput, setCashierNameInput] = useState('');
  const [cashierPinInput, setCashierPinInput] = useState('');
  const [cashierActiveInput, setCashierActiveInput] = useState(true);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings(formData);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const handleOpenAddCashier = () => {
    setEditingCashier(null);
    setCashierNameInput(`Kasir ${cashiers.length + 1}`);
    setCashierPinInput(`${Math.floor(1000 + Math.random() * 9000)}`);
    setCashierActiveInput(true);
    setIsCashierModalOpen(true);
  };

  const handleOpenEditCashier = (c: CashierUser) => {
    setEditingCashier(c);
    setCashierNameInput(c.name);
    setCashierPinInput(c.pin);
    setCashierActiveInput(c.isActive);
    setIsCashierModalOpen(true);
  };

  const handleSaveCashier = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cashierNameInput.trim() || !cashierPinInput.trim()) return;

    if (editingCashier) {
      updateCashier(
        editingCashier.id,
        cashierNameInput,
        cashierPinInput,
        cashierActiveInput
      );
    } else {
      addCashier(cashierNameInput, cashierPinInput);
    }
    setIsCashierModalOpen(false);
  };

  const handleDeleteCashier = (c: CashierUser) => {
    if (cashiers.length <= 1) {
      alert('Minimal harus ada 1 petugas kasir terdaftar di sistem.');
      return;
    }
    if (confirm(`Yakin ingin menghapus petugas kasir "${c.name}"?`)) {
      deleteCashier(c.id);
    }
  };

  const handleReset = () => {
    if (
      confirm(
        'PERINGATAN: Apakah Anda yakin ingin mereset seluruh data kasir kembali ke pengaturan awal pabrik?'
      )
    ) {
      resetAllData();
      alert('Semua data berhasil direset ke pengaturan awal.');
      window.location.reload();
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Title & Sub-tab switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-200 pb-4">
        <div>
          <h1 className="text-xl font-bold text-neutral-900 tracking-tight">
            Pengaturan Toko & Kelola Kasir
          </h1>
          <p className="text-xs text-neutral-500 mt-0.5">
            Atur identitas toko, nomor WhatsApp laporan, kode PIN peran, dan tambah petugas kasir.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1 p-1 bg-neutral-100 rounded-xl border border-neutral-200 text-xs">
            <button
              type="button"
              onClick={() => setActiveSubTab('cashiers')}
              className={`px-3 py-1.5 font-semibold rounded-lg transition-all flex items-center gap-1.5 ${
                activeSubTab === 'cashiers'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-neutral-600 hover:text-neutral-900'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Kelola Kasir ({cashiers.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveSubTab('store')}
              className={`px-3 py-1.5 font-semibold rounded-lg transition-all flex items-center gap-1.5 ${
                activeSubTab === 'store'
                  ? 'bg-neutral-900 text-white shadow-xs'
                  : 'text-neutral-600 hover:text-neutral-900'
              }`}
            >
              <Store className="w-3.5 h-3.5" />
              <span>Identitas & PIN Toko</span>
            </button>
          </div>

          <button
            type="button"
            onClick={handleOpenAddCashier}
            className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-xl shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ Tambah Kasir Baru</span>
          </button>
        </div>
      </div>

      {savedSuccess && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-semibold text-emerald-800 flex items-center gap-2 animate-in fade-in">
          <Check className="w-4 h-4 text-emerald-600" />
          <span>Pengaturan berhasil diperbarui dan disimpan!</span>
        </div>
      )}

      {/* Tab 1: Identitas & PIN Toko */}
      {activeSubTab === 'store' && (
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Identitas Toko & Struk Section */}
          <div className="bg-white border border-neutral-200 rounded-2xl p-6 shadow-xs space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-neutral-100">
              <Store className="w-5 h-5 text-neutral-800" />
              <h2 className="text-sm font-bold text-neutral-900">
                Identitas Toko & Format Header Struk
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">
                  Nama Toko / Usaha:
                </label>
                <input
                  type="text"
                  required
                  value={formData.storeName}
                  onChange={(e) => setFormData({ ...formData, storeName: e.target.value })}
                  className="w-full px-3 py-2 border border-neutral-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-neutral-900"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">
                  Slogan / Deskripsi Singkat:
                </label>
                <input
                  type="text"
                  value={formData.tagline}
                  onChange={(e) => setFormData({ ...formData, tagline: e.target.value })}
                  className="w-full px-3 py-2 border border-neutral-200 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-neutral-900"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">
                  Alamat Toko:
                </label>
                <input
                  type="text"
                  required
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full px-3 py-2 border border-neutral-200 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-neutral-900"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">
                  Nomor Telepon / WhatsApp Konsumen:
                </label>
                <input
                  type="text"
                  required
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-3 py-2 border border-neutral-200 rounded-xl text-xs font-mono focus:outline-none focus:ring-1 focus:ring-neutral-900"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">
                  Nomor WhatsApp Admin (Penerima Laporan Tutup Toko):
                </label>
                <input
                  type="text"
                  required
                  value={formData.adminWaPhone}
                  onChange={(e) => setFormData({ ...formData, adminWaPhone: e.target.value })}
                  placeholder="Contoh: 081234567890"
                  className="w-full px-3 py-2 border border-emerald-300 bg-emerald-50/30 rounded-xl text-xs font-mono font-bold text-emerald-950 focus:outline-none focus:ring-1 focus:ring-emerald-600"
                />
                <span className="text-[10px] text-neutral-400 mt-0.5 block">
                  Laporan pemasukan dan estimasi laba harian akan dikirim otomatis ke nomor ini saat tutup kasir.
                </span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1">
                Pesan Penutup di Bagian Bawah Struk:
              </label>
              <input
                type="text"
                value={formData.receiptFooter}
                onChange={(e) => setFormData({ ...formData, receiptFooter: e.target.value })}
                className="w-full px-3 py-2 border border-neutral-200 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-neutral-900"
              />
            </div>

            {/* QRIS Code Upload Section */}
            <div className="pt-4 border-t border-neutral-100">
              <label className="block text-xs font-bold text-neutral-900 mb-1.5 flex items-center gap-1.5">
                <span>Gambar QRIS Toko Anda (Opsional):</span>
                <span className="text-[10px] text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full font-bold">
                  Muncul otomatis saat pembayaran QRIS
                </span>
              </label>
              
              <div className="flex flex-col sm:flex-row items-center gap-4 bg-neutral-50 p-4 rounded-xl border border-dashed border-neutral-200">
                {formData.qrisImageBase64 ? (
                  <div className="relative w-32 h-32 shrink-0 border border-neutral-200 rounded-lg bg-white overflow-hidden p-1 flex items-center justify-center">
                    <img
                      src={formData.qrisImageBase64}
                      alt="Gambar QRIS Toko"
                      className="max-w-full max-h-full object-contain"
                    />
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, qrisImageBase64: '' })}
                      className="absolute -top-1 -right-1 p-1 bg-rose-600 hover:bg-rose-700 text-white rounded-full shadow-xs cursor-pointer"
                      title="Hapus gambar QRIS"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ) : (
                  <div className="w-32 h-32 shrink-0 border border-neutral-200 rounded-lg bg-neutral-100 flex flex-col items-center justify-center text-center p-3 text-neutral-400">
                    <svg className="w-8 h-8 mb-1 text-neutral-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1.001 1.001 0 00.707-.293l1-1A1.001 1.001 0 019.414 6h5.172a1.001 1.001 0 01.707.293l1 1A1.001 1.001 0 0017 8h2a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2v-8a2 2 0 012-2z" />
                    </svg>
                    <span className="text-[10px] font-semibold text-neutral-500">Belum Ada Gambar QRIS</span>
                  </div>
                )}
                
                <div className="space-y-1.5 text-center sm:text-left flex-1">
                  <div className="text-xs font-bold text-neutral-700">Unggah Gambar QRIS Toko</div>
                  <p className="text-[11px] text-neutral-500 leading-snug">
                    Pilih file gambar QRIS resmi toko Anda (JPG/PNG). Gambar akan ditampilkan kepada pelanggan/kasir saat memilih metode bayar QRIS.
                  </p>
                  <div className="flex gap-2 justify-center sm:justify-start">
                    <label className="px-3 py-1.5 bg-neutral-900 hover:bg-neutral-800 text-white font-bold text-[11px] rounded-lg cursor-pointer transition-colors inline-block shadow-2xs">
                      <span>Pilih Gambar QRIS</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          
                          // Canvas compression
                          const reader = new FileReader();
                          reader.onload = (event) => {
                            const img = new Image();
                            img.onload = () => {
                              const canvas = document.createElement('canvas');
                              const maxDimension = 500; // max width/height 500px for super light Firestore save
                              let width = img.width;
                              let height = img.height;
                              
                              if (width > height) {
                                if (width > maxDimension) {
                                  height *= maxDimension / width;
                                  width = maxDimension;
                                }
                              } else {
                                if (height > maxDimension) {
                                  width *= maxDimension / height;
                                  height = maxDimension;
                                }
                              }
                              
                              canvas.width = width;
                              canvas.height = height;
                              const ctx = canvas.getContext('2d');
                              ctx?.drawImage(img, 0, 0, width, height);
                              
                              // Compress to jpeg quality 0.7
                              const base64 = canvas.toDataURL('image/jpeg', 0.7);
                              setFormData(prev => ({ ...prev, qrisImageBase64: base64 }));
                            };
                            img.src = event.target?.result as string;
                          };
                          reader.readAsDataURL(file);
                        }}
                      />
                    </label>
                    {formData.qrisImageBase64 && (
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, qrisImageBase64: '' })}
                        className="px-2.5 py-1.5 border border-rose-200 text-rose-700 hover:bg-rose-50 text-[11px] font-semibold rounded-lg transition-colors"
                      >
                        Hapus Gambar
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Security & Role PIN Management */}
          <div className="bg-white border border-neutral-200 rounded-2xl p-6 shadow-xs space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-neutral-100">
              <Shield className="w-5 h-5 text-emerald-600" />
              <h2 className="text-sm font-bold text-neutral-900">
                Otorisasi Hak Akses & Kode PIN Peran
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* PIN Kasir */}
              <div className="bg-neutral-50 border border-neutral-200 rounded-xl p-4 space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-bold text-neutral-900">
                  <KeyRound className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Master PIN Kasir</span>
                </div>
                <p className="text-[11px] text-neutral-500 leading-snug">
                  PIN master yang berlaku untuk semua petugas kasir.
                </p>
                <div>
                  <input
                    type="text"
                    maxLength={6}
                    required
                    value={formData.pinKasir}
                    onChange={(e) =>
                      setFormData({ ...formData, pinKasir: e.target.value.replace(/\D/g, '') })
                    }
                    className="w-full px-3 py-2 bg-white border border-neutral-300 rounded-lg font-mono text-center text-sm font-bold tracking-widest focus:outline-none focus:ring-1 focus:ring-neutral-900"
                  />
                </div>
              </div>

              {/* PIN Pengelola */}
              <div className="bg-neutral-50 border border-neutral-200 rounded-xl p-4 space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-bold text-neutral-900">
                  <KeyRound className="w-3.5 h-3.5 text-blue-600" />
                  <span>PIN Pengelola Gudang</span>
                </div>
                <p className="text-[11px] text-neutral-500 leading-snug">
                  Akses Kasir + Input Barang Masuk & Keluar.
                </p>
                <div>
                  <input
                    type="text"
                    maxLength={6}
                    required
                    value={formData.pinPengelola}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        pinPengelola: e.target.value.replace(/\D/g, '') || '',
                      })
                    }
                    className="w-full px-3 py-2 bg-white border border-neutral-300 rounded-lg font-mono text-center text-sm font-bold tracking-widest focus:outline-none focus:ring-1 focus:ring-neutral-900"
                  />
                </div>
              </div>

              {/* PIN Admin */}
              <div className="bg-neutral-50 border border-neutral-200 rounded-xl p-4 space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-bold text-neutral-900">
                  <KeyRound className="w-3.5 h-3.5 text-purple-600" />
                  <span>PIN Administrator</span>
                </div>
                <p className="text-[11px] text-neutral-500 leading-snug">
                  Akses penuh ke semua menu toko & ubah PIN.
                </p>
                <div>
                  <input
                    type="text"
                    maxLength={6}
                    required
                    value={formData.pinAdmin}
                    onChange={(e) =>
                      setFormData({ ...formData, pinAdmin: e.target.value.replace(/\D/g, '') })
                    }
                    className="w-full px-3 py-2 bg-white border border-neutral-300 rounded-lg font-mono text-center text-sm font-bold tracking-widest focus:outline-none focus:ring-1 focus:ring-neutral-900"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Submit & Reset actions */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
            <button
              type="submit"
              className="w-full sm:w-auto px-6 py-3 bg-neutral-900 hover:bg-neutral-800 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2"
            >
              <Check className="w-4 h-4 text-emerald-400" />
              <span>Simpan Semua Pengaturan</span>
            </button>

            <button
              type="button"
              onClick={handleReset}
              className="w-full sm:w-auto px-4 py-2.5 border border-rose-200 text-rose-700 hover:bg-rose-50 text-xs font-semibold rounded-xl transition-colors flex items-center justify-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Data ke Awal</span>
            </button>
          </div>
        </form>
      )}

      {/* Tab 2: Kelola Petugas Kasir (Multi-Kasir) */}
      {activeSubTab === 'cashiers' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between bg-white p-4 border border-neutral-200 rounded-2xl shadow-xs">
            <div>
              <h2 className="text-sm font-bold text-neutral-900">
                Daftar Petugas Kasir Toko
              </h2>
              <p className="text-xs text-neutral-500">
                Admin dapat menambah kasir lebih dari 1 dengan nama dan kode PIN masing-masing.
              </p>
            </div>

            <button
              type="button"
              onClick={handleOpenAddCashier}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-xl shadow-xs flex items-center gap-2 transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>+ Tambah Kasir Baru</span>
            </button>
          </div>

          <div className="bg-white border border-neutral-200 rounded-2xl overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-neutral-50 border-b border-neutral-200 text-neutral-600 font-semibold">
                  <tr>
                    <th className="py-3 px-4">Nama Petugas Kasir</th>
                    <th className="py-3 px-4">Kode PIN Pribadi</th>
                    <th className="py-3 px-4">Status Akun</th>
                    <th className="py-3 px-4 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {cashiers.map((c) => (
                    <tr key={c.id} className="hover:bg-neutral-50/80 transition-colors">
                      <td className="py-3.5 px-4 font-semibold text-neutral-900">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
                            <UserCheck className="w-3.5 h-3.5" />
                          </div>
                          <span>{c.name}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 font-mono font-bold text-neutral-800">
                        <span className="px-2 py-0.5 bg-neutral-100 rounded border">
                          {c.pin}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                            c.isActive
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-neutral-100 text-neutral-500'
                          }`}
                        >
                          {c.isActive ? 'Aktif' : 'Non-aktif'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right space-x-1">
                        <button
                          type="button"
                          onClick={() => handleOpenEditCashier(c)}
                          className="p-1.5 rounded-lg text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 transition-colors"
                          title="Edit nama atau PIN kasir"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteCashier(c)}
                          className="p-1.5 rounded-lg text-neutral-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                          title="Hapus kasir"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Cashier Modal */}
      {isCashierModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl border border-neutral-200 w-full max-w-md my-auto overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-neutral-100 flex items-center justify-between bg-neutral-50/70">
              <h2 className="text-sm font-bold text-neutral-900">
                {editingCashier ? 'Edit Data Kasir' : 'Tambah Petugas Kasir Baru'}
              </h2>
              <button
                onClick={() => setIsCashierModalOpen(false)}
                className="p-1 rounded-md text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCashier} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">
                  Nama Petugas Kasir:
                </label>
                <input
                  type="text"
                  required
                  value={cashierNameInput}
                  onChange={(e) => setCashierNameInput(e.target.value)}
                  placeholder="Contoh: Rina Melati (Kasir 3)"
                  className="w-full px-3 py-2 border border-neutral-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-neutral-900"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">
                  Kode PIN Kasir (4-6 Angka):
                </label>
                <input
                  type="text"
                  maxLength={6}
                  required
                  value={cashierPinInput}
                  onChange={(e) =>
                    setCashierPinInput(e.target.value.replace(/\D/g, ''))
                  }
                  placeholder="Contoh: 1234"
                  className="w-full px-3 py-2 border border-neutral-200 rounded-xl text-xs font-mono font-bold tracking-widest focus:outline-none focus:ring-1 focus:ring-neutral-900"
                />
                <span className="text-[10px] text-neutral-400 mt-1 block">
                  Kasir akan menggunakan kode ini untuk membuka aplikasi dan mencatat penjualan.
                </span>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="cashierActive"
                  checked={cashierActiveInput}
                  onChange={(e) => setCashierActiveInput(e.target.checked)}
                  className="rounded text-emerald-600 focus:ring-emerald-500"
                />
                <label htmlFor="cashierActive" className="text-xs font-semibold text-neutral-700">
                  Status Akun Aktif (Bisa Login)
                </label>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-3 bg-neutral-900 hover:bg-neutral-800 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2"
                >
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span>{editingCashier ? 'Perbarui Kasir' : 'Simpan Petugas Kasir'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
