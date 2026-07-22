import React, { useState, useEffect } from 'react';
import { 
  User, Lock, Shield, Book, BookOpen, CheckCircle, 
  AlertTriangle, Users, LogOut, CreditCard, Bell, Plus, 
  Trash2, Check, X, UserPlus, Info, Edit, ArrowLeft, 
  Eye, EyeOff, Award, ClipboardList, Settings, DollarSign, 
  CheckSquare, RefreshCw, Database, Copy, Unlock,
  ChevronDown, ChevronUp, TrendingUp, TrendingDown, Search
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
  savings: [
    { id: 's1', santriId: '5', date: '2026-07-10', amount: 50000, type: 'setor', description: 'Setoran Awal Mandiri', inputBy: '1' }
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

const isAccNeeded = (lastAccDate, simulatedWeekend = false) => {
  const now = new Date();
  const currentDay = now.getDay(); 
  const currentHour = now.getHours();
  
  const isWeekendRange = simulatedWeekend || (currentDay === 6 && currentHour >= 18) || (currentDay === 0);
  if (!isWeekendRange) return false;
  
  let lastSaturday18 = new Date(now);
  if (currentDay === 0) {
    lastSaturday18.setDate(now.getDate() - 1);
  } else if (currentDay === 6) {
    if (currentHour < 18) {
      lastSaturday18.setDate(now.getDate() - 7);
    }
  } else {
    lastSaturday18.setDate(now.getDate() - ((currentDay + 1) % 7));
  }
  lastSaturday18.setHours(18, 0, 0, 0);
  
  if (!lastAccDate || isNaN(Date.parse(lastAccDate))) return true;
  
  try {
    const lastAcc = new Date(lastAccDate);
    return lastAcc < lastSaturday18;
  } catch (e) {
    return true;
  }
};

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
        
        if (!response.ok) {
          throw new Error(`HTTP Error: ${response.status}`);
        }
        
        const contentType = response.headers.get("content-type");
        if (contentType && contentType.includes("text/html")) {
          throw new Error('Akses Ditolak! Pastikan setting "Who has access" di Google Apps Script dideploy sebagai "Anyone".');
        }

        const payload = await response.json();
        
        if (payload.status === 'success' && payload.data) {
          const { users: sUsers, progress: sProgress, targets: sTargets, savings: sSavings, settings: sSettings } = payload.data;
          
          let finalUsers = normalizeUsers((sUsers && sUsers.length > 0) ? sUsers : localUsers);
          let finalProgress = normalizeProgress((sProgress && sProgress.length > 0) ? sProgress : localProgress);
          let finalTargets = normalizeTargets((sTargets && sTargets.length > 0) ? sTargets : localTargets);
          let finalSavings = normalizeSavings((sSavings && sSavings.length > 0) ? sSavings : localSavings);
          let finalSettings = (sSettings && Object.keys(sSettings).length > 0) ? sSettings : localSettings;

          if (finalUsers.filter(u => u.role === 'santri').length === 0) {
            finalUsers = normalizeUsers(localUsers.length > 0 ? localUsers : INITIAL_DATA.users);
          }
          if (finalTargets.length === 0) {
            finalTargets = normalizeTargets(localTargets.length > 0 ? localTargets : INITIAL_DATA.targets);
          }

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
          } catch (e) {
            console.warn("Penyimpanan local storage dibatasi.");
          }
          
          if (!isInitializing) showToast('Database Google Sheets berhasil disinkronkan!');
        } else {
          throw new Error(payload.message || 'Format data dari server tidak sesuai.');
        }
      } else {
        let fUsers = normalizeUsers(safeGetLocalStorage('tpq_users', INITIAL_DATA.users));
        if (fUsers.filter(u => u.role === 'santri').length === 0) {
          fUsers = normalizeUsers(INITIAL_DATA.users);
        }
        setUsers(fUsers);
        setProgress(normalizeProgress(safeGetLocalStorage('tpq_progress', INITIAL_DATA.progress)));
        setTargets(normalizeTargets(safeGetLocalStorage('tpq_targets', INITIAL_DATA.targets)));
        setSavings(normalizeSavings(safeGetLocalStorage('tpq_savings', INITIAL_DATA.savings)));
      }
    } catch (error) {
      console.error("Detail Error Sinkronisasi:", error);
      let fUsers = normalizeUsers(safeGetLocalStorage('tpq_users', INITIAL_DATA.users));
      if (fUsers.filter(u => u.role === 'santri').length === 0) {
        fUsers = normalizeUsers(INITIAL_DATA.users);
      }
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
    } catch (e) {
      console.error("Session restoration error:", e);
    }
  }, []);

  useEffect(() => {
    if (currentUser && users.length > 0) {
      const fresh = users.find(u => String(u.id) === String(currentUser.id));
      if (fresh && JSON.stringify(fresh) !== JSON.stringify(currentUser)) {
        setCurrentUser(fresh);
        try {
          sessionStorage.setItem('tpq_user', JSON.stringify(fresh));
        } catch(e){}
      }
    }
  }, [users, currentUser]);

  const updateTable = async (table, updatedData, customUrl = appsScriptUrl) => {
    setIsSyncing(true);
    let normalizedData = updatedData;
    
    try {
      if (table === 'users') {
        normalizedData = normalizeUsers(updatedData);
        setUsers(normalizedData);
      } else if (table === 'progress') {
        normalizedData = normalizeProgress(updatedData);
        setProgress(normalizedData);
      } else if (table === 'targets') {
        normalizedData = normalizeTargets(updatedData);
        setTargets(normalizedData);
      } else if (table === 'savings') {
        normalizedData = normalizeSavings(updatedData);
        setSavings(normalizedData);
      } else if (table === 'settings') {
        setSettings(normalizedData);
      }

      try {
        localStorage.setItem(`tpq_${table}`, JSON.stringify(normalizedData));
      } catch (storageErr) {
        console.warn("Penyimpanan lokal dibatasi (Mode Incognito):", storageErr);
      }
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

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const resultText = await response.text();
        const resultJson = JSON.parse(resultText);
        if (resultJson.status !== 'success') {
          throw new Error(resultJson.message || 'Respons server gagal menyimpan data.');
        }
        showToast('Sinkronisasi Google Sheet berhasil diperbarui!');
        return true;
      } else {
        showToast('Data disimpan secara lokal (URL Sheets belum diatur).');
        return true;
      }
    } catch (error) {
      console.warn("Koneksi utama CORS. Mengaktifkan metode pengiriman latar belakang (no-cors)...");
      try {
        if (activeUrl && activeUrl.trim() !== '' && activeUrl !== "ISI_URL_APPS_SCRIPT_ANDA_DISINI") {
          await fetch(activeUrl, {
            method: 'POST',
            mode: 'no-cors',
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            body: JSON.stringify({ action: 'updateTable', table, data: normalizedData })
          });
          showToast('Data dikirim ke Google Sheets (Mode Tanpa-Respon)!');
          return true;
        }
      } catch (fallbackError) {
        console.error("Fallback save failed:", fallbackError);
      }
      showToast('Data berhasil disimpan secara lokal.');
      return true;
    } finally {
      setIsSyncing(false);
    }
  };

  const handleLogin = (username, password) => {
    const user = users.find(u => String(u.username).toLowerCase() === String(username).toLowerCase() && String(u.password) === String(password));
    if (user) {
      setCurrentUser(user);
      try {
        sessionStorage.setItem('tpq_user', JSON.stringify(user));
      } catch(e){}
      setActiveTab('dashboard');
      showToast(`Selamat datang kembali, ${user.name}!`);
    } else {
      showToast('Username atau password salah!', 'error');
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    try {
      sessionStorage.removeItem('tpq_user');
    } catch(e){}
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
      
      {/* ✅ PERBAIKAN 0: Typo class 'checked-bg' dihapus */}
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
        {/* ✅ PERBAIKAN 2: Logika render dibersihkan, TIDAK ADA LAGI render ganda GuruView */}
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

function SantriView({ activeTab, setActiveTab, user, users, progress, targets, savings, updateTable, showToast, simulatedWeekend, setSimulatedWeekend }) {
  const myProgress = progress.filter(p => String(p.santriId) === String(user.id) && p.status !== 'pending');
  const myTargets = targets.filter(t => t.level === user.jilid);
  const mySavings = savings.filter(s => String(s.santriId) === String(user.id));
  
  const totalDeposit = mySavings.filter(s => s.type === 'setor').reduce((acc, curr) => acc + curr.amount, 0);
  const totalWithdraw = mySavings.filter(s => s.type === 'tarik').reduce((acc, curr) => acc + curr.amount, 0);
  const currentBalance = totalDeposit - totalWithdraw;

  const activeWeekendNotification = isAccNeeded(user.lastAccDate, simulatedWeekend);

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

        {activeWeekendNotification && (
          <div className="bg-amber-50 border border-amber-200 p-5 rounded-2xl flex items-start space-x-3.5 shadow-sm animate-bounce">
            <Bell className="w-6 h-6 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-extrabold text-amber-900 text-sm">Peringatan: Verifikasi Mingguan Mandiri Diperlukan!</h3>
              <p className="text-xs text-amber-700 mt-1 leading-relaxed">Akhir pekan telah tiba. Wali santri wajib menekan tombol verifikasi bimbingan mengaji mandiri di rumah demi mengonfirmasi keikutsertaan.</p>
              <button 
                onClick={async () => {
                  const updated = users.map(u => String(u.id) === String(user.id) ? { ...u, lastAccDate: new Date().toISOString() } : u);
                  await updateTable('users', updated);
                  showToast('Verifikasi mingguan mandiri berhasil dikirim!');
                }}
                className="mt-3 bg-amber-600 hover:bg-amber-700 text-white font-bold px-4 py-2 rounded-xl text-xs shadow transition-all duration-200"
              >
                Konfirmasi Belajar Mandiri Selesai
              </button>
            </div>
          </div>
        )}

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

          <h3 className="font-bold text-sm text-gray-700 mb-3 uppercase tracking-wider">Riwayat Pembayaran Anda:</h3>
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

function GuruView({ activeTab, setActiveTab, user, users, setUsers, progress, targets, savings, settings, updateTable, showToast, simulatedWeekend, setSimulatedWeekend }) {
  const [selectedSantri, setSelectedSantri] = useState(null);
  const [modeAksesKepala, setModeAksesKepala] = useState(user.role === 'kepala_tpq');

  // ==================================================================
  // ✅ PERBAIKAN 1: useEffect PENYELAMAT CHECKBOX (PALING PENTING!)
  // ==================================================================
  // Ini otomatis me-refresh tampilan centangan setiap kali data users
  // berubah setelah disimpan ke database / Google Sheets
  useEffect(() => {
    if (selectedSantri) {
      const dataTerbaru = users.find(u => String(u.id) === String(selectedSantri.id));
      if (dataTerbaru && JSON.stringify(dataTerbaru) !== JSON.stringify(selectedSantri)) {
        setSelectedSantri(dataTerbaru);
      }
    }
  }, [users, selectedSantri]);
  // ==================================================================
  // ✅ AKHIR PERBAIKAN UTAMA
  // ==================================================================

  const activeSantriList = users.filter(u => {
    if (u.role !== 'santri') return false;
    if (user.role === 'kepala_tpq' && modeAksesKepala) return true;
    return String(u.guruId) === String(user.id);
  });

  const handleAddProgress = async (e) => {
    e.preventDefault();
    const santriId = e.target.santriId.value;
    if (!santriId) {
      showToast('Pilih santri terlebih dahulu!', 'error');
      return;
    }
    const newProgress = {
      id: Date.now().toString(),
      santriId,
      date: e.target.date.value,
      surah: e.target.surah.value,
      ayat: e.target.ayat.value,
      nilai: e.target.nilai.value,
      status: 'acc_guru',
      type: 'harian'
    };
    const updated = [newProgress, ...progress];
    await updateTable('progress', updated);
    showToast('Progres harian santri berhasil ditambahkan!');
    e.target.reset();
  };

  const handleKlaimSantri = async (santriId) => {
    const updated = users.map(u => String(u.id) === String(santriId) ? { ...u, guruId: String(user.id) } : u);
    await updateTable('users', updated);
    showToast('Santri berhasil diklaim ke dalam bimbingan kelas Anda!');
  };

  const submitPengajuanKenaikan = async (e) => {
    e.preventDefault();
    if (!e.target.santriId.value) {
      showToast('Pilih santri terlebih dahulu!', 'error');
      return;
    }
    const targetSantri = users.find(u => String(u.id) === String(e.target.santriId.value));
    if (!targetSantri) return;

    const newRequest = {
      id: Date.now().toString(),
      santriId: targetSantri.id,
      date: e.target.date.value,
      surah: e.target.surah.value,
      ayat: e.target.ayat.value,
      nilai: 'Selesai Ujian Jilid',
      status: 'pending',
      type: 'kenaikan'
    };
    const updated = [newRequest, ...progress];
    await updateTable('progress', updated);
    showToast('Pengajuan kenaikan jilid berhasil diteruskan ke Kepala TPQ!');
    e.target.reset();
  };

  const toggleTargetCheck = async (santriId, targetId) => {
    try {
      const santriObj = users.find(u => String(u.id) === String(santriId));
      if (!santriObj) return;

      let completed = santriObj.completedTargets ? [...santriObj.completedTargets] : [];
      if (completed.includes(String(targetId))) {
        completed = completed.filter(t => String(t) !== String(targetId));
      } else {
        completed = [...completed, String(targetId)];
      }

      const updated = users.map(u => String(u.id) === String(santriId) ? { ...u, completedTargets: completed } : u);
      await updateTable('users', updated);
      showToast('Status target kompetensi santri berhasil diperbarui!');
    } catch (err) {
      console.error(err);
      showToast('Gagal mengubah kompetensi: ' + err.message, 'error');
    }
  };

  const isSavingAuthorized = settings.savingInputRoles?.includes(user.role) || user.role === 'kepala_tpq';

  const menus = [
    { id: 'isi_progres', label: 'Input Setoran Harian', icon: ClipboardList, color: 'bg-emerald-100 text-emerald-600', desc: 'Catat setoran harian mengaji santri bimbingan Anda.' },
    { id: 'nilai_target', label: 'Penilaian Kompetensi', icon: CheckSquare, color: 'bg-indigo-100 text-indigo-600', desc: 'Centang target kurikulum kompetensi jilid aktif santri.' },
    { id: 'pengajuan_kenaikan', label: 'Ajukan Naik Jilid / Juz', icon: Award, color: 'bg-orange-100 text-orange-600', desc: 'Ajukan kelayakan santri untuk mengikuti ujian jilid kepada kepala.' },
    { id: 'klaim_santri', label: 'Klaim Kelas Santri Baru', icon: UserPlus, color: 'bg-purple-100 text-purple-600', desc: 'Klaim santri yang belum ditugaskan guru ke kelas bimbingan Anda.' }
  ];

  if (isSavingAuthorized) {
    menus.push({
      id: 'input_tabungan_guru',
      label: 'Input Tabungan Santri',
      icon: DollarSign,
      color: 'bg-amber-100 text-amber-600',
      desc: 'Formulir pencatatan setoran & penarikan kas tabungan santri bimbingan.'
    });
  }

  if (activeTab === 'dashboard') {
    return (
      <div className="space-y-6 animate-fade-in">
        <h2 className="text-xl font-black text-gray-800">Panel Pengajar & Guru Ngaji: {user.name}</h2>
        
        {(user.role === 'kepala_tpq' || user.role === 'admin') && (
          <div className="bg-emerald-50 border border-emerald-150 p-4 rounded-2xl flex justify-between items-center">
            <div>
              <p className="text-xs font-bold text-emerald-800">Hak Akses Manajemen Kepala TPQ Aktif</p>
              <p className="text-[11px] text-gray-500 mt-0.5">Sebagai Kepala, Anda dapat beralih untuk melihat seluruh santri TPQ secara penuh atau hanya santri bimbingan sendiri.</p>
            </div>
            <button 
              onClick={() => setModeAksesKepala(!modeAksesKepala)}
              className={`text-xs font-bold px-4 py-2 rounded-xl border transition ${
                modeAksesKepala 
                ? 'bg-emerald-600 text-white border-emerald-600' 
                : 'bg-white text-emerald-700 border-emerald-200 hover:bg-emerald-50'
              }`}
            >
              {modeAksesKepala ? 'Akses Semua Santri (Aktif)' : 'Hanya Bimbingan Sendiri'}
            </button>
          </div>
        )}

        <MenuGrid menus={menus} onSelect={setActiveTab} />
      </div>
    );
  }

  if (activeTab === 'input_tabungan_guru' && isSavingAuthorized) {
    return (
      <div className="animate-fade-in">
        <BackButton onClick={() => setActiveTab('dashboard')} />
        <SavingsInputView users={users} savings={savings} updateTable={updateTable} showToast={showToast} recorderId={user.id} />
      </div>
    );
  }

  if (activeTab === 'isi_progres') {
    return (
      <div className="animate-fade-in space-y-6">
        <BackButton onClick={() => setActiveTab('dashboard')} />
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <h2 className="text-lg font-bold mb-6 flex items-center text-emerald-800"><ClipboardList className="mr-2"/> Input Setoran Progres Harian</h2>
          
          {activeSantriList.length === 0 ? (
            <div className="p-6 bg-amber-50 border border-amber-200 text-amber-900 rounded-xl text-xs space-y-2">
              <h4 className="font-bold flex items-center"><Info size={16} className="mr-1.5"/> Belum Ada Santri di Kelas Anda</h4>
              <p className="leading-relaxed">Daftar bimbingan mengaji Anda masih kosong. Silakan masuk ke menu utama lalu pilih <strong>Klaim Kelas Santri Baru</strong> untuk menambahkan santri.</p>
            </div>
          ) : (
            <form onSubmit={handleAddProgress} className="space-y-4 max-w-xl bg-gray-50 p-5 rounded-2xl border">
              <div>
                <label className="block text-xs font-bold mb-1 text-gray-600">Pilih Santri Bimbingan</label>
                <select name="santriId" className="p-2.5 border rounded-xl bg-white text-xs w-full font-semibold" required>
                  <option value="">-- Cari Nama Santri --</option>
                  {activeSantriList.map(s => <option key={s.id} value={s.id}>{s.name} ({s.jilid || 'Jilid 1'})</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold mb-1 text-gray-600">Tanggal Setor</label>
                  <input type="date" name="date" defaultValue={new Date().toISOString().substring(0, 10)} required className="p-2.5 border rounded-xl bg-white text-xs w-full" />
                </div>
                <div>
                  <label className="block text-xs font-bold mb-1 text-gray-600">Kualitas Nilai</label>
                  <select name="nilai" className="p-2.5 border rounded-xl bg-white text-xs w-full font-bold" required>
                    <option value="A (Sangat Lancar)">A (Sangat Lancar)</option>
                    <option value="B (Lancar)">B (Lancar)</option>
                    <option value="C (Cukup)">C (Cukup)</option>
                    <option value="D (Kurang)">D (Kurang)</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold mb-1 text-gray-600">Surah / Halaman</label>
                  <input type="text" name="surah" placeholder="An-Naba" required className="p-2.5 border rounded-xl bg-white text-xs w-full font-bold" />
                </div>
                <div>
                  <label className="block text-xs font-bold mb-1 text-gray-600">Ayat / Baris</label>
                  <input type="text" name="ayat" placeholder="1-5" required className="p-2.5 border rounded-xl bg-white text-xs w-full" />
                </div>
              </div>
              <button type="submit" className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold w-full py-3 rounded-xl text-xs transition duration-200 shadow">Simpan Progres Setoran</button>
            </form>
          )}
        </div>
      </div>
    );
  }

  if (activeTab === 'nilai_target') {
    return (
      <div className="animate-fade-in space-y-6">
        <BackButton onClick={() => setActiveTab('dashboard')} />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <h2 className="text-sm font-bold text-gray-700 mb-4 border-b pb-2 uppercase tracking-wider flex justify-between items-center">
              <span>Santri Bimbingan:</span>
              {user.role === 'kepala_tpq' && (
                <button 
                  onClick={() => {
                    setModeAksesKepala(!modeAksesKepala);
                    setSelectedSantri(null);
                  }}
                  className="text-[10px] bg-emerald-50 text-emerald-800 border border-emerald-100 font-bold px-2 py-1 rounded"
                >
                  {modeAksesKepala ? 'Hanya Bimbingan' : 'Akses Semua'}
                </button>
              )}
            </h2>
            {activeSantriList.length === 0 ? (
              <p className="text-xs text-gray-400 italic">Belum ada santri bimbingan di bimbingan Anda.</p>
            ) : (
              <div className="space-y-1.5 max-h-[400px] overflow-y-auto">
                {activeSantriList.map(s => (
                  <button 
                    key={s.id} 
                    onClick={() => setSelectedSantri(s)} 
                    className={`w-full p-3 rounded-xl text-left text-xs transition duration-200 border ${
                      selectedSantri?.id === s.id 
                      ? 'bg-emerald-50 text-emerald-800 font-bold border-emerald-300 shadow-sm' 
                      : 'bg-gray-50 text-gray-700 border-gray-100 hover:bg-gray-100'
                    }`}
                  >
                    <p className="font-bold text-sm">{s.name}</p>
                    <p className="text-[10px] text-gray-500 mt-1">Jilid Aktif: <span className="font-extrabold">{s.jilid || 'Jilid 1'}</span></p>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 md:col-span-2">
            <h2 className="text-sm font-bold text-gray-700 mb-4 border-b pb-2 uppercase tracking-wider flex items-center"><CheckSquare className="mr-1.5 text-emerald-600"/> Penilaian Kompetensi Target Kurikulum</h2>
            {!selectedSantri ? (
              <div className="p-8 text-center text-gray-400 text-xs italic bg-gray-50 border border-dashed rounded-xl">
                Silakan pilih nama santri di bimbingan kiri terlebih dahulu untuk menilai target kompetensi kurikulumnya.
              </div>
            ) : (
              <div>
                <div className="bg-emerald-50/50 p-4 rounded-xl border border-emerald-100 mb-6">
                  <p className="text-[10px] text-emerald-700 font-bold uppercase tracking-wider">SANTRI PILIHAN</p>
                  <h3 className="font-extrabold text-base text-gray-800 mt-0.5">{selectedSantri.name}</h3>
                  <p className="text-xs text-gray-500 mt-1">Tingkatan Saat Ini: <span className="font-bold text-emerald-700">{selectedSantri.jilid || 'Jilid 1'}</span></p>
                </div>

                <div className="space-y-2">
                  {targets.filter(t => t.level === (selectedSantri.jilid || 'Jilid 1')).length === 0 ? (
                    <p className="text-xs text-gray-400 italic text-center py-4">Belum ada target jilid ini yang dibuat oleh Kepala TPQ.</p>
                  ) : (
                    targets.filter(t => t.level === (selectedSantri.jilid || 'Jilid 1')).map(t => {
                      const isChecked = selectedSantri.completedTargets && selectedSantri.completedTargets.includes(String(t.id));
                      return (
                        <label key={t.id} className="flex justify-between items-center p-3.5 bg-gray-50 rounded-xl border border-gray-150 cursor-pointer hover:bg-gray-100/50 transition">
                          <span className="text-xs text-gray-750 leading-relaxed font-medium">{t.description}</span>
                          <input 
                            type="checkbox" 
                            checked={isChecked || false} 
                            onChange={() => toggleTargetCheck(selectedSantri.id, t.id)}
                            className="w-5 h-5 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                          />
                        </label>
                      );
                    })
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (activeTab === 'pengajuan_kenaikan') {
    return (
      <div className="animate-fade-in space-y-6">
        <BackButton onClick={() => setActiveTab('dashboard')} />
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <h2 className="text-lg font-bold mb-6 flex items-center text-orange-800"><Award className="mr-2"/> Form Pengajuan Kenaikan Jilid</h2>
          
          {activeSantriList.length === 0 ? (
            <div className="p-6 bg-amber-50 border border-amber-200 text-amber-900 rounded-xl text-xs space-y-2">
              <h4 className="font-bold flex items-center"><Info size={16} className="mr-1.5"/> Belum Ada Santri Untuk Diajukan</h4>
              <p className="leading-relaxed">Daftar bimbingan mengaji Anda masih kosong. Silakan masuk ke menu utama lalu pilih <strong>Klaim Kelas Santri Baru</strong> untuk menambahkan santri.</p>
            </div>
          ) : (
            <form onSubmit={submitPengajuanKenaikan} className="space-y-4 max-w-xl bg-gray-50 p-5 rounded-2xl border">
              <div>
                <label className="block text-xs font-bold mb-1 text-gray-600">Pilih Santri yang Siap Naik Jilid</label>
                <select name="santriId" className="p-2.5 border rounded-xl bg-white text-xs w-full font-semibold" required>
                  <option value="">-- Cari Nama Santri --</option>
                  {activeSantriList.map(s => <option key={s.id} value={s.id}>{s.name} (Tingkat: {s.jilid || 'Jilid 1'})</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold mb-1 text-gray-600">Tanggal Pengujian</label>
                  <input type="date" name="date" defaultValue={new Date().toISOString().substring(0, 10)} required className="p-2.5 border rounded-xl bg-white text-xs w-full" />
                </div>
                <div>
                  <label className="block text-xs font-bold mb-1 text-gray-600">Ujian Terakhir</label>
                  <input type="text" name="surah" placeholder="Membaca Halaman Terakhir / Juz Amma" required className="p-2.5 border rounded-xl bg-white text-xs w-full font-semibold" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold mb-1 text-gray-600">Rekomendasi Catatan Tambahan</label>
                <input type="text" name="ayat" placeholder="Tajwid dan makhraj sangat baik" required className="p-2.5 border rounded-xl bg-white text-xs w-full" />
              </div>
              <button type="submit" className="bg-orange-600 hover:bg-orange-700 text-white font-bold w-full py-3 rounded-xl text-xs transition duration-200 shadow">Kirim Pengajuan ke Kepala</button>
            </form>
          )}
        </div>
      </div>
    );
  }

  if (activeTab === 'klaim_santri') {
    const unclaimedSantri = users.filter(s => 
      s.role === 'santri' && 
      (!s.guruId || s.guruId === 'null' || s.guruId === 'undefined' || String(s.guruId).trim() === '')
    );
    return (
      <div className="animate-fade-in space-y-6">
        <BackButton onClick={() => setActiveTab('dashboard')} />
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <h2 className="text-lg font-bold mb-4 flex items-center text-purple-800"><UserPlus className="mr-2"/> Klaim Data Santri Baru</h2>
          <p className="text-xs text-gray-500 mb-6">Pilih santri baru yang baru saja mendaftar di bawah ini untuk ditambahkan ke bimbingan Anda.</p>
          {unclaimedSantri.length === 0 ? (
            <div className="p-8 text-center text-gray-400 italic bg-gray-50 border border-dashed rounded-2xl text-xs">
              Tidak ada data santri yang belum ditugaskan guru saat ini.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {unclaimedSantri.map(s => (
                <div key={s.id} className="p-4 bg-purple-50/50 border border-purple-100 rounded-2xl flex justify-between items-center">
                  <div>
                    <h4 className="font-extrabold text-sm text-purple-900">{s.name}</h4>
                    <p className="text-[10px] text-gray-500 mt-1">Rekomendasi Jilid: <span className="font-bold">{s.jilid || 'Jilid 1'}</span></p>
                  </div>
                  <button onClick={() => handleKlaimSantri(s.id)} className="bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold px-3 py-2 rounded-xl shadow transition duration-150">
                    Klaim Santri
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  return null;
}

function KepalaView({ activeTab, setActiveTab, user, users, setUsers, progress, targets, savings, settings, updateTable, showToast, simulatedWeekend, setSimulatedWeekend, appsScriptUrl, setAppsScriptUrl, isSyncing, loadDatabase }) {
  const handleAccKenaikan = async (progressId, santriId) => {
    const santri = users.find(u => String(u.id) === String(santriId));
    if (!santri) return;

    const updatedProgress = progress.map(p => String(p.id) === String(progressId) ? { ...p, status: 'acc_kepala' } : p);
    await updateTable('progress', updatedProgress);
    
    const currentJilidIdx = JILID_LEVELS.indexOf(santri.jilid);
    const nextJid = JILID_LEVELS[currentJilidIdx + 1] || 'Lulus (Tamat)';
    
    const updatedUsers = users.map(u => String(u.id) === String(santriId) ? { ...u, jilid: nextJid, completedTargets: [] } : u);
    setUsers(updatedUsers);
    await updateTable('users', updatedUsers);
    
    showToast(`Ujian disetujui! Santri berhasil naik ke tingkat ${nextJid}`);
  };

  const handleAddTarget = async (e) => {
    e.preventDefault();
    const newTarget = {
      id: Date.now().toString(),
      level: e.target.level.value,
      description: e.target.description.value
    };
    const updated = [...targets, newTarget];
    await updateTable('targets', updated);
    showToast('Target kurikulum baru berhasil ditambahkan!');
    e.target.reset();
  };

  const deleteTarget = async (id) => {
    const updated = targets.filter(t => String(t.id) !== String(id));
    await updateTable('targets', updated);
    showToast('Target kurikulum berhasil dihapus!');
  };

  const toggleSavingRole = async (roleName) => {
    let currentRoles = settings.savingInputRoles || ['guru', 'bendahara'];
    if (currentRoles.includes(roleName)) {
      currentRoles = currentRoles.filter(r => r !== roleName);
    } else {
      currentRoles = [...currentRoles, roleName];
    }
    const updatedSettings = { ...settings, savingInputRoles: currentRoles };
    await updateTable('settings', updatedSettings);
    showToast('Pengaturan hak akses tabungan berhasil diperbarui!');
  };

  const menus = [
    { id: 'acc_kenaikan', label: 'ACC Kenaikan Tingkat', icon: Award, color: 'bg-orange-100 text-orange-600', desc: 'Uji & ACC pengajuan naik jilid/kelompok juz dari guru.' },
    { id: 'target_jilid', label: 'Kurikulum Target TPQ', icon: Book, color: 'bg-blue-100 text-blue-600', desc: 'Atur kurikulum target tiap jilid, Al-Quran, hingga hafalan per juz.' },
    { id: 'guru_progres', label: 'Input Progres Harian (Guru)', icon: ClipboardList, color: 'bg-emerald-100 text-emerald-600', desc: 'Masuk mode pengajar untuk menginput setoran mengaji harian.' },
    { id: 'guru_target', label: 'Penilaian Kompetensi (Guru)', icon: CheckSquare, color: 'bg-purple-100 text-purple-700', desc: 'Masuk mode pengajar untuk mencentang kompetensi jilid santri.' },
    { id: 'guru_kenaikan', label: 'Ajukan Kenaikan Jilid (Guru)', icon: Award, color: 'bg-orange-100 text-orange-600', desc: 'Masuk mode pengajar untuk mengajukan kenaikan jilid bimbingan.' },
    { id: 'guru_klaim', label: 'Klaim Kelas Santri (Guru)', icon: UserPlus, color: 'bg-indigo-100 text-indigo-600', desc: 'Klaim & alokasikan santri bimbingan baru ke kelas Anda.' },
    { id: 'input_tabungan', label: 'Input Tabungan Santri', icon: DollarSign, color: 'bg-emerald-100 text-emerald-600', desc: 'Catat setoran dan penarikan tabungan santri.' },
    { id: 'otorisasi_tabungan', label: 'Otorisasi Tabungan', icon: Shield, color: 'bg-red-100 text-red-600', desc: 'Tentukan peran (role) staf mana saja yang diizinkan untuk menginput tabungan.' },
    { id: 'kelola_syahriah', label: 'Syahriah Keuangan', icon: CreditCard, color: 'bg-yellow-100 text-yellow-600', desc: 'Akses penuh untuk memantau iuran bulanan & membunyikan alarm tagihan.' },
    { id: 'hak_akses', label: 'Manajemen Hak Akses', icon: Shield, color: 'bg-purple-100 text-purple-800', desc: 'Atur kredensial, reset sandi, dan tambahkan akun baru.' },
    { id: 'pengaturan', label: 'Profil & Logo TPQ', icon: Settings, color: 'bg-gray-100 text-gray-700', desc: 'Ubah identitas nama instansi, Google Sheet URL & Logo.' }
  ];

  if (activeTab === 'dashboard') {
    return (
      <div className="animate-fade-in">
        <h2 className="text-xl font-black text-gray-800 mb-6">Administrasi Kepala TPQ: {user.name}</h2>
        <MenuGrid menus={menus} onSelect={setActiveTab} />
      </div>
    );
  }

  // ✅ Pastikan mapping tab guru_target -> nilai_target BENAR
  if (activeTab === 'guru_progres' || activeTab === 'guru_klaim' || activeTab === 'guru_target' || activeTab === 'guru_kenaikan') {
    let mappedTab = 'isi_progres';
    if (activeTab === 'guru_klaim') mappedTab = 'klaim_santri';
    else if (activeTab === 'guru_target') mappedTab = 'nilai_target';
    else if (activeTab === 'guru_kenaikan') mappedTab = 'pengajuan_kenaikan';

    return <GuruView activeTab={mappedTab} setActiveTab={setActiveTab} user={user} users={users} setUsers={setUsers} progress={progress} targets={targets} savings={savings} settings={settings} updateTable={updateTable} showToast={showToast} simulatedWeekend={simulatedWeekend} setSimulatedWeekend={setSimulatedWeekend} />;
  }

  if (activeTab === 'input_tabungan') {
    return (
      <div className="animate-fade-in">
        <BackButton onClick={() => setActiveTab('dashboard')} />
        <SavingsInputView users={users} savings={savings} updateTable={updateTable} showToast={showToast} recorderId={user.id} />
      </div>
    );
  }

  if (activeTab === 'kelola_syahriah') {
    return <BendaharaView activeTab="kelola_syahriah" setActiveTab={setActiveTab} users={users} savings={savings} settings={settings} updateTable={updateTable} showToast={showToast} />;
  }

  if (activeTab === 'hak_akses') {
    return <AdminView activeTab="hak_akses" setActiveTab={setActiveTab} users={users} updateTable={updateTable} showToast={showToast} settings={settings} appsScriptUrl={appsScriptUrl} setAppsScriptUrl={setAppsScriptUrl} loadDatabase={loadDatabase} />;
  }

  if (activeTab === 'pengaturan') {
    return <AdminView activeTab="pengaturan" setActiveTab={setActiveTab} users={users} updateTable={updateTable} showToast={showToast} settings={settings} appsScriptUrl={appsScriptUrl} setAppsScriptUrl={setAppsScriptUrl} loadDatabase={loadDatabase} />;
  }

  if (activeTab === 'otorisasi_tabungan') {
    const rolesList = [
      { id: 'guru', label: 'Guru Ngaji / Pengajar' },
      { id: 'bendahara', label: 'Bendahara Keuangan' },
      { id: 'admin', label: 'Admin System' }
    ];
    const activeRoles = settings.savingInputRoles || ['guru', 'bendahara'];
    return (
      <div className="animate-fade-in space-y-6">
        <BackButton onClick={() => setActiveTab('dashboard')} />
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 max-w-xl">
          <h2 className="text-lg font-bold mb-2 flex items-center text-red-800"><Shield className="mr-2"/> Otorisasi Hak Akses Tabungan Santri</h2>
          <p className="text-xs text-gray-500 mb-6">Tentukan peran staf mana saja yang diizinkan untuk menginput tabungan santri.</p>
          
          <div className="space-y-3">
            {rolesList.map(r => {
              const isChecked = activeRoles.includes(r.id);
              return (
                <label key={r.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100 cursor-pointer hover:bg-gray-100 transition-colors">
                  <div>
                    <p className="text-sm font-bold text-gray-800">{r.label}</p>
                    <p className="text-[10px] text-gray-400 font-medium">Bisa menambahkan dan mengelola mutasi kas tabungan.</p>
                  </div>
                  <input 
                    type="checkbox" 
                    checked={isChecked} 
                    onChange={() => toggleSavingRole(r.id)} 
                    className="w-5 h-5 rounded text-red-600 focus:ring-red-500 cursor-pointer"
                  />
                </label>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  if (activeTab === 'acc_kenaikan') {
    const pendingRequests = progress.filter(p => p.type === 'kenaikan' && p.status === 'pending');
    return (
      <div className="animate-fade-in">
        <BackButton onClick={() => setActiveTab('dashboard')} />
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <h2 className="text-lg font-bold mb-6 flex items-center text-orange-800"><Award className="mr-2"/> Evaluasi & ACC Kenaikan Jilid / Juz</h2>
          {pendingRequests.length === 0 ? (
            <div className="p-8 text-center text-gray-500 bg-gray-50 rounded-2xl border border-dashed border-gray-300 text-sm">
              Tidak ada pengajuan ujian kenaikan jilid yang tertunda saat ini.
            </div>
          ) : (
            <div className="space-y-4">
              {pendingRequests.map(req => {
                const s = users.find(u => String(u.id) === String(req.santriId));
                const g = users.find(u => u.id !== null && String(u.id) === String(s?.guruId));
                return (
                  <div key={req.id} className="border border-orange-200 bg-orange-50/50 p-5 rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center shadow-sm">
                    <div>
                      <h3 className="font-extrabold text-base text-orange-955">{s?.name}</h3>
                      <div className="flex flex-wrap gap-4 text-xs font-semibold text-gray-600 mt-1">
                        <p>Tingkat Saat Ini: <span className="text-orange-700 bg-orange-50 px-2 py-0.5 rounded border">{s?.jilid}</span></p>
                        <p>Diajukan Oleh: <span className="text-gray-800 font-bold">{g ? g.name : 'Sistem'}</span></p>
                      </div>
                      <div className="mt-3 bg-white p-3.5 rounded-xl border border-orange-100 text-xs">
                        <p className="font-bold text-gray-700 mb-1">Catatan Ujian Terakhir ({req.date}):</p>
                        <p className="text-gray-500 italic">"Membaca {req.surah} {req.ayat}"</p>
                      </div>
                    </div>
                    <div className="mt-4 md:mt-0 w-full md:w-auto">
                      <button onClick={() => handleAccKenaikan(req.id, s?.id)} className="w-full md:w-auto bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-6 py-2.5 rounded-xl text-xs shadow-sm transition flex items-center justify-center">
                        <CheckCircle size={16} className="mr-1.5" /> Setujui Kenaikan Jilid
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    );
  }

  if (activeTab === 'target_jilid') {
    return (
      <div className="animate-fade-in">
        <BackButton onClick={() => setActiveTab('dashboard')} />
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <h2 className="text-lg font-bold mb-6 flex items-center text-blue-800"><Book className="mr-2"/> Kelola Target Kompetensi Jilid & Juz (Kurikulum)</h2>
          
          <form onSubmit={handleAddTarget} className="flex flex-col md:flex-row gap-3 mb-8 bg-gray-50 p-4 rounded-2xl border border-gray-200">
            <select name="level" className="p-3 border rounded-xl bg-white font-bold outline-none focus:border-blue-500 md:w-1/4 text-xs text-gray-700" required>
              {JILID_LEVELS.map(j => <option key={j} value={j}>{j}</option>)}
            </select>
            <input type="text" name="description" placeholder="Kompetensi target..." className="flex-1 p-3 border rounded-xl outline-none focus:border-blue-500 text-xs bg-white text-gray-800" required />
            <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-5 py-3 rounded-xl shadow-sm text-xs transition duration-200">Tambah Target</button>
          </form>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {JILID_LEVELS.map(level => {
              const levelTargets = targets.filter(t => t.level === level);
              if(levelTargets.length === 0) return null;
              return (
                <div key={level} className="border border-blue-50 p-4 rounded-2xl bg-blue-50/10">
                  <h3 className="font-extrabold text-xs text-blue-900 border-b pb-2 mb-3 tracking-wide">{level}</h3>
                  <ul className="space-y-2">
                    {levelTargets.map(t => (
                      <li key={t.id} className="flex justify-between items-start bg-white p-3 rounded-xl border shadow-sm gap-3 animate-fade-in">
                        <span className="text-xs text-gray-800 leading-relaxed font-medium">{t.description}</span>
                        <button onClick={() => deleteTarget(t.id)} className="text-red-500 hover:text-red-700 p-1.5 bg-red-50 rounded-lg transition-all flex-shrink-0"><Trash2 size={13}/></button>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  return null;
}

function BendaharaView({ activeTab, setActiveTab, users, savings, settings, updateTable, showToast }) {
  const [selectedMonth, setSelectedMonth] = useState('2026-07-10');
  const [isInputTabunganOpen, setIsInputTabunganOpen] = useState(false);

  const handleBayar = async (santriId) => {
    const santri = users.find(u => String(u.id) === String(santriId));
    if (!santri) return;

    const history = santri.historyBayar ? [...santri.historyBayar] : [];
    
    if (history.includes(selectedMonth)) {
      showToast('Error: Tanggal pembayaran ini sudah terdaftar!', 'error');
      return;
    }

    const updatedHistory = [...history, selectedMonth];
    const updatedUsers = users.map(u => {
      if (String(u.id) === String(santriId)) {
        return { ...u, historyBayar: updatedHistory, hasAlarm: false };
      }
      return u;
    });

    await updateTable('users', updatedUsers);
    showToast(`Syahriah ${santri.name} lunas untuk tanggal ${selectedMonth}!`);
  };

  const toggleAlarm = async (santriId) => {
    const santri = users.find(u => String(u.id) === String(santriId));
    if (!santri) return;

    const updated = users.map(u => String(u.id) === String(santriId) ? { ...u, hasAlarm: !u.hasAlarm } : u);
    await updateTable('users', updated);
    showToast(`Alarm tagihan untuk ${santri.name} berhasil diubah.`);
  };

  const isSavingAuthorized = settings.savingInputRoles?.includes('bendahara');

  const menus = [
    { id: 'kelola_syahriah', label: 'Iuran Syahriah Bulanan', icon: CreditCard, color: 'bg-yellow-100 text-yellow-600', desc: 'Validasi pencatatan iuran SPP bulanan santri.' }
  ];

  if (isSavingAuthorized) {
    menus.push({ id: 'input_tabungan_bendahara', label: 'Input Tabungan Santri', icon: DollarSign, color: 'bg-emerald-100 text-emerald-600', desc: 'Formulir pengelolaan setoran & penarikan tabungan.' });
  }

  if (activeTab === 'dashboard') {
    return (
      <div className="space-y-6 animate-fade-in">
        <h2 className="text-xl font-black text-gray-800">Manajemen Bendahara & Keuangan</h2>
        <MenuGrid menus={menus} onSelect={(id) => {
          if (id === 'input_tabungan_bendahara') {
            setIsInputTabunganOpen(true);
            setActiveTab('input_tabungan_bendahara');
          } else {
            setActiveTab(id);
          }
        }} />
      </div>
    );
  }

  if (activeTab === 'input_tabungan_bendahara' && isSavingAuthorized) {
    return (
      <div className="animate-fade-in">
        <BackButton onClick={() => { setIsInputTabunganOpen(false); setActiveTab('dashboard'); }} />
        <SavingsInputView users={users} savings={savings} updateTable={updateTable} showToast={showToast} recorderId="bendahara" />
      </div>
    );
  }

  if (activeTab === 'kelola_syahriah') {
    const santriList = users.filter(u => u.role === 'santri');
    return (
      <div className="animate-fade-in space-y-6">
        <BackButton onClick={() => setActiveTab('dashboard')} />
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
            <div>
              <h2 className="text-lg font-bold flex items-center text-yellow-800"><CreditCard className="mr-2"/> Pengelolaan Iuran Syahriah Santri</h2>
              <p className="text-xs text-gray-500 mt-1">Transaksi SPP bulanan dan mengaktifkan notifikasi alarm tunggakan.</p>
            </div>
            
            <div className="flex items-center space-x-2">
              <label className="text-xs font-bold text-gray-500 flex-shrink-0">Pilih Tanggal SPP:</label>
              <input 
                type="date" 
                value={selectedMonth} 
                onChange={(e) => setSelectedMonth(e.target.value)} 
                className="p-2 border rounded-xl text-xs bg-gray-50 outline-none font-bold text-gray-700"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-yellow-50 text-yellow-950 font-bold uppercase border-b border-yellow-100">
                  <th className="p-4 rounded-tl-xl">Nama Lengkap Santri</th>
                  <th className="p-4">Tingkatan Mengaji</th>
                  <th className="p-4 text-center">Status Pembayaran</th>
                  <th className="p-4 text-center">Alarm Tagihan</th>
                  <th className="p-4 text-center rounded-tr-xl">Aksi Transaksi</th>
                </tr>
              </thead>
              <tbody>
                {santriList.map(s => {
                  const isPaid = s.historyBayar && s.historyBayar.includes(selectedMonth);
                  return (
                    <tr key={s.id} className="border-b hover:bg-gray-50 transition">
                      <td className="p-4 font-bold text-gray-800">{s.name}</td>
                      <td className="p-4 text-gray-500 font-semibold">{s.jilid || 'Jilid 1'}</td>
                      <td className="p-4 text-center">
                        {isPaid ? (
                          <span className="inline-flex items-center bg-emerald-50 text-emerald-700 border border-emerald-100 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase">
                            <CheckCircle size={11} className="mr-1 text-emerald-600"/> Lunas Dibayar
                          </span>
                        ) : (
                          <span className="inline-flex items-center bg-red-50 text-red-700 border border-red-100 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase">
                            Belum Membayar
                          </span>
                        )}
                      </td>
                      <td className="p-4 text-center">
                        <button 
                          onClick={() => toggleAlarm(s.id)} 
                          className={`p-2 rounded-xl border transition ${
                            s.hasAlarm 
                            ? 'bg-red-50 border-red-200 text-red-600 animate-pulse' 
                            : 'bg-gray-50 border-gray-200 text-gray-400 hover:text-gray-600'
                          }`}
                          title="Bunyikan Alarm Tagihan"
                        >
                          <Bell size={16} />
                        </button>
                      </td>
                      <td className="p-4 text-center">
                        <button 
                          onClick={() => handleBayar(s.id)} 
                          disabled={isPaid}
                          className={`font-bold px-4 py-2 rounded-xl text-[10px] transition shadow-sm ${
                            isPaid 
                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                            : 'bg-emerald-600 hover:bg-emerald-700 text-white hover:shadow'
                          }`}
                        >
                          Selesaikan Bayar
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  return null;
}

function SavingsInputView({ users, savings, updateTable, showToast, recorderId }) {
  const santriList = users.filter(u => u.role === 'santri');
  
  const handleSaveTransaction = async (e) => {
    e.preventDefault();
    const santriId = e.target.santriId.value;
    if (!santriId) {
      showToast('Pilih santri terlebih dahulu!', 'error');
      return;
    }
    const amount = Number(e.target.amount.value);
    const type = e.target.type.value;

    const newSaving = {
      id: 's_' + Date.now().toString(),
      santriId: santriId,
      date: e.target.date.value,
      amount: amount,
      type: type,
      description: e.target.description.value.trim(),
      inputBy: String(recorderId)
    };

    const updated = [newSaving, ...savings];
    await updateTable('savings', updated);
    showToast(`Transaksi tabungan Rp ${amount.toLocaleString('id-ID')} berhasil dicatat!`);
    e.target.reset();
  };

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-6 animate-fade-in">
      <div>
        <h2 className="text-lg font-bold flex items-center text-emerald-800"><DollarSign className="mr-1.5 text-emerald-600"/> Pencatatan Tabungan Santri</h2>
        <p className="text-xs text-gray-500 mt-1">Catat transaksi setoran masuk maupun penarikan kas tabungan santri.</p>
      </div>

      <form onSubmit={handleSaveTransaction} className="space-y-4 max-w-xl bg-gray-50 p-5 rounded-2xl border">
        <div>
          <label className="block text-xs font-bold mb-1 text-gray-600">Pilih Santri</label>
          <select name="santriId" className="p-2.5 border rounded-xl bg-white text-xs w-full font-bold text-gray-700" required>
            <option value="">-- Pilih Nama Santri --</option>
            {santriList.map(s => <option key={s.id} value={s.id}>{s.name} (Tingkat: {s.jilid})</option>)}
          </select>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-bold mb-1 text-gray-600">Tanggal Transaksi</label>
            <input type="date" name="date" defaultValue={new Date().toISOString().substring(0, 10)} required className="p-2.5 border rounded-xl bg-white text-xs w-full" />
          </div>
          <div>
            <label className="block text-xs font-bold mb-1 text-gray-600">Jenis Transaksi</label>
            <select name="type" className="p-2.5 border rounded-xl bg-white text-xs w-full font-bold text-gray-700" required>
              <option value="setor">Setoran Masuk</option>
              <option value="tarik">Penarikan Keluar</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold mb-1 text-gray-600">Nominal Rp</label>
            <input type="number" name="amount" placeholder="10000" required className="p-2.5 border rounded-xl bg-white text-xs w-full font-bold" />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold mb-1 text-gray-600">Catatan / Keterangan Transaksi</label>
          <input type="text" name="description" placeholder="Setoran kas tabungan mingguan" className="p-2.5 border rounded-xl bg-white text-xs w-full text-gray-600 font-medium" />
        </div>

        <button type="submit" className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold w-full py-3 rounded-xl text-xs transition duration-200 shadow">
          Simpan Transaksi Tabungan
        </button>
      </form>
    </div>
  );
}

function AdminView({ activeTab, setActiveTab, users, updateTable, showToast, settings, appsScriptUrl, setAppsScriptUrl, loadDatabase }) {
  const [showPasswordMap, setShowPasswordMap] = useState({});
  const [resettingUser, setResettingUser] = useState(null);
  const [newPasswordVal, setNewPasswordVal] = useState('');
  const [deletingUser, setDeletingUser] = useState(null);
  const [showScriptModal, setShowScriptModal] = useState(false);
  const [selectedFormRole, setSelectedFormRole] = useState('santri');

  const togglePasswordVisibility = (id) => {
    setShowPasswordMap(prev => ({ ...prev, [id] : !prev[id] }));
  };

  const triggerResetDialog = (userObj) => {
    setResettingUser(userObj);
    setNewPasswordVal('');
  };

  const submitResetPassword = async () => {
    if (!newPasswordVal.trim()) {
      showToast('Sandi baru tidak boleh kosong!', 'error');
      return;
    }
    try {
      const updated = users.map(user => 
        String(user.id).trim() === String(resettingUser.id).trim() 
        ? { ...user, password: newPasswordVal.trim() } 
        : user
      );
      await updateTable('users', updated);
      showToast(`Password untuk ${resettingUser.name} berhasil diubah.`);
      setResettingUser(null);
    } catch (err) {
      showToast('Gagal mereset sandi: ' + err.message, 'error');
    }
  };

  const triggerDeleteDialog = (userObj) => {
    setDeletingUser(userObj);
  };

  const confirmDeleteUser = async () => {
    try {
      const updated = users.filter(u => String(u.id).trim() !== String(deletingUser.id).trim());
      const success = await updateTable('users', updated);
      if (success) {
        showToast('Akun telah berhasil dihapus secara permanen.');
      } else {
        showToast('Gagal menghapus akun pengguna.', 'error');
      }
      setDeletingUser(null);
    } catch (err) {
      console.error("Error deleting user:", err);
      showToast('Gagal menghapus pengguna: ' + err.message, 'error');
      setDeletingUser(null);
    }
  };

  const handleAddUser = async (e) => {
    e.preventDefault();
    try {
      const form = e.target;
      const role = form.elements.role.value;
      
      let initialJilid = undefined;
      if (role === 'santri') {
        initialJilid = form.elements.jilid ? form.elements.jilid.value : 'Jilid 1';
      }

      const newUser = {
        id: Date.now().toString(),
        username: form.elements.username.value.trim().toLowerCase(),
        password: form.elements.password.value,
        role: role,
        name: form.elements.name.value.trim(),
        guruId: null,
        jilid: initialJilid,
        hasAlarm: false,
        lastAccDate: '',
        completedTargets: [],
        historyBayar: []
      };

      const isExist = users.some(u => String(u.username).toLowerCase() === String(newUser.username).toLowerCase());
      if (isExist) {
        showToast('Username sudah dipakai! Silakan pilih username unik.', 'error');
        return;
      }

      const updated = [...users, newUser];
      const success = await updateTable('users', updated);
      if (success) {
        showToast('Akun pengguna baru berhasil ditambahkan!');
        form.reset();
        setSelectedFormRole('santri');
      } else {
        showToast('Gagal mendaftarkan akun.', 'error');
      }
    } catch (err) {
      console.error("Error adding user:", err);
      showToast('Gagal memproses tambah akun: ' + err.message, 'error');
    }
  };

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    const newUrl = e.target.appsScriptUrl.value.trim();
    
    setAppsScriptUrl(newUrl);
    try {
      localStorage.setItem('tpq_apps_script_url', newUrl);
    } catch(err){}

    const updated = {
      ...settings,
      tpqName: e.target.tpqName.value,
      logoUrl: e.target.logoUrl.value
    };

    await updateTable('settings', updated, newUrl);
    showToast('Profil lembaga & Database Sheets berhasil diperbarui!');
    
    setTimeout(() => {
      loadDatabase(newUrl);
    }, 550);
  };

  const codeScriptGoogle = `// KODE GOOGLE APPS SCRIPT UNTUK GOOGLE SHEETS
function doGet(e) {
  var action = e.parameter.action;
  var sheet = SpreadsheetApp.getActiveSpreadsheet();
  
  if (action === "getAll") {
    var data = {};
    var sheets = ["users", "progress", "targets", "savings", "settings"];
    sheets.forEach(function(sName) {
      var s = sheet.getSheetByName(sName);
      if (s) {
        var range = s.getDataRange();
        var values = range.getValues();
        if (values.length > 1) {
          var headers = values[0];
          data[sName] = values.slice(1).map(function(row) {
            var obj = {};
            headers.forEach(function(h, idx) {
              var cellVal = row[idx];
              if (cellVal === "") {
                 obj[h] = "";
                 return;
              }
              try {
                if (typeof cellVal === 'string' && (cellVal === 'true' || cellVal === 'false' || cellVal.indexOf('[') === 0 || cellVal.indexOf('{') === 0)) {
                   obj[h] = JSON.parse(cellVal);
                } else {
                   obj[h] = cellVal;
                }
              } catch(err) {
                obj[h] = cellVal;
              }
            });
            return obj;
          });
        } else {
          data[sName] = [];
        }
      }
    });
    if (data.settings && data.settings.length > 0) {
      data.settings = data.settings[0];
    } else {
      data.settings = { tpqName: "TPQ Al-Ikhlas Bakalan", logoUrl: "", savingInputRoles: ["guru", "bendahara"] };
    }
    return ContentService.createTextOutput(JSON.stringify({status: "success", data: data}))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function doPost(e) {
  try {
    var postData = JSON.parse(e.postData.contents);
    var table = postData.table;
    var data = postData.data;
    
    var sheet = SpreadsheetApp.getActiveSpreadsheet();
    var s = sheet.getSheetByName(table);
    if (!s) {
      s = sheet.insertSheet(table);
    }
    s.clear();
    
    if (table === "settings" && !Array.isArray(data)) {
      data = [data];
    }
    
    if (data.length > 0) {
      var keySet = {};
      data.forEach(function(item) {
        Object.keys(item).forEach(function(k) {
          keySet[k] = true;
        });
      });
      var keys = Object.keys(keySet);
      
      s.appendRow(keys);
      
      var rows = data.map(function(item) {
        return keys.map(function(k) {
          var val = item[k];
          if (val === undefined || val === null) return "";
          return (typeof val === "object") ? JSON.stringify(val) : String(val);
        });
      });
      
      if (rows.length > 0) {
        s.getRange(2, 1, rows.length, keys.length).setValues(rows);
      }
    }
    return ContentService.createTextOutput(JSON.stringify({status: "success"}))
      .setMimeType(ContentService.MimeType.JSON);
  } catch(err) {
    return ContentService.createTextOutput(JSON.stringify({status: "error", message: err.toString()}))
      .setMimeType(ContentService.MimeType.JSON);
  }
}`;

  const copyScriptToClipboard = () => {
    const el = document.createElement('textarea');
    el.value = codeScriptGoogle;
    document.body.appendChild(el);
    el.select();
    document.execCommand('copy');
    document.body.removeChild(el);
    showToast('Script berhasil disalin ke papan klip!');
  };

  const menus = [
    { id: 'pengaturan', label: 'Profil & Database Sheets', icon: Settings, color: 'bg-gray-100 text-gray-700', desc: 'Atur nama lembaga dan Integrasi Database Google Sheets.' },
    { id: 'hak_akses', label: 'Kelola Hak Akses', icon: Shield, color: 'bg-purple-100 text-purple-700', desc: 'Atur hak akses, tambahkan user baru, reset password, dan hapus akun.' }
  ];

  if (activeTab === 'dashboard') {
    return (
      <div className="animate-fade-in">
        <h2 className="text-xl font-black text-gray-800 mb-6">Control Panel Admin Utama</h2>
        <MenuGrid menus={menus} onSelect={setActiveTab} />
      </div>
    );
  }

  if (activeTab === 'pengaturan') {
    return (
      <div className="animate-fade-in space-y-6">
        <BackButton onClick={() => setActiveTab('dashboard')} />
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
            <div>
              <h2 className="text-lg font-bold flex items-center text-gray-700"><Settings className="mr-2"/> Pengaturan Lembaga & Database</h2>
              <p className="text-xs text-gray-500 mt-1">Kelola integrasi data Google Sheets dan data branding visual TPQ.</p>
            </div>
            <button 
              onClick={() => setShowScriptModal(true)} 
              className="mt-4 md:mt-0 bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 text-xs font-bold px-4 py-2.5 rounded-xl flex items-center transition"
            >
              <Database size={16} className="mr-2"/> Dapatkan Kode Google Sheets
            </button>
          </div>

          {showScriptModal && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 animate-fade-in">
              <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl border flex flex-col max-h-[85vh]">
                <div className="p-6 border-b flex justify-between items-center">
                  <div>
                    <h3 className="font-extrabold text-gray-800 text-base">Google Apps Script Web App</h3>
                    <p className="text-xs text-gray-400 mt-0.5">Pasang script ini pada Google Sheets milik Anda (Ekstensi &gt; Apps Script).</p>
                  </div>
                  <button onClick={() => setShowScriptModal(false)} className="text-gray-400 hover:text-gray-600"><X size={20}/></button>
                </div>
                <pre className="p-6 overflow-y-auto flex-1 bg-gray-900 text-gray-100 font-mono text-xs rounded-b-xl whitespace-pre flex-shrink-0">
                  {codeScriptGoogle}
                </pre>
                <div className="p-4 border-t bg-gray-50 flex flex-col sm:flex-row justify-between items-center gap-3 rounded-b-3xl">
                  <span className="text-[11px] text-gray-500 font-semibold">
                    Deploy sebagai <strong>Web App</strong>, Execute as: <strong>Me</strong>, Who has access: <strong>Anyone</strong>.
                  </span>
                  <div className="flex items-center space-x-2">
                    <button onClick={copyScriptToClipboard} className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2 rounded-xl text-xs flex items-center shadow">
                      <Copy size={14} className="mr-1.5"/> Salin Script
                    </button>
                    <button onClick={() => setShowScriptModal(false)} className="bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold px-4 py-2 rounded-xl text-xs">
                      Tutup
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          <form onSubmit={handleSaveSettings} className="space-y-4 max-w-xl bg-gray-50 p-5 rounded-2xl border">
            <div>
              <label className="block text-xs font-bold mb-1 text-gray-600">Nama Lembaga TPQ</label>
              <input type="text" name="tpqName" defaultValue={settings.tpqName || ''} required className="p-2.5 border rounded-xl bg-white text-xs w-full font-bold text-gray-800" />
            </div>
            <div>
              <label className="block text-xs font-bold mb-1 text-gray-600">URL Gambar Logo Lembaga (Opsional)</label>
              <input type="url" name="logoUrl" defaultValue={settings.logoUrl || ''} placeholder="https://..." className="p-2.5 border rounded-xl bg-white text-xs w-full text-gray-600" />
            </div>
            <div>
              <label className="block text-xs font-bold mb-1 text-gray-600">URL Deploy Google Apps Script Exec</label>
              <input type="url" name="appsScriptUrl" defaultValue={appsScriptUrl} placeholder="https://script.google.com/macros/s/.../exec" required className="p-2.5 border rounded-xl bg-white text-xs w-full font-mono text-gray-700" />
            </div>
            <button type="submit" className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold w-full py-3 rounded-xl text-xs transition duration-200 shadow">
              Simpan Pengaturan
            </button>
          </form>
        </div>
      </div>
    );
  }

  if (activeTab === 'hak_akses') {
    return (
      <div className="animate-fade-in space-y-6">
        <BackButton onClick={() => setActiveTab('dashboard')} />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <h2 className="text-sm font-bold text-gray-800 mb-4 flex items-center border-b pb-2"><UserPlus size={16} className="mr-2 text-purple-600"/> Tambah Akun Pengguna Baru</h2>
            <form onSubmit={handleAddUser} className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-gray-600 mb-1">Nama Lengkap</label>
                <input name="name" type="text" placeholder="Ahmad Zaki" required className="p-2.5 border rounded-xl bg-gray-50 text-xs w-full" />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-gray-600 mb-1">Username Login</label>
                <input name="username" type="text" placeholder="zaki" required className="p-2.5 border rounded-xl bg-gray-50 text-xs w-full" />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-gray-600 mb-1">Password</label>
                <input name="password" type="text" placeholder="123" required className="p-2.5 border rounded-xl bg-gray-50 text-xs w-full" />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-gray-600 mb-1">Peran / Hak Akses</label>
                <select name="role" value={selectedFormRole} onChange={(e) => setSelectedFormRole(e.target.value)} className="p-2.5 border rounded-xl bg-gray-50 text-xs w-full font-bold">
                  <option value="santri">Santri / Wali</option>
                  <option value="guru">Guru Ngaji</option>
                  <option value="bendahara">Bendahara</option>
                  <option value="kepala_tpq">Kepala TPQ</option>
                  <option value="admin">Admin System</option>
                </select>
              </div>
              {selectedFormRole === 'santri' && (
                <div>
                  <label className="block text-[11px] font-bold text-gray-600 mb-1">Tingkatan / Jilid Awal</label>
                  <select name="jilid" defaultValue="Jilid 1" className="p-2.5 border rounded-xl bg-gray-50 text-xs w-full font-semibold">
                    {JILID_LEVELS.map(j => <option key={j} value={j}>{j}</option>)}
                  </select>
                </div>
              )}
              <button type="submit" className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-2.5 rounded-xl text-xs transition shadow mt-2">
                Daftarkan Pengguna
              </button>
            </form>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 lg:col-span-2">
            <h2 className="text-sm font-bold text-gray-800 mb-4 flex items-center border-b pb-2"><Users size={16} className="mr-2 text-purple-600"/> Daftar Akun Pengguna Terdaftar ({users.length})</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-gray-50 font-bold text-gray-600 uppercase border-b">
                    <th className="p-3">Nama Lengkap</th>
                    <th className="p-3">Username</th>
                    <th className="p-3">Peran</th>
                    <th className="p-3">Password</th>
                    <th className="p-3 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(u => (
                    <tr key={u.id} className="border-b hover:bg-gray-50 transition">
                      <td className="p-3 font-bold text-gray-800">
                        {u.name}
                        {u.role === 'santri' && <span className="block text-[10px] text-gray-400 font-normal">{u.jilid}</span>}
                      </td>
                      <td className="p-3 font-mono text-gray-600">{u.username}</td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-purple-50 text-purple-700 border border-purple-100">
                          {getRoleName(u.role)}
                        </span>
                      </td>
                      <td className="p-3 font-mono">
                        <div className="flex items-center space-x-1">
                          <span>{showPasswordMap[u.id] ? u.password : '••••••'}</span>
                          <button onClick={() => togglePasswordVisibility(u.id)} className="text-gray-400 hover:text-gray-600 p-1">
                            {showPasswordMap[u.id] ? <EyeOff size={12}/> : <Eye size={12}/>}
                          </button>
                        </div>
                      </td>
                      <td className="p-3 text-center">
                        <div className="flex items-center justify-center space-x-1">
                          <button onClick={() => triggerResetDialog(u)} className="p-1.5 bg-amber-50 text-amber-700 hover:bg-amber-100 rounded-lg transition" title="Reset Password">
                            <Unlock size={13}/>
                          </button>
                          <button onClick={() => triggerDeleteDialog(u)} className="p-1.5 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg transition" title="Hapus Akun">
                            <Trash2 size={13}/>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {resettingUser && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 animate-fade-in">
            <div className="bg-white p-6 rounded-2xl shadow-xl w-full max-w-sm border">
              <h3 className="font-extrabold text-sm text-gray-800 mb-1">Reset Password Akun</h3>
              <p className="text-xs text-gray-500 mb-4">Pengguna: <strong>{resettingUser.name}</strong> (@{resettingUser.username})</p>
              <input 
                type="text" 
                value={newPasswordVal} 
                onChange={(e) => setNewPasswordVal(e.target.value)} 
                placeholder="Masukkan kata sandi baru..." 
                className="w-full p-2.5 border rounded-xl bg-gray-50 text-xs font-mono mb-4 focus:ring-2 focus:ring-amber-500 outline-none"
              />
              <div className="flex justify-end space-x-2">
                <button onClick={() => setResettingUser(null)} className="px-4 py-2 bg-gray-100 text-gray-600 rounded-xl text-xs font-bold">Batal</button>
                <button onClick={submitResetPassword} className="px-4 py-2 bg-amber-600 text-white rounded-xl text-xs font-bold shadow">Simpan Sandi Baru</button>
              </div>
            </div>
          </div>
        )}

        {deletingUser && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 animate-fade-in">
            <div className="bg-white p-6 rounded-2xl shadow-xl w-full max-w-sm border">
              <h3 className="font-extrabold text-sm text-red-600 mb-1 flex items-center"><AlertTriangle size={16} className="mr-1.5"/> Konfirmasi Hapus Akun</h3>
              <p className="text-xs text-gray-600 my-3 leading-relaxed">Apakah Anda yakin ingin menghapus akun <strong>{deletingUser.name}</strong> (@{deletingUser.username}) secara permanen?</p>
              <div className="flex justify-end space-x-2 mt-4">
                <button onClick={() => setDeletingUser(null)} className="px-4 py-2 bg-gray-100 text-gray-600 rounded-xl text-xs font-bold">Batal</button>
                <button onClick={confirmDeleteUser} className="px-4 py-2 bg-red-600 text-white rounded-xl text-xs font-bold shadow">Hapus Permanen</button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return null;
}
