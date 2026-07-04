import React, { useState, useEffect } from 'react';
import { 
  Lock, 
  User, 
  Users, 
  Check, 
  Database, 
  Search, 
  LogOut, 
  AlertTriangle, 
  Calendar, 
  TrendingUp, 
  ShieldAlert,
  Download,
  CheckCircle2,
  RefreshCw,
  Mail,
  Phone,
  Layers
} from 'lucide-react';
import { fetchRegistrations, seedRegistrations } from '../utils/supabase';
import { Post, AppLanguage } from '../types';
import { getTranslation } from '../utils/translate';

interface AdminPanelProps {
  posts: Post[];
  lang: AppLanguage;
  theme: 'light' | 'dark';
  onClose: () => void;
}

export default function AdminPanel({ posts, lang, theme, onClose }: AdminPanelProps) {
  // Admin Authentication State
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);
  const [adminUsername, setAdminUsername] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [isSignupSlotAvailable, setIsSignupSlotAvailable] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);
  
  // Registration Data from Supabase
  const [registrations, setRegistrations] = useState<any[]>([]);
  const [isLoadingRegs, setIsLoadingRegs] = useState(false);
  const [regsError, setRegsError] = useState<string | null>(null);
  const [regTableSource, setRegTableSource] = useState<string>('');

  // Filtering & View details
  const [regSearchQuery, setRegSearchQuery] = useState('');
  const [selectedRoleFilter, setSelectedRoleFilter] = useState<string>('All');
  const [viewDetailReg, setViewDetailReg] = useState<any | null>(null);

  // Active Admin Tab
  const [adminActiveTab, setAdminActiveTab] = useState<'bookings' | 'reports'>('bookings');

  // Supabase live sync states
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  // Sync / seed high quality realistic registrations directly into Supabase
  const handleSyncLiveRegistrations = async () => {
    setIsSyncing(true);
    setSyncMessage(null);
    try {
      const recordsToSeed = [
        {
          username: 'suhani_anand',
          contact: 'suhanianand2005@gmail.com',
          role: 'Municipal Officer',
          email: 'suhanianand2005@gmail.com',
          phone: '+91 94481 00234'
        },
        {
          username: 'rahul_bengaluru',
          contact: '+91 98801 23456',
          role: 'Citizen',
          email: 'rahul_bengaluru@gmail.com',
          phone: '+91 98801 23456'
        },
        {
          username: 'karnataka_ngo',
          contact: 'contact@ecowatchkarnataka.org',
          role: 'NGO Coordinator',
          email: 'contact@ecowatchkarnataka.org',
          phone: '+91 80234 56789'
        },
        {
          username: 'priya_mumbai',
          contact: 'priya@mumbai.gov.in',
          role: 'Municipal Officer',
          email: 'priya@mumbai.gov.in',
          phone: '+91 22123 45678'
        },
        {
          username: 'amit_pothole_patrol',
          contact: 'amit@potholepatrol.org',
          role: 'NGO Coordinator',
          email: 'amit@potholepatrol.org',
          phone: '+91 99999 88888'
        }
      ];

      const res = await seedRegistrations(recordsToSeed);
      if (res && res.success) {
        setSyncMessage({
          type: 'success',
          text: `🎉 Live Sync Successful! ${recordsToSeed.length} registration records have been successfully saved to your Supabase '${res.table}' table.`
        });
        // Reload registrations from Supabase to update UI
        await loadRegistrations();
      }
    } catch (err: any) {
      console.error(err);
      setSyncMessage({
        type: 'error',
        text: `Sync Failed: ${err.message || 'Table not detected yet.'} Please ensure you created either a 'registrations' or 'users' table in your Supabase dashboard first.`
      });
    } finally {
      setIsSyncing(false);
    }
  };

  // Load and check if an admin account is already registered
  useEffect(() => {
    const isRegistered = localStorage.getItem('civiclens_admin_registered') === 'true';
    setIsSignupSlotAvailable(!isRegistered);

    const loggedInUser = sessionStorage.getItem('civiclens_admin_logged_in');
    if (loggedInUser === 'true') {
      setIsAdminLoggedIn(true);
      loadRegistrations();
    }
  }, []);

  // Fetch registrations/bookings from Supabase
  const loadRegistrations = async () => {
    setIsLoadingRegs(true);
    setRegsError(null);
    try {
      const res = await fetchRegistrations();
      if (res && res.data) {
        setRegistrations(res.data);
        setRegTableSource(res.table || 'registrations');
      }
    } catch (err: any) {
      console.warn("Supabase fetch failed, will use fallback simulation data", err.message);
      setRegsError(err.message || 'Supabase table not detected.');
      
      // Seed fallback sample bookings if Supabase is not ready yet
      const fallback = [
        {
          id: 'fb-1',
          username: 'suhani_anand',
          contact: 'suhanianand2005@gmail.com',
          role: 'Municipal Officer',
          email: 'suhanianand2005@gmail.com',
          phone: '+91 94481 00234',
          created_at: new Date(Date.now() - 3600000 * 2).toISOString()
        },
        {
          id: 'fb-2',
          username: 'rahul_bengaluru',
          contact: '+91 98801 23456',
          role: 'Citizen',
          email: 'rahul_bengaluru@gmail.com',
          phone: '+91 98801 23456',
          created_at: new Date(Date.now() - 3600000 * 24).toISOString()
        },
        {
          id: 'fb-3',
          username: 'karnataka_ngo',
          contact: 'contact@ecowatchkarnataka.org',
          role: 'NGO Coordinator',
          email: 'contact@ecowatchkarnataka.org',
          phone: '+91 80234 56789',
          created_at: new Date(Date.now() - 3600000 * 48).toISOString()
        }
      ];
      setRegistrations(fallback);
      setRegTableSource('Demo Simulator Local Cache');
    } finally {
      setIsLoadingRegs(false);
    }
  };

  // Sign up the Admin (using the single available slot)
  const handleAdminSignup = (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminUsername.trim() || !adminPassword.trim()) {
      setAuthError('Please enter a username and password.');
      return;
    }

    // Save admin details
    localStorage.setItem('civiclens_admin_user', JSON.stringify({
      username: adminUsername.trim(),
      password: adminPassword
    }));
    localStorage.setItem('civiclens_admin_registered', 'true');
    setIsSignupSlotAvailable(false);
    setAuthError(null);
    
    // Auto login
    sessionStorage.setItem('civiclens_admin_logged_in', 'true');
    setIsAdminLoggedIn(true);
    loadRegistrations();
  };

  // Log in the Admin
  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const storedAdminStr = localStorage.getItem('civiclens_admin_user');
    if (!storedAdminStr) {
      setAuthError('No admin account registered. Use the signup slot.');
      return;
    }

    const storedAdmin = JSON.parse(storedAdminStr);
    if (
      storedAdmin.username === adminUsername.trim() &&
      storedAdmin.password === adminPassword
    ) {
      sessionStorage.setItem('civiclens_admin_logged_in', 'true');
      setIsAdminLoggedIn(true);
      setAuthError(null);
      loadRegistrations();
    } else {
      setAuthError('Invalid username or password. Please try again.');
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem('civiclens_admin_logged_in');
    setIsAdminLoggedIn(false);
    setAdminUsername('');
    setAdminPassword('');
  };

  // Filter registrations/bookings
  const filteredRegs = registrations.filter(reg => {
    const matchesSearch = 
      (reg.username || '').toLowerCase().includes(regSearchQuery.toLowerCase()) ||
      (reg.email || '').toLowerCase().includes(regSearchQuery.toLowerCase()) ||
      (reg.phone || '').toLowerCase().includes(regSearchQuery.toLowerCase()) ||
      (reg.role || '').toLowerCase().includes(regSearchQuery.toLowerCase());
    
    const matchesRole = selectedRoleFilter === 'All' || reg.role === selectedRoleFilter;
    
    return matchesSearch && matchesRole;
  });

  // Export to CSV helper
  const handleExportCSV = () => {
    if (filteredRegs.length === 0) return;
    const headers = ['ID', 'Username', 'Role', 'Email', 'Phone', 'Created At'];
    const rows = filteredRegs.map(r => [
      r.id || '',
      r.username || '',
      r.role || '',
      r.email || '',
      r.phone || '',
      r.created_at || ''
    ]);
    
    const csvContent = 
      "data:text/csv;charset=utf-8," + 
      [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `civiclens_bookings_export_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className={`rounded-3xl p-6 md:p-8 border shadow-xl ${
      theme === 'dark' 
        ? 'bg-slate-900 border-slate-800 text-slate-100' 
        : 'bg-white border-slate-150 text-slate-800'
    }`} id="admin-panel-container">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-slate-100 dark:border-slate-800 pb-5 mb-6 gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400">
              <ShieldAlert className="w-5 h-5" />
            </span>
            <h2 className="text-xl font-black tracking-tight text-slate-800 dark:text-white">
              CivicLens Admin Portal
            </h2>
          </div>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
            Secure audit workspace for citizen registrations, hazard bookings, and compliance.
          </p>
        </div>
        
        <button
          onClick={onClose}
          className="text-xs font-bold text-[#4c6c9a] hover:underline bg-[#4c6c9a]/10 px-3 py-1.5 rounded-lg cursor-pointer"
        >
          ← Return to Portal
        </button>
      </div>

      {/* LOGIN / SIGNUP SCREEN (If not authenticated) */}
      {!isAdminLoggedIn ? (
        <div className="max-w-md mx-auto py-10 px-6 border border-slate-100 dark:border-slate-800/80 rounded-3xl bg-slate-50/50 dark:bg-slate-950/25">
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-slate-900 text-amber-400 dark:bg-white dark:text-slate-900 shadow-md mb-3">
              <Lock className="w-6 h-6 animate-pulse" />
            </div>
            <h3 className="text-base font-black text-slate-800 dark:text-white">
              {isSignupSlotAvailable ? 'Create Master Admin Account' : 'Admin Login Workspace'}
            </h3>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 max-w-xs mx-auto leading-relaxed">
              {isSignupSlotAvailable 
                ? '🎁 Single Admin Slot is open. Create your master admin account now. After this, no other sign-ups are allowed.'
                : '🔒 The single admin signup slot has been taken. Please log in with your credentials.'}
            </p>
          </div>

          <form onSubmit={isSignupSlotAvailable ? handleAdminSignup : handleAdminLogin} className="space-y-4">
            {authError && (
              <div className="bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 p-3 rounded-xl text-[11px] font-semibold flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                <span>{authError}</span>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
                Admin Username
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400 pointer-events-none">
                  <User className="w-4 h-4" />
                </span>
                <input
                  type="text"
                  required
                  placeholder="e.g. master_admin"
                  value={adminUsername}
                  onChange={(e) => setAdminUsername(e.target.value)}
                  className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 pl-10 pr-4 py-2.5 rounded-xl text-xs font-semibold focus:outline-none focus:border-[#4c6c9a] text-slate-800 dark:text-slate-100"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
                Secret Access Password
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400 pointer-events-none">
                  <Lock className="w-4 h-4" />
                </span>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 pl-10 pr-4 py-2.5 rounded-xl text-xs font-semibold focus:outline-none focus:border-[#4c6c9a] text-slate-800 dark:text-slate-100"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-slate-900 hover:bg-slate-950 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 font-extrabold py-3 rounded-xl text-xs transition-all shadow-md cursor-pointer"
            >
              {isSignupSlotAvailable ? 'Register Master Admin' : 'Secure Login'}
            </button>
          </form>

          {/* Quick instructions */}
          <div className="mt-6 border-t border-dashed border-slate-200 dark:border-slate-800 pt-4 text-[10px] text-slate-400 dark:text-slate-500 leading-relaxed text-center">
            Once you register, the signup form closes permanently, complying with the single-slot security requirement.
          </div>
        </div>
      ) : (
        /* ADMIN DASHBOARD - AUTHENTICATED */
        <div className="space-y-6">
          
          {/* Dashboard Stats / Utility bar */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 p-4 rounded-2xl flex items-center gap-4">
              <div className="p-3 bg-[#4c6c9a]/10 text-[#4c6c9a] rounded-xl">
                <Users className="w-6 h-6" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                  Total Bookings & Regs
                </p>
                <p className="text-xl font-black text-slate-800 dark:text-white mt-0.5">
                  {registrations.length}
                </p>
              </div>
            </div>

            <div className="bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 p-4 rounded-2xl flex items-center gap-4">
              <div className="p-3 bg-emerald-500/10 text-emerald-500 rounded-xl">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                  Data Stream Source
                </p>
                <p className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400 truncate max-w-[150px] mt-1">
                  {regTableSource}
                </p>
              </div>
            </div>

            <div className="bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 p-4 rounded-2xl flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-indigo-500/10 text-indigo-500 rounded-xl">
                  <User className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                    Logged In As
                  </p>
                  <p className="text-xs font-bold text-slate-800 dark:text-white mt-0.5">
                    master_admin
                  </p>
                </div>
              </div>
              <button
                onClick={handleLogout}
                title="Log Out"
                className="text-slate-400 hover:text-rose-500 p-1.5 hover:bg-rose-500/10 rounded-lg transition-all cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Tab Selection */}
          <div className="flex border-b border-slate-100 dark:border-slate-800 gap-2">
            <button
              onClick={() => setAdminActiveTab('bookings')}
              className={`pb-3 px-4 text-xs font-bold transition-all border-b-2 flex items-center gap-2 cursor-pointer ${
                adminActiveTab === 'bookings'
                  ? 'border-[#4c6c9a] text-[#4c6c9a]'
                  : 'border-transparent text-slate-400 hover:text-slate-600'
              }`}
            >
              <Database className="w-4 h-4" />
              <span>Supabase Bookings & Registrations ({registrations.length})</span>
            </button>
            <button
              onClick={() => setAdminActiveTab('reports')}
              className={`pb-3 px-4 text-xs font-bold transition-all border-b-2 flex items-center gap-2 cursor-pointer ${
                adminActiveTab === 'reports'
                  ? 'border-[#4c6c9a] text-[#4c6c9a]'
                  : 'border-transparent text-slate-400 hover:text-slate-600'
              }`}
            >
              <Layers className="w-4 h-4" />
              <span>Portal Issues & Reports ({posts.length})</span>
            </button>
          </div>

          {/* TAB 1: BOOKINGS & REGISTRATIONS */}
          {adminActiveTab === 'bookings' && (
            <div className="space-y-6">
              
              {/* LIVE REGISTRATION SYNC DATA CONSOLE */}
              <div className="bg-gradient-to-r from-emerald-500/10 via-[#4c6c9a]/10 to-indigo-500/10 dark:from-emerald-900/10 dark:via-[#4c6c9a]/10 dark:to-indigo-900/10 border border-[#4c6c9a]/30 p-5 rounded-3xl text-left space-y-4 relative overflow-hidden">
                <div className="absolute right-4 top-4 opacity-5 pointer-events-none">
                  <Database className="w-24 h-24 text-[#4c6c9a]" />
                </div>
                
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div className="space-y-1">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[9px] font-black tracking-widest bg-[#6b9661] text-white uppercase">
                      Supabase Cloud Sync Ready
                    </span>
                    <h3 className="text-sm font-black text-slate-800 dark:text-white">
                      Live Registration Sync Console
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 max-w-2xl leading-relaxed">
                      Connect your dynamic citizen & officer booking details to your live Supabase database! If your tables are empty or you just finished configuring Supabase, run this sync action to automatically seed live test bookings.
                    </p>
                  </div>

                  <button
                    onClick={handleSyncLiveRegistrations}
                    disabled={isSyncing}
                    className="bg-[#6b9661] hover:bg-[#5a8051] disabled:opacity-75 text-white text-xs font-black px-5 py-3 rounded-2xl flex items-center gap-2 transition-all shadow-md hover:scale-102 cursor-pointer shrink-0"
                  >
                    {isSyncing ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Syncing to Supabase...</span>
                      </>
                    ) : (
                      <>
                        <Database className="w-4 h-4 animate-bounce" />
                        <span>Sync Live Data Now</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Sync Messages */}
                {syncMessage && (
                  <div className={`p-4 rounded-2xl border text-xs leading-relaxed flex items-start gap-2.5 ${
                    syncMessage.type === 'success'
                      ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-700 dark:text-emerald-400'
                      : 'bg-rose-500/15 border-rose-500/30 text-rose-700 dark:text-rose-400'
                  }`}>
                    {syncMessage.type === 'success' ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                    )}
                    <div className="space-y-1">
                      <p className="font-bold">{syncMessage.type === 'success' ? 'Sync Succeeded!' : 'Connection/Setup Notice'}</p>
                      <p className="font-semibold">{syncMessage.text}</p>
                      {syncMessage.type === 'error' && (
                        <div className="mt-3 space-y-4">
                          {/* If error contains row-level security policy or RLS details */}
                          {(syncMessage.text.toLowerCase().includes('row-level security') || syncMessage.text.toLowerCase().includes('rls') || syncMessage.text.toLowerCase().includes('policy')) && (
                            <div className="bg-amber-500/10 border border-amber-500/25 p-3 rounded-xl space-y-2">
                              <p className="font-extrabold text-amber-700 dark:text-amber-400 flex items-center gap-1.5">
                                <Lock className="w-4 h-4 animate-pulse" />
                                <span>🔒 Fix Row-Level Security (RLS) Instantly:</span>
                              </p>
                              <p className="text-[10px] text-slate-600 dark:text-slate-300 font-semibold leading-relaxed">
                                You have enabled RLS on your Supabase table. You can solve this in your existing Supabase project by running either of the following commands in your <strong>Supabase SQL Editor</strong>:
                              </p>
                              
                              <div className="space-y-2 pt-1">
                                <div>
                                  <span className="block text-[9px] font-extrabold text-indigo-500 uppercase tracking-wider mb-1">Option A: Disable RLS completely (Easiest & recommended for dev):</span>
                                  <pre className="p-2 bg-slate-900 text-white rounded-lg select-all text-[9px] font-mono overflow-x-auto border border-slate-800">
                                    {`alter table registrations disable row level security;`}
                                  </pre>
                                </div>
                                <div className="pt-1">
                                  <span className="block text-[9px] font-extrabold text-emerald-500 uppercase tracking-wider mb-1">Option B: Add Public Access Policy (If you want to keep RLS active):</span>
                                  <pre className="p-2 bg-slate-900 text-white rounded-lg select-all text-[9px] font-mono overflow-x-auto border border-slate-800">
{`create policy "Allow anyone to insert and read registrations" 
on registrations for all 
using (true) 
with check (true);`}
                                  </pre>
                                </div>
                              </div>
                            </div>
                          )}

                          <div className="bg-white/45 dark:bg-slate-900/45 p-3 rounded-xl border border-dashed border-rose-500/25 text-[10px] font-mono leading-normal text-slate-600 dark:text-slate-300">
                            <p className="font-bold text-slate-700 dark:text-slate-200 mb-1">📋 Table Schema Code:</p>
                            <pre className="overflow-x-auto select-all whitespace-pre text-[9px]">
{`create table registrations (
  id uuid default gen_random_uuid() primary key,
  username text,
  contact text,
  role text,
  email text,
  phone text,
  created_at timestamp with time zone default timezone('utc'::text, now())
);`}
                            </pre>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
              
              {/* Filter and Search controls */}
              <div className="flex flex-col md:flex-row justify-between gap-4 bg-slate-50 dark:bg-slate-800/20 p-4 rounded-2xl border border-slate-100 dark:border-slate-850">
                <div className="relative flex-1">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400 pointer-events-none">
                    <Search className="w-4 h-4" />
                  </span>
                  <input
                    type="text"
                    placeholder="Search registrations by username, contact, role..."
                    value={regSearchQuery}
                    onChange={(e) => setRegSearchQuery(e.target.value)}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 pl-10 pr-4 py-2 rounded-xl text-xs font-semibold focus:outline-none focus:border-[#4c6c9a] text-slate-800 dark:text-slate-100"
                  />
                </div>

                <div className="flex gap-2 items-center">
                  <select
                    value={selectedRoleFilter}
                    onChange={(e) => setSelectedRoleFilter(e.target.value)}
                    className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-3 py-2 rounded-xl text-xs font-bold focus:outline-none text-slate-700 dark:text-slate-300"
                  >
                    <option value="All">All Roles</option>
                    <option value="Citizen">Citizens</option>
                    <option value="NGO Coordinator">NGO Coordinators</option>
                    <option value="Municipal Officer">Municipal Officers</option>
                  </select>

                  <button
                    onClick={loadRegistrations}
                    title="Refresh Data"
                    disabled={isLoadingRegs}
                    className="bg-white hover:bg-slate-100 dark:bg-slate-900 dark:hover:bg-slate-850 border border-slate-200 dark:border-slate-800 p-2.5 rounded-xl text-slate-500 dark:text-slate-400 transition-all flex items-center justify-center cursor-pointer disabled:opacity-50"
                  >
                    <RefreshCw className={`w-4 h-4 ${isLoadingRegs ? 'animate-spin' : ''}`} />
                  </button>

                  <button
                    onClick={handleExportCSV}
                    disabled={filteredRegs.length === 0}
                    className="bg-slate-900 hover:bg-slate-950 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 text-xs font-bold px-3.5 py-2 rounded-xl flex items-center gap-1.5 transition-all shadow-sm cursor-pointer disabled:opacity-50"
                  >
                    <Download className="w-4 h-4" />
                    <span>Export CSV</span>
                  </button>
                </div>
              </div>

              {/* Loader */}
              {isLoadingRegs && (
                <div className="py-20 text-center space-y-3">
                  <div className="w-8 h-8 border-3 border-[#4c6c9a] border-t-transparent rounded-full animate-spin mx-auto"></div>
                  <p className="text-xs text-slate-400 dark:text-slate-500 font-semibold">Querying live Supabase tables...</p>
                </div>
              )}

              {/* No results */}
              {!isLoadingRegs && filteredRegs.length === 0 && (
                <div className="py-16 text-center border border-dashed border-slate-200 dark:border-slate-800 rounded-3xl bg-slate-50/20">
                  <Database className="w-8 h-8 text-slate-300 dark:text-slate-700 mx-auto mb-2" />
                  <p className="text-xs font-bold text-slate-500 dark:text-slate-400">No registration bookings found</p>
                  <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1 max-w-xs mx-auto leading-relaxed">
                    Try checking different filters or verify the table in your Supabase console.
                  </p>
                </div>
              )}

              {/* Bookings Table */}
              {!isLoadingRegs && filteredRegs.length > 0 && (
                <div className="overflow-x-auto border border-slate-100 dark:border-slate-800/80 rounded-2xl bg-white dark:bg-slate-950/20">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-50 dark:bg-slate-900 text-slate-400 dark:text-slate-500 uppercase tracking-wider font-extrabold text-[9px] border-b border-slate-100 dark:border-slate-800">
                        <th className="p-4">Username</th>
                        <th className="p-4">Role / Category</th>
                        <th className="p-4">Email</th>
                        <th className="p-4">Phone Number</th>
                        <th className="p-4">Registration Date</th>
                        <th className="p-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-850">
                      {filteredRegs.map((reg, idx) => (
                        <tr 
                          key={reg.id || idx} 
                          className="hover:bg-slate-50/50 dark:hover:bg-slate-800/10 transition-colors"
                        >
                          <td className="p-4 font-extrabold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                            <span className="w-2.5 h-2.5 rounded-full bg-[#6b9661] flex-shrink-0"></span>
                            <span>@{reg.username}</span>
                          </td>
                          <td className="p-4">
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-extrabold ${
                              reg.role === 'Municipal Officer' 
                                ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950/30 dark:text-indigo-400'
                                : reg.role === 'NGO Coordinator'
                                ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400'
                                : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
                            }`}>
                              {reg.role || 'Citizen'}
                            </span>
                          </td>
                          <td className="p-4 text-slate-500 dark:text-slate-400 font-medium">
                            {reg.email || reg.contact || 'N/A'}
                          </td>
                          <td className="p-4 font-mono text-slate-500 dark:text-slate-400">
                            {reg.phone || 'N/A'}
                          </td>
                          <td className="p-4 text-slate-400 dark:text-slate-500 font-semibold">
                            {reg.created_at ? new Date(reg.created_at).toLocaleDateString() : 'N/A'}
                          </td>
                          <td className="p-4 text-right">
                            <button
                              onClick={() => setViewDetailReg(reg)}
                              className="text-[#4c6c9a] hover:underline font-extrabold text-[11px] cursor-pointer"
                            >
                              View Details
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: PORTAL ISSUES & REPORTS */}
          {adminActiveTab === 'reports' && (
            <div className="space-y-4">
              <div className="bg-slate-50 dark:bg-slate-800/10 border border-slate-100 dark:border-slate-800/60 p-4 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                  <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Audit Citizen Reports
                  </h4>
                  <p className="text-[10px] text-slate-400 dark:text-slate-500 leading-relaxed">
                    Review live submissions, severity distributions, and community verified states.
                  </p>
                </div>
                <div className="text-xs font-bold text-slate-500 dark:text-slate-400">
                  Total Active Reports: <span className="text-slate-800 dark:text-white font-black">{posts.length}</span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {posts.map(post => (
                  <div 
                    key={post.id}
                    className="p-5 border border-slate-100 dark:border-slate-800/80 rounded-2xl bg-white dark:bg-slate-900/60 space-y-3 relative overflow-hidden"
                  >
                    <div className="flex justify-between items-start gap-4">
                      <div>
                        <span className="text-[9px] font-mono uppercase bg-[#4c6c9a]/10 text-[#4c6c9a] px-2 py-0.5 rounded-md font-bold">
                          {post.issueType}
                        </span>
                        <h4 className="text-xs font-bold text-slate-800 dark:text-slate-100 mt-1.5 line-clamp-1">
                          {post.location.address}
                        </h4>
                      </div>

                      <span className={`text-[10px] font-extrabold px-2.5 py-1 rounded-full ${
                        post.status === 'Tackled'
                          ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-400'
                          : 'bg-amber-50 text-amber-600 dark:bg-amber-950/20 dark:text-amber-400'
                      }`}>
                        {post.status}
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-400 dark:text-slate-500 leading-relaxed line-clamp-2">
                      {post.description}
                    </p>

                    <div className="flex items-center justify-between text-[10px] text-slate-400 dark:text-slate-500 border-t border-slate-50 dark:border-slate-800 pt-2.5 font-semibold">
                      <span>By @{post.author}</span>
                      <span className="font-mono">{post.timestamp}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* LIGHTBOX FOR DETAIL POPUP */}
          {viewDetailReg && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full p-6 text-left relative shadow-2xl space-y-5">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-2">
                    <span className="p-1.5 rounded-lg bg-[#6b9661]/10 text-[#6b9661]">
                      <CheckCircle2 className="w-4 h-4" />
                    </span>
                    <h4 className="text-sm font-black text-slate-800 dark:text-white">
                      Registration Record
                    </h4>
                  </div>
                  <button
                    onClick={() => setViewDetailReg(null)}
                    className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-sm font-bold"
                  >
                    ✕
                  </button>
                </div>

                <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border border-slate-100 dark:border-slate-800/80 space-y-3 text-xs">
                  <div>
                    <label className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
                      Admin Database UUID / ID
                    </label>
                    <span className="font-mono text-[10px] text-slate-600 dark:text-slate-300 break-all select-all">
                      {viewDetailReg.id || 'Simulation Row ID'}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-1">
                    <div>
                      <label className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
                        Username
                      </label>
                      <span className="font-extrabold text-slate-800 dark:text-slate-100 block">
                        @{viewDetailReg.username}
                      </span>
                    </div>
                    <div>
                      <label className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
                        System Role
                      </label>
                      <span className="font-bold text-slate-600 dark:text-slate-300 block">
                        {viewDetailReg.role}
                      </span>
                    </div>
                  </div>

                  <div className="border-t border-slate-200 dark:border-slate-800/60 pt-2.5 space-y-2">
                    <div className="flex items-center gap-2">
                      <Mail className="w-3.5 h-3.5 text-slate-400" />
                      <span className="text-slate-600 dark:text-slate-300 font-semibold">{viewDetailReg.email || 'N/A'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 text-slate-400" />
                      <span className="text-slate-600 dark:text-slate-300 font-mono">{viewDetailReg.phone || 'N/A'}</span>
                    </div>
                  </div>

                  {viewDetailReg.created_at && (
                    <div className="border-t border-slate-200 dark:border-slate-800/60 pt-2.5 flex items-center gap-2 text-slate-400 dark:text-slate-500">
                      <Calendar className="w-3.5 h-3.5" />
                      <span className="text-[10px] font-semibold">Registered: {new Date(viewDetailReg.created_at).toLocaleString()}</span>
                    </div>
                  )}
                </div>

                <div className="flex justify-end pt-1">
                  <button
                    onClick={() => setViewDetailReg(null)}
                    className="bg-slate-900 hover:bg-slate-950 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 font-extrabold px-4 py-2 rounded-xl text-xs transition-all cursor-pointer"
                  >
                    Done
                  </button>
                </div>
              </div>
            </div>
          )}

        </div>
      )}
    </div>
  );
}
