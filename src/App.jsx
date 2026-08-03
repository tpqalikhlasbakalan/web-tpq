import React, { useState, useEffect } from 'react';
import {
  User, Lock, Shield, Book, BookOpen, CheckCircle,
  AlertTriangle, Users, LogOut, CreditCard, Bell, Plus,
  Trash2, Check, X, UserPlus, Info, Edit, ArrowLeft,
  Eye, EyeOff, Award, ClipboardList, Settings, DollarSign,
  CheckSquare, RefreshCw, Database, Copy, Unlock,
  ChevronDown, ChevronUp, TrendingUp, TrendingDown, Search,
  ListChecks
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

// --- FUNGSI PEMBANTU ---
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
      if (Array.isArray(rawCompleted)) {
        completed = rawCompleted.map(String);
      } else if (typeof rawCompleted === 'string' && rawCompleted.trim() !== '') {
        const parsed = JSON.parse(rawCompleted);
        completed = Array.isArray(parsed) ? parsed.map(String) : [];
      }
    } catch (e) { console.error("Error parsing completedTargets", e); }
    let history = [];
    let rawHistory = getProp(u, ['historyBayar', 'historybayar', 'riwayat_bayar', 'history_bayar']);
    try {
      if (Array.isArray(rawHistory)) {
        history = rawHistory.map(String);
      } else if (typeof rawHistory === 'string' && rawHistory.trim() !== '') {
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
      id: idStr,
      username: String(getProp(u, ['username', 'Username', 'user', 'nama_pengguna'], '')).trim(),
      password: String(getProp(u, ['password', 'Password', 'sandi', 'kata_sandi'], '')),
      role: roleStr,
      name: String(getProp(u, ['name', 'Name', 'nama', 'nama_lengkap', 'Nama Lengkap'], '')).trim(),
      guruId: finalGuruId,
      jilid: roleStr === 'santri' ? (finalJilid || 'Jilid 1') : null,
      hasAlarm: rawHasAlarm === true || rawHasAlarm === 'true' || rawHasAlarm === 1,
      lastAccDate: String(rawLastAccDate),
      completedTargets: completed,
      historyBayar: history
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
      id: idStr,
      santriId: String(getProp(p, ['santriId', 'santriid', 'santri_id', 'id_santri'], '')).trim(),
      date: String(getProp(p, ['date', 'Date', 'tanggal'], '')),
      surah: String(getProp(p, ['surah', 'Surah', 'surat', 'halaman'], '')),
      ayat: String(getProp(p, ['ayat', 'Ayat', 'baris'], '')),
      nilai: String(getProp(p, ['nilai', 'Nilai', 'score', 'kualitas'], '')),
      status: String(getProp(p, ['status', 'Status'], '')),
      type: String(getProp(p, ['type', 'Type', 'jenis'], ''))
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
      id: idStr,
      level: String(getProp(t, ['level', 'Level', 'jilid', 'Jilid', 'tingkatan'], '')),
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
      id: idStr,
      santriId: String(getProp(s, ['santriId', 'santriid', 'santri_id', 'id_santri'], '')).trim(),
      date: String(getProp(s, ['date', 'Date', 'tanggal'], '')),
      amount: Number(getProp(s, ['amount', 'Amount', 'nominal', 'jumlah', 'uang'], 0)),
      type: String(getProp(s, ['type', 'Type', 'jenis'], 'setor')),
      description: String(getProp(s, ['description', 'Description', 'keterangan', 'deskripsi'], '')).trim(),
      inputBy: String(getProp(s, ['inputBy', 'inputby', 'petugas'], '')).trim()
    });
  });
  return uniqueSavings;
};
const safeGetLocalStorage = (key, fallback) => {
  try { const item = localStorage.getItem(key); return item ? JSON.parse(item) : fallback; }
  catch (e) { console.error("Error reading localStorage key:", key, e); return fallback; }
};
const getRoleName = (role) => {
  const roles = { 'admin': 'Admin System', 'kepala_tpq': 'Kepala TPQ', 'guru': 'Guru Ngaji', 'bendahara': 'Bendahara', 'santri': 'Santri / Wali' };
  return roles[role] || role;
};
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
  try { return new Date(lastAccDate) < lastSaturday18; }
  catch (e) { return true; }
};

