import React, { useState, useEffect } from 'react';
import { 
  User, Lock, Shield, Book, BookOpen, CheckCircle, 
  AlertTriangle, Users, LogOut, CreditCard, Bell, Plus, 
  Trash2, Check, X, UserPlus, Info, Edit, ArrowLeft, 
  Eye, EyeOff, Award, ClipboardList, Settings, DollarSign, 
  CheckSquare, RefreshCw, Database, Copy, Unlock,
  ChevronDown, ChevronUp, TrendingUp, TrendingDown, Search,
  UserMinus, Send
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
    { id: '4', username: 'guru2', password: '123', role: 'guru', name: 'Ust. Budi' },
    { id: '5', username: 'bendahara', password: '123', role: 'bendahara', name: 'Bpk. Ahmad' },
    { id: '6', username: 'santri1', password: '123', role: 'santri', name: 'Muhammad Rafif', guruId: '3', jilid: 'Jilid 1', hasAlarm: false, lastAccDate: '', completedTargets: [], historyBayar: ['2026-07-10'] },
    { id: '7', username: 'santri2', password: '123', role: 'santri', name: 'Fatimah Az-Zahra', guruId: null, jilid: 'Jilid 2', hasAlarm: true, lastAccDate: '', completedTargets: [], historyBayar: [] }
  ],
  progress: [
    { id: '1', santriId: '6', date: '2026-07-15', surah: 'An-Nas', ayat: '1-6', nilai: 'A (Sangat Lancar)', status: 'acc_guru', type: 'harian' }
  ],
  targets: [
    { id: '1', level: 'Jilid 1', description: 'Mengenal makhraj huruf hijaiyah tunggal fathah Alif s.d Ya' },
    { id: '2', level: 'Jilid 1', description: 'Mampu membaca harakat fathah pendek sambung dua huruf' },
    { id: '3', level: 'Jilid 2', description: 'Membaca mad thabi\'i harakat fathah panjang dua ketukan' },
    { id: '4', level: 'PSQ 1-2 (Juz 1)', description: 'Tartil membaca surah Al-Baqarah ayat 1-100 dengan tajwid benar' },
    { id: '5', level: 'PSQ 9-10 (Juz 21-30)', description: 'Hafal lancar Surah An-Naba s.d An-Naziat' }
  ],
  savings: [
    { id: 's1', santriId: '6', date: '2026-07-10', amount: 50000, type: 'setor', description: 'Setoran Awal Mandiri', inputBy: '1' }
  ],
  settings: { 
    tpqName: 'TPQ Al-Ikhlas Bakalan', 
    logoUrl: '',
    savingInputRoles: ['guru', 'bendahara']
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
    } catch (e) {
      console.error("Error parsing completedTargets", e);
    }

    let history = [];
    let rawHistory = getProp(u, ['historyBayar', 'historybayar', 'riwayat_bayar', 'history_bayar']);
    try {
      if (Array.isArray(rawHistory)) {
        history = rawHistory.map(String);
      } else if (typeof rawHistory === 'string' && rawHistory.trim() !== '') {
        const parsed = JSON.parse(rawHistory);
        history = Array.isArray(parsed) ? parsed.map(String) : [];
      }
    } catch (e) {
      console.error("Error parsing historyBayar", e);
    }

    let finalGuruId = null;
    let rawGuruId = getProp(u, ['guruId', 'guruid', 'guru_id', 'wali_kelas', 'walikelas']);
    if (rawGuruId !== undefined && rawGuruId !== null) {
      const guruIdStr = String(rawGuruId).trim();
      if (guruIdStr !== "" && guruIdStr !== "null" && guruIdStr !== "undefined") {
        finalGuruId = guruIdStr;
      }
    }

    let finalJilid = undefined;
    let rawRole = getProp(u, ['role', 'Role', 'peran', 'status_akses'], '');
    const roleStr = String(rawRole).trim().toLowerCase();
    
    if (roleStr === 'santri') {
      finalJilid = 'Jilid 1';
      let rawJilid = getProp(u, ['jilid', 'Jid', 'jid', 'JID', 'Jilid', 'tingkatan', 'kelas']);
      if (rawJilid !== undefined && rawJilid !== null) {
        const jilidStr = String(rawJilid).trim();
        if (jilidStr !== "" && jilidStr !== "null" && jilidStr !== "undefined") {
          finalJilid = jilidStr;
        }
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
    if (!idStr) return;

    if (seenIds.has(idStr)) return;
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
    if (!idStr) return;

    if (seenIds.has(idStr)) return;
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
    if (!idStr) return;

    if (seenIds.has(idStr)) return;
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
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : fallback;
  } catch (e) {
    console.error("Error reading localStorage key:", key, e);
    return fallback;
  }
};

const getRoleName = (role) => {
  const roles = {
    'admin': 'Admin System',
    'kepala_tpq': 'Kepala TPQ',
    'guru': 'Guru Ngaji',
    'bendahara': 'Bendahara',
    'santri': 'Santri / Wali'
  };
  return roles[role] || role;
};

// ==================================================================
// ✅ ATURAN 2: LOGIKA WAKTU ACC SABTU 18:00 WIB
// ==================================================================
const getLastSaturday18WIB = (now = new Date()) => {
  const nowWIB = new Date(now.getTime() + (7 * 60 - now.getTimezoneOffset()) * 60000);
  const day = nowWIB.getDay();
  const hour = nowWIB.getHours();

  let sabtuIni = new Date(nowWIB);
  sabtuIni.setDate(nowWIB.getDate() + ((6 - day + 7) % 7));
  sabtuIni.setHours(18, 0, 0, 0);

  if (day === 6 && hour < 18) sabtuIni.setDate(sabtuIni.getDate() - 7);

  return new Date(sabtuIni.getTime() - (7 * 60 - now.getTimezoneOffset()) * 60000);
};

