import React, { useState, useEffect } from 'react';
import {
  User, Lock, Shield, Book, BookOpen, CheckCircle,
  AlertTriangle, Users, LogOut, CreditCard, Bell, Plus,
  Trash2, Check, X, UserPlus, Info, Edit, ArrowLeft,
  Eye, EyeOff, Award, ClipboardList, Settings, DollarSign,
  CheckSquare, RefreshCw, Database, Copy, Unlock,
  ChevronDown, ChevronUp, TrendingUp, TrendingDown, Search,
  ListChecks // ✅ Pastikan baris ini ada, nama persis seperti ini
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
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in">
    {menus.map(menu => (
      <button key={menu.id} onClick={() => onSelect(menu.id)} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md hover:border-emerald-200 flex flex-col items-center justify-center text-center transition-all duration-300 group relative overflow-hidden w-full text-left sm:text-center">
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

// ==================================================
// FUNGSI PENAMPUNG INPUT TABUNGAN
// ==================================================
function SavingsInputView({ users, savings, updateTable, showToast, recorderId }) {
  const [form, setForm] = useState({ 
    santriId: '', 
    date: new Date().toISOString().slice(0,10), 
    amount: '', 
    type: 'setor', 
    description: '' 
  });
  const santriList = users.filter(u => u.role === 'santri');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.santriId || !form.amount) {
      showToast('Lengkapi data santri dan nominal!', 'error');
      return;
    }
    const newSavings = {
      id: Date.now().toString(),
      santriId: form.santriId,
      date: form.date,
      amount: parseInt(form.amount),
      type: form.type,
      description: form.description,
      inputBy: recorderId
    };
    await updateTable('savings', [newSavings, ...savings]);
    showToast('Data tabungan berhasil disimpan!');
    setForm({ 
      santriId: '', 
      date: new Date().toISOString().slice(0,10), 
      amount: '', 
      type: 'setor', 
      description: '' 
    });
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-2xl shadow-sm border">
        <h3 className="text-lg font-bold mb-4 flex items-center text-amber-800">
          <DollarSign className="mr-2"/> Input Mutasi Tabungan Santri
        </h3>
        <form onSubmit={handleSubmit} className="space-y-4 max-w-md">
          <div>
            <label className="block text-xs font-bold mb-1 text-gray-700">Pilih Santri</label>
            <select
              value={form.santriId}
              onChange={(e) => setForm({...form, santriId: e.target.value})}
              className="w-full p-2.5 border rounded-xl text-xs font-semibold"
              required
            >
              <option value="">-- Pilih Nama Santri --</option>
              {santriList.map(s => (
                <option key={s.id} value={s.id}>{s.name} ({s.jilid})</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold mb-1 text-gray-700">Tanggal</label>
              <input
                type="date"
                value={form.date}
                onChange={(e) => setForm({...form, date: e.target.value})}
                className="w-full p-2.5 border rounded-xl text-xs"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold mb-1 text-gray-700">Jenis</label>
              <select
                value={form.type}
                onChange={(e) => setForm({...form, type: e.target.value})}
                className="w-full p-2.5 border rounded-xl text-xs font-bold"
              >
                <option value="setor">Setoran</option>
                <option value="tarik">Penarikan</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold mb-1 text-gray-700">Nominal (Rp)</label>
            <input
              type="number"
              value={form.amount}
              onChange={(e) => setForm({...form, amount: e.target.value})}
              className="w-full p-2.5 border rounded-xl text-xs"
              min="1000"
              placeholder="Contoh: 10000"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-bold mb-1 text-gray-700">Keterangan</label>
            <input
              type="text"
              value={form.description}
              onChange={(e) => setForm({...form, description: e.target.value})}
              className="w-full p-2.5 border rounded-xl text-xs"
              placeholder="Opsional"
            />
          </div>
          <button type="submit" className="w-full bg-amber-600 hover:bg-amber-700 text-white font-bold py-3 rounded-xl text-xs shadow">
            Simpan Data
          </button>
        </form>
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
      color: progresMenungguAcc.length > 0 ? 'bg-red-100 text-red-700 animate-pulse' : 'bg-blue-50 text-blue-600', 
      desc: 'Setujui setoran guru agar proses mengaji bisa dilanjutkan.' 
    },
    { id: 'progres_mengaji', label: 'Progres Mengaji Saya', icon: BookOpen, color: 'bg-emerald-100 text-emerald-600', desc: 'Riwayat semua catatan setoran Anda (belum & sudah disetujui).' },
    { id: 'riwayat_pembayaran', label: 'Riwayat Pembayaran', icon: CreditCard, color: 'bg-indigo-100 text-indigo-600', desc: 'Lihat status tagihan dan riwayat pembayaran iuran bulanan Anda.' },
    { id: 'riwayat_tabungan', label: 'Riwayat Tabungan', icon: DollarSign, color: 'bg-amber-100 text-amber-600', desc: 'Lihat riwayat setoran, penarikan, dan saldo tabungan Anda.' }
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
            <h3 className="font-extrabold text-red-900 text-sm flex items-center">
              ⚠️ Peringatan: Ada Tagihan Syahriah Belum Lunas!
            </h3>
            <p className="text-xs text-red-700 mt-1 leading-relaxed">
              Anda memiliki tunggakan pembayaran iuran bulanan. Segera lunasi ke bendahara agar akses layanan tidak terhambat.
            </p>
            <button 
              onClick={() => setActiveTab('riwayat_pembayaran')} 
              className="mt-3 bg-red-600 hover:bg-red-700 text-white font-bold px-4 py-2 rounded-xl text-xs shadow transition-all duration-200 flex items-center gap-1"
            >
              <CreditCard className="w-3.5 h-3.5" /> Lihat Detail Tagihan Sekarang
            </button>
          </div>
        </div>
      )}

      {activeWeekendNotification && (
        <div className="bg-amber-50 border border-amber-200 p-5 rounded-2xl flex items-start space-x-3.5 shadow-sm">
          <Bell className="w-6 h-6 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-extrabold text-amber-900 text-sm">Peringatan: Verifikasi Mingguan Mandiri Diperlukan!</h3>
            <p className="text-xs text-amber-700 mt-1 leading-relaxed">Wali santri wajib menekan tombol verifikasi bimbingan mengaji mandiri di rumah.</p>
            <button onClick={async () => { const updated = users.map(u => String(u.id) === String(user.id) ? { ...u, lastAccDate: new Date().toISOString() } : u); await updateTable('users', updated); showToast('Verifikasi mingguan berhasil dikirim!'); }} className="mt-3 bg-amber-600 hover:bg-amber-700 text-white font-bold px-4 py-2 rounded-xl text-xs shadow transition">Konfirmasi Belajar Mandiri Selesai</button>
          </div>
        </div>
      )}

      <MenuGrid menus={menus} onSelect={setActiveTab} />

      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <div className="flex justify-between items-center mb-4 border-b pb-3">
          <h3 className="font-bold text-gray-800 text-sm sm:text-base flex items-center"><Award className="mr-1.5 text-emerald-600"/> Target Kompetensi Jilid Aktif ({user.jilid})</h3>
          <span className="text-[10px] bg-emerald-50 text-emerald-700 font-extrabold px-3 py-1 rounded-full uppercase">Target Kurikulum</span>
        </div>
        {myTargets.length === 0 ? <p className="text-xs text-gray-400 italic">Target kurikulum tingkat {user.jilid} belum diatur.</p> : (
          <div className="space-y-2.5">
            {myTargets.map(t => {
              const isCompleted = user.completedTargets && user.completedTargets.includes(String(t.id));
              return (
                <div key={t.id} className="flex items-center space-x-3 p-3.5 bg-gray-50 rounded-xl border text-xs">
                  {isCompleted ? <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0" /> : <div className="w-5 h-5 rounded-full border-2 border-gray-300 flex-shrink-0" />}
                  <span className={`font-semibold ${isCompleted ? 'text-gray-400 line-through' : 'text-gray-700'}`}>{t.description}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );

  if (activeTab === 'progres_mengaji') return (
    <div className="animate-fade-in space-y-6">
      <BackButton onClick={() => setActiveTab('dashboard')} />
      <div className="bg-white p-6 rounded-2xl shadow-sm border">
        <h3 className="font-bold text-gray-800 mb-4">📋 Riwayat Semua Setoran Mengaji</h3>
        <p className="text-xs text-gray-500 mb-4">🔒 = Belum Disetujui · ✅ = Sudah Disetujui Wali</p>
        
        {semuaProgresSaya.length === 0 ? (
          <p className="text-xs text-gray-400 italic">Belum ada riwayat setoran.</p>
        ) : (
          <div className="space-y-3">
            {semuaProgresSaya.map(p => (
              <div key={p.id} className={`p-4 rounded-xl border ${p.status === 'belum_disetujui' ? 'bg-amber-50 border-amber-200' : 'bg-emerald-50 border-emerald-200'}`}>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${p.status === 'belum_disetujui' ? 'bg-amber-200 text-amber-800' : 'bg-emerald-200 text-emerald-800'}`}>
                  {p.status === 'belum_disetujui' ? '🔒 MENUNGGU PERSETUJUAN' : '✅ SUDAH DISETUJUI'}
                </span>
                <p className="font-bold mt-2">{p.surah} ayat {p.ayat} · {p.nilai}</p>
                <p className="text-xs text-gray-500 mt-1">Tanggal: {p.date}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

    if (activeTab === 'riwayat_pembayaran') return (
    <div className="animate-fade-in">
      <BackButton onClick={() => setActiveTab('dashboard')} />
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <h2 className="text-lg font-bold mb-4 flex items-center text-indigo-800"><CreditCard className="mr-2"/> Riwayat Pembayaran</h2>
        <div className="bg-gray-50 p-5 rounded-2xl border mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center">
          <div>
            <p className="text-xs text-gray-400 font-semibold">STATUS ALARM TAGIHAN</p>
            <h3 className="font-extrabold text-base mt-1 flex items-center">
              {user.hasAlarm ? (<><AlertTriangle className="text-red-500 w-5 h-5 mr-1.5" /><span className="text-red-600">Ada Tagihan Belum Dibayar</span></>) : (<><CheckCircle className="text-emerald-600 w-5 h-5 mr-1.5" /><span className="text-emerald-700">Lunas / Bebas Tagihan</span></>)}
            </h3>
          </div>
          <span className="text-[10px] text-gray-400 font-medium mt-2 sm:mt-0">Konfirmasi pembayaran melalui bendahara</span>
        </div>
        <h3 className="font-bold text-sm text-gray-700 mb-3 uppercase tracking-wider">Riwayat Pembayaran Anda:</h3>
        {(!user.historyBayar || user.historyBayar.length === 0) ? <p className="text-xs text-gray-500 italic bg-gray-50 p-4 rounded-xl border text-center">Belum ada riwayat pembayaran syahriah tercatat.</p> : (
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

  if (activeTab === 'riwayat_tabungan') return (
    <div className="animate-fade-in space-y-6">
      <BackButton onClick={() => setActiveTab('dashboard')} />
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border flex items-center justify-between"><div><p className="text-[10px] text-gray-400 font-bold uppercase">Total Setoran</p><h3 className="text-lg font-black text-emerald-600 mt-1">Rp {totalDeposit.toLocaleString('id-ID')}</h3></div><div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center"><TrendingUp size={20} /></div></div>
        <div className="bg-white p-5 rounded-2xl border flex items-center justify-between"><div><p className="text-[10px] text-gray-400 font-bold uppercase">Total Penarikan</p><h3 className="text-lg font-black text-red-600 mt-1">Rp {totalWithdraw.toLocaleString('id-ID')}</h3></div><div className="w-10 h-10 rounded-xl bg-red-50 text-red-600 flex items-center justify-center"><TrendingDown size={20} /></div></div>
        <div className="bg-white p-5 rounded-2xl border flex items-center justify-between"><div><p className="text-[10px] text-gray-400 font-bold uppercase">Saldo Tabungan</p><h3 className="text-lg font-black text-blue-600 mt-1">Rp {currentBalance.toLocaleString('id-ID')}</h3></div><div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center"><DollarSign size={20} /></div></div>
      </div>
      <div className="bg-white p-6 rounded-2xl shadow-sm border">
        <h2 className="text-base font-bold mb-4 flex items-center text-amber-800"><DollarSign className="mr-1.5"/> Log Riwayat Mutasi Tabungan</h2>
        {mySavings.length === 0 ? <p className="text-xs text-gray-400 italic text-center py-4 bg-gray-50 rounded-xl">Belum ada mutasi tabungan yang tercatat.</p> : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead><tr className="bg-gray-50 font-bold text-gray-600 uppercase border-b"><th className="p-3">Tanggal</th><th className="p-3">Jenis</th><th className="p-3">Nominal</th><th className="p-3">Keterangan</th></tr></thead>
              <tbody>
                {mySavings.map(s => (
                  <tr key={s.id} className="border-b hover:bg-gray-50 font-medium">
                    <td className="p-3 font-semibold">{s.date}</td>
                    <td className="p-3"><span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${s.type === 'setor' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>{s.type === 'setor' ? 'Setoran' : 'Penarikan'}</span></td>
                    <td className="p-3 font-bold">Rp {s.amount.toLocaleString('id-ID')}</td>
                    <td className="p-3 text-gray-500">{s.description || '-'}</td>
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
      const waktuTtd = new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta', dateStyle: 'full', timeStyle: 'long' });
      const dataBaru = progress.map(p => 
        String(p.santriId) === String(user.id) && p.status === 'belum_disetujui' 
          ? { ...p, status: 'disetujui_wali', disetujuiOleh: user.name, waktuPersetujuan: waktuTtd } 
          : p
      );
      await updateTable('progress', dataBaru);
      showToast('✅ Persetujuan selesai! Guru sekarang bisa input setoran baru.');
    };

    return (
      <div className="animate-fade-in space-y-6">
        <BackButton onClick={() => setActiveTab('dashboard')} />
        <div className="bg-white p-6 rounded-2xl shadow-sm border">
          <h2 className="text-lg font-bold mb-4">✍️ Persetujuan Setoran Wali Santri</h2>
          <p className="text-xs text-gray-600 mb-4">
            Setoran sudah tercatat di riwayat. <strong>Setujui di sini agar guru bisa melanjutkan input setoran berikutnya.</strong>
          </p>

          {progresMenungguAcc.length === 0 ? (
            <p className="text-center text-emerald-600 font-bold py-10">✅ Semua setoran sudah Anda setujui!</p>
          ) : (
            <>
              <button onClick={setujuiSemua} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl mb-4">
                ✅ SETUJUI SEMUA {progresMenungguAcc.length} SETORAN
              </button>
              <div className="space-y-3">
                {progresMenungguAcc.map(p => (
                  <div key={p.id} className="p-4 bg-amber-50 rounded-xl border border-amber-200">
                    <p className="font-bold">{p.surah} ayat {p.ayat} · {p.nilai}</p>
                    <p className="text-xs text-gray-500">Tanggal: {p.date}</p>
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

function GuruView({ activeTab, setActiveTab, user, users, setUsers, progress, targets, savings, settings, updateTable, showToast, simulatedWeekend, setSimulatedWeekend }) {
  const [selectedSantri, setSelectedSantri] = useState(null);
  const [santriTerpilih, setSantriTerpilih] = useState('');
  const [modeAksesKepala, setModeAksesKepala] = useState(user.role === 'kepala_tpq');

  useEffect(() => {
    if (selectedSantri) {
      const dataTerbaru = users.find(u => String(u.id) === String(selectedSantri.id));
      if (dataTerbaru && JSON.stringify(dataTerbaru) !== JSON.stringify(selectedSantri)) setSelectedSantri(dataTerbaru);
    }
  }, [users, selectedSantri]);

  const activeSantriList = users.filter(u => {
    if (u.role !== 'santri') return false;
    if (user.role === 'kepala_tpq' && modeAksesKepala) return true;
    return String(u.guruId) === String(user.id);
  });

  const handleAddProgress = async (e) => {
    e.preventDefault();
    const santriId = e.target.santriId.value;
    if (!santriId) { showToast('Pilih santri terlebih dahulu!', 'error'); return; }
    const newProgress = { id: Date.now().toString(), santriId, date: e.target.date.value, surah: e.target.surah.value, ayat: e.target.ayat.value, nilai: e.target.nilai.value, status: 'acc_guru', type: 'harian' };
    await updateTable('progress', [newProgress, ...progress]);
    showToast('Progres harian santri berhasil ditambahkan!');
    e.target.reset();
  };

  const handleKlaimSantri = async (santriId) => {
    const updated = users.map(u => String(u.id) === String(santriId) ? { ...u, guruId: String(user.id) } : u);
    await updateTable('users', updated);
    showToast('Santri berhasil diklaim ke kelas bimbingan Anda!');
  };

  const submitPengajuanKenaikan = async (e) => {
    e.preventDefault();
    if (!e.target.santriId.value) { showToast('Pilih santri terlebih dahulu!', 'error'); return; }
    const newRequest = { id: Date.now().toString(), santriId: e.target.santriId.value, date: e.target.date.value, surah: e.target.surah.value, ayat: e.target.ayat.value, nilai: 'Selesai Ujian Jilid', status: 'pending', type: 'kenaikan' };
    await updateTable('progress', [newRequest, ...progress]);
    showToast('✅ Pengajuan kenaikan jilid berhasil dikirim ke Kepala TPQ!');
    setSantriTerpilih('');
  };

  const toggleTargetCheck = async (santriId, targetId) => {
    try {
      const santriObj = users.find(u => String(u.id) === String(santriId));
      if (!santriObj) return;
      let completed = santriObj.completedTargets ? [...santriObj.completedTargets] : [];
      completed = completed.includes(String(targetId)) ? completed.filter(t => String(t) !== String(targetId)) : [...completed, String(targetId)];
      const updated = users.map(u => String(u.id) === String(santriId) ? { ...u, completedTargets: completed } : u);
      await updateTable('users', updated);
      showToast('Status target kompetensi diperbarui!');
    } catch (err) { showToast(`Gagal: ${err.message}`, 'error'); }
  };

  const cekSiapNaik = (santri) => {
    if (!santri || !santri.jilid) return false;
    const target = targets.filter(t => t.level === santri.jilid);
    if (target.length === 0) return false;
    return target.every(t => santri.completedTargets?.includes(String(t.id)));
  };

  const isSavingAuthorized = settings.savingInputRoles?.includes(user.role) || user.role === 'kepala_tpq';
  const menus = [
    { id: 'isi_progres', label: 'Input Setoran Harian', icon: ClipboardList, color: 'bg-emerald-100 text-emerald-600', desc: 'Catat setoran harian mengaji santri bimbingan Anda.' },
    { id: 'nilai_target', label: 'Penilaian Kompetensi', icon: CheckSquare, color: 'bg-indigo-100 text-indigo-600', desc: 'Centang target kurikulum kompetensi jilid aktif santri.' },
    { id: 'pengajuan_kenaikan', label: 'Ajukan Naik Jilid / Juz', icon: Award, color: 'bg-orange-100 text-orange-600', desc: 'Ajukan kelayakan santri untuk ujian kenaikan jilid.' },
    { id: 'klaim_santri', label: 'Klaim Kelas Santri Baru', icon: UserPlus, color: 'bg-purple-100 text-purple-600', desc: 'Klaim santri yang belum ditugaskan guru.' }
  ];
  if (isSavingAuthorized) menus.push({ id: 'input_tabungan_guru', label: 'Input Tabungan Santri', icon: DollarSign, color: 'bg-amber-100 text-amber-600', desc: 'Pencatatan setoran & penarikan kas tabungan.' });

  if (activeTab === 'dashboard') return (
    <div className="space-y-6 animate-fade-in">
      <h2 className="text-xl font-black text-gray-800">Panel Pengajar: {user.name}</h2>
      {(user.role === 'kepala_tpq' || user.role === 'admin') && (
        <div className="bg-emerald-50 border p-4 rounded-2xl flex justify-between items-center">
          <div><p className="text-xs font-bold text-emerald-800">Hak Akses Manajemen Aktif</p><p className="text-[11px] text-gray-500 mt-0.5">Bisa melihat seluruh santri TPQ atau hanya bimbingan sendiri.</p></div>
          <button onClick={() => setModeAksesKepala(!modeAksesKepala)} className={`text-xs font-bold px-4 py-2 rounded-xl border transition ${modeAksesKepala ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white text-emerald-700 border-emerald-200'}`}>{modeAksesKepala ? 'Akses Semua Santri' : 'Hanya Bimbingan Sendiri'}</button>
        </div>
      )}
      <MenuGrid menus={menus} onSelect={setActiveTab} />
    </div>
  );

  if (activeTab === 'input_tabungan_guru' && isSavingAuthorized) return (
  <div className="animate-fade-in space-y-6 p-4">
    <button 
      onClick={() => setActiveTab('dashboard')}
      className="flex items-center gap-2 text-gray-700 hover:text-amber-700 font-medium mb-4"
    >
      <ArrowLeft size={16} /> Kembali ke Menu Utama
    </button>

    <div className="bg-white p-6 rounded-2xl shadow-sm border">
      <h2 className="text-xl font-bold mb-6 flex items-center text-amber-800">
        <DollarSign className="mr-2"/> Input Mutasi Tabungan Santri
      </h2>

      {users.length === 0 ? (
        <div className="p-6 bg-amber-50 border border-amber-200 text-amber-900 rounded-xl text-sm">
          <h4 className="font-bold flex items-center"><Info size={16} className="mr-1.5"/> Belum Ada Data Santri</h4>
          <p className="mt-1">Silakan tambahkan data santri terlebih dahulu.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* === KOLOM KIRI: DAFTAR SANTRI === */}
          <div className="bg-gray-50 p-4 rounded-xl border">
            <h3 className="text-sm font-bold text-gray-700 mb-3 border-b pb-2 uppercase">Daftar Santri</h3>
            <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
              {users.map(u => (
                <button
                  key={u.id}
                  onClick={() => setSelectedSantri(u)}
                  className={`w-full p-3 rounded-xl text-left text-sm border transition-all ${
                    selectedSantri?.id === u.id
                      ? 'bg-amber-600 text-white font-bold border-amber-600 shadow-md'
                      : 'bg-white text-gray-700 border-gray-200 hover:bg-amber-50 hover:border-amber-200'
                  }`}
                >
                  <p className="font-semibold">{u?.name || 'Nama tidak tersedia'}</p>
                  <p className="mt-0.5 opacity-80 text-xs">Saldo: Rp {Number(u?.saldo_awal || 0).toLocaleString('id-ID')}</p>
                </button>
              ))}
            </div>
          </div>

          {/* === KOLOM KANAN: INPUT + RIWAYAT === */}
          <div className="md:col-span-2 space-y-6">
            {!selectedSantri ? (
              <div className="p-10 text-center text-gray-400 text-sm italic bg-gray-50 border border-dashed rounded-xl">
                Silakan pilih nama santri di sebelah kiri terlebih dahulu.
              </div>
            ) : (
              <>
                {/* INFO SANTRI */}
                <div className="bg-amber-50 p-4 rounded-xl border border-amber-200">
                  <p className="text-[11px] text-amber-700 font-bold uppercase">Santri Terpilih</p>
                  <h3 className="font-extrabold text-lg mt-0.5">{selectedSantri?.name || '-'}</h3>
                  <p className="text-sm text-gray-600 mt-1">Saldo Saat Ini: <strong>Rp {Number(selectedSantri?.saldo_awal || 0).toLocaleString('id-ID')}</strong></p>
                </div>

                {/* FORM INPUT MUTASI */}
                <form onSubmit={async (e) => {
                  e.preventDefault();
                  const jenis = e.target.jenis.value;
                  const nominal = Number(e.target.nominal.value.replace(/\./g,''));
                  const tanggal = e.target.tanggal.value;
                  const keterangan = e.target.keterangan.value.trim() || `${jenis} Tabungan`;

                  if (!nominal || nominal <= 0) {
                    showToast('Masukkan nominal yang benar!', 'error');
                    return;
                  }

                  // Hitung saldo baru
                  let saldoBaru;
                  if (jenis === 'Setoran') {
                    saldoBaru = (selectedSantri.saldo_awal || 0) + nominal;
                  } else {
                    if ((selectedSantri.saldo_awal || 0) < nominal) {
                      showToast('Saldo tidak cukup untuk penarikan!', 'error');
                      return;
                    }
                    saldoBaru = (selectedSantri.saldo_awal || 0) - nominal;
                  }

                  // Simpan riwayat mutasi
                  const mutasiBaru = {
                    id: Date.now(),
                    userId: selectedSantri.id,
                    tanggal: tanggal,
                    jenis: jenis,
                    nominal: nominal,
                    keterangan: keterangan,
                    dicatatOleh: user.id
                  };

                  // Update data
                  const dataUserBaru = users.map(item => 
                    item.id === selectedSantri.id ? {...item, saldo_awal: saldoBaru} : item
                  );

                  await updateTable('savings', [...(savings || []), mutasiBaru]);
                  await updateTable('users', dataUserBaru);
                  setSelectedSantri({...selectedSantri, saldo_awal: saldoBaru});
                  showToast(`Mutasi ${jenis} berhasil dicatat!`);
                  e.target.reset();
                }} className="space-y-4 bg-gray-50 p-5 rounded-2xl border">
                  <h4 className="font-bold text-sm text-gray-700 border-b pb-2">Input Mutasi Baru</h4>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold mb-1 text-gray-600">Tanggal</label>
                      <input type="date" name="tanggal" defaultValue={new Date().toISOString().substring(0,10)} required className="p-2.5 border rounded-xl w-full text-sm" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold mb-1 text-gray-600">Jenis</label>
                      <select name="jenis" className="p-2.5 border rounded-xl w-full text-sm font-medium" required>
                        <option>Setoran</option>
                        <option>Penarikan</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold mb-1 text-gray-600">Nominal (Rp)</label>
                    <input type="text" name="nominal" required className="p-2.5 border rounded-xl w-full text-sm font-medium" placeholder="Contoh: 10000" />
                  </div>

                  <div>
                    <label className="block text-xs font-bold mb-1 text-gray-600">Keterangan</label>
                    <input type="text" name="keterangan" className="p-2.5 border rounded-xl w-full text-sm font-medium" placeholder="Opsional" />
                  </div>

                  <button type="submit" className="bg-amber-600 hover:bg-amber-700 text-white font-bold w-full py-3 rounded-xl text-sm shadow">
                    Simpan Data
                  </button>
                </form>

                {/* === RIWAYAT MUTASI === */}
                <div className="border-t pt-6">
                  <h3 className="text-sm font-bold mb-4 flex items-center text-gray-800">
                    <ListChecks className="mr-2"/> Riwayat Mutasi Tabungan
                  </h3>
                  {(() => {
                    const idSantri = selectedSantri?.id;
                    if (!savings || savings.length === 0) {
                      return <p className="text-sm text-gray-500 italic">Belum ada riwayat mutasi.</p>;
                    }

                    const riwayatSantri = savings.filter(item => String(item.userId) === String(idSantri));
                    
                    if (riwayatSantri.length === 0) {
                      return <p className="text-sm text-gray-500 italic">Belum ada riwayat untuk santri ini.</p>;
                    }

                    return (
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead className="bg-gray-50 font-bold text-gray-600 uppercase text-xs">
                            <tr>
                              <th className="p-2 text-left">Tanggal</th>
                              <th className="p-2 text-left">Jenis</th>
                              <th className="p-2 text-left">Keterangan</th>
                              <th className="p-2 text-right">Nominal</th>
                              <th className="p-2 text-center">Aksi</th>
                            </tr>
                          </thead>
                          <tbody>
                            {[...riwayatSantri]
                              .sort((a,b) => new Date(b.tanggal) - new Date(a.tanggal))
                              .map((data, i) => (
                              <tr key={data.id || i} className="border-b hover:bg-gray-50">
                                <td className="p-2">{data.tanggal || '-'}</td>
                                <td className="p-2">
                                  <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                                    data.jenis === 'Setoran' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                                  }`}>{data.jenis}</span>
                                </td>
                                <td className="p-2 font-medium">{data.keterangan || '-'}</td>
                                <td className="p-2 text-right font-bold">
                                  Rp {Number(data.nominal || 0).toLocaleString('id-ID')}
                                </td>
                                <td className="p-2 text-center">
                                  <button 
                                    onClick={async () => {
                                      if(!confirm('Yakin hapus mutasi ini? Saldo akan dikembalikan/dikurangi!')) return;
                                      
                                      let saldoBaruHapus;
                                      if (data.jenis === 'Setoran') {
                                        saldoBaruHapus = (selectedSantri.saldo_awal || 0) - (data.nominal || 0);
                                      } else {
                                        saldoBaruHapus = (selectedSantri.saldo_awal || 0) + (data.nominal || 0);
                                      }

                                      await updateTable('savings', savings.filter(x => x.id !== data.id));
                                      await updateTable('users', users.map(u => u.id === selectedSantri.id ? {...u, saldo_awal: saldoBaruHapus} : u));
                                      setSelectedSantri({...selectedSantri, saldo_awal: saldoBaruHapus});
                                      showToast('Mutasi telah dihapus!');
                                    }}
                                    className="text-red-500 hover:text-red-700"
                                  >
                                    <Trash2 size={16} />
                                  </button>
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
      if (activeTab === 'isi_progres') return (
  <div className="animate-fade-in space-y-6">
    <BackButton onClick={() => setActiveTab('dashboard')} />
    <div className="bg-white p-6 rounded-2xl shadow-sm border">
      <h2 className="text-lg font-bold mb-6 flex items-center text-emerald-800">
        <ClipboardList className="mr-2"/> Input Setoran & Riwayat Progres Mengaji
      </h2>

      {activeSantriList.length === 0 ? (
        <div className="p-6 bg-amber-50 border border-amber-200 text-amber-900 rounded-xl text-xs">
          <h4 className="font-bold flex items-center"><Info size={16} className="mr-1.5"/> Belum Ada Santri</h4>
          <p className="mt-1">Pilih menu <strong>Klaim Kelas Santri Baru</strong> untuk menambahkan santri.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* === KOLOM KIRI: DAFTAR SANTRI === */}
          <div className="bg-gray-50 p-4 rounded-xl border">
            <h3 className="text-sm font-bold text-gray-700 mb-3 border-b pb-2 uppercase">Daftar Santri Bimbingan</h3>
            <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
              {activeSantriList.map(s => (
                <button
                  key={s.id}
                  onClick={() => {
                    // ✅ Peringan set data & cek keberadaan data
                    if(s && s.id) setSelectedSantri(s);
                    else console.warn("Data santri tidak valid:", s);
                  }}
                  className={`w-full p-3 rounded-xl text-left text-xs border transition-all ${
                    selectedSantri?.id === s.id
                      ? 'bg-emerald-600 text-white font-bold border-emerald-600 shadow-md'
                      : 'bg-white text-gray-700 border-gray-200 hover:bg-emerald-50 hover:border-emerald-200'
                  }`}
                >
                  <p className="font-semibold text-sm">{s?.name || 'Nama tidak tersedia'}</p>
                  <p className="mt-0.5 opacity-80">Jilid: {s?.jilid || 'Jilid 1'}</p>
                </button>
              ))}
            </div>
          </div>

          {/* === KOLOM KANAN: DETAIL & INPUT === */}
          <div className="md:col-span-2 space-y-6">
            {!selectedSantri ? (
              <div className="p-10 text-center text-gray-400 text-xs italic bg-gray-50 border border-dashed rounded-xl">
                Silakan pilih nama santri di sebelah kiri untuk melihat dan mengisi progresnya.
              </div>
            ) : (
              <>
                {/* INFO SANTRI */}
                <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-200">
                  <p className="text-[10px] text-emerald-700 font-bold uppercase">Santri Terpilih</p>
                  <h3 className="font-extrabold text-lg mt-0.5">{selectedSantri?.name || '-'}</h3>
                  <p className="text-xs text-gray-600 mt-1">Tingkatan: <strong>{selectedSantri?.jilid || 'Jilid 1'}</strong></p>
                </div>

                {/* FORM INPUT */}
                <form onSubmit={handleAddProgress} className="space-y-4 bg-gray-50 p-5 rounded-2xl border">
                  <h4 className="font-bold text-sm text-gray-700 border-b pb-2">➕ Input Setoran Baru</h4>
                  <input type="hidden" name="santriId" value={selectedSantri?.id || ''} />
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold mb-1 text-gray-600">Tanggal</label>
                      <input type="date" name="date" defaultValue={new Date().toISOString().substring(0,10)} required className="p-2.5 border rounded-xl w-full text-xs" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold mb-1 text-gray-600">Nilai</label>
                      <select name="nilai" className="p-2.5 border rounded-xl w-full text-xs font-bold" required>
                        <option>A (Sangat Lancar)</option>
                        <option>B (Lancar)</option>
                        <option>C (Cukup)</option>
                        <option>D (Kurang)</option>
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold mb-1 text-gray-600">Surah / Halaman</label>
                      <input type="text" name="surah" required className="p-2.5 border rounded-xl w-full text-xs font-bold" placeholder="An-Naba" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold mb-1 text-gray-600">Ayat / Baris</label>
                      <input type="text" name="ayat" required className="p-2.5 border rounded-xl w-full text-xs font-bold" placeholder="1-5" />
                    </div>
                  </div>
                  <button type="submit" className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold w-full py-3 rounded-xl text-xs shadow">
                    Simpan Progres Santri Ini
                  </button>
                </form>

                {/* RIWAYAT SETORAN */}
                <div className="border-t pt-6">
                  <h3 className="text-sm font-bold mb-4 flex items-center text-gray-800">
                    <ListChecks className="mr-2"/> Riwayat Setoran Mengaji
                  </h3>
                  {(() => {
                    // ✅ Filter data lebih aman
                    const santriId = selectedSantri?.id;
                    if(!santriId) return <p className="text-xs text-gray-500 italic">Pilih santri terlebih dahulu.</p>;

                    const riwayatSantri = (progress || []).filter(p => String(p?.santriId) === String(santriId));
                    
                    return riwayatSantri.length === 0 ? (
                      <p className="text-xs text-gray-500 italic">Belum ada riwayat setoran untuk santri ini.</p>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-xs">
                          <thead className="bg-gray-50 font-bold text-gray-600 uppercase">
                            <tr>
                              <th className="p-2 text-left">Tanggal</th>
                              <th className="p-2 text-left">Surah/Hal</th>
                              <th className="p-2 text-left">Ayat/Baris</th>
                              <th className="p-2 text-center">Nilai</th>
                              <th className="p-2 text-center">Aksi</th>
                            </tr>
                          </thead>
                          <tbody>
                            {[...riwayatSantri]
                              .sort((a,b) => new Date(b.date) - new Date(a.date))
                              .map((pr, i) => (
                              <tr key={pr?.id || i} className="border-b hover:bg-gray-50">
                                <td className="p-2">{pr?.date || '-'}</td>
                                <td className="p-2 font-semibold">{pr?.surah || '-'}</td>
                                <td className="p-2">{pr?.ayat || '-'}</td>
                                <td className="p-2 text-center">
                                  <span className={`px-2 py-0.5 rounded-full font-bold ${
                                    String(pr?.nilai).startsWith('A') ? 'bg-emerald-100 text-emerald-700' :
                                    String(pr?.nilai).startsWith('B') ? 'bg-blue-100 text-blue-700' :
                                    String(pr?.nilai).startsWith('C') ? 'bg-amber-100 text-amber-700' :
                                    'bg-red-100 text-red-700'
                                  }`}>{pr?.nilai?.split(' ')[0] || '-'}</span>
                                </td>
                                <td className="p-2 text-center">
                                  <button 
                                    onClick={async () => {
                                      if(!confirm('Yakin hapus riwayat ini?')) return;
                                      // ✅ Pastikan data valid sebelum dikirim
                                      const dataBaru = (progress || []).filter(x => x?.id !== pr?.id);
                                      await updateTable('progress', dataBaru);
                                      showToast('Riwayat progres telah dihapus!');
                                    }}
                                    className="text-red-500 hover:text-red-700"
                                  >
                                    <Trash2 size={14} />
                                  </button>
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
  if (activeTab === 'nilai_target') return (
    <div className="animate-fade-in space-y-6">
      <BackButton onClick={() => setActiveTab('dashboard')} />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border">
          <h2 className="text-sm font-bold text-gray-700 mb-4 border-b pb-2 uppercase">Santri Bimbingan</h2>
          {activeSantriList.length === 0 ? <p className="text-xs text-gray-400 italic">Belum ada santri.</p> : (
            <div className="space-y-1.5 max-h-[400px] overflow-y-auto">
              {activeSantriList.map(s => (
                <button key={s.id} onClick={() => setSelectedSantri(s)} className={`w-full p-3 rounded-xl text-left text-xs border transition ${selectedSantri?.id === s.id ? 'bg-emerald-50 text-emerald-800 font-bold border-emerald-300' : 'bg-gray-50 text-gray-700 border-gray-100 hover:bg-gray-100'}`}>
                  <p className="font-bold text-sm">{s.name}</p><p className="text-[10px] text-gray-500 mt-1">Jilid: <strong>{s.jilid || 'Jilid 1'}</strong></p>
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border md:col-span-2">
          <h2 className="text-sm font-bold text-gray-700 mb-4 border-b pb-2 uppercase flex items-center"><CheckSquare className="mr-1.5 text-emerald-600"/> Penilaian Kompetensi</h2>
          {!selectedSantri ? <div className="p-8 text-center text-gray-400 text-xs italic bg-gray-50 border border-dashed rounded-xl">Pilih santri di sebelah kiri.</div> : (
            <div>
              <div className="bg-emerald-50/50 p-4 rounded-xl border mb-6"><p className="text-[10px] text-emerald-700 font-bold uppercase">SANTRI PILIHAN</p><h3 className="font-extrabold text-base mt-0.5">{selectedSantri.name}</h3><p className="text-xs text-gray-500 mt-1">Tingkatan: <strong className="text-emerald-700">{selectedSantri.jilid || 'Jilid 1'}</strong></p></div>
              <div className="space-y-2">
                {targets.filter(t => t.level === (selectedSantri.jilid || 'Jilid 1')).length === 0 ? <p className="text-xs text-gray-400 italic text-center py-4">Belum ada target jilid ini.</p> : (
                  targets.filter(t => t.level === (selectedSantri.jilid || 'Jilid 1')).map(t => {
                    const isChecked = selectedSantri.completedTargets && selectedSantri.completedTargets.includes(String(t.id));
                    return (
                      <label key={t.id} className="flex justify-between items-center p-3.5 bg-gray-50 rounded-xl border cursor-pointer hover:bg-gray-100/50 transition">
                        <span className="text-xs leading-relaxed font-medium">{t.description}</span>
                        <input type="checkbox" checked={isChecked || false} onChange={() => toggleTargetCheck(selectedSantri.id, t.id)} className="w-5 h-5 rounded text-emerald-600 cursor-pointer" />
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

  if (activeTab === 'pengajuan_kenaikan') {
    const daftarSantri = users.filter(u => 
      u.role === 'santri' && String(u.guruId || '') === String(user.id)
    );

    return (
      <div className="animate-fade-in space-y-6 p-4">
        <BackButton onClick={() => setActiveTab('dashboard')} />
        <div className="bg-white p-6 rounded-2xl shadow-sm border">
          <h2 className="text-lg font-bold mb-6 flex items-center text-orange-800">
            <Award className="mr-2"/> Form Pengajuan Kenaikan Jilid
          </h2>

          {daftarSantri.length === 0 ? (
            <div className="p-6 bg-amber-50 border border-amber-200 rounded-xl text-xs">
              ⚠️ Belum ada santri bimbingan Anda.<br/>
              Silakan gunakan menu <strong>Klaim Kelas Santri Baru</strong> terlebih dahulu.
            </div>
          ) : (
            <form onSubmit={submitPengajuanKenaikan} className="space-y-4 max-w-xl">
              <div className="bg-gray-50 p-4 rounded-xl border">
                <label className="block text-xs font-bold mb-2 text-gray-700">Pilih Nama Santri</label>
                <select
                  name="santriId"
                  value={santriTerpilih}
                  onChange={(e) => setSantriTerpilih(e.target.value)}
                  className="w-full p-2.5 border rounded-xl text-xs font-semibold bg-white"
                  required
                >
                  <option value="">-- Silakan Pilih --</option>
                  {daftarSantri.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.jilid}) {cekSiapNaik(s) ? '✅ SIAP NAIK' : '⏳ BELUM LENGKAP'}
                    </option>
                  ))}
                </select>
              </div>

              {santriTerpilih && (
                <div className={`p-3 rounded-xl text-xs font-semibold ${
                  cekSiapNaik(users.find(u => String(u.id) === String(santriTerpilih)))
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : 'bg-red-50 text-red-700 border-red-200'
                }`}>
                  {cekSiapNaik(users.find(u => String(u.id) === String(santriTerpilih)))
                    ? '✅ Santri sudah memenuhi syarat kompetensi'
                    : '❌ Belum lengkapi semua target kompetensi'}
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold mb-1 text-gray-700">Tanggal Ujian</label>
                  <input type="date" name="date" defaultValue={new Date().toISOString().slice(0,10)} required className="p-2.5 border rounded-xl w-full text-xs" />
                </div>
                <div>
                  <label className="block text-xs font-bold mb-1 text-gray-700">Ujian Terakhir</label>
                  <input type="text" name="surah" required className="p-2.5 border rounded-xl w-full text-xs font-semibold" placeholder="Contoh: Juz 30 / Surah Al-Baqarah" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold mb-1 text-gray-700">Catatan Penilaian</label>
                <input type="text" name="ayat" required className="p-2.5 border rounded-xl w-full text-xs" placeholder="Contoh: Bacaan lancar, tajwid sempurna" />
              </div>

              <button
                type="submit"
                disabled={!cekSiapNaik(users.find(u => String(u.id) === String(santriTerpilih)))}
                className={`font-bold w-full py-3 rounded-xl text-xs shadow transition-all ${
                  cekSiapNaik(users.find(u => String(u.id) === String(santriTerpilih)))
                    ? 'bg-orange-600 hover:bg-orange-700 text-white'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                {cekSiapNaik(users.find(u => String(u.id) === String(santriTerpilih)))
                  ? '📤 KIRIM PENGAJUAN KE KEPALA'
                  : '🔒 LENGKAPI DULU SYARATNYA'}
              </button>
            </form>
          )}
        </div>
      </div>
    );
  }

  if (activeTab === 'klaim_santri') {
    const unclaimedSantri = users.filter(s => s.role === 'santri' && (!s.guruId || String(s.guruId).trim() === '' || s.guruId === 'null'));
    return (
      <div className="animate-fade-in space-y-6">
        <BackButton onClick={() => setActiveTab('dashboard')} />
        <div className="bg-white p-6 rounded-2xl shadow-sm border">
          <h2 className="text-lg font-bold mb-4 flex items-center text-purple-800"><UserPlus className="mr-2"/> Klaim Data Santri Baru</h2>
          {unclaimedSantri.length === 0 ? <div className="p-8 text-center text-gray-400 italic bg-gray-50 border border-dashed rounded-2xl text-xs">Tidak ada santri yang belum ditugaskan guru.</div> : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {unclaimedSantri.map(s => (
                <div key={s.id} className="p-4 bg-purple-50/50 border rounded-2xl flex justify-between items-center">
                  <div><h4 className="font-extrabold text-sm text-purple-900">{s.name}</h4><p className="text-[10px] text-gray-500 mt-1">Jilid: <strong>{s.jilid || 'Jilid 1'}</strong></p></div>
                  <button onClick={() => handleKlaimSantri(s.id)} className="bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold px-3 py-2 rounded-xl shadow transition">Klaim Santri</button>
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
    showToast(`Ujian disetujui! Santri naik ke ${nextJid}`);
  };

  const handleAddTarget = async (e) => {
    e.preventDefault();
    const newTarget = { id: Date.now().toString(), level: e.target.level.value, description: e.target.description.value };
    await updateTable('targets', [...targets, newTarget]);
    showToast('Target kurikulum baru berhasil ditambahkan!');
    e.target.reset();
  };

  const deleteTarget = async (id) => { await updateTable('targets', targets.filter(t => String(t.id) !== String(id))); showToast('Target kurikulum dihapus!'); };

  const toggleSavingRole = async (roleName) => {
    let currentRoles = settings.savingInputRoles || ['guru', 'bendahara'];
    currentRoles = currentRoles.includes(roleName) ? currentRoles.filter(r => r !== roleName) : [...currentRoles, roleName];
    await updateTable('settings', { ...settings, savingInputRoles: currentRoles });
    showToast('Pengaturan hak akses tabungan diperbarui!');
  };

  const menus = [
    { id: 'acc_kenaikan', label: 'ACC Kenaikan Tingkat', icon: Award, color: 'bg-orange-100 text-orange-600', desc: 'Uji & ACC pengajuan naik jilid dari guru.' },
    { id: 'target_jilid', label: 'Kurikulum Target TPQ', icon: Book, color: 'bg-blue-100 text-blue-600', desc: 'Atur kurikulum target tiap jilid & juz.' },
    { id: 'guru_progres', label: 'Input Progres (Mode Guru)', icon: ClipboardList, color: 'bg-emerald-100 text-emerald-600', desc: 'Masuk mode pengajar input setoran harian.' },
    { id: 'guru_target', label: 'Nilai Kompetensi (Mode Guru)', icon: CheckSquare, color: 'bg-purple-100 text-purple-700', desc: 'Mode guru mencentang kompetensi santri.' },
    { id: 'guru_kenaikan', label: 'Ajukan Kenaikan (Mode Guru)', icon: Award, color: 'bg-orange-100 text-orange-600', desc: 'Mode guru ajukan kenaikan jilid.' },
    { id: 'guru_klaim', label: 'Klaim Santri (Mode Guru)', icon: UserPlus, color: 'bg-indigo-100 text-indigo-600', desc: 'Klaim & alokasikan santri baru.' },
    { id: 'input_tabungan', label: 'Input Tabungan Santri', icon: DollarSign, color: 'bg-emerald-100 text-emerald-600', desc: 'Catat setoran & penarikan tabungan.' },
    { id: 'otorisasi_tabungan', label: 'Otorisasi Tabungan', icon: Shield, color: 'bg-red-100 text-red-600', desc: 'Tentukan role yang bisa input tabungan.' },
    { id: 'kelola_syahriah', label: 'Syahriah Keuangan', icon: CreditCard, color: 'bg-yellow-100 text-yellow-600', desc: 'Pantau iuran bulanan & alarm tagihan.' },
    { id: 'buat_surat', label: 'Buat Surat (Edaran & Undangan)', icon: ClipboardList, color: 'bg-sky-100 text-sky-700', desc: 'Cetak surat undangan dan edaran resmi TPQ.' },
    { id: 'hak_akses', label: 'Manajemen Hak Akses', icon: Shield, color: 'bg-purple-100 text-purple-800', desc: 'Atur kredensial & tambah akun baru.' },
    { id: 'pengaturan', label: 'Profil & Logo TPQ', icon: Settings, color: 'bg-gray-100 text-gray-700', desc: 'Ubah identitas & Google Sheet URL.' }
  ];

  if (activeTab === 'dashboard') return <div className="animate-fade-in"><h2 className="text-xl font-black text-gray-800 mb-6">Administrasi Kepala TPQ: {user.name}</h2><MenuGrid menus={menus} onSelect={setActiveTab} /></div>;

  if (['guru_progres','guru_klaim','guru_target','guru_kenaikan'].includes(activeTab)) {
    let mappedTab = 'isi_progres';
    if (activeTab === 'guru_klaim') mappedTab = 'klaim_santri';
    else if (activeTab === 'guru_target') mappedTab = 'nilai_target';
    else if (activeTab === 'guru_kenaikan') mappedTab = 'pengajuan_kenaikan';
    return <GuruView 
      activeTab={mappedTab} 
      setActiveTab={(tab) => setActiveTab(tab === 'dashboard' ? 'dashboard' : activeTab)} 
      user={user} 
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
    />;
  }
  if (activeTab === 'input_tabungan') return <div className="animate-fade-in"><BackButton onClick={() => setActiveTab('dashboard')} /><SavingsInputView users={users} savings={savings} updateTable={updateTable} showToast={showToast} recorderId={user.id} /></div>;
  if (activeTab === 'kelola_syahriah') return <div className="animate-fade-in"><BackButton onClick={() => setActiveTab('dashboard')} /><BendaharaView activeTab="kelola_syahriah" setActiveTab={setActiveTab} users={users} savings={savings} settings={settings} updateTable={updateTable} showToast={showToast} currentUser={user} /></div>;
  if (activeTab === 'hak_akses') return <div className="animate-fade-in"><BackButton onClick={() => setActiveTab('dashboard')} /><AdminView activeTab="hak_akses" setActiveTab={setActiveTab} users={users} updateTable={updateTable} showToast={showToast} settings={settings} appsScriptUrl={appsScriptUrl} setAppsScriptUrl={setAppsScriptUrl} loadDatabase={loadDatabase} /></div>;
  if (activeTab === 'pengaturan') return <div className="animate-fade-in"><BackButton onClick={() => setActiveTab('dashboard')} /><AdminView activeTab="pengaturan" setActiveTab={setActiveTab} users={users} updateTable={updateTable} showToast={showToast} settings={settings} appsScriptUrl={appsScriptUrl} setAppsScriptUrl={setAppsScriptUrl} loadDatabase={loadDatabase} /></div>;

  if (activeTab === 'otorisasi_tabungan') {
    const rolesList = [{ id: 'guru', label: 'Guru Ngaji' }, { id: 'bendahara', label: 'Bendahara' }, { id: 'admin', label: 'Admin System' }];
    const activeRoles = settings.savingInputRoles || ['guru', 'bendahara'];
    return (
      <div className="animate-fade-in space-y-6">
        <BackButton onClick={() => setActiveTab('dashboard')} />
        <div className="bg-white p-6 rounded-2xl shadow-sm border max-w-xl">
          <h2 className="text-lg font-bold mb-2 flex items-center text-red-800"><Shield className="mr-2"/> Otorisasi Hak Akses Tabungan</h2>
          <p className="text-xs text-gray-500 mb-6">Tentukan role staf yang boleh input tabungan santri.</p>
          <div className="space-y-3">
            {rolesList.map(r => {
              const isChecked = activeRoles.includes(r.id);
              return (
                <label key={r.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border cursor-pointer hover:bg-gray-100 transition">
                  <div><p className="text-sm font-bold">{r.label}</p><p className="text-[10px] text-gray-400">Bisa kelola mutasi kas tabungan.</p></div>
                  <input type="checkbox" checked={isChecked} onChange={() => toggleSavingRole(r.id)} className="w-5 h-5 rounded text-red-600 cursor-pointer" />
                </label>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  if (activeTab === 'acc_kenaikan') {
    const pending = progress.filter(p => p.type === 'kenaikan' && p.status === 'pending');
    return (
      <div className="animate-fade-in">
        <BackButton onClick={() => setActiveTab('dashboard')} />
        <div className="bg-white p-6 rounded-2xl shadow-sm border">
          <h2 className="text-lg font-bold mb-6 flex items-center text-orange-800"><Award className="mr-2"/> Evaluasi & ACC Kenaikan Jilid</h2>
          {pending.length === 0 ? <div className="p-8 text-center text-gray-500 bg-gray-50 rounded-2xl border border-dashed text-sm">Tidak ada pengajuan tertunda.</div> : (
            <div className="space-y-4">
              {pending.map(req => {
                const s = users.find(u => String(u.id) === String(req.santriId));
                const g = users.find(u => u.id && String(u.id) === String(s?.guruId));
                return (
                  <div key={req.id} className="border border-orange-200 bg-orange-50/50 p-5 rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center">
                    <div>
                      <h3 className="font-extrabold text-base">{s?.name}</h3>
                      <div className="flex flex-wrap gap-4 text-xs font-semibold text-gray-600 mt-1">
                        <p>Tingkat: <span className="text-orange-700 bg-orange-50 px-2 py-0.5 rounded border">{s?.jilid}</span></p>
                        <p>Diajukan: <strong>{g ? g.name : 'Sistem'}</strong></p>
                      </div>
                      <div className="mt-3 bg-white p-3.5 rounded-xl border text-xs">
                        <p className="font-bold mb-1">Ujian {req.date}:</p>
                        <p className="text-gray-500 italic">"Membaca {req.surah} {req.ayat}"</p>
                      </div>
                    </div>
                    <button onClick={() => handleAccKenaikan(req.id, s?.id)} className="mt-4 md:mt-0 bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-6 py-2.5 rounded-xl text-xs shadow flex items-center"><CheckCircle size={16} className="mr-1.5"/> Setujui Kenaikan</button>
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
        <div className="bg-white p-6 rounded-2xl shadow-sm border">
          <h2 className="text-lg font-bold mb-6 flex items-center text-blue-800"><Book className="mr-2"/> Kelola Target Kompetensi Kurikulum</h2>
          <form onSubmit={handleAddTarget} className="flex flex-col md:flex-row gap-3 mb-8 bg-gray-50 p-4 rounded-2xl border">
            <select name="level" className="p-3 border rounded-xl font-bold md:w-1/4 text-xs" required>{JILID_LEVELS.map(j => <option key={j} value={j}>{j}</option>)}</select>
            <input type="text" name="description" placeholder="Kompetensi target..." className="flex-1 p-3 border rounded-xl text-xs" required />
            <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-5 py-3 rounded-xl text-xs shadow">Tambah Target</button>
          </form>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {JILID_LEVELS.map(level => {
              const lt = targets.filter(t => t.level === level);
              if (lt.length === 0) return null;
              return (
                <div key={level} className="border border-blue-50 p-4 rounded-2xl bg-blue-50/10">
                  <h3 className="font-extrabold text-xs text-blue-900 border-b pb-2 mb-3">{level}</h3>
                  <ul className="space-y-2">
                    {lt.map(t => (
                      <li key={t.id} className="flex justify-between items-start bg-white p-3 rounded-xl border shadow-sm gap-3">
                        <span className="text-xs leading-relaxed">{t.description}</span>
                        <button onClick={() => deleteTarget(t.id)} className="text-red-500 hover:text-red-700 p-1.5 bg-red-50 rounded-lg transition flex-shrink-0"><Trash2 size={13}/></button>
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

  if (activeTab === 'buat_surat') {
    const [jenisSurat, setJenisSurat] = useState('undangan');
    const [formSurat, setFormSurat] = useState({
      noSurat: '', tanggalSurat: '', kepada: '', hari: '', pukul: '', tempat: '', agenda: '', isiEdaran: ''
    });

    const handleSuratChange = (e) => {
      setFormSurat({...formSurat, [e.target.name]: e.target.value});
    };

    const formatTanggal = (tgl) => {
      if (!tgl) return '';
      const bln = ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'];
      const d = new Date(tgl);
      return `${d.getDate()} ${bln[d.getMonth()]} ${d.getFullYear()}`;
    };

    const unduhLangsungPDF = () => {
    const isiPenuh = `
<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>Surat TPQ Al Ikhlas</title>
<style>
  @page { size: A4 portrait; margin: 1cm 2cm 2cm 3cm; }
  * { margin:0; padding:0; box-sizing:border-box; }
  html,body { width:210mm; min-height:297mm; font-family:Arial,sans-serif; font-size:13pt; line-height:1.65; background:#fff; color:#000; }
  .kop-wrapper { display:flex; align-items:center; border-bottom:2px solid #000; padding-bottom:8px; margin-bottom:18px; }
  .kop-logo { width:20%; }
  .kop-logo img { height:130px; }
  .kop-teks { width:80%; text-align:center; }
  .kop-teks h3 { margin:0; font-size:13pt; }
  .kop-teks h2 { margin:3px 0; font-size:17pt; font-weight:bold; }
  .kop-teks p { margin:2px 0; font-size:11.5pt; }
  .data-surat { width:100%; margin-bottom:20px; border-collapse:collapse; font-size:13pt; }
  .data-surat td { padding:2px 0; vertical-align:top; }
  .isi-surat-wrapper { margin-left:12%; font-size:13pt; line-height:1.7; }
  .isi-paragraf { text-align:justify; }
  .jadwal { margin:18px 0; width:100%; border-collapse:collapse; font-size:13pt; }
  .jadwal td { padding:3px 0; vertical-align:top; }
  .jadwal .label { width:150px; }
  .tanda-tangan { margin-top:50px; width:100%; padding-left:42%; position:relative; }
  .jabatan { text-align:center; margin:0; }
  .nama-pejabat { text-align:center; font-weight:bold; margin:0; }
  .ttd-gabung { position:absolute; left:55%; top:0; transform:translateX(-50%); height:190px; }
</style>
</head>
<body>
  <div class="kop-wrapper">
    <div class="kop-logo"><img src="https://raw.githubusercontent.com/tpqalikhlasbakalan/web-tpq/main/logo.png"></div>
    <div class="kop-teks">
      <h3>YAYASAN MABIN AN NAHDLIYAH LANGITAN</h3>
      <h2>TPQ AL IKHLAS BAKALAN</h2>
      <p>NIC: B. 1a.05.1158</p>
      <p>Nomor : AHU-0023193.AH.01.04. Tahun 2016</p>
      <p>Alamat: Dusun Bakalan RT.003/ RW.001 Kec. Tikung Kabupaten Lamongan</p>
        </div>
  </div>

  <table class="data-surat">
    <tr>
      <td width="150">Nomor</td>
      <td>: ${formSurat.noSurat || '-'}</td>
    </tr>
    <tr>
      <td>Tanggal</td>
      <td>: ${formatTanggal(formSurat.tanggalSurat) || formatTanggal(new Date().toISOString().slice(0,10))}</td>
    </tr>
    <tr>
      <td>Perihal</td>
      <td>: ${jenisSurat === 'undangan' ? 'UNDANGAN' : 'EDARAN PEMBERITAHUAN'}</td>
    </tr>
  </table>

  <div class="isi-surat-wrapper">
    <p>Kepada Yth.<br>
    Bapak/Ibu ${formSurat.kepada || 'Wali Santri TPQ Al Ikhlas Bakalan'}<br>
    di Tempat</p>
    <br>
    <p class="isi-paragraf">Assalamu’alaikum Warahmatullahi Wabarakatuh.</p>
    <br>
    ${jenisSurat === 'undangan' ? `
    <p class="isi-paragraf">Diberitahukan dengan hormat, sehubungan dengan kegiatan <strong>${formSurat.agenda || 'Kegiatan Rutin TPQ'}</strong>, maka kami mengundang Bapak/Ibu untuk hadir pada acara yang akan dilaksanakan pada:</p>
    <br>
    <table class="jadwal">
      <tr><td class="label">Hari/Tanggal</td><td>: ${formSurat.hari || '-'} / ${formatTanggal(formSurat.tanggalSurat) || '-'}</td></tr>
      <tr><td class="label">Pukul</td><td>: ${formSurat.pukul || '-'} WIB</td></tr>
      <tr><td class="label">Tempat</td><td>: ${formSurat.tempat || 'Lokasi TPQ Al Ikhlas Bakalan'}</td></tr>
    </table>
    <br>
    <p class="isi-paragraf">Demikian undangan ini kami sampaikan, atas perhatian dan kehadirannya kami ucapkan terima kasih.</p>
    ` : `
    <p class="isi-paragraf">${formSurat.isiEdaran || 'Isi edaran pemberitahuan akan disampaikan di sini.'}</p>
    <br>
    <p class="isi-paragraf">Demikian pemberitahuan ini kami sampaikan, agar dapat dimaklumi dan dilaksanakan sebagaimana mestinya. Atas perhatiannya kami ucapkan terima kasih.</p>
    `}
    <br>
    <p class="isi-paragraf">Wassalamu’alaikum Warahmatullahi Wabarakatuh.</p>
  </div>

  <div class="tanda-tangan">
    <p class="jabatan">Kepala TPQ Al Ikhlas</p>
    <div class="ttd-gabung">
      <br><br><br><br>
      <p class="nama-pejabat">Ust. Abd Adzim</p>
    </div>
  </div>
</body>
</html>`;

    const blob = new Blob([isiPenuh], { type: 'text/html;charset=utf-8' });
    const urlFile = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = urlFile;
    a.download = `${jenisSurat.toUpperCase()}_TPQ_Al_Ikhlas_${new Date().toISOString().slice(0,10)}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(urlFile);
    showToast('Surat berhasil dibuat dan siap dicetak!');
  };

  return (
    <div className="animate-fade-in space-y-6">
      <BackButton onClick={() => setActiveTab('dashboard')} />
      <div className="bg-white p-6 rounded-2xl shadow-sm border">
        <h2 className="text-lg font-bold mb-6 flex items-center text-sky-800"><ClipboardList className="mr-2"/> Pembuatan Surat Resmi</h2>
        
        <div className="flex gap-3 mb-6">
          <button onClick={() => setJenisSurat('undangan')} className={`px-4 py-2 rounded-xl text-xs font-bold transition ${jenisSurat === 'undangan' ? 'bg-sky-600 text-white' : 'bg-gray-100 text-gray-700'}`}>Undangan</button>
          <button onClick={() => setJenisSurat('edaran')} className={`px-4 py-2 rounded-xl text-xs font-bold transition ${jenisSurat === 'edaran' ? 'bg-sky-600 text-white' : 'bg-gray-100 text-gray-700'}`}>Edaran</button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold mb-1 text-gray-700">Nomor Surat</label>
            <input type="text" name="noSurat" value={formSurat.noSurat} onChange={handleSuratChange} className="w-full p-2.5 border rounded-xl text-xs" placeholder="042/TPQ-AI/VII/2026" />
          </div>
          <div>
            <label className="block text-xs font-bold mb-1 text-gray-700">Tanggal Surat</label>
            <input type="date" name="tanggalSurat" value={formSurat.tanggalSurat} onChange={handleSuratChange} className="w-full p-2.5 border rounded-xl text-xs" />
          </div>
          <div>
            <label className="block text-xs font-bold mb-1 text-gray-700">Kepada</label>
            <input type="text" name="kepada" value={formSurat.kepada} onChange={handleSuratChange} className="w-full p-2.5 border rounded-xl text-xs" placeholder="Wali Santri / Guru / Tamu" />
          </div>
          {jenisSurat === 'undangan' && (
            <>
              <div>
                <label className="block text-xs font-bold mb-1 text-gray-700">Hari</label>
                <input type="text" name="hari" value={formSurat.hari} onChange={handleSuratChange} className="w-full p-2.5 border rounded-xl text-xs" placeholder="Senin, 03 Agustus 2026" />
              </div>
              <div>
                <label className="block text-xs font-bold mb-1 text-gray-700">Pukul</label>
                <input type="text" name="pukul" value={formSurat.pukul} onChange={handleSuratChange} className="w-full p-2.5 border rounded-xl text-xs" placeholder="08.00 s.d Selesai" />
              </div>
              <div>
                <label className="block text-xs font-bold mb-1 text-gray-700">Tempat</label>
                <input type="text" name="tempat" value={formSurat.tempat} onChange={handleSuratChange} className="w-full p-2.5 border rounded-xl text-xs" placeholder="Aula TPQ Al Ikhlas" />
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs font-bold mb-1 text-gray-700">Agenda Kegiatan</label>
                <input type="text" name="agenda" value={formSurat.agenda} onChange={handleSuratChange} className="w-full p-2.5 border rounded-xl text-xs" placeholder="Pembagian Raport Semester Ganjil" />
              </div>
            </>
          )}
          {jenisSurat === 'edaran' && (
            <div className="md:col-span-2">
              <label className="block text-xs font-bold mb-1 text-gray-700">Isi Edaran</label>
              <textarea name="isiEdaran" value={formSurat.isiEdaran} onChange={handleSuratChange} rows="4" className="w-full p-2.5 border rounded-xl text-xs" placeholder="Tuliskan isi pemberitahuan secara lengkap..."></textarea>
            </div>
          )}
        </div>

        <button onClick={unduhLangsungPDF} className="w-full mt-6 bg-sky-600 hover:bg-sky-700 text-white font-bold py-3 rounded-xl text-xs shadow">
          📄 BUAT & UNDUH SURAT (SIAP CETAK)
        </button>
      </div>
    </div>
  );
  }

  return null;
}

function BendaharaView({ activeTab, setActiveTab, users, savings, settings, updateTable, showToast, currentUser }) {
  const santriList = users.filter(u => u.role === 'santri');
  const [searchSantri, setSearchSantri] = useState('');
  const [filterStatus, setFilterStatus] = useState('semua');

  const santriTerfilter = santriList.filter(s => {
    const cocokNama = s.name.toLowerCase().includes(searchSantri.toLowerCase());
    if (filterStatus === 'semua') return cocokNama;
    if (filterStatus === 'tagihan') return cocokNama && s.hasAlarm;
    if (filterStatus === 'lunas') return cocokNama && !s.hasAlarm;
    return cocokNama;
  });

  const totalKas = savings.reduce((a, b) => a + (b.type === 'setor' ? b.amount : -b.amount), 0);
  const totalSetoran = savings.filter(s => s.type === 'setor').reduce((a, b) => a + b.amount, 0);
  const totalPenarikan = savings.filter(s => s.type === 'tarik').reduce((a, b) => a + b.amount, 0);

  const menus = [
    { id: 'input_tabungan', label: 'Input Mutasi Tabungan', icon: DollarSign, color: 'bg-amber-100 text-amber-700', desc: 'Catat setoran & penarikan tabungan santri.' },
    { id: 'rekap_tabungan', label: 'Rekap Saldo Tabungan', icon: Database, color: 'bg-blue-100 text-blue-700', desc: 'Lihat saldo akhir seluruh santri secara ringkas.' },
    { id: 'kelola_syahriah', label: 'Kelola Syahriah', icon: CreditCard, color: 'bg-red-100 text-red-700', desc: 'Tandai pembayaran & atur alarm tagihan.' },
    { id: 'laporan_kas', label: 'Laporan Kas', icon: ClipboardList, color: 'bg-gray-100 text-gray-700', desc: 'Ringkasan total masuk, keluar, dan saldo kas.' }
  ];

  if (activeTab === 'dashboard') return (
    <div className="animate-fade-in space-y-6">
      <h2 className="text-xl font-black text-gray-800">Panel Bendahara TPQ</h2>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border"><p className="text-[10px] text-gray-400 font-bold uppercase">Total Setoran Masuk</p><h3 className="text-lg font-black text-emerald-600 mt-1">Rp {totalSetoran.toLocaleString('id-ID')}</h3></div>
        <div className="bg-white p-5 rounded-2xl border"><p className="text-[10px] text-gray-400 font-bold uppercase">Total Penarikan Keluar</p><h3 className="text-lg font-black text-red-600 mt-1">Rp {totalPenarikan.toLocaleString('id-ID')}</h3></div>
        <div className="bg-white p-5 rounded-2xl border"><p className="text-[10px] text-gray-400 font-bold uppercase">Saldo Kas Saat Ini</p><h3 className="text-lg font-black text-blue-700 mt-1">Rp {totalKas.toLocaleString('id-ID')}</h3></div>
      </div>
      <MenuGrid menus={menus} onSelect={setActiveTab} />
    </div>
  );

  if (activeTab === 'input_tabungan') return (
    <div className="animate-fade-in"><BackButton onClick={() => setActiveTab('dashboard')} /><SavingsInputView users={users} savings={savings} updateTable={updateTable} showToast={showToast} recorderId={currentUser.id} /></div>
  );

  if (activeTab === 'rekap_tabungan') {
    const rekapPerSantri = santriList.map(s => {
      const mutasi = savings.filter(m => String(m.santriId) === String(s.id));
      const masuk = mutasi.filter(x => x.type === 'setor').reduce((a,b) => a+b.amount,0);
      const keluar = mutasi.filter(x => x.type === 'tarik').reduce((a,b) => a+b.amount,0);
      return { ...s, saldo: masuk - keluar };
    });
    return (
      <div className="animate-fade-in space-y-6">
        <BackButton onClick={() => setActiveTab('dashboard')} />
        <div className="bg-white p-6 rounded-2xl shadow-sm border">
          <h2 className="text-lg font-bold mb-4 flex items-center text-blue-800"><Database className="mr-2"/> Rekap Saldo Tabungan Santri</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-gray-50 font-bold text-gray-600 uppercase">
                <tr>
                  <th className="p-3 text-left">No</th>
                  <th className="p-3 text-left">Nama Santri</th>
                  <th className="p-3 text-left">Jilid</th>
                  <th className="p-3 text-right">Saldo Tabungan</th>
                </tr>
              </thead>
              <tbody>
                {rekapPerSantri.sort((a,b) => a.name.localeCompare(b.name)).map((s, i) => (
                  <tr key={s.id} className="border-b hover:bg-gray-50">
                    <td className="p-3">{i+1}</td>
                    <td className="p-3 font-semibold">{s.name}</td>
                    <td className="p-3">{s.jilid}</td>
                    <td className={`p-3 font-bold text-right ${s.saldo >=0 ? 'text-emerald-700' : 'text-red-600'}`}>Rp {s.saldo.toLocaleString('id-ID')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  if (activeTab === 'kelola_syahriah') return (
    <div className="animate-fade-in space-y-6">
      <BackButton onClick={() => setActiveTab('dashboard')} />
      <div className="bg-white p-6 rounded-2xl shadow-sm border">
        <h2 className="text-lg font-bold mb-4 flex items-center text-red-800"><CreditCard className="mr-2"/> Pengelolaan Syahriah Bulanan</h2>
        
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
            <input type="text" value={searchSantri} onChange={(e) => setSearchSantri(e.target.value)} placeholder="Cari nama santri..." className="w-full pl-9 p-2.5 border rounded-xl text-xs" />
          </div>
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="p-2.5 border rounded-xl text-xs font-bold">
            <option value="semua">Semua Santri</option>
            <option value="tagihan">Ada Tagihan</option>
            <option value="lunas">Sudah Lunas</option>
          </select>
        </div>

        <div className="space-y-2">
          {santriTerfilter.map(s => (
            <div key={s.id} className="p-4 border rounded-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 text-xs">
              <div>
                <p className="font-bold text-sm">{s.name}</p>
                <p className="text-gray-500">Jilid: {s.jilid}</p>
              </div>
              <div className="flex items-center gap-3">
                <span className={`px-3 py-1 rounded-full font-bold ${s.hasAlarm ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'}`}>
                  {s.hasAlarm ? '⚠️ BELUM LUNAS' : '✅ LUNAS'}
                </span>
                <button onClick={async () => {
                  const ubah = users.map(u => String(u.id) === String(s.id) ? {
                    ...u, hasAlarm: !s.hasAlarm, historyBayar: s.hasAlarm ? s.historyBayar : [...(s.historyBayar||[]), new Date().toISOString().slice(0,10)]
                  } : u);
                  await updateTable('users', ubah);
                  showToast(s.hasAlarm ? 'Tagihan ditandai belum lunas!' : 'Pembayaran dicatat sebagai lunas!');
                }} className={`px-3 py-1.5 rounded-xl font-bold text-white ${s.hasAlarm ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-amber-600 hover:bg-amber-700'}`}>
                  {s.hasAlarm ? 'LUNASKAN' : 'TANDAI TUNGGAKAN'}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  if (activeTab === 'laporan_kas') return (
    <div className="animate-fade-in space-y-6">
      <BackButton onClick={() => setActiveTab('dashboard')} />
      <div className="bg-white p-6 rounded-2xl shadow-sm border">
        <h2 className="text-lg font-bold mb-6 flex items-center text-gray-800"><ClipboardList className="mr-2"/> Laporan Rekapitulasi Kas</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-6">
          <div className="bg-emerald-50 p-5 rounded-xl border border-emerald-200 text-center">
            <p className="text-xs font-bold text-emerald-700 uppercase">Total Pemasukan</p>
            <p className="text-xl font-black text-emerald-800 mt-1">Rp {totalSetoran.toLocaleString('id-ID')}</p>
          </div>
          <div className="bg-red-50 p-5 rounded-xl border border-red-200 text-center">
            <p className="text-xs font-bold text-red-700 uppercase">Total Pengeluaran</p>
            <p className="text-xl font-black text-red-800 mt-1">Rp {totalPenarikan.toLocaleString('id-ID')}</p>
          </div>
          <div className="bg-blue-50 p-5 rounded-xl border border-blue-200 text-center">
            <p className="text-xs font-bold text-blue-700 uppercase">Saldo Akhir Kas</p>
            <p className="text-xl font-black text-blue-800 mt-1">Rp {totalKas.toLocaleString('id-ID')}</p>
          </div>
        </div>
        <div className="bg-gray-50 p-4 rounded-xl border">
          <p className="text-xs text-gray-500 text-center">Laporan ini memuat seluruh transaksi tabungan santri yang telah dicatat oleh Bendahara dan Pengajar yang berwenang.</p>
        </div>
      </div>
    </div>
  );

  return null;
}

function AdminView({ activeTab, setActiveTab, users, updateTable, showToast, settings, appsScriptUrl, setAppsScriptUrl, loadDatabase }) {
  const [daftarPengguna, setDaftarPengguna] = useState(users);
  const [formAkun, setFormAkun] = useState({ id: '', username: '', password: '', name: '', role: 'santri', jilid: 'Jilid 1', guruId: '' });
  const [modeEdit, setModeEdit] = useState(false);
  const [urlSementara, setUrlSementara] = useState(appsScriptUrl);

  useEffect(() => { setDaftarPengguna(users); }, [users]);

  const resetForm = () => {
    setFormAkun({ id: '', username: '', password: '', name: '', role: 'santri', jilid: 'Jilid 1', guruId: '' });
    setModeEdit(false);
  };

  const simpanAkun = async (e) => {
    e.preventDefault();
    if (modeEdit) {
      const hasil = daftarPengguna.map(a => String(a.id) === String(formAkun.id) ? { ...a, ...formAkun } : a);
      await updateTable('users', hasil);
      showToast('Data akun berhasil diperbarui!');
    } else {
      const baru = { ...formAkun, id: Date.now().toString() };
      await updateTable('users', [baru, ...daftarPengguna]);
      showToast('Akun baru berhasil dibuat!');
    }
    resetForm();
  };

  const editAkun = (akun) => { setFormAkun({ ...akun }); setModeEdit(true); window.scrollTo({top:0, behavior:'smooth'}); };
  const hapusAkun = async (id) => { if (!confirm('Yakin akan menghapus akun ini?')) return; await updateTable('users', daftarPengguna.filter(a => String(a.id) !== String(id))); showToast('Akun telah dihapus!'); };
  const simpanUrl = async () => { setAppsScriptUrl(urlSementara); localStorage.setItem('tpq_apps_script_url', urlSementara); await loadDatabase(urlSementara); showToast('URL Google Apps Script telah diperbarui!'); };
  const simpanIdentitas = async (e) => { e.preventDefault(); const data = { ...settings, tpqName: e.target.tpqName.value, logoUrl: e.target.logoUrl.value }; await updateTable('settings', data); showToast('Identitas TPQ disimpan!'); };

  const menus = [
    { id: 'kelola_akun', label: 'Manajemen Akun', icon: Users, color: 'bg-purple-100 text-purple-700', desc: 'Tambah, ubah, hapus akun pengguna sistem.' },
    { id: 'pengaturan_sistem', label: 'Pengaturan Sistem', icon: Settings, color: 'bg-gray-100 text-gray-700', desc: 'Identitas TPQ & koneksi Google Sheets.' }
  ];

  if (activeTab === 'dashboard') return <div className="animate-fade-in"><h2 className="text-xl font-black text-gray-800 mb-6">Panel Administrator Sistem</h2><MenuGrid menus={menus} onSelect={setActiveTab} /></div>;

  if (activeTab === 'pengaturan' || activeTab === 'pengaturan_sistem') return (
    <div className="animate-fade-in space-y-6">
      <BackButton onClick={() => setActiveTab('dashboard')} />
      <div className="bg-white p-6 rounded-2xl shadow-sm border">
        <h2 className="text-lg font-bold mb-6 flex items-center text-gray-800"><Settings className="mr-2"/> Pengaturan Umum & Koneksi</h2>
        <form onSubmit={simpanIdentitas} className="space-y-4 mb-8">
          <div><label className="block text-xs font-bold mb-1 text-gray-700">Nama TPQ</label><input type="text" name="tpqName" defaultValue={settings.tpqName} className="w-full p-2.5 border rounded-xl text-xs" required /></div>
          <div><label className="block text-xs font-bold mb-1 text-gray-700">Link Logo (Opsional)</label><input type="text" name="logoUrl" defaultValue={settings.logoUrl} className="w-full p-2.5 border rounded-xl text-xs" placeholder="https://..." /></div>
          <button type="submit" className="bg-gray-700 hover:bg-gray-800 text-white font-bold py-2.5 rounded-xl text-xs">Simpan Identitas TPQ</button>
        </form>
        <div className="border-t pt-6">
          <h3 className="font-bold text-sm mb-3">Koneksi Google Apps Script</h3>
          <div className="flex gap-2">
            <input type="text" value={urlSementara} onChange={(e) => setUrlSementara(e.target.value)} className="flex-1 p-2.5 border rounded-xl text-xs font-mono" />
            <button onClick={simpanUrl} className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-4 rounded-xl text-xs">Simpan & Hubungkan</button>
          </div>
        </div>
      </div>
    </div>
  );

  if (activeTab === 'hak_akses' || activeTab === 'kelola_akun') return (
    <div className="animate-fade-in space-y-6">
      <BackButton onClick={() => setActiveTab('dashboard')} />
      <div className="bg-white p-6 rounded-2xl shadow-sm border">
        <h2 className="text-lg font-bold mb-6 flex items-center text-purple-800"><Users className="mr-2"/> Kelola Akun Pengguna</h2>
        <form onSubmit={simpanAkun} className="bg-gray-50 p-4 rounded-xl border mb-8 space-y-3">
          <h4 className="font-bold text-xs text-gray-700">{modeEdit ? 'UBAH DATA AKUN' : 'TAMBAH AKUN BARU'}</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div><label className="block text-[10px] font-bold mb-1 text-gray-600">Nama Lengkap</label><input type="text" value={formAkun.name} onChange={(e) => setFormAkun({...formAkun, name:e.target.value})} className="w-full p-2 border rounded-lg text-xs" required /></div>
            <div><label className="block text-[10px] font-bold mb-1 text-gray-600">Username</label><input type="text" value={formAkun.username} onChange={(e) => setFormAkun({...formAkun, username:e.target.value})} className="w-full p-2 border rounded-lg text-xs" required /></div>
            <div><label className="block text-[10px] font-bold mb-1 text-gray-600">Password</label><input type="text" value={formAkun.password} onChange={(e) => setFormAkun({...formAkun, password:e.target.value})} className="w-full p-2 border rounded-lg text-xs" required /></div>
            <div><label className="block text-[10px] font-bold mb-1 text-gray-600">Peran / Akses</label><select value={formAkun.role} onChange={(e) => setFormAkun({...formAkun, role:e.target.value})} className="w-full p-2 border rounded-lg text-xs">
              <option value="admin">Admin</option>
              <option value="kepala_tpq">Kepala TPQ</option>
              <option value="guru">Guru</option>
              <option value="bendahara">Bendahara</option>
              <option value="santri">Santri</option>
            </select></div>
            {formAkun.role === 'santri' && (<><div><label className="block text-[10px] font-bold mb-1 text-gray-600">Jilid</label><select value={formAkun.jilid} onChange={(e) => setFormAkun({...formAkun, jilid:e.target.value})} className="w-full p-2 border rounded-lg text-xs">{JILID_LEVELS.map(j => <option key={j} value={j}>{j}</option>)}</select></div>
            <div><label className="block text-[10px] font-bold mb-1 text-gray-600">ID Guru Wali</label><input type="text" value={formAkun.guruId} onChange={(e) => setFormAkun({...formAkun, guruId:e.target.value})} className="w-full p-2 border rounded-lg text-xs" placeholder="Isi ID akun guru" /></div></>)}
          </div>
          <div className="flex gap-2 mt-3">
            <button type="submit" className="bg-purple-600 hover:bg-purple-700 text-white font-bold px-4 py-2 rounded-lg text-xs">{modeEdit ? 'Perbarui' : 'Simpan Baru'}</button>
            {modeEdit && <button type="button" onClick={resetForm} className="bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold px-4 py-2 rounded-lg text-xs">Batal</button>}
          </div>
        </form>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-gray-50 font-bold text-gray-600 uppercase">
              <tr>
                <th className="p-2 text-left">Nama</th>
                <th className="p-2 text-left">Username</th>
                <th className="p-2 text-left">Peran</th>
                <th className="p-2 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {daftarPengguna.sort((a,b) => a.name.localeCompare(b.name)).map(a => (
                <tr key={a.id} className="border-b hover:bg-gray-50">
                  <td className="p-2 font-semibold">{a.name}</td>
                  <td className="p-2">{a.username}</td>
                  <td className="p-2 capitalize">{getRoleName(a.role)}</td>
                  <td className="p-2 text-center">
                    <button onClick={() => editAkun(a)} className="text-blue-600 hover:text-blue-800 mx-1"><Edit size={14}/></button>
                    <button onClick={() => hapusAkun(a.id)} className="text-red-600 hover:text-red-800 mx-1"><Trash2 size={14}/></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  return null;
}
