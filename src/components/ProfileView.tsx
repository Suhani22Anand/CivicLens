import React, { useState, useEffect } from 'react';
import { UserProfile, Post, AppLanguage } from '../types';
import { getTranslation } from '../utils/translate';
import { Shield, CheckCircle, Mail, Phone, MapPin, BadgeCheck, Clock, LogOut, Edit2 } from 'lucide-react';
import { motion } from 'motion/react';

interface ProfileViewProps {
  currentUser: UserProfile;
  posts: Post[];
  lang: AppLanguage;
  onLogout: () => void;
  onUpdateProfile: (updatedUser: UserProfile) => void;
}

export default function ProfileView({ currentUser, posts, lang, onLogout, onUpdateProfile }: ProfileViewProps) {
  // Filter posts created by this user
  const myPosts = posts.filter(p => p.author === currentUser.username);

  // States for filtering and sorting "My Registered Hazards"
  const [filterVerifyStatus, setFilterVerifyStatus] = useState<'all' | 'verified' | 'unverified'>('all');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterSortBy, setFilterSortBy] = useState<'recent' | 'severity'>('recent');
  const [filterLocation, setFilterLocation] = useState<string>('all');

  // Edit Profile States
  const [isEditing, setIsEditing] = useState(false);
  const [editUsername, setEditUsername] = useState(currentUser.username);
  const [editEmail, setEditEmail] = useState(currentUser.email);
  const [editPhone, setEditPhone] = useState(currentUser.phone);
  const [editState, setEditState] = useState(currentUser.location?.state || '');
  const [editCity, setEditCity] = useState(currentUser.location?.city || '');
  const [editError, setEditError] = useState<string | null>(null);
  const [editSuccess, setEditSuccess] = useState(false);

  // Sync edit state values if currentUser changes (e.g. simulation role swap)
  useEffect(() => {
    setEditUsername(currentUser.username);
    setEditEmail(currentUser.email);
    setEditPhone(currentUser.phone);
    setEditState(currentUser.location?.state || '');
    setEditCity(currentUser.location?.city || '');
    setEditError(null);
    setEditSuccess(false);
  }, [currentUser]);

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    setEditError(null);
    setEditSuccess(false);

    if (!editUsername.trim()) {
      setEditError('Username is compulsory.');
      return;
    }
    if (!editEmail.trim()) {
      setEditError('Email is compulsory.');
      return;
    }
    if (!editEmail.includes('@')) {
      setEditError('Please enter a valid email address.');
      return;
    }

    const updatedProfile: UserProfile = {
      ...currentUser,
      username: editUsername.trim(),
      email: editEmail.trim(),
      phone: editPhone.trim() || 'Not Specified',
      location: {
        state: editState.trim() || 'Not Specified',
        city: editCity.trim() || 'Not Specified'
      }
    };

    onUpdateProfile(updatedProfile);
    setEditSuccess(true);
    setTimeout(() => {
      setIsEditing(false);
      setEditSuccess(false);
    }, 1500);
  };

  // Dynamic lists from user's posts for drop-downs
  const distinctTypes = Array.from(new Set(myPosts.map(p => p.issueType)));
  const distinctCities = Array.from(new Set(myPosts.map(p => p.city)));

  // Filter and sort the user's posts
  let displayedMyPosts = myPosts.filter(p => {
    const matchesVerify = filterVerifyStatus === 'all' 
      ? true 
      : filterVerifyStatus === 'verified' 
        ? p.isVerified 
        : !p.isVerified;
    
    const matchesType = filterType === 'all' ? true : p.issueType === filterType;
    
    const matchesLoc = filterLocation === 'all' ? true : p.city === filterLocation;

    return matchesVerify && matchesType && matchesLoc;
  });

  // Apply sorting
  if (filterSortBy === 'recent') {
    displayedMyPosts.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  } else if (filterSortBy === 'severity') {
    const getSeverityWeight = (sev: string): number => {
      switch (sev) {
        case 'High': return 5;
        case 'Medium-High': return 4;
        case 'Medium': return 3;
        case 'Low-Medium': return 2;
        case 'Low': return 1;
        default: return 0;
      }
    };
    displayedMyPosts.sort((a, b) => getSeverityWeight(b.severity) - getSeverityWeight(a.severity));
  }

  return (
    <div className="space-y-8" id="user-profile-view">
      {/* Profile Info Header */}
      <div className="bg-white dark:bg-slate-800 p-8 rounded-3xl shadow-sm border border-slate-200/80 dark:border-slate-700 flex flex-col gap-6 relative overflow-hidden">
        <div className="flex flex-col md:flex-row gap-6 justify-between items-start md:items-center">
          <div className="flex items-center gap-5">
            {/* Avatar representation using initial */}
            <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-[#4c6c9a] to-[#6b9661] text-white flex items-center justify-center text-3xl font-black shadow-inner">
              {currentUser.username[0].toUpperCase()}
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h2 className="text-2xl font-bold text-slate-800 dark:text-white">
                  @{currentUser.username}
                </h2>
                <span className="bg-blue-50 dark:bg-blue-950/40 text-[#4c6c9a] text-xs font-bold px-2.5 py-0.5 rounded-full border border-blue-100 dark:border-blue-900/40 flex items-center gap-1">
                  <BadgeCheck className="w-3.5 h-3.5" />
                  {currentUser.role === 'Citizen' ? getTranslation(lang, 'roleCitizen') : 
                   currentUser.role === 'NGO Coordinator' ? getTranslation(lang, 'roleNGO') : 
                   getTranslation(lang, 'roleOfficer')}
                </span>
              </div>
              
              <div className="flex flex-wrap gap-4 text-xs font-medium text-slate-500 dark:text-slate-400 pt-1">
                <span className="flex items-center gap-1">
                  <Mail className="w-3.5 h-3.5" /> {currentUser.email}
                </span>
                <span className="flex items-center gap-1">
                  <Phone className="w-3.5 h-3.5" /> {currentUser.phone}
                </span>
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5" /> {currentUser.location.city}, {currentUser.location.state}
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
            {/* Edit Profile button */}
            <button 
              id="edit-profile-toggle-btn"
              onClick={() => setIsEditing(!isEditing)}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-[#4c6c9a] dark:text-[#6b9661] hover:text-[#4c6c9a]/80 bg-blue-50 dark:bg-blue-950/25 hover:bg-blue-100 dark:hover:bg-blue-900/40 rounded-xl transition-all border border-blue-200/30 dark:border-blue-900/40 shadow-sm justify-center cursor-pointer"
            >
              <Edit2 className="w-3.5 h-3.5" />
              <span>{isEditing ? 'Cancel Edit' : 'Edit Profile'}</span>
            </button>

            {/* Logout Option */}
            <button 
              id="profile-logout-btn"
              onClick={onLogout}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-red-600 hover:text-red-700 bg-red-50 dark:bg-red-950/20 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-xl transition-all border border-red-200/30 dark:border-red-900/40 shadow-sm justify-center cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Log Out</span>
            </button>
          </div>
        </div>

        {/* Expandable Edit Section */}
        {isEditing && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="border-t border-slate-100 dark:border-slate-700/60 pt-6 mt-2"
            id="expandable-profile-edit-section"
          >
            <form onSubmit={handleSaveProfile} className="space-y-4" id="edit-profile-form">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Username Field */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                    Username <span className="text-red-500 font-bold">* Compulsory</span>
                  </label>
                  <input
                    type="text"
                    value={editUsername}
                    onChange={(e) => setEditUsername(e.target.value)}
                    className="bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm font-medium text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#4c6c9a] transition-all"
                    placeholder="Enter username"
                    required
                  />
                </div>

                {/* Email Field */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                    Email Address <span className="text-red-500 font-bold">* Compulsory</span>
                  </label>
                  <input
                    type="email"
                    value={editEmail}
                    onChange={(e) => setEditEmail(e.target.value)}
                    className="bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm font-medium text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#4c6c9a] transition-all"
                    placeholder="Enter email"
                    required
                  />
                </div>

                {/* Phone Number Field */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                    Mobile Number <span className="text-slate-400 dark:text-slate-500 font-normal lowercase">(Optional)</span>
                  </label>
                  <input
                    type="text"
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                    className="bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm font-medium text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#4c6c9a] transition-all"
                    placeholder="Enter mobile (optional)"
                  />
                </div>

                {/* Location Input Grid */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                      City <span className="text-slate-400 dark:text-slate-500 font-normal lowercase">(Optional)</span>
                    </label>
                    <input
                      type="text"
                      value={editCity}
                      onChange={(e) => setEditCity(e.target.value)}
                      className="bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#4c6c9a] transition-all"
                      placeholder="e.g. Bengaluru"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                      State <span className="text-slate-400 dark:text-slate-500 font-normal lowercase">(Optional)</span>
                    </label>
                    <input
                      type="text"
                      value={editState}
                      onChange={(e) => setEditState(e.target.value)}
                      className="bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#4c6c9a] transition-all"
                      placeholder="e.g. Karnataka"
                    />
                  </div>
                </div>
              </div>

              {/* Status Notifications inside the Expandable Form */}
              {editError && (
                <div className="text-xs text-red-500 font-bold bg-red-50 dark:bg-red-950/20 p-2.5 rounded-xl border border-red-200/30">
                  {editError}
                </div>
              )}

              {editSuccess && (
                <div className="text-xs text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-50 dark:bg-emerald-950/20 p-2.5 rounded-xl border border-emerald-200/30">
                  🎉 Profile updated successfully! Saving modifications...
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-gradient-to-r from-[#4c6c9a] to-[#6b9661] text-white px-5 py-2 rounded-xl text-xs font-bold shadow-md hover:shadow-lg transition-all cursor-pointer"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </div>

      {/* My Reports history with filters */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Reports submitted */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-sm border border-slate-200/80 dark:border-slate-700">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <h3 className="font-bold text-lg text-slate-800 dark:text-white">
              My Registered Hazards ({displayedMyPosts.length})
            </h3>
          </div>

          {/* Filtering controls requested by user */}
          <div className="grid grid-cols-2 gap-2 mb-4 bg-slate-50 dark:bg-slate-900/60 p-3 rounded-2xl border border-slate-100 dark:border-slate-800">
            {/* Status: Verified vs Non-Verified */}
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-extrabold uppercase text-slate-400">Verification Status</label>
              <select
                value={filterVerifyStatus}
                onChange={(e) => setFilterVerifyStatus(e.target.value as any)}
                className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-1.5 text-xs font-bold text-slate-700 dark:text-slate-300 focus:outline-none"
              >
                <option value="all">All Statuses</option>
                <option value="verified">Verified Only</option>
                <option value="unverified">Non-Verified</option>
              </select>
            </div>

            {/* Issue Type */}
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-extrabold uppercase text-slate-400">Issue Type</label>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-1.5 text-xs font-bold text-slate-700 dark:text-slate-300 focus:outline-none"
              >
                <option value="all">All Types</option>
                {distinctTypes.map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>

            {/* Sort Order: Recent vs Severity */}
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-extrabold uppercase text-slate-400">Sort By</label>
              <select
                value={filterSortBy}
                onChange={(e) => setFilterSortBy(e.target.value as any)}
                className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-1.5 text-xs font-bold text-slate-700 dark:text-slate-300 focus:outline-none"
              >
                <option value="recent">Recents First</option>
                <option value="severity">Highest Severity</option>
              </select>
            </div>

            {/* Location Filter */}
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-extrabold uppercase text-slate-400">Location Filter</label>
              <select
                value={filterLocation}
                onChange={(e) => setFilterLocation(e.target.value)}
                className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-1.5 text-xs font-bold text-slate-700 dark:text-slate-300 focus:outline-none"
              >
                <option value="all">All Cities</option>
                {distinctCities.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>

          {displayedMyPosts.length === 0 ? (
            <div className="text-center py-12 border border-dashed border-slate-200 dark:border-slate-700 rounded-2xl">
              <Shield className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <p className="text-sm text-slate-500 dark:text-slate-400 font-semibold">
                No matching hazards found.
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Adjust your filter selections above to see other reports.
              </p>
            </div>
          ) : (
            <div className="space-y-4 max-h-[400px] overflow-y-auto pr-1">
              {displayedMyPosts.map(post => (
                <div key={post.id} className="p-4 rounded-xl border border-slate-100 dark:border-slate-700 flex gap-4 items-center hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors">
                  <img 
                    src={post.photoUrl} 
                    alt={post.issueType} 
                    className="w-14 h-14 rounded-lg object-cover flex-shrink-0 border border-slate-100 dark:border-slate-700"
                    referrerPolicy="no-referrer"
                  />
                  <div className="flex-grow space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-slate-800 dark:text-white">
                        {post.issueType}
                      </span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        post.status === 'Tackled' 
                          ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400' 
                          : 'bg-[#4c6c9a]/10 text-[#4c6c9a]'
                      }`}>
                        {post.status === 'Tackled' ? 'Tackled' : 'Prevailing'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1">
                      {post.description}
                    </p>
                    <div className="flex items-center justify-between text-[10px] text-slate-400 dark:text-slate-500">
                      <span>{new Date(post.timestamp).toLocaleDateString()}</span>
                      <span className="flex items-center gap-1 font-semibold text-[#6b9661]">
                        <CheckCircle className="w-3 h-3" /> {post.votesYesIssue} Verifications
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* User Account Settings & Information */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-sm border border-slate-200/80 dark:border-slate-700 flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-lg text-slate-800 dark:text-white mb-4">
              Identity Verification Status
            </h3>
            
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/10 border border-emerald-100/40 dark:border-emerald-900/30 flex items-start gap-3">
                <BadgeCheck className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-emerald-800 dark:text-emerald-400">
                    Aadhaar / National ID Connected
                  </span>
                  <span className="text-[11px] text-emerald-600 dark:text-emerald-500 mt-0.5">
                    Your account is fully verified. Your posts bypass general spam filters and gain instant upvote privileges.
                  </span>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-blue-50/50 dark:bg-blue-950/10 border border-blue-100/40 dark:border-blue-900/30 flex items-start gap-3">
                <Clock className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-blue-800 dark:text-blue-400">
                    Last Verification Vote cast
                  </span>
                  <span className="text-[11px] text-blue-600 dark:text-blue-500 mt-0.5">
                    Cast 2 hours ago on "Broken footpath slab, Bandra West". Thank you for validating town facts!
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-6 border-t border-slate-100 dark:border-slate-700/60 mt-6 flex justify-between items-center text-xs text-slate-400">
            <span>Registered Email Verified • June 2026</span>
            <button 
              className="text-xs font-bold text-[#4c6c9a] hover:underline"
              onClick={() => alert('This is a Hackathon presentation demo. Account settings are pre-configured.')}
            >
              Export Civic Profile
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
