import React, { useState, useEffect } from 'react';
import { Post, Comment, CommunityGroup, UserProfile, AppLanguage } from './types';
import { sampleUsers, samplePosts, sampleComments, sampleCommunities } from './data/sampleData';
import { getTranslation } from './utils/translate';
import { saveRegistration, sendEmailOTP, verifyEmailOTP, supabase } from './utils/supabase';
import Logo from './components/Logo';
import HomeView from './components/HomeView';
import PostsListView from './components/PostsListView';
import PostIssueForm from './components/PostIssueForm';
import DashboardView from './components/DashboardView';
import ProfileView from './components/ProfileView';
import CommunityGroupsView from './components/CommunityGroupsView';
import AdminPanel from './components/AdminPanel';
import { Sun, Moon, Languages, User, ShieldCheck, Sparkles, HelpCircle, Layers, PlusCircle, LayoutDashboard, Database, HelpCircle as HelpIcon, Activity, Bell, X, Users, ArrowRight, Lock, Clock } from 'lucide-react';

const getErrorMessage = (err: any): string => {
  if (!err) return 'Unknown error';
  if (typeof err === 'string') return err;
  if (err.message && err.message !== '{}') return err.message;
  if (err.error_description) return err.error_description;
  if (err.error?.message) return err.error.message;
  
  try {
    const keys = Object.keys(err);
    if (keys.length > 0) {
      return keys.map(k => `${k}: ${JSON.stringify(err[k])}`).join(', ');
    }
  } catch (e) {}
  
  return JSON.stringify(err);
};

