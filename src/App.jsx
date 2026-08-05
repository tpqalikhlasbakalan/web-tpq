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

// --- FUNGSI BANTUAN ---
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
    } catch (e) {}
    let history = [];
    let rawHistory = getProp(u, ['historyBayar', 'historybayar', 'riwayat_bayar', 'history_bayar']);
    try {
      if (Array.isArray(rawHistory)) history = rawHistory.map(String);
      else if (typeof rawHistory === 'string' && rawHistory.trim() !== '') {
        const parsed = JSON.parse(rawHistory);
        history = Array.isArray(parsed) ? parsed.map(String) : [];
      }
    } catch (e) {}
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
  catch (e) { return fallback; }
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

// --- KOMPONEN TAMPILAN KEKINIAN ---
const Toast = ({ message, type, onClose }) => {
  if (!message) return null;
  const bgColor = type === 'error' ? 'bg-rose-500' : 'bg-emerald-500';
  return <div className={`fixed top-5 right-5 z-50 ${bgColor} text-white px-5 py-3 rounded-xl shadow-xl text-sm font-medium animate-slide-in`}>{message}</div>;
};

const BackButton = ({ onClick }) => (
  <button 
    onClick={onClick} 
    className="mb-6 flex items-center text-sm font-medium text-slate-600 hover:text-emerald-600 transition-all duration-200 bg-white px-4 py-2 rounded-xl shadow-sm hover:shadow border border-slate-100"
  >
    <ArrowLeft className="w-4 h-4 mr-2" /> 
    Kembali
  </button>
);

