import React, { useState, useEffect } from 'react';
import { 
  User, Lock, Shield, Book, BookOpen, CheckCircle, 
  AlertTriangle, Users, LogOut, CreditCard, Bell, Plus, 
  Trash2, Check, X, UserPlus, Info, Edit, ArrowLeft, 
  Eye, EyeOff, Award, ClipboardList, Settings, DollarSign, 
  CheckSquare, RefreshCw, Database, Copy, Unlock,
  ChevronDown, ChevronUp
} from 'lucide-react';

// -------------------------------------------------------------
// MASUKKAN URL GOOGLE APPS SCRIPT ANDA DI SINI
// -------------------------------------------------------------
const HARDCODED_APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbwqbAPcV4Mz6hT-PneqAQoC-aZoRdgaGJzL23qAOwcSnClmDzRpf_fzbIsPymtyQYyn-w/exec";

const JILID_LEVELS = [
  'Jilid 1', 'Jilid 2', 'Jilid 3', 'Jilid 4', 'Jilid 5', 'Jilid 6', 
  'PSQ 1-2 (Juz 1)', 'PSQ 3-4 (Juz 2-4)', 'PSQ 4-6 (Juz 5-11)', 'PSQ 7-8 (Juz 12-20)', 'PSQ 9-10 (Juz 21-30)', 'Lulus (Tamat)'
];

