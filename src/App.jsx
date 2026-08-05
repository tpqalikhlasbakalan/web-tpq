import React, { useState, useEffect } from 'react';
import {
  User, Lock, Shield, Book, BookOpen, CheckCircle,
  AlertTriangle, Users, LogOut, CreditCard, Bell, Plus,
  Trash2, Check, X, UserPlus, Info, Edit, ArrowLeft,
  Eye, EyeOff, Award, ClipboardList, Settings, DollarSign,
  CheckSquare, RefreshCw, Database, Copy, Unlock,
  ChevronDown, ChevronUp, TrendingUp, TrendingDown, Search,
  ListChecks, BarChart3, PieChart, Calendar, FileText,
  Upload, Download, Filter, UserCheck, XCircle
} from 'lucide-react';
 
const HARDCODED_APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbwqbAPcV4Mz6hT-PneqAQoC-aZoRdgaGJzL23qAOwcSnClmDzRpf_fzbIsPymtyQYyn-w/exec";
const JILID_LEVELS = [
  'Jilid 1', 'Jilid 2', 'Jilid 3', 'Jilid 4', 'Jilid 5', 'Jilid 6',
  'PSQ 1-2 (Juz 1)', 'PSQ 3-4 (Juz 2-4)', 'PSQ 4-6 (Juz 5-11)', 'PSQ 7-8 (Juz 12-20)', 'PSQ 9-10 (Juz 21-30)', 'Lulus (Tamat)'
];
const INITIAL_DATA = {
  users: [
    { id: '1', username: 'admin', password: '123', role: 'admin', name: 'Super Admin' },
    { id: '2', username: 'kepala', password: '123', role: 'kepala_tpq', name: 'Ust. Abd Adzim' },
    { id: '3', username: 'guru1', password: '123', role: 'guru', name: 'Ustazah Aisyah' },
    { id: '4', username: 'bendahara', password: '123', role: 'bendahara', name: 'Bpk. Ahmad' },
    { id: '5', username: 'santri1', password: '123', role: 'santri', name: 'Muhammad Rafif', guruId: '2', jilid: 'Jilid 1', hasAlarm: false, lastAccDate: '', completedTargets: [], historyBayar: ['2026-07-10'] },
    { id: '6', username: 'santri2', password: '123', role: 'santri', name: 'Fatimah Az-Zahra', guruId: null, jilid: 'Jilid 2', hasAlarm: true, lastAccDate: '', completedTargets: [], historyBayar: [] }
  ],
  progress: [
    { id: '1', santriId: '5', date: '2026-07-15', surah: 'An-Nas', ayat: '1-6', nilai: 'A (Sangat Lancar)', status: 'acc_guru', type: 'harian' }
  ],
  targets: [
    { id: '1', level: 'Jilid 1', description: 'Mengenal makhraj huruf hijaiyah tunggal fathah Alif s.d Ya' },
    { id: '2', level: 'Jilid 1', description: 'Mampu membaca harakat fathah pendek sambung dua huruf' },
    { id: '3', level: 'Jilid 2', description: 'Membaca mad thabi\'i harakat fathah panjang dua ketukan' },
    { id: '4', level: 'PSQ 1-2 (Juz 1)', description: 'Tartil membaca surah Al-Baqarah ayat 1-100 dengan tajwid benar' },
    { id: '5', level: 'PSQ 9-10 (Juz 21-30)', description: 'Hafal lancar Surah An-Naba s.d An-Naziat' }
  ],
  savings: [],
  settings: {
    tpqName: 'TPQ Al-Ikhlas Bakalan',
    logoUrl: 'https://raw.githubusercontent.com/tpqalikhlasbakalan/web-tpq/main/logo.png',
    savingInputRoles: ['bendahara', 'kepala_tpq']
  }
};

// --- UTILITAS ---
const getProp = (obj, keys, defaultVal = undefined) => {
  if (!obj) return defaultVal;
  const objKeys = Object.keys(obj);
  for (let k of keys) {
    const foundKey = objKeys.find(ok => ok.trim().toLowerCase() === k.toLowerCase());
    if (foundKey !== undefined) {
      const val = obj[foundKey];
      if (val !== null && val !== undefined) return val;
    }
  }
  return defaultVal;
};

const normalizeUsers = (rawUsers) => {
  if (!Array.isArray(rawUsers)) return [];
  const seenIds = new Set();
  const uniqueUsers = [];
  rawUsers.forEach(u => {
    if (!u) return;
    let rawId = getProp(u, ['id', 'ID', 'Id']);
    if (rawId === undefined || rawId === null) return;
    const idStr = String(rawId).trim();
    if (!idStr) return;
    if (seenIds.has(idStr)) return;
    seenIds.add(idStr);
    let completed = [];
    let rawCompleted = getProp(u, ['completedTargets', 'completedtargets', 'target_selesai', 'completed_targets']);
    try {
      if (Array.isArray(rawCompleted)) completed = rawCompleted.map(String);
      else if (typeof rawCompleted === 'string' && rawCompleted.trim() !== '') {
        const parsed = JSON.parse(rawCompleted);
        completed = Array.isArray(parsed) ? parsed.map(String) : [];
      }
    } catch (e) { console.error("Error parsing completedTargets", e); }
    let history = [];
    let rawHistory = getProp(u, ['historyBayar', 'historybayar', 'riwayat_bayar', 'history_bayar']);
    try {
      if (Array.isArray(rawHistory)) history = rawHistory.map(String);
      else if (typeof rawHistory === 'string' && rawHistory.trim() !== '') {
        const parsed = JSON.parse(rawHistory);
        history = Array.isArray(parsed) ? parsed.map(String) : [];
      }
    } catch (e) { console.error("Error parsing historyBayar", e); }
    let finalGuruId = null;
    let rawGuruId = getProp(u, ['guruId', 'guruid', 'guru_id', 'wali_kelas', 'walikelas']);
    if (rawGuruId !== undefined && rawGuruId !== null) {
      const guruIdStr = String(rawGuruId).trim();
      if (guruIdStr !== "" && guruIdStr !== "null" && guruIdStr !== "undefined") finalGuruId = guruIdStr;
    }
    let finalJilid = undefined;
    let rawRole = getProp(u, ['role', 'Role', 'peran', 'status_akses'], '');
    const roleStr = String(rawRole).trim().toLowerCase();
    if (roleStr === 'santri') {
      finalJilid = 'Jilid 1';
      let rawJilid = getProp(u, ['jilid', 'Jid', 'jid', 'JID', 'Jilid', 'tingkatan', 'kelas']);
      if (rawJilid !== undefined && rawJilid !== null) {
        const jilidStr = String(rawJilid).trim();
        if (jilidStr !== "" && jilidStr !== "null" && jilidStr !== "undefined") finalJilid = jilidStr;
      }
    }
    let rawHasAlarm = getProp(u, ['hasAlarm', 'hasalarm', 'alarm', 'tagihan_alarm']);
    let rawLastAccDate = getProp(u, ['lastAccDate', 'lastaccdate', 'acc_terakhir', 'last_acc_date'], '');
    uniqueUsers.push({
      id: idStr, username: String(getProp(u, ['username', 'Username', 'user', 'nama_pengguna'], '')).trim(),
      password: String(getProp(u, ['password', 'Password', 'sandi', 'kata_sandi'], '')), role: roleStr,
      name: String(getProp(u, ['name', 'Name', 'nama', 'nama_lengkap', 'Nama Lengkap'], '')).trim(),
      guruId: finalGuruId, jilid: roleStr === 'santri' ? (finalJilid || 'Jilid 1') : null,
      hasAlarm: rawHasAlarm === true || rawHasAlarm === 'true' || rawHasAlarm === 1,
      lastAccDate: String(rawLastAccDate), completedTargets: completed, historyBayar: history
    });
  });
  return uniqueUsers;
};