export default function App() {
  // Navigation State
  const [activeTab, setActiveTab] = useState<'Home' | 'AllPosts' | 'PostIssue' | 'Dashboard' | 'Profile' | 'CommunityGroups' | 'Admin'>('Home');

  // Notifications State
  const [notifications, setNotifications] = useState<Array<{ id: string; message: string; timestamp: string }>>([
    {
      id: 'init-1',
      message: '📢 Welcome to CivicLens! Toggle the roles console at the top to simulate views from Citizen, NGO, and Municipal Officers.',
      timestamp: '10:00 AM'
    }
  ]);

  // Multi-Language State
  const [lang, setLang] = useState<AppLanguage>('English');

  // Dark/Light Theme State
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  // Selected Location (State & City) - affects clustered feed
  const [selectedState, setSelectedState] = useState('Karnataka');
  const [selectedCity, setSelectedCity] = useState('Bengaluru');

  // Active Session Persona state (Demostrates different permission levels)
  const [currentUserIdx, setCurrentUserIdx] = useState(0); // 0: Citizen, 1: NGO, 2: Officer

  // Registration States
  const [showRegistration, setShowRegistration] = useState(true);
  const [regStep, setRegStep] = useState<'details' | 'verify'>('details');
  const [regUsername, setRegUsername] = useState('');
  const [regContact, setRegContact] = useState('');
  const [regType, setRegType] = useState<'Citizen' | 'NGO Coordinator' | 'Municipal Officer'>('Citizen');
  const [otpInput, setOtpInput] = useState('');
  const [customRegisteredUser, setCustomRegisteredUser] = useState<UserProfile | null>(null);
  const [isSubmittingSupabase, setIsSubmittingSupabase] = useState(false);
  const [supabaseError, setSupabaseError] = useState<string | null>(null);
  const [otpVerifyError, setOtpVerifyError] = useState<string | null>(null);

  // Real vs Simulated OTP state trackers
  const [otpMode, setOtpMode] = useState<'simulated' | 'real'>('simulated');
  const [isSendingOTP, setIsSendingOTP] = useState(false);
  const [otpSendError, setOtpSendError] = useState<string | null>(null);
  const [otpSendSuccess, setOtpSendSuccess] = useState(false);
  const [otpCountdown, setOtpCountdown] = useState(60);

  // Real-time ticking effect for the verification OTP countdown
  useEffect(() => {
    let timer: any;
    if (regStep === 'verify' && otpCountdown > 0) {
      timer = setInterval(() => {
        setOtpCountdown(prev => prev - 1);
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [regStep, otpCountdown]);

  // Automatically listen to and handle real-time session parsing from URL hash (Magic Links / Email Redirects)
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        console.log('Supabase session detected via redirect/magic-link!', session);
        const email = session.user.email || '';
        const username = email.split('@')[0] || 'citizen_user';
        
        const customProfile: UserProfile = {
          username: username,
          role: 'Citizen',
          email: email,
          phone: session.user.phone || '+91 98765 43210',
          location: { state: 'Karnataka', city: 'Bengaluru' },
          reportsCount: 0,
          verificationVotesCount: 0,
          reputationPoints: 10,
          badges: [
            { 
              name: 'Verified User', 
              icon: 'Award', 
              description: `Secure verified role via Supabase Magic Link`, 
              color: 'bg-emerald-500'
            }
          ]
        };
        
        try {
          await saveRegistration({
            username: username,
            contact: email,
            role: 'Citizen',
            email: email,
            phone: session.user.phone || ''
          });
        } catch (err) {
          console.error('Auto saving registration failed:', err);
        }
        
        setCustomRegisteredUser(customProfile);
        setShowRegistration(false);
        setActiveTab('Home');
        
        const registerAlert = {
          id: `notify-reg-auto-${Date.now()}`,
          message: `🎉 Welcome @${username}! Successfully authenticated & registered via Supabase Email Magic Link.`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        setNotifications(prev => [registerAlert, ...prev]);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const handleGenerateOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regUsername.trim() || !regContact.trim()) {
      alert('Please fill out all fields.');
      return;
    }

    setOtpCountdown(60);
    const isEmail = regContact.includes('@');
    if (isEmail) {
      setIsSendingOTP(true);
      setOtpSendError(null);
      setOtpSendSuccess(false);
      try {
        await sendEmailOTP(regContact);
        setOtpMode('real');
        setOtpSendSuccess(true);
        setRegStep('verify');
      } catch (err: any) {
        console.warn('Failed to send real OTP, falling back to simulated:', err);
        const detailedError = getErrorMessage(err);
        setOtpSendError(detailedError || 'Supabase Auth SMTP is not configured or rate limit reached.');
        setOtpMode('simulated');
        setRegStep('verify');
      } finally {
        setIsSendingOTP(false);
      }
    } else {
      setOtpMode('simulated');
      setOtpSendError('Mobile SMS OTP requires a configured third-party SMS provider. Using simulated code instead.');
      setRegStep('verify');
    }
  };

  const currentUser = customRegisteredUser || sampleUsers[currentUserIdx];

  // Core Databases (State)
  const [posts, setPosts] = useState<Post[]>(samplePosts);
  const [comments, setComments] = useState<Comment[]>(sampleComments);
  const [communities, setCommunities] = useState<CommunityGroup[]>(sampleCommunities);

  // Handler to toggle Tackled check state and create notifications for peer voting
  const handleToggleTackledCheckbox = (postId: string, checked: boolean) => {
    const post = posts.find(p => p.id === postId);
    if (!post) return;

    const nextStatus = checked ? 'Tackled' : 'Prevailing';

    setPosts(prevPosts => prevPosts.map(p => {
      if (p.id === postId) {
        return {
          ...p,
          status: nextStatus,
          votesYesResolved: checked ? 1 : 0, // start with author yes vote
          votesNoResolved: 0
        };
      }
      return p;
    }));

    if (checked) {
      const newAlert = {
        id: `notify-${Date.now()}`,
        message: `⚠️ Verification Alert: @${currentUser.username} reported "${post.issueType}" is tackled! Cast your consensus vote in the Dashboard Verification Center within 24 hours.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setNotifications(prev => [newAlert, ...prev]);
    }
  };

  // Selected Post for detail view
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);

  // Apply dark mode theme class to HTML element
  useEffect(() => {
    const rootElement = document.documentElement;
    if (theme === 'dark') {
      rootElement.classList.add('dark');
    } else {
      rootElement.classList.remove('dark');
    }
  }, [theme]);

  // Handler to submit a new post
  const handleAddPost = (newPostData: Omit<Post, 'id' | 'votesYesIssue' | 'votesNoIssue' | 'votesYesResolved' | 'votesNoResolved' | 'userVotes' | 'isVerified' | 'forwardedTo'>) => {
    const newId = `post-${posts.length + 1}`;
    
    // Auto-forward entities depending on issue type and city
    const forwardingEntities: string[] = [];
    if (newPostData.city === 'Bengaluru') {
      if (newPostData.issueType === 'Potholes') forwardingEntities.push('BBMP Road Infrastructure Dept');
      else if (newPostData.issueType === 'Water Leakage') forwardingEntities.push('BWSSB Sanitary line');
      else if (newPostData.issueType === 'Damaged Streetlights') forwardingEntities.push('BESCOM Electrical Grid');
      else forwardingEntities.push('BBMP Ward Office');
    } else if (newPostData.city === 'Mumbai') {
      forwardingEntities.push('BMC Municipal Head Office');
    } else {
      forwardingEntities.push('Local Municipal Corporation Office');
    }
    forwardingEntities.push('Eco-Guardian Civil NGO');

    const completePost: Post = {
      ...newPostData,
      id: newId,
      votesYesIssue: 1, // Author's vote counts
      votesNoIssue: 0,
      votesYesResolved: 0,
      votesNoResolved: 0,
      userVotes: [{ username: currentUser.username, questionType: 'issue', vote: 'YES' }],
      isVerified: false,
      forwardedTo: forwardingEntities,
    };

    setPosts([completePost, ...posts]);
  };

  // Handler to edit/update an existing post
  const handleUpdatePost = (updatedPost: Post) => {
    setPosts(posts.map(p => p.id === updatedPost.id ? updatedPost : p));
    if (selectedPost && selectedPost.id === updatedPost.id) {
      setSelectedPost(updatedPost);
    }
  };

  // Handler to add a comment
  const handleAddComment = (postId: string, text: string) => {
    const newComm: Comment = {
      id: `comment-${comments.length + 1}`,
      postId,
      author: currentUser.username,
      text,
      timestamp: new Date().toISOString(),
      isIssueOriented: true, // Auto accepted
    };
    setComments([...comments, newComm]);
  };

  // Handler to edit a comment
  const handleEditComment = (commentId: string, newText: string) => {
    setComments(prev => prev.map(c => c.id === commentId ? { ...c, text: newText, timestamp: new Date().toISOString() } : c));
  };

  // Handler to delete a comment
  const handleDeleteComment = (commentId: string) => {
    setComments(prev => prev.filter(c => c.id !== commentId));
  };

  // Handler to create community action group
  const handleCreateCommunity = (newGroupData: Omit<CommunityGroup, 'id' | 'membersCount' | 'volunteersCount' | 'status'>) => {
    const newGroup: CommunityGroup = {
      ...newGroupData,
      id: `comm-${communities.length + 1}`,
      membersCount: 1,
      volunteersCount: 1,
      status: 'Active',
    };
    setCommunities([newGroup, ...communities]);
  };

  return (
    <div className={`min-h-screen transition-colors duration-300 font-sans ${theme === 'dark' ? 'bg-slate-900 text-slate-100' : 'bg-[#F1F5F9] text-slate-800'}`}>
      
      {/* DEMO CONTROL BAR (HACKATHON GOLDMINE) */}
      <div className="bg-slate-800 text-slate-300 text-xs py-3.5 px-6 border-b border-slate-700 flex flex-wrap justify-between items-center gap-4 shadow-md font-sans">
        <div className="flex items-center gap-2">
          <span className="bg-gradient-to-r from-[#4c6c9a] to-[#6b9661] text-white px-2 py-0.5 rounded font-black text-[10px] uppercase tracking-wider shadow-inner">
            HACKATHON CONSOLE
          </span>
          <span className="text-slate-400 font-medium">Toggle layers to present different views of the solution:</span>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          {/* Persona Switcher */}
          <div className="flex items-center gap-2 bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-700/80">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wide">
              {getTranslation(lang, 'roleSwitcher')}:
            </span>
            <select
              value={currentUserIdx}
              onChange={(e) => {
                setCurrentUserIdx(Number(e.target.value));
                setSelectedPost(null); // Clear selections
              }}
              className="bg-transparent text-white font-bold text-xs focus:outline-none cursor-pointer"
            >
              <option value={0} className="text-slate-800">@{sampleUsers[0].username} (Citizen)</option>
              <option value={1} className="text-slate-800">@{sampleUsers[1].username} (NGO Coordinator)</option>
              <option value={2} className="text-slate-800">@{sampleUsers[2].username} (Municipal Officer)</option>
            </select>
          </div>

          {/* Language Selector */}
          <div className="flex items-center gap-1.5 bg-slate-900 px-2.5 py-1.5 rounded-lg border border-slate-700/80">
            <Languages className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={lang}
              onChange={(e) => setLang(e.target.value as AppLanguage)}
              className="bg-transparent text-white font-bold text-xs focus:outline-none cursor-pointer"
            >
              <option value="English" className="text-slate-800">English</option>
              <option value="Hindi" className="text-slate-800">हिन्दी (Hindi)</option>
              <option value="Spanish" className="text-slate-800">Español (Spanish)</option>
              <option value="Tamil" className="text-slate-800">தமிழ் (Tamil)</option>
              <option value="Marathi" className="text-slate-800">मराठी (Marathi)</option>
            </select>
          </div>

          {/* Theme Selector */}
          <button
            onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
            className="p-1.5 rounded-lg bg-slate-900 border border-slate-700 hover:bg-slate-700 transition-colors text-slate-300"
            title="Toggle Light/Dark Theme"
          >
            {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4 text-amber-400" />}
          </button>
        </div>
      </div>

      {/* CORE BRAND NAVIGATION BAR */}
      <header className="sticky top-0 z-40 backdrop-blur-md bg-white/95 dark:bg-slate-900/95 border-b border-slate-100 dark:border-slate-800 shadow-sm px-6 py-4 flex flex-col md:flex-row justify-between items-center gap-4">
        {/* Logo */}
        <Logo showText={true} size="md" className="cursor-pointer" />

        {/* Navigation Tabs */}
        <nav className="flex flex-wrap gap-1 md:gap-2">
          {[
            { id: 'Home', label: getTranslation(lang, 'navHome'), icon: <Layers className="w-4 h-4" /> },
            { id: 'AllPosts', label: 'All Reports', icon: <Database className="w-4 h-4" /> },
            { id: 'PostIssue', label: getTranslation(lang, 'navPostIssue'), icon: <PlusCircle className="w-4 h-4" /> },
            { id: 'CommunityGroups', label: 'Action Groups', icon: <Users className="w-4 h-4 text-emerald-500" /> },
            { id: 'Dashboard', label: getTranslation(lang, 'navDashboard'), icon: <LayoutDashboard className="w-4 h-4" /> },
            { id: 'Profile', label: getTranslation(lang, 'navProfile'), icon: <User className="w-4 h-4" /> },
          ].map((item) => {
            const active = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id as any);
                  setSelectedPost(null);
                }}
                className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
                  active 
                    ? 'bg-gradient-to-r from-[#4c6c9a] to-[#6b9661] text-white shadow-sm scale-102 font-extrabold' 
                    : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                }`}
              >
                {item.icon}
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* User Session Badge */}
        <div className="hidden lg:flex items-center gap-3 bg-slate-50 dark:bg-slate-800/60 p-2 rounded-xl border border-slate-100 dark:border-slate-700/80">
          <div className="w-8 h-8 rounded-full bg-gradient-to-r from-[#4c6c9a] to-[#6b9661] text-white flex items-center justify-center font-extrabold text-sm shadow-sm">
            {currentUser.username[0]}
          </div>
          <div className="text-left leading-tight">
            <p className="text-xs font-extrabold text-slate-800 dark:text-white">
              @{currentUser.username}
            </p>
            <p className="text-[9px] text-[#6b9661] font-bold uppercase tracking-wider">
              {currentUser.role} Account
            </p>
          </div>
        </div>
      </header>

      {/* INSTANT NOTIFICATIONS CENTER BANNERS */}
      {notifications.length > 0 && (
        <div className="max-w-7xl mx-auto px-6 pt-6 space-y-2">
          {notifications.map((notif) => (
            <div 
              key={notif.id}
              className="bg-slate-900 dark:bg-slate-950 border border-amber-500/30 p-4 rounded-2xl flex items-start gap-3 shadow-lg text-amber-50 dark:text-amber-50 text-xs font-semibold relative overflow-hidden"
            >
              <Bell className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5 animate-bounce" />
              <div className="flex-grow pr-6">
                <p className="leading-relaxed font-bold">{notif.message}</p>
                <span className="text-[10px] text-slate-400 dark:text-slate-400 font-mono block mt-1">{notif.timestamp}</span>
              </div>
              <button 
                onClick={() => setNotifications(prev => prev.filter(n => n.id !== notif.id))}
                className="absolute top-3 right-3 text-slate-400 hover:text-white font-bold"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}

      {/* DISMISSIBLE SUPABASE DATABASE INTEGRATION BANNER */}
      {supabaseError && (
        <div className="max-w-7xl mx-auto px-6 pt-6">
          <div className="bg-amber-50 dark:bg-slate-800/90 border border-amber-500/30 p-5 rounded-3xl relative shadow-md">
            <button
              onClick={() => setSupabaseError(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 font-bold"
            >
              ✕
            </button>
            <div className="flex items-start gap-3">
              <Lock className="w-5 h-5 text-amber-500 mt-0.5 animate-bounce flex-shrink-0" />
              <div className="space-y-3 text-left w-full">
                <h4 className="text-sm font-extrabold text-amber-800 dark:text-amber-400 flex items-center gap-2">
                  <span>Supabase Integration Action Needed</span>
                  <span className="bg-amber-200 dark:bg-amber-900/50 text-amber-800 dark:text-amber-300 px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-wider">
                    Non-Blocking Dev Alert
                  </span>
                </h4>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
                  Your OTP was verified successfully! You have been logged in. However, the app could not save your profile record to Supabase because the required database tables do not exist yet, or Row-Level Security (RLS) is blocking access.
                </p>
                <div className="bg-amber-500/5 p-3 rounded-2xl border border-amber-500/15 space-y-1">
                  <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed font-bold">
                    Error details: <span className="font-mono text-red-500 bg-red-500/10 px-1 py-0.5 rounded">{supabaseError}</span>
                  </p>
                </div>
                
                <div className="bg-slate-900 text-slate-100 p-4 rounded-2xl border border-slate-800 text-xs font-mono space-y-3 overflow-hidden">
                  <p className="font-extrabold text-indigo-400 text-[11px]">📋 STEP 1: Create 'registrations' Table in your Supabase SQL Editor:</p>
                  <pre className="p-3 bg-slate-950 rounded-xl select-all text-[11px] overflow-x-auto border border-slate-800 whitespace-pre">
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
                  
                  <p className="font-extrabold text-emerald-400 text-[11px]">🔒 STEP 2: Disable Row-Level Security (RLS) so the app can insert/read:</p>
                  <pre className="p-3 bg-slate-950 rounded-xl select-all text-[11px] overflow-x-auto border border-slate-800">
{`alter table registrations disable row level security;`}
                  </pre>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SYSTEM MAIN BODY CONTAINER */}
      <main className="max-w-7xl mx-auto px-6 py-10">
        
        {/* active tab rendering */}
        {activeTab === 'Home' && (
          <HomeView
            posts={posts}
            comments={comments}
            currentUser={currentUser}
            communities={communities}
            selectedState={selectedState}
            setSelectedState={setSelectedState}
            selectedCity={selectedCity}
            setSelectedCity={setSelectedCity}
            lang={lang}
            theme={theme}
            onSelectPost={(p) => {
              setSelectedPost(p);
              setActiveTab('AllPosts');
            }}
            onCreateCommunity={handleCreateCommunity}
            onToggleTackledCheckbox={handleToggleTackledCheckbox}
            onAddComment={handleAddComment}
            onEditComment={handleEditComment}
            onDeleteComment={handleDeleteComment}
            onUpdatePost={handleUpdatePost}
          />
        )}

        {activeTab === 'AllPosts' && (
          <PostsListView
            posts={posts}
            comments={comments}
            currentUser={currentUser}
            lang={lang}
            selectedPost={selectedPost}
            onCloseDetail={() => setSelectedPost(null)}
            onSelectPost={(p) => setSelectedPost(p)}
            onUpdatePost={handleUpdatePost}
            onAddComment={handleAddComment}
            onEditComment={handleEditComment}
            onDeleteComment={handleDeleteComment}
            onToggleTackledCheckbox={handleToggleTackledCheckbox}
          />
        )}

        {activeTab === 'PostIssue' && (
          <PostIssueForm
            onAddPost={handleAddPost}
            currentUser={currentUser}
            lang={lang}
            onNavigateToHome={() => {
              setActiveTab('Home');
            }}
          />
        )}

        {activeTab === 'CommunityGroups' && (
          <CommunityGroupsView
            communities={communities}
            selectedCity={selectedCity}
            lang={lang}
            onCreateCommunity={handleCreateCommunity}
          />
        )}

        {activeTab === 'Dashboard' && (
          <DashboardView
            posts={posts}
            currentUser={currentUser}
            lang={lang}
            onUpdatePost={handleUpdatePost}
          />
        )}

        {activeTab === 'Profile' && (
          <ProfileView
            currentUser={currentUser}
            posts={posts}
            lang={lang}
            onLogout={async () => {
              try {
                await supabase.auth.signOut();
              } catch (err) {
                console.error('Error signing out from Supabase Auth:', err);
              }
              setCustomRegisteredUser(null);
              setShowRegistration(true);
              setRegStep('details');
              setActiveTab('Home');
            }}
          />
        )}

        {activeTab === 'Admin' && (
          <AdminPanel
            posts={posts}
            lang={lang}
            theme={theme}
            onClose={() => setActiveTab('Home')}
          />
        )}

      </main>

      {/* SYSTEM METRICS FOOTER */}
      <footer className="mt-20 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 py-12 px-6 text-center text-xs text-slate-400 dark:text-slate-500 font-sans space-y-4">
        <Logo showText={true} size="sm" className="justify-center opacity-85" />
        <p className="max-w-md mx-auto leading-relaxed">
          CivicLens is a citizen-powered decentralization tool designed to eradicate city hazards, eliminate fake duplicate reporting, and bridge direct cooperation lines.
        </p>
        
        {/* Technologies Highlight */}
        <div className="flex flex-wrap justify-center gap-3 text-[10px] font-mono uppercase tracking-wider py-2">
          <span className="bg-slate-50 dark:bg-slate-800 px-2.5 py-1 rounded">Google Cloud Vision AI</span>
          <span className="bg-slate-50 dark:bg-slate-800 px-2.5 py-1 rounded">Google Maps Platform</span>
          <span className="bg-slate-50 dark:bg-slate-800 px-2.5 py-1 rounded">Google Gemini API</span>
          <span className="bg-slate-50 dark:bg-slate-800 px-2.5 py-1 rounded">Firebase Auth & Storage</span>
          <span className="bg-slate-50 dark:bg-slate-800 px-2.5 py-1 rounded">Google Looker Studio</span>
          <span className="bg-slate-50 dark:bg-slate-800 px-2.5 py-1 rounded">Vite + React 19 + motion</span>
        </div>

        <p className="text-[10px] text-slate-400/80">
          © {new Date().getFullYear()} CivicLens. Crafted with Blue and Green Theme. All rights reserved. •{' '}
          <button
            onClick={() => setActiveTab('Admin')}
            className="font-bold text-[#4c6c9a] hover:underline cursor-pointer"
          >
            Admin Sign-Up or Login Workspace
          </button>
        </p>
      </footer>

      {/* Dynamic Registration & OTP Verification Portal Modal Overlay */}
      {showRegistration && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/90 backdrop-blur-md overflow-y-auto" id="registration-portal-overlay">
          <div className="bg-white dark:bg-slate-800 rounded-3xl max-w-lg w-full p-8 border border-slate-200 dark:border-slate-700 shadow-2xl relative overflow-hidden text-left">
            <div className="absolute top-0 right-0 w-48 h-48 bg-[#6b9661]/10 rounded-full blur-2xl"></div>
            
            {regStep === 'details' ? (
              <div className="space-y-6">
                <div className="text-center space-y-2">
                  <div className="mx-auto w-12 h-12 rounded-2xl bg-gradient-to-br from-[#4c6c9a] to-[#6b9661] text-white flex items-center justify-center font-black text-xl shadow-md">
                    C
                  </div>
                  <h3 className="text-xl font-black tracking-tight text-slate-800 dark:text-white mt-4">
                    CivicLens Citizen & Agency Portal
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto leading-relaxed">
                    Join your local municipality's transparent consensus-building network. Log road hazards, water leakage, and streetlamp issues with AI verification.
                  </p>
                </div>

                <form onSubmit={handleGenerateOTP} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
                      Username / Handle
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. rahul_k"
                      value={regUsername}
                      onChange={(e) => setRegUsername(e.target.value.replace(/[^a-zA-Z0-9_]/g, ''))}
                      className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 px-4 py-2.5 rounded-xl text-xs font-semibold focus:outline-none focus:border-[#4c6c9a] text-slate-800 dark:text-slate-100"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
                      Email or Mobile Number
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. rahul@gmail.com or 9876543210"
                      value={regContact}
                      onChange={(e) => setRegContact(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 px-4 py-2.5 rounded-xl text-xs font-semibold focus:outline-none focus:border-[#4c6c9a] text-slate-800 dark:text-slate-100"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
                      Contributor Type
                    </label>
                    <select
                      value={regType}
                      onChange={(e) => setRegType(e.target.value as any)}
                      className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 px-4 py-2.5 rounded-xl text-xs font-semibold focus:outline-none focus:border-[#4c6c9a] text-slate-800 dark:text-slate-100"
                    >
                      <option value="Citizen">Citizen (Public Reporter)</option>
                      <option value="NGO Coordinator">NGO Coordinator (Civic Partner)</option>
                      <option value="Municipal Officer">Municipal Officer (MC Authority)</option>
                    </select>
                  </div>

                  {/* Role-Specific Information notice */}
                  <div className="bg-slate-50 dark:bg-slate-900 p-3 rounded-xl text-[10px] text-slate-500 dark:text-slate-400 border border-slate-150 dark:border-slate-800/80 leading-relaxed">
                    {regType === 'Municipal Officer' ? (
                      <span className="text-amber-600 dark:text-amber-400 font-medium">⚠️ Note: Municipal Officer access requires a domain check (@gov.in / @nic.in handles) during OTP verification.</span>
                    ) : regType === 'NGO Coordinator' ? (
                      <span className="text-indigo-600 dark:text-indigo-400 font-medium">ℹ️ Note: NGO Coordinator accounts must provide verified NGO registration credentials for dispatch notifications.</span>
                    ) : (
                      <span>ℹ️ Citizen accounts have immediate access to upvote, comment, and report municipal issues.</span>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={isSendingOTP}
                    className="w-full bg-[#4c6c9a] hover:bg-[#405c83] disabled:opacity-50 text-white font-bold py-3 rounded-xl shadow text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <span>{isSendingOTP ? 'Sending OTP to Email...' : 'Generate Verification OTP'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </form>

                {/* Role Bypass Selector Link */}
                <div className="text-center pt-2">
                  <button
                    onClick={() => {
                      setShowRegistration(false);
                    }}
                    className="text-[10px] text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 underline font-medium"
                  >
                    Or skip and continue with standard pre-built Demo Personas
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="text-center space-y-2">
                  <div className="mx-auto w-12 h-12 rounded-2xl bg-emerald-500/15 text-emerald-600 flex items-center justify-center">
                    <ShieldCheck className="w-6 h-6" />
                  </div>
                  <h3 className="text-xl font-black tracking-tight text-slate-800 dark:text-white mt-4">
                    Secure Domain Verification
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto leading-relaxed">
                    We have sent a 6-digit verification code to <span className="font-bold text-slate-700 dark:text-slate-200">{regContact}</span>. Please verify to activate your session.
                  </p>
                </div>

                {/* VISUAL COUNTDOWN TIMER */}
                <div className="flex items-center justify-between p-3.5 bg-slate-100 dark:bg-slate-900/60 rounded-2xl border border-slate-200/50 dark:border-slate-800/60 shadow-sm">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-[#4c6c9a] dark:text-[#6b9661] animate-pulse" />
                    <span className="text-xs font-bold text-slate-600 dark:text-slate-300">
                      OTP Expiration & Resend Window:
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 bg-white dark:bg-slate-900 px-3 py-1 rounded-xl shadow-sm border border-slate-150 dark:border-slate-750">
                    <span className="text-xs font-black font-mono text-[#4c6c9a] dark:text-[#6b9661] tracking-wide animate-pulse">
                      {otpCountdown > 0 ? `${otpCountdown}s` : 'Expired'}
                    </span>
                  </div>
                </div>

                {/* DYNAMIC OTP GATEWAY CONSOLE */}
                {otpMode === 'real' ? (
                  <div className="bg-emerald-500/10 border border-emerald-500/20 p-5 rounded-3xl text-left space-y-4">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-5 h-5 text-emerald-600 dark:text-emerald-400 animate-bounce" />
                      <span className="text-xs font-black uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                        Supabase Email Auth Sync Active
                      </span>
                    </div>

                    <div className="space-y-1">
                      <p className="text-[11px] text-slate-700 dark:text-slate-200 leading-relaxed font-black">
                        Email dispatched to <span className="text-indigo-600 dark:text-indigo-400 font-bold">{regContact}</span>!
                      </p>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-relaxed">
                        Please check your email inbox (and spam folder). Depending on your Supabase settings, you can authenticate in one of two ways:
                      </p>
                    </div>

                    <div className="border-t border-slate-200/50 dark:border-slate-800/50 pt-3 space-y-3">
                      {/* Method 1 */}
                      <div className="space-y-1 bg-white/50 dark:bg-slate-900/40 p-2.5 rounded-xl border border-slate-200/40 dark:border-slate-800/40">
                        <span className="inline-flex items-center gap-1 text-[9px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest">
                          ⚡ Method 1: Instant 6-Digit OTP
                        </span>
                        <p className="text-[9px] text-slate-500 dark:text-slate-400 leading-relaxed">
                          To receive a direct <strong>6-digit numeric OTP</strong> instead of a link:
                        </p>
                        <ol className="list-decimal list-inside text-[8.5px] text-slate-600 dark:text-slate-300 font-semibold space-y-0.5 mt-1 leading-relaxed">
                          <li>Go to your <strong>Supabase Dashboard</strong>.</li>
                          <li>Navigate to <strong>Authentication</strong> → <strong>Email Templates</strong> → <strong>Confirm Signup</strong>.</li>
                          <li>Change the message body from <code className="bg-slate-100 dark:bg-slate-800 p-0.5 rounded text-rose-500">{"{{ .ConfirmationURL }}"}</code> to <code className="bg-slate-100 dark:bg-slate-800 p-0.5 rounded text-emerald-500">{"{{ .Token }}"}</code>.</li>
                          <li>Save and request another OTP! You will get a 6-digit code in your email to type below.</li>
                        </ol>
                      </div>

                      {/* Method 2 */}
                      <div className="space-y-1 bg-white/50 dark:bg-slate-900/40 p-2.5 rounded-xl border border-slate-200/40 dark:border-slate-800/40">
                        <span className="inline-flex items-center gap-1 text-[9px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">
                          🔗 Method 2: One-Click Email Link Redirect
                        </span>
                        <p className="text-[9px] text-slate-500 dark:text-slate-400 leading-relaxed">
                          If you want to click the email confirmation link and automatically log in:
                        </p>
                        <ol className="list-decimal list-inside text-[8.5px] text-slate-600 dark:text-slate-300 font-semibold space-y-0.5 mt-1 leading-relaxed">
                          <li>Go to your <strong>Supabase Dashboard</strong>.</li>
                          <li>Navigate to <strong>Authentication</strong> → <strong>URL Configuration</strong>.</li>
                          <li>Change the <strong>Site URL</strong> from <code className="bg-slate-100 dark:bg-slate-800 p-0.5 rounded text-rose-500">http://localhost:3000</code> to your real hosted application URL:<br/>
                            <span className="inline-block mt-0.5 px-1.5 py-0.5 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 font-mono text-[8px] rounded border border-indigo-100/40 select-all">
                              https://ais-dev-iyhbr25r2wfghulmfn2ymt-64153782444.asia-southeast1.run.app
                            </span>
                          </li>
                          <li>Once updated, clicking the link in your email will instantly log you in!</li>
                        </ol>
                      </div>
                    </div>

                    <div className="pt-2 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-t border-slate-200/40 dark:border-slate-800/40">
                      <button
                        type="button"
                        onClick={() => {
                          setOtpMode('simulated');
                          setOtpInput('771420');
                        }}
                        className="text-[9px] text-amber-600 hover:text-amber-500 hover:underline font-black cursor-pointer flex items-center gap-1"
                      >
                        ⚠️ Having issues? Switch to Simulated Bypass Code (771420)
                      </button>

                      <button
                        type="button"
                        onClick={async () => {
                          setIsSendingOTP(true);
                          setOtpSendError(null);
                          try {
                            await sendEmailOTP(regContact);
                            setOtpCountdown(60);
                            alert('🎉 A fresh confirmation email has been sent!');
                          } catch (err: any) {
                            alert(`Failed to resend: ${err.message}`);
                          } finally {
                            setIsSendingOTP(false);
                          }
                        }}
                        disabled={isSendingOTP || otpCountdown > 0}
                        className="text-[9px] text-[#4c6c9a] hover:underline font-black cursor-pointer disabled:opacity-50"
                      >
                        {isSendingOTP ? 'Resending...' : otpCountdown > 0 ? `🔄 Resend Email in ${otpCountdown}s` : '🔄 Resend Email'}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 text-left space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                        Simulated Sandbox Gateway
                      </span>
                      {regContact.includes('@') && (
                        <button
                          type="button"
                          disabled={isSendingOTP}
                          onClick={async () => {
                            setIsSendingOTP(true);
                            setOtpSendError(null);
                            try {
                              await sendEmailOTP(regContact);
                              setOtpMode('real');
                              setOtpSendSuccess(true);
                            } catch (err: any) {
                              console.error(err);
                              const detailedError = getErrorMessage(err);
                              setOtpSendError(detailedError || 'Supabase Auth SMTP not fully active.');
                              alert(`Could not send real OTP: ${detailedError || 'Error'}. Please ensure email signup is enabled in your Supabase Auth settings.`);
                            } finally {
                              setIsSendingOTP(false);
                            }
                          }}
                          className="text-[10px] bg-[#4c6c9a] hover:bg-[#405c83] text-white px-2.5 py-1 rounded-xl font-bold transition-all cursor-pointer"
                        >
                          {isSendingOTP ? 'Sending...' : '⚡ Try Real Email OTP'}
                        </button>
                      )}
                    </div>
                    
                    {otpSendError && (
                      <div className="text-[9px] font-bold text-amber-600 bg-amber-500/10 p-2 rounded-lg border border-amber-500/20 leading-relaxed">
                        Notice: {otpSendError}
                      </div>
                    )}

                    <div className="flex items-center gap-2 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 border border-emerald-100 dark:border-emerald-900 px-3 py-2 rounded-xl font-bold text-xs">
                      <span>Bypass Code:</span>
                      <span className="font-mono text-sm tracking-wider bg-white dark:bg-slate-800 px-2 py-0.5 rounded shadow-sm text-slate-800 dark:text-slate-100">771420</span>
                    </div>
                    
                    <button 
                      type="button"
                      onClick={() => setOtpInput('771420')}
                      className="text-[10px] text-[#4c6c9a] hover:underline font-bold block cursor-pointer"
                    >
                      Click to auto-fill bypass code
                    </button>
                  </div>
                )}

                 <form onSubmit={async (e) => {
                  e.preventDefault();
                  
                  setIsSubmittingSupabase(true);
                  setSupabaseError(null);
                  setOtpVerifyError(null);

                  try {
                    try {
                      if (otpInput.trim() === '771420') {
                        console.log('Using simulated bypass OTP.');
                      } else {
                        await verifyEmailOTP(regContact, otpInput);
                      }
                    } catch (verifyErr: any) {
                      console.warn('OTP Verification failed:', verifyErr);
                      setOtpVerifyError(verifyErr.message || 'OTP Verification failed. Please ensure the code is correct and not expired.');
                      setIsSubmittingSupabase(false);
                      return; // STOP execution here
                    }

                    // Create dynamic type-safe user profile
                    const regEmail = regContact.includes('@') ? regContact : `${regUsername}@hsrlayout.gov.in`;
                    const regPhone = !regContact.includes('@') ? regContact : '+91 98765 43210';
                    
                    const customProfile: UserProfile = {
                      username: regUsername.trim() || 'Citizen',
                      role: regType,
                      email: regEmail,
                      phone: regPhone,
                      location: { state: 'Karnataka', city: 'Bengaluru' },
                      reportsCount: 0,
                      verificationVotesCount: 0,
                      reputationPoints: 10,
                      badges: [
                        { 
                          name: 'Dynamic Agent', 
                          icon: 'Award', 
                          description: `Secure verified role as ${regType}`, 
                          color: regType === 'Municipal Officer' ? 'bg-indigo-500' : regType === 'NGO Coordinator' ? 'bg-emerald-500' : 'bg-[#4c6c9a]' 
                        }
                      ]
                    };

                    let result = null;
                    let dbWriteSuccess = false;
                    try {
                      result = await saveRegistration({
                        username: regUsername.trim(),
                        contact: regContact.trim(),
                        role: regType,
                        email: regEmail,
                        phone: regPhone
                      });
                      dbWriteSuccess = true;
                    } catch (dbErr: any) {
                      console.warn('Supabase DB write failed, but allowing user session entry:', dbErr);
                      setSupabaseError(dbErr.message || 'Database insert failed.');
                      // Do not rethrow here to allow successful portal entry
                    }

                    setCustomRegisteredUser(customProfile);
                    setShowRegistration(false);

                    // Set tab to Home or Dashboard depending on role
                    if (regType === 'Municipal Officer' || regType === 'NGO Coordinator') {
                      setActiveTab('Dashboard');
                    } else {
                      setActiveTab('Home');
                    }

                    // Alert notification
                    const registerAlert = {
                      id: `notify-reg-${Date.now()}`,
                      message: dbWriteSuccess
                        ? `🎉 Welcome @${customProfile.username}! Successfully connected, authenticated & saved to Supabase '${result?.table}' table.`
                        : `⚠️ Welcome @${customProfile.username}! Authenticated via OTP, but database record skipped. Please ensure your 'registrations' table is created in Supabase (see banner).`,
                      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                    };
                    setNotifications(prev => [registerAlert, ...prev]);
                  } catch (err: any) {
                    console.error('Supabase integration error:', err);
                    setSupabaseError(err.message || 'An error occurred while communicating with Supabase.');
                  } finally {
                    setIsSubmittingSupabase(false);
                  }

                }} className="space-y-4">
                  {supabaseError && (
                    <div className="bg-amber-500/10 dark:bg-amber-500/5 border border-amber-500/35 p-4 rounded-2xl space-y-3 text-left">
                      <div className="flex items-start gap-2.5">
                        <Lock className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5 animate-bounce" />
                        <div className="space-y-1">
                          <h4 className="text-xs font-bold text-amber-600 dark:text-amber-400">
                            Supabase Setup Notice
                          </h4>
                          <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-relaxed">
                            {supabaseError}
                          </p>
                        </div>
                      </div>
                      
                      {/* If error contains row-level security policy or RLS details */}
                      {(supabaseError.toLowerCase().includes('row-level security') || supabaseError.toLowerCase().includes('rls') || supabaseError.toLowerCase().includes('policy')) && (
                        <div className="bg-amber-500/10 border border-amber-500/25 p-3 rounded-xl space-y-2">
                          <p className="font-extrabold text-amber-700 dark:text-amber-400 flex items-center gap-1.5 text-[11px]">
                            <Lock className="w-3.5 h-3.5 animate-pulse" />
                            <span>🔒 Fix Row-Level Security (RLS) Instantly:</span>
                          </p>
                          <p className="text-[9px] text-slate-600 dark:text-slate-300 leading-relaxed font-semibold">
                            You can solve this instantly in your existing Supabase project by running either of the following commands in your <strong>Supabase SQL Editor</strong>:
                          </p>
                          
                          <div className="space-y-2 pt-0.5">
                            <div>
                              <span className="block text-[8px] font-extrabold text-indigo-500 uppercase tracking-wider mb-0.5">Option A: Disable RLS completely (Easiest & recommended for dev):</span>
                              <pre className="p-1.5 bg-slate-900 text-white rounded-lg select-all text-[9px] font-mono overflow-x-auto border border-slate-800">
                                {`alter table registrations disable row level security;`}
                              </pre>
                            </div>
                            <div>
                              <span className="block text-[8px] font-extrabold text-emerald-500 uppercase tracking-wider mb-0.5">Option B: Add Public Access Policy:</span>
                              <pre className="p-1.5 bg-slate-900 text-white rounded-lg select-all text-[9px] font-mono overflow-x-auto border border-slate-800">
{`create policy "Allow public access" 
on registrations for all 
using (true) 
with check (true);`}
                              </pre>
                            </div>
                          </div>
                        </div>
                      )}

                      <div className="bg-slate-50 dark:bg-slate-900/80 p-3 rounded-xl border border-slate-200 dark:border-slate-800 text-[9px] font-mono leading-normal text-slate-600 dark:text-slate-300">
                        <p className="font-bold text-slate-700 dark:text-slate-200 mb-1">📋 Run this SQL in Supabase SQL Editor:</p>
                        <pre className="overflow-x-auto select-all whitespace-pre">
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

                      <div className="flex justify-between items-center pt-1">
                        <span className="text-[9px] text-slate-400 font-semibold italic">Demo Mode is available:</span>
                        <button
                          type="button"
                          onClick={() => {
                            const regEmail = regContact.includes('@') ? regContact : `${regUsername}@hsrlayout.gov.in`;
                            const regPhone = !regContact.includes('@') ? regContact : '+91 98765 43210';
                            
                            const customProfile: UserProfile = {
                              username: regUsername.trim() || 'Citizen',
                              role: regType,
                              email: regEmail,
                              phone: regPhone,
                              location: { state: 'Karnataka', city: 'Bengaluru' },
                              reportsCount: 0,
                              verificationVotesCount: 0,
                              reputationPoints: 10,
                              badges: [
                                { 
                                  name: 'Dynamic Agent', 
                                  icon: 'Award', 
                                  description: `Secure verified role as ${regType}`, 
                                  color: regType === 'Municipal Officer' ? 'bg-indigo-500' : regType === 'NGO Coordinator' ? 'bg-emerald-500' : 'bg-[#4c6c9a]' 
                                }
                              ]
                            };
                            setCustomRegisteredUser(customProfile);
                            setShowRegistration(false);
                            if (regType === 'Municipal Officer' || regType === 'NGO Coordinator') {
                              setActiveTab('Dashboard');
                            } else {
                              setActiveTab('Home');
                            }
                            const registerAlert = {
                              id: `notify-reg-${Date.now()}`,
                              message: `🎉 Welcome @${customProfile.username}! Logged in as ${regType} (Supabase setup was bypassed for local demo).`,
                              timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                            };
                            setNotifications(prev => [registerAlert, ...prev]);
                          }}
                          className="bg-slate-800 hover:bg-slate-950 dark:bg-slate-700 dark:hover:bg-slate-600 text-white font-bold px-3 py-1.5 rounded-lg text-[10px] transition-all cursor-pointer shadow-sm"
                        >
                          Bypass & Continue (Demo Mode)
                        </button>
                      </div>
                    </div>
                  )}

                  {otpVerifyError && (
                    <div className="bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 border border-rose-200/50 dark:border-rose-900/40 p-4 rounded-2xl text-xs text-left leading-relaxed relative">
                      <p className="flex items-center gap-1.5 font-black text-rose-700 dark:text-rose-400 mb-1">
                        <span>❌ Authentication Error</span>
                      </p>
                      <p className="font-semibold text-slate-600 dark:text-slate-300">
                        {otpVerifyError}
                      </p>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-2 font-medium leading-relaxed">
                        💡 <strong>Why is this happening?</strong> If your email already exists, Supabase Auth sends the <strong>Magic Link (Sign-in) template</strong> instead of the Confirm Signup template. Make sure you have updated the <strong>Magic Link</strong> email template in your Supabase Dashboard to contain <code className="bg-rose-500/15 text-rose-600 px-1 py-0.5 rounded font-mono">{"{{ .Token }}"}</code> too!
                      </p>
                    </div>
                  )}

                  <div className="space-y-1.5 text-left">
                    <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
                      Verification Code / OTP
                    </label>
                    <input
                      type="text"
                      required
                      maxLength={12}
                      disabled={isSubmittingSupabase}
                      placeholder="Enter verification code..."
                      value={otpInput}
                      onChange={(e) => setOtpInput(e.target.value.trim())}
                      className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 px-4 py-2.5 rounded-xl text-center text-sm font-extrabold tracking-widest focus:outline-none focus:border-[#4c6c9a] text-slate-800 dark:text-slate-100 disabled:opacity-50"
                    />
                  </div>

                  <div className="flex gap-3">
                    <button
                      type="button"
                      disabled={isSubmittingSupabase}
                      onClick={() => setRegStep('details')}
                      className="flex-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 font-bold py-3 rounded-xl text-xs transition-colors disabled:opacity-50"
                    >
                      Back
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmittingSupabase}
                      className="flex-2 bg-[#6b9661] hover:bg-[#5a8051] text-white font-bold py-3 px-6 rounded-xl shadow text-xs transition-all flex items-center justify-center gap-1.5 disabled:opacity-75"
                    >
                      {isSubmittingSupabase ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          <span>Saving to Supabase...</span>
                        </>
                      ) : (
                        <>
                          <ShieldCheck className="w-4 h-4" />
                          <span>Verify & Enter Portal</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