const INITIAL_DATA = {
  users: [
    { id: '1', username: 'admin', password: '123', role: 'admin', name: 'Super Admin' },
    { id: '2', username: 'kepala', password: '123', role: 'kepala_tpq', name: 'Ust. Abdul Halim' },
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
  settings: { 
    tpqName: 'TPQ Al-Hikmah Modern', 
    logoUrl: '' 
  }
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
  const currentDay = now.getDay(); // 0: Sunday, 6: Saturday
  const currentHour = now.getHours();
  
  const isWeekendRange = simulatedWeekend || (currentDay === 6 && currentHour >= 18) || (currentDay === 0);
  
  if (!isWeekendRange) {
    return false;
  }
  
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
      <span className="mr-2 font-medium">{message}</span>
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
        className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md hover:border-emerald-200 flex flex-col items-center justify-center text-center transition-all duration-300 group relative overflow-hidden w-full"
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
  const [settings, setSettings] = useState(INITIAL_DATA.settings);
  
  const [isSyncing, setIsSyncing] = useState(false);
  const [simulatedWeekend, setSimulatedWeekend] = useState(false);

  const loadDatabase = async () => {
    setIsSyncing(true);
    try {
      const localSettings = safeGetLocalStorage('tpq_settings', INITIAL_DATA.settings);
      setSettings(localSettings);

      if (HARDCODED_APPS_SCRIPT_URL && HARDCODED_APPS_SCRIPT_URL.trim() !== '' && HARDCODED_APPS_SCRIPT_URL !== "ISI_URL_APPS_SCRIPT_ANDA_DISINI") {
        const response = await fetch(`${HARDCODED_APPS_SCRIPT_URL}?action=getAll`);
        
        if (!response.ok) {
          throw new Error(`HTTP Error: ${response.status}`);
        }
        
        // Cek apakah balasan dari Google berupa HTML (biasanya ini peringatan akses ditolak/halaman login)
        const contentType = response.headers.get("content-type");
        if (contentType && contentType.includes("text/html")) {
          throw new Error('Akses Ditolak! Pastikan setting "Who has access" diubah menjadi "Anyone".');
        }

        const payload = await response.json();
        
        if (payload.status === 'success' && payload.data) {
          const { users: sUsers, progress: sProgress, targets: sTargets, settings: sSettings } = payload.data;
          setUsers(sUsers || []);
          setProgress(sProgress || []);
          setTargets(sTargets || []);
          if (sSettings) setSettings(sSettings);
          
          localStorage.setItem('tpq_users', JSON.stringify(sUsers || []));
          localStorage.setItem('tpq_progress', JSON.stringify(sProgress || []));
          localStorage.setItem('tpq_targets', JSON.stringify(sTargets || []));
          localStorage.setItem('tpq_settings', JSON.stringify(sSettings || localSettings));
          
          if (!isInitializing) showToast('Database Google Sheets berhasil disinkronkan!');
        } else {
          throw new Error(payload.message || 'Format data dari server tidak sesuai.');
        }
      } else {
        if (!localStorage.getItem('tpq_users')) {
          localStorage.setItem('tpq_users', JSON.stringify(INITIAL_DATA.users));
          localStorage.setItem('tpq_progress', JSON.stringify(INITIAL_DATA.progress));
          localStorage.setItem('tpq_targets', JSON.stringify(INITIAL_DATA.targets));
          localStorage.setItem('tpq_settings', JSON.stringify(INITIAL_DATA.settings));
        }
        setUsers(safeGetLocalStorage('tpq_users', INITIAL_DATA.users));
        setProgress(safeGetLocalStorage('tpq_progress', INITIAL_DATA.progress));
        setTargets(safeGetLocalStorage('tpq_targets', INITIAL_DATA.targets));
      }
    } catch (error) {
      console.error("Detail Error Sinkronisasi:", error);
      if (HARDCODED_APPS_SCRIPT_URL && HARDCODED_APPS_SCRIPT_URL.trim() !== '' && HARDCODED_APPS_SCRIPT_URL !== "ISI_URL_APPS_SCRIPT_ANDA_DISINI") {
        // Tampilkan pesan error yang lebih spesifik
        const errorMsg = error.message.includes('Failed to fetch') 
          ? 'Gagal menghubungi server. Periksa koneksi internet atau URL.' 
          : error.message;
        showToast(`Koneksi Gagal: ${errorMsg}`, 'error');
      }
      setUsers(safeGetLocalStorage('tpq_users', INITIAL_DATA.users));
      setProgress(safeGetLocalStorage('tpq_progress', INITIAL_DATA.progress));
      setTargets(safeGetLocalStorage('tpq_targets', INITIAL_DATA.targets));
    } finally {
      setIsSyncing(false);
      setIsInitializing(false);
    }
  };

  useEffect(() => {
    loadDatabase();
    try {
      const savedUser = sessionStorage.getItem('tpq_user');
      if (savedUser) setCurrentUser(JSON.parse(savedUser));
    } catch (e) {
      console.error("Session restoration error:", e);
    }
  }, []);

  useEffect(() => {
    if (currentUser && users.length > 0) {
      const fresh = users.find(u => u.id === currentUser.id);
      if (fresh && JSON.stringify(fresh) !== JSON.stringify(currentUser)) {
        setCurrentUser(fresh);
        sessionStorage.setItem('tpq_user', JSON.stringify(fresh));
      }
    }
  }, [users, currentUser]);

  const updateTable = async (table, updatedData) => {
    setIsSyncing(true);
    try {
      localStorage.setItem(`tpq_${table}`, JSON.stringify(updatedData));
      
      if (table === 'users') setUsers(updatedData);
      if (table === 'progress') setProgress(updatedData);
      if (table === 'targets') setTargets(updatedData);
      if (table === 'settings') setSettings(updatedData);

      if (HARDCODED_APPS_SCRIPT_URL && HARDCODED_APPS_SCRIPT_URL.trim() !== '' && HARDCODED_APPS_SCRIPT_URL !== "ISI_URL_APPS_SCRIPT_ANDA_DISINI") {
        await fetch(HARDCODED_APPS_SCRIPT_URL, {
          method: 'POST',
          mode: 'no-cors', 
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'updateTable', table, data: updatedData })
        });
        showToast('Sinkronisasi Google Sheet berhasil diperbarui!');
      } else {
        showToast('Data berhasil disimpan secara lokal.');
      }
    } catch (error) {
      console.error(error);
      showToast('Gagal melakukan update data ke Google Sheet.', 'error');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleLogin = (username, password) => {
    const user = users.find(u => u.username.toLowerCase() === username.toLowerCase() && u.password === password);
    if (user) {
      setCurrentUser(user);
      sessionStorage.setItem('tpq_user', JSON.stringify(user));
      setActiveTab('dashboard');
      showToast(`Selamat datang kembali, ${user.name}!`);
    } else {
      showToast('Username atau password salah!', 'error');
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    sessionStorage.removeItem('tpq_user');
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
        <p className="text-gray-500 text-sm mt-2 text-center max-w-xs">Memastikan Anda masuk dengan data sandi dan profil terbaru dari Google Sheets.</p>
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
      
      <header className="bg-emerald-800 text-white p-4 shadow-md flex justify-between items-center checked-bg sticky top-0 z-10">
        <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setActiveTab('dashboard')}>
          {settings.logoUrl ? (
            <img src={settings.logoUrl} alt="Logo" className="w-auto h-10 object-contain" />
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
            onClick={loadDatabase} 
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
            progress={progress}
            targets={targets}
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
            progress={progress}
            targets={targets}
            settings={settings}
            updateTable={updateTable}
            showToast={showToast} 
            simulatedWeekend={simulatedWeekend}
            setSimulatedWeekend={setSimulatedWeekend}
          />
        )}
        {currentUser.role === 'bendahara' && (
          <BendaharaView 
            activeTab={activeTab} 
            setActiveTab={setActiveTab} 
            users={users}
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
          />
        )}
      </main>
    </div>
  );
}

function SantriView({ activeTab, setActiveTab, user, users, progress, targets, updateTable, showToast, simulatedWeekend, setSimulatedWeekend }) {
  const currentUser = users.find(u => u.id === user.id) || user;

  const handleAccMingguan = () => {
    const updatedUsers = users.map(u => u.id === user.id ? { ...u, lastAccDate: new Date().toISOString() } : u);
    updateTable('users', updatedUsers);
    showToast('Alhamdulillah! Progres mingguan berhasil di-ACC orang tua.');
  };

  const myProgress = progress.filter(p => p.santriId === user.id).reverse();
  const myTargets = targets.filter(t => t.level === currentUser.jilid);

  const menus = [
    { id: 'riwayat_progres', label: 'Riwayat & ACC Mengaji', icon: ClipboardList, color: 'bg-emerald-100 text-emerald-600', desc: 'Pantau laporan harian hafalan, serta tombol persetujuan wali murid.' },
    { id: 'riwayat_bayar', label: 'Riwayat Syahriah', icon: CreditCard, color: 'bg-yellow-100 text-yellow-600', desc: 'Pantau bukti iuran SPP bulanan yang divalidasi oleh bendahara.' },
  ];

  const now = new Date();
  const isActualSaturdayNight = (now.getDay() === 6 && now.getHours() >= 18) || (now.getDay() === 0);
  const triggerAccRequired = isAccNeeded(currentUser.lastAccDate, simulatedWeekend || isActualSaturdayNight);

  if (activeTab === 'dashboard') {
    return (
      <div className="space-y-6">
        {currentUser.hasAlarm && (
          <div className="bg-red-50 border-2 border-red-200 text-red-800 p-6 rounded-2xl shadow-md flex items-start animate-pulse">
            <AlertTriangle className="w-8 h-8 mr-4 flex-shrink-0 text-red-600" />
            <div>
              <h3 className="font-bold text-lg">Pemberitahuan Tagihan Syahriah!</h3>
              <p className="mt-1 text-sm text-red-700 leading-relaxed">Assalamu\'alaikum Warahmatullahi Wabarakaatuh. Mengingatkan kembali bahwa pembayaran syahriah bulanan untuk ananda telah melewati tenggat waktu (tanggal 10). Mohon segera menyelesaikan iuran kepada Bendahara TPQ agar operasional pendidikan berjalan lancar. Syukron katsiran.</p>
            </div>
          </div>
        )}
        
        <div className="bg-white p-6 rounded-2xl border flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shadow-sm">
          <div>
            <h2 className="text-xl font-extrabold text-gray-800">Assalamu\'alaikum, {currentUser.name}!</h2>
            <p className="text-gray-500 text-sm mt-1">Status tingkat belajar: <span className="font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg text-xs">{currentUser.jilid}</span></p>
          </div>
          <div className="flex items-center space-x-2 bg-emerald-50 px-3 py-2 rounded-xl border border-emerald-100">
            <span className="text-xs text-emerald-800 font-bold">Simulasi Akhir Pekan (Sabtu Maghrib)</span>
            <input 
              type="checkbox" 
              checked={simulatedWeekend} 
              onChange={(e) => setSimulatedWeekend(e.target.checked)}
              className="rounded text-emerald-600 focus:ring-emerald-500"
            />
          </div>
        </div>

        <h2 className="text-lg font-bold text-gray-700 mt-4">Silakan Pilih Layanan:</h2>
        <MenuGrid menus={menus} onSelect={setActiveTab} />
      </div>
    );
  }

  return (
    <div className="animate-fade-in animate-duration-300">
      <BackButton onClick={() => setActiveTab('dashboard')} />
      
      {activeTab === 'riwayat_progres' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-5 border-b bg-gray-50 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h2 className="font-bold text-lg flex items-center text-gray-800">
                  <ClipboardList className="mr-2 text-emerald-600"/> Riwayat Progres Belajar Ananda
                </h2>
                <p className="text-xs text-gray-500 mt-1">Wali murid wajib meninjau setoran harian di bawah sebelum menekan tombol ACC mingguan.</p>
              </div>

              {triggerAccRequired ? (
                <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-xl flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto shadow-sm">
                  <div className="text-left w-full sm:w-auto">
                    <p className="font-bold text-yellow-800 text-xs sm:text-sm">Menunggu ACC Orang Tua</p>
                    <p className="text-[11px] text-yellow-700 font-medium">Wali wajib klik tombol di samping untuk membuka akses pengajaran guru selanjutnya.</p>
                  </div>
                  <button onClick={handleAccMingguan} className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl text-xs font-bold shadow transition flex items-center justify-center whitespace-nowrap w-full sm:w-auto">
                    <CheckCircle className="w-4 h-4 mr-1.5"/> ACC Pembelajaran Minggu Ini
                  </button>
                </div>
              ) : (
                <div className="bg-emerald-50 border border-emerald-200 px-4 py-2.5 rounded-xl flex items-center shadow-sm text-emerald-800 font-bold text-xs">
                  <CheckCircle className="text-emerald-600 w-5 h-5 mr-2" />
                  Progres Belajar Sudah di-ACC Wali Murid
                </div>
              )}
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 text-gray-600 text-xs border-b">
                    <th className="p-4">Tanggal</th>
                    <th className="p-4">Surah / Kitab</th>
                    <th className="p-4">Ayat / Halaman</th>
                    <th className="p-4">Kualitas Nilai</th>
                    <th className="p-4">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {myProgress.length === 0 && <tr><td colSpan="5" className="p-8 text-center text-gray-500">Belum ada catatan setoran mengaji harian.</td></tr>}
                  {myProgress.map((p) => (
                    <tr key={p.id} className="border-b hover:bg-gray-50 transition">
                      <td className="p-4 text-xs font-semibold text-gray-600">{p.date}</td>
                      <td className="p-4 text-sm font-bold text-gray-800">{p.surah}</td>
                      <td className="p-4 text-sm text-gray-600">{p.ayat}</td>
                      <td className="p-4 font-extrabold text-emerald-700">{p.nilai}</td>
                      <td className="p-4">
                        {p.status === 'acc_guru' ? <span className="bg-blue-50 text-blue-700 text-xs px-2.5 py-1 rounded-full font-semibold border border-blue-100">Lancar Harian</span> :
                         p.status === 'pending' ? <span className="bg-yellow-50 text-yellow-700 text-xs px-2.5 py-1 rounded-full font-semibold border border-yellow-100">Proses Kelulusan</span> :
                         <span className="bg-emerald-100 text-emerald-800 text-xs px-2.5 py-1 rounded-full font-semibold border border-emerald-200">Lulus Jilid</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-4 border-b bg-gray-50">
              <h2 className="font-bold text-sm flex items-center text-gray-800"><Award className="mr-2 text-emerald-600"/> Target Kompetensi Pembelajaran {currentUser.jilid}</h2>
            </div>
            <div className="p-6">
              {myTargets.length > 0 ? (
                 <ul className="space-y-3">
                   {myTargets.map(t => {
                     const isCompleted = currentUser.completedTargets?.includes(t.id);
                     return (
                       <li key={t.id} className="flex items-start text-gray-700 text-sm">
                         <CheckSquare className={`w-5 h-5 mr-3 mt-0.5 flex-shrink-0 ${isCompleted ? 'text-emerald-600' : 'text-gray-300'}`} />
                         <span className={isCompleted ? 'line-through text-gray-400 font-normal' : 'text-gray-700 font-medium'}>{t.description}</span>
                       </li>
                     );
                   })}
                 </ul>
              ) : <p className="text-xs text-gray-500 italic">Target kurikulum belum ditentukan untuk tingkatan ini.</p>}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'riwayat_bayar' && (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <h2 className="text-lg font-bold mb-4 flex items-center text-yellow-600">Riwayat Pembayaran Syahriah</h2>
          {(!currentUser.historyBayar || currentUser.historyBayar.length === 0) ? (
            <div className="p-8 text-center text-gray-400 bg-gray-50 rounded-2xl border border-dashed border-gray-300 text-sm">
              Belum ada riwayat pembayaran syahriah yang tervalidasi.
            </div>
          ) : (
             <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
               {currentUser.historyBayar.map((date, idx) => (
                 <div key={idx} className="bg-emerald-50 text-emerald-900 border border-emerald-100 p-4 rounded-xl flex justify-between items-center shadow-sm">
                   <div className="flex items-center">
                     <CheckCircle size={20} className="mr-2.5 text-emerald-600"/>
                     <div>
                       <p className="font-bold text-sm">Iuran Bulanan Lunas</p>
                       <p className="text-[10px] text-emerald-600">Diverifikasi Bendahara</p>
                     </div>
                   </div>
                   <span className="text-xs font-mono font-bold bg-white px-3 py-1 rounded-lg border shadow-sm">{date}</span>
                 </div>
               ))}
             </div>
          )}
        </div>
      )}
    </div>
  );
}

function GuruView({ activeTab, setActiveTab, user, users, progress, targets, updateTable, showToast, simulatedWeekend, setSimulatedWeekend }) {

  const [expandedSantriId, setExpandedSantriId] = useState(null);

  const toggleSantriExpand = (santriId) => {
    setExpandedSantriId(prev => prev === santriId ? null : santriId);
  };

  const handleKlaim = (santriId) => {
    const updatedUsers = users.map(u => u.id === santriId ? { ...u, guruId: user.id } : u);
    updateTable('users', updatedUsers);
    showToast('Berhasil mengklaim bimbingan santri!');
  };

  const handleLepasKlaim = (santriId) => {
    const updatedUsers = users.map(u => u.id === santriId ? { ...u, guruId: null } : u);
    updateTable('users', updatedUsers);
    showToast('Klaim bimbingan dilepaskan.');
  };

  const handleCeklisTarget = (santriId, targetId, currentChecked) => {
    const targetSantri = users.find(u => u.id === santriId);
    if (!targetSantri) return;

    let completed = targetSantri.completedTargets || [];
    if (currentChecked) {
      completed = completed.filter(id => id !== targetId);
    } else {
      completed = [...completed, targetId];
    }

    const updatedUsers = users.map(u => u.id === santriId ? { ...u, completedTargets: completed } : u);
    updateTable('users', updatedUsers);
    showToast('Target pencapaian santri diperbarui!');
  };

  const submitProgress = (e, santriId, type) => {
    e.preventDefault();
    const targetSantri = users.find(u => u.id === santriId);
    if (!targetSantri) return;
    
    if (type === 'kenaikan') {
      const levelTargets = targets.filter(t => t.level === targetSantri.jilid);
      const completedCount = levelTargets.filter(t => targetSantri.completedTargets?.includes(t.id)).length;
      if (levelTargets.length > 0 && completedCount < levelTargets.length) {
        showToast('Gagal! Santri belum menguasai seluruh kompetensi jilid saat ini.', 'error');
        return;
      }
    }

    const newProgress = {
      id: Date.now().toString(),
      santriId,
      date: e.target.date.value,
      surah: e.target.surah.value,
      ayat: e.target.ayat.value,
      nilai: e.target.nilai.value,
      type: type,
      status: type === 'harian' ? 'acc_guru' : 'pending' 
    };

    const updatedProgress = [...progress, newProgress];
    updateTable('progress', updatedProgress);
    
    showToast(type === 'harian' ? 'Progres belajar harian disimpan!' : 'Pengajuan kenaikan jilid dikirim ke Kepala TPQ!');
    e.target.reset();
  };

  const menus = [
    { id: 'isi_progres', label: 'Input Progres Ngaji', icon: ClipboardList, color: 'bg-emerald-100 text-emerald-600', desc: 'Isi setoran harian (surah, ayat, nilai) untuk santri bimbingan Anda.' },
    { id: 'nilai_target', label: 'Penilaian Kompetensi', icon: CheckSquare, color: 'bg-purple-100 text-purple-700', desc: 'Centang kompetensi jilid yang telah dikuasai sebagai syarat kenaikan.' },
    { id: 'pengajuan_kenaikan', label: 'Ajukan Kenaikan Jilid', icon: Award, color: 'bg-orange-100 text-orange-600', desc: 'Ajukan kenaikan jilid ke Kepala TPQ setelah seluruh checklist tercapai.' },
    { id: 'klaim_santri', label: 'Klaim & Kelola Santri', icon: UserPlus, color: 'bg-blue-100 text-blue-600', desc: 'Ambil alokasi bimbingan santri baru atau lepaskan bimbingan.' },
  ];

  const mySantri = users.filter(u => u.role === 'santri' && u.guruId === user.id);

  if (activeTab === 'dashboard') {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl border shadow-sm">
          <div>
            <h2 className="text-xl font-black text-gray-800">Menu Pengajar: {user.name}</h2>
            <p className="text-xs text-gray-500 mt-1">Mengelola {mySantri.length} santri bimbingan.</p>
          </div>
          <div className="flex items-center space-x-2 bg-emerald-50 px-3 py-2 rounded-xl border border-emerald-100">
            <span className="text-xs text-emerald-800 font-bold">Simulasi Akhir Pekan (Sabtu sore)</span>
            <input 
              type="checkbox" 
              checked={simulatedWeekend} 
              onChange={(e) => setSimulatedWeekend(e.target.checked)}
              className="rounded text-emerald-600 focus:ring-emerald-500"
            />
          </div>
        </div>

        <MenuGrid menus={menus} onSelect={setActiveTab} />
      </div>
    );
  }

  return (
    <div className="animate-fade-in animate-duration-300">
      <BackButton onClick={() => setActiveTab('dashboard')} />

      {activeTab === 'klaim_santri' && (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <h2 className="text-lg font-bold mb-6 flex items-center text-blue-800"><UserPlus className="mr-2"/> Kelola Alokasi Pengajaran Santri</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="border border-gray-100 rounded-2xl p-4 bg-gray-50/50">
              <h3 className="font-bold text-sm text-gray-700 mb-4 border-b pb-2 flex items-center"><Unlock size={16} className="mr-1.5 text-blue-600"/> Tersedia ({users.filter(u => u.role === 'santri' && !u.guruId).length})</h3>
              <div className="space-y-3">
                {users.filter(u => u.role === 'santri' && !u.guruId).length === 0 && <p className="text-gray-400 text-xs italic text-center py-4">Semua santri memiliki pengajar.</p>}
                {users.filter(u => u.role === 'santri' && !u.guruId).map(s => (
                  <div key={s.id} className="bg-white p-3 rounded-xl border flex justify-between items-center shadow-sm">
                    <div>
                      <p className="font-bold text-gray-800 text-xs">{s.name}</p>
                      <span className="bg-blue-50 text-blue-700 font-semibold px-2 py-0.5 rounded text-[10px] border border-blue-100">{s.jilid}</span>
                    </div>
                    <button onClick={() => handleKlaim(s.id)} className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg text-[11px] font-bold transition">Klaim</button>
                  </div>
                ))}
              </div>
            </div>

            <div className="border border-emerald-100 rounded-2xl p-4 bg-emerald-50/20">
              <h3 className="font-bold text-sm text-emerald-800 mb-4 border-b pb-2 flex items-center"><Users size={16} className="mr-1.5 text-emerald-600"/> Bimbingan Saya ({mySantri.length})</h3>
              <div className="space-y-3">
                {mySantri.length === 0 && <p className="text-emerald-600/60 text-xs italic text-center py-4">Belum ada santri diklaim.</p>}
                {mySantri.map(s => (
                  <div key={s.id} className="bg-white p-3 rounded-xl border flex justify-between items-center shadow-sm">
                    <div>
                      <p className="font-bold text-gray-800 text-xs">{s.name}</p>
                      <span className="bg-emerald-50 text-emerald-700 font-semibold px-2 py-0.5 rounded text-[10px] border border-emerald-100">{s.jilid}</span>
                    </div>
                    <button onClick={() => handleLepasKlaim(s.id)} className="bg-red-50 hover:bg-red-100 text-red-600 px-3 py-1.5 rounded-lg text-[11px] font-bold transition">Lepas</button>
                  </div>
                ))}
              </div>
            </div>

            <div className="border border-red-100 rounded-2xl p-4 bg-red-50/10">
              <h3 className="font-bold text-sm text-red-800 mb-4 border-b pb-2 flex items-center"><Lock size={16} className="mr-1.5 text-red-600"/> Pengajar Lain ({users.filter(u => u.role === 'santri' && u.guruId && u.guruId !== user.id).length})</h3>
              <div className="space-y-3">
                {users.filter(u => u.role === 'santri' && u.guruId && u.guruId !== user.id).length === 0 && <p className="text-red-600/40 text-xs italic text-center py-4">Kosong.</p>}
                {users.filter(u => u.role === 'santri' && u.guruId && u.guruId !== user.id).map(s => {
                  const sGuru = users.find(u => u.id === s.guruId);
                  return (
                    <div key={s.id} className="bg-white p-3 rounded-xl border flex flex-col gap-1.5 shadow-sm opacity-95">
                      <div className="flex justify-between items-center">
                        <p className="font-bold text-gray-800 text-xs">{s.name}</p>
                        <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded text-[10px] font-semibold">{s.jilid}</span>
                      </div>
                      <p className="text-[10px] text-red-600 font-bold bg-red-50 p-1 rounded text-center border border-red-100">Guru: {sGuru ? sGuru.name : 'Pengajar Lain'}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'isi_progres' && (
        <div className="space-y-6">
          <h2 className="text-lg font-bold flex items-center text-emerald-800"><ClipboardList className="mr-2"/> Input Capaian Nilai Mengaji Harian</h2>
          {mySantri.length === 0 && <div className="bg-blue-50 p-6 rounded-2xl text-blue-800 text-center border border-blue-100 text-sm font-semibold">Silakan lakukan klaim santri terlebih dahulu untuk menginput progres.</div>}
          
          <div className="space-y-4">
            {mySantri.map(santri => {
              const now = new Date();
              const isActualSaturdayNight = (now.getDay() === 6 && now.getHours() >= 18) || (now.getDay() === 0);
              const santriNeedsAcc = isAccNeeded(santri.lastAccDate, simulatedWeekend || isActualSaturdayNight);
              const isExpanded = expandedSantriId === santri.id;
              
              const riwayatSantri = progress.filter(p => p.santriId === santri.id).reverse();

              return (
                <div key={santri.id} className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden flex flex-col transition-all duration-300">
                  <div 
                    className="bg-emerald-50 p-4 border-b flex justify-between items-center cursor-pointer hover:bg-emerald-100 transition-colors"
                    onClick={() => toggleSantriExpand(santri.id)}
                  >
                    <div className="flex items-center space-x-3">
                      <div className="bg-emerald-200 text-emerald-800 p-2 rounded-lg hidden sm:block">
                        <User size={20} />
                      </div>
                      <div>
                        <h3 className="font-bold text-emerald-950 text-sm">{santri.name}</h3>
                        <p className="text-[11px] font-bold text-emerald-700">{santri.jilid}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      {!santriNeedsAcc ? (
                         <span className="bg-emerald-100 text-emerald-800 px-2.5 py-1 rounded-full text-[10px] font-bold flex items-center border border-emerald-200 hidden sm:flex"><CheckCircle size={12} className="mr-1"/> Aktif (Sudah ACC)</span>
                      ) : (
                         <span className="bg-red-100 text-red-800 px-2.5 py-1 rounded-full text-[10px] font-bold flex items-center border border-red-200 hidden sm:flex"><Lock size={12} className="mr-1"/> Terkunci (Butuh ACC Wali)</span>
                      )}
                      <div className="text-emerald-600 bg-emerald-100 p-1.5 rounded-lg shadow-sm">
                        {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                      </div>
                    </div>
                  </div>
                  
                  {isExpanded && (
                    <div className="p-5 flex-1 bg-white animate-fade-in border-t border-emerald-100 flex flex-col md:flex-row gap-6">
                      
                      {/* Riwayat Ngaji Section */}
                      <div className="w-full md:w-1/2 flex flex-col">
                        <h4 className="font-bold text-gray-700 text-sm mb-3 flex items-center"><ClipboardList size={16} className="mr-2 text-emerald-600"/> Riwayat Mengaji</h4>
                        <div className="bg-gray-50 rounded-xl border border-gray-200 overflow-hidden flex-1 min-h-[200px] max-h-[350px] overflow-y-auto">
                          {riwayatSantri.length === 0 ? (
                            <p className="text-xs text-gray-500 italic p-6 text-center flex flex-col items-center justify-center h-full">
                              <BookOpen size={24} className="text-gray-300 mb-2" />
                              Belum ada riwayat mengaji.
                            </p>
                          ) : (
                            <ul className="divide-y divide-gray-200">
                              {riwayatSantri.map(p => (
                                <li key={p.id} className="p-3.5 hover:bg-gray-100 transition-colors flex justify-between items-start text-xs">
                                  <div>
                                    <p className="font-bold text-gray-800">{p.surah}</p>
                                    <p className="text-gray-600 mt-0.5">{p.ayat}</p>
                                    <p className="text-[10px] text-gray-400 mt-1 font-mono">{p.date}</p>
                                  </div>
                                  <div className="flex flex-col items-end">
                                    <span className="font-extrabold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">{p.nilai}</span>
                                    {p.status === 'acc_guru' ? 
                                      <span className="text-[9px] text-blue-600 font-bold mt-1">Laporan Harian</span> : 
                                      <span className="text-[9px] text-orange-600 font-bold mt-1">Ujian Kenaikan</span>
                                    }
                                  </div>
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                      </div>

                      {/* Input Form Section */}
                      <div className="w-full md:w-1/2 flex flex-col">
                        <h4 className="font-bold text-emerald-800 text-sm mb-3 flex items-center"><Plus size={16} className="mr-2"/> Tambah Progres Baru</h4>
                        {santriNeedsAcc ? (
                          <div className="text-center p-6 bg-red-50/50 rounded-xl border border-dashed border-red-300 flex-1 flex flex-col justify-center shadow-inner">
                            <Lock className="w-10 h-10 text-red-500 mx-auto mb-3" />
                            <p className="text-xs font-bold text-red-700">Akses Pengisian Terkunci</p>
                            <p className="text-[11px] text-red-600/80 mt-2 leading-relaxed">Formulir dinonaktifkan sementara karena akhir pekan telah lewat namun Wali Santri belum meng-ACC laporan progres ananda. Segera hubungi wali kelas bersangkutan.</p>
                          </div>
                        ) : (
                          <div className="bg-white rounded-xl border border-emerald-100 p-5 shadow-sm flex-1">
                            <form onSubmit={(e) => submitProgress(e, santri.id, 'harian')} className="space-y-4">
                              <div>
                                <label className="block text-[11px] font-bold text-gray-500 mb-1">Tanggal Kegiatan</label>
                                <input type="date" name="date" required defaultValue={new Date().toISOString().split('T')[0]} className="w-full p-2.5 border rounded-xl text-xs bg-gray-50 outline-none focus:border-emerald-500" />
                              </div>
                              <div className="flex flex-col sm:flex-row gap-3">
                                <div className="w-full sm:w-1/2">
                                  <label className="block text-[11px] font-bold text-gray-500 mb-1">Surah / Hal Buku</label>
                                  <input type="text" name="surah" placeholder="An-Naba / Hal 12" required className="w-full p-2.5 border rounded-xl text-xs bg-gray-50 outline-none focus:border-emerald-500" />
                                </div>
                                <div className="w-full sm:w-1/2">
                                  <label className="block text-[11px] font-bold text-gray-500 mb-1">Rentang Ayat / Baris</label>
                                  <input type="text" name="ayat" placeholder="Ayat 1-15 / Baris 1-6" required className="w-full p-2.5 border rounded-xl text-xs bg-gray-50 outline-none focus:border-emerald-500" />
                                </div>
                              </div>
                              <div>
                                <label className="block text-[11px] font-bold text-gray-500 mb-1">Predikat Kelancaran</label>
                                <select name="nilai" className="w-full p-2.5 border rounded-xl text-xs bg-gray-50 outline-none focus:border-emerald-500 font-bold text-gray-700" required>
                                  <option value="">-- Pilih Predikat --</option>
                                  <option value="A (Sangat Lancar)">A (Sangat Lancar)</option>
                                  <option value="B (Lancar)">B (Lancar)</option>
                                  <option value="C (Kurang Lancar)">C (Kurang Lancar)</option>
                                  <option value="D (Mengulang)">D (Mengulang)</option>
                                </select>
                              </div>
                              <button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-xl text-xs transition duration-200 shadow-md mt-2 flex justify-center items-center">
                                <Check size={16} className="mr-2" /> Simpan Progres Ngaji
                              </button>
                            </form>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {activeTab === 'nilai_target' && (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
           <h2 className="text-lg font-bold mb-3 flex items-center text-purple-800"><CheckSquare className="mr-2"/> Penilaian Target Kompetensi Jilid Santri</h2>
           <p className="text-xs text-gray-500 mb-6 leading-relaxed">Centang target kompetensi yang diatur oleh Kepala TPQ apabila santri bersangkutan telah menguasainya secara utuh.</p>
           
           {mySantri.length === 0 ? (
             <p className="text-xs text-gray-400 italic text-center py-6">Belum ada santri bimbingan.</p>
           ) : (
             <div className="space-y-6">
               {mySantri.map(s => {
                 const levelTargets = targets.filter(t => t.level === s.jilid);
                 return (
                   <div key={s.id} className="border border-purple-100 rounded-2xl p-4 bg-purple-50/20 shadow-xs">
                     <h3 className="font-bold text-gray-800 border-b pb-2 mb-3 flex justify-between items-center text-sm">
                       <span>{s.name} <span className="text-[10px] text-purple-600 bg-purple-50 px-2 py-0.5 rounded border ml-1.5 font-bold">{s.jilid}</span></span>
                       <span className="text-[11px] text-gray-500 font-bold">{levelTargets.filter(t => s.completedTargets?.includes(t.id)).length} dari {levelTargets.length} Selesai</span>
                     </h3>
                     {levelTargets.length === 0 ? (
                       <p className="text-xs text-gray-400 italic">Target kurikulum belum dibuat oleh Kepala TPQ untuk tingkatan {s.jilid}.</p>
                     ) : (
                       <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                         {levelTargets.map(t => {
                           const isCompleted = s.completedTargets?.includes(t.id);
                           return (
                             <label key={t.id} className="flex items-start bg-white p-3 rounded-xl border shadow-xs cursor-pointer hover:bg-purple-50/50 transition duration-200">
                               <input 
                                 type="checkbox" 
                                 checked={!!isCompleted} 
                                 onChange={() => handleCeklisTarget(s.id, t.id, !!isCompleted)}
                                 className="mt-1 mr-3 rounded text-purple-600 focus:ring-purple-500" 
                               />
                               <span className={`text-xs ${isCompleted ? 'text-gray-400 line-through' : 'text-gray-700 font-medium'}`}>{t.description}</span>
                             </label>
                           );
                         })}
                       </div>
                     )}
                   </div>
                 );
               })}
             </div>
           )}
        </div>
      )}

      {activeTab === 'pengajuan_kenaikan' && (
        <div className="space-y-6">
          <h2 className="text-lg font-bold flex items-center text-orange-800"><Award className="mr-2"/> Pengajuan Kenaikan Jilid / Kelompok Juz</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {mySantri.map(santri => {
              const levelTargets = targets.filter(t => t.level === santri.jilid);
              const completedCount = levelTargets.filter(t => santri.completedTargets?.includes(t.id)).length;
              const isEligible = levelTargets.length > 0 && completedCount === levelTargets.length;

              return (
                <div key={santri.id} className="bg-white rounded-2xl shadow-sm border border-orange-100 overflow-hidden">
                  <div className="bg-orange-50/60 p-4 border-b border-orange-100">
                    <h3 className="font-bold text-orange-950 text-sm">{santri.name}</h3>
                    <p className="text-[11px] font-bold text-orange-700">Tingkat Saat Ini: {santri.jilid}</p>
                  </div>
                  <div className="p-5">
                    <div className="bg-gray-50 p-3.5 rounded-xl border text-xs mb-4">
                      <p className="font-bold text-gray-700 flex justify-between">
                        <span>Pengecekan Kurikulum:</span>
                        <span className={isEligible ? 'text-emerald-600 font-extrabold' : 'text-red-500 font-extrabold'}>{completedCount}/{levelTargets.length} Kompetensi</span>
                      </p>
                      {levelTargets.length === 0 ? (
                        <p className="text-[10px] text-red-500 mt-1 italic font-semibold">Tabel target kompetensi kosong. Hubungi kepala TPQ.</p>
                      ) : !isEligible ? (
                        <p className="text-[10px] text-red-500 mt-1.5 flex items-center font-semibold"><AlertTriangle size={12} className="mr-1 flex-shrink-0"/> Tidak dapat diajukan: Santri belum menguasai seluruh indikator jilid ini.</p>
                      ) : (
                        <p className="text-[10px] text-emerald-600 mt-1.5 flex items-center font-bold"><CheckCircle size={12} className="mr-1 flex-shrink-0"/> Berhasil: Syarat kompetensi terpenuhi. Formulir pengajuan aktif.</p>
                      )}
                    </div>

                    <form onSubmit={(e) => submitProgress(e, santri.id, 'kenaikan')} className="space-y-4">
                      <div>
                        <label className="block text-[11px] font-bold text-gray-500 mb-1">Tanggal Pengajuan Ujian</label>
                        <input type="date" name="date" required defaultValue={new Date().toISOString().split('T')[0]} className="w-full p-2.5 border rounded-xl text-xs bg-orange-50/10 focus:border-orange-500 outline-none" />
                      </div>
                      <div className="flex space-x-3">
                        <div className="w-1/2">
                          <label className="block text-[11px] font-bold text-gray-500 mb-1">Surah / Juz Terakhir</label>
                          <input type="text" name="surah" placeholder="Al-Baqarah / Juz 30" required disabled={!isEligible} className="w-full p-2.5 border rounded-xl text-xs bg-gray-50 focus:border-orange-500 outline-none disabled:opacity-40 font-bold text-gray-800" />
                        </div>
                        <div className="w-1/2">
                          <label className="block text-[11px] font-bold text-gray-500 mb-1">Ayat / Baris Terakhir</label>
                          <input type="text" name="ayat" placeholder="Ayat 286 / Baris 8" required disabled={!isEligible} className="w-full p-2.5 border rounded-xl text-xs bg-gray-50 focus:border-orange-500 outline-none disabled:opacity-40 font-bold text-gray-800" />
                        </div>
                      </div>
                      <input type="hidden" name="nilai" value="Menunggu Evaluasi Kepala" />
                      <button 
                        type="submit" 
                        disabled={!isEligible}
                        className="w-full bg-orange-500 text-white font-bold py-2.5 rounded-xl text-xs hover:bg-orange-600 transition duration-200 shadow disabled:opacity-30 disabled:cursor-not-allowed"
                      >
                        Ajukan Kenaikan Jilid ke Kepala TPQ
                      </button>
                    </form>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function BendaharaView({ activeTab, setActiveTab, users, updateTable, showToast }) {

  const toggleAlarm = (santriId, currentStatus) => {
    const updatedUsers = users.map(u => u.id === santriId ? { ...u, hasAlarm: !currentStatus } : u);
    updateTable('users', updatedUsers);
    showToast(currentStatus ? 'Alarm peringatan dinonaktifkan.' : 'Alarm tagihan dikirim ke dashboard santri!');
  };

  const handleBayar = (e, santriId) => {
    e.preventDefault();
    const payDate = e.target.tanggal.value;
    
    const updatedUsers = users.map(u => {
      if (u.id === santriId) {
        const history = u.historyBayar || [];
        return { 
          ...u, 
          hasAlarm: false, 
          historyBayar: [...history, payDate] 
        };
      }
      return u;
    });

    updateTable('users', updatedUsers);
    showToast('Pembayaran syahriah santri berhasil dicatat!');
    e.target.reset();
  };

  const santriList = users.filter(u => u.role === 'santri');
  const countSantri = santriList.length;

  const currentYearMonth = new Date().toISOString().substring(0, 7); 
  const paidCount = santriList.filter(s => s.historyBayar?.some(d => d.startsWith(currentYearMonth))).length;
  const unpaidCount = countSantri - paidCount;

  const teachersCount = users.filter(u => u.role === 'guru').length;
  const kepalaCount = users.filter(u => u.role === 'kepala_tpq').length;
  const totalStaffToPay = teachersCount + kepalaCount;

  if (activeTab === 'dashboard') {
    return (
      <div className="space-y-8 animate-fade-in animate-duration-300">
        <h2 className="text-xl font-black text-gray-800">Keuangan & Syahriah Bendahara</h2>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center">
            <div className="bg-blue-100 p-3.5 rounded-xl mr-4 text-blue-600"><Users size={24}/></div>
            <div>
              <p className="text-gray-400 text-xs font-bold uppercase tracking-wider">Total Santri</p>
              <h3 className="text-2xl font-black text-gray-800">{countSantri} Anak</h3>
            </div>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center">
            <div className="bg-emerald-100 p-3.5 rounded-xl mr-4 text-emerald-600"><CheckCircle size={24}/></div>
            <div>
              <p className="text-gray-400 text-xs font-bold uppercase tracking-wider">Lunas Syahriah</p>
              <h3 className="text-2xl font-black text-gray-800">{paidCount} <span className="text-[10px] font-semibold text-gray-400">Anak</span></h3>
            </div>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center">
            <div className="bg-red-100 p-3.5 rounded-xl mr-4 text-red-600"><Bell size={24}/></div>
            <div>
              <p className="text-gray-400 text-xs font-bold uppercase tracking-wider">Belum Bayar</p>
              <h3 className="text-2xl font-black text-gray-800">{unpaidCount} <span className="text-[10px] font-semibold text-gray-400">Anak</span></h3>
            </div>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center">
            <div className="bg-purple-100 p-3.5 rounded-xl mr-4 text-purple-600"><DollarSign size={24}/></div>
            <div>
              <p className="text-gray-400 text-xs font-bold uppercase tracking-wider">Staff Layak Gaji</p>
              <h3 className="text-2xl font-black text-gray-800">{totalStaffToPay} <span className="text-[10px] font-semibold text-gray-400">Orang</span></h3>
            </div>
          </div>
        </div>

        <MenuGrid menus={[
          { id: 'kelola_syahriah', label: 'Kelola Syahriah & Peringatan', icon: CreditCard, color: 'bg-yellow-100 text-yellow-600', desc: 'Atur pencatatan iuran bulanan santri, kelompokkan berdasarkan guru kelas, dan aktifkan alarm.' }
        ]} onSelect={setActiveTab} />
      </div>
    );
  }

  const guruList = users.filter(u => u.role === 'guru' || u.role === 'kepala_tpq');
  const groupedSantri = guruList.map(guru => ({
    guruName: guru.name,
    santris: santriList.filter(s => s.guruId === guru.id)
  })).filter(g => g.santris.length > 0);

  const unassignedSantri = santriList.filter(s => !s.guruId);
  if (unassignedSantri.length > 0) {
    groupedSantri.push({ guruName: 'Belum Memiliki Guru Kelas', santris: unassignedSantri });
  }

  return (
    <div className="animate-fade-in animate-duration-300">
      <BackButton onClick={() => setActiveTab('dashboard')} />
      
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
          <h2 className="text-lg font-bold flex items-center text-gray-800"><CreditCard className="mr-2 text-emerald-600"/> Monitor Pembayaran Syahriah (Berdasarkan Wali Kelas)</h2>
          <div className="bg-amber-50 text-amber-800 border border-amber-100 px-4 py-2.5 rounded-xl text-xs flex items-center font-semibold mt-4 md:mt-0 max-w-md shadow-sm">
            <Info size={16} className="mr-2 flex-shrink-0" /> Tekan tombol alarm untuk memperingatkan santri yang menunggak iuran bulanan setelah tanggal 10.
          </div>
        </div>

        <div className="space-y-8">
          {groupedSantri.map((group, idx) => (
            <div key={idx} className="border border-gray-100 rounded-2xl overflow-hidden shadow-sm">
              <div className="bg-emerald-50/50 border-b px-4 py-3 font-bold text-emerald-950 flex items-center justify-between text-xs sm:text-sm">
                <span className="flex items-center"><Users size={16} className="mr-2 text-emerald-600"/> Wali Kelas: {group.guruName}</span>
                <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2.5 py-1 rounded-full font-bold">{group.santris.length} Santri</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50 text-gray-500 text-[10px] font-bold uppercase border-b">
                      <th className="p-4">Nama & Jilid</th>
                      <th className="p-4 text-center">Status Syahriah</th>
                      <th className="p-4 text-center">Entri Pembayaran</th>
                      <th className="p-4 text-center">Peringatan Tagihan</th>
                    </tr>
                  </thead>
                  <tbody>
                    {group.santris.map(santri => {
                      const hasPaidThisMonth = santri.historyBayar?.some(d => d.startsWith(currentYearMonth));
                      return (
                        <tr key={santri.id} className="border-b hover:bg-gray-50 text-xs transition duration-150">
                          <td className="p-4">
                            <p className="font-bold text-gray-800">{santri.name}</p>
                            <span className="text-[9px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded border font-semibold">{santri.jilid}</span>
                          </td>
                          <td className="p-4 text-center">
                            {hasPaidThisMonth ? (
                              <span className="bg-emerald-100 text-emerald-800 px-2.5 py-1 rounded-full text-[10px] font-bold inline-flex items-center"><CheckCircle size={11} className="mr-1"/> Lunas</span>
                            ) : santri.hasAlarm ? (
                              <span className="bg-red-100 text-red-800 px-2.5 py-1 rounded-full text-[10px] font-bold inline-flex items-center animate-pulse"><Bell size={11} className="mr-1"/> Alarm Berbunyi</span>
                            ) : (
                              <span className="bg-gray-100 text-gray-600 px-2.5 py-1 rounded-full text-[10px] font-semibold inline-flex items-center">Belum Bayar</span>
                            )}
                          </td>
                          <td className="p-4">
                            <form onSubmit={(e) => handleBayar(e, santri.id)} className="flex items-center justify-center space-x-2">
                              <input type="date" name="tanggal" required defaultValue={new Date().toISOString().split('T')[0]} className="p-1.5 border rounded-lg text-[11px] bg-gray-50 outline-none w-28 focus:border-emerald-500 font-medium text-gray-800" />
                              <button type="submit" className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-lg text-[10px] font-bold transition">Bayar</button>
                            </form>
                          </td>
                          <td className="p-4 text-center">
                            <button 
                              onClick={() => toggleAlarm(santri.id, santri.hasAlarm)}
                              className={`px-3 py-1.5 rounded-lg text-[10px] font-bold text-white transition w-32 flex justify-center items-center mx-auto ${santri.hasAlarm ? 'bg-gray-500 hover:bg-gray-600' : 'bg-red-600 hover:bg-red-700'}`}
                            >
                              {santri.hasAlarm ? 'Matikan Alarm' : <><Bell size={11} className="mr-1" /> Bunyikan Alarm</>}
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function KepalaView({ activeTab, setActiveTab, user, users, progress, targets, settings, updateTable, showToast, simulatedWeekend, setSimulatedWeekend }) {

  const handleAccKenaikan = (progressId, santriId) => {
    const santri = users.find(u => u.id === santriId);
    if (!santri) return;

    const updatedProgress = progress.map(p => p.id === progressId ? { ...p, status: 'acc_kepala' } : p);
    updateTable('progress', updatedProgress);
    
    const currentJilidIdx = JILID_LEVELS.indexOf(santri.jilid);
    const nextJid = JILID_LEVELS[currentJilidIdx + 1] || 'Lulus (Tamat)';
    
    const updatedUsers = users.map(u => u.id === santriId ? { ...u, jilid: nextJid, completedTargets: [] } : u);
    updateTable('users', updatedUsers);
    
    showToast(`Ujian disetujui! Santri berhasil naik ke tingkat ${nextJid}`);
  };

  const handleEditJilid = (santriId, newJilid) => {
    const updatedUsers = users.map(u => 
      u.id === santriId ? { ...u, jilid: newJilid, completedTargets: [] } : u
    );
    updateTable('users', updatedUsers);
    showToast(`Tingkat/Jilid santri berhasil diubah secara manual menjadi ${newJilid}`);
  };

  const handleAddTarget = (e) => {
    e.preventDefault();
    const newTarget = {
      id: Date.now().toString(),
      level: e.target.level.value,
      description: e.target.description.value
    };
    const updated = [...targets, newTarget];
    updateTable('targets', updated);
    showToast('Target kurikulum baru berhasil ditambahkan!');
    e.target.reset();
  };

  const deleteTarget = (id) => {
    const updated = targets.filter(t => t.id !== id);
    updateTable('targets', updated);
    showToast('Target kurikulum berhasil dihapus!');
  };

  const menus = [
    { id: 'acc_kenaikan', label: 'ACC Kenaikan Tingkat', icon: Award, color: 'bg-orange-100 text-orange-600', desc: 'Uji & ACC pengajuan naik jilid/kelompok juz dari guru.' },
    { id: 'target_jilid', label: 'Kurikulum Target TPQ', icon: Book, color: 'bg-blue-100 text-blue-600', desc: 'Atur kurikulum target tiap jilid, Al-Quran, hingga hafalan per juz.' },
    { id: 'kelola_santri', label: 'Kelola Data Santri', icon: Users, color: 'bg-teal-100 text-teal-600', desc: 'Ubah tingkat jilid/PSQ santri secara manual tanpa pengajuan.' },
    { id: 'guru_progres', label: 'Input Progres Harian (Guru)', icon: ClipboardList, color: 'bg-emerald-100 text-emerald-600', desc: 'Masuk mode pengajar untuk menginput setoran mengaji harian.' },
    { id: 'guru_klaim', label: 'Klaim Kelas Santri (Guru)', icon: UserPlus, color: 'bg-indigo-100 text-indigo-600', desc: 'Klaim & alokasikan santri bimbingan baru ke kelas Anda.' },
    { id: 'kelola_syahriah', label: 'Syahriah Keuangan', icon: CreditCard, color: 'bg-yellow-100 text-yellow-600', desc: 'Akses penuh untuk memantau iuran bulanan & membunyikan alarm tagihan.' },
    { id: 'hak_akses', label: 'Manajemen Hak Akses', icon: Shield, color: 'bg-purple-100 text-purple-800', desc: 'Atur kredensial, hapus akun, reset sandi, dan tambahkan akun baru.' },
    { id: 'pengaturan', label: 'Profil & Logo TPQ', icon: Settings, color: 'bg-gray-100 text-gray-700', desc: 'Ubah identitas nama instansi pendidikan TPQ, Google Sheet URL & Logo.' }
  ];

  if (activeTab === 'dashboard') {
    return (
      <div>
        <h2 className="text-xl font-black text-gray-800 mb-6 animate-fade-in animate-duration-300">Administrasi Kepala TPQ: {user.name}</h2>
        <MenuGrid menus={menus} onSelect={setActiveTab} />
      </div>
    );
  }

  if (activeTab === 'guru_progres' || activeTab === 'guru_klaim') {
    const mappedTab = activeTab === 'guru_progres' ? 'isi_progres' : 'klaim_santri';
    return <GuruView activeTab={mappedTab} setActiveTab={setActiveTab} user={user} users={users} progress={progress} targets={targets} updateTable={updateTable} showToast={showToast} simulatedWeekend={simulatedWeekend} setSimulatedWeekend={setSimulatedWeekend} />;
  }

  if (activeTab === 'kelola_syahriah') {
    return <BendaharaView activeTab="kelola_syahriah" setActiveTab={setActiveTab} users={users} updateTable={updateTable} showToast={showToast} />;
  }

  if (activeTab === 'hak_akses') {
    return <AdminView activeTab="hak_akses" setActiveTab={setActiveTab} users={users} updateTable={updateTable} showToast={showToast} settings={settings} />;
  }

  if (activeTab === 'pengaturan') {
    return <AdminView activeTab="pengaturan" setActiveTab={setActiveTab} users={users} updateTable={updateTable} showToast={showToast} settings={settings} />;
  }

  if (activeTab === 'kelola_santri') {
    const santriList = users.filter(u => u.role === 'santri');
    return (
      <div className="animate-fade-in animate-duration-300">
        <BackButton onClick={() => setActiveTab('dashboard')} />
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <h2 className="text-lg font-bold mb-6 flex items-center text-teal-800"><Users className="mr-2"/> Kelola Jilid / Tingkat Santri Manual</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-teal-50 text-teal-900 text-xs font-bold uppercase border-b border-teal-100">
                  <th className="p-4 rounded-tl-xl">Nama Santri</th>
                  <th className="p-4">Wali Kelas</th>
                  <th className="p-4 rounded-tr-xl">Tingkat / Jilid Saat Ini</th>
                </tr>
              </thead>
              <tbody>
                {santriList.length === 0 ? (
                  <tr>
                    <td colSpan="3" className="p-8 text-center text-gray-500 text-sm">Belum ada data santri.</td>
                  </tr>
                ) : (
                  santriList.map(santri => {
                    const guru = users.find(u => u.id === santri.guruId);
                    return (
                      <tr key={santri.id} className="border-b hover:bg-gray-50 text-xs transition">
                        <td className="p-4 font-bold text-gray-800">{santri.name}</td>
                        <td className="p-4 text-gray-600">{guru ? guru.name : '-'}</td>
                        <td className="p-4">
                          <select 
                            value={santri.jilid}
                            onChange={(e) => handleEditJilid(santri.id, e.target.value)}
                            className="p-2.5 border rounded-xl bg-white font-bold outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-200 text-xs text-gray-700 shadow-sm min-w-[200px]"
                          >
                            {JILID_LEVELS.map(j => <option key={j} value={j}>{j}</option>)}
                          </select>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  if (activeTab === 'acc_kenaikan') {
    const pendingRequests = progress.filter(p => p.type === 'kenaikan' && p.status === 'pending');
    return (
      <div className="animate-fade-in animate-duration-300">
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
                const s = users.find(u => u.id === req.santriId);
                const g = users.find(u => u.id === s?.guruId);
                return (
                  <div key={req.id} className="border border-orange-200 bg-orange-50/50 p-5 rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center shadow-sm animate-fade-in">
                    <div>
                      <h3 className="font-extrabold text-base text-orange-950">{s?.name}</h3>
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
      <div className="animate-fade-in animate-duration-300">
        <BackButton onClick={() => setActiveTab('dashboard')} />
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <h2 className="text-lg font-bold mb-6 flex items-center text-blue-800"><Book className="mr-2"/> Kelola Target Kompetensi Jilid & Juz (Kurikulum)</h2>
          
          <form onSubmit={handleAddTarget} className="flex flex-col md:flex-row gap-3 mb-8 bg-gray-50 p-4 rounded-2xl border border-gray-200">
            <select name="level" className="p-3 border rounded-xl bg-white font-bold outline-none focus:border-blue-500 md:w-1/4 text-xs text-gray-700" required>
              {JILID_LEVELS.map(j => <option key={j} value={j}>{j}</option>)}
            </select>
            <input type="text" name="description" placeholder="Kompetensi target (Misal: Lancar hafal Juz 30 s.d An-Nas)..." className="flex-1 p-3 border rounded-xl outline-none focus:border-blue-500 text-xs bg-white text-gray-800" required />
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
                      <li key={t.id} className="flex justify-between items-start bg-white p-3 rounded-xl border shadow-sm gap-3">
                        <span className="text-xs text-gray-700 leading-relaxed font-medium">{t.description}</span>
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

function AdminView({ activeTab, setActiveTab, users, updateTable, showToast, settings }) {
  const [showPasswordMap, setShowPasswordMap] = useState({});
  const [resettingUser, setResettingUser] = useState(null);
  const [newPasswordVal, setNewPasswordVal] = useState('');
  const [deletingUser, setDeletingUser] = useState(null);
  const [showScriptModal, setShowScriptModal] = useState(false);

  const togglePasswordVisibility = (id) => {
    setShowPasswordMap(prev => ({ ...prev, [id] : !prev[id] }));
  };

  const triggerResetDialog = (userObj) => {
    setResettingUser(userObj);
    setNewPasswordVal('');
  };

  const submitResetPassword = () => {
    if (!newPasswordVal.trim()) {
      showToast('Sandi baru tidak boleh kosong!', 'error');
      return;
    }
    const updated = users.map(user => user.id === resettingUser.id ? { ...user, password: newPasswordVal.trim() } : user);
    updateTable('users', updated);
    showToast(`Password untuk ${resettingUser.name} berhasil diubah.`);
    setResettingUser(null);
  };

  const triggerDeleteDialog = (userObj) => {
    setDeletingUser(userObj);
  };

  const confirmDeleteUser = () => {
    const updated = users.filter(u => u.id !== deletingUser.id);
    updateTable('users', updated);
    showToast('Akun telah berhasil dihapus secara permanen.');
    setDeletingUser(null);
  };

  const handleAddUser = (e) => {
    e.preventDefault();
    const role = e.target.role.value;

    const newUser = {
      id: Date.now().toString(),
      username: e.target.username.value.trim().toLowerCase(),
      password: e.target.password.value,
      role: role,
      name: e.target.name.value,
      guruId: null,
      jilid: role === 'santri' ? 'Jilid 1' : undefined,
      hasAlarm: false,
      lastAccDate: '',
      completedTargets: [],
      historyBayar: []
    };

    const isExist = users.some(u => u.username === newUser.username);
    if (isExist) {
      showToast('Username sudah dipakai! Silakan pilih username unik.', 'error');
      return;
    }

    const updated = [...users, newUser];
    updateTable('users', updated);
    showToast('Akun pengguna baru berhasil ditambahkan!');
    e.target.reset();
  };

  const handleSaveSettings = (e) => {
    e.preventDefault();
    const updated = {
      ...settings,
      tpqName: e.target.tpqName.value,
      logoUrl: e.target.logoUrl.value
    };
    updateTable('settings', updated);
    showToast('Profil lembaga berhasil diperbarui!');
  };

  const codeScriptGoogle = `// CODE GOOGLE APPS SCRIPT UNTUK DATABASE GOOGLE SHEETS
function doGet(e) {
  var action = e.parameter.action;
  var sheet = SpreadsheetApp.getActiveSpreadsheet();
  
  if (action === "getAll") {
    var data = {};
    var sheets = ["users", "progress", "targets", "settings"];
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
              try {
                obj[h] = JSON.parse(row[idx]);
              } catch(err) {
                obj[h] = row[idx];
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
      data.settings = { tpqName: "TPQ Al-Hikmah Modern", logoUrl: "", appsScriptUrl: "" };
    }
    return ContentService.createTextOutput(JSON.stringify({status: "success", data: data}))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function doPost(e) {
  var postData = JSON.parse(e.postData.contents);
  var table = postData.table;
  var data = postData.data;
  
  var sheet = SpreadsheetApp.getActiveSpreadsheet();
  var s = sheet.getSheetByName(table);
  if (!s) {
    s = sheet.insertSheet(table);
  }
  s.clear();
  
  if (table === "settings") {
    data = [data];
  }
  
  if (data.length > 0) {
    var keys = Object.keys(data[0]);
    s.appendRow(keys);
    data.forEach(function(item) {
      var row = keys.map(function(k) {
        var val = item[k];
        return (typeof val === "object" && val !== null) ? JSON.stringify(val) : val;
      });
      s.appendRow(row);
    });
  }
  return ContentService.createTextOutput(JSON.stringify({status: "success"}))
    .setMimeType(ContentService.MimeType.JSON);
}`;

  const copyScriptToClipboard = () => {
    navigator.clipboard.writeText(codeScriptGoogle);
    showToast('Script berhasil disalin ke papan klip!');
  };

  const menus = [
    { id: 'pengaturan', label: 'Profil & Database Sheets', icon: Settings, color: 'bg-gray-100 text-gray-700', desc: 'Atur nama lembaga, tautan Logo Gambar, dan Integrasi Database Google Sheets.' },
    { id: 'hak_akses', label: 'Kelola Hak Akses', icon: Shield, color: 'bg-purple-100 text-purple-700', desc: 'Atur hak akses, tambahkan user baru, reset password login, dan hapus akun.' }
  ];

  if (activeTab === 'dashboard') {
    return (
      <div>
        <h2 className="text-xl font-black text-gray-800 mb-6 animate-fade-in animate-duration-300">Control Panel Admin Utama</h2>
        <MenuGrid menus={menus} onSelect={setActiveTab} />
      </div>
    );
  }

  if (activeTab === 'pengaturan') {
    return (
      <div className="animate-fade-in animate-duration-300 space-y-6">
        <BackButton onClick={() => setActiveTab('dashboard')} />
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
            <div>
              <h2 className="text-lg font-bold flex items-center text-gray-700"><Settings className="mr-2"/> Pengaturan Lembaga & Database</h2>
              <p className="text-xs text-gray-500 mt-1">URL Google Apps Script Anda saat ini dikonfigurasi melalui kode sumber (Hardcoded) untuk keamanan.</p>
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
                <pre className="p-6 overflow-y-auto flex-1 bg-gray-900 text-gray-100 font-mono text-xs rounded-b-xl whitespace-pre">
                  {codeScriptGoogle}
                </pre>
                <div className="p-4 border-t bg-gray-50 flex justify-between items-center rounded-b-3xl">
                  <span className="text-[11px] text-gray-500 font-semibold">Deploy script sebagai Web App (Akses: Anyone)</span>
                  <div className="flex space-x-2">
                    <button onClick={copyScriptToClipboard} className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-4 py-2 rounded-xl flex items-center transition">
                      <Copy size={14} className="mr-1.5"/> Salin Script
                    </button>
                    <button onClick={() => setShowScriptModal(false)} className="bg-gray-200 text-gray-700 hover:bg-gray-300 text-xs font-bold px-4 py-2 rounded-xl transition">
                      Tutup
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          <form onSubmit={handleSaveSettings} className="space-y-4 max-w-xl">
            <div>
              <label className="block text-xs font-bold mb-1 text-gray-500">Nama Lembaga TPQ</label>
              <input type="text" name="tpqName" defaultValue={settings?.tpqName} required className="w-full p-2.5 border rounded-xl outline-none focus:border-emerald-500 text-xs text-gray-800" />
            </div>
            <div>
              <label className="block text-xs font-bold mb-1 text-gray-500">URL Gambar Logo (Tautan Online)</label>
              <input type="url" name="logoUrl" defaultValue={settings?.logoUrl} className="w-full p-2.5 border rounded-xl outline-none focus:border-emerald-500 text-xs text-gray-800" placeholder="https://domain.com/logo-anda.png" />
            </div>
            <button type="submit" className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-xl font-bold text-xs shadow-sm transition">Simpan Perubahan</button>
          </form>
        </div>
      </div>
    );
  }

  if (activeTab === 'hak_akses') {
    return (
      <div className="animate-fade-in animate-duration-300 space-y-6">
        <BackButton onClick={() => setActiveTab('dashboard')} />
        
        {resettingUser && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 animate-fade-in">
            <div className="bg-white p-6 rounded-2xl shadow-xl w-full max-w-sm border">
              <h3 className="font-bold text-gray-800 text-base mb-2">Reset Password</h3>
              <p className="text-xs text-gray-500 mb-4">Ubah kata sandi login untuk akun <strong>{resettingUser.name}</strong></p>
              <input 
                type="text" 
                value={newPasswordVal} 
                onChange={(e) => setNewPasswordVal(e.target.value)} 
                placeholder="Kata Sandi Baru..." 
                className="w-full p-2.5 border rounded-xl text-xs bg-gray-50 outline-none mb-4 focus:border-purple-500 font-bold text-gray-800"
              />
              <div className="flex justify-end space-x-2">
                <button onClick={() => setResettingUser(null)} className="bg-gray-100 hover:bg-gray-200 text-gray-600 text-xs font-bold px-4 py-2 rounded-xl transition">Batal</button>
                <button onClick={submitResetPassword} className="bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold px-4 py-2 rounded-xl transition">Simpan</button>
              </div>
            </div>
          </div>
        )}

        {deletingUser && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 animate-fade-in">
            <div className="bg-white p-6 rounded-2xl shadow-xl w-full max-w-sm border">
              <h3 className="font-bold text-red-800 text-base mb-2">Hapus Pengguna</h3>
              <p className="text-xs text-gray-500 mb-4">Apakah Anda yakin ingin menghapus akun milik <strong>{deletingUser.name}</strong> ({deletingUser.username}) secara permanen?</p>
              <div className="flex justify-end space-x-2">
                <button onClick={() => setDeletingUser(null)} className="bg-gray-100 hover:bg-gray-200 text-gray-600 text-xs font-bold px-4 py-2 rounded-xl transition">Batal</button>
                <button onClick={confirmDeleteUser} className="bg-red-600 hover:bg-red-700 text-white text-xs font-bold px-4 py-2 rounded-xl transition">Ya, Hapus</button>
              </div>
            </div>
          </div>
        )}

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <h2 className="text-lg font-bold mb-4 flex items-center text-purple-800"><UserPlus className="mr-2"/> Daftarkan Akun Pengguna Baru</h2>
          <form onSubmit={handleAddUser} className="bg-gray-50 p-5 rounded-2xl border border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
              <div>
                <label className="block text-[11px] font-bold text-gray-600 mb-1">Nama Lengkap</label>
                <input type="text" name="name" placeholder="Ahmad Zaki" required className="p-2.5 w-full border rounded-xl focus:border-purple-500 outline-none text-xs bg-white font-bold text-gray-800" />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-gray-600 mb-1">Username Login</label>
                <input type="text" name="username" placeholder="zaki12" required className="p-2.5 w-full border rounded-xl focus:border-purple-500 outline-none text-xs bg-white font-bold text-gray-800" />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-gray-600 mb-1">Kata Sandi Awal</label>
                <input type="text" name="password" placeholder="12345" required className="p-2.5 w-full border rounded-xl focus:border-purple-500 outline-none text-xs bg-white font-bold text-gray-800" />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-gray-600 mb-1">Hak Akses Peran (Role)</label>
                <select name="role" required className="p-2.5 w-full border rounded-xl focus:border-purple-500 outline-none font-bold text-gray-700 text-xs bg-white">
                  <option value="santri">Santri / Wali</option>
                  <option value="guru">Guru Ngaji</option>
                  <option value="bendahara">Bendahara</option>
                  <option value="kepala_tpq">Kepala TPQ</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
            </div>
            <button type="submit" className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-2.5 rounded-xl shadow-sm text-xs transition duration-200">
               Buat Akun
            </button>
          </form>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 overflow-x-auto">
          <h2 className="text-lg font-bold mb-4 flex items-center text-purple-800"><Shield className="mr-2"/> Kelola Kredensial Pengguna</h2>
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-purple-50 text-purple-950 border-b border-purple-100 font-bold uppercase text-[10px]">
                <th className="p-4 rounded-tl-xl">Nama Pengguna & Peran</th>
                <th className="p-4">Username Login</th>
                <th className="p-4">Kata Sandi</th>
                <th className="p-4 text-center rounded-tr-xl">Aksi Manajemen</th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id} className="border-b hover:bg-gray-50 text-xs transition">
                  <td className="p-4">
                    <p className="font-bold text-gray-800">{u.name}</p>
                    <span className={`mt-1 inline-block px-2 py-0.5 rounded text-[9px] font-extrabold uppercase tracking-wider border ${
                      u.role === 'admin' ? 'bg-purple-50 text-purple-700 border-purple-200' :
                      u.role === 'kepala_tpq' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                      u.role === 'guru' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                      u.role === 'bendahara' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' :
                      'bg-gray-50 text-gray-600 border-gray-200'
                    }`}>
                      {u.role ? u.role.replace('_', ' ') : ''}
                    </span>
                  </td>
                  <td className="p-4 font-mono font-bold text-gray-600">{u.username}</td>
                  <td className="p-4">
                    <div className="flex items-center space-x-2">
                      <span className="font-mono bg-gray-50 px-2 py-1 rounded border text-xs min-w-[80px] text-center font-bold text-gray-700">
                        {showPasswordMap[u.id] ? u.password : '••••••••'}
                      </span>
                      <button onClick={() => togglePasswordVisibility(u.id)} className="text-gray-400 hover:text-purple-600 p-1" title="Lihat Sandi">
                        {showPasswordMap[u.id] ? <EyeOff size={15}/> : <Eye size={15}/>}
                      </button>
                    </div>
                  </td>
                  <td className="p-4 text-center">
                    <div className="flex justify-center gap-2">
                      <button onClick={() => triggerResetDialog(u)} className="bg-white border border-purple-200 text-purple-600 hover:bg-purple-50 text-xs font-bold px-3 py-1.5 rounded-lg flex items-center transition shadow-sm">
                        <Edit size={12} className="mr-1"/> Sandi
                      </button>
                      <button onClick={() => triggerDeleteDialog(u)} className="bg-red-50 hover:bg-red-100 border border-red-200 text-red-600 text-xs font-bold px-3 py-1.5 rounded-lg flex items-center transition shadow-sm">
                        <Trash2 size={12} className="mr-1"/> Hapus
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  return null;
}
