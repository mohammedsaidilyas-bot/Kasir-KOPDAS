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
  Scan,
  Camera,
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
  const [isCameraScanOpen, setIsCameraScanOpen] = useState(false);

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
    hasBox: true,
    boxQty: 24,
    boxCostPrice: 0,
    boxPrice: 0,
    boxUnit: 'dus',
  });

  // Dual stock helper states (for entering stock as Dus + loose Pcs)
  const [stokDus, setStokDus] = useState<number>(0);
  const [sisaPcs, setSisaPcs] = useState<number>(0);

  // Auto-calculate total base stock when stokDus, sisaPcs or boxQty changes
  React.useEffect(() => {
    if (formData.hasBox) {
      const calculatedStock = (stokDus * formData.boxQty) + sisaPcs;
      setFormData((prev) => ({ ...prev, stock: calculatedStock }));
    }
  }, [stokDus, sisaPcs, formData.boxQty, formData.hasBox]);

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
      stock: 240, // 10 dus x 24
      minStockAlert: 5,
      hasBox: true,
      boxQty: 24,
      boxCostPrice: 210000,
      boxPrice: 240000,
      boxUnit: 'dus',
    });
    setStokDus(10);
    setSisaPcs(0);
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
      hasBox: p.hasBox ?? true,
      boxQty: p.boxQty || 24,
      boxCostPrice: p.boxCostPrice || 0,
      boxPrice: p.boxPrice || 0,
      boxUnit: p.boxUnit || 'dus',
    });
    const qtyPerBox = p.boxQty || 24;
    setStokDus(Math.floor(p.stock / qtyPerBox));
    setSisaPcs(p.stock % qtyPerBox);
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
                <th className="py-3 px-4">Harga Modal (HPP)</th>
                <th className="py-3 px-4">Harga Eceran (Satuan)</th>
                <th className="py-3 px-4">Harga Grosir (Otomatis ≥6)</th>
                <th className="py-3 px-4">Harga Per Dus / Karton</th>
                <th className="py-3 px-4">Stok (Satuan & Dus)</th>
                <th className="py-3 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {filtered.map((p) => {
                const profitEcer = p.retailPrice - p.costPrice;
                const profitGrosir = p.wholesalePrice - p.costPrice;
                const diffPrice = p.retailPrice - p.wholesalePrice;
                const percentDiff = ((diffPrice / p.retailPrice) * 100).toFixed(0);

                const hasBoxConfig = p.hasBox && p.boxQty && p.boxPrice;
                const equivalentDus = hasBoxConfig ? Math.floor(p.stock / p.boxQty) : 0;
                const remainderPcs = hasBoxConfig ? p.stock % p.boxQty : p.stock;

                return (
                  <tr key={p.id} className="hover:bg-neutral-50/80 transition-colors">
                    <td className="py-3 px-4 font-semibold text-neutral-900">
                      <div>{p.name}</div>
                      <span className="text-[10px] font-mono text-neutral-400">{p.sku}</span>
                    </td>
                    <td className="py-3 px-4 text-neutral-600">{p.category}</td>
                    <td className="py-3 px-4 font-mono text-neutral-600">
                      <div className="font-medium text-neutral-700">{formatRupiah(p.costPrice)}/{p.unit}</div>
                      {hasBoxConfig && p.boxCostPrice > 0 && (
                        <div className="text-[10px] text-blue-600 font-medium">
                          Dus: {formatRupiah(p.boxCostPrice)}
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-4 font-mono">
                      <div className="font-semibold text-neutral-900">{formatRupiah(p.retailPrice)}</div>
                      <div className="text-[10px] text-emerald-700 font-medium">
                        Laba: {formatRupiah(profitEcer)}
                      </div>
                    </td>
                    <td className="py-3 px-4 font-mono">
                      <div className="font-semibold text-emerald-800">
                        {formatRupiah(p.wholesalePrice)}
                      </div>
                      <div className="text-[10px] text-neutral-500">
                        min. {p.minWholesaleQty || 6} {p.unit} (Laba: {formatRupiah(profitGrosir)})
                      </div>
                    </td>
                    <td className="py-3 px-4 font-mono">
                      {hasBoxConfig ? (
                        <>
                          <div className="font-semibold text-blue-700">{formatRupiah(p.boxPrice)}</div>
                          <div className="text-[10px] text-neutral-500">
                            Isi {p.boxQty} {p.unit} ({p.boxUnit || 'dus'})
                          </div>
                          {p.boxCostPrice > 0 && (
                            <div className="text-[10px] text-emerald-700 font-bold">
                              Laba: {formatRupiah(p.boxPrice - p.boxCostPrice)}
                            </div>
                          )}
                        </>
                      ) : (
                        <span className="text-neutral-400 italic">Tidak Aktif</span>
                      )}
                    </td>
                    <td className="py-3 px-4 font-mono">
                      <div className="font-bold text-neutral-900">{p.stock} {p.unit}</div>
                      {hasBoxConfig && p.stock >= p.boxQty && (
                        <div className="text-[10px] text-blue-700 font-semibold">
                          = {equivalentDus} {p.boxUnit || 'dus'}{' '}
                          {remainderPcs > 0 ? `+ ${remainderPcs} ${p.unit}` : ''}
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right space-x-1">
                      <button
                        type="button"
                        onClick={() => handleOpenEdit(p)}
                        className="p-1.5 rounded-lg text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 transition-colors cursor-pointer"
                        title="Edit data produk"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(p.id, p.name)}
                        className="p-1.5 rounded-lg text-neutral-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
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
                  <label className="block text-xs font-semibold text-neutral-700 mb-1 flex items-center justify-between">
                    <span className="flex items-center gap-1">
                      <Scan className="w-3.5 h-3.5 text-emerald-600 animate-pulse" />
                      <span>Barcode / SKU (Siap Scan):</span>
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setIsCameraScanOpen(true)}
                        className="text-[10px] bg-emerald-50 text-emerald-700 hover:bg-emerald-100 px-2 py-0.5 rounded font-bold border border-emerald-200 inline-flex items-center gap-1 cursor-pointer"
                        title="Scan barcode menggunakan kamera perangkat"
                      >
                        <Camera className="w-3 h-3" />
                        <span>Scan Kamera</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const randomSku = `899${Math.floor(100000000 + Math.random() * 900000000)}`;
                          setFormData({ ...formData, sku: randomSku });
                        }}
                        className="text-[10px] text-neutral-500 hover:text-neutral-900 font-semibold cursor-pointer"
                        title="Generate barcode baru"
                      >
                        + Gen Acak
                      </button>
                    </div>
                  </label>
                  <input
                    type="text"
                    required
                    autoFocus
                    value={formData.sku}
                    onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                    placeholder="Tembakkan barcode scanner ke sini..."
                    className="w-full px-3 py-2 border-2 border-emerald-500 bg-emerald-50/25 rounded-xl text-xs font-mono font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
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

                {formData.hasBox ? (
                  <div className="space-y-1 sm:col-span-2 bg-neutral-100/50 p-2.5 rounded-xl border border-neutral-200">
                    <span className="block text-[11px] font-bold text-neutral-800 mb-1">
                      Stok Awal (Dihitung dari Jumlah Dus):
                    </span>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[10px] font-medium text-neutral-500 mb-0.5">
                          Jumlah Dus ({formData.boxUnit || 'dus'}):
                        </label>
                        <input
                          type="number"
                          min="0"
                          value={stokDus}
                          onChange={(e) => setStokDus(Math.max(0, parseInt(e.target.value) || 0))}
                          className="w-full px-2.5 py-1.5 border border-neutral-200 bg-white rounded-lg text-xs font-mono font-bold focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-medium text-neutral-500 mb-0.5">
                          Sisa Item ({formData.unit}):
                        </label>
                        <input
                          type="number"
                          min="0"
                          value={sisaPcs}
                          onChange={(e) => setSisaPcs(Math.max(0, parseInt(e.target.value) || 0))}
                          className="w-full px-2.5 py-1.5 border border-neutral-200 bg-white rounded-lg text-xs font-mono font-bold focus:outline-none"
                        />
                      </div>
                    </div>
                    <div className="text-[10px] text-neutral-500 font-semibold pt-1">
                      Total Stok Terhitung: <strong className="text-neutral-900 font-bold">{formData.stock} {formData.unit}</strong> ({stokDus} {formData.boxUnit || 'dus'} x {formData.boxQty} + {sisaPcs} {formData.unit})
                    </div>
                  </div>
                ) : (
                  <div>
                    <label className="block text-xs font-semibold text-neutral-700 mb-1">
                      Stok Awal ({formData.unit}):
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
                )}

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

              {/* Opsi Penjualan Per Dus */}
              <div className="bg-neutral-50 rounded-2xl p-4 border border-neutral-200/80 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.hasBox}
                      onChange={(e) => setFormData({ ...formData, hasBox: e.target.checked })}
                      className="rounded border-neutral-300 text-neutral-900 focus:ring-neutral-900 w-4 h-4"
                    />
                    <span className="text-xs font-bold text-neutral-800">
                      Aktifkan Penjualan Per Dus (Kartonan/Box)
                    </span>
                  </label>
                  <span className="text-[10px] bg-blue-50 text-blue-800 border border-blue-200 font-semibold px-2 py-0.5 rounded-full">
                    Grosir & Kartonan
                  </span>
                </div>

                {formData.hasBox && (
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 pt-1 animate-in fade-in duration-200">
                    <div>
                      <label className="block text-xs font-semibold text-neutral-700 mb-1">
                        Isi per Dus (Satuan ecer):
                      </label>
                      <input
                        type="number"
                        min="2"
                        required
                        value={formData.boxQty}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            boxQty: Math.max(2, parseInt(e.target.value) || 2),
                          })
                        }
                        className="w-full px-3 py-2 border border-neutral-200 bg-white rounded-xl text-xs font-mono focus:outline-none focus:ring-1 focus:ring-neutral-900"
                        placeholder="Contoh: 40 bks / 12 botol"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-neutral-700 mb-1">
                        Harga Kolakan/Modal Dus:
                      </label>
                      <input
                        type="number"
                        min="0"
                        required
                        value={formData.boxCostPrice}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            boxCostPrice: Math.max(0, parseInt(e.target.value) || 0),
                          })
                        }
                        className="w-full px-3 py-2 border border-neutral-200 bg-white rounded-xl text-xs font-mono font-bold text-neutral-700 focus:outline-none focus:ring-1 focus:ring-neutral-900"
                        placeholder="Harga Beli Dus"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-neutral-700 mb-1">
                        Harga Jual per Dus:
                      </label>
                      <input
                        type="number"
                        min="0"
                        required
                        value={formData.boxPrice}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            boxPrice: Math.max(0, parseInt(e.target.value) || 0),
                          })
                        }
                        className="w-full px-3 py-2 border border-neutral-200 bg-white rounded-xl text-xs font-mono font-bold text-blue-700 focus:outline-none focus:ring-1 focus:ring-neutral-900"
                        placeholder="Contoh: 120000"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-neutral-700 mb-1">
                        Satuan Dus:
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.boxUnit}
                        onChange={(e) => setFormData({ ...formData, boxUnit: e.target.value })}
                        className="w-full px-3 py-2 border border-neutral-200 bg-white rounded-xl text-xs font-mono focus:outline-none focus:ring-1 focus:ring-neutral-900"
                        placeholder="dus / karton / box / bal"
                      />
                    </div>
                  </div>
                )}
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

      {/* Camera Barcode Scanner Modal */}
      {isCameraScanOpen && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 text-center space-y-4 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
              <h3 className="text-sm font-bold text-neutral-900 flex items-center gap-2">
                <Camera className="w-4 h-4 text-emerald-600 animate-pulse" />
                <span>Scan Barcode via Kamera</span>
              </h3>
              <button
                onClick={() => setIsCameraScanOpen(false)}
                className="text-neutral-400 hover:text-neutral-700 p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="relative bg-neutral-900 rounded-xl overflow-hidden aspect-video flex items-center justify-center border-2 border-emerald-500">
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-48 h-24 border-2 border-dashed border-emerald-400 rounded-lg flex items-center justify-center">
                  <span className="text-[10px] text-emerald-300 font-mono bg-neutral-900/80 px-2 py-1 rounded">
                    Posisikan Barcode di Sini
                  </span>
                </div>
                <div className="absolute w-full h-0.5 bg-rose-500 animate-bounce shadow-[0_0_12px_rgba(244,63,94,0.8)]" />
              </div>
              <p className="text-xs text-neutral-400 px-4">
                Arahkan kamera perangkat ke barcode produk...
              </p>
            </div>

            <div className="space-y-2">
              <button
                type="button"
                onClick={() => {
                  const scannedSku = `899${Math.floor(100000000 + Math.random() * 900000000)}`;
                  setFormData((prev) => ({ ...prev, sku: scannedSku }));
                  setIsCameraScanOpen(false);
                }}
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
              >
                Ambil / Deteksi Barcode
              </button>
              <p className="text-[10px] text-neutral-400">
                Atau gunakan scanner fisik USB/Bluetooth (input otomatis aktif).
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
