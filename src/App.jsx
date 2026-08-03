import React, { useState, useEffect } from 'react';
import {
  User, Lock, Shield, Book, BookOpen, CheckCircle,
  AlertTriangle, Users, LogOut, CreditCard, Bell, Plus,
  Trash2, Check, X, UserPlus, Info, Edit, ArrowLeft,
  Eye, EyeOff, Award, ClipboardList, Settings, DollarSign,
  CheckSquare, RefreshCw, Database, Copy, Unlock,
  ChevronDown, ChevronUp, TrendingUp, TrendingDown, Search,
  ListChecks, ChevronRight, Filter, BarChart3, Calendar
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
    { id: '5', username: 'santri1', password: '123', role: 'santri', name: 'Muhammad Rafif', guruId: '3', jilid: 'Jilid 1', hasAlarm: false, lastAccDate: '', completedTargets: [], historyBayar: ['2026-07-10'] },
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
    logoUrl: '',
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
      password: String(getProp(u, ['password', 'Password', 'sandi', 'kata_sandi'], '')),
      role: roleStr, name: String(getProp(u, ['name', 'Name', 'nama', 'nama_lengkap', 'Nama Lengkap'], '')).trim(),
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

const Toast = ({ message, type }) => {
  if (!message) return null;
  const bgColor = type === 'error' ? 'bg-red-500' : 'bg-emerald-600';
  return <div className={`fixed top-4 right-4 z-50 ${bgColor} text-white px-5 py-3 rounded-xl shadow-lg text-sm font-semibold animate-fade-in`}>{message}</div>;
};

const BackButton = ({ onClick }) => (
  <button onClick={onClick} className="mb-6 flex items-center text-sm font-bold text-red-600 hover:text-red-800 transition-all bg-white px-4 py-2 rounded-xl border border-red-100 shadow-sm w-fit">
    <ArrowLeft className="w-4 h-4 mr-1.5" /> Kembali
  </button>
);

const MenuGrid = ({ menus, onSelect }) => (
  <div className="grid grid-cols-3 gap-4 animate-fade-in">
    {menus.map(menu => (
      <button key={menu.id} onClick={() => onSelect(menu.id)} className="bg-white p-4 rounded-2xl shadow-sm border border-gray-50 hover:shadow-md transition-all">
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-3 mx-auto ${menu.color}`}>
          <menu.icon className="w-6 h-6" />
        </div>
        <h3 className="font-semibold text-gray-800 text-xs text-center">{menu.label}</h3>
      </button>
    ))}
  </div>
);

function SavingsInputView({ users, savings, updateTable, showToast, recorderId }) {
  const [selectedSantri, setSelectedSantri] = useState(null);
  const santriList = users.filter(u => u.role === 'santri');
  const hitungSaldo = (id) => savings.filter(i => String(i.santriId) === String(id)).reduce((t, tr) => tr.type === 'setor' ? t + tr.amount : t - tr.amount, 0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedSantri || !e.target.amount.value) return showToast('Pilih santri & nominal!', 'error');
    const nominal = parseInt(e.target.amount.value);
    if (nominal <= 0) return showToast('Nominal tidak valid!', 'error');
    if (e.target.type.value === 'tarik' && hitungSaldo(selectedSantri.id) < nominal) return showToast('Saldo tidak cukup!', 'error');
    const baru = { id: Date.now().toString(), santriId: selectedSantri.id, date: e.target.date.value, amount: nominal, type: e.target.type.value, description: e.target.description.value || 'Transaksi', inputBy: recorderId };
    await updateTable('savings', [baru, ...savings]);
    setSelectedSantri({...selectedSantri});
    showToast('Tersimpan!');
    e.target.reset();
  };

  const hapus = async (trx) => {
    if(!confirm('Yakin hapus?')) return;
    await updateTable('savings', savings.filter(x => x.id !== trx.id));
    setSelectedSantri({...selectedSantri});
    showToast('Dihapus!');
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-2xl shadow-sm">
        <h3 className="text-lg font-bold mb-6 text-red-800 flex items-center"><DollarSign className="mr-2"/>Input & Riwayat Tabungan</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-gray-50 p-4 rounded-xl border">
            <h4 className="text-xs font-bold mb-3 border-b pb-2 uppercase">Daftar Santri</h4>
            <div className="space-y-2 max-h-[400px] overflow-y-auto">
              {santriList.map(s => (
                <button key={s.id} onClick={() => setSelectedSantri(s)} className={`w-full p-3 rounded-xl text-left text-sm border ${selectedSantri?.id === s.id ? 'bg-red-600 text-white border-red-600' : 'bg-white hover:bg-red-50'}`}>
                  <p className="font-semibold">{s.name}</p>
                  <p className="text-xs opacity-80">Saldo: Rp {hitungSaldo(s.id).toLocaleString('id-ID')}</p>
                </button>
              ))}
            </div>
          </div>
          <div className="md:col-span-2 space-y-6">
            {!selectedSantri ? <div className="p-10 text-center text-gray-400 italic bg-gray-50 rounded-xl border-dashed">Pilih santri dulu</div> : (
              <>
                <div className="bg-red-50 p-4 rounded-xl border border-red-100">
                  <p className="text-xs font-bold text-red-700 uppercase">Santri Terpilih</p>
                  <h4 className="font-extrabold">{selectedSantri.name}</h4>
                  <p className="text-sm">Saldo: <strong>Rp {hitungSaldo(selectedSantri.id).toLocaleString('id-ID')}</strong></p>
                </div>
                <form onSubmit={handleSubmit} className="space-y-4 bg-gray-50 p-5 rounded-2xl border">
                  <div className="grid grid-cols-2 gap-4">
                    <div><label className="block text-xs font-bold mb-1">Tanggal</label><input type="date" name="date" defaultValue={new Date().toISOString().slice(0,10)} required className="w-full p-2.5 border rounded-xl text-xs" /></div>
                    <div><label className="block text-xs font-bold mb-1">Jenis</label><select name="type" className="w-full p-2.5 border rounded-xl text-xs"><option value="setor">Setoran</option><option value="tarik">Penarikan</option></select></div>
                  </div>
                  <div><label className="block text-xs font-bold mb-1">Nominal (Rp)</label><input type="number" name="amount" min="1000" required className="w-full p-2.5 border rounded-xl text-xs" /></div>
                  <div><label className="block text-xs font-bold mb-1">Keterangan</label><input type="text" name="description" className="w-full p-2.5 border rounded-xl text-xs" /></div>
                  <button type="submit" className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-xl text-xs">Simpan</button>
                </form>
                <div className="border-t pt-6">
                  <h5 className="text-sm font-bold mb-4">Riwayat</h5>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead className="bg-gray-50 font-bold"><tr><th className="p-2 text-left">Tgl</th><th className="p-2 text-left">Jenis</th><th className="p-2 text-left">Ket</th><th className="p-2 text-right">Jumlah</th><th className="p-2 text-center">Aksi</th></tr></thead>
                      <tbody>
                        {[...savings.filter(i=>String(i.santriId)===String(selectedSantri.id))].sort((a,b)=>new Date(b.date)-new Date(a.date)).map(r=>(
                          <tr key={r.id} className="border-b">
                            <td className="p-2">{r.date}</td>
                            <td className="p-2"><span className={`px-2 py-0.5 rounded-full font-bold ${r.type==='setor'?'bg-green-100 text-green-700':'bg-red-100 text-red-700'}`}>{r.type==='setor'?'Setor':'Tarik'}</span></td>
                            <td className="p-2">{r.description||'-'}</td>
                            <td className="p-2 text-right font-bold">Rp {Number(r.amount).toLocaleString('id-ID')}</td>
                            <td className="p-2 text-center"><button onClick={()=>hapus(r)} className="text-red-500 hover:text-red-700">🗑️</button></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
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
  const [appsScriptUrl, setAppsScriptUrl] = useState(() => localStorage.getItem('tpq_apps_script_url') || HARDCODED_APPS_SCRIPT_URL);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast({ message: '', type: '' }), 3500);
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
      if (targetUrl && targetUrl.trim() !== '') {
        const res = await fetch(`${targetUrl}?action=getAll`);
        if (!res.ok) throw new Error('Gagal terhubung server');
        const data = await res.json();
        if (data.status === 'success' && data.data) {
          setUsers(normalizeUsers(data.data.users || localUsers));
          setProgress(normalizeProgress(data.data.progress || localProgress));
          setTargets(normalizeTargets(data.data.targets || localTargets));
          setSavings(normalizeSavings(data.data.savings || localSavings));
          setSettings(data.data.settings || localSettings);
          localStorage.setItem('tpq_users', JSON.stringify(normalizeUsers(data.data.users || localUsers)));
          localStorage.setItem('tpq_progress', JSON.stringify(normalizeProgress(data.data.progress || localProgress)));
          localStorage.setItem('tpq_targets', JSON.stringify(normalizeTargets(data.data.targets || localTargets)));
          localStorage.setItem('tpq_savings', JSON.stringify(normalizeSavings(data.data.savings || localSavings)));
        }
      } else {
        setUsers(normalizeUsers(localUsers)); setProgress(normalizeProgress(localProgress)); setTargets(normalizeTargets(localTargets)); setSavings(normalizeSavings(localSavings));
      }
    } catch (err) {
      console.error(err);
      setUsers(normalizeUsers(safeGetLocalStorage('tpq_users', INITIAL_DATA.users)));
      setProgress(normalizeProgress(safeGetLocalStorage('tpq_progress', INITIAL_DATA.progress)));
      setTargets(normalizeTargets(safeGetLocalStorage('tpq_targets', INITIAL_DATA.targets)));
      setSavings(normalizeSavings(safeGetLocalStorage('tpq_savings', INITIAL_DATA.savings)));
    } finally { setIsSyncing(false); setIsInitializing(false); }
  };

  const updateTable = async (table, updatedData) => {
    setIsSyncing(true);
    try {
      if (table === 'users') setUsers(normalizeUsers(updatedData));
      if (table === 'progress') setProgress(normalizeProgress(updatedData));
      if (table === 'targets') setTargets(normalizeTargets(updatedData));
      if (table === 'savings') setSavings(normalizeSavings(updatedData));
      localStorage.setItem(`tpq_${table}`, JSON.stringify(updatedData));
      if (appsScriptUrl && appsScriptUrl.trim() !== '') {
        await fetch(appsScriptUrl, { method: 'POST', body: JSON.stringify({ action: 'updateTable', table, data: updatedData }) });
      }
      showToast('Data tersimpan!');
    } catch (e) { showToast('Tersimpan secara lokal', 'error'); }
    setIsSyncing(false);
  };

  const handleLogin = (u, p) => {
    const user = users.find(x => String(x.username).toLowerCase() === String(u).toLowerCase() && String(x.password) === String(p));
    if (user) { setCurrentUser(user); sessionStorage.setItem('tpq_user', JSON.stringify(user)); showToast(`Selamat datang, ${user.name}!`); }
    else showToast('Username/password salah', 'error');
  };

  const handleLogout = () => { setCurrentUser(null); sessionStorage.removeItem('tpq_user'); };

  useEffect(() => { loadDatabase(); try { const s = sessionStorage.getItem('tpq_user'); if(s) setCurrentUser(JSON.parse(s)); } catch(e){} }, []);
  useEffect(() => { if(currentUser && users.length>0){ const f=users.find(u=>String(u.id)===String(currentUser.id)); if(f) setCurrentUser(f); } }, [users, currentUser]);

  if (isInitializing) return <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center"><RefreshCw className="w-12 h-12 text-red-600 animate-spin mb-4"/><h2 className="text-xl font-bold">Menyinkronkan Data...</h2></div>;

  if (!currentUser) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Toast message={toast.message} type={toast.type} />
      <div className="bg-white p-8 rounded-3xl shadow-xl w-full max-w-md">
        <div className="text-center mb-8">
          <div className="bg-red-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4"><BookOpen className="w-10 h-10 text-red-600" /></div>
          <h1 className="text-2xl font-bold text-gray-800">{settings.tpqName}</h1>
          <p className="text-gray-500 text-sm mt-2">Masuk untuk mengakses</p>
        </div>
        <form onSubmit={e=>{e.preventDefault(); handleLogin(e.target.username.value, e.target.password.value);}} className="space-y-5">
          <div><label className="block text-sm font-semibold mb-1">Username</label><div className="relative"><User className="w-5 h-5 text-gray-400 absolute left-3 top-3.5"/><input name="username" type="text" required className="w-full pl-10 pr-4 py-3 border rounded-xl focus:ring-2 focus:ring-red-500 bg-gray-50 text-sm" /></div></div>
          <div><label className="block text-sm font-semibold mb-1">Password</label><div className="relative"><Lock className="w-5 h-5 text-gray-400 absolute left-3 top-3.5"/><input name="password" type="password" required className="w-full pl-10 pr-4 py-3 border rounded-xl focus:ring-2 focus:ring-red-500 bg-gray-50 text-sm" /></div></div>
          <button type="submit" className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3.5 rounded-xl">Masuk</button>
        </form>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Toast message={toast.message} type={toast.type} />
      <header className="bg-red-600 text-white p-4 shadow-md flex justify-between items-center sticky top-0 z-10">
        <div className="flex items-center space-x-3 cursor-pointer" onClick={()=>setActiveTab('dashboard')}>
          <BookOpen className="w-8 h-8 text-white" />
          <div><h1 className="font-bold text-base">{settings.tpqName}</h1><p className="text-[10px] text-red-100">Sistem Informasi TPQ</p></div>
        </div>
        <div className="flex items-center space-x-4">
          <div className="text-right text-xs"><p className="font-bold">{currentUser.name}</p><p className="text-[10px] text-red-100 uppercase">{getRoleName(currentUser.role)}</p></div>
          <button onClick={()=>loadDatabase()} disabled={isSyncing} className="p-2 bg-red-700 rounded-xl hover:bg-red-800"><RefreshCw className={`w-4 h-4 ${isSyncing?'animate-spin':''}`}/></button>
          <button onClick={handleLogout} className="bg-red-800 hover:bg-red-900 p-2 rounded-xl"><LogOut className="w-4 h-4"/></button>
        </div>
      </header>
      <main className="flex-1 p-4 md:p-8 max-w-7xl w-full mx-auto">
        {currentUser.role === 'santri' && <SantriView {...{activeTab,setActiveTab,user:currentUser,users,progress,targets,savings,updateTable,showToast}} />}
        {currentUser.role === 'guru' && <GuruView {...{activeTab,setActiveTab,user:currentUser,users,setUsers,progress,targets,updateTable,showToast}} />}
        {currentUser.role === 'kepala_tpq' && <KepalaView {...{activeTab,setActiveTab,user:currentUser,users,progress,targets,savings,updateTable,showToast}} />}
        {currentUser.role === 'bendahara' && <BendaharaView {...{activeTab,setActiveTab,users,savings,updateTable,showToast,currentUser}} />}
        {currentUser.role === 'admin' && <AdminView {...{activeTab,setActiveTab,users,setUsers,settings,updateTable,showToast,appsScriptUrl,setAppsScriptUrl,loadDatabase}} />}
      </main>
    </div>
  );
}

function SantriView({ activeTab, setActiveTab, user, users, progress, targets, savings, updateTable, showToast }) {
  const semuaProgres = progress.filter(p => String(p.santriId) === String(user.id));
  const menungguAcc = semuaProgres.filter(p => p.status === 'belum_disetujui');
  const myTargets = targets.filter(t => t.level === user.jilid);
  const mySavings = savings.filter(s => String(s.santriId) === String(user.id));
  const saldo = mySavings.reduce((t,tr) => tr.type==='setor'?t+tr.amount:t-tr.amount, 0);
  const butuhAcc = isAccNeeded(user.lastAccDate);

  if (activeTab === 'dashboard') return (
    <div className="space-y-6 animate-fade-in">
      <div className="bg-red-600 rounded-3xl p-6 text-white">
        <p className="text-xs font-bold text-red-100 uppercase">Profil Santri</p>
        <h2 className="text-2xl font-black mt-1">{user.name}</h2>
        <div className="grid grid-cols-2 gap-4 mt-6 border-t border-red-500 pt-4 text-xs">
          <div><p className="text-red-100">Tingkatan</p><p className="text-base font-bold">{user.jilid}</p></div>
          <div><p className="text-red-100">Saldo Tabungan</p><p className="text-base font-bold">Rp {saldo.toLocaleString('id-ID')}</p></div>
        </div>
      </div>
      {user.hasAlarm && <div className="bg-red-50 border border-red-200 p-5 rounded-2xl flex items-start space-x-3"><AlertTriangle className="w-6 h-6 text-red-600"/><div><h3 className="font-bold text-red-900 text-sm">⚠️ Ada Tagihan Belum Lunas!</h3><p className="text-xs text-red-700 mt-1">Segera lunasi ke bendahara.</p></div></div>}
      {butuhAcc && <div className="bg-amber-50 border border-amber-200 p-5 rounded-2xl flex items-start space-x-3"><Bell className="w-6 h-6 text-amber-600"/><div><h3 className="font-bold text-amber-900 text-sm">⏰ Segera Konfirmasi Setoran!</h3><p className="text-xs text-amber-700 mt-1">Klik menu persetujuan wali.</p></div></div>}
      <h3 className="text-sm font-bold text-gray-800 mb-4 uppercase">Menu Utama</h3>
      <MenuGrid menus={[
        { id: 'persetujuan_wali', label: menungguAcc.length>0 ? `Persetujuan (${menungguAcc.length})` : 'Persetujuan Wali', icon: CheckSquare, color: menungguAcc.length>0 ? 'bg-red-100 text-red-700 animate-pulse' : 'bg-blue-50 text-blue-600' },
        { id: 'progres_mengaji', label: 'Progres Mengaji', icon: BookOpen, color: 'bg-red-50 text-red-600' },
        { id: 'riwayat_pembayaran', label: 'Riwayat Bayar', icon: CreditCard, color: 'bg-indigo-100 text-indigo-600' },
        { id: 'riwayat_tabungan', label: 'Tabungan', icon: DollarSign, color: 'bg-amber-100 text-amber-600' },
        { id: 'target_saya', label: 'Target Belajar', icon: Award, color: 'bg-green-50 text-green-600' }
      ]} onSelect={setActiveTab} />
    </div>
  );

  if (activeTab === 'persetujuan_wali') return (
    <div className="space-y-6"><BackButton onClick={()=>setActiveTab('dashboard')}/>
      <div className="bg-white p-6 rounded-2xl shadow-sm">
        <h3 className="text-lg font-bold mb-6 text-red-800 flex items-center"><CheckSquare className="mr-2"/>Persetujuan Setoran</h3>
        {menungguAcc.length===0?<div className="p-8 bg-green-50 border rounded-xl text-center"><CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3"/><p className="font-semibold">Semua sudah disetujui!</p></div>:
        <div className="space-y-4">
          {menungguAcc.map(item=>(
            <div key={item.id} className="p-4 bg-gray-50 rounded-xl border">
              <div className="flex justify-between"><div><p className="font-bold text-sm">{item.surah} Ayat {item.ayat}</p><p className="text-xs text-gray-500">{item.date} • {item.nilai}</p></div><span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs font-bold rounded-full">Menunggu</span></div>
              <div className="flex gap-2 mt-3">
                <button onClick={async()=>{await updateTable('progress', progress.map(p=>p.id===item.id?{...p,status:'disetujui_wali'}:p)); showToast('Disetujui!');}} className="flex-1 bg-green-600 text-white text-xs font-bold py-2 rounded-xl"><Check className="w-3.5 h-3.5 inline mr-1"/>Setujui</button>
                <button onClick={async()=>{await updateTable('progress', progress.map(p=>p.id===item.id?{...p,status:'ditolak_wali'}:p)); showToast('Ditolak!');}} className="flex-1 bg-red-600 text-white text-xs font-bold py-2 rounded-xl"><X className="w-3.5 h-3.5 inline mr-1"/>Tolak</button>
              </div>
            </div>
          ))}
        </div>}
      </div>
    </div>
  );

  if (activeTab === 'progres_mengaji') return (
    <div className="space-y-6"><BackButton onClick={()=>setActiveTab('dashboard')}/>
      <div className="bg-white p-6 rounded-2xl shadow-sm">
        <h3 className="text-lg font-bold mb-6 text-red-800 flex items-center"><BookOpen className="mr-2"/>Riwayat Mengaji</h3>
        {semuaProgres.length===0?<p className="text-gray-500 text-center py-8 italic">Belum ada data</p>:
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-gray-50 font-bold"><tr><th className="p-2 text-left">Tgl</th><th className="p-2 text-left">Surah</th><th className="p-2 text-left">Ayat</th><th className="p-2 text-left">Nilai</th><th className="p-2 text-center">Status</th></tr></thead>
            <tbody>{[...semuaProgres].sort((a,b)=>new Date(b.date)-new Date(a.date)).map(p=>(
              <tr key={p.id} className="border-b"><td className="p-2">{p.date}</td><td className="p-2">{p.surah}</td><td className="p-2">{p.ayat}</td><td className="p-2 font-bold">{p.nilai}</td>
              <td className="p-2 text-center"><span className={`px-2 py-0.5 rounded-full font-bold ${p.status==='acc_guru'?'bg-green-100 text-green-700':p.status==='disetujui_wali'?'bg-blue-100 text-blue-700':'bg-yellow-100 text-yellow-700'}`}>{p.status==='acc_guru'?'Disetujui Guru':p.status==='disetujui_wali'?'Disetujui Wali':'Menunggu'}</span></td></tr>
            ))}</tbody>
          </table>
        </div>}
      </div>
    </div>
  );

  if (activeTab === 'riwayat_pembayaran') return (
    <div className="space-y-6"><BackButton onClick={()=>setActiveTab('dashboard')}/>
      <div className="bg-white p-6 rounded-2xl shadow-sm">
        <h3 className="text-lg font-bold mb-6 text-red-800 flex items-center"><CreditCard className="mr-2"/>Riwayat Pembayaran</h3>
        {user.historyBayar.length===0?<p className="text-gray-500 text-center py-8 italic">Belum ada riwayat</p>:
        <div className="space-y-2">{[...user.historyBayar].sort().reverse().map((t,i)=>(<div key={i} className="p-3 bg-gray-50 rounded-xl border flex justify-between items-center"><span className="text-sm">{t}</span><CheckCircle className="w-5 h-5 text-green-500"/></div>))}</div>}
      </div>
    </div>
  );

  if (activeTab === 'riwayat_tabungan') return (
    <div className="space-y-6"><BackButton onClick={()=>setActiveTab('dashboard')}/>
      <div className="bg-white p-6 rounded-2xl shadow-sm">
        <div className="flex justify-between items-center mb-6"><h3 className="text-lg font-bold text-red-800 flex items-center"><DollarSign className="mr-2"/>Tabungan</h3><div className="text-right"><p className="text-xs text-gray-500">Saldo</p><p className="text-lg font-bold text-green-700">Rp {saldo.toLocaleString('id-ID')}</p></div></div>
        {mySavings.length===0?<p className="text-gray-500 text-center py-8 italic">Belum ada transaksi</p>:
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-gray-50 font-bold"><tr><th className="p-2 text-left">Tgl</th><th className="p-2 text-left">Jenis</th><th className="p-2 text-left">Ket</th><th className="p-2 text-right">Nominal</th></tr></thead>
            <tbody>{[...mySavings].sort((a,b)=>new Date(b.date)-new Date(a.date)).map(r=>(
              <tr key={r.id} className="border-b"><td className="p-2">{r.date}</td><td className="p-2"><span className={`px-2 py-0.5 rounded-full font-bold ${r.type==='setor'?'bg-green-100 text-green-700':'bg-red-100 text-red-700'}`}>{r.type==='setor'?'Setor':'Tarik'}</span></td><td className="p-2">{r.description||'-'}</td><td className="p-2 text-right font-bold">Rp {Number(r.amount).toLocaleString('id-ID')}</td></tr>
            ))}</tbody>
          </table>
        </div>}
      </div>
    </div>
  );

  if (activeTab === 'target_saya') return (
    <div className="space-y-6"><BackButton onClick={()=>setActiveTab('dashboard')}/>
      <div className="bg-white p-6 rounded-2xl shadow-sm">
        <h3 className="text-lg font-bold mb-6 text-red-800 flex items-center"><Award className="mr-2"/>Target Belajar {user.jilid}</h3>
        {myTargets.length===0?<p className="text-gray-500 text-center py-8 italic">Belum ada target</p>:<div className="space-y-3">{myTargets.map(t=>(<div key={t.id} className="p-4 bg-gray-50 rounded-xl border"><p className="text-sm">{t.description}</p></div>))}</div>}
      </div>
    </div>
  );

  return null;
}

function GuruView({ activeTab, setActiveTab, user, users, setUsers, progress, targets, updateTable, showToast }) {
  const santriBimbingan = users.filter(u => u.role==='santri' && String(u.guruId)===String(user.id));
  const [form, setForm] = useState({ santriId:'', surah:'', ayat:'', nilai:'', date:new Date().toISOString().slice(0,10) });

  if (activeTab === 'dashboard') return (
    <div className="space-y-6 animate-fade-in">
      <div className="bg-blue-600 rounded-3xl p-6 text-white"><p className="text-xs font-bold text-blue-100 uppercase">Halaman Guru</p><h2 className="text-2xl font-black mt-1">{user.name}</h2><p className="text-sm mt-2">Membimbing: {santriBimbingan.length} Santri</p></div>
      <MenuGrid menus={[{id:'catat_progres',label:'Catat Setoran',icon:BookOpen,color:'bg-green-50 text-green-600'},{id:'daftar_santri',label:'Santri Bimbingan',icon:Users,color:'bg-blue-50 text-blue-600'},{id:'target_mengaji',label:'Daftar Target',icon:Award,color:'bg-amber-100 text-amber-600'}]} onSelect={setActiveTab} />
    </div>
  );

  if (activeTab === 'catat_progres') return (
    <div className="space-y-6"><BackButton onClick={()=>setActiveTab('dashboard')}/>
      <div className="bg-white p-6 rounded-2xl shadow-sm">
        <h3 className="text-lg font-bold mb-6 text-blue-800 flex items-center"><BookOpen className="mr-2"/>Catat Setoran Mengaji</h3>
        <form onSubmit={async e=>{e.preventDefault(); if(!form.santriId||!form.surah||!form.ayat||!form.nilai) return showToast('Lengkapi semua data!','error'); const baru={id:Date.now().toString(),...form,status:'belum_disetujui',type:'harian'}; await updateTable('progress',[baru,...progress]); showToast('Tersimpan, menunggu persetujuan wali!'); setForm({santriId:'',surah:'',ayat:'',nilai:'',date:new Date().toISOString().slice(0,10)});}} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-xs font-bold mb-1">Santri</label><select value={form.santriId} onChange={e=>setForm({...form,santriId:e.target.value})} required className="w-full p-2.5 border rounded-xl text-xs"><option value="">Pilih Santri</option>{santriBimbingan.map(s=><option key={s.id} value={s.id}>{s.name} ({s.jilid})</option>)}</select></div>
            <div><label className="block text-xs font-bold mb-1">Tanggal</label><input type="date" value={form.date} onChange={e=>setForm({...form,date:e.target.value})} required className="w-full p-2.5 border rounded-xl text-xs" /></div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-xs font-bold mb-1">Surah/Halaman</label><input type="text" value={form.surah} onChange={e=>setForm({...form,surah:e.target.value})} required className="w-full p-2.5 border rounded-xl text-xs" /></div>
            <div><label className="block text-xs font-bold mb-1">Ayat/Baris</label><input type="text" value={form.ayat} onChange={e=>setForm({...form,ayat:e.target.value})} required className="w-full p-2.5 border rounded-xl text-xs" /></div>
          </div>
                    <div><label className="block text-xs font-bold mb-1">Penilaian</label>
            <select value={form.nilai} onChange={e=>setForm({...form,nilai:e.target.value})} required className="w-full p-2.5 border rounded-xl text-xs">
              <option value="">Pilih Nilai</option>
              <option value="A (Sangat Lancar)">A - Sangat Lancar</option>
              <option value="B (Lancar)">B - Lancar</option>
              <option value="C (Cukup)">C - Cukup</option>
              <option value="D (Perlu Bimbingan)">D - Perlu Bimbingan</option>
            </select>
          </div>
          <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl text-xs">
            Simpan Setoran
          </button>
        </form>
      </div>
    </div>
  );

  if (activeTab === 'daftar_santri') return (
    <div className="space-y-6">
      <BackButton onClick={()=>setActiveTab('dashboard')}/>
      <div className="bg-white p-6 rounded-2xl shadow-sm">
        <h3 className="text-lg font-bold mb-6 text-blue-800 flex items-center">
          <Users className="mr-2"/> Daftar Santri Bimbingan
        </h3>
        {santriBimbingan.length===0 ? (
          <p className="text-gray-500 text-center py-8 italic">Belum ada santri yang dibimbing.</p>
        ) : (
          <div className="space-y-3">
            {santriBimbingan.map(s=>(
              <div key={s.id} className="p-4 bg-gray-50 rounded-xl border flex justify-between items-center">
                <div>
                  <p className="font-bold text-sm">{s.name}</p>
                  <p className="text-xs text-gray-500">Tingkatan: {s.jilid}</p>
                </div>
                <CheckCircle className="w-5 h-5 text-blue-500"/>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  if (activeTab === 'target_mengaji') return (
    <div className="space-y-6">
      <BackButton onClick={()=>setActiveTab('dashboard')}/>
      <div className="bg-white p-6 rounded-2xl shadow-sm">
        <h3 className="text-lg font-bold mb-6 text-blue-800 flex items-center">
          <Award className="mr-2"/> Daftar Target Tingkatan
        </h3>
        <div className="space-y-3">
          {JILID_LEVELS.map(lvl=>(
            <div key={lvl} className="p-4 bg-gray-50 rounded-xl border">
              <p className="font-bold text-sm text-amber-700 mb-2">{lvl}</p>
              {targets.filter(t=>t.level===lvl).map(t=>(
                <p key={t.id} className="text-xs text-gray-700 mb-1">• {t.description}</p>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  return null;
}

function KepalaView({ activeTab, setActiveTab, user, users, progress, targets, savings, updateTable, showToast }) {
  const totalSantri = users.filter(u=>u.role==='santri').length;
  const totalGuru = users.filter(u=>u.role==='guru').length;
  const totalSetoran = progress.length;
  const totalTabungan = savings.reduce((t,tr)=>tr.type==='setor'?t+tr.amount:t-tr.amount,0);

  if (activeTab === 'dashboard') return (
    <div className="space-y-6 animate-fade-in">
      <div className="bg-emerald-600 rounded-3xl p-6 text-white">
        <p className="text-xs font-bold text-emerald-100 uppercase">Halaman Kepala TPQ</p>
        <h2 className="text-2xl font-black mt-1">{user.name}</h2>
        <div className="grid grid-cols-2 gap-4 mt-6 border-t border-emerald-500 pt-4 text-xs">
          <div><p className="text-emerald-100">Jumlah Santri</p><p className="text-xl font-bold">{totalSantri}</p></div>
          <div><p className="text-emerald-100">Jumlah Guru</p><p className="text-xl font-bold">{totalGuru}</p></div>
          <div><p className="text-emerald-100">Total Setoran</p><p className="text-xl font-bold">{totalSetoran}</p></div>
          <div><p className="text-emerald-100">Total Tabungan</p><p className="text-xl font-bold">Rp {totalTabungan.toLocaleString('id-ID')}</p></div>
        </div>
      </div>
      <MenuGrid menus={[
        { id: 'rekap_progres', label: 'Rekap Seluruh Progres', icon: TrendingUp, color: 'bg-green-50 text-green-600' },
        { id: 'kelola_pengguna', label: 'Kelola Pengguna', icon: UserPlus, color: 'bg-blue-50 text-blue-600' },
        { id: 'laporan_keuangan', label: 'Laporan Keuangan', icon: ListChecks, color: 'bg-amber-100 text-amber-600' }
      ]} onSelect={setActiveTab} />
    </div>
  );

  if (activeTab === 'rekap_progres') return (
    <div className="space-y-6">
      <BackButton onClick={()=>setActiveTab('dashboard')}/>
      <div className="bg-white p-6 rounded-2xl shadow-sm">
        <h3 className="text-lg font-bold mb-6 text-emerald-800 flex items-center">
          <TrendingUp className="mr-2"/> Rekap Progres Mengaji
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-gray-50 font-bold">
              <tr>
                <th className="p-2 text-left">Nama Santri</th>
                <th className="p-2 text-left">Jilid</th>
                <th className="p-2 text-center">Jumlah Setoran</th>
                <th className="p-2 text-center">Disetujui</th>
              </tr>
            </thead>
            <tbody>
              {users.filter(u=>u.role==='santri').map(s=>{
                const p = progress.filter(x=>String(x.santriId)===String(s.id));
                const acc = p.filter(x=>x.status==='acc_guru'||x.status==='disetujui_wali').length;
                return (
                  <tr key={s.id} className="border-b">
                    <td className="p-2">{s.name}</td>
                    <td className="p-2">{s.jilid}</td>
                    <td className="p-2 text-center font-bold">{p.length}</td>
                    <td className="p-2 text-center font-bold text-green-600">{acc}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  if (activeTab === 'kelola_pengguna') return (
    <div className="space-y-6">
      <BackButton onClick={()=>setActiveTab('dashboard')}/>
      <div className="bg-white p-6 rounded-2xl shadow-sm">
        <h3 className="text-lg font-bold mb-6 text-emerald-800 flex items-center">
          <UserPlus className="mr-2"/> Daftar Pengguna
        </h3>
        <div className="space-y-2">
          {users.map(u=>(
            <div key={u.id} className="p-3 bg-gray-50 rounded-xl border flex justify-between items-center">
              <div>
                <p className="font-bold text-sm">{u.name}</p>
                <p className="text-xs text-gray-500">@{u.username} • {getRoleName(u.role)}</p>
              </div>
              <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-bold rounded-full">{getRoleName(u.role)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  if (activeTab === 'laporan_keuangan') return (
    <div className="space-y-6">
      <BackButton onClick={()=>setActiveTab('dashboard')}/>
      <div className="bg-white p-6 rounded-2xl shadow-sm">
        <h3 className="text-lg font-bold mb-6 text-emerald-800 flex items-center">
          <ListChecks className="mr-2"/> Laporan Keuangan
        </h3>
        <div className="space-y-3">
          <div className="p-4 bg-green-50 rounded-xl border">
            <p className="text-xs text-green-700">Total Tabungan Masuk</p>
            <p className="text-xl font-bold text-green-800">Rp {savings.filter(s=>s.type==='setor').reduce((t,r)=>t+r.amount,0).toLocaleString('id-ID')}</p>
          </div>
          <div className="p-4 bg-red-50 rounded-xl border">
            <p className="text-xs text-red-700">Total Penarikan</p>
            <p className="text-xl font-bold text-red-800">Rp {savings.filter(s=>s.type==='tarik').reduce((t,r)=>t+r.amount,0).toLocaleString('id-ID')}</p>
          </div>
          <div className="p-4 bg-amber-50 rounded-xl border">
            <p className="text-xs text-amber-700">Saldo Keseluruhan</p>
            <p className="text-xl font-bold text-amber-800">Rp {totalTabungan.toLocaleString('id-ID')}</p>
          </div>
        </div>
      </div>
    </div>
  );

  return null;
}

function BendaharaView({ activeTab, setActiveTab, users, savings, updateTable, showToast, currentUser }) {
  if (activeTab === 'dashboard') return (
    <div className="space-y-6 animate-fade-in">
      <div className="bg-amber-600 rounded-3xl p-6 text-white">
        <p className="text-xs font-bold text-amber-100 uppercase">Halaman Bendahara</p>
        <h2 className="text-2xl font-black mt-1">{currentUser.name}</h2>
      </div>
      <MenuGrid menus={[
        { id: 'input_tabungan', label: 'Input Tabungan', icon: DollarSign, color: 'bg-amber-100 text-amber-600' },
        { id: 'rekap_tabungan', label: 'Rekap Semua', icon: ClipboardList, color: 'bg-blue-50 text-blue-600' },
        { id: 'laporan', label: 'Laporan Keuangan', icon: ListChecks, color: 'bg-green-50 text-green-600' }
      ]} onSelect={setActiveTab} />
    </div>
  );

  if (activeTab === 'input_tabungan') return (
    <>
      <BackButton onClick={() => setActiveTab('dashboard')} />
      <SavingsInputView 
        users={users} 
        savings={savings} 
        updateTable={updateTable} 
        showToast={showToast} 
        recorderId={currentUser.id} 
      />
    </>
  );

  if (activeTab === 'rekap_tabungan') return (
    <div className="space-y-6">
      <BackButton onClick={()=>setActiveTab('dashboard')}/>
      <div className="bg-white p-6 rounded-2xl shadow-sm">
        <h3 className="text-lg font-bold mb-6 text-amber-800 flex items-center">
          <ClipboardList className="mr-2"/> Rekap Seluruh Tabungan
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-gray-50 font-bold">
              <tr>
                <th className="p-2 text-left">Santri</th>
                <th className="p-2 text-right">Total Setor</th>
                <th className="p-2 text-right">Total Tarik</th>
                <th className="p-2 text-right">Saldo</th>
              </tr>
            </thead>
            <tbody>
              {users.filter(u=>u.role==='santri').map(s=>{
                const trx = savings.filter(x=>String(x.santriId)===String(s.id));
                const m = trx.filter(x=>x.type==='setor').reduce((t,r)=>t+r.amount,0);
                const k = trx.filter(x=>x.type==='tarik').reduce((t,r)=>t+r.amount,0);
                return (
                  <tr key={s.id} className="border-b">
                    <td className="p-2">{s.name}</td>
                    <td className="p-2 text-right text-green-700 font-bold">Rp {m.toLocaleString('id-ID')}</td>
                    <td className="p-2 text-right text-red-700 font-bold">Rp {k.toLocaleString('id-ID')}</td>
                    <td className="p-2 text-right font-bold">Rp {(m-k).toLocaleString('id-ID')}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  if (activeTab === 'laporan') return (
    <div className="space-y-6">
      <BackButton onClick={()=>setActiveTab('dashboard')}/>
      <div className="bg-white p-6 rounded-2xl shadow-sm">
        <h3 className="text-lg font-bold mb-6 text-amber-800 flex items-center">
          <ListChecks className="mr-2"/> Laporan Keuangan Lengkap
        </h3>
        <div className="space-y-3">
          <div className="p-4 bg-green-50 rounded-xl border flex justify-between">
            <span className="text-sm">Total Uang Masuk</span>
            <span className="font-bold text-green-800">Rp {savings.filter(s=>s.type==='setor').reduce((t,r)=>t+r.amount,0).toLocaleString('id-ID')}</span>
          </div>
          <div className="p-4 bg-red-50 rounded-xl border flex justify-between">
            <span className="text-sm">Total Uang Keluar</span>
            <span className="font-bold text-red-800">Rp {savings.filter(s=>s.type==='tarik').reduce((t,r)=>t+r.amount,0).toLocaleString('id-ID')}</span>
          </div>
          <div className="p-4 bg-amber-50 rounded-xl border flex justify-between">
            <span className="text-sm font-bold">Saldo Akhir</span>
            <span className="font-bold text-amber-800">Rp {savings.reduce((t,r)=>r.type==='setor'?t+r.amount:t-r.amount,0).toLocaleString('id-ID')}</span>
          </div>
        </div>
      </div>
    </div>
  );

  return null;
}

function AdminView({ activeTab, setActiveTab, users, setUsers, updateTable, showToast, appsScriptUrl, setAppsScriptUrl, loadDatabase }) {
  const [urlInput, setUrlInput] = useState(appsScriptUrl);

  if (activeTab === 'dashboard') return (
    <div className="space-y-6 animate-fade-in">
      <div className="bg-gray-800 rounded-3xl p-6 text-white">
        <p className="text-xs font-bold text-gray-300 uppercase">Halaman Administrator</p>
        <h2 className="text-2xl font-black mt-1">Pengelolaan Sistem</h2>
      </div>
      <MenuGrid menus={[
        { id: 'kelola_akun', label: 'Kelola Akun', icon: Shield, color: 'bg-red-50 text-red-600' },
        { id: 'pengaturan_umum', label: 'Pengaturan', icon: Settings, color: 'bg-gray-100 text-gray-700' },
        { id: 'backup_data', label: 'Sinkronisasi', icon: Database, color: 'bg-blue-50 text-blue-600' }
      ]} onSelect={setActiveTab} />
    </div>
  );

  if (activeTab === 'kelola_akun') return (
    <div className="space-y-6">
      <BackButton onClick={()=>setActiveTab('dashboard')}/>
      <div className="bg-white p-6 rounded-2xl shadow-sm">
        <h3 className="text-lg font-bold mb-6 text-gray-800 flex items-center">
          <Shield className="mr-2"/> Daftar Semua Pengguna
        </h3>
        <div className="space-y-2">
          {users.map(u=>(
            <div key={u.id} className="p-3 bg-gray-50 rounded-xl border flex justify-between items-center">
              <div>
                <p className="font-bold text-sm">{u.name}</p>
                <p className="text-xs text-gray-500">@{u.username} • {getRoleName(u.role)}</p>
              </div>
              <span className="px-2 py-1 bg-gray-200 text-gray-800 text-xs font-bold rounded-full">{getRoleName(u.role)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  if (activeTab === 'pengaturan_umum') return (
    <div className="space-y-6">
      <BackButton onClick={()=>setActiveTab('dashboard')}/>
      <div className="bg-white p-6 rounded-2xl shadow-sm space-y-5">
        <h3 className="text-lg font-bold text-gray-800 flex items-center">
          <Settings className="mr-2"/> Pengaturan Aplikasi
        </h3>
        <div>
          <label className="block text-xs font-bold mb-1">URL Apps Script</label>
          <input type="text" value={urlInput} onChange={e=>setUrlInput(e.target.value)} className="w-full p-2.5 border rounded-xl text-xs" />
          <button onClick={()=>{setAppsScriptUrl(urlInput);localStorage.setItem('tpq_apps_script_url',urlInput);showToast('URL disimpan!');}} className="mt-2 bg-gray-800 text-white px-4 py-2 rounded-xl text-xs font-bold">Simpan URL</button>
        </div>
      </div>
    </div>
  );

  if (activeTab === 'backup_data') return (
    <div className="space-y-6">
      <BackButton onClick={()=>setActiveTab('dashboard')}/>
      <div className="bg-white p-6 rounded-2xl shadow-sm">
        <h3 className="text-lg font-bold mb-6 text-gray-800 flex items-center">
          <Database className="mr-2"/> Sinkronisasi Data
        </h3>
        <button onClick={()=>loadDatabase()} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl text-xs flex items-center justify-center gap-2">
          <RefreshCw className="w-4 h-4"/> Tarik Data Terbaru
        </button>
      </div>
    </div>
  );

  return null;
}