const normalizeProgress = (rawProgress) => {
  if (!Array.isArray(rawProgress)) return [];
  const seenIds = new Set();
  const uniqueProgress = [];
  rawProgress.forEach(p => {
    if (!p) return;
    let rawId = getProp(p, ['id', 'ID', 'Id']);
    if (rawId === undefined || rawId === null) return;
    const idStr = String(rawId).trim();
    if (!idStr || seenIds.has(idStr)) return;
    seenIds.add(idStr);
    uniqueProgress.push({
      id: idStr, santriId: String(getProp(p, ['santriId', 'santriid', 'santri_id', 'id_santri'], '')).trim(),
      date: String(getProp(p, ['date', 'Date', 'tanggal'], '')), surah: String(getProp(p, ['surah', 'Surah', 'surat', 'halaman'], '')),
      ayat: String(getProp(p, ['ayat', 'Ayat', 'baris'], '')), nilai: String(getProp(p, ['nilai', 'Nilai', 'score', 'kualitas'], '')),
      status: String(getProp(p, ['status', 'Status'], '')), type: String(getProp(p, ['type', 'Type', 'jenis'], ''))
    });
  });
  return uniqueProgress;
};

const normalizeTargets = (rawTargets) => {
  if (!Array.isArray(rawTargets)) return [];
  const seenIds = new Set();
  const uniqueTargets = [];
  rawTargets.forEach(t => {
    if (!t) return;
    let rawId = getProp(t, ['id', 'ID', 'Id']);
    if (rawId === undefined || rawId === null) return;
    const idStr = String(rawId).trim();
    if (!idStr || seenIds.has(idStr)) return;
    seenIds.add(idStr);
    uniqueTargets.push({
      id: idStr, level: String(getProp(t, ['level', 'Level', 'jilid', 'Jilid', 'tingkatan'], '')),
      description: String(getProp(t, ['description', 'Description', 'deskripsi', 'keterangan'], ''))
    });
  });
  return uniqueTargets;
};

const normalizeSavings = (rawSavings) => {
  if (!Array.isArray(rawSavings)) return [];
  const seenIds = new Set();
  const uniqueSavings = [];
  rawSavings.forEach(s => {
    if (!s) return;
    let rawId = getProp(s, ['id', 'ID', 'Id']);
    if (rawId === undefined || rawId === null) return;
    const idStr = String(rawId).trim();
    if (!idStr || seenIds.has(idStr)) return;
    seenIds.add(idStr);
    uniqueSavings.push({
      id: idStr, santriId: String(getProp(s, ['santriId', 'santriid', 'santri_id', 'id_santri'], '')).trim(),
      date: String(getProp(s, ['date', 'Date', 'tanggal'], '')), amount: Number(getProp(s, ['amount', 'Amount', 'nominal', 'jumlah', 'uang'], 0)),
      type: String(getProp(s, ['type', 'Type', 'jenis'], 'setor')), description: String(getProp(s, ['description', 'Description', 'keterangan', 'deskripsi'], '')).trim(),
      inputBy: String(getProp(s, ['inputBy', 'inputby', 'petugas'], '')).trim()
    });
  });
  return uniqueSavings;
};

const safeGetLocalStorage = (key, fallback) => {
  try { const item = localStorage.getItem(key); return item ? JSON.parse(item) : fallback; }
  catch (e) { console.error("Error reading localStorage:", key, e); return fallback; }
};

const getRoleName = (role) => ({
  'admin': 'Admin System', 'kepala_tpq': 'Kepala TPQ', 'guru': 'Guru Ngaji',
  'bendahara': 'Bendahara', 'santri': 'Santri / Wali'
}[role] || role);

const isAccNeeded = (lastAccDate, simulatedWeekend = false) => {
  const now = new Date();
  const currentDay = now.getDay();
  const currentHour = now.getHours();
  const isWeekendRange = simulatedWeekend || (currentDay === 6 && currentHour >= 18) || (currentDay === 0);
  if (!isWeekendRange) return false;
  let lastSaturday18 = new Date(now);
  if (currentDay === 0) lastSaturday18.setDate(now.getDate() - 1);
  else if (currentDay === 6) { if (currentHour < 18) lastSaturday18.setDate(now.getDate() - 7); }
  else lastSaturday18.setDate(now.getDate() - ((currentDay + 1) % 7));
  lastSaturday18.setHours(18, 0, 0, 0);
  if (!lastAccDate || isNaN(Date.parse(lastAccDate))) return true;
  try { return new Date(lastAccDate) < lastSaturday18; } catch (e) { return true; }
};

// --- KOMPONEN UMUM ---
const Toast = ({ message, type, onClose }) => {
  if (!message) return null;
  const bgColor = type === 'error' ? 'bg-red-500' : 'bg-emerald-600';
  return <div className={`fixed top-4 right-4 z-50 ${bgColor} text-white px-5 py-3 rounded-xl shadow-lg text-sm font-semibold animate-fade-in`}>{message}</div>;
};

const BackButton = ({ onClick }) => (
  <button onClick={onClick} className="mb-6 flex items-center text-sm font-bold text-gray-600 hover:text-emerald-700 transition-all duration-200 relative z-50 bg-white px-4 py-2 rounded-xl border border-gray-200 shadow-sm hover:shadow hover:border-emerald-300 w-fit active:scale-95">
    <ArrowLeft className="w-4 h-4 mr-1.5" /> Kembali ke Menu Utama
  </button>
);