// --- KOMPONEN UI UMUM ---
const Toast = ({ message, type, onClose }) => {
  if (!message) return null;
  const bgColor = type === 'error' ? 'bg-red-500' : 'bg-blue-700';
  return <div className={`fixed top-4 right-4 z-50 ${bgColor} text-white px-5 py-3 rounded-xl shadow-lg text-sm font-semibold animate-fade-in`}>{message}</div>;
};
const BackButton = ({ onClick }) => (
  <button 
    onClick={onClick} 
    className="mb-6 flex items-center text-sm font-bold text-blue-700 hover:text-blue-900 transition-all duration-200 relative z-50 bg-blue-50 px-4 py-2 rounded-xl border border-blue-200 shadow-sm hover:shadow hover:border-blue-300 w-fit active:scale-95"
  >
    <ArrowLeft className="w-4 h-4 mr-1.5" /> 
    Kembali ke Menu Utama
  </button>
);
const MenuGrid = ({ menus, onSelect }) => (
  <div className="grid grid-cols-3 gap-4 animate-fade-in">
    {menus.map(menu => (
      <button 
        key={menu.id} 
        onClick={() => onSelect(menu.id)} 
        className="bg-white p-4 rounded-xl shadow-sm border border-blue-100 hover:shadow-md hover:border-blue-300 flex flex-col items-center justify-center text-center transition-all duration-300 group relative overflow-hidden w-full"
      >
        <div className="absolute top-0 right-0 w-12 h-12 bg-blue-50 rounded-full -mr-6 -mt-6 transition-all group-hover:scale-150 opacity-40"></div>
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-3 transition-transform group-hover:scale-110 shadow-sm ${menu.color}`}>
          <menu.icon className="w-6 h-6" />
        </div>
        <h3 className="font-semibold text-gray-800 text-xs group-hover:text-blue-800">{menu.label}</h3>
      </button>
    ))}
  </div>
);

// --- KOMPONEN TABUNGAN ---
function SavingsInputView({ users, savings, updateTable, showToast, recorderId }) {
  const [selectedSantri, setSelectedSantri] = useState(null);
  const santriList = users.filter(u => u.role === 'santri');
  const hitungSaldoAktual = (idSantri) => {
    return savings
      .filter(item => String(item.santriId) === String(idSantri))
      .reduce((total, trx) => {
        return trx.type === 'setor' ? total + trx.amount : total - trx.amount;
      }, 0);
  };
  const pilihSantri = (santri) => {
    const saldoBenar = hitungSaldoAktual(santri.id);
    setSelectedSantri({...santri, saldo_awal: saldoBenar});
  };
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedSantri || !e.target.amount.value) {
      showToast('Pilih santri & masukkan nominal!', 'error');
      return;
    }
    const jenis = e.target.type.value;
    const nominal = parseInt(e.target.amount.value);
    const tanggal = e.target.date.value;
    const keterangan = e.target.description.value.trim() || (jenis === 'setor' ? 'Setoran' : 'Penarikan');
    if (nominal <= 0) return showToast('Nominal tidak valid!', 'error');
    if (jenis === 'tarik' && hitungSaldoAktual(selectedSantri.id) < nominal) {
      return showToast('Saldo tidak cukup!', 'error');
    }
    const saldoBaru = jenis === 'setor' 
      ? hitungSaldoAktual(selectedSantri.id) + nominal 
      : hitungSaldoAktual(selectedSantri.id) - nominal;
    const transaksiBaru = {
      id: Date.now().toString(),
      santriId: selectedSantri.id,
      date: tanggal,
      amount: nominal,
      type: jenis,
      description: keterangan,
      inputBy: recorderId
    };
    await updateTable('savings', [transaksiBaru, ...savings]);
    await updateTable('users', users.map(u => 
      u.id === selectedSantri.id ? {...u, saldo_awal: saldoBaru} : u
    ));
    setSelectedSantri({...selectedSantri, saldo_awal: saldoBaru});
    showToast('Tersimpan! Saldo sudah disinkronkan.');
    e.target.reset();
  };
  const hapusTransaksi = async (dataTrx) => {
    if(!confirm('Yakin hapus? Saldo akan dikembalikan otomatis!')) return;
    const saldoKoreksi = dataTrx.type === 'setor' 
      ? hitungSaldoAktual(selectedSantri.id) - dataTrx.amount 
      : hitungSaldoAktual(selectedSantri.id) + dataTrx.amount;
    if (saldoKoreksi < 0) return showToast('Tidak bisa dihapus (saldo akan minus)!', 'error');
    await updateTable('savings', savings.filter(x => x.id !== dataTrx.id));
    await updateTable('users', users.map(u => 
      u.id === selectedSantri.id ? {...u, saldo_awal: saldoKoreksi} : u
    ));
    setSelectedSantri({...selectedSantri, saldo_awal: saldoKoreksi});
    showToast('Dihapus! Saldo sudah diperbaiki.');
  };
  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-blue-100">
        <h3 className="text-lg font-bold mb-6 flex items-center text-blue-800">
          <DollarSign className="mr-2"/> Input & Riwayat Tabungan (Tersinkron)
        </h3>
        {santriList.length === 0 ? (
          <div className="p-6 bg-blue-50 border border-blue-200 rounded-xl">
            <p className="text-blue-900 text-sm">Belum ada data santri.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
              <h4 className="text-xs font-bold text-blue-800 mb-3 border-b pb-2 uppercase">Daftar Santri</h4>
              <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
                {santriList.map(s => {
                  const saldoBenar = hitungSaldoAktual(s.id);
                  return (
                    <button
                      key={s.id}
                      onClick={() => pilihSantri(s)}
                      className={`w-full p-3 rounded-xl text-left text-sm border transition-all ${
                        selectedSantri?.id === s.id
                          ? 'bg-blue-700 text-white font-bold border-blue-700 shadow-md'
                          : 'bg-white text-gray-700 border-blue-100 hover:bg-blue-50 hover:border-blue-200'
                      }`}
                    >
                      <p className="font-semibold">{s.name} {s.jilid ? `(${s.jilid})` : ''}</p>
                      <p className="mt-0.5 opacity-80 text-xs">
                        Saldo: Rp {saldoBenar.toLocaleString('id-ID')}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="md:col-span-2 space-y-6">
              {!selectedSantri ? (
                <div className="p-10 text-center text-gray-400 text-sm italic bg-blue-50 border border-dashed border-blue-200 rounded-xl">
                  Klik nama santri untuk melihat saldo & riwayat
                </div>
              ) : (
                <>
                  <div className="bg-blue-50 p-4 rounded-xl border border-blue-200">
                    <p className="text-[11px] text-blue-700 font-bold uppercase">Santri Terpilih</p>
                    <h4 className="font-extrabold text-lg mt-0.5">{selectedSantri.name}</h4>
                    <p className="text-sm text-gray-600 mt-1">
                      Saldo Aktual: <strong>Rp {hitungSaldoAktual(selectedSantri.id).toLocaleString('id-ID')}</strong>
                    </p>
                  </div>
                  <form onSubmit={handleSubmit} className="space-y-4 bg-blue-50 p-5 rounded-2xl border border-blue-100">
                    <h5 className="font-bold text-sm text-blue-800 border-b pb-2">Input Mutasi Baru</h5>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold mb-1 text-gray-700">Tanggal</label>
                        <input type="date" name="date" defaultValue={new Date().toISOString().slice(0,10)} required className="w-full p-2.5 border border-blue-200 rounded-xl text-xs" />
                      </div>
                      <div>
                        <label className="block text-xs font-bold mb-1 text-gray-700">Jenis</label>
                        <select name="type" className="w-full p-2.5 border border-blue-200 rounded-xl text-xs font-bold">
                          <option value="setor">Setoran</option>
                          <option value="tarik">Penarikan</option>
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-bold mb-1 text-gray-700">Nominal (Rp)</label>
                      <input type="number" name="amount" min="1000" placeholder="Contoh: 10000" required className="w-full p-2.5 border border-blue-200 rounded-xl text-xs" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold mb-1 text-gray-700">Keterangan</label>
                      <input type="text" name="description" placeholder="Opsional" className="w-full p-2.5 border border-blue-200 rounded-xl text-xs" />
                    </div>
                    <button type="submit" className="w-full bg-blue-700 hover:bg-blue-800 text-white font-bold py-3 rounded-xl text-xs shadow">
                      Simpan & Sinkronkan Saldo
                    </button>
                  </form>
                  <div className="border-t border-blue-100 pt-6">
                    <h5 className="text-sm font-bold mb-4 text-gray-800">Riwayat Transaksi</h5>
                    {(() => {
                      const riwayat = savings.filter(i => String(i.santriId) === String(selectedSantri.id));
                      if (riwayat.length === 0) return <p className="text-sm text-gray-500 italic">Belum ada riwayat.</p>;
                      return (
                        <div className="overflow-x-auto">
                          <table className="w-full text-xs">
                            <thead className="bg-blue-50 font-bold text-blue-800 uppercase">
                              <tr>
                                <th className="p-2 text-left">Tanggal</th>
                                <th className="p-2 text-left">Jenis</th>
                                <th className="p-2 text-left">Keterangan</th>
                                <th className="p-2 text-right">Nominal</th>
                                <th className="p-2 text-center">Aksi</th>
                              </tr>
                            </thead>
                            <tbody>
                              {[...riwayat].sort((a,b) => new Date(b.date) - new Date(a.date)).map((r,i) => (
                                <tr key={r.id||i} className="border-b border-blue-50 hover:bg-blue-50">
                                  <td className="p-2">{r.date}</td>
                                  <td className="p-2">
                                    <span className={`px-2 py-0.5 rounded-full font-bold ${r.type==='setor'?'bg-blue-100 text-blue-800':'bg-red-100 text-red-700'}`}>
                                      {r.type==='setor'?'Setoran':'Penarikan'}
                                    </span>
                                  </td>
                                  <td className="p-2">{r.description||'-'}</td>
                                  <td className="p-2 text-right font-bold">Rp {Number(r.amount).toLocaleString('id-ID')}</td>
                                  <td className="p-2 text-center">
                                    <button onClick={() => hapusTransaksi(r)} className="text-red-500 hover:text-red-700">🗑️</button>
                                  </td>
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

// --- KOMPONEN SANTRI ---
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
    { 
      id: 'persetujuan_wali', 
      label: progresMenungguAcc.length > 0 
        ? `🔴 Persetujuan Wali (${progresMenungguAcc.length})` 
        : '✍️ Persetujuan Wali Santri', 
      icon: CheckSquare, 
      color: progresMenungguAcc.length > 0 ? 'bg-red-100 text-red-700 animate-pulse' : 'bg-blue-50 text-blue-700', 
      desc: 'Setujui setoran guru agar proses mengaji bisa dilanjutkan.' 
    },
    { id: 'progres_mengaji', label: 'Progres Mengaji Saya', icon: BookOpen, color: 'bg-blue-50 text-blue-700', desc: 'Riwayat semua catatan setoran Anda (belum & sudah disetujui).' },
    { id: 'riwayat_pembayaran', label: 'Riwayat Pembayaran', icon: CreditCard, color: 'bg-blue-50 text-blue-700', desc: 'Lihat status tagihan dan riwayat pembayaran iuran bulanan Anda.' },
    { id: 'riwayat_tabungan', label: 'Riwayat Tabungan', icon: DollarSign, color: 'bg-blue-50 text-blue-700', desc: 'Lihat riwayat setoran, penarikan, dan saldo tabungan Anda.' }
  ];

  if (activeTab === 'dashboard') return (
    <div className="space-y-6 animate-fade-in">
      <div className="bg-blue-700 rounded-3xl p-6 text-white shadow-lg relative overflow-hidden">
        <div className="absolute right-0 bottom-0 opacity-10 transform translate-x-6 translate-y-6"><BookOpen className="w-56 h-56" /></div>
        <p className="text-xs font-bold text-blue-200 uppercase tracking-widest">Informasi Santri</p>
        <h2 className="text-2xl font-black mt-1">{user.name}</h2>
        <div className="grid grid-cols-2 gap-4 mt-6 border-t border-blue-500 pt-4 text-xs font-semibold">
          <div><p className="text-blue-200">Tingkatan Saat Ini</p><p className="text-base font-bold mt-0.5">{user.jilid || 'Jilid 1'}</p></div>
          <div><p className="text-blue-200">Saldo Tabungan</p><p className="text-base font-bold mt-0.5">Rp {currentBalance.toLocaleString('id-ID')}</p></div>
          <div><p className="text-blue-200">Target Belum Selesai</p><p className="text-base font-bold mt-0.5">{myTargets.filter(t => !user.completedTargets.includes(t.id)).length}</p></div>
          <div><p className="text-blue-200">Total Setoran</p><p className="text-base font-bold mt-0.5">{semuaProgresSaya.length} Kali</p></div>
        </div>
        {activeWeekendNotification && (
          <div className="mt-4 bg-yellow-500/20 border border-yellow-400/40 rounded-xl p-3 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-yellow-300 flex-shrink-0" />
            <p className="text-xs">Ingat: Setoran hari Jumat–Minggu perlu disetujui wali sebelum Senin pagi.</p>
          </div>
        )}
      </div>
      <MenuGrid menus={menus} onSelect={setActiveTab} />
    </div>
  );

  if (activeTab === 'persetujuan_wali') return (
    <div className="space-y-6 animate-fade-in">
      <BackButton onClick={() => setActiveTab('dashboard')} />
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-blue-100">
        <h3 className="text-lg font-bold mb-4 text-blue-800 flex items-center gap-2">
          <CheckSquare className="w-5 h-5" /> Menunggu Persetujuan Wali
        </h3>
        {progresMenungguAcc.length === 0 ? (
          <div className="p-6 bg-blue-50 border border-blue-200 rounded-xl text-center">
            <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-2" />
            <p className="text-sm text-gray-600">Semua setoran sudah disetujui. Terus semangat mengajinya!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {progresMenungguAcc.map(p => (
              <div key={p.id} className="p-4 border border-blue-100 rounded-xl bg-blue-50/50">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-semibold text-sm">{p.surah} ayat {p.ayat}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{p.date} • Nilai: {p.nilai}</p>
                  </div>
                  <div className="flex gap-2">
                    <button className="p-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition">
                      <Check className="w-4 h-4" />
                    </button>
                    <button className="p-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
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
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-blue-100">
        <h3 className="text-lg font-bold mb-4 text-blue-800 flex items-center gap-2">
          <BookOpen className="w-5 h-5" /> Riwayat Progres Mengaji
        </h3>
        {semuaProgresSaya.length === 0 ? (
          <p className="text-sm text-gray-500 italic">Belum ada catatan setoran.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-blue-50 font-bold text-blue-800 uppercase">
                <tr>
                  <th className="p-2 text-left">Tanggal</th>
                  <th className="p-2 text-left">Surah</th>
                  <th className="p-2 text-left">Ayat</th>
                  <th className="p-2 text-left">Nilai</th>
                  <th className="p-2 text-left">Status</th>
                </tr>
              </thead>
              <tbody>
                {[...semuaProgresSaya].sort((a,b) => new Date(b.date) - new Date(a.date)).map((p,i) => (
                  <tr key={p.id||i} className="border-b border-blue-50 hover:bg-blue-50">
                    <td className="p-2">{p.date}</td>
                    <td className="p-2">{p.surah}</td>
                    <td className="p-2">{p.ayat}</td>
                    <td className="p-2">{p.nilai}</td>
                    <td className="p-2">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                        p.status === 'acc_guru' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                      }`}>
                        {p.status === 'acc_guru' ? 'Disetujui' : 'Menunggu'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );

  if (activeTab === 'riwayat_pembayaran') return (
    <div className="space-y-6 animate-fade-in">
      <BackButton onClick={() => setActiveTab('dashboard')} />
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-blue-100">
        <h3 className="text-lg font-bold mb-4 text-blue-800 flex items-center gap-2">
          <CreditCard className="w-5 h-5" /> Riwayat Pembayaran Iuran
        </h3>
        {user.historyBayar.length === 0 ? (
          <p className="text-sm text-gray-500 italic">Belum ada riwayat pembayaran.</p>
        ) : (
          <div className="space-y-2">
            {user.historyBayar.sort().reverse().map((tgl,i) => (
              <div key={i} className="p-3 border border-blue-100 rounded-xl flex items-center gap-3">
                <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
                <p className="text-sm">Sudah lunas pada: <strong>{tgl}</strong></p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  if (activeTab === 'riwayat_tabungan') return (
    <div className="space-y-6 animate-fade-in">
      <BackButton onClick={() => setActiveTab('dashboard')} />
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-blue-100">
        <h3 className="text-lg font-bold mb-4 text-blue-800 flex items-center gap-2">
          <DollarSign className="w-5 h-5" /> Riwayat Tabungan
        </h3>
        <div className="mb-4 p-4 bg-blue-50 rounded-xl border border-blue-200">
          <p className="text-xs text-blue-700 font-bold uppercase">Saldo Saat Ini</p>
          <p className="text-xl font-bold mt-1">Rp {currentBalance.toLocaleString('id-ID')}</p>
        </div>
        {mySavings.length === 0 ? (
          <p className="text-sm text-gray-500 italic">Belum ada riwayat tabungan.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-blue-50 font-bold text-blue-800 uppercase">
                <tr>
                  <th className="p-2 text-left">Tanggal</th>
                  <th className="p-2 text-left">Jenis</th>
                  <th className="p-2 text-left">Keterangan</th>
                  <th className="p-2 text-right">Nominal</th>
                </tr>
              </thead>
              <tbody>
                {[...mySavings].sort((a,b) => new Date(b.date) - new Date(a.date)).map((s,i) => (
                  <tr key={s.id||i} className="border-b border-blue-50 hover:bg-blue-50">
                    <td className="p-2">{s.date}</td>
                    <td className="p-2">
                      <span className={`px-2 py-0.5 rounded-full font-bold ${
                        s.type==='setor'?'bg-blue-100 text-blue-800':'bg-red-100 text-red-700'
                      }`}>
                        {s.type==='setor'?'Setoran':'Penarikan'}
                      </span>
                    </td>
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

// --- KOMPONEN GURU ---
function GuruView({ activeTab, setActiveTab, user, users, setUsers, progress, targets, savings, settings, updateTable, showToast, simulatedWeekend, setSimulatedWeekend }) {
  const santriBimbingan = users.filter(u => u.role === 'santri' && String(u.guruId) === String(user.id));
  const semuaProgres = progress.filter(p => santriBimbingan.some(s => s.id === p.santriId));
  const menungguAcc = semuaProgres.filter(p => p.status === 'belum_disetujui');
  const daftarTarget = targets;

  const menus = [
    { id: 'daftar_santri', label: `Daftar Santri (${santriBimbingan.length})`, icon: Users, color: 'bg-blue-50 text-blue-700', desc: 'Kelola data santri yang Anda bimbing.' },
    { id: 'input_progres', label: 'Input Setoran Mengaji', icon: BookOpen, color: 'bg-blue-50 text-blue-700', desc: 'Catat bacaan, hafalan, dan nilai santri.' },
    { id: 'persetujuan', label: menungguAcc.length > 0 ? `🔴 Menunggu Acc (${menungguAcc.length})` : 'Persetujuan Setoran', icon: CheckSquare, color: menungguAcc.length > 0 ? 'bg-red-100 text-red-700 animate-pulse' : 'bg-blue-50 text-blue-700', desc: 'Setujui atau perbaiki catatan santri.' },
    { id: 'daftar_target', label: 'Target Capaian Mengaji', icon: ClipboardList, color: 'bg-blue-50 text-blue-700', desc: 'Lihat target sesuai tingkatan jilid.' }
  ];

  const setujuiProgres = async (item) => {
    const perbarui = progress.map(p => p.id === item.id ? { ...p, status: 'acc_guru' } : p);
    await updateTable('progress', perbarui);
    showToast('Setoran berhasil disetujui!');
  };

  if (activeTab === 'dashboard') return (
    <div className="space-y-6 animate-fade-in">
      <div className="bg-blue-700 rounded-3xl p-6 text-white shadow-lg">
        <p className="text-xs font-bold text-blue-200 uppercase tracking-widest">Dashboard Guru</p>
        <h2 className="text-2xl font-black mt-1">{user.name}</h2>
        <div className="grid grid-cols-2 gap-4 mt-6 border-t border-blue-500 pt-4 text-xs font-semibold">
          <div><p className="text-blue-200">Jumlah Santri</p><p className="text-base font-bold mt-0.5">{santriBimbingan.length} Orang</p></div>
          <div><p className="text-blue-200">Menunggu Acc</p><p className="text-base font-bold mt-0.5">{menungguAcc.length} Catatan</p></div>
        </div>
      </div>
      <MenuGrid menus={menus} onSelect={setActiveTab} />
    </div>
  );

  if (activeTab === 'daftar_santri') return (
    <div className="space-y-6 animate-fade-in">
      <BackButton onClick={() => setActiveTab('dashboard')} />
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-blue-100">
        <h3 className="text-lg font-bold mb-4 text-blue-800 flex items-center gap-2"><Users className="w-5 h-5" /> Santri Bimbingan</h3>
        {santriBimbingan.length === 0 ? <p className="text-sm text-gray-500 italic">Belum ada santri yang ditugaskan.</p> : (
          <div className="space-y-2">
            {santriBimbingan.map(s => (
              <div key={s.id} className="p-3 border border-blue-100 rounded-xl flex justify-between items-center hover:bg-blue-50">
                <div>
                  <p className="font-semibold text-sm">{s.name}</p>
                  <p className="text-xs text-gray-500">{s.jilid} • {s.username}</p>
                </div>
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
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-blue-100">
        <h3 className="text-lg font-bold mb-4 text-blue-800 flex items-center gap-2"><BookOpen className="w-5 h-5" /> Catat Setoran</h3>
        {santriBimbingan.length === 0 ? <p className="text-sm text-gray-500 italic">Tidak ada santri untuk dicatat.</p> : (
          <form onSubmit={async (e) => {
            e.preventDefault();
            const dataBaru = {
              id: Date.now().toString(),
              santriId: e.target.santri.value,
              date: e.target.tanggal.value,
              surah: e.target.surah.value,
              ayat: e.target.ayat.value,
              nilai: e.target.nilai.value,
              status: 'belum_disetujui',
              type: 'harian'
            };
            await updateTable('progress', [dataBaru, ...progress]);
            showToast('Setoran tersimpan!');
            e.target.reset();
          }} className="space-y-4">
            <div><label className="block text-xs font-bold mb-1 text-gray-700">Nama Santri</label>
              <select name="santri" className="w-full p-2.5 border border-blue-200 rounded-xl text-xs" required>
                {santriBimbingan.map(s => <option key={s.id} value={s.id}>{s.name} — {s.jilid}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><label className="block text-xs font-bold mb-1 text-gray-700">Tanggal</label>
                <input type="date" name="tanggal" defaultValue={new Date().toISOString().slice(0,10)} required className="w-full p-2.5 border border-blue-200 rounded-xl text-xs" /></div>
              <div><label className="block text-xs font-bold mb-1 text-gray-700">Nilai</label>
                <select name="nilai" className="w-full p-2.5 border border-blue-200 rounded-xl text-xs" required>
                  <option>A (Sangat Lancar)</option><option>B (Lancar)</option><option>C (Perlu Latihan)</option><option>D (Belum Lancar)</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><label className="block text-xs font-bold mb-1 text-gray-700">Surah / Bagian</label>
                <input type="text" name="surah" placeholder="Contoh: Al-Fatihah" required className="w-full p-2.5 border border-blue-200 rounded-xl text-xs" /></div>
              <div><label className="block text-xs font-bold mb-1 text-gray-700">Ayat / Halaman</label>
                <input type="text" name="ayat" placeholder="Contoh: 1-7" required className="w-full p-2.5 border border-blue-200 rounded-xl text-xs" /></div>
            </div>
            <button type="submit" className="w-full bg-blue-700 hover:bg-blue-800 text-white font-bold
                        py-3 rounded-xl text-xs">Simpan Catatan</button>
          </form>
        )}
      </div>
    </div>
  );

  if (activeTab === 'persetujuan') return (
    <div className="space-y-6 animate-fade-in">
      <BackButton onClick={() => setActiveTab('dashboard')} />
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-blue-100">
        <h3 className="text-lg font-bold mb-4 text-blue-800 flex items-center gap-2"><CheckSquare className="w-5 h-5" /> Persetujuan Setoran</h3>
        {menungguAcc.length === 0 ? <p className="text-sm text-gray-500 italic">Semua sudah disetujui.</p> : (
          <div className="space-y-3">
            {menungguAcc.map(p => {
              const s = santriBimbingan.find(x => x.id === p.santriId);
              return <div key={p.id} className="p-4 border border-blue-100 rounded-xl bg-blue-50/50 flex justify-between items-center">
                <div>
                  <p className="font-semibold text-sm">{s?.name || 'Santri Tidak Diketahui'}</p>
                  <p className="text-xs text-gray-600">{p.surah} ayat {p.ayat} • Nilai: {p.nilai} • {p.date}</p>
                </div>
                <button onClick={() => setujuiProgres(p)} className="px-3 py-1.5 bg-green-600 text-white text-xs font-bold rounded-xl hover:bg-green-700">Setujui</button>
              </div>;
            })}
          </div>
        )}
      </div>
    </div>
  );

  if (activeTab === 'daftar_target') return (
    <div className="space-y-6 animate-fade-in">
      <BackButton onClick={() => setActiveTab('dashboard')} />
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-blue-100">
        <h3 className="text-lg font-bold mb-4 text-blue-800 flex items-center gap-2"><ClipboardList className="w-5 h-5" /> Target Capaian Mengaji</h3>
        {JILID_LEVELS.map(lvl => {
          const trg = daftarTarget.filter(t => t.level === lvl);
          return <div key={lvl} className="mb-4">
            <p className="font-bold text-sm text-blue-800 mb-2">{lvl}</p>
            {trg.length === 0 ? <p className="text-xs text-gray-400">Belum ada target.</p> : (
              <ul className="space-y-1.5">
                {trg.map((t,i) => <li key={t.id||i} className="text-xs p-2 bg-blue-50 rounded-lg border border-blue-100">{i+1}. {t.description}</li>)}
              </ul>
            )}
          </div>;
        })}
      </div>
    </div>
  );
}

// --- KOMPONEN KEPALA TPQ ---
function KepalaView({ activeTab, setActiveTab, user, users, setUsers, progress, targets, savings, settings, updateTable, showToast, appsScriptUrl, setAppsScriptUrl, loadDatabase }) {
  const menus = [
    { id: 'ringkasan', label: 'Ringkasan Keseluruhan', icon: TrendingUp, color: 'bg-blue-50 text-blue-700', desc: 'Statistik santri, progres & keuangan.' },
    { id: 'kelola_pengguna', label: 'Kelola Pengguna', icon: Users, color: 'bg-blue-50 text-blue-700', desc: 'Tambah, ubah, hapus akun sistem.' },
    { id: 'pengaturan', label: 'Pengaturan Sistem', icon: Settings, color: 'bg-blue-50 text-blue-700', desc: 'Nama lembaga, logo, koneksi Google Sheet.' }
  ];

  if (activeTab === 'dashboard') return (
    <div className="space-y-6 animate-fade-in">
      <div className="bg-blue-700 rounded-3xl p-6 text-white shadow-lg">
        <p className="text-xs font-bold text-blue-200 uppercase tracking-widest">Kepala TPQ</p>
        <h2 className="text-2xl font-black mt-1">{user.name}</h2>
        <div className="grid grid-cols-3 gap-4 mt-6 border-t border-blue-500 pt-4 text-xs font-semibold">
          <div><p className="text-blue-200">Total Santri</p><p className="text-base font-bold mt-0.5">{users.filter(u => u.role==='santri').length}</p></div>
          <div><p className="text-blue-200">Total Guru</p><p className="text-base font-bold mt-0.5">{users.filter(u => u.role==='guru').length}</p></div>
          <div><p className="text-blue-200">Total Progres</p><p className="text-base font-bold mt-0.5">{progress.length}</p></div>
        </div>
      </div>
      <MenuGrid menus={menus} onSelect={setActiveTab} />
    </div>
  );

  if (activeTab === 'ringkasan') return (
    <div className="space-y-6 animate-fade-in">
      <BackButton onClick={() => setActiveTab('dashboard')} />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-blue-100 shadow-sm"><Users className="w-6 h-6 text-blue-700 mb-2"/><p className="text-xs text-gray-500">Jumlah Santri</p><p className="text-xl font-bold text-blue-800">{users.filter(u=>u.role==='santri').length}</p></div>
        <div className="bg-white p-5 rounded-2xl border border-blue-100 shadow-sm"><BookOpen className="w-6 h-6 text-blue-700 mb-2"/><p className="text-xs text-gray-500">Catatan Mengaji</p><p className="text-xl font-bold text-blue-800">{progress.length}</p></div>
        <div className="bg-white p-5 rounded-2xl border border-blue-100 shadow-sm"><DollarSign className="w-6 h-6 text-blue-700 mb-2"/><p className="text-xs text-gray-500">Total Tabungan</p><p className="text-xl font-bold text-blue-800">Rp {savings.reduce((a,b)=>a+(b.type==='setor'?b.amount:-b.amount),0).toLocaleString('id-ID')}</p></div>
      </div>
    </div>
  );

  if (activeTab === 'kelola_pengguna') return (
    <div className="space-y-6 animate-fade-in">
      <BackButton onClick={() => setActiveTab('dashboard')} />
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-blue-100">
        <h3 className="text-lg font-bold mb-4 text-blue-800 flex items-center gap-2"><Users className="w-5 h-5" /> Daftar Pengguna</h3>
        <div className="space-y-2">
          {users.map(u => <div key={u.id} className="p-3 border border-blue-100 rounded-xl flex justify-between items-center">
            <div><p className="font-semibold text-sm">{u.name}</p><p className="text-xs text-gray-500">@{u.username} • {getRoleName(u.role)}</p></div>
          </div>)}
        </div>
      </div>
    </div>
  );

  if (activeTab === 'pengaturan') return (
    <div className="space-y-6 animate-fade-in">
      <BackButton onClick={() => setActiveTab('dashboard')} />
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-blue-100">
        <h3 className="text-lg font-bold mb-4 text-blue-800 flex items-center gap-2"><Settings className="w-5 h-5" /> Pengaturan</h3>
        <div className="space-y-4">
          <div><label className="block text-xs font-bold mb-1 text-gray-700">Nama Lembaga</label>
            <input type="text" value={settings.tpqName} className="w-full p-2.5 border border-blue-200 rounded-xl text-xs bg-blue-50" readOnly /></div>
          <div><label className="block text-xs font-bold mb-1 text-gray-700">URL Apps Script</label>
            <input type="text" value={appsScriptUrl} onChange={(e)=>setAppsScriptUrl(e.target.value)} className="w-full p-2.5 border border-blue-200 rounded-xl text-xs" /></div>
          <button onClick={()=>{localStorage.setItem('tpq_apps_script_url',appsScriptUrl); loadDatabase(); showToast('Pengaturan tersimpan & disinkronkan!');}} className="w-full bg-blue-700 hover:bg-blue-800 text-white font-bold py-3 rounded-xl text-xs">Simpan & Sinkronkan</button>
        </div>
      </div>
    </div>
  );
}

// --- KOMPONEN BENDAHARA ---
function BendaharaView({ activeTab, setActiveTab, users, savings, settings, updateTable, showToast, currentUser }) {
  const menus = [
    { id: 'input_tabungan', label: 'Input & Riwayat Tabungan', icon: DollarSign, color: 'bg-blue-50 text-blue-700', desc: 'Setoran, penarikan & saldo santri.' },
    { id: 'laporan', label: 'Laporan Keuangan', icon: ClipboardList, color: 'bg-blue-50 text-blue-700', desc: 'Rekapitulasi seluruh transaksi.' }
  ];

  if (activeTab === 'dashboard') return (
    <div className="space-y-6 animate-fade-in">
      <div className="bg-blue-700 rounded-3xl p-6 text-white shadow-lg">
        <p className="text-xs font-bold text-blue-200 uppercase tracking-widest">Bendahara TPQ</p>
        <h2 className="text-2xl font-black mt-1">{currentUser.name}</h2>
        <div className="mt-6 border-t border-blue-500 pt-4">
          <p className="text-blue-200 text-xs">Total Saldo Tabungan Keseluruhan</p>
          <p className="text-xl font-bold mt-1">Rp {savings.reduce((a,b)=>a+(b.type==='setor'?b.amount:-b.amount),0).toLocaleString('id-ID')}</p>
        </div>
      </div>
      <MenuGrid menus={menus} onSelect={setActiveTab} />
    </div>
  );

  if (activeTab === 'input_tabungan') return (
    <div className="animate-fade-in"><BackButton onClick={() => setActiveTab('dashboard')} /><SavingsInputView users={users} savings={savings} updateTable={updateTable} showToast={showToast} recorderId={currentUser.id} /></div>
  );

  if (activeTab === 'laporan') return (
    <div className="space-y-6 animate-fade-in">
      <BackButton onClick={() => setActiveTab('dashboard')} />
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-blue-100">
        <h3 className="text-lg font-bold mb-4 text-blue-800 flex items-center gap-2"><ClipboardList className="w-5 h-5" /> Rekapitulasi Keuangan</h3>
        <div className="space-y-2 text-xs">
          <div className="flex justify-between p-2 bg-blue-50 rounded-lg"><span>Total Setoran</span><strong>Rp {savings.filter(s=>s.type==='setor').reduce((a,b)=>a+b.amount,0).toLocaleString('id-ID')}</strong></div>
          <div className="flex justify-between p-2 bg-red-50 rounded-lg"><span>Total Penarikan</span><strong>Rp {savings.filter(s=>s.type==='tarik').reduce((a,b)=>a+b.amount,0).toLocaleString('id-ID')}</strong></div>
          <div className="flex justify-between p-2 bg-blue-100 rounded-lg font-bold"><span>Saldo Akhir</span><strong>Rp {savings.reduce((a,b)=>a+(b.type==='setor'?b.amount:-b.amount),0).toLocaleString('id-ID')}</strong></div>
        </div>
      </div>
    </div>
  );
}

// --- KOMPONEN ADMIN ---
function AdminView({ activeTab, setActiveTab, users, updateTable, showToast, settings, appsScriptUrl, setAppsScriptUrl, loadDatabase }) {
  const menus = [
    { id: 'kelola_akun', label: 'Kelola Semua Akun', icon: Users, color: 'bg-blue-50 text-blue-700', desc: 'Penuh akses tambah, ubah, hapus pengguna.' },
    { id: 'sistem', label: 'Pengaturan Sistem', icon: Settings, color: 'bg-blue-50 text-blue-700', desc: 'Konfigurasi utama aplikasi.' }
  ];

  if (activeTab === 'dashboard') return (
    <div className="space-y-6 animate-fade-in">
      <div className="bg-blue-700 rounded-3xl p-6 text-white shadow-lg">
        <p className="text-xs font-bold text-blue-200 uppercase tracking-widest">Administrator Sistem</p>
        <h2 className="text-2xl font-black mt-1">Panel Kontrol Utama</h2>
        <p className="text-xs mt-2 text-blue-200">Pengelolaan penuh data & sistem aplikasi.</p>
      </div>
      <MenuGrid menus={menus} onSelect={setActiveTab} />
    </div>
  );

  if (activeTab === 'kelola_akun') return (
    <div className="space-y-6 animate-fade-in">
      <BackButton onClick={() => setActiveTab('dashboard')} />
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-blue-100">
        <h3 className="text-lg font-bold mb-4 text-blue-800 flex items-center gap-2"><Users className="w-5 h-5" /> Daftar Seluruh Pengguna</h3>
        <div className="space-y-2">
          {users.map(u => <div key={u.id} className="p-3 border border-blue-100 rounded-xl flex justify-between items-center">
            <div><p className="font-semibold text-sm">{u.name}</p><p className="text-xs text-gray-500">@{u.username} • {getRoleName(u.role)}</p></div>
          </div>)}
        </div>
      </div>
    </div>
  );

  if (activeTab === 'sistem') return (
    <div className="space-y-6 animate-fade-in">
      <BackButton onClick={() => setActiveTab('dashboard')} />
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-blue-100">
        <h3 className="text-lg font-bold mb-4 text-blue-800 flex items-center gap-2"><Settings className="w-5 h-5" /> Pengaturan Sistem</h3>
        <div className="space-y-4">
          <div><label className="block text-xs font-bold mb-1 text-gray-700">Nama Aplikasi / Lembaga</label>
            <input type="text" value={settings.tpqName} className="w-full p-2.5 border border-blue-200 rounded-xl text-xs bg-blue-50" readOnly /></div>
          <div><label className="block text-xs font-bold mb-1 text-gray-700">Koneksi Google Apps Script</label>
            <input type="text" value={appsScriptUrl} onChange={(e)=>setAppsScriptUrl(e.target.value)} className="w-full p-2.5 border border-blue-200 rounded-xl text-xs" /></div>
          <button onClick={()=>{localStorage.setItem('tpq_apps_script_url',appsScriptUrl); loadDatabase(); showToast('Sistem diperbarui & disinkronkan!');}} className="w-full bg-blue-700 hover:bg-blue-800 text-white font-bold py-3 rounded-xl text-xs">Perbarui & Sinkronkan</button>
        </div>
      </div>
    </div>
  );
}

// --- KOMPONEN UTAMA & LOGIN ---
export default function TPQApp() {
  const [toast, setToast] = useState({ message: '', type: 'success' });
  const [loggedUser, setLoggedUser] = useState(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [users, setUsers] = useState([]);
  const [progress, setProgress] = useState([]);
  const [targets, setTargets] = useState([]);
  const [savings, setSavings] = useState([]);
  const [settings, setSettings] = useState(INITIAL_DATA.settings);
  const [appsScriptUrl, setAppsScriptUrl] = useState(() => localStorage.getItem('tpq_apps_script_url') || HARDCODED_APPS_SCRIPT_URL);
  const [simulatedWeekend, setSimulatedWeekend] = useState(false);
  const [loading, setLoading] = useState(false);

  const showToast = (msg, type='success') => {
    setToast({ message: msg, type });
    setTimeout(() => setToast({ message: '', type: 'success' }), 3000);
  };

  const loadDatabase = async () => {
    setLoading(true);
    try {
      const res = await fetch(appsScriptUrl);
      const data = await res.json();
      if (data.users) setUsers(normalizeUsers(data.users));
      if (data.progress) setProgress(normalizeProgress(data.progress));
      if (data.targets) setTargets(normalizeTargets(data.targets));
      if (data.savings) setSavings(normalizeSavings(data.savings));
      showToast('Data berhasil dimuat!');
    } catch {
      setUsers(normalizeUsers(INITIAL_DATA.users));
      setProgress(normalizeProgress(INITIAL_DATA.progress));
      setTargets(normalizeTargets(INITIAL_DATA.targets));
      setSavings(normalizeSavings(INITIAL_DATA.savings));
      showToast('Menggunakan data lokal (tidak terhubung ke server).', 'info');
    }
    setLoading(false);
  };

  const updateTable = async (tableName, newData) => {
    try {
      await fetch(appsScriptUrl, {
        method: 'POST',
        body: JSON.stringify({ table: tableName, data: newData })
      });
      switch(tableName) {
        case 'users': setUsers(normalizeUsers(newData)); break;
        case 'progress': setProgress(normalizeProgress(newData)); break;
        case 'targets': setTargets(normalizeTargets(newData)); break;
        case 'savings': setSavings(normalizeSavings(newData)); break;
      }
    } catch {
      showToast('Tersimpan lokal saja.', 'info');
    }
  };

  const handleLogin = (e) => {
    e.preventDefault();
    const u = users.find(x => x.username === e.target.username.value && x.password === e.target.password.value);
    if (!u) return showToast('Username atau sandi salah!', 'error');
    setLoggedUser(u);
    setActiveTab('dashboard');
    showToast(`Selamat datang, ${u.name}!`);
  };

  useEffect(() => { loadDatabase(); }, []);

  if (!loggedUser) return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center p-4">
      <Toast message={toast.message} type={toast.type} onClose={()=>setToast({...toast,message:''})} />
      <div className="w-full max-w-md bg-white p-8 rounded-3xl shadow-xl border border-blue-200">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-blue-700 rounded-2xl flex items-center justify-center mx-auto mb-3">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-xl font-black text-blue-800">{settings.tpqName}</h1>
          <p className="text-xs text-gray-500 mt-1">Sistem Informasi Mengaji & Tabungan</p>
        </div>
        <form onSubmit={handleLogin} className="space-y-4">
          <div><label className="block text-xs font-bold mb-1 text-gray-700">Username</label>
            <input name="username" className="w-full p-3 border border-blue-200 rounded-xl text-sm" required /></div>
          <div><label className="block text-xs font-bold mb-1 text-gray-700">Kata Sandi</label>
            <input name="password" type="password" className="w-full p-3 border border-blue-200 rounded-xl text-sm" required /></div>
          <button type="submit" disabled={loading} className="w-full bg-blue-700 hover:bg-blue-800 text-white font-bold py-3 rounded-xl text-sm disabled:opacity-50">
            {loading ? 'Memuat...' : 'Masuk ke Sistem'}
          </button>
        </form>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-blue-50">
      <Toast message={toast.message} type={toast.type} onClose={()=>setToast({...toast,message:''})} />
      <header className="bg-blue-700 text-white p-4 flex justify-between items-center shadow-md">
        <div className="flex items-center gap-2">
          <Shield className="w-5 h-5" />
          <h1 className="font-bold text-sm">{settings.tpqName}</h1>
        </div>
        <button onClick={()=>{setLoggedUser(null); showToast('Berhasil keluar.')}} className="flex items-center gap-1 text-xs bg-white/20 px-3 py-1.5 rounded-lg hover:bg-white/30">
          <LogOut className="w-3.5 h-3.5" /> Keluar
        </button>
      </header>
      <main className="p-4 max-w-4xl mx-auto">
        {loggedUser.role === 'santri' && <SantriView activeTab={activeTab} setActiveTab={setActiveTab} user={loggedUser} users={users} progress={progress} targets={targets} savings={savings} updateTable={updateTable} showToast={showToast} simulatedWeekend={simulatedWeekend} setSimulatedWeekend={setSimulatedWeekend} />}
        {loggedUser.role === 'guru' && <GuruView activeTab={activeTab} setActiveTab={setActiveTab} user={loggedUser} users={users} setUsers={setUsers} progress={progress} targets={targets} savings={savings} settings={settings} updateTable={updateTable} showToast={showToast} simulatedWeekend={simulatedWeekend} setSimulatedWeekend={setSimulatedWeekend} />}
        {loggedUser.role === 'kepala_tpq' && <KepalaView activeTab={activeTab} setActiveTab={setActiveTab} user={loggedUser} users={users} setUsers={setUsers} progress={progress} targets={targets} savings={savings} settings={settings} updateTable={updateTable} showToast={showToast} appsScriptUrl={appsScriptUrl} setAppsScriptUrl={setAppsScriptUrl} loadDatabase={loadDatabase} />}
        {loggedUser.role === 'bendahara' && <BendaharaView activeTab={activeTab} setActiveTab={setActiveTab} users={users} savings={savings} settings={settings} updateTable={updateTable} showToast={showToast} currentUser={loggedUser} />}
        {loggedUser.role === 'admin' && <AdminView activeTab={activeTab} setActiveTab={setActiveTab} users={users} updateTable={updateTable} showToast={showToast} settings={settings} appsScriptUrl={appsScriptUrl} setAppsScriptUrl={setAppsScriptUrl} loadDatabase={loadDatabase} />}
      </main>
    </div>
  );
}
