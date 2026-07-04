import React, { useState } from 'react';
import { Post, UserProfile, AppLanguage } from '../types';
import { getTranslation } from '../utils/translate';
import { Shield, CheckCircle, Clock, Send, Radio, AlertTriangle, Lock, User, Image, Check, Star } from 'lucide-react';

interface DashboardViewProps {
  posts: Post[];
  currentUser: UserProfile;
  lang: AppLanguage;
  onUpdatePost?: (updatedPost: Post) => void;
}

export default function DashboardView({ posts, currentUser, lang, onUpdatePost }: DashboardViewProps) {
  const [hoveredSegment, setHoveredSegment] = useState<string | null>(null);
  const [verificationSubTab, setVerificationSubTab] = useState<'posted' | 'tackled'>('posted');

  // Derive statistics
  const totalReported = posts.length;
  const totalSolved = posts.filter(p => p.status === 'Tackled').length;
  const totalVerified = posts.filter(p => p.isVerified).length;
  const activeHazards = totalReported - totalSolved;

  // Calculate Civic Health Score (0 to 100)
  // Higher ratio of Solved/Reported increases health. High pending high-severity issues reduce it.
  const solvedRatio = totalReported > 0 ? totalSolved / totalReported : 1;
  const highSeverityPendingCount = posts.filter(p => p.status === 'Prevailing' && (p.severity === 'High' || p.severity === 'Medium-High')).length;
  const baseHealth = Math.round(60 + (solvedRatio * 30) - (highSeverityPendingCount * 2));
  const civicHealthScore = Math.min(100, Math.max(10, baseHealth));

  // Category counts for Donut Chart
  const categories = ['Potholes', 'Water Leakage', 'Damaged Streetlights', 'Waste Management', 'Public Infrastructure'];
  const categoryColors = {
    'Potholes': '#4c6c9a',
    'Water Leakage': '#3b82f6',
    'Damaged Streetlights': '#eab308',
    'Waste Management': '#6b9661',
    'Public Infrastructure': '#ec4899',
  };

  const categoryCounts = categories.reduce((acc, cat) => {
    acc[cat] = posts.filter(p => p.issueType === cat && p.status === 'Prevailing').length;
    return acc;
  }, {} as Record<string, number>);

  const totalActiveCategoryIssues = Object.values(categoryCounts).reduce((a, b) => a + b, 0) || 1;

  // Donut chart calculations
  let accumulatedAngle = 0;
  const donutSegments = categories.map(cat => {
    const count = categoryCounts[cat];
    const percentage = (count / totalActiveCategoryIssues) * 100;
    const angle = (count / totalActiveCategoryIssues) * 360;
    const startAngle = accumulatedAngle;
    accumulatedAngle += angle;

    return {
      name: cat,
      count,
      percentage: percentage.toFixed(0),
      startAngle,
      endAngle: accumulatedAngle,
      color: categoryColors[cat as keyof typeof categoryColors] || '#94a3b8',
    };
  });

  // Average resolution times (mock data based on active database status)
  const resolutionSpeedData = [
    { category: 'Potholes', days: 4.2, color: '#4c6c9a' },
    { category: 'Water Leakage', days: 1.5, color: '#3b82f6' },
    { category: 'Streetlights', days: 3.1, color: '#eab308' },
    { category: 'Waste Mgmt', days: 1.2, color: '#6b9661' },
    { category: 'Public Infra', days: 5.8, color: '#ec4899' },
  ];

  // Simulated live forwarded telemetry logs
  const forwardedLogs = posts
    .filter(p => p.isVerified)
    .map(p => ({
      id: `tele-${p.id}`,
      issueTitle: p.description.substring(0, 45) + '...',
      city: p.city,
      type: p.issueType,
      forwardedTo: p.forwardedTo[0] || 'Municipal Corporation',
      timestamp: new Date(new Date(p.timestamp).getTime() + 10 * 60 * 1000).toLocaleTimeString(), // 10 mins after report
      status: 'ACKNOWLEDGED'
    }))
    .slice(0, 5);

  // CHECK FOR AUTHORITY ROLE
  const isAuthority = currentUser.role === 'NGO Coordinator' || currentUser.role === 'Municipal Officer';

  // Dynamic states for authority workflow
  const [selectedWard, setSelectedWard] = useState<string>('All');
  const [officerAssigneeInput, setOfficerAssigneeInput] = useState<Record<string, string>>({});
  const [simulatedFileUploaded, setSimulatedFileUploaded] = useState<Record<string, string>>({});
  const [showAssignSuccess, setShowAssignSuccess] = useState<string | null>(null);

  if (isAuthority) {
    const authorityCity = currentUser.location?.city || 'Bengaluru';
    const authorityIssues = posts.filter(p => p.city.toLowerCase() === authorityCity.toLowerCase());

    // Gather unique wards present in this city's issues, fallback to a mock list
    const availableWards = Array.from(new Set(authorityIssues.map(p => p.ward).filter(Boolean))) as string[];
    const wardsList = availableWards.length > 0 ? availableWards : ['Ward 150 - Bellandur', 'Ward 174 - HSR Layout', 'Ward 151 - Koramangala'];

    // Filter by ward
    const displayedIssues = authorityIssues.filter(p => {
      if (selectedWard === 'All') return true;
      return p.ward === selectedWard;
    });

    const getSeverityRank = (sev: string): number => {
      switch (sev) {
        case 'High': return 6;
        case 'HighMedium': return 5;
        case 'Medium-High': return 4;
        case 'Medium': return 3;
        case 'Low-Medium': return 2;
        case 'Low': return 1;
        default: return 0;
      }
    };

    // Priority queue of verified and prevailing issues
    const priorityQueue = [...displayedIssues]
      .filter(p => p.isVerified && p.status === 'Prevailing')
      .sort((a, b) => getSeverityRank(b.severity) - getSeverityRank(a.severity));

    const totalActiveVerified = authorityIssues.filter(p => p.isVerified && p.status === 'Prevailing').length;
    const totalResolved = authorityIssues.filter(p => p.status === 'Tackled').length;

    const handleAssignOfficerSubmit = (postId: string) => {
      const assigneeName = officerAssigneeInput[postId]?.trim() || 'Officer S. Patil (Municipal Executive)';
      const postToUpdate = posts.find(p => p.id === postId);
      if (postToUpdate && onUpdatePost) {
        onUpdatePost({
          ...postToUpdate,
          assignedOfficer: assigneeName
        });
        setShowAssignSuccess(postId);
        setTimeout(() => setShowAssignSuccess(null), 3000);
      }
    };

    const handleSimulatePhotoUpload = (postId: string) => {
      // Simulate paving/restoration work image
      const proofImg = 'https://images.unsplash.com/photo-1541888946425-d81bb19240f5?auto=format&fit=crop&w=800&q=80';
      setSimulatedFileUploaded(prev => ({
        ...prev,
        [postId]: proofImg
      }));
    };

    const handleMarkResolvedSubmit = (postId: string) => {
      const postToUpdate = posts.find(p => p.id === postId);
      if (postToUpdate && onUpdatePost) {
        const proofUrl = simulatedFileUploaded[postId] || 'https://images.unsplash.com/photo-1541888946425-d81bb19240f5?auto=format&fit=crop&w=800&q=80';
        onUpdatePost({
          ...postToUpdate,
          status: 'Tackled',
          proofPhotoUrl: proofUrl,
          votesYesResolved: 2, // automatically matches required citizen threshold for consensus
        });
      }
    };

    return (
      <div className="space-y-8 animate-fade-in" id="authority-dashboard-view">
        {/* Top Banner with Government Emblem */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 text-white p-8 rounded-3xl relative overflow-hidden shadow-xl border border-slate-700/50">
          <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl"></div>
          <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-emerald-400 font-extrabold text-xs uppercase tracking-widest bg-emerald-500/10 px-3 py-1 rounded-full w-max">
                <Lock className="w-3.5 h-3.5" />
                <span>Authorized Government Access Only</span>
              </div>
              <h2 className="text-2xl md:text-3xl font-black tracking-tight">
                Authority Dashboard <span className="text-indigo-400">(MC/NGO Direct Portal)</span>
              </h2>
              <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
                We provide MCs, Municipalities, and NGOs free verified login accounts via govt-domain email verification (only @gov.in / @nic.in / registered NGO emails accepted). You are logged in as <span className="text-emerald-400 font-semibold">@{currentUser.username}</span> ({currentUser.role}).
              </p>
            </div>
            <div className="bg-slate-800/80 p-4 rounded-2xl border border-white/10 shrink-0 flex items-center gap-3">
              <Shield className="w-8 h-8 text-emerald-400 animate-pulse" />
              <div className="text-left">
                <p className="text-[10px] text-slate-400 font-bold uppercase">Active Division</p>
                <p className="text-sm font-bold text-slate-100">{authorityCity} Corporation</p>
              </div>
            </div>
          </div>
        </div>

        {/* Analytics Summary */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-700 shadow-sm">
            <span className="text-xs text-slate-400 font-bold uppercase">SLA Compliance Rate</span>
            <div className="flex items-baseline gap-1.5 mt-2">
              <span className="text-3xl font-extrabold text-slate-800 dark:text-white">98.2%</span>
              <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30 px-2 py-0.5 rounded-full">Target Met</span>
            </div>
            <p className="text-[10px] text-slate-400 mt-2">Based on HSR & Bellandur 48-Hour SLA mandate.</p>
          </div>

          <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-700 shadow-sm">
            <span className="text-xs text-slate-400 font-bold uppercase">Verified Queue Issues</span>
            <div className="flex items-baseline gap-1.5 mt-2">
              <span className="text-3xl font-extrabold text-slate-800 dark:text-white">{totalActiveVerified}</span>
              <span className="text-xs text-slate-400 font-medium">pending resolution</span>
            </div>
            <p className="text-[10px] text-slate-400 mt-2">Deduplicated from {authorityIssues.length} total raw citizen uploads.</p>
          </div>

          <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-700 shadow-sm">
            <span className="text-xs text-slate-400 font-bold uppercase">Resolved / Tackled</span>
            <div className="flex items-baseline gap-1.5 mt-2">
              <span className="text-3xl font-extrabold text-slate-800 dark:text-white">{totalResolved}</span>
              <span className="text-xs text-[#6b9661] font-bold uppercase tracking-wider">Tackled</span>
            </div>
            <p className="text-[10px] text-slate-400 mt-2">Proof photos uploaded and integrated with client app.</p>
          </div>

          <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-700 shadow-sm">
            <span className="text-xs text-slate-400 font-bold uppercase">Avg Resolution Speed</span>
            <div className="flex items-baseline gap-1.5 mt-2">
              <span className="text-3xl font-extrabold text-slate-800 dark:text-white">1.9 Days</span>
              <span className="text-[10px] text-indigo-500 font-bold">Fast-Tracked</span>
            </div>
            <p className="text-[10px] text-slate-400 mt-2">Top 10% performance among all municipal zones.</p>
          </div>
        </div>

        {/* Work Area */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Action Queue */}
          <div className="lg:col-span-2 space-y-6">
            <div className="flex justify-between items-center bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-700 shadow-sm">
              <div>
                <h3 className="font-extrabold text-slate-800 dark:text-white text-base">
                  Severity-Based Priority Queue
                </h3>
                <p className="text-xs text-slate-400">
                  Ground-truth issues sorted strictly by urgent public safety risks.
                </p>
              </div>

              {/* Ward-wise Filtering */}
              <div className="flex items-center gap-1.5 bg-gradient-to-r from-[#4c6c9a]/10 to-[#6b9661]/10 dark:from-[#4c6c9a]/20 dark:to-[#6b9661]/20 border border-[#4c6c9a]/35 dark:border-[#6b9661]/35 px-3 py-1.5 rounded-xl shadow-sm text-[#4c6c9a] dark:text-emerald-400">
                <span className="text-[10px] text-[#4c6c9a]/90 dark:text-emerald-400/90 font-black uppercase tracking-wider">Ward:</span>
                <select
                  value={selectedWard}
                  onChange={(e) => setSelectedWard(e.target.value)}
                  className="bg-transparent text-xs font-black text-[#4c6c9a] dark:text-emerald-400 focus:outline-none cursor-pointer pr-1 [&>option]:bg-white dark:[&>option]:bg-slate-800 [&>option]:text-slate-800 dark:[&>option]:text-white"
                >
                  <option value="All">All Wards</option>
                  {wardsList.map(ward => (
                    <option key={ward} value={ward}>{ward}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Queue Cards */}
            <div className="space-y-4">
              {priorityQueue.length === 0 ? (
                <div className="bg-white dark:bg-slate-800 p-12 text-center rounded-3xl border border-dashed border-slate-200 dark:border-slate-700">
                  <CheckCircle className="w-12 h-12 text-[#6b9661] mx-auto mb-3" />
                  <h4 className="font-extrabold text-slate-700 dark:text-slate-300 text-sm">
                    SLA Priority Queue is Empty!
                  </h4>
                  <p className="text-xs text-slate-400 dark:text-slate-500 max-w-xs mx-auto mt-1 leading-relaxed">
                    Outstanding! All verified hazards in {selectedWard} have been successfully tackled or assigned. Check back later for new clusters.
                  </p>
                </div>
              ) : (
                priorityQueue.map(issue => {
                  const hasOfficer = !!issue.assignedOfficer;
                  const isProofUploaded = !!simulatedFileUploaded[issue.id];
                  
                  return (
                    <div key={issue.id} className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200/80 dark:border-slate-700/80 shadow-sm p-6 space-y-4 hover:shadow-md transition-shadow">
                      <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="text-[9px] bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider">
                              SLA PRIORITY &bull; {issue.severity}
                            </span>
                            <span className="text-[10px] text-slate-400 font-bold">#{issue.id.toUpperCase()}</span>
                          </div>
                          <h4 className="font-extrabold text-sm text-slate-800 dark:text-white leading-tight">
                            {issue.issueType} near {issue.location.address}
                          </h4>
                        </div>

                        <div className="text-[10px] text-slate-400 font-semibold uppercase text-right leading-tight">
                          <p>Reported on</p>
                          <p className="font-mono mt-0.5 font-bold text-slate-500">{new Date(issue.timestamp).toLocaleDateString()}</p>
                        </div>
                      </div>

                      {/* Content Area */}
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
                        <div className="md:col-span-1">
                          <img 
                            src={issue.photoUrl} 
                            alt={issue.issueType}
                            className="w-full h-24 object-cover rounded-2xl border border-slate-100 dark:border-slate-700"
                            referrerPolicy="no-referrer"
                          />
                        </div>
                        <div className="md:col-span-3 space-y-2">
                          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed italic">
                            "{issue.description}"
                          </p>
                          <div className="flex flex-wrap gap-x-4 gap-y-1 text-[10px] font-bold text-slate-400">
                            <span>Author: @{issue.author}</span>
                            <span>&bull;</span>
                            <span>Dimensions: {issue.dimensions.area || 'N/A'}</span>
                            <span>&bull;</span>
                            <span>Ward: {issue.ward || 'General Zone'}</span>
                          </div>
                        </div>
                      </div>

                      {/* Workflows block */}
                      <div className="pt-4 border-t border-slate-100 dark:border-slate-700/60 flex flex-col sm:flex-row justify-between items-center gap-4">
                        {/* 1. Assign-To-Officer Workflow */}
                        <div className="w-full sm:w-auto flex items-center gap-2">
                          {hasOfficer ? (
                            <div className="flex items-center gap-1.5 text-xs text-amber-600 bg-amber-50 dark:bg-amber-950/20 px-3 py-1.5 rounded-xl font-bold border border-amber-200/40">
                              <User className="w-3.5 h-3.5" />
                              <span>Assigned to: {issue.assignedOfficer}</span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2 w-full">
                              <input 
                                type="text"
                                placeholder="Enter Officer Name..."
                                value={officerAssigneeInput[issue.id] || ''}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setOfficerAssigneeInput(prev => ({ ...prev, [issue.id]: val }));
                                }}
                                className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 w-44 text-slate-800 dark:text-slate-100"
                              />
                              <button
                                onClick={() => handleAssignOfficerSubmit(issue.id)}
                                className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-3 py-1.5 rounded-xl shadow-sm transition-colors"
                              >
                                Assign
                              </button>
                            </div>
                          )}
                          {showAssignSuccess === issue.id && (
                            <span className="text-[10px] text-emerald-600 font-bold animate-pulse">Officer Assigned!</span>
                          )}
                        </div>

                        {/* 2. Resolve + Proof Upload Workflow */}
                        <div className="w-full sm:w-auto flex items-center justify-end gap-2.5">
                          {hasOfficer && (
                            <>
                              {isProofUploaded ? (
                                <div className="flex items-center gap-1.5 text-xs text-emerald-600 bg-emerald-50 dark:bg-emerald-950/20 px-3 py-1.5 rounded-xl font-bold border border-emerald-200/40">
                                  <Image className="w-3.5 h-3.5" />
                                  <span>Proof Loaded!</span>
                                </div>
                              ) : (
                                <button
                                  onClick={() => handleSimulatePhotoUpload(issue.id)}
                                  className="flex items-center gap-1 bg-slate-100 hover:bg-slate-200 text-slate-700 dark:text-slate-100 dark:bg-slate-700 dark:hover:bg-slate-600 font-bold text-xs px-3 py-1.5 rounded-xl transition-colors border border-slate-200 dark:border-slate-600"
                                >
                                  <Image className="w-3.5 h-3.5" />
                                  <span>Attach Proof Photo</span>
                                </button>
                              )}

                              <button
                                onClick={() => handleMarkResolvedSubmit(issue.id)}
                                className="bg-[#6b9661] hover:bg-[#5a8051] text-white font-black text-xs px-4 py-1.5 rounded-xl shadow-sm transition-all"
                              >
                                Mark Resolved
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* SLA Metrics & Performance Sidebar */}
          <div className="space-y-6">
            <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-700 shadow-sm space-y-4">
              <h3 className="font-extrabold text-slate-800 dark:text-white text-base">
                Response-Time Analytics
              </h3>
              <p className="text-xs text-slate-400">
                Weekly turnaround timelines of our active dispatch division compared with targeted city standard SLA levels.
              </p>

              {/* Simulated turn-around chart */}
              <div className="space-y-3.5 pt-2">
                {[
                  { label: 'Potholes Resolution', days: 1.8, target: '3.0 Days Max', color: 'bg-[#4c6c9a]', width: '60%' },
                  { label: 'Water Leakage Repair', days: 1.1, target: '2.0 Days Max', color: 'bg-indigo-500', width: '55%' },
                  { label: 'Electrical Work (Lamp)', days: 2.3, target: '4.0 Days Max', color: 'bg-amber-500', width: '57%' },
                  { label: 'Garbage Clear-out', days: 0.9, target: '1.5 Days Max', color: 'bg-emerald-500', width: '60%' },
                  { label: 'Civic Infrastructure repair', days: 3.5, target: '5.0 Days Max', color: 'bg-rose-500', width: '70%' },
                ].map((item, idx) => (
                  <div key={idx} className="space-y-1">
                    <div className="flex justify-between text-[11px] font-bold">
                      <span className="text-slate-600 dark:text-slate-300">{item.label}</span>
                      <span className="text-slate-800 dark:text-white font-mono">{item.days}d average</span>
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden">
                      <div className={`h-full ${item.color} rounded-full`} style={{ width: item.width }}></div>
                    </div>
                    <span className="text-[9px] text-slate-400 font-semibold italic">Goal: {item.target}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* SLA Mandate Banner */}
            <div className="bg-gradient-to-br from-[#4c6c9a]/10 to-[#6b9661]/10 p-6 rounded-3xl border border-slate-200/60 dark:border-slate-700/60 space-y-3">
              <div className="flex items-center gap-2 text-[#4c6c9a]">
                <Star className="w-4 h-4 fill-current text-amber-500" />
                <h4 className="font-extrabold text-sm text-slate-800 dark:text-white">Unified Citizen Feedback Loop</h4>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Notice: All updates made here auto-reflect on the citizen-facing app in real time, closing the feedback loop and ensuring transparent resolution parameters.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8" id="impact-dashboard-view">
      {/* Top Banner with Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Civic Health Card */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-sm border border-slate-200/80 dark:border-slate-700 flex flex-col justify-between relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-[#6b9661]/10 rounded-full blur-2xl transition-transform group-hover:scale-125 duration-500"></div>
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-semibold text-slate-500 dark:text-slate-400">
                {getTranslation(lang, 'civicHealth')}
              </span>
              <Shield className="w-5 h-5 text-[#6b9661]" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-extrabold text-slate-800 dark:text-white">
                {civicHealthScore}%
              </span>
              <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30 px-2 py-0.5 rounded-full">
                Good Stand
              </span>
            </div>
          </div>
          <div className="mt-4">
            <div className="w-full bg-slate-100 dark:bg-slate-700 h-2.5 rounded-full overflow-hidden">
              <div 
                className="bg-gradient-to-r from-[#4c6c9a] to-[#6b9661] h-full transition-all duration-1000"
                style={{ width: `${civicHealthScore}%` }}
              ></div>
            </div>
            <span className="text-[11px] text-slate-400 dark:text-slate-500 mt-1.5 block">
              Calculated from resolution ratios and severity densities.
            </span>
          </div>
        </div>

        {/* Reported Hazards Card */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-sm border border-slate-200/80 dark:border-slate-700 flex flex-col justify-between relative overflow-hidden group">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-semibold text-slate-500 dark:text-slate-400">
                {getTranslation(lang, 'totalReported')}
              </span>
              <AlertTriangle className="w-5 h-5 text-[#4c6c9a]" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-extrabold text-slate-800 dark:text-white">
                {totalReported}
              </span>
              <span className="text-xs font-medium text-slate-400">
                active logs
              </span>
            </div>
          </div>
          <div className="text-[11px] text-slate-400 dark:text-slate-500 mt-4">
            <span className="text-[#4c6c9a] font-bold">{activeHazards}</span> pending and currently clustered.
          </div>
        </div>

        {/* Solved Card */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-sm border border-slate-200/80 dark:border-slate-700 flex flex-col justify-between relative overflow-hidden group">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-semibold text-slate-500 dark:text-slate-400">
                {getTranslation(lang, 'totalSolved')}
              </span>
              <CheckCircle className="w-5 h-5 text-[#6b9661]" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-extrabold text-slate-800 dark:text-white">
                {totalSolved}
              </span>
              <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30 px-2 py-0.5 rounded-full">
                {totalReported > 0 ? Math.round((totalSolved / totalReported) * 100) : 0}% Solved
              </span>
            </div>
          </div>
          <div className="text-[11px] text-slate-400 dark:text-slate-500 mt-4">
            Moved to the separate solved database after verification.
          </div>
        </div>

        {/* Interactive Verification Card */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-sm border border-slate-200/80 dark:border-slate-700 flex flex-col justify-between relative overflow-hidden group">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-extrabold text-slate-700 dark:text-slate-200 uppercase tracking-wider text-[11px]">
                Verification Center
              </span>
              <Shield className="w-5 h-5 text-indigo-500 animate-pulse" />
            </div>
            
            {/* 2 Subsections clickable inside the card */}
            <div className="space-y-2.5 mt-3">
              <button 
                onClick={() => setVerificationSubTab('posted')}
                className={`w-full flex items-center justify-between p-2 rounded-xl border text-xs font-bold transition-all ${
                  verificationSubTab === 'posted'
                    ? 'bg-indigo-50/80 dark:bg-indigo-950/30 border-indigo-200 text-indigo-600 dark:text-indigo-400 shadow-sm scale-[1.02]'
                    : 'bg-transparent border-slate-100 dark:border-slate-700/60 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-900'
                }`}
              >
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-amber-400"></span>
                  Posted Issues
                </span>
                <span className="bg-slate-100 dark:bg-slate-900 text-[10px] px-2 py-0.5 rounded-full">
                  {posts.filter(p => !p.isVerified).length} pending
                </span>
              </button>

              <button 
                onClick={() => setVerificationSubTab('tackled')}
                className={`w-full flex items-center justify-between p-2 rounded-xl border text-xs font-bold transition-all ${
                  verificationSubTab === 'tackled'
                    ? 'bg-[#6b9661]/10 border-[#6b9661]/20 text-[#6b9661] shadow-sm scale-[1.02]'
                    : 'bg-transparent border-slate-100 dark:border-slate-700/60 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-900'
                }`}
              >
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                  Tackled Issues
                </span>
                <span className="bg-slate-100 dark:bg-slate-900 text-[10px] px-2 py-0.5 rounded-full">
                  {posts.filter(p => p.status === 'Tackled' && (p.votesYesResolved ?? 0) < 2).length} voting
                </span>
              </button>
            </div>
          </div>
          <div className="text-[10px] text-slate-400 dark:text-slate-500 mt-4 leading-tight">
            Click subsections above to load respective 24-hr voting lists below.
          </div>
        </div>
      </div>

      {/* VERIFICATION HUB VOTING PANEL */}
      <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-700/80 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-700/60 pb-4">
          <div>
            <h3 className="font-extrabold text-lg text-slate-800 dark:text-white flex items-center gap-2">
              <Shield className="w-5 h-5 text-indigo-500" />
              Citizen Consensus Verification Hub
            </h3>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
              {verificationSubTab === 'posted' 
                ? 'Review and verify if newly reported hazards are genuine so they can be forwarded to municipal systems.'
                : 'Vote to verify if tackled issues have indeed been successfully resolved on the ground.'
              }
            </p>
          </div>

          {/* Quick tab toggle inside section header */}
          <div className="flex bg-slate-100 dark:bg-slate-900 p-1 rounded-xl self-start sm:self-auto">
            <button
              onClick={() => setVerificationSubTab('posted')}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                verificationSubTab === 'posted'
                  ? 'bg-white dark:bg-slate-700 text-slate-800 dark:text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              Verify Posted
            </button>
            <button
              onClick={() => setVerificationSubTab('tackled')}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                verificationSubTab === 'tackled'
                  ? 'bg-white dark:bg-slate-700 text-slate-800 dark:text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              Verify Tackled (Claimed)
            </button>
          </div>
        </div>

        {/* List of verification items */}
        {(() => {
          const filteredItems = verificationSubTab === 'posted'
            ? posts.filter(p => !p.isVerified)
            : posts.filter(p => p.status === 'Tackled' && (p.votesYesResolved ?? 0) < 2);

          if (filteredItems.length === 0) {
            return (
              <div className="py-10 text-center text-slate-400 dark:text-slate-500 text-xs font-semibold">
                <CheckCircle className="w-8 h-8 text-emerald-500 mx-auto mb-2 animate-bounce" />
                No pending items waiting for verification in this section. Good job!
              </div>
            );
          }

          return (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {filteredItems.map((post) => {
                const totalYes = verificationSubTab === 'posted' ? post.votesYesIssue : (post.votesYesResolved ?? 0);
                const totalNo = verificationSubTab === 'posted' ? post.votesNoIssue : (post.votesNoResolved ?? 0);
                const totalVotes = totalYes + totalNo;
                const yesPercent = totalVotes > 0 ? Math.round((totalYes / totalVotes) * 100) : 0;
                
                // Check if current user already voted
                const qType = verificationSubTab === 'posted' ? 'issue' : 'resolved';
                const userVote = post.userVotes.find(
                  v => v.username === currentUser.username && v.questionType === qType
                )?.vote;

                const handleVote = (voteType: 'YES' | 'NO') => {
                  if (!onUpdatePost) return;

                  let updatedVotes = [...post.userVotes];
                  const existingVoteIdx = post.userVotes.findIndex(
                    v => v.username === currentUser.username && v.questionType === qType
                  );

                  let yesDiff = 0;
                  let noDiff = 0;

                  if (existingVoteIdx > -1) {
                    const prevVote = updatedVotes[existingVoteIdx].vote;
                    if (prevVote === voteType) {
                      updatedVotes.splice(existingVoteIdx, 1);
                      if (voteType === 'YES') yesDiff = -1;
                      else noDiff = -1;
                    } else {
                      updatedVotes[existingVoteIdx].vote = voteType;
                      if (voteType === 'YES') {
                        yesDiff = 1;
                        noDiff = -1;
                      } else {
                        yesDiff = -1;
                        noDiff = 1;
                      }
                    }
                  } else {
                    updatedVotes.push({ username: currentUser.username, questionType: qType, vote: voteType });
                    if (voteType === 'YES') yesDiff = 1;
                    else noDiff = 1;
                  }

                  let vYesIssue = post.votesYesIssue;
                  let vNoIssue = post.votesNoIssue;
                  let vYesResolved = post.votesYesResolved ?? 0;
                  let vNoResolved = post.votesNoResolved ?? 0;

                  if (qType === 'issue') {
                    vYesIssue = Math.max(0, vYesIssue + yesDiff);
                    vNoIssue = Math.max(0, vNoIssue + noDiff);
                  } else {
                    vYesResolved = Math.max(0, vYesResolved + yesDiff);
                    vNoResolved = Math.max(0, vNoResolved + noDiff);
                  }

                  const updatedTotalIssue = vYesIssue + vNoIssue;
                  const isVerified = updatedTotalIssue > 0 && (vYesIssue / updatedTotalIssue) > 0.5;

                  onUpdatePost({
                    ...post,
                    userVotes: updatedVotes,
                    votesYesIssue: vYesIssue,
                    votesNoIssue: vNoIssue,
                    votesYesResolved: vYesResolved,
                    votesNoResolved: vNoResolved,
                    isVerified
                  });

                  alert(`Your consensus vote of "${voteType}" has been successfully logged!`);
                };

                return (
                  <div 
                    key={post.id}
                    className="bg-slate-50 dark:bg-slate-900/40 p-5 rounded-3xl border border-slate-100 dark:border-slate-800 flex flex-col justify-between hover:shadow-md transition-all duration-300"
                  >
                    <div>
                      {/* Header */}
                      <div className="flex items-center justify-between mb-3 text-[10px]">
                        <span className="font-extrabold uppercase text-[#4c6c9a] bg-[#4c6c9a]/10 px-2 py-0.5 rounded-full">
                          {post.issueType}
                        </span>
                        <span className="font-semibold text-slate-400">
                          @{post.author}
                        </span>
                      </div>

                      {/* Info */}
                      <p className="text-xs font-bold text-slate-800 dark:text-white leading-snug line-clamp-2">
                        {post.description}
                      </p>
                      
                      {post.location && (
                        <p className="text-[10px] text-slate-400 mt-1 font-semibold flex items-center gap-1">
                          📍 {post.location.address || `${post.city}, ${post.state}`}
                        </p>
                      )}

                      {/* Stats Bar */}
                      <div className="mt-4 space-y-1.5">
                        <div className="flex justify-between text-[10px] font-bold">
                          <span className="text-slate-400">Consensus Progress:</span>
                          <span className={yesPercent >= 50 ? 'text-[#6b9661]' : 'text-amber-500'}>
                            {yesPercent}% YES ({totalVotes} total votes)
                          </span>
                        </div>
                        <div className="w-full bg-slate-200 dark:bg-slate-800 h-2 rounded-full overflow-hidden flex">
                          <div 
                            className="bg-[#6b9661] h-full transition-all" 
                            style={{ width: `${yesPercent}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>

                    {/* Voting Actions */}
                    <div className="mt-5 pt-3.5 border-t border-slate-100 dark:border-slate-800/60 flex items-center gap-2">
                      <button
                        onClick={() => handleVote('YES')}
                        className={`flex-1 py-2 rounded-xl text-xs font-extrabold transition-all border ${
                          userVote === 'YES'
                            ? 'bg-[#6b9661] border-[#6b9661] text-white shadow-md scale-102 font-black'
                            : 'bg-white hover:bg-[#6b9661]/10 text-[#6b9661] border-[#6b9661]/20 dark:bg-slate-900'
                        }`}
                      >
                        {userVote === 'YES' ? '✓ Vouched' : 'Vouch YES'}
                      </button>
                      <button
                        onClick={() => handleVote('NO')}
                        className={`flex-1 py-2 rounded-xl text-xs font-extrabold transition-all border ${
                          userVote === 'NO'
                            ? 'bg-red-500 border-red-500 text-white shadow-md scale-102 font-black'
                            : 'bg-white hover:bg-red-500/10 text-red-500 border-red-500/20 dark:bg-slate-900'
                        }`}
                      >
                        {userVote === 'NO' ? '✗ Rejected' : 'Reject NO'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          );
        })()}
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Active Issues Donut Chart */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-sm border border-slate-200/80 dark:border-slate-700 flex flex-col">
          <div className="mb-4">
            <h3 className="font-bold text-lg text-slate-800 dark:text-white">
              Active Hazards Distribution
            </h3>
            <p className="text-xs text-slate-400 dark:text-slate-500">
              Breakdown of current clustered unsolved issues in our selected cities.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-around gap-6 flex-grow py-4">
            {/* SVG Donut */}
            <div className="relative w-48 h-48 flex-shrink-0">
              <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
                <circle cx="50" cy="50" r="40" fill="transparent" stroke="#f1f5f9" className="dark:stroke-slate-700" strokeWidth="12" />
                {donutSegments.map((seg, idx) => {
                  if (seg.count === 0) return null;
                  const radius = 40;
                  const circumference = 2 * Math.PI * radius;
                  const strokeDasharray = `${(seg.count / totalActiveCategoryIssues) * circumference} ${circumference}`;
                  // Calculating stroke offset
                  const offset = -(seg.startAngle / 360) * circumference;

                  return (
                    <circle
                      key={idx}
                      cx="50"
                      cy="50"
                      r={radius}
                      fill="transparent"
                      stroke={seg.color}
                      strokeWidth="12"
                      strokeDasharray={strokeDasharray}
                      strokeDashoffset={offset}
                      className="cursor-pointer transition-all duration-300 hover:stroke-[15px]"
                      onMouseEnter={() => setHoveredSegment(seg.name)}
                      onMouseLeave={() => setHoveredSegment(null)}
                    />
                  );
                })}
              </svg>
              {/* Inner Label */}
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-xs font-semibold text-slate-400 uppercase">
                  {hoveredSegment ? hoveredSegment.substring(0, 10) : 'Total Unsolved'}
                </span>
                <span className="text-2xl font-extrabold text-slate-800 dark:text-white">
                  {hoveredSegment 
                    ? categoryCounts[hoveredSegment]
                    : activeHazards
                  }
                </span>
              </div>
            </div>

            {/* Custom Legend */}
            <div className="flex flex-col gap-2.5 w-full sm:w-auto">
              {donutSegments.map((seg, idx) => (
                <div 
                  key={idx} 
                  className={`flex items-center gap-3 px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                    hoveredSegment === seg.name ? 'bg-slate-100 dark:bg-slate-700/50' : ''
                  }`}
                  onMouseEnter={() => setHoveredSegment(seg.name)}
                  onMouseLeave={() => setHoveredSegment(null)}
                >
                  <div className="w-3.5 h-3.5 rounded-full" style={{ backgroundColor: seg.color }}></div>
                  <div className="flex flex-col">
                    <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      {seg.name}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {seg.count} active ({seg.percentage}%)
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Resolution Speed Bar Chart */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-sm border border-slate-200/80 dark:border-slate-700 flex flex-col">
          <div className="mb-4">
            <h3 className="font-bold text-lg text-slate-800 dark:text-white">
              {getTranslation(lang, 'resolutionTime')} (Days)
            </h3>
            <p className="text-xs text-slate-400 dark:text-slate-500">
              Average timeline taken by BBMP, BMC, and partners to resolve issues.
            </p>
          </div>

          <div className="flex flex-col justify-end h-64 gap-5 px-4 pt-4">
            <div className="flex items-end justify-between h-48 border-b border-slate-100 dark:border-slate-700 pb-1 relative">
              {/* Horizontal Help lines */}
              <div className="absolute left-0 right-0 top-0 border-t border-dashed border-slate-100 dark:border-slate-800 pointer-events-none"></div>
              <div className="absolute left-0 right-0 top-1/2 border-t border-dashed border-slate-100 dark:border-slate-800 pointer-events-none"></div>

              {resolutionSpeedData.map((data, idx) => {
                // Scale so maximum days (6) is 100% height of h-48 container
                const heightPct = (data.days / 6) * 100;
                return (
                  <div key={idx} className="flex flex-col items-center justify-end h-full group w-12 relative z-10">
                    {/* The label is ALWAYS visible, styled in highly appealing emerald/mint green */}
                    <div className="text-[10px] font-black text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/80 border border-emerald-200 dark:border-emerald-800/80 px-1.5 py-0.5 rounded-full shadow-sm whitespace-nowrap mb-2 transform group-hover:scale-110 transition-transform duration-300 z-20">
                      {data.days}d
                    </div>
                    
                    {/* The bar itself */}
                    <div 
                      className="w-8 rounded-t-xl transition-all duration-500 group-hover:scale-x-110 origin-bottom cursor-pointer hover:brightness-110"
                      style={{ 
                        height: `${heightPct}%`, 
                        backgroundColor: data.color,
                        boxShadow: `0 4px 16px ${data.color}40`
                      }}
                    ></div>
                  </div>
                );
              })}
            </div>

            {/* Labels */}
            <div className="flex justify-between text-[10px] font-bold text-slate-500 dark:text-slate-400 tracking-tight">
              {resolutionSpeedData.map((data, idx) => (
                <div key={idx} className="w-12 text-center truncate">
                  {data.category}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Telemetry and Auto-Forward Logs (Google FCM + Cloud Run simulation) */}
      <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-sm border border-slate-200/80 dark:border-slate-700">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-bold text-lg text-slate-800 dark:text-white flex items-center gap-2">
              <Radio className="w-5 h-5 text-[#6b9661] animate-pulse" />
              {getTranslation(lang, 'forwardStatus')}
            </h3>
            <p className="text-xs text-slate-400 dark:text-slate-500">
              Live secure feeds routed to Municipal Corporations and NGOs once community consensus matches standard.
            </p>
          </div>
          <span className="text-[10px] font-mono font-semibold bg-emerald-50 dark:bg-emerald-950/30 text-[#6b9661] px-2.5 py-1 rounded-full flex items-center gap-1.5 border border-emerald-100 dark:border-emerald-900">
            <span className="w-2 h-2 bg-emerald-500 rounded-full animate-ping"></span>
            FCM GATEWAY ONLINE
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-sans">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-700 text-slate-400 uppercase tracking-wider text-[10px]">
                <th className="py-3 px-4 font-semibold">Logged Issue</th>
                <th className="py-3 px-4 font-semibold">Location</th>
                <th className="py-3 px-4 font-semibold">Destination Entity</th>
                <th className="py-3 px-4 font-semibold">Timestamp</th>
                <th className="py-3 px-4 font-semibold">API Protocol</th>
                <th className="py-3 px-4 font-semibold text-right">FCM Route</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700 text-slate-700 dark:text-slate-300">
              {forwardedLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400 dark:text-slate-500">
                    No verified reports currently available. Upvote reports on the 'All Reports' tab to authorize routing!
                  </td>
                </tr>
              ) : (
                forwardedLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="py-3 px-4 font-semibold text-slate-800 dark:text-slate-100">
                      {log.issueTitle}
                    </td>
                    <td className="py-3 px-4">
                      {log.city}
                    </td>
                    <td className="py-3 px-4">
                      <span className="bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded font-medium text-slate-600 dark:text-slate-300">
                        {log.forwardedTo}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-500 dark:text-slate-400 font-mono">
                      {log.timestamp}
                    </td>
                    <td className="py-3 px-4 text-slate-400 dark:text-slate-500 font-mono">
                      HTTPS / WebHook
                    </td>
                    <td className="py-3 px-4 text-right">
                      <span className="bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 text-[10px] font-mono px-2 py-0.5 rounded-full font-bold border border-emerald-100 dark:border-emerald-900/50">
                        SENT & ACK
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