const isAccWindowOpen = (simulatedWeekend = false, now = new Date()) => {
  if (simulatedWeekend) return true;
  const nowWIB = new Date(now.getTime() + (7 * 60 - now.getTimezoneOffset()) * 60000);
  const day = nowWIB.getDay();
  const hour = nowWIB.getHours();
  return (day === 6 && hour >= 18) || (day === 0);
};

const isSantriAccThisWeek = (santri, simulatedWeekend = false) => {
  if (!santri || !santri.lastAccDate) return false;
  const batas = getLastSaturday18WIB();
  try {
    const tglAcc = new Date(santri.lastAccDate);
    return tglAcc >= batas;
  } catch {
    return false;
  }
};
// ==================================================================

const Toast = ({ message, type, onClose }) => {
  if (!message) return null;
  const bgColor = type === 'error' ? 'bg-red-500' : 'bg-emerald-600';
  return (
    <div className={`fixed top-4 right-4 ${bgColor} text-white px-5 py-3 rounded-xl shadow-2xl flex items-center z-50 animate-bounce`}>
      <span className="mr-2 font-medium text-xs sm:text-sm">{message}</span>
      <button onClick={onClose} className="text-white hover:text-gray-200"><X size={18} /></button>
    </div>
  );
};

const BackButton = ({ onClick }) => (
  <button onClick={onClick} className="mb-6 flex items-center text-emerald-700 hover:text-emerald-950 font-bold bg-emerald-50 hover:bg-emerald-100 px-4 py-2.5 rounded-xl transition duration-200 shadow-sm border border-emerald-100 text-xs sm:text-sm">
    <ArrowLeft size={18} className="mr-2" /> Kembali ke Menu Utama
  </button>
);

