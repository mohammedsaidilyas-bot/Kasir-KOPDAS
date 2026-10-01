import React, { useState } from 'react';
import {
  Package,
  Plus,
  Search,
  Edit2,
  Trash2,
  X,
  Check,
  Layers,
  AlertCircle,
} from 'lucide-react';
import { usePos } from '../../context/PosContext';
import { Product } from '../../types';
import { formatRupiah, formatNumber } from '../../utils/formatters';

export const ProductCatalogView: React.FC = () => {
  const { products, addProduct, updateProduct, deleteProduct } = usePos();

  const [search, setSearch] = useState('');
  const [selectedCat, setSelectedCat] = useState('Semua');

  // Modal form states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Form inputs
  const [formData, setFormData] = useState({
    sku: '',
    name: '',
    category: 'Sembako',
    unit: 'pcs',
    costPrice: 0,
    retailPrice: 0,
    wholesalePrice: 0,
    minWholesaleQty: 5,
    stock: 0,
    minStockAlert: 5,
  });

  const categories = ['Semua', ...Array.from(new Set(products.map((p) => p.category)))];

  const handleOpenAdd = () => {
    setEditingProduct(null);
    setFormData({
      sku: `899${Math.floor(100000000 + Math.random() * 900000000)}`,
      name: '',
      category: 'Sembako',
      unit: 'pcs',
      costPrice: 10000,
      retailPrice: 13000,
      wholesalePrice: 11500,
      minWholesaleQty: 6,
      stock: 20,
      minStockAlert: 5,
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (p: Product) => {
    setEditingProduct(p);
    setFormData({
      sku: p.sku,
      name: p.name,
      category: p.category,
      unit: p.unit,
      costPrice: p.costPrice,
      retailPrice: p.retailPrice,
      wholesalePrice: p.wholesalePrice,
      minWholesaleQty: p.minWholesaleQty,
      stock: p.stock,
      minStockAlert: p.minStockAlert,
    });
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    if (editingProduct) {
      updateProduct({
        ...editingProduct,
        ...formData,
      });
    } else {
      addProduct(formData);
    }

    setIsModalOpen(false);
  };

  const handleDelete = (id: string, name: string) => {
    if (confirm(`Yakin ingin menghapus produk "${name}" dari katalog?`)) {
      deleteProduct(id);
    }
  };

  const filtered = products.filter((p) => {
    const matchCat = selectedCat === 'Semua' || p.category === selectedCat;
    const matchQuery =
      !search ||
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.sku.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchQuery;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-200 pb-4">
        <div>
          <h1 className="text-xl font-bold text-neutral-900 tracking-tight">Katalog Data Produk</h1>
          <p className="text-xs text-neutral-500 mt-0.5">
            Daftar harga modal, harga jual eceran, dan ketentuan harga grosir toko.
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenAdd}
          className="px-4 py-2 bg-neutral-900 hover:bg-neutral-800 text-white font-semibold text-xs rounded-xl shadow-xs flex items-center gap-2 transition-colors self-start sm:self-auto"
        >
          <Plus className="w-4 h-4 text-emerald-400" />
          <span>+ Tambah Produk Baru</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3 border border-neutral-200 rounded-xl">
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari produk / barcode..."
              className="pl-8 pr-3 py-1.5 border border-neutral-200 rounded-lg text-xs w-56 focus:outline-none focus:ring-1 focus:ring-neutral-900"
            />
          </div>

          <select
            value={selectedCat}
            onChange={(e) => setSelectedCat(e.target.value)}
            className="px-3 py-1.5 border border-neutral-200 rounded-lg text-xs bg-white focus:outline-none focus:ring-1 focus:ring-neutral-900"
          >
            {categories.map((c) => (
              <option key={c} value={c}>
                {c === 'Semua' ? 'Semua Kategori' : c}
              </option>
            ))}
          </select>
        </div>

        <div className="text-xs text-neutral-500">
          Total <strong>{filtered.length}</strong> produk aktif
        </div>
      </div>

      {/* Product List Table */}
      <div className="bg-white border border-neutral-200 rounded-2xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-neutral-50 border-b border-neutral-200 text-neutral-600 font-semibold">
              <tr>
                <th className="py-3 px-4">Nama Produk & Barcode</th>
                <th className="py-3 px-4">Kategori</th>
                <th className="py-3 px-4">Satuan</th>
                <th className="py-3 px-4">Harga Modal</th>
                <th className="py-3 px-4">Harga Eceran</th>
                <th className="py-3 px-4">Harga Grosir (Min. Qty)</th>
                <th className="py-3 px-4">Selisih Hemat Grosir</th>
                <th className="py-3 px-4 text-center">Stok</th>
                <th className="py-3 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {filtered.map((p) => {
                const profitEcer = p.retailPrice - p.costPrice;
                const profitGrosir = p.wholesalePrice - p.costPrice;
                const diffPrice = p.retailPrice - p.wholesalePrice;
                const percentDiff = ((diffPrice / p.retailPrice) * 100).toFixed(0);

                return (
                  <tr key={p.id} className="hover:bg-neutral-50/80 transition-colors">
                    <td className="py-3 px-4 font-semibold text-neutral-900">
                      <div>{p.name}</div>
                      <span className="text-[10px] font-mono text-neutral-400">{p.sku}</span>
                    </td>
                    <td className="py-3 px-4 text-neutral-600">{p.category}</td>
                    <td className="py-3 px-4 text-neutral-600 uppercase font-mono">{p.unit}</td>
                    <td className="py-3 px-4 font-mono text-neutral-600">{formatRupiah(p.costPrice)}</td>
                    <td className="py-3 px-4 font-mono">
                      <div className="font-semibold text-neutral-900">{formatRupiah(p.retailPrice)}</div>
                      <div className="text-[10px] text-neutral-500 font-medium">
                        Laba: {formatRupiah(profitEcer)}
                      </div>
                    </td>
                    <td className="py-3 px-4 font-mono">
                      <div className="font-semibold text-emerald-700">
                        {formatRupiah(p.wholesalePrice)}
                      </div>
                      <div className="text-[10px] text-neutral-500">
                        min. {p.minWholesaleQty} {p.unit} (Laba: {formatRupiah(profitGrosir)})
                      </div>
                    </td>
                    <td className="py-3 px-4 font-mono">
                      <div className="text-emerald-700 font-bold">
                        Hemat {formatRupiah(diffPrice)}
                      </div>
                      <span className="text-[10px] text-emerald-600 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                        {percentDiff}% Lebih Murah
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center font-mono font-bold">
                      {p.stock}
                    </td>
                    <td className="py-3 px-4 text-right space-x-1">
                      <button
                        type="button"
                        onClick={() => handleOpenEdit(p)}
                        className="p-1.5 rounded-lg text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 transition-colors"
                        title="Edit data produk"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(p.id, p.name)}
                        className="p-1.5 rounded-lg text-neutral-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                        title="Hapus produk"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Product Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl border border-neutral-200 w-full max-w-lg my-auto overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-neutral-100 flex items-center justify-between bg-neutral-50/70">
              <h2 className="text-sm font-bold text-neutral-900">
                {editingProduct ? 'Edit Data Produk' : 'Tambah Produk Baru'}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-md text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1">
                    Barcode / SKU:
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.sku}
                    onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                    className="w-full px-3 py-2 border border-neutral-200 rounded-xl text-xs font-mono focus:outline-none focus:ring-1 focus:ring-neutral-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1">
                    Kategori:
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    placeholder="Sembako / Minuman / Makanan"
                    className="w-full px-3 py-2 border border-neutral-200 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-neutral-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">
                  Nama Produk:
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Contoh: Beras Ramos 5kg / Minyak Goreng 2L"
                  className="w-full px-3 py-2 border border-neutral-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-1 focus:ring-neutral-900"
                />
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1">
                    Satuan:
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.unit}
                    onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                    placeholder="pcs/dus/kg"
                    className="w-full px-3 py-2 border border-neutral-200 rounded-xl text-xs font-mono focus:outline-none focus:ring-1 focus:ring-neutral-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1">
                    Harga Modal (HPP):
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.costPrice}
                    onChange={(e) =>
                      setFormData({ ...formData, costPrice: Math.max(0, parseInt(e.target.value) || 0) })
                    }
                    className="w-full px-3 py-2 border border-neutral-200 rounded-xl text-xs font-mono focus:outline-none focus:ring-1 focus:ring-neutral-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1">
                    Harga Eceran:
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.retailPrice}
                    onChange={(e) =>
                      setFormData({ ...formData, retailPrice: Math.max(0, parseInt(e.target.value) || 0) })
                    }
                    className="w-full px-3 py-2 border border-neutral-200 rounded-xl text-xs font-mono font-bold focus:outline-none focus:ring-1 focus:ring-neutral-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1">
                    Harga Grosir:
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.wholesalePrice}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        wholesalePrice: Math.max(0, parseInt(e.target.value) || 0),
                      })
                    }
                    className="w-full px-3 py-2 border border-neutral-200 rounded-xl text-xs font-mono font-bold text-emerald-700 focus:outline-none focus:ring-1 focus:ring-neutral-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1">
                    Min. Qty Grosir:
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formData.minWholesaleQty}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        minWholesaleQty: Math.max(1, parseInt(e.target.value) || 1),
                      })
                    }
                    className="w-full px-3 py-2 border border-neutral-200 rounded-xl text-xs font-mono focus:outline-none focus:ring-1 focus:ring-neutral-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1">
                    Stok Awal:
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.stock}
                    onChange={(e) =>
                      setFormData({ ...formData, stock: Math.max(0, parseInt(e.target.value) || 0) })
                    }
                    className="w-full px-3 py-2 border border-neutral-200 rounded-xl text-xs font-mono font-bold focus:outline-none focus:ring-1 focus:ring-neutral-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1">
                    Batas Peringatan Stok:
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formData.minStockAlert}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        minStockAlert: Math.max(1, parseInt(e.target.value) || 1),
                      })
                    }
                    className="w-full px-3 py-2 border border-neutral-200 rounded-xl text-xs font-mono focus:outline-none focus:ring-1 focus:ring-neutral-900"
                  />
                </div>
              </div>

              <div className="pt-3">
                <button
                  type="submit"
                  className="w-full py-3 bg-neutral-900 hover:bg-neutral-800 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2"
                >
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span>{editingProduct ? 'Perbarui Produk' : 'Simpan Produk Baru'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