const MenuGrid = ({ menus, onSelect }) => (
  <div className="grid grid-cols-3 gap-4 animate-fade-in">
    {menus.map(menu => (
      <button key={menu.id} onClick={() => onSelect(menu.id)} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 hover:shadow-md hover:border-emerald-200 flex flex-col items-center justify-center text-center transition-all duration-300 group relative overflow-hidden w-full">
        <div className="absolute top-0 right-0 w-12 h-12 bg-emerald-50 rounded-full -mr-6 -mt-6 transition-all group-hover:scale-150 opacity-40"></div>
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-3 transition-transform group-hover:scale-110 shadow-sm ${menu.color}`}>
          <menu.icon className="w-6 h-6" />
        </div>
        <h3 className="font-semibold text-gray-800 text-xs group-hover:text-emerald-700">{menu.label}</h3>
      </button>
    ))}
  </div>
);

// --- MODUL TABUNGAN ---
function SavingsInputView({ users, savings, updateTable, showToast, recorderId }) {
  const [selectedSantri, setSelectedSantri] = useState(null);
  const santriList = users.filter(u => u.role === 'santri');

  const hitungSaldoAktual = (idSantri) => savings.filter(i => String(i.santriId) === String(idSantri))
    .reduce((total, trx) => trx.type === 'setor' ? total + trx.amount : total - trx.amount, 0);

  const pilihSantri = (santri) => setSelectedSantri({...santri, saldo_awal: hitungSaldoAktual(santri.id)});

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedSantri || !e.target.amount.value) return showToast('Pilih santri & masukkan nominal!', 'error');
    const jenis = e.target.type.value, nominal = parseInt(e.target.amount.value), tanggal = e.target.date.value;
    const keterangan = e.target.description.value.trim() || (jenis === 'setor' ? 'Setoran' : 'Penarikan');
    if (nominal <= 0) return showToast('Nominal tidak valid!', 'error');
    if (jenis === 'tarik' && hitungSaldoAktual(selectedSantri.id) < nominal) return showToast('Saldo tidak cukup!', 'error');
    const transaksiBaru = { id: Date.now().toString(), santriId: selectedSantri.id, date: tanggal, amount: nominal, type: jenis, description: keterangan, inputBy: recorderId };
    await updateTable('savings', [transaksiBaru, ...savings]);
    setSelectedSantri({...selectedSantri, saldo_awal: hitungSaldoAktual(selectedSantri.id)});
    showToast('Tersimpan! Saldo sudah disinkronkan.');
    e.target.reset();
  };

  const hapusTransaksi = async (dataTrx) => {
    if(!confirm('Yakin hapus? Saldo akan dikembalikan otomatis!')) return;
    const saldoKoreksi = dataTrx.type === 'setor' ? hitungSaldoAktual(selectedSantri.id) - dataTrx.amount : hitungSaldoAktual(selectedSantri.id) + dataTrx.amount;
    if (saldoKoreksi < 0) return showToast('Tidak bisa dihapus (saldo akan minus)!', 'error');
    await updateTable('savings', savings.filter(x => x.id !== dataTrx.id));
    setSelectedSantri({...selectedSantri, saldo_awal: saldoKoreksi});
    showToast('Dihapus! Saldo sudah diperbaiki.');
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-2xl shadow-sm border">
        <h3 className="text-lg font-bold mb-6 flex items-center text-amber-800">
          <DollarSign className="mr-2"/> Input & Riwayat Tabungan (Tersinkron)
        </h3>
        {santriList.length === 0 ? (
          <div className="p-6 bg-amber-50 border border-amber-200 rounded-xl"><p className="text-amber-900 text-sm">Belum ada data santri.</p></div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-gray-50 p-4 rounded-xl border">
              <h4 className="text-xs font-bold text-gray-700 mb-3 border-b pb-2 uppercase">Daftar Santri</h4>
              <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
                {santriList.map(s => {
                  const saldoBenar = hitungSaldoAktual(s.id);
                  return (
                    <button key={s.id} onClick={() => pilihSantri(s)} className={`w-full p-3 rounded-xl text-left text-sm border transition-all ${selectedSantri?.id === s.id ? 'bg-amber-600 text-white font-bold border-amber-600 shadow-md' : 'bg-white text-gray-700 border-gray-200 hover:bg-amber-50 hover:border-amber-200'}`}>
                      <p className="font-semibold">{s.name} {s.jilid ? `(${s.jilid})` : ''}</p>
                      <p className="mt-0.5 opacity-80 text-xs">Saldo: Rp {saldoBenar.toLocaleString('id-ID')}</p>
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="md:col-span-2 space-y-6">
              {!selectedSantri ? (
                <div className="p-10 text-center text-gray-400 text-sm italic bg-gray-50 border border-dashed rounded-xl">Klik nama santri untuk melihat saldo & riwayat</div>
              ) : (
                <>
                  <div className="bg-amber-50 p-4 rounded-xl border border-amber-200">
                    <p className="text-[11px] text-amber-700 font-bold uppercase">Santri Terpilih</p>
                    <h4 className="font-extrabold text-lg mt-0.5">{selectedSantri.name}</h4>
                    <p className="text-sm text-gray-600 mt-1">Saldo Aktual: <strong>Rp {hitungSaldoAktual(selectedSantri.id).toLocaleString('id-ID')}</strong></p>
                  </div>
                  <form onSubmit={handleSubmit} className="space-y-4 bg-gray-50 p-5 rounded-2xl border">
                    <h5 className="font-bold text-sm text-gray-700 border-b pb-2">Input Mutasi Baru</h5>
                    <div className="grid grid-cols-2 gap-4">
                      <div><label className="block text-xs font-bold mb-1 text-gray-700">Tanggal</label><input type="date" name="date" defaultValue={new Date().toISOString().slice(0,10)} required className="w-full p-2.5 border rounded-xl text-xs" /></div>
                      <div><label className="block text-xs font-bold mb-1 text-gray-700">Jenis</label><select name="type" className="w-full p-2.5 border rounded-xl text-xs font-bold"><option value="setor">Setoran</option><option value="tarik">Penarikan</option></select></div>
                    </div>
                    <div><label className="block text-xs font-bold mb-1 text-gray-700">Nominal (Rp)</label><input type="number" name="amount" min="1000" placeholder="Contoh: 10000" required className="w-full p-2.5 border rounded-xl text-xs" /></div>
                    <div><label className="block text-xs font-bold mb-1 text-gray-700">Keterangan</label><input type="text" name="description" placeholder="Opsional" className="w-full p-2.5 border rounded-xl text-xs" /></div>
                    <button type="submit" className="w-full bg-amber-600 hover:bg-amber-700 text-white font-bold py-3 rounded-xl text-xs shadow">Simpan & Sinkronkan Saldo</button>
                  </form>
                  <div className="border-t pt-6">
                    <h5 className="text-sm font-bold mb-4 text-gray-800">Riwayat Transaksi</h5>
                    {(() => {
                      const riwayat = savings.filter(i => String(i.santriId) === String(selectedSantri.id));
                      if (riwayat.length === 0) return <p className="text-sm text-gray-500 italic">Belum ada riwayat.</p>;
                      return (
                        <div className="overflow-x-auto">
                          <table className="w-full text-xs">
                            <thead className="bg-gray-50 font-bold text-gray-600 uppercase"><tr><th className="p-2 text-left">Tanggal</th><th className="p-2 text-left">Jenis</th><th className="p-2 text-left">Keterangan</th><th className="p-2 text-right">Nominal</th><th className="p-2 text-center">Aksi</th></tr></thead>
                            <tbody>
                              {[...riwayat].sort((a,b) => new Date(b.date) - new Date(a.date)).map((r,i) => (
                                <tr key={r.id||i} className="border-b hover:bg-gray-50">
                                  <td className="p-2">{r.date}</td>
                                  <td className="p-2"><span className={`px-2 py-0.5 rounded-full font-bold ${r.type==='setor'?'bg-green-100 text-green-700':'bg-red-100 text-red-700'}`}>{r.type==='setor'?'Setoran':'Penarikan'}</span></td>
                                  <td className="p-2">{r.description||'-'}</td>
                                  <td className="p-2 text-right font-bold">Rp {Number(r.amount).toLocaleString('id-ID')}</td>
                                  <td className="p-2 text-center"><button onClick={() => hapusTransaksi(r)} className="text-red-500 hover:text-red-700">🗑️</button></td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      );
                    })()}
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// --- MODUL SANTRI ---
function SantriView({ activeTab, setActiveTab, user, users, progress, targets, savings, updateTable, showToast, simulatedWeekend, setSimulatedWeekend }) {
  const semuaProgresSaya = progress.filter(p => String(p.santriId) === String(user.id));
  const progresMenungguAcc = progress.filter(p => String(p.santriId) === String(user.id) && p.status === 'belum_disetujui');
  const myTargets = targets.filter(t => t.level === user.jilid);
  const mySavings = savings.filter(s => String(s.santriId) === String(user.id));
  const totalDeposit = mySavings.filter(s => s.type === 'setor').reduce((acc, curr) => acc + curr.amount, 0);
  const totalWithdraw = mySavings.filter(s => s.type === 'tarik').reduce((acc, curr) => acc + curr.amount, 0);
  const currentBalance = totalDeposit - totalWithdraw;
  const activeWeekendNotification = isAccNeeded(user.lastAccDate, simulatedWeekend);

  const menus = [
    { id: 'persetujuan_wali', label: progresMenungguAcc.length > 0 ? `🔴 Persetujuan Wali (${progresMenungguAcc.length})` : '✍️ Persetujuan Wali Santri', icon: CheckSquare, color: progresMenungguAcc.length > 0 ? 'bg-red-100 text-red-700 animate-pulse' : 'bg-blue-50 text-blue-600' },
    { id: 'progres_mengaji', label: 'Progres Mengaji Saya', icon: BookOpen, color: 'bg-emerald-100 text-emerald-600' },
    { id: 'riwayat_pembayaran', label: 'Riwayat Pembayaran', icon: CreditCard, color: 'bg-indigo-100 text-indigo-600' },
    { id: 'riwayat_tabungan', label: 'Riwayat Tabungan', icon: DollarSign, color: 'bg-amber-100 text-amber-600' }
  ];

  if (activeTab === 'dashboard') return (
    <div className="space-y-6 animate-fade-in">
      <div className="bg-emerald-600 rounded-3xl p-6 text-white shadow-lg relative overflow-hidden">
        <div className="absolute right-0 bottom-0 opacity-10 transform translate-x-6 translate-y-6"><BookOpen className="w-56 h-56" /></div>
        <p className="text-xs font-bold text-emerald-200 uppercase tracking-widest">Informasi Santri</p>
        <h2 className="text-2xl font-black mt-1">{user.name}</h2>
        <div className="grid grid-cols-2 gap-4 mt-6 border-t border-emerald-500 pt-4 text-xs font-semibold">
          <div><p className="text-emerald-200">Tingkatan Saat Ini</p><p className="text-base font-bold mt-0.5">{user.jilid || 'Jilid 1'}</p></div>
          <div><p className="text-emerald-200">Saldo Tabungan</p><p className="text-base font-bold mt-0.5">Rp {currentBalance.toLocaleString('id-ID')}</p></div>
        </div>
      </div>
      {user.hasAlarm && (
        <div className="bg-red-50 border border-red-200 p-5 rounded-2xl flex items-start space-x-3.5 shadow-sm animate-pulse">
          <AlertTriangle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1"><p className="font-bold text-red-800 text-sm">Pengingat Tagihan</p><p className="text-xs text-red-700 mt-1">Segera hubungi bendahara untuk penyelesaian tagihan.</p></div>
        </div>
      )}
      {activeWeekendNotification && (
        <div className="bg-blue-50 border border-blue-200 p-5 rounded-2xl flex items-start space-x-3.5 shadow-sm">
          <Bell className="w-6 h-6 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1"><p className="font-bold text-blue-800 text-sm">Waktu Persetujuan</p><p className="text-xs text-blue-700 mt-1">Silakan periksa & setujui progres sebelum akhir pekan.</p></div>
        </div>
      )}
      <MenuGrid menus={menus} onSelect={setActiveTab} />
    </div>
  );

  if (activeTab === 'persetujuan_wali') return (
    <div className="space-y-6 animate-fade-in">
      <BackButton onClick={() => setActiveTab('dashboard')} />
      <div className="bg-white p-6 rounded-2xl shadow-sm border">
        <h3 className="text-lg font-bold mb-4 text-blue-800">Persetujuan Setoran Mengaji</h3>
        {progresMenungguAcc.length === 0 ? <p className="text-gray-500 text-sm italic">Tidak ada setoran yang menunggu persetujuan.</p> : (
          <div className="space-y-3">
            {progresMenungguAcc.map((item) => (
              <div key={item.id} className="p-4 border border-blue-100 rounded-xl bg-blue-50 flex justify-between items-center">
                <div><p className="font-semibold text-sm">{item.surah} ayat {item.ayat}</p><p className="text-xs text-gray-600 mt-0.5">Tanggal: {item.date} • Nilai: {item.nilai}</p></div>
                <button onClick={async () => {
                  const updated = progress.map(p => p.id === item.id ? {...p, status: 'disetujui_wali'} : p);
                  await updateTable('progress', updated);
                  await updateTable('users', users.map(u => u.id === user.id ? {...u, lastAccDate: new Date().toISOString().split('T')[0]} : u));
                  showToast('Setoran disetujui!');
                }} className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg text-xs font-bold">Setujui</button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  if (activeTab === 'progres_mengaji') return (
    <div className="space-y-6 animate-fade-in">
      <BackButton onClick={() => setActiveTab('dashboard')} />
      <div className="bg-white p-6 rounded-2xl shadow-sm border">
        <h3 className="text-lg font-bold mb-4 text-emerald-800">Riwayat Progres Mengaji</h3>
        {semuaProgresSaya.length === 0 ? <p className="text-gray-500 text-sm italic">Belum ada riwayat setoran.</p> : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-gray-50 font-bold text-gray-600 uppercase"><tr><th className="p-2 text-left">Tanggal</th><th className="p-2 text-left">Surah</th><th className="p-2 text-left">Ayat</th><th className="p-2 text-left">Nilai</th><th className="p-2 text-left">Status</th></tr></thead>
              <tbody>
                {semuaProgresSaya.sort((a,b) => new Date(b.date) - new Date(a.date)).map((p,i) => (
                  <tr key={p.id||i} className="border-b hover:bg-gray-50">
                    <td className="p-2">{p.date}</td><td className="p-2">{p.surah}</td><td className="p-2">{p.ayat}</td><td className="p-2">{p.nilai}</td>
                    <td className="p-2"><span className={`px-2 py-0.5 rounded-full font-bold ${p.status==='disetujui_wali'?'bg-green-100 text-green-700':p.status==='belum_disetujui'?'bg-yellow-100 text-yellow-700':'bg-gray-100 text-gray-700'}`}>{p.status==='disetujui_wali'?'Disetujui':p.status==='belum_disetujui'?'Menunggu':'Disetujui Guru'}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      <div className="bg-white p-6 rounded-2xl shadow-sm border">
        <h3 className="text-lg font-bold mb-4 text-emerald-800">Target Tingkatan: {user.jilid}</h3>
        {myTargets.length === 0 ? <p className="text-gray-500 text-sm italic">Belum ada target untuk tingkatan ini.</p> : (
          <ul className="space-y-2">{myTargets.map((t,i) => <li key={t.id||i} className="p-3 bg-emerald-50 border border-emerald-100 rounded-xl text-sm">• {t.description}</li>)}</ul>
        )}
      </div>
    </div>
  );

  if (activeTab === 'riwayat_pembayaran') return (
    <div className="space-y-6 animate-fade-in">
      <BackButton onClick={() => setActiveTab('dashboard')} />
      <div className="bg-white p-6 rounded-2xl shadow-sm border">
        <h3 className="text-lg font-bold mb-4 text-indigo-800">Riwayat Pembayaran Iuran</h3>
        {user.historyBayar.length === 0 ? <p className="text-gray-500 text-sm italic">Belum ada riwayat pembayaran.</p> : (
          <ul className="space-y-2">{user.historyBayar.sort((a,b) => new Date(b) - new Date(a)).map((t,i) => <li key={i} className="p-3 bg-indigo-50 border border-indigo-100 rounded-xl text-sm flex items-center"><CheckCircle className="w-4 h-4 text-indigo-600 mr-2" /> {t}</li>)}</ul>
        )}
      </div>
    </div>
  );

  if (activeTab === 'riwayat_tabungan') return (
    <div className="space-y-6 animate-fade-in">
      <BackButton onClick={() => setActiveTab('dashboard')} />
      <div className="bg-white p-6 rounded-2xl shadow-sm border">
        <div className="flex justify-between items-center mb-4"><h3 className="text-lg font-bold text-amber-800">Riwayat Tabungan</h3><p className="text-sm font-bold">Saldo: <span className="text-amber-700">Rp {currentBalance.toLocaleString('id-ID')}</span></p></div>
        {mySavings.length === 0 ? <p className="text-gray-500 text-sm italic">Belum ada riwayat transaksi.</p> : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-gray-50 font-bold text-gray-600 uppercase"><tr><th className="p-2 text-left">Tanggal</th><th className="p-2 text-left">Jenis</th><th className="p-2 text-left">Keterangan</th><th className="p-2 text-right">Nominal</th></tr></thead>
              <tbody>
                {mySavings.sort((a,b) => new Date(b.date) - new Date(a.date)).map((s,i) => (
                  <tr key={s.id||i} className="border-b hover:bg-gray-50">
                    <td className="p-2">{s.date}</td>
                    <td className="p-2"><span className={`px-2 py-0.5 rounded-full font-bold ${s.type==='setor'?'bg-green-100 text-green-700':'bg-red-100 text-red-700'}`}>{s.type==='setor'?'Setoran':'Penarikan'}</span></td>
                    <td className="p-2">{s.description||'-'}</td>
                    <td className="p-2 text-right font-bold">Rp {Number(s.amount).toLocaleString('id-ID')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

// --- MODUL GURU ---
function GuruView({ activeTab, setActiveTab, user, users, setUsers, progress, targets, savings, updateTable, showToast }) {
  const [filterSantri, setFilterSantri] = useState('');
  const santriBimbingan = users.filter(u => u.role === 'santri' && u.guruId === user.id && u.name.toLowerCase().includes(filterSantri.toLowerCase()));
  const [formProgres, setFormProgres] = useState({ santriId: '', surah: '', ayat: '', nilai: 'B (Lancar)', jilid: '' });

  const menus = [
    { id: 'daftar_santri', label: 'Santri Bimbingan', icon: Users, color: 'bg-blue-100 text-blue-700' },
    { id: 'input_progres', label: 'Input Setoran', icon: ClipboardList, color: 'bg-emerald-100 text-emerald-700' },
    { id: 'lihat_progres', label: 'Riwayat Progres', icon: ListChecks, color: 'bg-purple-100 text-purple-700' },
    { id: 'target_mengaji', label: 'Target Tingkatan', icon: Award, color: 'bg-amber-100 text-amber-700' }
  ];

  if (activeTab === 'dashboard') return (
    <div className="space-y-6 animate-fade-in">
      <div className="bg-blue-600 rounded-3xl p-6 text-white shadow-lg">
        <p className="text-xs font-bold text-blue-200 uppercase tracking-widest">Halaman Guru</p>
        <h2 className="text-2xl font-black mt-1">{user.name}</h2>
        <p className="text-sm mt-2 text-blue-100">Membimbing {santriBimbingan.length} santri</p>
      </div>
      <MenuGrid menus={menus} onSelect={setActiveTab} />
    </div>
  );

  if (activeTab === 'daftar_santri') return (
    <div className="space-y-6 animate-fade-in">
      <BackButton onClick={() => setActiveTab('dashboard')} />
      <div className="bg-white p-6 rounded-2xl shadow-sm border">
        <h3 className="text-lg font-bold mb-4 text-blue-800">Daftar Santri Bimbingan</h3>
        <input type="text" placeholder="Cari nama santri..." value={filterSantri} onChange={(e) => setFilterSantri(e.target.value)} className="w-full p-2.5 border rounded-xl text-sm mb-4" />
        {santriBimbingan.length === 0 ? <p className="text-gray-500 text-sm italic">Belum ada santri yang dibimbing.</p> : (
          <div className="space-y-2">
            {santriBimbingan.map(s => (
              <div key={s.id} className="p-3 border rounded-xl bg-white flex justify-between items-center">
                <div><p className="font-semibold text-sm">{s.name}</p><p className="text-xs text-gray-500">{s.jilid}</p></div>
                <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full font-bold">Aktif</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  if (activeTab === 'input_progres') return (
    <div className="space-y-6 animate-fade-in">
      <BackButton onClick={() => setActiveTab('dashboard')} />
      <div className="bg-white p-6 rounded-2xl shadow-sm border">
        <h3 className="text-lg font-bold mb-4 text-emerald-800">Input Setoran Mengaji</h3>
        <form onSubmit={async (e) => {
          e.preventDefault();
          const baru = { id: Date.now().toString(), santriId: formProgres.santriId, date: new Date().toISOString().split('T')[0], surah: formProgres.surah, ayat: formProgres.ayat, nilai: formProgres.nilai, status: 'belum_disetujui', type: 'harian' };
          await updateTable('progress', [baru, ...progress]);
          showToast('Setoran berhasil dicatat! Menunggu persetujuan wali.');
          setFormProgres({ santriId: '', surah: '', ayat: '', nilai: 'B (Lancar)', jilid: '' });
        }} className="space-y-4">
          <div><label className="block text-xs font-bold mb-1">Pilih Santri</label><select value={formProgres.santriId} onChange={(e) => setFormProgres({...formProgres, santriId: e.target.value})} required className="w-full p-2.5 border rounded-xl text-sm">
            <option value="">-- Pilih Santri --</option>
            {santriBimbingan.map(s => <option key={s.id} value={s.id}>{s.name} ({s.jilid})</option>)}
          </select></div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-xs font-bold mb-1">Surah</label><input type="text" value={formProgres.surah} onChange={(e) => setFormProgres({...formProgres, surah: e.target.value})} required className="w-full p-2.5 border rounded-xl text-sm" /></div>
            <div><label className="block text-xs font-bold mb-1">Ayat</label><input type="text" value={formProgres.ayat} onChange={(e) => setFormProgres({...formProgres, ayat: e.target.value})} required className="w-full p-2.5 border rounded-xl text-sm" /></div>
          </div>
          <div><label className="block text-xs font-bold mb-1">Penilaian</label><select value={formProgres.nilai} onChange={(e) => setFormProgres({...formProgres, nilai: e.target.value})} className="w-full p-2.5 border rounded-xl text-sm">
            <option value="A (Sangat Lancar)">A - Sangat Lancar</option>
            <option value="B (Lancar)">B - Lancar</option>
            <option value="C (Perlu Latihan)">C - Perlu Latihan</option>
            <option value="D (Belum Lancar)">D - Belum Lancar</option>
          </select></div>
          <button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-xl text-sm">Simpan Setoran</button>
        </form>
      </div>
    </div>
  );

  if (activeTab === 'lihat_progres') return (
    <div className="space-y-6 animate-fade-in">
      <BackButton onClick={() => setActiveTab('dashboard')} />
      <div className="bg-white p-6 rounded-2xl shadow-sm border">
        <h3 className="text-lg font-bold mb-4 text-purple-800">Riwayat Semua Progres</h3>
        {progress.length === 0 ? <p className="text-gray-500 text-sm italic">Belum ada data progres.</p> : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-gray-50 font-bold text-gray-600 uppercase"><tr><th className="p-2 text-left">Tanggal</th><th className="p-2 text-left">Santri</th><th className="p-2 text-left">Surah</th><th className="p-2 text-left">Nilai</th><th className="p-2 text-left">Status</th></tr></thead>
              <tbody>
                {[...progress].sort((a,b) => new Date(b.date) - new Date(a.date)).map((p,i) => {
                  const namaSantri = users.find(u => u.id === p.santriId)?.name || '-';
                  return (
                    <tr key={p.id||i} className="border-b hover:bg-gray-50">
                      <td className="p-2">{p.date}</td><td className="p-2">{namaSantri}</td><td className="p-2">{p.surah} ayat {p.ayat}</td><td className="p-2">{p.nilai}</td>
                      <td className="p-2"><span className={`px-2 py-0.5 rounded-full font-bold ${p.status==='disetujui_wali'?'bg-green-100 text-green-700':p.status==='belum_disetujui'?'bg-yellow-100 text-yellow-700':'bg-gray-100 text-gray-700'}`}>{p.status==='disetujui_wali'?'Disetujui':'Menunggu'}</span></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );

  if (activeTab === 'target_mengaji') return (
    <div className="space-y-6 animate-fade-in">
      <BackButton onClick={() => setActiveTab('dashboard')} />
      <div className="bg-white p-6 rounded-2xl shadow-sm border">
        <h3 className="text-lg font-bold mb-4 text-amber-800">Target Tingkatan Mengaji</h3>
        {JILID_LEVELS.map(jilid => (
          <div key={jilid} className="mb-4">
            <h4 className="font-bold text-sm text-gray-800 mb-2">{jilid}</h4>
            <ul className="space-y-1 pl-4">
              {targets.filter(t => t.level === jilid).map((t,i) => <li key={t.id||i} className="text-xs text-gray-600 list-disc">{t.description}</li>)}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}

// --- MODUL KEPALA TPQ ---
function KepalaView({ activeTab, setActiveTab, user, users, setUsers, progress, targets, savings, settings, updateTable, showToast, appsScriptUrl, setAppsScriptUrl, loadDatabase, isSyncing }) {
  const menus = [
    { id: 'ringkasan', label: 'Ringkasan Data', icon: BarChart3, color: 'bg-blue-100 text-blue-700' },
    { id: 'kelola_santri', label: 'Data Santri', icon: Users, color: 'bg-emerald-100 text-emerald-700' },
    { id: 'kelola_guru', label: 'Data Guru', icon: UserCheck, color: 'bg-purple-100 text-purple-700' },
    { id: 'target_tingkatan', label: 'Kelola Target', icon: Award, color: 'bg-amber-100 text-amber-700' },
    { id: 'kelola_tabungan', label: 'Tabungan Santri', icon: DollarSign, color: 'bg-indigo-100 text-indigo-700' },
    { id: 'pengaturan', label: 'Pengaturan', icon: Settings, color: 'bg-gray-100 text-gray-700' }
  ];

  if (activeTab === 'dashboard') return (
    <div className="space-y-6 animate-fade-in">
      <div className="bg-purple-700 rounded-3xl p-6 text-white shadow-lg">
        <p className="text-xs font-bold text-purple-200 uppercase tracking-widest">Halaman Kepala TPQ</p>
        <h2 className="text-2xl font-black mt-1">{user.name}</h2>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl shadow-sm border text-center">
          <p className="text-2xl font-bold text-blue-700">{users.filter(u => u.role === 'santri').length}</p>
          <p className="text-xs text-gray-500 mt-1">Total Santri</p>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border text-center">
          <p className="text-2xl font-bold text-emerald-700">{users.filter(u => u.role === 'guru').length}</p>
          <p className="text-xs text-gray-500 mt-1">Total Guru</p>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border text-center">
          <p className="text-2xl font-bold text-amber-700">{progress.length}</p>
          <p className="text-xs text-gray-500 mt-1">Total Setoran</p>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border text-center">
          <p className="text-2xl font-bold text-indigo-700">{savings.length}</p>
          <p className="text-xs text-gray-500 mt-1">Transaksi Tabungan</p>
        </div>
      </div>
      <MenuGrid menus={menus} onSelect={setActiveTab} />
    </div>
  );

  if (activeTab === 'ringkasan') return (
    <div className="space-y-6 animate-fade-in">
      <BackButton onClick={() => setActiveTab('dashboard')} />
      <div className="bg-white p-6 rounded-2xl shadow-sm border">
        <h3 className="text-lg font-bold mb-4 text-purple-800">Ringkasan Seluruh Data</h3>
        <div className="space-y-3">
          <p className="text-sm"><strong>TPQ:</strong> {settings.tpqName}</p>
          <p className="text-sm"><strong>Jumlah Santri Aktif:</strong> {users.filter(u => u.role === 'santri').length} orang</p>
          <p className="text-sm"><strong>Jumlah Pengajar:</strong> {users.filter(u => ['guru','kepala_tpq','bendahara'].includes(u.role)).length} orang</p>
          <p className="text-sm"><strong>Total Target Tingkatan:</strong> {targets.length} butir</p>
          <p className="text-sm"><strong>Total Saldo Tabungan:</strong> Rp {savings.reduce((a,b) => a + (b.type==='setor'?b.amount:-b.amount),0).toLocaleString('id-ID')}</p>
        </div>
      </div>
    </div>
  );

  if (activeTab === 'kelola_santri') return (
    <div className="space-y-6 animate-fade-in">
      <BackButton onClick={() => setActiveTab('dashboard')} />
      <div className="bg-white p-6 rounded-2xl shadow-sm border">
        <h3 className="text-lg font-bold mb-4 text-emerald-800">Daftar Santri</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-gray-50 font-bold text-gray-600 uppercase"><tr><th className="p-2 text-left">Nama</th><th className="p-2 text-left">Username</th><th className="p-2 text-left">Jilid</th><th className="p-2 text-left">Wali Kelas</th></tr></thead>
            <tbody>
              {users.filter(u => u.role === 'santri').map((s,i) => {
                const wali = users.find(g => g.id === s.guruId)?.name || '-';
                return <tr key={s.id} className="border-b"><td className="p-2">{s.name}</td><td className="p-2">{s.username}</td><td className="p-2">{s.jilid}</td><td className="p-2">{wali}</td></tr>;
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  if (activeTab === 'kelola_guru') return (
    <div className="space-y-6 animate-fade-in">
      <BackButton onClick={() => setActiveTab('dashboard')} />
      <div className="bg-white p-6 rounded-2xl shadow-sm border">
        <h3 className="text-lg font-bold mb-4 text-purple-800">Daftar Pengajar & Petugas</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-gray-50 font-bold text-gray-600 uppercase"><tr><th className="p-2 text-left">Nama</th><th className="p-2 text-left">Peran</th><th className="p-2 text-left">Username</th></tr></thead>
            <tbody>
              {users.filter(u => u.role !== 'santri' && u.role !== 'admin').map((g,i) => (
                <tr key={g.id} className="border-b"><td className="p-2">{g.name}</td><td className="p-2">{getRoleName(g.role)}</td><td className="p-2">{g.username}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  if (activeTab === 'target_tingkatan') return (
    <div className="space-y-6 animate-fade-in">
      <BackButton onClick={() => setActiveTab('dashboard')} />
      <div className="bg-white p-6 rounded-2xl shadow-sm border">
        <h3 className="text-lg font-bold mb-4 text-amber-800">Daftar Target Mengaji</h3>
        {JILID_LEVELS.map(j => (
          <div key={j} className="mb-4">
            <h4 className="font-bold text-sm mb-2">{j}</h4>
            <ul className="space-y-1 pl-4">
              {targets.filter(t => t.level === j).map((t,i) => <li key={t.id} className="text-xs list-disc">{t.description}</li>)}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );

  if (activeTab === 'kelola_tabungan') return (
    <div className="animate-fade-in">
      <BackButton onClick={() => setActiveTab('dashboard')} />
      <SavingsInputView users={users} savings={savings} updateTable={updateTable} showToast={showToast} recorderId={user.id} />
    </div>
  );

  if (activeTab === 'pengaturan') return (
    <div className="space-y-6 animate-fade-in">
      <BackButton onClick={() => setActiveTab('dashboard')} />
      <div className="bg-white p-6 rounded-2xl shadow-sm border">
        <h3 className="text-lg font-bold mb-4 text-gray-800">Pengaturan Aplikasi</h3>
        <div className="space-y-4">
          <div><label className="block text-xs font-bold mb-1">Nama TPQ</label><input type="text" value={settings.tpqName} className="w-full p-2.5 border rounded-xl text-sm" readOnly /></div>
          <div><label className="block text-xs font-bold mb-1">URL Apps Script</label><input type="text" value={appsScriptUrl} className="w-full p-2.5 border rounded-xl text-xs bg-gray-50" readOnly /></div>
          <button onClick={() => loadDatabase()} disabled={isSyncing} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl text-sm">
            {isSyncing ? 'Menyinkronkan...' : 'Sinkronkan Ulang Data'}
          </button>
        </div>
      </div>
    </div>
  );
}

// --- MODUL BENDAHARA ---
function BendaharaView({ activeTab, setActiveTab, users, savings, updateTable, showToast, currentUser }) {
  const menus = [
    { id: 'input_tabungan', label: 'Kelola Tabungan', icon: DollarSign, color: 'bg-amber-100 text-amber-700' },
    { id: 'laporan', label: 'Laporan Keuangan', icon: FileText, color: 'bg-indigo-100 text-indigo-700' }
  ];

  if (activeTab === 'dashboard') return (
    <div className="space-y-6 animate-fade-in">
      <div className="bg-amber-600 rounded-3xl p-6 text-white shadow-lg">
        <p className="text-xs font-bold text-amber-200 uppercase tracking-widest">Halaman Bendahara</p>
        <h2 className="text-2xl font-black mt-1">{currentUser.name}</h2>
      </div>
      <MenuGrid menus={menus} onSelect={setActiveTab} />
    </div>
  );

  if (activeTab === 'input_tabungan') return (
    <div className="animate-fade-in">
      <BackButton onClick={() => setActiveTab('dashboard')} />
      <SavingsInputView users={users} savings={savings} updateTable={updateTable} showToast={showToast} recorderId={currentUser.id} />
    </div>
  );

  if (activeTab === 'laporan') return (
    <div className="space-y-6 animate-fade-in">
      <BackButton onClick={() => setActiveTab('dashboard')} />
      <div className="bg-white p-6 rounded-2xl shadow-sm border">
        <h3 className="text-lg font-bold mb-4 text-indigo-800">Laporan Rekapitulasi Tabungan</h3>
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-green-50 p-4 rounded-xl border text-center">
            <p className="text-xs text-gray-600">Total Setoran</p>
            <p className="text-lg font-bold text-green-700">Rp {savings.filter(s => s.type==='setor').reduce((a,b)=>a+b.amount,0).toLocaleString('id-ID')}</p>
          </div>
          <div className="bg-red-50 p-4 rounded-xl border text-center">
            <p className="text-xs text-gray-600">Total Penarikan</p>
            <p className="text-lg font-bold text-red-700">Rp {savings.filter(s => s.type==='tarik').reduce((a,b)=>a+b.amount,0).toLocaleString('id-ID')}</p>
          </div>
          <div className="bg-blue-50 p-4 rounded-xl border text-center">
            <p className="text-xs text-gray-600">Saldo Keseluruhan</p>
            <p className="text-lg font-bold text-blue-700">Rp {savings.reduce((a,b)=>a + (b.type==='setor'?b.amount:-b.amount),0).toLocaleString('id-ID')}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// --- MODUL ADMIN ---
function AdminView({ activeTab, setActiveTab, users, updateTable, showToast, settings, appsScriptUrl, setAppsScriptUrl, loadDatabase }) {
  const [urlInput, setUrlInput] = useState(appsScriptUrl);
  const menus = [
    { id: 'kelola_akun', label: 'Kelola Pengguna', icon: User, color: 'bg-gray-100 text-gray-700' },
    { id: 'sinkronisasi', label: 'Pengaturan Sistem', icon: Settings, color: 'bg-black/5 text-gray-800' }
  ];

  if (activeTab === 'dashboard') return (
    <div className="space-y-6 animate-fade-in">
      <div className="bg-gray-800 rounded-3xl p-6 text-white shadow-lg">
        <p className="text-xs font-bold text-gray-300 uppercase tracking-widest">Halaman Administrator</p>
        <h2 className="text-2xl font-black mt-1">Sistem Pengelolaan TPQ</h2>
      </div>
      <MenuGrid menus={menus} onSelect={setActiveTab} />
    </div>
  );

  if (activeTab === 'kelola_akun') return (
    <div className="space-y-6 animate-fade-in">
      <BackButton onClick={() => setActiveTab('dashboard')} />
      <div className="bg-white p-6 rounded-2xl shadow-sm border">
        <h3 className="text-lg font-bold mb-4 text-gray-800">Daftar Semua Pengguna</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-gray-50 font-bold text-gray-600 uppercase"><tr><th className="p-2 text-left">Nama</th><th className="p-2 text-left">Username</th><th className="p-2 text-left">Peran</th></tr></thead>
            <tbody>
              {users.map((u,i) => (
                <tr key={u.id} className="border-b"><td className="p-2">{u.name}</td><td className="p-2">{u.username}</td><td className="p-2">{getRoleName(u.role)}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  if (activeTab === 'sinkronisasi') return (
    <div className="space-y-6 animate-fade-in">
      <BackButton onClick={() => setActiveTab('dashboard')} />
      <div className="bg-white p-6 rounded-2xl shadow-sm border">
        <h3 className="text-lg font-bold mb-4 text-gray-800">Pengaturan Koneksi Database</h3>
        <div className="space-y-4">
          <div><label className="block text-xs font-bold mb-1">URL Google Apps Script</label>
          <input type="text" value={urlInput} onChange={(e) => setUrlInput(e.target.value)} className="w-full p-2.5 border rounded-xl text-xs font-mono" />
          </div>
          <button onClick={() => {
            localStorage.setItem('tpq_apps_script_url', urlInput);
            setAppsScriptUrl(urlInput);
            loadDatabase(urlInput);
            showToast('URL tersimpan & disinkronkan!');
          }} className="w-full bg-gray-800 hover:bg-black text-white font-bold py-3 rounded-xl text-sm">
            Simpan & Hubungkan
          </button>
        </div>
      </div>
    </div>
  );
}

// --- FUNGSI UTAMA APLIKASI ---
export default function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [toast, setToast] = useState({ message: '', type: '' });
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isInitializing, setIsInitializing] = useState(true);
  const [users, setUsers] = useState([]);
  const [progress, setProgress] = useState([]);
  const [targets, setTargets] = useState([]);
  const [savings, setSavings] = useState([]);
  const [settings, setSettings] = useState(INITIAL_DATA.settings);
  const [isSyncing, setIsSyncing] = useState(false);
  const [simulatedWeekend, setSimulatedWeekend] = useState(false);
  const [appsScriptUrl, setAppsScriptUrl] = useState(() => localStorage.getItem('tpq_apps_script_url') || HARDCODED_APPS_SCRIPT_URL);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast({ message: '', type: '' }), 3000);
  };

  const handleLogout = () => {
    sessionStorage.removeItem('tpq_user');
    setCurrentUser(null);
    setActiveTab('dashboard');
    showToast('Anda telah keluar dari aplikasi.');
  };

  const loadDatabase = async (targetUrl = appsScriptUrl) => {
    setIsSyncing(true);
    try {
      const localUsers = safeGetLocalStorage('tpq_users', INITIAL_DATA.users);
      const localProgress = safeGetLocalStorage('tpq_progress', INITIAL_DATA.progress);
      const localTargets = safeGetLocalStorage('tpq_targets', INITIAL_DATA.targets);
      const localSavings = safeGetLocalStorage('tpq_savings', INITIAL_DATA.savings);
      const localSettings = safeGetLocalStorage('tpq_settings', INITIAL_DATA.settings);
      setSettings(localSettings);
      if (targetUrl && targetUrl.trim() !== '' && targetUrl !== "ISI_URL_APPS_SCRIPT_ANDA_DISINI") {
        const response = await fetch(`${targetUrl}?action=getAll`);
        if (!response.ok) throw new Error(`HTTP Error: ${response.status}`);
        const contentType = response.headers.get("content-type");
        if (contentType && contentType.includes("text/html")) throw new Error('Akses Ditolak! Pastikan deploy sebagai "Anyone".');
        const payload = await response.json();
        if (payload.status === 'success' && payload.data) {
          const { users: sUsers, progress: sProgress, targets: sTargets, savings: sSavings, settings: sSettings } = payload.data;
          let finalUsers = normalizeUsers((sUsers && sUsers.length > 0) ? sUsers : localUsers);
          let finalProgress = normalizeProgress((sProgress && sProgress.length > 0) ? sProgress : localProgress);
          let finalTargets = normalizeTargets((sTargets && sTargets.length > 0) ? sTargets : localTargets);
          let finalSavings = normalizeSavings((sSavings && sSavings.length > 0) ? sSavings : localSavings);
          let finalSettings = (sSettings && Object.keys(sSettings).length > 0) ? sSettings : localSettings;
          if (finalUsers.filter(u => u.role === 'santri').length === 0) finalUsers = normalizeUsers(localUsers.length > 0 ? localUsers : INITIAL_DATA.users);
          if (finalTargets.length === 0) finalTargets = normalizeTargets(localTargets.length > 0 ? localTargets : INITIAL_DATA.targets);
          setUsers(finalUsers); setProgress(finalProgress); setTargets(finalTargets); setSavings(finalSavings);
          if (finalSettings) setSettings(finalSettings);
          try {
            localStorage.setItem('tpq_users', JSON.stringify(finalUsers));
            localStorage.setItem('tpq_progress', JSON.stringify(finalProgress));
            localStorage.setItem('tpq_targets', JSON.stringify(finalTargets));
            localStorage.setItem('tpq_savings', JSON.stringify(finalSavings));
            localStorage.setItem('tpq_settings', JSON.stringify(finalSettings));
          } catch (e) { console.warn("Penyimpanan terbatas."); }
          if (!isInitializing) showToast('Sinkronisasi berhasil!');
        } else throw new Error(payload.message || 'Format data tidak sesuai.');
      } else {
        let fUsers = normalizeUsers(safeGetLocalStorage('tpq_users', INITIAL_DATA.users));
        if (fUsers.filter(u => u.role === 'santri').length === 0) fUsers = normalizeUsers(INITIAL_DATA.users);
        setUsers(fUsers); setProgress(normalizeProgress(safeGetLocalStorage('tpq_progress', INITIAL_DATA.progress)));
        setTargets(normalizeTargets(safeGetLocalStorage('tpq_targets', INITIAL_DATA.targets)));
        setSavings(normalizeSavings(safeGetLocalStorage('tpq_savings', INITIAL_DATA.savings)));
      }
    } catch (error) {
      console.error("Error Sinkronisasi:", error);
      let fUsers = normalizeUsers(safeGetLocalStorage('tpq_users', INITIAL_DATA.users));
      if (fUsers.filter(u => u.role === 'santri').length === 0) fUsers = normalizeUsers(INITIAL_DATA.users);
      setUsers(fUsers); setProgress(normalizeProgress(safeGetLocalStorage('tpq_progress', INITIAL_DATA.progress)));
      setTargets(normalizeTargets(safeGetLocalStorage('tpq_targets', INITIAL_DATA.targets)));
      setSavings(normalizeSavings(safeGetLocalStorage('tpq_savings', INITIAL_DATA.savings)));
      showToast('Gagal terhubung server, gunakan data lokal.', 'error');
    } finally { setIsSyncing(false); setIsInitializing(false); }
  };

  const updateTable = async (table, updatedData, customUrl = appsScriptUrl) => {
    setIsSyncing(true);
    let normalizedData = updatedData;
    try {
      if (table === 'users') normalizedData = normalizeUsers(updatedData), setUsers(normalizedData);
      else if (table === 'progress') normalizedData = normalizeProgress(updatedData), setProgress(normalizedData);
      else if (table === 'targets') normalizedData = normalizeTargets(updatedData), setTargets(normalizedData);
      else if (table === 'savings') normalizedData = normalizeSavings(updatedData), setSavings(normalizedData);
      else if (table === 'settings') setSettings(normalizedData);
      try { localStorage.setItem(`tpq_${table}`, JSON.stringify(normalizedData)); }
      catch (err) { console.warn("Storage error:", err); }
    } catch (e) {
      console.error("Update error:", e);
      showToast(`Gagal: ${e.message}`, 'error');
      setIsSyncing(false); return false;
    }
    const activeUrl = customUrl || appsScriptUrl;
    try {
      if (activeUrl && activeUrl.trim() !== '' && activeUrl !== "ISI_URL_APPS_SCRIPT_ANDA_DISINI") {
        const res = await fetch(activeUrl, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify({ action: 'updateTable', table, data: normalizedData }) });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = JSON.parse(await res.text());
        if (json.status !== 'success') throw new Error(json.message || 'Gagal simpan.');
        showToast('Data tersimpan & tersinkron!'); return true;
      } else { showToast('Tersimpan secara lokal.'); return true; }
    } catch (err) {
      console.warn("CORS fallback:", err);
      try {
        if (activeUrl) await fetch(activeUrl, { method: 'POST', mode: 'no-cors', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify({ action: 'updateTable', table, data: normalizedData }) });
        showToast('Terkirim ke server (tanpa balasan).'); return true;
      } catch {}
      showToast('Tersimpan secara lokal.'); return true;
    } finally { setIsSyncing(false); }
  };

  const handleLogin = (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const uname = String(fd.get('username')||'').trim();
    const pass = String(fd.get('password')||'').trim();
    const user = users.find(u => String(u.username||'').toLowerCase() === uname.toLowerCase() && String(u.password||'') === pass);
    if (user) {
      setCurrentUser(user); setActiveTab('dashboard');
      try { sessionStorage.setItem('tpq_user', JSON.stringify(user)); } catch {}
      showToast(`Selamat datang, ${user.name}!`);
    } else showToast('Username atau password salah!', 'error');
  };

  useEffect(() => { loadDatabase(); try { const s = sessionStorage.getItem('tpq_user'); if(s) setCurrentUser(JSON.parse(s)); } catch {} }, []);
  useEffect(() => { if(currentUser && users.length>0) { const f = users.find(u=>String(u.id)===String(currentUser.id)); if(f && JSON.stringify(f)!==JSON.stringify(currentUser)) { setCurrentUser(f); sessionStorage.setItem('tpq_user',JSON.stringify(f)); } } }, [users, currentUser]);

  if (isInitializing) return (
    <div className="min-h-screen bg-emerald-50/50 flex flex-col items-center justify-center p-4">
      <RefreshCw className="w-12 h-12 text-emerald-600 animate-spin mb-4" />
      <h2 className="text-xl font-bold text-gray-800">Menyinkronkan Data...</h2>
      <p className="text-gray-500 text-sm mt-2 text-center">Memuat data terbaru dari Google Sheets.</p>
    </div>
  );

  if (!currentUser) return (
    <div className="min-h-screen bg-white flex flex-col">
      <div className="bg-green-600 rounded-b-[3rem] flex flex-col items-center justify-center pt-16 pb-20 px-6">
        <h2 className="font-bold text-white text-xl tracking-wide mb-2">{settings.tpqName}</h2>
        <p className="text-white text-sm">Hai, Selamat Datang!</p>
        <div className="mt-10 w-28 h-28 bg-white rounded-2xl shadow-lg flex items-center justify-center overflow-hidden">
          {settings.logoUrl ? <img src={settings.logoUrl} alt="Logo TPQ" className="w-full h-full object-contain p-2" /> : <Shield className="w-14 h-14 text-green-600" />}
        </div>
      </div>
      <div className="flex-1 px-6 py-8 flex flex-col">
        <div className="bg-white p-6 rounded-2xl shadow-md border border-gray-100 -mt-10">
          <form onSubmit={handleLogin} className="space-y-4">
            <div><label className="block text-xs font-bold mb-1 text-gray-700">Username</label><input name="username" className="w-full p-3 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500" required /></div>
            <div><label className="block text-xs font-bold mb-1 text-gray-700">Kata Sandi</label><input name="password" type="password" className="w-full p-3 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500" required /></div>
            <button type="submit" disabled={isSyncing} className="mt-6 w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-xl text-sm disabled:opacity-50">
              {isSyncing ? 'Memuat...' : 'Login'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 font-sans flex flex-col">
      <Toast message={toast.message} type={toast.type} onClose={() => setToast({ message: '', type: '' })} />
      <header className="bg-emerald-800 text-white p-4 shadow-md flex justify-between items-center sticky top-0 z-10">
        <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setActiveTab('dashboard')}>
          {settings.logoUrl ? <img src={settings.logoUrl} alt="Logo" className="h-10 rounded-md p-1 bg-white" /> : <BookOpen className="w-8 h-8 text-emerald-300" />}
          <div><h1 className="font-bold text-base">{settings.tpqName}</h1><p className="text-[10px] text-emerald-200">Sistem Pengelolaan TPQ</p></div>
        </div>
        <div className="flex items-center space-x-4">
          <div className="text-right text-xs"><p className="font-bold">{currentUser.name}</p><p className="text-[10px] text-emerald-200 uppercase">{getRoleName(currentUser.role)}</p></div>
          <button onClick={() => loadDatabase()} disabled={isSyncing} className="p-2 rounded-xl bg-emerald-950 hover:bg-emerald-900" title="Sinkronisasi">
            <RefreshCw className={`w-4 h-4 ${isSyncing?'animate-spin':''}`} />
          </button>
          <button onClick={handleLogout} className="bg-red-600 hover:bg-red-700 p-2 rounded-xl" title="Keluar"><LogOut className="w-4 h-4" /></button>
        </div>
      </header>
      <main className="flex-1 p-4 md:p-8 max-w-7xl w-full mx-auto">
        {currentUser.role === 'santri' && <SantriView {...{activeTab,setActiveTab,user:currentUser,users,progress,targets,savings,updateTable,showToast,simulatedWeekend,setSimulatedWeekend}} />}
        {currentUser.role === 'guru' && <GuruView {...{activeTab,setActiveTab,user:currentUser,users,setUsers,progress,targets,savings,updateTable,showToast}} />}
        {currentUser.role === 'kepala_tpq' && <KepalaView {...{activeTab,setActiveTab,user:currentUser,users,setUsers,progress,targets,savings,settings,updateTable,showToast,appsScriptUrl,setAppsScriptUrl,loadDatabase,isSyncing}} />}
        {currentUser.role === 'bendahara' && <BendaharaView {...{activeTab,setActiveTab,users,savings,updateTable,showToast,currentUser}} />}
        {currentUser.role === 'admin' && <AdminView {...{activeTab,setActiveTab,users,updateTable,showToast,settings,appsScriptUrl,setAppsScriptUrl,loadDatabase}} />}
      </main>
    </div>
  );
}
