import { SaleTransaction, StoreSettings } from '../types';

export function formatRupiah(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat('id-ID').format(value);
}

export function formatDateTime(isoString: string): string {
  try {
    const date = new Date(isoString);
    return new Intl.DateTimeFormat('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    }).format(date);
  } catch {
    return isoString;
  }
}

export function formatDateOnly(isoString: string): string {
  try {
    const date = new Date(isoString);
    return new Intl.DateTimeFormat('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }).format(date);
  } catch {
    return isoString;
  }
}

export function generateReceiptText(trx: SaleTransaction, store: StoreSettings): string {
  const line = '--------------------------------';
  const doubleLine = '================================';
  
  let text = '';
  text += `${store.storeName.toUpperCase()}\n`;
  if (store.tagline) text += `${store.tagline}\n`;
  text += `${store.address}\n`;
  text += `Telp: ${store.phone}\n`;
  text += `${doubleLine}\n`;
  text += `No. Struk : ${trx.id}\n`;
  text += `Waktu     : ${formatDateTime(trx.timestamp)}\n`;
  text += `Kasir     : ${trx.cashierName}\n`;
  text += `Tipe Jual : ${trx.customerType === 'grosir' ? 'GROSIR' : 'ECERAN'}\n`;
  if (trx.customerName) text += `Pelanggan : ${trx.customerName}\n`;
  text += `${line}\n`;

  trx.items.forEach((item) => {
    const priceStr = formatRupiah(item.appliedPrice);
    const subtotalStr = formatRupiah(item.subtotal);
    const badge = item.priceType === 'grosir' ? '[Grosir]' : '[Ecer]';
    text += `${item.product.name} ${badge}\n`;
    text += `  ${item.qty} ${item.product.unit} x ${priceStr} = ${subtotalStr}\n`;
  });

  text += `${line}\n`;
  text += `Total Item  : ${trx.totalQty}\n`;
  text += `Subtotal    : ${formatRupiah(trx.subtotal)}\n`;
  
  const wholesaleSavings = trx.items.reduce((sum, item) => {
    if (item.priceType === 'grosir') {
      const diff = item.product.retailPrice - item.product.wholesalePrice;
      return sum + Math.max(0, diff * item.qty);
    }
    return sum;
  }, 0);

  if (wholesaleSavings > 0) {
    text += `Hemat Grosir: -${formatRupiah(wholesaleSavings)}\n`;
  }

  if (trx.discount > 0) {
    text += `Diskon      : -${formatRupiah(trx.discount)}\n`;
  }
  text += `TOTAL AKHIR : ${formatRupiah(trx.grandTotal)}\n`;
  text += `${line}\n`;
  
  const paymentName = {
    tunai: 'TUNAI',
    qris: 'QRIS',
    transfer: 'TRANSFER BANK',
    debit: 'KARTU DEBIT / EDC',
  }[trx.paymentMethod];

  text += `Pembayaran  : ${paymentName}\n`;
  if (trx.paymentMethod === 'tunai') {
    text += `Bayar Tunai : ${formatRupiah(trx.cashReceived || trx.grandTotal)}\n`;
    text += `Kembalian   : ${formatRupiah(trx.changeDue || 0)}\n`;
  } else if (trx.referenceNo) {
    text += `Ref / Bukti : ${trx.referenceNo}\n`;
  }

  text += `${doubleLine}\n`;
  text += `Petugas Kasir: ${trx.cashierName}\n`;
  text += `${store.receiptFooter || 'Terima kasih atas kunjungan Anda'}\n`;
  text += `Barang yang dibeli tidak dapat ditukar\n`;
  
  return text;
}

export function formatWhatsAppUrl(phoneNumber: string, text: string): string {
  let cleanNumber = phoneNumber.replace(/\D/g, '');
  if (cleanNumber.startsWith('0')) {
    cleanNumber = '62' + cleanNumber.substring(1);
  } else if (!cleanNumber.startsWith('62')) {
    cleanNumber = '62' + cleanNumber;
  }
  return `https://api.whatsapp.com/send?phone=${cleanNumber}&text=${encodeURIComponent(text)}`;
}

export function generateClosingReportText(
  transactions: SaleTransaction[],
  store: StoreSettings,
  cashierName: string,
  initialCashDrawer: number = 0,
  notes: string = ''
): string {
  const totalOmzet = transactions.reduce((sum, t) => sum + t.grandTotal, 0);

  let totalHpp = 0;
  transactions.forEach((trx) => {
    trx.items.forEach((item) => {
      totalHpp += item.product.costPrice * item.qty;
    });
  });

  const grossProfit = totalOmzet - totalHpp;
  const totalCash = transactions
    .filter((t) => t.paymentMethod === 'tunai')
    .reduce((sum, t) => sum + t.grandTotal, 0);
  const totalNonCash = transactions
    .filter((t) => t.paymentMethod !== 'tunai')
    .reduce((sum, t) => sum + t.grandTotal, 0);

  const totalGrosir = transactions
    .filter((t) => t.customerType === 'grosir')
    .reduce((sum, t) => sum + t.grandTotal, 0);
  const totalEcer = transactions
    .filter((t) => t.customerType === 'ecer')
    .reduce((sum, t) => sum + t.grandTotal, 0);

  const totalItemsSold = transactions.reduce((sum, t) => sum + t.totalQty, 0);

  // Top products
  const productMap: Record<string, { name: string; qty: number }> = {};
  transactions.forEach((t) => {
    t.items.forEach((item) => {
      if (!productMap[item.product.id]) {
        productMap[item.product.id] = { name: item.product.name, qty: 0 };
      }
      productMap[item.product.id].qty += item.qty;
    });
  });
  const topProducts = Object.values(productMap)
    .sort((a, b) => b.qty - a.qty)
    .slice(0, 3);

  const now = new Date();
  const dateStr = new Intl.DateTimeFormat('id-ID', {
    weekday: 'long',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(now);

  let msg = `📊 *LAPORAN TUTUP KASIR & REKAP TOKO*\n`;
  msg += `🏬 *${store.storeName.toUpperCase()}*\n`;
  msg += `📅 *Waktu Tutup:* ${dateStr} WIB\n`;
  msg += `👤 *Petugas Kasir:* ${cashierName}\n`;
  msg += `----------------------------------------\n\n`;

  msg += `💰 *RINGKASAN PEMASUKAN & LABA*\n`;
  msg += `• *Total Pemasukan (Omzet):* ${formatRupiah(totalOmzet)}\n`;
  msg += `• *Total Modal Produk (HPP):* ${formatRupiah(totalHpp)}\n`;
  msg += `• *ESTIMASI LABA BERSIH:* ${formatRupiah(grossProfit)} 🌟\n`;
  msg += `• *Margin Keuntungan:* ${totalOmzet > 0 ? ((grossProfit / totalOmzet) * 100).toFixed(1) : 0}%\n\n`;

  msg += `💳 *METODE PENERIMAAN DANA*\n`;
  msg += `• *Uang Tunai (Cash):* ${formatRupiah(totalCash)}\n`;
  if (initialCashDrawer > 0) {
    msg += `  (Modal Kas Awal: ${formatRupiah(initialCashDrawer)} | Total Fisik di Laci: ${formatRupiah(totalCash + initialCashDrawer)})\n`;
  }
  msg += `• *Non-Tunai (QRIS/EDC/Transfer):* ${formatRupiah(totalNonCash)}\n\n`;

  msg += `📦 *RINCIAN PENJUALAN*\n`;
  msg += `• Jumlah Transaksi: ${transactions.length} Struk\n`;
  msg += `• Penjualan Grosir: ${formatRupiah(totalGrosir)}\n`;
  msg += `• Penjualan Eceran: ${formatRupiah(totalEcer)}\n`;
  msg += `• Total Barang Terjual: ${totalItemsSold} item\n\n`;

  if (topProducts.length > 0) {
    msg += `⭐ *3 PRODUK TERLARIS:*\n`;
    topProducts.forEach((p, idx) => {
      msg += `  ${idx + 1}. ${p.name} (${p.qty} unit)\n`;
    });
    msg += `\n`;
  }

  if (notes) {
    msg += `📝 *Catatan Kasir:* ${notes}\n\n`;
  }

  msg += `----------------------------------------\n`;
  msg += `✅ _Laporan dikirim otomatis dari KasirKu POS._`;

  return msg;
}

export function generateMonthlyReportText(
  transactions: SaleTransaction[],
  store: StoreSettings,
  operatorName: string,
  monthName: string,
  year: number
): string {
  const totalOmzet = transactions.reduce((sum, t) => sum + t.grandTotal, 0);

  let totalHpp = 0;
  transactions.forEach((trx) => {
    trx.items.forEach((item) => {
      totalHpp += item.product.costPrice * item.qty;
    });
  });

  const grossProfit = totalOmzet - totalHpp;
  const totalCash = transactions
    .filter((t) => t.paymentMethod === 'tunai')
    .reduce((sum, t) => sum + t.grandTotal, 0);
  const totalNonCash = transactions
    .filter((t) => t.paymentMethod !== 'tunai')
    .reduce((sum, t) => sum + t.grandTotal, 0);

  const totalGrosir = transactions
    .filter((t) => t.customerType === 'grosir')
    .reduce((sum, t) => sum + t.grandTotal, 0);
  const totalEcer = transactions
    .filter((t) => t.customerType === 'ecer')
    .reduce((sum, t) => sum + t.grandTotal, 0);

  const totalItemsSold = transactions.reduce((sum, t) => sum + t.totalQty, 0);

  // Top products
  const productMap: Record<string, { name: string; qty: number }> = {};
  transactions.forEach((t) => {
    t.items.forEach((item) => {
      if (!productMap[item.product.id]) {
        productMap[item.product.id] = { name: item.product.name, qty: 0 };
      }
      productMap[item.product.id].qty += item.qty;
    });
  });
  const topProducts = Object.values(productMap)
    .sort((a, b) => b.qty - a.qty)
    .slice(0, 5); // top 5 for monthly report!

  let msg = `📊 *REKAP BULANAN TOKO - KASIRKU POS*\n`;
  msg += `🏬 *${store.storeName.toUpperCase()}*\n`;
  msg += `📅 *Periode:* ${monthName} ${year}\n`;
  msg += `👤 *Disusun Oleh:* ${operatorName}\n`;
  msg += `----------------------------------------\n\n`;

  msg += `💰 *RINGKASAN KEUANGAN BULANAN*\n`;
  msg += `• *Total Omzet Penjualan:* ${formatRupiah(totalOmzet)}\n`;
  msg += `• *Total Modal Produk (HPP):* ${formatRupiah(totalHpp)}\n`;
  msg += `• *ESTIMASI LABA KOTOR:* ${formatRupiah(grossProfit)} 🌟\n`;
  msg += `• *Margin Keuntungan:* ${totalOmzet > 0 ? ((grossProfit / totalOmzet) * 100).toFixed(1) : 0}%\n\n`;

  msg += `💳 *METODE PENERIMAAN DANA*\n`;
  msg += `• *Total Pembayaran Tunai:* ${formatRupiah(totalCash)}\n`;
  msg += `• *Total QRIS/Transfer/EDC:* ${formatRupiah(totalNonCash)}\n\n`;

  msg += `📦 *RINCIAN PENJUALAN*\n`;
  msg += `• Total Transaksi Selesai: ${transactions.length} Transaksi\n`;
  msg += `• Rata-rata Nilai Belanja: ${formatRupiah(totalOmzet / (transactions.length || 1))}\n`;
  msg += `• Penjualan Grosir: ${formatRupiah(totalGrosir)}\n`;
  msg += `• Penjualan Eceran: ${formatRupiah(totalEcer)}\n`;
  msg += `• Total Barang Terjual: ${totalItemsSold} item\n\n`;

  if (topProducts.length > 0) {
    msg += `⭐ *5 PRODUK PALING LARIS BULAN INI:*\n`;
    topProducts.forEach((p, idx) => {
      msg += `  ${idx + 1}. ${p.name} (${p.qty} unit)\n`;
    });
    msg += `\n`;
  }

  msg += `----------------------------------------\n`;
  msg += `✅ _Laporan rekap bulanan otomatis KasirKu POS._`;

  return msg;
}