const MenuGrid = ({ menus, onSelect }) => (
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in">
    {menus.map(menu => (
      <button 
        key={menu.id} 
        onClick={() => onSelect(menu.id)}
        className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md hover:border-emerald-200 flex flex-col items-center justify-center text-center transition-all duration-300 group relative overflow-hidden w-full text-left sm:text-center"
      >
        <div className="absolute top-0 right-0 w-16 h-16 bg-emerald-50 rounded-full -mr-8 -mt-8 transition-all group-hover:scale-150 opacity-40"></div>
        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-4 transition-transform group-hover:scale-110 shadow-sm ${menu.color}`}>
          <menu.icon className="w-7 h-7" />
        </div>
        <h3 className="font-bold text-gray-800 text-base group-hover:text-emerald-700">{menu.label}</h3>
        {menu.desc && <p className="text-xs text-gray-500 mt-2 line-clamp-2 max-w-xs">{menu.desc}</p>}
      </button>
    ))}
  </div>
);

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

  const [appsScriptUrl, setAppsScriptUrl] = useState(() => {
    return localStorage.getItem('tpq_apps_script_url') || HARDCODED_APPS_SCRIPT_URL;
  });

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

          setUsers(finalUsers);
          setProgress(finalProgress);
          setTargets(finalTargets);
          setSavings(finalSavings);
          if (finalSettings) setSettings(finalSettings);
          
          try {
            localStorage.setItem('tpq_users', JSON.stringify(finalUsers));
            localStorage.setItem('tpq_progress', JSON.stringify(finalProgress));
            localStorage.setItem('tpq_targets', JSON.stringify(finalTargets));
            localStorage.setItem('tpq_savings', JSON.stringify(finalSavings));
            localStorage.setItem('tpq_settings', JSON.stringify(finalSettings));
          } catch (e) { console.warn("Penyimpanan local storage dibatasi."); }
          
          if (!isInitializing) showToast('Database Google Sheets berhasil disinkronkan!');
        } else {
          throw new Error(payload.message || 'Format data dari server tidak sesuai.');
        }
      } else {
        let fUsers = normalizeUsers(safeGetLocalStorage('tpq_users', INITIAL_DATA.users));
        if (fUsers.filter(u => u.role === 'santri').length === 0) fUsers = normalizeUsers(INITIAL_DATA.users);
        setUsers(fUsers);
        setProgress(normalizeProgress(safeGetLocalStorage('tpq_progress', INITIAL_DATA.progress)));
        setTargets(normalizeTargets(safeGetLocalStorage('tpq_targets', INITIAL_DATA.targets)));
        setSavings(normalizeSavings(safeGetLocalStorage('tpq_savings', INITIAL_DATA.savings)));
      }
    } catch (error) {
      console.error("Detail Error Sinkronisasi:", error);
      let fUsers = normalizeUsers(safeGetLocalStorage('tpq_users', INITIAL_DATA.users));
      if (fUsers.filter(u => u.role === 'santri').length === 0) fUsers = normalizeUsers(INITIAL_DATA.users);
      setUsers(fUsers);
      setProgress(normalizeProgress(safeGetLocalStorage('tpq_progress', INITIAL_DATA.progress)));
      setTargets(normalizeTargets(safeGetLocalStorage('tpq_targets', INITIAL_DATA.targets)));
      setSavings(normalizeSavings(safeGetLocalStorage('tpq_savings', INITIAL_DATA.savings)));
    } finally {
      setIsSyncing(false);
      setIsInitializing(false);
    }
  };

  useEffect(() => {
    loadDatabase();
    try {
      const savedUser = sessionStorage.getItem('tpq_user');
      if (savedUser) {
        const parsed = JSON.parse(savedUser);
        parsed.id = String(parsed.id);
        setCurrentUser(parsed);
      }
    } catch (e) { console.error("Session restoration error:", e); }
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
      if (table === 'users') { normalizedData = normalizeUsers(updatedData); setUsers(normalizedData); }
      else if (table === 'progress') { normalizedData = normalizeProgress(updatedData); setProgress(normalizedData); }
      else if (table === 'targets') { normalizedData = normalizeTargets(updatedData); setTargets(normalizedData); }
      else if (table === 'savings') { normalizedData = normalizeSavings(updatedData); setSavings(normalizedData); }
      else if (table === 'settings') setSettings(normalizedData);

      try { localStorage.setItem(`tpq_${table}`, JSON.stringify(normalizedData)); }
      catch (storageErr) { console.warn("Penyimpanan lokal dibatasi:", storageErr); }
    } catch (localErr) {
      console.error("Gagal update data lokal:", localErr);
      showToast('Gagal memproses data lokal: ' + localErr.message, 'error');
      setIsSyncing(false);
      return false;
    }

    const activeUrl = customUrl || appsScriptUrl;

    try {
      if (activeUrl && activeUrl.trim() !== '' && activeUrl !== "ISI_URL_APPS_SCRIPT_ANDA_DISINI") {
        const response = await fetch(activeUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'text/plain;charset=utf-8' },
          body: JSON.stringify({ action: 'updateTable', table, data: normalizedData })
        });

        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const resultText = await response.text();
        const resultJson = JSON.parse(resultText);
        if (resultJson.status !== 'success') throw new Error(resultJson.message || 'Respons server gagal menyimpan data.');
        showToast('Sinkronisasi Google Sheet berhasil diperbarui!');
        return true;
      } else {
        showToast('Data disimpan secara lokal (URL Sheets belum diatur).');
        return true;
      }
    } catch (error) {
      console.warn("Koneksi utama gagal, mencoba metode fallback...");
      try {
        if (activeUrl && activeUrl.trim() !== '' && activeUrl !== "ISI_URL_APPS_SCRIPT_ANDA_DISINI") {
          await fetch(activeUrl, {
            method: 'POST',
            mode: 'no-cors',
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            body: JSON.stringify({ action: 'updateTable', table, data: normalizedData })
          });
          showToast('Data dikirim ke Google Sheets!');
          return true;
        }
      } catch (fallbackError) { console.error("Fallback save failed:", fallbackError); }
      showToast('Data berhasil disimpan secara lokal.');
      return true;
    } finally { setIsSyncing(false); }
  };

  const handleLogin = (username, password) => {
    const user = users.find(u => String(u.username).toLowerCase() === String(username).toLowerCase() && String(u.password) === String(password));
    if (user) {
      setCurrentUser(user);
      try { sessionStorage.setItem('tpq_user', JSON.stringify(user)); } catch(e){}
      setActiveTab('dashboard');
      showToast(`Selamat datang kembali, ${user.name}!`);
    } else {
      showToast('Username atau password salah!', 'error');
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    try { sessionStorage.removeItem('tpq_user'); } catch(e){}
    setActiveTab('dashboard');
  };

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast({ message: '', type: '' }), 3500);
  };

  if (isInitializing) {
    return (
      <div className="min-h-screen bg-emerald-50/50 flex flex-col items-center justify-center p-4">
        <RefreshCw className="w-12 h-12 text-emerald-600 animate-spin mb-4" />
        <h2 className="text-xl font-bold text-gray-800">Menyinkronkan Data...</h2>
        <p className="text-gray-500 text-sm mt-2 text-center max-w-xs">Memuat data terbaru dari Google Sheets.</p>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-emerald-50/50 flex items-center justify-center p-4">
        <Toast message={toast.message} type={toast.type} onClose={() => setToast({ message: '', type: '' })} />
        <div className="bg-white p-8 rounded-3xl shadow-xl w-full max-w-md border-t-8 border-emerald-600">
          <div className="text-center mb-8">
            {settings.logoUrl ? (
              <div className="mx-auto mb-4 flex justify-center">
                <img src={settings.logoUrl} alt="Logo" className="max-w-full h-24 object-contain" />
              </div>
            ) : (
              <div className="bg-emerald-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 overflow-hidden shadow-inner">
                <BookOpen className="w-10 h-10 text-emerald-600" />
              </div>
            )}
            <h1 className="text-2xl font-bold text-gray-800">{settings.tpqName || 'Sistem Informasi TPQ'}</h1>
            <p className="text-gray-500 text-sm mt-2">Portal masuk terintegrasi Google Sheets</p>
          </div>
          
          <form onSubmit={(e) => {
            e.preventDefault();
            handleLogin(e.target.username.value, e.target.password.value);
          }} className="space-y-5">
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
            <button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3.5 rounded-xl transition-all shadow-md hover:shadow-lg text-sm">
              Masuk Sistem
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 font-sans flex flex-col">
      <Toast message={toast.message} type={toast.type} onClose={() => setToast({ message: '', type: '' })} />
      
      <header className="bg-emerald-800 text-white p-4 shadow-md flex justify-between items-center sticky top-0 z-10 font-medium">
        <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setActiveTab('dashboard')}>
          {settings.logoUrl ? (
            <img src={settings.logoUrl} alt="Logo" className="w-auto h-10 object-contain bg-white rounded-md p-1" />
          ) : (
            <BookOpen className="w-8 h-8 text-emerald-300" />
          )}
          <div>
            <h1 className="font-bold text-base sm:text-lg leading-tight">{settings.tpqName || 'SIM TPQ'}</h1>
            <p className="text-[10px] sm:text-xs text-emerald-200 font-medium">Aplikasi Pengelolaan Taman Quran</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="text-right text-xs sm:text-sm">
            <p className="font-bold leading-tight">{currentUser.name}</p>
            <p className="text-[10px] text-emerald-200 uppercase font-semibold tracking-wider">
              {getRoleName(currentUser.role)}
            </p>
          </div>
          <button 
            onClick={() => loadDatabase()} 
            disabled={isSyncing}
            className="p-2 sm:p-2.5 rounded-xl bg-emerald-950 hover:bg-emerald-900 transition"
            title="Sinkronisasi Data"
          >
            <RefreshCw className={`w-4 h-4 text-white ${isSyncing ? 'animate-spin' : ''}`} />
          </button>
          <button onClick={handleLogout} className="bg-red-600 hover:bg-red-700 p-2 sm:p-2.5 rounded-xl transition-colors flex items-center shadow-sm" title="Keluar">
            <LogOut className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </div>
      </header>

      <main className="flex-1 p-4 md:p-8 max-w-7xl w-full mx-auto">
        {currentUser.role === 'santri' && (
          <SantriView 
            activeTab={activeTab} 
            setActiveTab={setActiveTab} 
            user={currentUser} 
            users={users}
            progress={progress}
            targets={targets}
            savings={savings}
            updateTable={updateTable}
            showToast={showToast} 
            simulatedWeekend={simulatedWeekend}
            setSimulatedWeekend={setSimulatedWeekend}
          />
        )}

        {currentUser.role === 'guru' && (
          <GuruView 
            activeTab={activeTab} 
            setActiveTab={setActiveTab} 
            user={currentUser} 
            users={users}
            setUsers={setUsers}
            progress={progress}
            targets={targets}
            savings={savings}
            settings={settings}
            updateTable={updateTable}
            showToast={showToast} 
            simulatedWeekend={simulatedWeekend}
            setSimulatedWeekend={setSimulatedWeekend}
          />
        )}

        {currentUser.role === 'kepala_tpq' && (
          <KepalaView 
            activeTab={activeTab} 
            setActiveTab={setActiveTab} 
            user={currentUser} 
            users={users}
            setUsers={setUsers}
            progress={progress}
            targets={targets}
            savings={savings}
            settings={settings}
            updateTable={updateTable}
            showToast={showToast} 
            simulatedWeekend={simulatedWeekend}
            setSimulatedWeekend={setSimulatedWeekend}
            appsScriptUrl={appsScriptUrl}
            setAppsScriptUrl={setAppsScriptUrl}
            isSyncing={isSyncing}
            loadDatabase={loadDatabase}
          />
        )}

        {currentUser.role === 'bendahara' && (
          <BendaharaView 
            activeTab={activeTab} 
            setActiveTab={setActiveTab} 
            users={users}
            savings={savings}
            settings={settings}
            updateTable={updateTable}
            showToast={showToast} 
          />
        )}

        {currentUser.role === 'admin' && (
          <AdminView 
            activeTab={activeTab} 
            setActiveTab={setActiveTab} 
            users={users}
            updateTable={updateTable}
            showToast={showToast} 
            settings={settings} 
            appsScriptUrl={appsScriptUrl}
            setAppsScriptUrl={setAppsScriptUrl}
            loadDatabase={loadDatabase}
          />
        )}
      </main>
    </div>
  );
}

// ==================================================================
// VIEW SANTRI
// ==================================================================
function SantriView({ activeTab, setActiveTab, user, users, progress, targets, savings, updateTable, showToast, simulatedWeekend, setSimulatedWeekend }) {
  const myProgress = progress.filter(p => String(p.santriId) === String(user.id) && p.status !== 'pending');
  const myTargets = targets.filter(t => t.level === user.jilid);
  const mySavings = savings.filter(s => String(s.santriId) === String(user.id));
  
  const totalDeposit = mySavings.filter(s => s.type === 'setor').reduce((acc, curr) => acc + curr.amount, 0);
  const totalWithdraw = mySavings.filter(s => s.type === 'tarik').reduce((acc, curr) => acc + curr.amount, 0);
  const currentBalance = totalDeposit - totalWithdraw;

  const accOpen = isAccWindowOpen(simulatedWeekend);
  const sudahAcc = isSantriAccThisWeek(user, simulatedWeekend);

  const menus = [
    { id: 'progres_mengaji', label: 'Progres Mengaji Saya', icon: BookOpen, color: 'bg-emerald-100 text-emerald-600', desc: 'Riwayat catatan setoran bacaan harian yang sudah divalidasi guru.' },
    { id: 'riwayat_syahriah', label: 'Iuran Syahriah Bulanan', icon: CreditCard, color: 'bg-indigo-100 text-indigo-600', desc: 'Pantau iuran SPP bulanan, tagihan, serta konfirmasi status pembayaran.' },
    { id: 'riwayat_tabungan', label: 'Riwayat Tabungan', icon: DollarSign, color: 'bg-amber-100 text-amber-600', desc: 'Monitor mutasi kas tabungan santri mandiri Anda secara transparan.' }
  ];

  if (activeTab === 'dashboard') {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="bg-emerald-600 rounded-3xl p-6 text-white shadow-lg relative overflow-hidden">
          <div className="absolute right-0 bottom-0 opacity-10 transform translate-x-6 translate-y-6">
            <BookOpen className="w-56 h-56" />
          </div>
          <p className="text-xs font-bold text-emerald-200 uppercase tracking-widest">Informasi Santri</p>
          <h2 className="text-2xl font-black mt-1">{user.name}</h2>
          <div className="grid grid-cols-2 gap-4 mt-6 border-t border-emerald-500 pt-4 text-xs font-semibold">
            <div>
              <p className="text-emerald-200">Tingkatan Saat Ini</p>
              <p className="text-base font-bold mt-0.5">{user.jilid || 'Jilid 1'}</p>
            </div>
            <div>
              <p className="text-emerald-200">Status Tabungan</p>
              <p className="text-base font-bold mt-0.5">Rp {currentBalance.toLocaleString('id-ID')}</p>
            </div>
          </div>
        </div>

        {accOpen && !sudahAcc && (
          <div className="bg-amber-50 border border-amber-200 p-5 rounded-2xl flex items-start space-x-3.5 shadow-sm">
            <Bell className="w-6 h-6 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-extrabold text-amber-900 text-sm">📅 Jendela Verifikasi Mingguan Dibuka!</h3>
              <p className="text-xs text-amber-700 mt-1 leading-relaxed">Waktunya konfirmasi belajar mandiri di rumah. Tekan tombol di bawah agar guru bisa menginput setoran bacaan minggu depan.</p>
              <button 
                onClick={async () => {
                  const updated = users.map(u => String(u.id) === String(user.id) ? { ...u, lastAccDate: new Date().toISOString() } : u);
                  await updateTable('users', updated);
                  showToast('✅ Verifikasi mandiri berhasil! Guru sekarang bisa menginput progres Anda.');
                }}
                className="mt-3 bg-amber-600 hover:bg-amber-700 text-white font-bold px-4 py-2 rounded-xl text-xs shadow transition-all duration-200"
              >
                ✅ Konfirmasi Belajar Mandiri Selesai
              </button>
            </div>
          </div>
        )}

        {accOpen && sudahAcc && (
          <div className="bg-emerald-50 border border-emerald-200 p-5 rounded-2xl flex items-start space-x-3.5 shadow-sm">
            <CheckCircle className="w-6 h-6 text-emerald-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-extrabold text-emerald-900 text-sm">Anda Sudah Verifikasi Minggu Ini</h3>
              <p className="text-xs text-emerald-700 mt-1 leading-relaxed">Terima kasih. Guru sudah bisa menginput progres bacaan Anda untuk periode ini.</p>
            </div>
          </div>
        )}

        {!accOpen && !sudahAcc && (
          <div className="bg-slate-50 border border-slate-200 p-5 rounded-2xl flex items-start space-x-3.5 shadow-sm">
            <Info className="w-6 h-6 text-slate-500 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-extrabold text-slate-800 text-sm">⏳ Menunggu Jendela Verifikasi</h3>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">Tombol konfirmasi belajar mandiri akan muncul otomatis <strong>setiap hari Sabtu pukul 18.00 WIB s/d hari Minggu berakhir</strong>.</p>
            </div>
          </div>
        )}

        <div className="text-right">
          <button 
            onClick={() => setSimulatedWeekend(!simulatedWeekend)} 
            className="text-[10px] text-slate-400 hover:text-slate-600 underline"
          >
            {simulatedWeekend ? '[Mode Test: Tutup Akhir Pekan]' : '[Mode Test: Buka Akhir Pekan]'}
          </button>
        </div>

        <MenuGrid menus={menus} onSelect={setActiveTab} />

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex justify-between items-center mb-4 border-b pb-3">
            <h3 className="font-bold text-gray-800 text-sm sm:text-base flex items-center"><Award className="mr-1.5 text-emerald-600"/> Target Kompetensi Jilid Aktif ({user.jilid})</h3>
            <span className="text-[10px] bg-emerald-50 text-emerald-700 font-extrabold px-3 py-1 rounded-full uppercase">Target Kurikulum</span>
          </div>
          {myTargets.length === 0 ? (
            <p className="text-xs text-gray-400 italic">Target kurikulum tingkat {user.jilid} belum diatur.</p>
          ) : (
            <div className="space-y-2.5">
              {myTargets.map(t => {
                const isCompleted = user.completedTargets && user.completedTargets.includes(String(t.id));
                return (
                  <div key={t.id} className="flex items-center space-x-3 p-3.5 bg-gray-50 rounded-xl border border-gray-150 text-xs">
                    {isCompleted ? (
                      <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                    ) : (
                      <div className="w-5 h-5 rounded-full border-2 border-gray-300 flex-shrink-0" />
                    )}
                    <span className={`font-semibold ${isCompleted ? 'text-gray-400 line-through' : 'text-gray-700'}`}>{t.description}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    );
  }

  if (activeTab === 'progres_mengaji') {
    return (
      <div className="animate-fade-in">
        <BackButton onClick={() => setActiveTab('dashboard')} />
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <h2 className="text-lg font-bold mb-6 flex items-center text-emerald-800"><BookOpen className="mr-2"/> Catatan Progres Mengaji Harian</h2>
          {myProgress.length === 0 ? (
            <p className="text-center text-gray-500 py-6 text-sm">Belum ada catatan setoran bimbingan.</p>
          ) : (
            <div className="space-y-3">
              {myProgress.map(p => (
                <div key={p.id} className="flex justify-between items-center p-4 bg-gray-50 rounded-xl border border-gray-100">
                  <div>
                    <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full font-bold uppercase">{p.date}</span>
                    <h3 className="font-bold text-gray-800 mt-2 text-sm">Membaca {p.surah}</h3>
                    <p className="text-xs text-gray-500 font-medium">Ayat {p.ayat}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-100 px-3 py-1.5 rounded-xl">{p.nilai}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  if (activeTab === 'riwayat_syahriah') {
    return (
      <div className="animate-fade-in">
        <BackButton onClick={() => setActiveTab('dashboard')} />
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <h2 className="text-lg font-bold mb-4 flex items-center text-indigo-800"><CreditCard className="mr-2"/> Pembayaran Iuran Syahriah (SPP Bulanan)</h2>
          
          <div className="bg-gray-50 p-5 rounded-2xl border mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center">
            <div>
              <p className="text-xs text-gray-400 font-semibold">STATUS ALARM TAGIHAN</p>
              <h3 className="font-extrabold text-base mt-1 flex items-center">
                {user.hasAlarm ? (
                  <>
                    <AlertTriangle className="text-red-500 w-5 h-5 mr-1.5" />
                    <span className="text-red-600">Ada Tagihan Belum Dibayar</span>
                  </>
                ) : (
                  <>
                    <CheckCircle className="text-emerald-600 w-5 h-5 mr-1.5" />
                    <span className="text-emerald-700">Lunas / Bebas Tagihan</span>
                  </>
                )}
              </h3>
            </div>
            <span className="text-[10px] text-gray-400 font-medium mt-2 sm:mt-0">Konfirmasi pembayaran langsung melalui bendahara</span>
          </div>
          {(!user.historyBayar || user.historyBayar.length === 0) ? (
            <p className="text-xs text-gray-500 italic bg-gray-50 p-4 rounded-xl border text-center">Belum ada riwayat pembayaran syahriah tercatat.</p>
          ) : (
            <div className="space-y-2">
              {user.historyBayar.map((date, idx) => (
                <div key={idx} className="p-3.5 bg-emerald-50/50 border border-emerald-100 rounded-xl flex justify-between items-center text-xs">
                  <span className="font-bold text-emerald-800">Pembayaran Syahriah Bulanan</span>
                  <span className="font-semibold text-gray-600">Tanggal: {date}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  if (activeTab === 'riwayat_tabungan') {
    return (
      <div className="animate-fade-in space-y-6">
        <BackButton onClick={() => setActiveTab('dashboard')} />
        
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-gray-100 flex items-center justify-between">
            <div>
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Total Setoran</p>
              <h3 className="text-lg font-black text-emerald-600 mt-1">Rp {totalDeposit.toLocaleString('id-ID')}</h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <TrendingUp size={20} />
            </div>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-gray-100 flex items-center justify-between">
            <div>
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Total Penarikan</p>
              <h3 className="text-lg font-black text-red-600 mt-1">Rp {totalWithdraw.toLocaleString('id-ID')}</h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-red-50 text-red-600 flex items-center justify-center">
              <TrendingDown size={20} />
            </div>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-gray-100 flex items-center justify-between">
            <div>
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Saldo Tabungan</p>
              <h3 className="text-lg font-black text-blue-600 mt-1">Rp {currentBalance.toLocaleString('id-ID')}</h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <DollarSign size={20} />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <h2 className="text-base font-bold mb-4 flex items-center text-amber-800"><DollarSign className="mr-1.5"/> Log Riwayat Mutasi Tabungan</h2>
          {mySavings.length === 0 ? (
            <p className="text-xs text-gray-400 italic text-center py-4 bg-gray-50 rounded-xl">Belum ada mutasi tabungan yang tercatat.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-gray-50 font-bold text-gray-600 uppercase border-b border-gray-150">
                    <th className="p-3">Tanggal</th>
                    <th className="p-3">Jenis</th>
                    <th className="p-3">Nominal</th>
                    <th className="p-3">Keterangan</th>
                  </tr>
                </thead>
                <tbody>
                  {mySavings.map(s => (
                    <tr key={s.id} className="border-b hover:bg-gray-50 transition font-medium">
                      <td className="p-3 font-semibold text-gray-600">{s.date}</td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${s.type === 'setor' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
                          {s.type === 'setor' ? 'Setoran' : 'Penarikan'}
                        </span>
                      </td>
                      <td className="p-3 font-bold text-gray-800">Rp {s.amount.toLocaleString('id-ID')}</td>
                      <td className="p-3 text-gray-500 font-semibold">{s.description || '-'}</td>
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

  return null;
}

// ==================================================================
// VIEW GURU
// ==================================================================
function GuruView({ activeTab, setActiveTab, user, users, setUsers, progress, targets, savings, settings, updateTable, showToast, simulatedWeekend, setSimulatedWeekend }) {
  const [selectedSantri, setSelectedSantri] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Sinkronisasi data santri jika berubah
  useEffect(() => {
    if (selectedSantri) {
      const dataTerbaru = users.find(u => String(u.id) === String(selectedSantri.id));
      if (dataTerbaru && JSON.stringify(dataTerbaru) !== JSON.stringify(selectedSantri)) {
        setSelectedSantri(dataTerbaru);
      }
    }
  }, [users, selectedSantri]);

  // ✅ ATURAN 1: HANYA SANTRI YANG SUDAH DIKLAIM OLEH GURU INI
  const mySantri = users.filter(u => 
    u.role === 'santri' && String(u.guruId) === String(user.id)
  );

  // ✅ ATURAN 1: DAFTAR SANTRI YANG BELUM PUNYA GURU (BISA DIKLAIM)
  const santriBisaDiklaim = users.filter(u => 
    u.role === 'santri' && (!u.guruId || String(u.guruId).trim() === '' || u.guruId === null)
  );

  // Filter pencarian
  const filteredMySantri = mySantri.filter(s => 
    s.name.toLowerCase().includes(searchTerm.toLowerCase())
  );
  const filteredKlaim = santriBisaDiklaim.filter(s => 
    s.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleKlaimSantri = async (santriId) => {
    const updated = users.map(u => 
      String(u.id) === String(santriId) ? { ...u, guruId: String(user.id) } : u
    );
    await updateTable('users', updated);
    showToast('✅ Santri berhasil diklaim ke bimbingan Anda!');
  };

  // ✅ ATURAN 1: LEPAS SANTRI (bisa diklaim guru lain nanti)
  const handleLepasSantri = async (santriId, nama) => {
    if (!window.confirm(`Yakin ingin melepas ${nama}?\nSetelah dilepas, santri bisa diklaim oleh guru lain.`)) return;
    const updated = users.map(u => 
      String(u.id) === String(santriId) ? { ...u, guruId: null } : u
    );
    await updateTable('users', updated);
    showToast(`✅ ${nama} telah dilepas dari bimbingan Anda.`);
  };

  const handleInputProgres = async (e) => {
    e.preventDefault();
    const santriId = e.target.santriId.value;
    const santri = users.find(u => String(u.id) === String(santriId));

    if (!santri) return;

    // ✅ ATURAN 2: CEK APAKAH SANTRI SUDAH ACC MINGGU INI
    if (!isSantriAccThisWeek(santri, simulatedWeekend)) {
      showToast(`❌ Ditolak! ${santri.name} belum melakukan verifikasi mandiri (ACC) Sabtu-Minggu ini.`, 'error');
      return;
    }

    // ✅ ATURAN 1: CEK KEPEMILIKAN SANTRI
    if (String(santri.guruId) !== String(user.id)) {
      showToast(`❌ Ditolak! ${santri.name} bukan santri bimbingan Anda.`, 'error');
      return;
    }

    const baru = {
      id: Date.now().toString(),
      santriId,
      date: e.target.date.value,
      surah: e.target.surah.value,
      ayat: e.target.ayat.value,
      nilai: e.target.nilai.value,
      status: 'acc_guru',
      type: 'harian'
    };

    await updateTable('progress', [baru, ...progress]);
    showToast(`✅ Progres ${santri.name} berhasil disimpan!`);
    e.target.reset();
  };

  const menus = [
    { id: 'input_progres', label: 'Input Progres Mengaji', icon: ClipboardList, color: 'bg-emerald-100 text-emerald-600', desc: 'Catat bacaan, hafalan, dan nilai santri bimbingan Anda.' },
    { id: 'daftar_santri', label: 'Daftar Santri Bimbingan', icon: Users, color: 'bg-blue-100 text-blue-600', desc: 'Lihat, kelola, klaim, atau lepas santri di bawah bimbingan.' },
    { id: 'target_kurikulum', label: 'Target Kurikulum', icon: Award, color: 'bg-amber-100 text-amber-600', desc: 'Panduan target capaian setiap tingkatan jilid.' }
  ];

  if (activeTab === 'dashboard') {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="bg-emerald-600 rounded-3xl p-6 text-white shadow-lg">
          <p className="text-xs font-bold text-emerald-200 uppercase tracking-widest">Halaman Guru</p>
          <h2 className="text-2xl font-black mt-1">{user.name}</h2>
          <div className="grid grid-cols-2 gap-4 mt-6 border-t border-emerald-500 pt-4 text-xs font-semibold">
            <div>
              <p className="text-emerald-200">Jumlah Santri Bimbingan</p>
              <p className="text-xl font-bold mt-0.5">{mySantri.length} Santri</p>
            </div>
            <div>
              <p className="text-emerald-200">Santri Belum Diklaim</p>
              <p className="text-xl font-bold mt-0.5">{santriBisaDiklaim.length} Santri</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl shadow-sm border text-xs text-gray-600">
          <p className="font-bold text-gray-800 mb-1">📌 Aturan Input Progres:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Hanya santri yang sudah Anda klaim yang bisa diinput progresnya</li>
            <li>Santri harus sudah menekan tombol ACC/Verifikasi setiap <strong>Sabtu 18.00 WIB s/d Minggu</strong> sebelum Anda bisa input</li>
            <li>Jika santri ingin pindah guru, Anda harus melepasnya terlebih dahulu</li>
          </ul>
          <div className="text-right mt-2">
            <button onClick={() => setSimulatedWeekend(!simulatedWeekend)} className="text-[10px] text-slate-400 underline">
              {simulatedWeekend ? '[Test Mode: Tutup Jendela ACC]' : '[Test Mode: Buka Jendela ACC]'}
            </button>
          </div>
        </div>

        <MenuGrid menus={menus} onSelect={setActiveTab} />
      </div>
    );
  }

  if (activeTab === 'input_progres') {
    return (
      <div className="animate-fade-in">
        <BackButton onClick={() => setActiveTab('dashboard')} />
        <div className="bg-white p-6 rounded-2xl shadow-sm border">
          <h2 className="text-lg font-bold mb-6 text-emerald-800">Input Progres Bacaan / Hafalan</h2>
          <form onSubmit={handleInputProgres} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Pilih Santri Bimbingan</label>
              <select name="santriId" required className="w-full p-3 border rounded-xl text-sm">
                <option value="">-- Pilih Santri --</option>
                {mySantri.map(s => (
                  <option key={s.id} value={s.id}>{s.name} ({s.jilid})</option>
                ))}
              </select>
              {mySantri.length === 0 && <p className="text-xs text-red-500 mt-1">Belum ada santri yang Anda klaim. Buka menu "Daftar Santri Bimbingan".</p>}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Tanggal Setoran</label>
                <input type="date" name="date" required className="w-full p-3 border rounded-xl text-sm" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Nilai / Keterangan</label>
                <select name="nilai" required className="w-full p-3 border rounded-xl text-sm">
                  <option value="">-- Pilih Nilai --</option>
                  <option value="A (Sangat Lancar)">A (Sangat Lancar)</option>
                  <option value="B (Lancar)">B (Lancar)</option>
                  <option value="C (Kurang Lancar)">C (Kurang Lancar)</option>
                  <option value="D (Perlu Bimbingan)">D (Perlu Bimbingan)</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Surah / Materi</label>
                <input type="text" name="surah" required placeholder="Contoh: An-Nas / Jilid 1 Hal 10" className="w-full p-3 border rounded-xl text-sm" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Ayat / Halaman</label>
                <input type="text" name="ayat" required placeholder="Contoh: 1-6" className="w-full p-3 border rounded-xl text-sm" />
              </div>
            </div>
            <button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-xl text-sm">
              Simpan Progres
            </button>
          </form>
        </div>
      </div>
    );
  }

  if (activeTab === 'daftar_santri') {
    return (
      <div className="animate-fade-in space-y-6">
        <BackButton onClick={() => setActiveTab('dashboard')} />
        <div className="bg-white p-6 rounded-2xl shadow-sm border">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-3">
            <h2 className="text-lg font-bold text-blue-800">Daftar Santri Bimbingan Anda</h2>
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-3.5 w-4 h-4 text-gray-400" />
              <input type="text" placeholder="Cari nama santri..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-10 p-3 border rounded-xl text-sm" />
            </div>
          </div>

          {filteredMySantri.length === 0 ? (
            <p className="text-center text-gray-500 py-6 text-sm">Belum ada santri di bawah bimbingan Anda.</p>
          ) : (
            <div className="space-y-3">
              {filteredMySantri.map(s => (
                <div key={s.id} className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 bg-blue-50 rounded-xl border border-blue-100 gap-3">
                  <div>
                    <h3 className="font-bold text-sm text-gray-800">{s.name}</h3>
                    <p className="text-xs text-gray-500">Tingkatan: {s.jilid}</p>
                    <p className="text-xs text-gray-500">Status ACC Minggu Ini: {isSantriAccThisWeek(s, simulatedWeekend) ? '✅ Sudah' : '❌ Belum'}</p>
                  </div>
                  <button onClick={() => handleLepasSantri(s.id, s.name)} className="px-3 py-2 bg-red-100 hover:bg-red-200 text-red-700 rounded-xl text-xs font-bold flex items-center gap-1">
                    <UserMinus size={12} /> Lepas
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Bagian Klaim Santri Baru */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border">
          <h3 className="text-base font-bold mb-4 text-emerald-800 flex items-center gap-2"><UserPlus size={16} /> Santri Belum Punya Guru (Bisa Diklaim)</h3>
          {filteredKlaim.length === 0 ? (
            <p className="text-center text-gray-500 py-4 text-sm">Saat ini tidak ada santri yang bisa diklaim.</p>
          ) : (
            <div className="space-y-3">
              {filteredKlaim.map(s => (
                <div key={s.id} className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 bg-gray-50 rounded-xl border gap-3">
                  <div>
                    <h3 className="font-bold text-sm text-gray-800">{s.name}</h3>
                    <p className="text-xs text-gray-500">Tingkatan: {s.jilid}</p>
                  </div>
                  <button onClick={() => handleKlaimSantri(s.id)} className="px-3 py-2 bg-emerald-100 hover:bg-emerald-200 text-emerald-700 rounded-xl text-xs font-bold flex items-center gap-1">
                    <UserPlus size={12} /> Klaim Bimbingan
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  if (activeTab === 'target_kurikulum') {
    return (
      <div className="animate-fade-in">
        <BackButton onClick={() => setActiveTab('dashboard')} />
        <div className="bg-white p-6 rounded-2xl shadow-sm border">
          <h2 className="text-lg font-bold mb-6 text-amber-800">Daftar Target Kurikulum TPQ</h2>
          {JILID_LEVELS.map(level => {
            const targetLevel = targets.filter(t => t.level === level);
            if (targetLevel.length === 0) return null;
            return (
              <div key={level} className="mb-6">
                <h3 className="font-bold text-sm text-gray-800 mb-2 bg-amber-50 p-2 rounded-lg">{level}</h3>
                <ul className="space-y-2 pl-4">
                  {targetLevel.map(t => (
                    <li key={t.id} className="text-xs text-gray-700 list-disc">{t.description}</li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return null;
}

// ==================================================================
// VIEW KEPALA TPQ, BENDAHARA, ADMIN (sementara dasar, bisa dilengkapi nanti)
// ==================================================================
function KepalaView({ activeTab, setActiveTab }) {
  return (
    <div className="animate-fade-in">
      <BackButton onClick={() => setActiveTab('dashboard')} />
      <div className="bg-white p-6 rounded-2xl shadow-sm border text-center py-12">
        <Shield className="w-12 h-12 text-gray-300 mx-auto mb-4" />
        <h2 className="text-lg font-bold text-gray-800">Menu Kepala TPQ</h2>
        <p className="text-sm text-gray-500 mt-2">Fitur kelola data seluruh santri dan laporan sedang disiapkan.</p>
      </div>
    </div>
  );
}

function BendaharaView({ activeTab, setActiveTab }) {
  return (
    <div className="animate-fade-in">
      <BackButton onClick={() => setActiveTab('dashboard')} />
      <div className="bg-white p-6 rounded-2xl shadow-sm border text-center py-12">
        <DollarSign className="w-12 h-12 text-gray-300 mx-auto mb-4" />
        <h2 className="text-lg font-bold text-gray-800">Menu Bendahara</h2>
        <p className="text-sm text-gray-500 mt-2">Fitur kelola pembayaran syahriah dan tabungan sedang disiapkan.</p>
      </div>
    </div>
  );
}

function AdminView({ activeTab, setActiveTab }) {
  return (
    <div className="animate-fade-in">
      <BackButton onClick={() => setActiveTab('dashboard')} />
      <div className="bg-white p-6 rounded-2xl shadow-sm border text-center py-12">
        <Settings className="w-12 h-12 text-gray-300 mx-auto mb-4" />
        <h2 className="text-lg font-bold text-gray-800">Menu Admin Sistem</h2>
        <p className="text-sm text-gray-500 mt-2">Fitur pengaturan sistem penuh sedang disiapkan.</p>
      </div>
    </div>
  );
}
          <h3 className="font-bold text-sm text-gray-700 mb-3 uppercase tracking-wider">Riwayat Pembayaran Anda:</h3>
