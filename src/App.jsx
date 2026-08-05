import React, { useState, useEffect } from 'react';
import {
  User, Lock, Shield, Book, BookOpen, CheckCircle,
  AlertTriangle, Users, LogOut, CreditCard, Bell, Plus,
  Trash2, Check, X, UserPlus, Info, Edit, ArrowLeft,
  Eye, EyeOff, Award, ClipboardList, Settings, DollarSign,
  CheckSquare, RefreshCw, Database, Copy, Unlock,
  ChevronDown, ChevronUp, TrendingUp, TrendingDown, Search,
  ListChecks, FileText, Calendar, ShieldHalf, GraduationCap
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

const Toast = ({ message, type, onClose }) => {
  if (!message) return null;
  const bgColor = type === 'error' ? 'bg-red-500' : 'bg-emerald-600';
  return <div className={`fixed top-4 right-4 z-50 ${bgColor} text-white px-5 py-3 rounded-xl shadow-lg text-sm font-semibold animate-fade-in`}>{message}</div>;
};

const BackButton = ({ onClick }) => (
  <button 
    onClick={onClick} 
    className="mb-6 flex items-center text-sm font-bold text-gray-600 hover:text-emerald-700 transition-all duration-200 relative z-50 bg-white px-4 py-2 rounded-xl border border-gray-200 shadow-sm hover:shadow hover:border-emerald-300 w-fit active:scale-95"
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
        className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 hover:shadow-md hover:border-emerald-200 flex flex-col items-center justify-center text-center transition-all duration-300 group relative overflow-hidden w-full"
      >
        <div className="absolute top-0 right-0 w-12 h-12 bg-emerald-50 rounded-full -mr-6 -mt-6 transition-all group-hover:scale-150 opacity-40"></div>
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-3 transition-transform group-hover:scale-110 shadow-sm ${menu.color}`}>
          <menu.icon className="w-6 h-6" />
        </div>
        <h3 className="font-semibold text-gray-800 text-xs group-hover:text-emerald-700">{menu.label}</h3>
      </button>
    ))}
  </div>
);

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
      <div className="bg-white p-6 rounded-2xl shadow-sm border">
        <h3 className="text-lg font-bold mb-6 flex items-center text-amber-800">
          <DollarSign className="mr-2"/> Input & Riwayat Tabungan (Tersinkron)
        </h3>

        {santriList.length === 0 ? (
          <div className="p-6 bg-amber-50 border border-amber-200 rounded-xl">
            <p className="text-amber-900 text-sm">Belum ada data santri.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-gray-50 p-4 rounded-xl border">
              <h4 className="text-xs font-bold text-gray-700 mb-3 border-b pb-2 uppercase">Daftar Santri</h4>
              <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
                {santriList.map(s => {
                  const saldoBenar = hitungSaldoAktual(s.id);
                  return (
                    <button
                      key={s.id}
                      onClick={() => pilihSantri(s)}
                      className={`w-full p-3 rounded-xl text-left text-sm border transition-all ${
                        selectedSantri?.id === s.id
                          ? 'bg-amber-600 text-white font-bold border-amber-600 shadow-md'
                          : 'bg-white text-gray-700 border-gray-200 hover:bg-amber-50 hover:border-amber-200'
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
                <div className="p-10 text-center text-gray-400 text-sm italic bg-gray-50 border border-dashed rounded-xl">
                  Klik nama santri untuk melihat saldo & riwayat
                </div>
              ) : (
                <>
                  <div className="bg-amber-50 p-4 rounded-xl border border-amber-200">
                    <p className="text-[11px] text-amber-700 font-bold uppercase">Santri Terpilih</p>
                    <h4 className="font-extrabold text-lg mt-0.5">{selectedSantri.name}</h4>
                    <p className="text-sm text-gray-600 mt-1">
                      Saldo Aktual: <strong>Rp {hitungSaldoAktual(selectedSantri.id).toLocaleString('id-ID')}</strong>
                    </p>
                  </div>

                  <form onSubmit={handleSubmit} className="space-y-4 bg-gray-50 p-5 rounded-2xl border">
                    <h5 className="font-bold text-sm text-gray-700 border-b pb-2">Input Mutasi Baru</h5>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold mb-1 text-gray-700">Tanggal</label>
                        <input type="date" name="date" defaultValue={new Date().toISOString().slice(0,10)} required className="w-full p-2.5 border rounded-xl text-xs" />
                      </div>
                      <div>
                        <label className="block text-xs font-bold mb-1 text-gray-700">Jenis</label>
                        <select name="type" className="w-full p-2.5 border rounded-xl text-xs font-bold">
                          <option value="setor">Setoran</option>
                          <option value="tarik">Penarikan</option>
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-bold mb-1 text-gray-700">Nominal (Rp)</label>
                      <input type="number" name="amount" min="1000" placeholder="Contoh: 10000" required className="w-full p-2.5 border rounded-xl text-xs" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold mb-1 text-gray-700">Keterangan</label>
                      <input type="text" name="description" placeholder="Opsional" className="w-full p-2.5 border rounded-xl text-xs" />
                    </div>
                    <button type="submit" className="w-full bg-amber-600 hover:bg-amber-700 text-white font-bold py-3 rounded-xl text-xs shadow">
                      Simpan & Sinkronkan Saldo
                    </button>
                  </form>

                  <div className="border-t pt-6">
                    <h5 className="text-sm font-bold mb-4 text-gray-800">Riwayat Transaksi</h5>
                    {(() => {
                      const riwayat = savings.filter(i => String(i.santriId) === String(selectedSantri.id));
                      if (riwayat.length === 0) return <p className="text-sm text-gray-500 italic">Belum ada riwayat.</p>;
                      return (
                        <div className="overflow-x-auto">
                          <table className="w-full text-xs">
                            <thead className="bg-gray-50 font-bold text-gray-600 uppercase">
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
                                <tr key={r.id||i} className="border-b hover:bg-gray-50">
                                  <td className="p-2">{r.date}</td>
                                  <td className="p-2">
                                    <span className={`px-2 py-0.5 rounded-full font-bold ${r.type==='setor'?'bg-green-100 text-green-700':'bg-red-100 text-red-700'}`}>
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
        if (contentType && contentType.includes("text/html")) throw new Error('Akses Ditolak! Pastikan setting "Who has access" di Google Apps Script dideploy sebagai "Anyone".');
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
          } catch (e) { console.warn("Penyimpanan local storage dibatasi."); }
          if (!isInitializing) showToast('Database Google Sheets berhasil disinkronkan!');
        } else throw new Error(payload.message || 'Format data dari server tidak sesuai.');
      } else {
        let fUsers = normalizeUsers(safeGetLocalStorage('tpq_users', INITIAL_DATA.users));
        if (fUsers.filter(u => u.role === 'santri').length === 0) fUsers = normalizeUsers(INITIAL_DATA.users);
        setUsers(fUsers); setProgress(normalizeProgress(safeGetLocalStorage('tpq_progress', INITIAL_DATA.progress)));
        setTargets(normalizeTargets(safeGetLocalStorage('tpq_targets', INITIAL_DATA.targets)));
        setSavings(normalizeSavings(safeGetLocalStorage('tpq_savings', INITIAL_DATA.savings)));
      }
    } catch (error) {
      console.error("Detail Error Sinkronisasi:", error);
      let fUsers = normalizeUsers(safeGetLocalStorage('tpq_users', INITIAL_DATA.users));
      if (fUsers.filter(u => u.role === 'santri').length === 0) fUsers = normalizeUsers(INITIAL_DATA.users);
      setUsers(fUsers); setProgress(normalizeProgress(safeGetLocalStorage('tpq_progress', INITIAL_DATA.progress)));
      setTargets(normalizeTargets(safeGetLocalStorage('tpq_targets', INITIAL_DATA.targets)));
      setSavings(normalizeSavings(safeGetLocalStorage('tpq_savings', INITIAL_DATA.savings)));
    } finally { setIsSyncing(false); setIsInitializing(false); }
  };

  useEffect(() => {
    loadDatabase();
    try { const savedUser = sessionStorage.getItem('tpq_user'); if (savedUser) { const parsed = JSON.parse(savedUser); parsed.id = String(parsed.id); setCurrentUser(parsed); } }
    catch (e) { console.error("Session restoration error:", e); }
  }, []);

  useEffect(() => {
    if (currentUser && users.length > 0) {
      const fresh = users.find(u => String(u.id) === String(currentUser.id));
      if (fresh && JSON.stringify(fresh) !== JSON.stringify(currentUser)) {
        setCurrentUser(fresh);
        try { sessionStorage.setItem('tpq_user', JSON.stringify(fresh)); } catch(e){}
      }
    }
  }, [users, currentUser]);

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
      catch (storageErr) { console.warn("Penyimpanan lokal dibatasi:", storageErr); }
    } catch (localErr) {
      console.error("Gagal update data lokal:", localErr);
      showToast(`Gagal memproses data lokal: ${localErr.message}`, 'error');
      setIsSyncing(false); return false;
    }
    const activeUrl = customUrl || appsScriptUrl;
    try {
      if (activeUrl && activeUrl.trim() !== '' && activeUrl !== "ISI_URL_APPS_SCRIPT_ANDA_DISINI") {
        const response = await fetch(activeUrl, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify({ action: 'updateTable', table, data: normalizedData }) });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const resultJson = JSON.parse(await response.text());
        if (resultJson.status !== 'success') throw new Error(resultJson.message || 'Gagal simpan ke server.');
        showToast('Sinkronisasi Google Sheet berhasil diperbarui!'); return true;
      } else { showToast('Data disimpan secara lokal.'); return true; }
    } catch (error) {
      console.warn("CORS fallback aktif:", error);
      try {
        if (activeUrl && activeUrl.trim() !== '' && activeUrl !== "ISI_URL_APPS_SCRIPT_ANDA_DISINI") {
          await fetch(activeUrl, { method: 'POST', mode: 'no-cors', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify({ action: 'updateTable', table, data: normalizedData }) });
          showToast('Data dikirim ke Google Sheets (Mode Tanpa-Respon)!'); return true;
        }
      } catch (fbErr) { console.error("Fallback gagal:", fbErr); }
      showToast('Data berhasil disimpan secara lokal.'); return true;
    } finally { setIsSyncing(false); }
  };

  const handleLogin = (username, password) => {
    const user = users.find(u => String(u.username).toLowerCase() === String(username).toLowerCase() && String(u.password) === String(password));
    if (user) {
      setCurrentUser(user); setActiveTab('dashboard');
      try { sessionStorage.setItem('tpq_user', JSON.stringify(user)); } catch(e){}
      showToast(`Selamat datang kembali, ${user.name}!`);
    } else showToast('Username atau password salah!', 'error');
  };

  const handleLogout = () => {
    setCurrentUser(null); setActiveTab('dashboard');
    try { sessionStorage.removeItem('tpq_user'); } catch(e){}
  };

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast({ message: '', type: '' }), 3500);
  };

  if (isInitializing) return (
    <div className="min-h-screen bg-emerald-50/50 flex flex-col items-center justify-center p-4">
      <RefreshCw className="w-12 h-12 text-emerald-600 animate-spin mb-4" />
      <h2 className="text-xl font-bold text-gray-800">Menyinkronkan Data...</h2>
      <p className="text-gray-500 text-sm mt-2 text-center max-w-xs">Memuat data terbaru dari Google Sheets.</p>
    </div>
  );

  if (!currentUser) return (
    <div className="min-h-screen bg-emerald-50/50 flex items-center justify-center p-4">
      <Toast message={toast.message} type={toast.type} onClose={() => setToast({ message: '', type: '' })} />
      <div className="bg-white p-8 rounded-3xl shadow-xl w-full max-w-md border-t-8 border-emerald-600">
        <div className="text-center mb-8">
          {settings.logoUrl ? <img src={settings.logoUrl} alt="Logo" className="max-w-full h-24 object-contain mx-auto mb-4" /> : (
            <div className="bg-emerald-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 shadow-inner"><BookOpen className="w-10 h-10 text-emerald-600" /></div>
          )}
          <h1 className="text-2xl font-bold text-gray-800">{settings.tpqName || 'Sistem Informasi TPQ'}</h1>
          <p className="text-gray-500 text-sm mt-2">Portal masuk terintegrasi Google Sheets</p>
        </div>
        <form onSubmit={(e) => { e.preventDefault(); handleLogin(e.target.username.value, e.target.password.value); }} className="space-y-5">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Username</label>
            <div className="relative">
              <User className="w-5 h-5 text-gray-400 absolute left-3 top-3.5" />
              <input name="username" type="text" required className="w-full pl-10 pr-4 py-3 border rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none bg-gray-50 text-sm" placeholder="Username login..." />
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Password</label>
            <div className="relative">
              <Lock className="w-5 h-5 text-gray-400 absolute left-3 top-3.5" />
              <input name="password" type="password" required className="w-full pl-10 pr-4 py-3 border rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none bg-gray-50 text-sm" placeholder="Password akun..." />
            </div>
          </div>
          <button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3.5 rounded-xl transition-all shadow-md hover:shadow-lg text-sm">Masuk Sistem</button>
        </form>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 font-sans flex flex-col">
      <Toast message={toast.message} type={toast.type} onClose={() => setToast({ message: '', type: '' })} />
      <header className="bg-emerald-800 text-white p-4 shadow-md flex justify-between items-center sticky top-0 z-10 font-medium">
        <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setActiveTab('dashboard')}>
          {settings.logoUrl ? <img src={settings.logoUrl} alt="Logo" className="w-auto h-10 object-contain bg-white rounded-md p-1" /> : <BookOpen className="w-8 h-8 text-emerald-300" />}
          <div>
            <h1 className="font-bold text-base sm:text-lg leading-tight">{settings.tpqName || 'SIM TPQ'}</h1>
            <p className="text-[10px] sm:text-xs text-emerald-200 font-medium">Aplikasi Pengelolaan Taman Quran</p>
          </div>
        </div>
        <div className="flex items-center space-x-4">
          <div className="text-right text-xs sm:text-sm">
            <p className="font-bold leading-tight">{currentUser.name}</p>
            <p className="text-[10px] text-emerald-200 uppercase font-semibold tracking-wider">{getRoleName(currentUser.role)}</p>
          </div>
          <button onClick={() => loadDatabase()} disabled={isSyncing} className="p-2 sm:p-2.5 rounded-xl bg-emerald-950 hover:bg-emerald-900 transition" title="Sinkronisasi">
            <RefreshCw className={`w-4 h-4 text-white ${isSyncing ? 'animate-spin' : ''}`} />
          </button>
          <button onClick={handleLogout} className="bg-red-600 hover:bg-red-700 p-2 sm:p-2.5 rounded-xl transition-colors flex items-center shadow-sm" title="Keluar">
            <LogOut className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </div>
      </header>
      <main className="flex-1 p-4 md:p-8 max-w-7xl w-full mx-auto">
        {currentUser.role === 'santri' && (
          <SantriView activeTab={activeTab} setActiveTab={setActiveTab} user={currentUser} users={users} progress={progress} targets={targets} savings={savings} updateTable={updateTable} showToast={showToast} simulatedWeekend={simulatedWeekend} setSimulatedWeekend={setSimulatedWeekend} />
        )}
        {currentUser.role === 'guru' && (
          <GuruView activeTab={activeTab} setActiveTab={setActiveTab} user={currentUser} users={users} setUsers={setUsers} progress={progress} targets={targets} savings={savings} settings={settings} updateTable={updateTable} showToast={showToast} simulatedWeekend={simulatedWeekend} setSimulatedWeekend={setSimulatedWeekend} />
        )}
        {currentUser.role === 'kepala_tpq' && (
          <KepalaView activeTab={activeTab} setActiveTab={setActiveTab} user={currentUser} users={users} setUsers={setUsers} progress={progress} targets={targets} savings={savings} settings={settings} updateTable={updateTable} showToast={showToast} simulatedWeekend={simulatedWeekend} setSimulatedWeekend={setSimulatedWeekend} appsScriptUrl={appsScriptUrl} setAppsScriptUrl={setAppsScriptUrl} isSyncing={isSyncing} loadDatabase={loadDatabase} />
        )}
        {currentUser.role === 'bendahara' && (
          <BendaharaView 
            activeTab={activeTab} 
            setActiveTab={setActiveTab} 
            users={users || []} 
            savings={savings || []} 
            settings={settings || INITIAL_DATA.settings} 
            updateTable={updateTable} 
            showToast={showToast}
            currentUser={currentUser}
          />
        )}
        {currentUser.role === 'admin' && (
          <AdminView activeTab={activeTab} setActiveTab={setActiveTab} users={users} updateTable={updateTable} showToast={showToast} settings={settings} appsScriptUrl={appsScriptUrl} setAppsScriptUrl={setAppsScriptUrl} loadDatabase={loadDatabase} />
        )}
      </main>
    </div>
  );
}

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
      color: progresMenungguAcc.length > 0 ? 'bg-red-100 text-red-700 animate-pulse' : 'bg-blue-50 text-blue-600'
    },
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
          <div><p className="text-emerald-200">Status Tabungan</p><p className="text-base font-bold mt-0.5">Rp {currentBalance.toLocaleString('id-ID')}</p></div>
        </div>
      </div>

      {user.hasAlarm && (
        <div className="bg-red-50 border border-red-200 p-5 rounded-2xl flex items-start space-x-3.5 shadow-sm animate-pulse">
          <AlertTriangle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <h3 className="font-extrabold text-red-800">⚠️ Peringatan Tagihan Belum Lunas</h3>
            <p className="text-sm text-red-700 mt-1">Mohon segera selesaikan pembayaran iuran agar tetap bisa mengikuti kegiatan belajar mengaji.</p>
          </div>
        </div>
      )}

           {activeWeekendNotification && (
        <div className="bg-amber-50 border border-amber-200 p-5 rounded-2xl flex items-start space-x-3.5 shadow-sm">
          <Bell className="w-6 h-6 text-amber-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <h3 className="font-extrabold text-amber-800">🔔 Minggu Ini Belum Ada Persetujuan Wali</h3>
            <p className="text-sm text-amber-700 mt-1">Silakan buka menu <strong>Persetujuan Wali</strong> untuk menyetujui laporan bacaan santri setiap akhir pekan.</p>
            <button onClick={() => setActiveTab('persetujuan_wali')} className="mt-3 px-4 py-2 bg-amber-600 text-white text-xs font-bold rounded-xl hover:bg-amber-700 transition">Buka Sekarang</button>
          </div>
        </div>
      )}

      <MenuGrid menus={menus} onSelect={setActiveTab} />
    </div>
  );

  if (activeTab === 'persetujuan_wali') {
    const handleApprove = async (progressId) => {
      const updated = progress.map(p => p.id === progressId ? { ...p, status: 'disetujui_wali' } : p);
      await updateTable('progress', updated);
      await updateTable('users', users.map(u => u.id === user.id ? { ...u, lastAccDate: new Date().toISOString().split('T')[0] } : u));
      showToast('Berhasil disetujui! Terima kasih.');
    };

    return (
      <div className="space-y-6">
        <BackButton onClick={() => setActiveTab('dashboard')} />
        <h2 className="text-xl font-bold text-gray-800">Persetujuan Laporan Bacaan</h2>
        {progresMenungguAcc.length === 0 ? (
          <div className="p-8 text-center text-gray-500 bg-gray-50 rounded-xl border border-dashed">
            <CheckCircle className="w-12 h-12 mx-auto mb-3 text-emerald-500" />
            <p className="font-semibold">Semua laporan sudah disetujui</p>
          </div>
        ) : (
          <div className="space-y-3">
            {progresMenungguAcc.map(item => (
              <div key={item.id} className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-bold text-gray-800">{item.surah} - Ayat {item.ayat}</p>
                    <p className="text-xs text-gray-500 mt-1">Tanggal: {item.date} | Nilai: {item.nilai}</p>
                  </div>
                  <button onClick={() => handleApprove(item.id)} className="px-4 py-2 bg-emerald-600 text-white text-xs font-bold rounded-xl hover:bg-emerald-700 transition">Setujui</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  if (activeTab === 'progres_mengaji') {
    return (
      <div className="space-y-6">
        <BackButton onClick={() => setActiveTab('dashboard')} />
        <h2 className="text-xl font-bold text-gray-800">Riwayat Progres Mengaji</h2>
        {semuaProgresSaya.length === 0 ? (
          <div className="p-8 text-center text-gray-500 bg-gray-50 rounded-xl border border-dashed">Belum ada catatan progres.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-gray-50 font-bold text-gray-600 uppercase">
                <tr>
                  <th className="p-2 text-left">Tanggal</th>
                  <th className="p-2 text-left">Surah/Halaman</th>
                  <th className="p-2 text-left">Ayat</th>
                  <th className="p-2 text-left">Nilai</th>
                  <th className="p-2 text-left">Status</th>
                </tr>
              </thead>
              <tbody>
                {semuaProgresSaya.sort((a,b) => new Date(b.date) - new Date(a.date)).map(p => (
                  <tr key={p.id} className="border-b">
                    <td className="p-2">{p.date}</td>
                    <td className="p-2 font-medium">{p.surah}</td>
                    <td className="p-2">{p.ayat}</td>
                    <td className="p-2">{p.nilai}</td>
                    <td className="p-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                        p.status === 'disetujui_wali' ? 'bg-emerald-100 text-emerald-700' :
                        p.status === 'belum_disetujui' ? 'bg-amber-100 text-amber-700' :
                        'bg-blue-100 text-blue-700'
                      }`}>
                        {p.status.replace('_', ' ')}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    );
  }

  if (activeTab === 'riwayat_pembayaran') {
    return (
      <div className="space-y-6">
        <BackButton onClick={() => setActiveTab('dashboard')} />
        <h2 className="text-xl font-bold text-gray-800">Riwayat Pembayaran Iuran</h2>
        {user.historyBayar.length === 0 ? (
          <div className="p-8 text-center text-gray-500 bg-gray-50 rounded-xl border border-dashed">Belum ada riwayat pembayaran tercatat.</div>
        ) : (
          <div className="space-y-2">
            {user.historyBayar.sort().reverse().map((tgl, i) => (
              <div key={i} className="bg-white p-4 rounded-xl border flex justify-between items-center">
                <span className="text-sm font-medium">{tgl}</span>
                <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded">Lunas</span>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  if (activeTab === 'riwayat_tabungan') {
    return (
      <div className="space-y-6">
        <BackButton onClick={() => setActiveTab('dashboard')} />
        <div className="bg-amber-50 p-5 rounded-xl border border-amber-200">
          <p className="text-xs text-amber-700 font-bold uppercase">Saldo Saat Ini</p>
          <h3 className="text-2xl font-bold mt-1">Rp {currentBalance.toLocaleString('id-ID')}</h3>
        </div>
        <h2 className="text-xl font-bold text-gray-800">Riwayat Transaksi</h2>
        {mySavings.length === 0 ? (
          <div className="p-8 text-center text-gray-500 bg-gray-50 rounded-xl border border-dashed">Belum ada riwayat tabungan.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-gray-50 font-bold text-gray-600 uppercase">
                <tr>
                  <th className="p-2 text-left">Tanggal</th>
                  <th className="p-2 text-left">Jenis</th>
                  <th className="p-2 text-left">Keterangan</th>
                  <th className="p-2 text-right">Nominal</th>
                </tr>
              </thead>
              <tbody>
                {mySavings.sort((a,b) => new Date(b.date) - new Date(a.date)).map(r => (
                  <tr key={r.id} className="border-b">
                    <td className="p-2">{r.date}</td>
                    <td className="p-2">
                      <span className={`px-2 py-1 rounded-full font-bold ${r.type==='setor'?'bg-green-100 text-green-700':'bg-red-100 text-red-700'}`}>
                        {r.type==='setor'?'Setoran':'Penarikan'}
                      </span>
                    </td>
                    <td className="p-2">{r.description||'-'}</td>
                    <td className="p-2 text-right font-bold">Rp {Number(r.amount).toLocaleString('id-ID')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    );
  }
}

function GuruView({ activeTab, setActiveTab, user, users, setUsers, progress, targets, savings, settings, updateTable, showToast, simulatedWeekend, setSimulatedWeekend }) {
  const santriBinaan = users.filter(u => u.role === 'santri' && String(u.guruId) === String(user.id));
  const menus = [
    { id: 'daftar_santri', label: 'Santri Binaan', icon: Users, color: 'bg-blue-100 text-blue-700' },
    { id: 'input_progres', label: 'Input Bacaan', icon: BookOpen, color: 'bg-emerald-100 text-emerald-700' },
    { id: 'target_mengaji', label: 'Target Tingkatan', icon: Award, color: 'bg-purple-100 text-purple-700' },
    { id: 'laporan', label: 'Rekap Laporan', icon: ClipboardList, color: 'bg-orange-100 text-orange-700' }
  ];

  if (activeTab === 'dashboard') return (
    <div className="space-y-6">
      <div className="bg-blue-600 rounded-3xl p-6 text-white shadow-lg">
        <p className="text-xs font-bold text-blue-200 uppercase tracking-widest">Halaman Guru</p>
        <h2 className="text-2xl font-black mt-1">{user.name}</h2>
        <p className="text-sm mt-2">Membimbing <strong>{santriBinaan.length}</strong> santri</p>
      </div>
      <MenuGrid menus={menus} onSelect={setActiveTab} />
    </div>
  );

  if (activeTab === 'daftar_santri') {
    return (
      <div className="space-y-6">
        <BackButton onClick={() => setActiveTab('dashboard')} />
        <h2 className="text-xl font-bold text-gray-800">Daftar Santri Binaan</h2>
        {santriBinaan.length === 0 ? <div className="p-8 text-center text-gray-500 bg-gray-50 rounded-xl border border-dashed">Belum ada santri yang dibimbing.</div> :
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {santriBinaan.map(s => (
            <div key={s.id} className="bg-white p-4 rounded-xl border shadow-sm">
              <p className="font-bold">{s.name}</p>
              <p className="text-xs text-gray-500 mt-1">Tingkatan: {s.jilid}</p>
            </div>
          ))}
        </div>}
      </div>
    );
  }

  if (activeTab === 'input_progres') {
    const [form, setForm] = useState({ santriId: '', surah: '', ayat: '', nilai: '' });
    const handleSubmit = async (e) => {
      e.preventDefault();
      const baru = { id: Date.now().toString(), santriId: form.santriId, date: new Date().toISOString().split('T')[0], surah: form.surah, ayat: form.ayat, nilai: form.nilai, status: 'belum_disetujui', type: 'harian' };
      await updateTable('progress', [baru, ...progress]);
      showToast('Progres berhasil dicatat!');
      setForm({ santriId: '', surah: '', ayat: '', nilai: '' });
    };
    return (
      <div className="space-y-6">
        <BackButton onClick={() => setActiveTab('dashboard')} />
        <h2 className="text-xl font-bold text-gray-800">Input Laporan Bacaan</h2>
        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-xl border space-y-4">
          <div><label className="text-xs font-bold">Pilih Santri</label>
            <select value={form.santriId} onChange={e=>setForm({...form,santriId:e.target.value})} required className="w-full p-2 border rounded-xl text-xs">
              <option value="">-- Pilih Santri --</option>
              {santriBinaan.map(s=><option key={s.id} value={s.id}>{s.name} ({s.jilid})</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="text-xs font-bold">Surah/Halaman</label><input type="text" value={form.surah} onChange={e=>setForm({...form,surah:e.target.value})} required className="w-full p-2 border rounded-xl text-xs" /></div>
            <div><label className="text-xs font-bold">Ayat</label><input type="text" value={form.ayat} onChange={e=>setForm({...form,ayat:e.target.value})} required className="w-full p-2 border rounded-xl text-xs" /></div>
          </div>
          <div><label className="text-xs font-bold">Penilaian</label>
            <select value={form.nilai} onChange={e=>setForm({...form,nilai:e.target.value})} required className="w-full p-2 border rounded-xl text-xs">
              <option value="">-- Pilih --</option>
              <option>A (Sangat Lancar)</option><option>B (Lancar)</option><option>C (Sedang)</option><option>D (Perlu Bimbingan)</option>
            </select>
          </div>
          <button type="submit" className="w-full bg-emerald-600 text-white py-2.5 rounded-xl text-xs font-bold">Simpan Laporan</button>
        </form>
      </div>
    );
  }

  if (activeTab === 'target_mengaji') {
    return (
      <div className="space-y-6">
        <BackButton onClick={() => setActiveTab('dashboard')} />
        <h2 className="text-xl font-bold text-gray-800">Target Per Tingkatan</h2>
        <div className="space-y-3">
          {JILID_LEVELS.map(lvl => {
            const trgt = targets.filter(t=>t.level===lvl);
            return <div key={lvl} className="bg-white p-4 rounded-xl border"><p className="font-bold text-sm mb-2">{lvl}</p>
              {trgt.length?<ul className="text-xs text-gray-600 space-y-1">{trgt.map((t,i)=><li key={i}>• {t.description}</li>)}</ul>:<p className="text-xs text-gray-400 italic">Belum ada target</p>}
            </div>;
          })}
        </div>
      </div>
    );
  }

  if (activeTab === 'laporan') {
    return (
      <div className="space-y-6">
        <BackButton onClick={() => setActiveTab('dashboard')} />
        <h2 className="text-xl font-bold text-gray-800">Rekap Laporan Bacaan</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-gray-50 font-bold text-gray-600 uppercase"><tr>
              <th className="p-2 text-left">Santri</th><th className="p-2 text-left">Tanggal</th><th className="p-2 text-left">Surah</th><th className="p-2 text-left">Nilai</th><th className="p-2 text-left">Status</th>
            </tr></thead>
            <tbody>
              {progress.filter(p=>santriBinaan.some(s=>s.id===p.santriId)).sort((a,b)=>new Date(b.date)-new Date(a.date)).map(p=>{
                const s = santriBinaan.find(x=>x.id===p.santriId);
                return <tr key={p.id} className="border-b">
                  <td className="p-2 font-medium">{s?.name||'-'}</td><td className="p-2">{p.date}</td><td className="p-2">{p.surah}</td><td className="p-2">{p.nilai}</td>
                  <td className="p-2"><span className={`px-2 py-1 rounded-full text-xs font-bold ${p.status==='disetujui_wali'?'bg-emerald-100 text-emerald-700':'bg-amber-100 text-amber-700'}`}>{p.status.replace('_',' ')}</span></td>
                </tr>;
              })}
            </tbody>
          </table>
        </div>
      </div>
    );
  }
}

function KepalaView({ activeTab, setActiveTab, user, users, setUsers, progress, targets, savings, settings, updateTable, showToast, simulatedWeekend, setSimulatedWeekend, appsScriptUrl, setAppsScriptUrl, isSyncing, loadDatabase }) {
  const menus = [
    { id: 'daftar_pengguna', label: 'Data Pengguna', icon: Users, color: 'bg-blue-100 text-blue-700' },
    { id: 'rekap_progres', label: 'Rekap Bacaan', icon: BookOpen, color: 'bg-emerald-100 text-emerald-700' },
    { id: 'pengaturan', label: 'Pengaturan', icon: Settings, color: 'bg-gray-100 text-gray-700' }
  ];

  if (activeTab === 'dashboard') return (
    <div className="space-y-6">
      <div className="bg-indigo-600 rounded-3xl p-6 text-white shadow-lg">
        <p className="text-xs font-bold text-indigo-200 uppercase tracking-widest">Halaman Kepala TPQ</p>
        <h2 className="text-2xl font-black mt-1">{user.name}</h2>
        <div className="grid grid-cols-3 gap-3 mt-4 text-center">
          <div className="bg-white/10 p-3 rounded-xl"><p className="text-xl font-bold">{users.filter(u=>u.role==='santri').length}</p><p className="text-[10px]">Santri</p></div>
          <div className="bg-white/10 p-3 rounded-xl"><p className="text-xl font-bold">{users.filter(u=>u.role==='guru').length}</p><p className="text-[10px]">Guru</p></div>
          <div className="bg-white/10 p-3 rounded-xl"><p className="text-xl font-bold">{progress.length}</p><p className="text-[10px]">Catatan</p></div>
        </div>
      </div>
      <MenuGrid menus={menus} onSelect={setActiveTab} />
    </div>
  );

  if (activeTab === 'daftar_pengguna') {
    return (
      <div className="space-y-6">
        <BackButton onClick={() => setActiveTab('dashboard')} />
        <h2 className="text-xl font-bold text-gray-800">Daftar Seluruh Pengguna</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-gray-50 font-bold text-gray-600 uppercase"><tr>
              <th className="p-2 text-left">Nama</th><th className="p-2 text-left">Username</th><th className="p-2 text-left">Peran</th><th className="p-2 text-left">Kelas/Jilid</th>
            </tr></thead>
            <tbody>
              {users.sort((a,b)=>a.name.localeCompare(b.name)).map(u=><tr key={u.id} className="border-b">
                <td className="p-2 font-medium">{u.name}</td><td className="p-2">{u.username}</td><td className="p-2"><span className="px-2 py-1 bg-gray-100 rounded-full text-xs font-bold">{getRoleName(u.role)}</span></td><td className="p-2">{u.jilid||'-'}</td>
              </tr>)}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  if (activeTab === 'rekap_progres') {
    return (
      <div className="space-y-6">
        <BackButton onClick={() => setActiveTab('dashboard')} />
        <h2 className="text-xl font-bold text-gray-800">Rekapitulasi Progres Mengaji</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-gray-50 font-bold text-gray-600 uppercase"><tr>
              <th className="p-2 text-left">Santri</th><th className="p-2 text-left">Jilid</th><th className="p-2 text-center">Jml Catatan</th><th className="p-2 text-center">Sudah Disetujui</th>
            </tr></thead>
            <tbody>
              {users.filter(u=>u.role==='santri').sort((a,b)=>a.name.localeCompare(b.name)).map(s=>{
                const total = progress.filter(p=>p.santriId===s.id).length;
                const acc = progress.filter(p=>p.santriId===s.id && p.status==='disetujui_wali').length;
                return <tr key={s.id} className="border-b">
                  <td className="p-2 font-medium">{s.name}</td><td className="p-2">{s.jilid}</td><td className="p-2 text-center font-bold">{total}</td><td className="p-2 text-center font-bold text-emerald-600">{acc}</td>
                </tr>;
              })}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  if (activeTab === 'pengaturan') {
    return (
      <div className="space-y-6">
        <BackButton onClick={() => setActiveTab('dashboard')} />
        <h2 className="text-xl font-bold text-gray-800">Pengaturan Aplikasi</h2>
        <div className="bg-white p-6 rounded-xl border space-y-4">
          <div><label className="text-xs font-bold mb-1 block">URL Google Apps Script</label>
            <input type="text" value={appsScriptUrl} onChange={e=>setAppsScriptUrl(e.target.value)} className="w-full p-2 border rounded-xl text-xs" />
            <button onClick={()=>{localStorage.setItem('tpq_apps_script_url',appsScriptUrl);loadDatabase(appsScriptUrl);}} className="mt-2 px-4 py-2 bg-emerald-600 text-white text-xs font-bold rounded-xl">Simpan & Sinkronkan</button>
          </div>
          <div className="border-t pt-4">
            <label className="text-xs font-bold mb-2 block">Opsi Tambahan</label>
            <label className="flex items-center gap-2 text-xs"><input type="checkbox" checked={simulatedWeekend} onChange={e=>setSimulatedWeekend(e.target.checked)} /> Simulasi notifikasi akhir pekan</label>
          </div>
        </div>
      </div>
    );
  }
}

function BendaharaView({ activeTab, setActiveTab, users, savings, settings, updateTable, showToast, currentUser }) {
  const menus = [
    { id: 'input_tabungan', label: 'Kelola Tabungan', icon: DollarSign, color: 'bg-amber-100 text-amber-700' },
    { id: 'laporan_keuangan', label: 'Laporan Keuangan', icon: ClipboardList, color: 'bg-indigo-100 text-indigo-700' }
  ];

  if (activeTab === 'dashboard') return (
    <div className="space-y-6">
      <div className="bg-amber-600 rounded-3xl p-6 text-white shadow-lg">
        <p className="text-xs font-bold text-amber-200 uppercase tracking-widest">Halaman Bendahara</p>
        <h2 className="text-2xl font-black mt-1">{currentUser.name}</h2>
      </div>
      <MenuGrid menus={menus} onSelect={setActiveTab} />
    </div>
  );

  if (activeTab === 'input_tabungan') {
    return (
      <div className="space-y-6">
        <BackButton onClick={() => setActiveTab('dashboard')} />
        <SavingsInputView users={users} savings={savings} updateTable={updateTable} showToast={showToast} recorderId={currentUser.id} />
      </div>
    );
  }

  if (activeTab === 'laporan_keuangan') {
    const totalSetor = savings.filter(s=>s.type==='setor').reduce((a,b)=>a+b.amount,0);
    const totalTarik = savings.filter(s=>s.type==='tarik').reduce((a,b)=>a+b.amount,0);
    return (
      <div className="space-y-6">
        <BackButton onClick={() => setActiveTab('dashboard')} />
        <h2 className="text-xl font-bold text-gray-800">Rekapitulasi Tabungan Santri</h2>
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-green-50 p-4 rounded-xl border border-green-200"><p className="text-xs text-green-700 font-bold">Total Setoran</p><p className="text-xl font-bold mt-1">Rp {totalSetor.toLocaleString('id-ID')}</p></div>
          <div className="bg-red-50 p-4 rounded-xl border border-red-200"><p className="text-xs text-red-700 font-bold">Total Penarikan</p><p className="text-xl font-bold mt-1">Rp {totalTarik.toLocaleString('id-ID')}</p></div>
          <div className="bg-blue-50 p-4 rounded-xl border border-blue-200"><p className="text-xs text-blue-700 font-bold">Saldo Keseluruhan</p><p className="text-xl font-bold mt-1">Rp {(totalSetor-totalTarik).toLocaleString('id-ID')}</p></div>
        </div>
      </div>
    );
  }
}

function AdminView({ activeTab, setActiveTab, users, updateTable, showToast, settings, appsScriptUrl, setAppsScriptUrl, loadDatabase }) {
  const menus = [
    { id: 'kelola_akun', label: 'Kelola Akun', icon: User, color: 'bg-blue-100 text-blue-700' },
    { id: 'pengaturan_sistem', label: 'Pengaturan', icon: Settings, color: 'bg-gray-100 text-gray-700' }
  ];

  if (activeTab === 'dashboard') return (
    <div className="space-y-6">
      <div className="bg-gray-800 rounded-3xl p-6 text-white shadow-lg">
        <p className="text-xs font-bold text-gray-300 uppercase tracking-widest">Halaman Administrator</p>
        <h2 className="text-2xl font-black mt-1">Sistem Pengelolaan TPQ</h2>
      </div>
      <MenuGrid menus={menus} onSelect={setActiveTab} />
    </div>
  );

  if (activeTab === 'kelola_akun') {
    return (
      <div className="space-y-6">
        <BackButton onClick={() => setActiveTab('dashboard')} />
        <h2 className="text-xl font-bold text-gray-800">Pengaturan Data Pengguna</h2>
        <p className="text-xs text-gray-500">Untuk penambahan, perubahan, atau penghapusan data pengguna dapat dilakukan langsung pada Google Sheets yang terhubung.</p>
      </div>
    );
  }

  if (activeTab === 'pengaturan_sistem') {
    return (
      <div className="space-y-6">
        <BackButton onClick={() => setActiveTab('dashboard')} />
        <h2 className="text-xl font-bold text-gray-800">Pengaturan Koneksi Sistem</h2>
        <div className="bg-white p-6 rounded-xl border space-y-4">
          <div><label className="text-xs font-bold mb-1 block">Nama Lembaga</label>
            <input type="text" value={settings.tpqName} onChange={e=>setSettings({...settings,tpqName:e.target.value})} className="w-full p-2 border rounded-xl text-xs" />
          </div>
          <div><label className="text-xs font-bold mb-1 block">URL Apps Script</label>
            <input type="text" value={appsScriptUrl} onChange={e=>setAppsScriptUrl(e.target.value)} className="w-full p-2 border rounded-xl text-xs" />
          </div>
          <button onClick={()=>updateTable('settings',settings)} className="px-4 py-2 bg-gray-800 text-white text-xs font-bold rounded-xl">Simpan Pengaturan</button>
        </div>
      </div>
    );
  }
}