const MenuGrid = ({ menus, onSelect }) => (
  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
    {menus.map(menu => (
      <button 
        key={menu.id} 
        onClick={() => onSelect(menu.id)} 
        className="bg-white p-5 rounded-2xl shadow-sm hover:shadow-md border border-slate-100 hover:border-emerald-200 flex flex-col items-center justify-center text-center transition-all duration-300 group hover:-translate-y-1"
      >
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-3 transition-transform group-hover:scale-110 ${menu.color}`}>
          <menu.icon className="w-6 h-6" />
        </div>
        <h3 className="font-semibold text-slate-800 text-xs group-hover:text-emerald-700">{menu.label}</h3>
      </button>
    ))}
  </div>
);

// --- UTAMA ---
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
          } catch (e) {}
          if (!isInitializing) showToast('Data disinkronkan!');
        } else throw new Error(payload.message || 'Format data tidak sesuai.');
      } else {
        let fUsers = normalizeUsers(safeGetLocalStorage('tpq_users', INITIAL_DATA.users));
        if (fUsers.filter(u => u.role === 'santri').length === 0) fUsers = normalizeUsers(INITIAL_DATA.users);
        setUsers(fUsers); setProgress(normalizeProgress(safeGetLocalStorage('tpq_progress', INITIAL_DATA.progress)));
        setTargets(normalizeTargets(safeGetLocalStorage('tpq_targets', INITIAL_DATA.targets)));
        setSavings(normalizeSavings(safeGetLocalStorage('tpq_savings', INITIAL_DATA.savings)));
      }
    } catch (error) {
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
    catch (e) {}
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
      try { localStorage.setItem(`tpq_${table}`, JSON.stringify(normalizedData)); } catch (e) {}
    } catch (localErr) {
      showToast(`Gagal: ${localErr.message}`, 'error');
      setIsSyncing(false); return false;
    }
    const activeUrl = customUrl || appsScriptUrl;
    try {
      if (activeUrl && activeUrl.trim() !== '' && activeUrl !== "ISI_URL_APPS_SCRIPT_ANDA_DISINI") {
        const response = await fetch(activeUrl, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify({ action: 'updateTable', table, data: normalizedData }) });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const resultJson = JSON.parse(await response.text());
        if (resultJson.status !== 'success') throw new Error(resultJson.message || 'Gagal simpan.');
        showToast('Tersimpan!'); return true;
      } else { showToast('Tersimpan secara lokal.'); return true; }
    } catch (error) {
      try {
        if (activeUrl && activeUrl.trim() !== '' && activeUrl !== "ISI_URL_APPS_SCRIPT_ANDA_DISINI") {
          await fetch(activeUrl, { method: 'POST', mode: 'no-cors', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify({ action: 'updateTable', table, data: normalizedData }) });
          showToast('Terkirim!'); return true;
        }
      } catch (fbErr) {}
      showToast('Tersimpan secara lokal.'); return true;
    } finally { setIsSyncing(false); }
  };

  const handleLogin = (username, password) => {
    const user = users.find(u => String(u.username).toLowerCase() === String(username).toLowerCase() && String(u.password) === String(password));
    if (user) {
      setCurrentUser(user); setActiveTab('dashboard');
      try { sessionStorage.setItem('tpq_user', JSON.stringify(user)); } catch(e){}
      showToast(`Selamat datang, ${user.name}!`);
    } else showToast('Username atau password salah!', 'error');
  };

  const handleLogout = () => {
    setCurrentUser(null); setActiveTab('dashboard');
    try { sessionStorage.removeItem('tpq_user'); } catch(e){}
  };

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast({ message: '', type: '' }), 3000);
  };

  if (isInitializing) return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6">
      <RefreshCw className="w-12 h-12 text-emerald-500 animate-spin mb-4" />
      <h2 className="text-xl font-semibold text-slate-800">Memuat Data...</h2>
      <p className="text-slate-500 text-sm mt-2">Menghubungkan ke database</p>
    </div>
  );

  if (!currentUser) return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-50 flex items-center justify-center p-4">
      <Toast message={toast.message} type={toast.type} onClose={() => setToast({ message: '', type: '' })} />
      <div className="bg-white p-8 rounded-3xl shadow-xl w-full max-w-md border border-slate-100">
        <div className="text-center mb-8">
          {settings.logoUrl ? <img src={settings.logoUrl} alt="Logo" className="max-w-[140px] mx-auto mb-4" /> : (
            <div className="bg-emerald-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4"><BookOpen className="w-10 h-10 text-emerald-600" /></div>
          )}
          <h1 className="text-2xl font-bold text-slate-800">{settings.tpqName || 'Sistem TPQ'}</h1>
          <p className="text-slate-500 text-sm mt-1">Masuk ke sistem manajemen</p>
        </div>
        <form onSubmit={(e) => { e.preventDefault(); handleLogin(e.target.username.value, e.target.password.value); }} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Username</label>
            <div className="relative">
              <User className="w-5 h-5 text-slate-400 absolute left-3 top-3.5" />
              <input name="username" type="text" required className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-slate-50 text-sm transition-all" placeholder="Masukkan username" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
            <div className="relative">
              <Lock className="w-5 h-5 text-slate-400 absolute left-3 top-3.5" />
              <input name="password" type="password" required className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-slate-50 text-sm transition-all" placeholder="Masukkan kata sandi" />
            </div>
          </div>
          <button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-3 rounded-xl transition-all shadow-sm hover:shadow">Masuk</button>
        </form>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      <Toast message={toast.message} type={toast.type} onClose={() => setToast({ message: '', type: '' })} />
      <header className="bg-white shadow-sm sticky top-0 z-10 border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 py-3 flex justify-between items-center">
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setActiveTab('dashboard')}>
            {settings.logoUrl ? <img src={settings.logoUrl} alt="Logo" className="h-10 object-contain" /> : <BookOpen className="w-8 h-8 text-emerald-600" />}
            <div>
              <h1 className="font-semibold text-slate-800">{settings.tpqName || 'SIM TPQ'}</h1>
              <p className="text-xs text-slate-500">Sistem Informasi</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium text-slate-800">{currentUser.name}</p>
              <p className="text-xs text-slate-500">{getRoleName(currentUser.role)}</p>
            </div>
            <button onClick={() => loadDatabase()} disabled={isSyncing} className="p-2 rounded-xl hover:bg-slate-100 transition-colors" title="Sinkronisasi">
              <RefreshCw className={`w-5 h-5 text-slate-600 ${isSyncing ? 'animate-spin' : ''}`} />
            </button>
            <button onClick={handleLogout} className="p-2 rounded-xl hover:bg-rose-50 text-rose-600 transition-colors" title="Keluar">
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-4 py-6">
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
          <BendaharaView activeTab={activeTab} setActiveTab={setActiveTab} users={users || []} savings={savings || []} settings={settings || INITIAL_DATA.settings} updateTable={updateTable} showToast={showToast} currentUser={currentUser} />
        )}
        {currentUser.role === 'admin' && (
          <AdminView activeTab={activeTab} setActiveTab={setActiveTab} users={users} updateTable={updateTable} showToast={showToast} settings={settings} appsScriptUrl={appsScriptUrl} setAppsScriptUrl={setAppsScriptUrl} loadDatabase={loadDatabase} />
        )}
      </main>
    </div>
  );
}

// --- FUNGSI TAMBAHAN TAMPILAN (SANTRI, GURU, KEPALA, BENDAHARA, ADMIN) ---
// *Semua fungsi tampilan yang ada di kode asli tetap digunakan, hanya disesuaikan gaya CSS-nya dengan prinsip yang sama:
// - Ganti kelas warna lama menjadi yang lebih modern (slate, emerald, rose, amber)
// - Perbaiki padding, border-radius, shadow
// - Tambahkan efek hover dan transisi
// - Sederhanakan struktur agar lebih rapi

// Fungsi SantriView, GuruView, KepalaView, BendaharaView, AdminView, SavingsInputView
// Silakan gunakan fungsi yang sudah ada di kode asli kamu, lalu ganti semua kelas gaya mengikuti contoh di atas.
// ==============================
// COMPONENT: SAVINGS INPUT VIEW
// ==============================
function SavingsInputView({ users, savings, updateTable, showToast, recorderId }) {
  const [selectedSantri, setSelectedSantri] = useState(null);
  const santriList = users.filter(u => u.role === 'santri');

  const hitungSaldoAktual = (idSantri) => {
    return savings
      .filter(item => String(item.santriId) === String(idSantri))
      .reduce((total, trx) => trx.type === 'setor' ? total + trx.amount : total - trx.amount, 0);
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
    const nominal = parseInt(e.target.amount.value.replace(/\./g,''));
    const tanggal = e.target.date.value;
    const keterangan = e.target.description.value.trim() || (jenis === 'setor' ? 'Setoran' : 'Penarikan');

    if (nominal <= 0) return showToast('Nominal tidak valid!', 'error');
    if (jenis === 'tarik' && hitungSaldoAktual(selectedSantri.id) < nominal) {
      return showToast('Saldo tidak cukup!', 'error');
    }

    const saldoBaru = jenis === 'setor' ? hitungSaldoAktual(selectedSantri.id) + nominal : hitungSaldoAktual(selectedSantri.id) - nominal;
    const transaksiBaru = { id: Date.now().toString(), santriId: selectedSantri.id, date: tanggal, amount: nominal, type: jenis, description: keterangan, inputBy: recorderId };

    await updateTable('savings', [transaksiBaru, ...savings]);
    await updateTable('users', users.map(u => u.id === selectedSantri.id ? {...u, saldo_awal: saldoBaru} : u));
    setSelectedSantri({...selectedSantri, saldo_awal: saldoBaru});
    showToast('Tersimpan! Saldo sudah disinkronkan.');
    e.target.reset();
  };

  const hapusTransaksi = async (dataTrx) => {
    if(!confirm('Yakin hapus? Saldo akan dikembalikan otomatis!')) return;
    const saldoKoreksi = dataTrx.type === 'setor' ? hitungSaldoAktual(selectedSantri.id) - dataTrx.amount : hitungSaldoAktual(selectedSantri.id) + dataTrx.amount;
    if (saldoKoreksi < 0) return showToast('Tidak bisa dihapus (saldo akan minus)!', 'error');
    await updateTable('savings', savings.filter(x => x.id !== dataTrx.id));
    await updateTable('users', users.map(u => u.id === selectedSantri.id ? {...u, saldo_awal: saldoKoreksi} : u));
    setSelectedSantri({...selectedSantri, saldo_awal: saldoKoreksi});
    showToast('Dihapus! Saldo sudah diperbaiki.');
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <h3 className="text-lg font-semibold mb-6 flex items-center text-amber-700">
          <DollarSign className="mr-2"/> Input & Riwayat Tabungan
        </h3>
        {santriList.length === 0 ? (
          <div className="p-6 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-sm">
            Belum ada data santri.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
              <h4 className="text-xs font-semibold text-slate-700 mb-3 border-b pb-2 uppercase">Daftar Santri</h4>
              <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
                {santriList.map(s => {
                  const saldoBenar = hitungSaldoAktual(s.id);
                  return (
                    <button
                      key={s.id}
                      onClick={() => pilihSantri(s)}
                      className={`w-full p-3 rounded-xl text-left text-sm border transition-all ${
                        selectedSantri?.id === s.id
                          ? 'bg-amber-500 text-white font-medium border-amber-500 shadow'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-amber-50 hover:border-amber-200'
                      }`}
                    >
                      <p className="font-medium">{s.name} {s.jilid ? `(${s.jilid})` : ''}</p>
                      <p className="mt-0.5 opacity-80 text-xs">Saldo: Rp {saldoBenar.toLocaleString('id-ID')}</p>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="md:col-span-2 space-y-6">
              {!selectedSantri ? (
                <div className="p-10 text-center text-slate-400 text-sm italic bg-slate-50 border border-dashed rounded-xl">
                  Klik nama santri untuk melihat saldo & riwayat
                </div>
              ) : (
                <>
                  <div className="bg-amber-50 p-4 rounded-xl border border-amber-200">
                    <p className="text-[11px] text-amber-600 font-medium uppercase">Santri Terpilih</p>
                    <h4 className="font-semibold text-lg mt-0.5">{selectedSantri.name}</h4>
                    <p className="text-sm text-slate-600 mt-1">
                      Saldo Aktual: <strong>Rp {hitungSaldoAktual(selectedSantri.id).toLocaleString('id-ID')}</strong>
                    </p>
                  </div>

                  <form onSubmit={handleSubmit} className="space-y-4 bg-slate-50 p-5 rounded-2xl border border-slate-100">
                    <h5 className="font-medium text-sm text-slate-700 border-b pb-2">Input Mutasi Baru</h5>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-medium mb-1 text-slate-600">Tanggal</label>
                        <input type="date" name="date" defaultValue={new Date().toISOString().slice(0,10)} required className="w-full p-2.5 border border-slate-200 rounded-xl text-xs focus:ring-1 focus:ring-amber-400 focus:border-amber-400" />
                      </div>
                      <div>
                        <label className="block text-xs font-medium mb-1 text-slate-600">Jenis</label>
                        <select name="type" className="w-full p-2.5 border border-slate-200 rounded-xl text-xs font-medium focus:ring-1 focus:ring-amber-400 focus:border-amber-400">
                          <option value="setor">Setoran</option>
                          <option value="tarik">Penarikan</option>
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-medium mb-1 text-slate-600">Nominal (Rp)</label>
                      <input type="text" name="amount" min="1000" placeholder="Contoh: 10.000" required className="w-full p-2.5 border border-slate-200 rounded-xl text-xs focus:ring-1 focus:ring-amber-400 focus:border-amber-400" onInput={(e)=>{e.target.value=e.target.value.replace(/\D/g,'');e.target.value=e.target.value?Number(e.target.value).toLocaleString('id-ID'):''}} />
                    </div>
                    <div>
                      <label className="block text-xs font-medium mb-1 text-slate-600">Keterangan</label>
                      <input type="text" name="description" placeholder="Opsional" className="w-full p-2.5 border border-slate-200 rounded-xl text-xs focus:ring-1 focus:ring-amber-400 focus:border-amber-400" />
                    </div>
                    <button type="submit" className="w-full bg-amber-500 hover:bg-amber-600 text-white font-medium py-3 rounded-xl text-xs transition-all shadow-sm">
                      Simpan & Sinkronkan
                    </button>
                  </form>

                  <div className="border-t pt-6">
                    <h5 className="text-sm font-medium mb-4 text-slate-800">Riwayat Transaksi</h5>
                    {(() => {
                      const riwayat = savings.filter(i => String(i.santriId) === String(selectedSantri.id));
                      if (riwayat.length === 0) return <p className="text-sm text-slate-400 italic">Belum ada riwayat.</p>;
                      return (
                        <div className="overflow-x-auto">
                          <table className="w-full text-xs">
                            <thead className="bg-slate-50 font-medium text-slate-600 uppercase">
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
                                <tr key={r.id||i} className="border-b border-slate-100 hover:bg-slate-50">
                                  <td className="p-2">{r.date}</td>
                                  <td className="p-2">
                                    <span className={`px-2 py-0.5 rounded-full font-medium ${r.type==='setor'?'bg-emerald-100 text-emerald-700':'bg-rose-100 text-rose-700'}`}>
                                      {r.type==='setor'?'Setoran':'Penarikan'}
                                    </span>
                                  </td>
                                  <td className="p-2">{r.description||'-'}</td>
                                  <td className="p-2 text-right font-medium">Rp {Number(r.amount).toLocaleString('id-ID')}</td>
                                  <td className="p-2 text-center">
                                    <button onClick={() => hapusTransaksi(r)} className="text-rose-500 hover:text-rose-700 transition-colors"><Trash2 size={14}/></button>
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

// ==============================
// COMPONENT: SANTRI VIEW
// ==============================
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
    { id: 'persetujuan_wali', label: progresMenungguAcc.length > 0 ? `Persetujuan Wali (${progresMenungguAcc.length})` : 'Persetujuan Wali', icon: CheckSquare, color: progresMenungguAcc.length > 0 ? 'bg-rose-50 text-rose-600' : 'bg-blue-50 text-blue-600' },
    { id: 'progres_mengaji', label: 'Progres Mengaji', icon: BookOpen, color: 'bg-emerald-50 text-emerald-600' },
    { id: 'riwayat_pembayaran', label: 'Riwayat Pembayaran', icon: CreditCard, color: 'bg-indigo-50 text-indigo-600' },
    { id: 'riwayat_tabungan', label: 'Riwayat Tabungan', icon: DollarSign, color: 'bg-amber-50 text-amber-600' }
  ];

  if (activeTab === 'dashboard') return (
    <div className="space-y-6">
      <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl p-6 text-white shadow-md">
        <p className="text-xs font-medium text-emerald-100 uppercase tracking-wider">Profil Santri</p>
        <h2 className="text-2xl font-bold mt-1">{user.name}</h2>
        <div className="grid grid-cols-2 gap-4 mt-6 border-t border-emerald-400/30 pt-4 text-xs">
          <div><p className="text-emerald-100">Tingkatan</p><p className="text-base font-semibold mt-0.5">{user.jilid || 'Jilid 1'}</p></div>
          <div><p className="text-emerald-100">Saldo Tabungan</p><p className="text-base font-semibold mt-0.5">Rp {currentBalance.toLocaleString('id-ID')}</p></div>
        </div>
      </div>

      {user.hasAlarm && (
        <div className="bg-rose-50 border border-rose-200 p-5 rounded-2xl flex items-start space-x-3">
          <AlertTriangle className="w-5 h-5 text-rose-500 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-rose-800 text-sm">⚠️ Ada Tagihan Belum Lunas!</h3>
            <p className="text-xs text-rose-600 mt-1">Segera lunasi ke bendahara agar akses tidak terhambat.</p>
            <button onClick={() => setActiveTab('riwayat_pembayaran')} className="mt-3 bg-rose-500 hover:bg-rose-600 text-white text-xs font-medium px-4 py-2 rounded-xl transition-all">Lihat Detail</button>
          </div>
        </div>
      )}

      {activeWeekendNotification && (
        <div className="bg-amber-50 border border-amber-200 p-5 rounded-2xl flex items-start space-x-3">
          <Bell className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-amber-800 text-sm">Verifikasi Mingguan Diperlukan</h3>
            <p className="text-xs text-amber-600 mt-1">Konfirmasi belajar mandiri mingguan.</p>
            <button onClick={async () => { const updated = users.map(u => String(u.id) === String(user.id) ? { ...u, lastAccDate: new Date().toISOString() } : u); await updateTable('users', updated); showToast('Terkonfirmasi!'); }} className="mt-3 bg-amber-500 hover:bg-amber-600 text-white text-xs font-medium px-4 py-2 rounded-xl transition-all">Konfirmasi Sekarang</button>
          </div>
        </div>
      )}

      <MenuGrid menus={menus} onSelect={setActiveTab} />

      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <h3 className="font-semibold text-slate-800 text-sm mb-4 flex items-center"><Award className="mr-2 text-emerald-500"/> Target Kompetensi</h3>
        {myTargets.length === 0 ? <p className="text-xs text-slate-400 italic">Belum ada target untuk jilid ini.</p> : (
          <div className="space-y-2">
            {myTargets.map(t => {
              const isCompleted = user.completedTargets && user.completedTargets.includes(String(t.id));
              return (
                <div key={t.id} className="flex items-center space-x-3 p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs">
                  {isCompleted ? <CheckCircle className="w-5 h-5 text-emerald-500 flex-shrink-0" /> : <div className="w-5 h-5 rounded-full border-2 border-slate-300 flex-shrink-0" />}
                  <span className={`font-medium ${isCompleted ? 'text-slate-400 line-through' : 'text-slate-700'}`}>{t.description}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );

  if (activeTab === 'progres_mengaji') return (
    <div className="space-y-6">
      <BackButton onClick={() => setActiveTab('dashboard')} />
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <h3 className="font-semibold text-slate-800 mb-4">Riwayat Setoran Mengaji</h3>
        {semuaProgresSaya.length === 0 ? <p className="text-xs text-slate-400 italic">Belum ada riwayat.</p> : (
          <div className="space-y-3">
            {semuaProgresSaya.map(p => (
              <div key={p.id} className={`p-4 rounded-xl border ${p.status === 'belum_disetujui' ? 'bg-amber-50 border-amber-200' : 'bg-emerald-50 border-emerald-200'}`}>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${p.status === 'belum_disetujui' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>
                  {p.status === 'belum_disetujui' ? 'Menunggu ACC' : 'Sudah Disetujui'}
                </span>
                <p className="font-medium mt-2">{p.surah} ayat {p.ayat} · {p.nilai}</p>
                <p className="text-xs text-slate-500 mt-1">Tanggal: {p.date}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  if (activeTab === 'riwayat_pembayaran') return (
    <div className="space-y-6">
      <BackButton onClick={() => setActiveTab('dashboard')} />
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <h2 className="text-lg font-semibold mb-4 flex items-center text-indigo-700"><CreditCard className="mr-2"/> Riwayat Pembayaran</h2>
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 mb-6 flex items-center">
          {user.hasAlarm ? (<><AlertTriangle className="text-rose-500 w-5 h-5 mr-2"/><span className="text-rose-700 font-medium">Ada Tagihan Belum Dibayar</span></>) : (<><CheckCircle className="text-emerald-500 w-5 h-5 mr-2"/><span className="text-emerald-700 font-medium">Lunas</span></>)}
        </div>
        <h3 className="font-medium text-sm text-slate-700 mb-3 uppercase">Riwayat</h3>
        {(!user.historyBayar || user.historyBayar.length === 0) ? <p className="text-xs text-slate-400 italic bg-slate-50 p-4 rounded-xl text-center">Belum ada riwayat.</p> : (
          <div className="space-y-2">
            {user.historyBayar.map((date, idx) => (
              <div key={idx} className="p-3 bg-emerald-50 border border-emerald-100 rounded-xl flex justify-between items-center text-xs">
                <span className="font-medium text-emerald-800">Pembayaran Syahriah</span>
                <span className="text-slate-600">Tanggal: {date}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  if (activeTab === 'riwayat_tabungan') return (
    <div className="space-y-6">
      <BackButton onClick={() => setActiveTab('dashboard')} />
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-100"><p className="text-[10px] text-slate-400 uppercase">Total Masuk</p><h3 className="text-lg font-semibold text-emerald-600 mt-1">Rp {totalDeposit.toLocaleString('id-ID')}</h3></div>
        <div className="bg-white p-5 rounded-2xl border border-slate-100"><p className="text-[10px] text-slate-400 uppercase">Total Keluar</p><h3 className="text-lg font-semibold text-rose-600 mt-1">Rp {totalWithdraw.toLocaleString('id-ID')}</h3></div>
        <div className="bg-white p-5 rounded-2xl border border-slate-100"><p className="text-[10px] text-slate-400 uppercase">Saldo</p><h3 className="text-lg font-semibold text-blue-600 mt-1">Rp {currentBalance.toLocaleString('id-ID')}</h3></div>
      </div>
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <h2 className="text-base font-semibold mb-4 flex items-center text-amber-700"><DollarSign className="mr-2"/> Riwayat Mutasi</h2>
        {mySavings.length === 0 ? <p className="text-xs text-slate-400 italic text-center py-4">Belum ada data.</p> : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-slate-50 font-medium text-slate-600 uppercase">
                <tr><th className="p-3 text-left">Tanggal</th><th className="p-3 text-left">Jenis</th><th className="p-3 text-left">Nominal</th><th className="p-3 text-left">Keterangan</th></tr>
              </thead>
              <tbody>
                {mySavings.map(s => (
                  <tr key={s.id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="p-3 font-medium">{s.date}</td>
                    <td className="p-3"><span className={`px-2 py-0.5 rounded text-[10px] font-medium ${s.type === 'setor' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>{s.type === 'setor' ? 'Setoran' : 'Penarikan'}</span></td>
                    <td className="p-3 font-medium">Rp {s.amount.toLocaleString('id-ID')}</td>
                    <td className="p-3 text-slate-500">{s.description || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );

  if (activeTab === 'persetujuan_wali') {
    const setujuiSemua = async () => {
      await updateTable('progress', progress.map(p => String(p.santriId) === String(user.id) && p.status === 'belum_disetujui' ? { ...p, status: 'disetujui_wali' } : p));
      showToast('Semua sudah disetujui!');
    };
    return (
      <div className="space-y-6">
        <BackButton onClick={() => setActiveTab('dashboard')} />
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <h2 className="text-lg font-semibold mb-4">Persetujuan Setoran</h2>
          {progresMenungguAcc.length === 0 ? <p className="text-center text-emerald-600 font-medium py-10">✅ Semua sudah disetujui!</p> : (
            <>
              <button onClick={setujuiSemua} className="w-full bg-blue-500 hover:bg-blue-600 text-white font-medium py-3 rounded-xl mb-4 transition-all">Setujui Semua</button>
              <div className="space-y-3">
                {progresMenungguAcc.map(p => (
                  <div key={p.id} className="p-4 bg-amber-50 rounded-xl border border-amber-200">
                    <p className="font-medium">{p.surah} ayat {p.ayat} · {p.nilai}</p>
                    <p className="text-xs text-slate-500 mt-1">Tanggal: {p.date}</p>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    );
  }
  return null;
}

// ==============================
// COMPONENT: GURU VIEW
// ==============================
function GuruView({ activeTab, setActiveTab, user, users, setUsers, progress, targets, savings, settings, updateTable, showToast }) {
  const [selectedSantri, setSelectedSantri] = useState(null);
  const activeSantriList = users.filter(u => u.role === 'santri' && String(u.guruId) === String(user.id));
  const isSavingAuthorized = settings.savingInputRoles?.includes(user.role);

  const menus = [
    { id: 'isi_progres', label: 'Input Setoran', icon: ClipboardList, color: 'bg-emerald-50 text-emerald-600' },
    { id: 'nilai_target', label: 'Penilaian Target', icon: CheckSquare, color: 'bg-indigo-50 text-indigo-600' },
    { id: 'pengajuan_kenaikan', label: 'Ajukan Naik Jilid', icon: Award, color: 'bg-orange-50 text-orange-600' },
    { id: 'klaim_santri', label: 'Klaim Santri', icon: UserPlus, color: 'bg-purple-50 text-purple-600' }
  ];
  if (isSavingAuthorized) menus.push({ id: 'input_tabungan', label: 'Input Tabungan', icon: DollarSign, color: 'bg-amber-50 text-amber-600' });

  if (activeTab === 'dashboard') return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-slate-800">Panel Pengajar: {user.name}</h2>
      <MenuGrid menus={menus} onSelect={setActiveTab} />
    </div>
  );

  if (activeTab === 'input_tabungan') return <div><BackButton onClick={() => setActiveTab('dashboard')} /><SavingsInputView users={users} savings={savings} updateTable={updateTable} showToast={showToast} recorderId={user.id} /></div>;

  if (activeTab === 'isi_progres') return (
    <div className="space-y-6">
      <BackButton onClick={() => setActiveTab('dashboard')} />
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <h2 className="text-lg font-semibold mb-6 flex items-center text-emerald-700"><ClipboardList className="mr-2"/> Input Setoran Harian</h2>
        {activeSantriList.length === 0 ? <div className="p-6 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-sm">Belum ada santri yang dibimbing.</div> : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
              <h3 className="text-xs font-semibold text-slate-700 mb-3 border-b pb-2 uppercase">Daftar Santri</h3>
              <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
                {activeSantriList.map(s => (
                  <button key={s.id} onClick={() => setSelectedSantri(s)} className={`w-full p-3 rounded-xl text-left text-sm border transition-all ${selectedSantri?.id === s.id ? 'bg-emerald-500 text-white font-medium border-emerald-500' : 'bg-white text-slate-700 border-slate-200 hover:bg-emerald-50'}`}>
                    <p className="font-medium">{s.name}</p><p className="mt-0.5 opacity-80 text-xs">Jilid: {s.jilid}</p>
                  </button>
                ))}
              </div>
            </div>
            <div className="md:col-span-2 space-y-6">
              {!selectedSantri ? <div className="p-10 text-center text-slate-400 text-sm italic bg-slate-50 border border-dashed rounded-xl">Pilih santri terlebih dahulu</div> : (
                <>
                  <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-200">
                    <p className="text-[11px] text-emerald-600 font-medium uppercase">Santri Terpilih</p>
                    <h3 className="font-semibold text-lg mt-0.5">{selectedSantri.name}</h3>
                    <p className="text-sm text-slate-600 mt-1">Jilid: {selectedSantri.jilid}</p>
                  </div>
                  <form onSubmit={async (e) => {
                    e.preventDefault();
                    await updateTable('progress', [{ id: Date.now().toString(), santriId: selectedSantri.id, date: e.target.date.value, surah: e.target.surah.value, ayat: e.target.ayat.value, nilai: e.target.nilai.value, status: 'acc_guru', type: 'harian' }, ...progress]);
                    showToast('Tersimpan!'); e.target.reset();
                  }} className="space-y-4 bg-slate-50 p-5 rounded-2xl border border-slate-100">
                    <h4 className="font-medium text-sm text-slate-700 border-b pb-2">Input Setoran Baru</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div><label className="block text-xs font-medium mb-1 text-slate-600">Tanggal</label><input type="date" name="date" defaultValue={new Date().toISOString().slice(0,10)} required className="w-full p-2.5 border border-slate-200 rounded-xl text-xs focus:ring-1 focus:ring-emerald-400" /></div>
                      <div><label className="block text-xs font-medium mb-1 text-slate-600">Nilai</label><select name="nilai" className="w-full p-2.5 border border-slate-200 rounded-xl text-xs font-medium focus:ring-1 focus:ring-emerald-400"><option>A (Sangat Lancar)</option><option>B (Lancar)</option><option>C (Cukup)</option><option>D (Kurang)</option></select></div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div><label className="block text-xs font-medium mb-1 text-slate-600">Surah</label><input type="text" name="surah" required className="w-full p-2.5 border border-slate-200 rounded-xl text-xs focus:ring-1 focus:ring-emerald-400" /></div>
                      <div><label className="block text-xs font-medium mb-1 text-slate-600">Ayat</label><input type="text" name="ayat" required className="w-full p-2.5 border border-slate-200 rounded-xl text-xs focus:ring-1 focus:ring-emerald-400" /></div>
                    </div>
                    <button type="submit" className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-medium py-3 rounded-xl text-xs transition-all">Simpan</button>
                  </form>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );

  // Bagian lain (nilai_target, pengajuan_kenaikan, klaim_santri) disesuaikan dengan gaya yang sama:
  // - Gunakan warna slate, emerald, rose, amber
  // - Padding seragam, border-radius 12-16px
  // - Efek hover halus
  // - Transisi smooth

  return null;
}

// ==============================
// COMPONENT: KEPALA, BENDAHARA, ADMIN VIEW
// ==============================
// Semua komponen sisanya mengikuti pola gaya yang sama persis:
// - Struktur tetap sama, hanya ganti kelas CSS agar tampilan seragam modern
// - Warna utama tetap hijau-emerald, dengan aksen biru, oranye, merah lembut
// - Bayangan ringan, sudut membulat, jarak yang seimbang

function KepalaView(){ /* ...sesuaikan gaya seperti contoh di atas... */ }
function BendaharaView(){ /* ...sesuaikan gaya seperti contoh di atas... */ }
function AdminView(){ /* ...sesuaikan gaya seperti contoh di atas... */ }
// ==============================================
// COMPONENT: GURU VIEW (LENGKAP SEMUA MENU)
// ==============================================
function GuruView({ activeTab, setActiveTab, user, users, setUsers, progress, targets, savings, settings, updateTable, showToast, simulatedWeekend, setSimulatedWeekend }) {
  const [selectedSantri, setSelectedSantri] = useState(null);
  const activeSantriList = users.filter(u => u.role === 'santri' && String(u.guruId) === String(user.id));
  const isSavingAuthorized = settings.savingInputRoles?.includes(user.role);

  const menus = [
    { id: 'isi_progres', label: 'Input Setoran', icon: ClipboardList, color: 'bg-emerald-50 text-emerald-600' },
    { id: 'nilai_target', label: 'Penilaian Target', icon: CheckSquare, color: 'bg-indigo-50 text-indigo-600' },
    { id: 'pengajuan_kenaikan', label: 'Ajukan Naik Jilid', icon: Award, color: 'bg-orange-50 text-orange-600' },
    { id: 'klaim_santri', label: 'Klaim Santri', icon: UserPlus, color: 'bg-purple-50 text-purple-600' }
  ];
  if (isSavingAuthorized) menus.push({ id: 'input_tabungan', label: 'Input Tabungan', icon: DollarSign, color: 'bg-amber-50 text-amber-600' });

  if (activeTab === 'dashboard') return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <h2 className="text-xl font-semibold text-slate-800">Panel Pengajar: {user.name}</h2>
        <p className="text-sm text-slate-500 mt-1">Mengelola {activeSantriList.length} santri bimbingan</p>
      </div>
      <MenuGrid menus={menus} onSelect={setActiveTab} />
    </div>
  );

  if (activeTab === 'input_tabungan') return (
    <div className="space-y-6">
      <BackButton onClick={() => setActiveTab('dashboard')} />
      <SavingsInputView users={users} savings={savings} updateTable={updateTable} showToast={showToast} recorderId={user.id} />
    </div>
  );

  if (activeTab === 'isi_progres') return (
    <div className="space-y-6">
      <BackButton onClick={() => setActiveTab('dashboard')} />
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <h2 className="text-lg font-semibold mb-6 flex items-center text-emerald-700">
          <ClipboardList className="mr-2"/> Input Setoran Harian
        </h2>
        {activeSantriList.length === 0 ? (
          <div className="p-6 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-sm">
            Belum ada santri yang dibimbing. Silakan klaim santri terlebih dahulu.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
              <h3 className="text-xs font-semibold text-slate-700 mb-3 border-b pb-2 uppercase">Daftar Santri</h3>
              <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
                {activeSantriList.map(s => (
                  <button
                    key={s.id}
                    onClick={() => setSelectedSantri(s)}
                    className={`w-full p-3 rounded-xl text-left text-sm border transition-all ${
                      selectedSantri?.id === s.id
                        ? 'bg-emerald-500 text-white font-medium border-emerald-500'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-emerald-50'
                    }`}
                  >
                    <p className="font-medium">{s.name}</p>
                    <p className="mt-0.5 opacity-80 text-xs">Jilid: {s.jilid}</p>
                  </button>
                ))}
              </div>
            </div>
            <div className="md:col-span-2 space-y-6">
              {!selectedSantri ? (
                <div className="p-10 text-center text-slate-400 text-sm italic bg-slate-50 border border-dashed rounded-xl">
                  Pilih santri terlebih dahulu
                </div>
              ) : (
                <>
                  <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-200">
                    <p className="text-[11px] text-emerald-600 font-medium uppercase">Santri Terpilih</p>
                    <h3 className="font-semibold text-lg mt-0.5">{selectedSantri.name}</h3>
                    <p className="text-sm text-slate-600 mt-1">Jilid: {selectedSantri.jilid}</p>
                  </div>
                  <form onSubmit={async (e) => {
                    e.preventDefault();
                    const baru = {
                      id: Date.now().toString(),
                      santriId: selectedSantri.id,
                      date: e.target.date.value,
                      surah: e.target.surah.value,
                      ayat: e.target.ayat.value,
                      nilai: e.target.nilai.value,
                      status: 'acc_guru',
                      type: 'harian'
                    };
                    await updateTable('progress', [baru, ...progress]);
                    showToast('Setoran berhasil disimpan!');
                    e.target.reset();
                  }} className="space-y-4 bg-slate-50 p-5 rounded-2xl border border-slate-100">
                    <h4 className="font-medium text-sm text-slate-700 border-b pb-2">Input Setoran Baru</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-medium mb-1 text-slate-600">Tanggal</label>
                        <input type="date" name="date" defaultValue={new Date().toISOString().slice(0,10)} required className="w-full p-2.5 border border-slate-200 rounded-xl text-xs focus:ring-1 focus:ring-emerald-400" />
                      </div>
                      <div>
                        <label className="block text-xs font-medium mb-1 text-slate-600">Nilai</label>
                        <select name="nilai" className="w-full p-2.5 border border-slate-200 rounded-xl text-xs font-medium focus:ring-1 focus:ring-emerald-400">
                          <option>A (Sangat Lancar)</option>
                          <option>B (Lancar)</option>
                          <option>C (Cukup)</option>
                          <option>D (Kurang)</option>
                        </select>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-medium mb-1 text-slate-600">Surah</label>
                        <input type="text" name="surah" required className="w-full p-2.5 border border-slate-200 rounded-xl text-xs focus:ring-1 focus:ring-emerald-400" />
                      </div>
                      <div>
                        <label className="block text-xs font-medium mb-1 text-slate-600">Ayat / Halaman</label>
                        <input type="text" name="ayat" required className="w-full p-2.5 border border-slate-200 rounded-xl text-xs focus:ring-1 focus:ring-emerald-400" />
                      </div>
                    </div>
                    <button type="submit" className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-medium py-3 rounded-xl text-xs transition-all">
                      Simpan Setoran
                    </button>
                  </form>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );

  if (activeTab === 'nilai_target') return (
    <div className="space-y-6">
      <BackButton onClick={() => setActiveTab('dashboard')} />
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <h2 className="text-lg font-semibold mb-6 flex items-center text-indigo-700">
          <CheckSquare className="mr-2"/> Penilaian Target Kompetensi
        </h2>
        {activeSantriList.length === 0 ? (
          <div className="p-6 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-sm">Belum ada santri bimbingan.</div>
        ) : (
          <div className="space-y-4">
            {activeSantriList.map(s => {
              const targetJilid = targets.filter(t => t.level === s.jilid);
              return (
                <div key={s.id} className="border border-slate-200 rounded-xl p-4 bg-slate-50">
                  <div className="flex justify-between items-center mb-3">
                    <div>
                      <p className="font-medium text-slate-800">{s.name}</p>
                      <p className="text-xs text-slate-500">Jilid: {s.jilid}</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    {targetJilid.map(t => {
                      const selesai = s.completedTargets?.includes(String(t.id));
                      return (
                        <label key={t.id} className="flex items-center space-x-3 p-2 bg-white rounded-lg border border-slate-100 cursor-pointer hover:bg-emerald-50 transition-all">
                          <input
                            type="checkbox"
                            checked={selesai || false}
                            onChange={async (e) => {
                              const updateUser = users.map(u => {
                                if (u.id === s.id) {
                                  const baru = e.target.checked
                                    ? [...(u.completedTargets||[]), String(t.id)]
                                    : (u.completedTargets||[]).filter(x => x !== String(t.id));
                                  return {...u, completedTargets: baru};
                                }
                                return u;
                              });
                              await updateTable('users', updateUser);
                              showToast('Target diperbarui!');
                            }}
                            className="w-4 h-4 text-emerald-600 rounded"
                          />
                          <span className={`text-xs ${selesai ? 'text-emerald-700 line-through' : 'text-slate-700'}`}>{t.description}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );

  if (activeTab === 'pengajuan_kenaikan') return (
    <div className="space-y-6">
      <BackButton onClick={() => setActiveTab('dashboard')} />
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <h2 className="text-lg font-semibold mb-6 flex items-center text-orange-700">
          <Award className="mr-2"/> Pengajuan Kenaikan Jilid
        </h2>
        {activeSantriList.length === 0 ? (
          <div className="p-6 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-sm">Belum ada santri bimbingan.</div>
        ) : (
          <div className="space-y-3">
            {activeSantriList.map(s => {
              const idxSekarang = JILID_LEVELS.indexOf(s.jilid);
              const jilidSelanjutnya = idxSekarang < JILID_LEVELS.length - 1 ? JILID_LEVELS[idxSekarang + 1] : null;
              return (
                <div key={s.id} className="p-4 bg-white border border-slate-200 rounded-xl flex justify-between items-center">
                  <div>
                    <p className="font-medium">{s.name}</p>
                    <p className="text-xs text-slate-500">Saat ini: {s.jilid}</p>
                  </div>
                  {jilidSelanjutnya ? (
                    <button
                      onClick={async () => {
                        if(confirm(`Yakin ajukan ${s.name} naik ke ${jilidSelanjutnya}?`)){
                          const ubah = users.map(u => u.id === s.id ? {...u, jilid: jilidSelanjutnya} : u);
                          await updateTable('users', ubah);
                          showToast(`Berhasil diajukan naik ke ${jilidSelanjutnya}!`);
                        }
                      }}
                      className="bg-orange-500 hover:bg-orange-600 text-white text-xs px-3 py-1.5 rounded-lg transition-all"
                    >
                      Ajukan ke {jilidSelanjutnya}
                    </button>
                  ) : <span className="text-xs text-emerald-600 font-medium">Sudah Tamat</span>}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );

  if (activeTab === 'klaim_santri') return (
    <div className="space-y-6">
      <BackButton onClick={() => setActiveTab('dashboard')} />
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <h2 className="text-lg font-semibold mb-6 flex items-center text-purple-700">
          <UserPlus className="mr-2"/> Klaim Santri Bimbingan
        </h2>
        <div className="space-y-3">
          {users.filter(u => u.role === 'santri' && !u.guruId).map(s => (
            <div key={s.id} className="p-4 bg-white border border-slate-200 rounded-xl flex justify-between items-center">
              <div>
                <p className="font-medium">{s.name}</p>
                <p className="text-xs text-slate-500">Jilid: {s.jilid}</p>
              </div>
              <button
                onClick={async () => {
                  const ubah = users.map(u => u.id === s.id ? {...u, guruId: user.id} : u);
                  await updateTable('users', ubah);
                  showToast('Santri berhasil diklaim!');
                }}
                className="bg-purple-500 hover:bg-purple-600 text-white text-xs px-3 py-1.5 rounded-lg transition-all"
              >
                Klaim
              </button>
            </div>
          ))}
          {users.filter(u => u.role === 'santri' && !u.guruId).length === 0 && (
            <p className="text-center text-slate-400 text-sm py-6">Semua santri sudah memiliki pembimbing.</p>
          )}
        </div>
      </div>
    </div>
  );

  return null;
}

// ==============================================
// COMPONENT: KEPALA TPQ VIEW (LENGKAP)
// ==============================================
function KepalaView({ activeTab, setActiveTab, user, users, setUsers, progress, targets, savings, settings, updateTable, showToast, appsScriptUrl, setAppsScriptUrl, loadDatabase, isSyncing }) {
  const menus = [
    { id: 'daftar_santri', label: 'Daftar Santri', icon: Users, color: 'bg-blue-50 text-blue-600' },
    { id: 'daftar_guru', label: 'Daftar Pengajar', icon: User, color: 'bg-emerald-50 text-emerald-600' },
    { id: 'laporan_progres', label: 'Laporan Mengaji', icon: TrendingUp, color: 'bg-indigo-50 text-indigo-600' },
    { id: 'pengaturan', label: 'Pengaturan', icon: Settings, color: 'bg-slate-50 text-slate-600' }
  ];

  if (activeTab === 'dashboard') return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <h2 className="text-xl font-semibold text-slate-800">Panel Kepala TPQ</h2>
        <p className="text-sm text-slate-500 mt-1">{settings.tpqName}</p>
      </div>
      <MenuGrid menus={menus} onSelect={setActiveTab} />
    </div>
  );

  if (activeTab === 'daftar_santri') return (
    <div className="space-y-6">
      <BackButton onClick={() => setActiveTab('dashboard')} />
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <h2 className="text-lg font-semibold mb-4">Daftar Seluruh Santri</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-slate-50 text-slate-600 uppercase">
              <tr>
                <th className="p-3 text-left">Nama</th>
                <th className="p-3 text-left">Jilid</th>
                <th className="p-3 text-left">Guru</th>
                <th className="p-3 text-left">Status</th>
              </tr>
            </thead>
            <tbody>
              {users.filter(u => u.role === 'santri').map(s => (
                <tr key={s.id} className="border-b border-slate-100">
                  <td className="p-3 font-medium">{s.name}</td>
                  <td className="p-3">{s.jilid}</td>
                  <td className="p-3">{users.find(g => g.id === s.guruId)?.name || '-'}</td>
                  <td className="p-3">{s.hasAlarm ? <span className="text-rose-600">Tagihan</span> : <span className="text-emerald-600">Aktif</span>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  if (activeTab === 'daftar_guru') return (
    <div className="space-y-6">
      <BackButton onClick={() => setActiveTab('dashboard')} />
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <h2 className="text-lg font-semibold mb-4">Daftar Pengajar</h2>
        <div className="space-y-2">
          {users.filter(u => u.role === 'guru' || u.role === 'kepala_tpq').map(g => (
            <div key={g.id} className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex justify-between items-center">
              <span className="font-medium">{g.name}</span>
              <span className="text-xs text-slate-500">{getRoleName(g.role)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  if (activeTab === 'laporan_progres') return (
    <div className="space-y-6">
      <BackButton onClick={() => setActiveTab('dashboard')} />
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <h2 className="text-lg font-semibold mb-4">Laporan Keseluruhan</h2>
        <p className="text-sm text-slate-500">Total setoran: {progress.length}</p>
        <p className="text-sm text-slate-500">Total santri: {users.filter(u => u.role === 'santri').length}</p>
      </div>
    </div>
  );

  if (activeTab === 'pengaturan') return (
    <div className="space-y-6">
      <BackButton onClick={() => setActiveTab('dashboard')} />
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <h2 className="text-lg font-semibold mb-4">Pengaturan Sistem</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium mb-1">URL Apps Script</label>
            <input
              type="text"
              value={appsScriptUrl}
              onChange={(e) => setAppsScriptUrl(e.target.value)}
              className="w-full p-2.5 border border-slate-200 rounded-xl text-xs"
            />
            <button onClick={() => {localStorage.setItem('tpq_apps_script_url', appsScriptUrl); showToast('URL tersimpan!');}} className="mt-2 bg-slate-600 hover:bg-slate-700 text-white px-3 py-1.5 rounded-lg text-xs">Simpan URL</button>
          </div>
          <button onClick={() => loadDatabase()} disabled={isSyncing} className="w-full bg-blue-500 hover:bg-blue-600 text-white py-2.5 rounded-xl text-xs font-medium flex items-center justify-center">
            <RefreshCw className={`w-4 h-4 mr-2 ${isSyncing ? 'animate-spin' : ''}`} />
            {isSyncing ? 'Menyinkronkan...' : 'Sinkronkan Data'}
          </button>
        </div>
      </div>
    </div>
  );

  return null;
}

// ==============================================
// COMPONENT: BENDAHARA VIEW (LENGKAP)
// ==============================================
function BendaharaView({ activeTab, setActiveTab, users, savings, settings, updateTable, showToast, currentUser }) {
  const menus = [
    { id: 'input_tabungan', label: 'Kelola Tabungan', icon: DollarSign, color: 'bg-amber-50 text-amber-600' },
    { id: 'laporan_keuangan', label: 'Laporan Keuangan', icon: TrendingUp, color: 'bg-emerald-50 text-emerald-600' },
    { id: 'pembayaran_syahriah', label: 'Pembayaran Syahriah', icon: CreditCard, color: 'bg-indigo-50 text-indigo-600' }
  ];

  if (activeTab === 'dashboard') return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <h2 className="text-xl font-semibold text-slate-800">Panel Bendahara</h2>
      </div>
      <MenuGrid menus={menus} onSelect={setActiveTab} />
    </div>
  );

  if (activeTab === 'input_tabungan') return (
    <div className="space-y-6">
      <BackButton onClick={() => setActiveTab('dashboard')} />
      <SavingsInputView users={users} savings={savings} updateTable={updateTable} showToast={showToast} recorderId={currentUser.id} />
    </div>
  );

  if (activeTab === 'laporan_keuangan') return (
    <div className="space-y-6">
      <BackButton onClick={() => setActiveTab('dashboard')} />
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <h2 className="text-lg font-semibold mb-4">Laporan Keseluruhan Tabungan</h2>
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-emerald-50 p-4 rounded-xl text-center">
            <p className="text-xs text-emerald-600">Total Setoran</p>
            <p className="font-semibold text-emerald-700 mt-1">Rp {savings.filter(s=>s.type==='setor').reduce((a,b)=>a+b.amount,0).toLocaleString('id-ID')}</p>
          </div>
          <div className="bg-rose-50 p-4 rounded-xl text-center">
            <p className="text-xs text-rose-600">Total Penarikan</p>
            <p className="font-semibold text-rose-700 mt-1">Rp {savings.filter(s=>s.type==='tarik').reduce((a,b)=>a+b.amount,0).toLocaleString('id-ID')}</p>
          </div>
          <div className="bg-blue-50 p-4 rounded-xl text-center">
            <p className="text-xs text-blue-600">Total Saldo</p>
            <p className="font-semibold text-blue-700 mt-1">Rp {savings.reduce((a,b)=>b.type==='setor'?a+b.amount:a-b.amount,0).toLocaleString('id-ID')}</p>
          </div>
        </div>
      </div>
    </div>
  );

  if (activeTab === 'pembayaran_syahriah') return (
    <div className="space-y-6">
      <BackButton onClick={() => setActiveTab('dashboard')} />
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <h2 className="text-lg font-semibold mb-4">Pembayaran Syahriah</h2>
        <div className="space-y-2">
          {users.filter(u => u.role === 'santri').map(s => (
            <div key={s.id} className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex justify-between items-center">
              <div>
                <p className="font-medium">{s.name}</p>
                <p className="text-xs text-slate-500">Terakhir: {s.historyBayar[s.historyBayar.length-1] || 'Belum Pernah'}</p>
              </div>
              <button
                onClick={async () => {
                  const ubah = users.map(u => u.id === s.id ? {...u, historyBayar: [...(u.historyBayar||[]), new Date().toISOString().slice(0,10)], hasAlarm: false} : u);
                  await updateTable('users', ubah);
                  showToast('Pembayaran dicatat!');
                }}
                className="bg-indigo-500 hover:bg-indigo-600 text-white text-xs px-3 py-1.5 rounded-lg"
              >
                Catat Bayar
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  return null;
}

// ==============================================
// COMPONENT: ADMIN VIEW (LENGKAP)
// ==============================================
function AdminView({ activeTab, setActiveTab, users, updateTable, showToast, settings, appsScriptUrl, setAppsScriptUrl, loadDatabase }) {
  const menus = [
    { id: 'kelola_pengguna', label: 'Kelola Pengguna', icon: Users, color: 'bg-slate-50 text-slate-700' },
    { id: 'pengaturan_sistem', label: 'Pengaturan', icon: Settings, color: 'bg-slate-50 text-slate-700' }
  ];

  if (activeTab === 'dashboard') return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <h2 className="text-xl font-semibold text-slate-800">Panel Administrator</h2>
      </div>
      <MenuGrid menus={menus} onSelect={setActiveTab} />
    </div>
  );

  if (activeTab === 'kelola_pengguna') return (
    <div className="space-y-6">
      <BackButton onClick={() => setActiveTab('dashboard')} />
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <h2 className="text-lg font-semibold mb-4">Daftar Seluruh Pengguna</h2>
        <div className="space-y-2">
          {users.map(u => (
            <div key={u.id} className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex justify-between items-center">
              <div>
                <p className="font-medium">{u.name}</p>
                <p className="text-xs text-slate-500">@{u.username} · {getRoleName(u.role)}</p>
              </div>
              <button onClick={() => {if(confirm('Hapus pengguna ini?')){updateTable('users', users.filter(x=>x.id!==u.id)); showToast('Terhapus!');}}} className="text-rose-500 hover:text-rose-700"><Trash2 size={16}/></button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  if (activeTab === 'pengaturan_sistem') return (
    <div className="space-y-6">
      <BackButton onClick={() => setActiveTab('dashboard')} />
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <h2 className="text-lg font-semibold mb-4">Pengaturan Sistem</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium mb-1">Nama TPQ</label>
            <input type="text" value={settings.tpqName} onChange={(e)=>setSettings({...settings, tpqName:e.target.value})} className="w-full p-2.5 border border-slate-200 rounded-xl text-xs" />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1">URL Apps Script</label>
            <input type="text" value={appsScriptUrl} onChange={(e)=>setAppsScriptUrl(e.target.value)} className="w-full p-2.5 border border-slate-200 rounded-xl text-xs" />
          </div>
          <button onClick={() => {localStorage.setItem('tpq_apps_script_url', appsScriptUrl); updateTable('settings', settings); showToast('Pengaturan tersimpan!');}} className="w-full bg-slate-700 hover:bg-slate-800 text-white py-2.5 rounded-xl text-xs font-medium">Simpan Pengaturan</button>
          <button onClick={() => loadDatabase()} className="w-full bg-blue-500 hover:bg-blue-600 text-white py-2.5 rounded-xl text-xs font-medium">Sinkronkan Ulang</button>
        </div>
      </div>
    </div>
  );

  return null;
}
