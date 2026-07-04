import React, { useState } from 'react';
import { Post, CommunityGroup, AppLanguage, SeverityType, Comment, UserProfile } from '../types';
import { getTranslation } from '../utils/translate';
import { motion, AnimatePresence } from 'motion/react';
import { Search, SlidersHorizontal, Users, AlertTriangle, ArrowRight, Layers, Sparkles, MapPin, Info, CheckCircle2, ChevronDown, Plus, MessageSquare, ShieldAlert, Trash2, Edit2, X, Check, ShieldCheck, Send, Lock, Database, PlusCircle, Home } from 'lucide-react';
import { statesAndCities } from '../data/sampleData';

interface HomeViewProps {
  posts: Post[];
  communities: CommunityGroup[];
  selectedState: string;
  setSelectedState: (state: string) => void;
  selectedCity: string;
  setSelectedCity: (city: string) => void;
  lang: AppLanguage;
  onSelectPost: (post: Post) => void;
  onCreateCommunity: (newGroup: Omit<CommunityGroup, 'id' | 'membersCount' | 'volunteersCount' | 'status'>) => void;
  onToggleTackledCheckbox: (postId: string, checked: boolean) => void;
  comments: Comment[];
  currentUser: UserProfile;
  onAddComment: (postId: string, text: string) => void;
  onEditComment: (commentId: string, text: string) => void;
  onDeleteComment: (commentId: string) => void;
  onUpdatePost: (updatedPost: Post) => void;
  theme?: 'light' | 'dark';
  isLoggedIn?: boolean;
  viewMode?: 'landing' | 'feed';
  onNavigateToTab?: (tab: 'HomePage' | 'Home' | 'AllPosts' | 'PostIssue' | 'Dashboard' | 'Profile' | 'CommunityGroups' | 'Admin') => void;
}

export default function HomeView({
  posts,
  communities,
  selectedState,
  setSelectedState,
  selectedCity,
  setSelectedCity,
  lang,
  onSelectPost,
  onCreateCommunity,
  onToggleTackledCheckbox,
  comments,
  currentUser,
  onAddComment,
  onEditComment,
  onDeleteComment,
  onUpdatePost,
  theme = 'light',
  isLoggedIn = false,
  viewMode = 'landing',
  onNavigateToTab,
}: HomeViewProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRecent, setFilterRecent] = useState(false);
  const [filterVerified, setFilterVerified] = useState(false);
  const [sortBySeverity, setSortBySeverity] = useState(true);
  const [severityFilter, setSeverityFilter] = useState('all');
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});
  const [exploredCategory, setExploredCategory] = useState<string | null>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  
  // Community form modal state
  const [showCommModal, setShowCommModal] = useState(false);
  const [commTitle, setCommTitle] = useState('');
  const [commDesc, setCommDesc] = useState('');
  const [commType, setCommType] = useState('Waste Management');
  const [commMeet, setCommMeet] = useState('');

  // Interactive Severity Conflict Smart Merge State
  const [mergeS1, setMergeS1] = useState<'Low' | 'Medium' | 'High'>('Low');
  const [mergeS2, setMergeS2] = useState<'Low' | 'Medium' | 'High'>('High');

  // Local state for single post detail view
  const [selectedDetailPost, setSelectedDetailPost] = useState<Post | null>(null);
  const [newCommentText, setNewCommentText] = useState('');
  const [aiFilterWarning, setAiFilterWarning] = useState<string | null>(null);
  const [isCheckingAi, setIsCheckingAi] = useState(false);
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editingCommentText, setEditingCommentText] = useState('');
  const [isEditingPost, setIsEditingPost] = useState(false);
  const [editDesc, setEditDesc] = useState('');
  const [editArea, setEditArea] = useState('');
  const [editDepth, setEditDepth] = useState('');

  // Voting action
  const handleVote = (questionType: 'issue' | 'resolved', vote: 'YES' | 'NO') => {
    if (!selectedDetailPost) return;

    const existingVoteIdx = selectedDetailPost.userVotes.findIndex(
      v => v.username === currentUser.username && v.questionType === questionType
    );

    let updatedVotes = [...selectedDetailPost.userVotes];
    let yesDiff = 0;
    let noDiff = 0;

    if (existingVoteIdx > -1) {
      const prevVote = updatedVotes[existingVoteIdx].vote;
      if (prevVote === vote) {
        updatedVotes.splice(existingVoteIdx, 1);
        if (vote === 'YES') yesDiff = -1;
        else noDiff = -1;
      } else {
        updatedVotes[existingVoteIdx].vote = vote;
        if (vote === 'YES') {
          yesDiff = 1;
          noDiff = -1;
        } else {
          yesDiff = -1;
          noDiff = 1;
        }
      }
    } else {
      updatedVotes.push({ username: currentUser.username, questionType, vote });
      if (vote === 'YES') yesDiff = 1;
      else noDiff = 1;
    }

    let votesYesIssue = selectedDetailPost.votesYesIssue;
    let votesNoIssue = selectedDetailPost.votesNoIssue;
    let votesYesResolved = selectedDetailPost.votesYesResolved;
    let votesNoResolved = selectedDetailPost.votesNoResolved;

    if (questionType === 'issue') {
      votesYesIssue += yesDiff;
      votesNoIssue += noDiff;
    } else {
      votesYesResolved += yesDiff;
      votesNoResolved += noDiff;
    }

    const totalIssueVotes = votesYesIssue + votesNoIssue;
    const isVerified = totalIssueVotes > 0 && (votesYesIssue / totalIssueVotes) > 0.5;

    const updatedPost = {
      ...selectedDetailPost,
      userVotes: updatedVotes,
      votesYesIssue,
      votesNoIssue,
      votesYesResolved,
      votesNoResolved,
      isVerified,
    };

    onUpdatePost(updatedPost);
    setSelectedDetailPost(updatedPost);
  };

  // Author Edit Publish
  const handleEditSave = () => {
    if (!selectedDetailPost) return;
    const updatedPost = {
      ...selectedDetailPost,
      description: editDesc,
      dimensions: {
        area: editArea || undefined,
        depth: editDepth || undefined,
      }
    };
    onUpdatePost(updatedPost);
    setSelectedDetailPost(updatedPost);
    setIsEditingPost(false);
  };

  // Trigger editing
  const startEditing = () => {
    if (!selectedDetailPost) return;
    setEditDesc(selectedDetailPost.description);
    setEditArea(selectedDetailPost.dimensions.area || '');
    setEditDepth(selectedDetailPost.dimensions.depth || '');
    setIsEditingPost(true);
  };

  // Comment submission with simulated AI moderation
  const handleCommentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCommentText.trim() || !selectedDetailPost) return;

    setIsCheckingAi(true);
    setAiFilterWarning(null);

    setTimeout(() => {
      setIsCheckingAi(false);
      const text = newCommentText.toLowerCase();

      const spamKeywords = ['sucks', 'stupid', 'idiots', 'government', 'hate', 'great app', 'hello', 'nice', 'awesome'];
      const containsSpam = spamKeywords.some(keyword => text.includes(keyword));

      const issueWords = selectedDetailPost.issueType.toLowerCase().split(/\s+/);
      const descWords = selectedDetailPost.description.toLowerCase().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g,"").split(/\s+/).filter(w => w.length > 3);
      const addrWords = selectedDetailPost.location.address.toLowerCase().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g,"").split(/\s+/).filter(w => w.length > 3);

      const postKeywords = new Set<string>([
        ...issueWords,
        ...descWords,
        ...addrWords,
        'repair', 'fix', 'work', 'municipal', 'officer', 'solved', 'unsolved', 'hazard', 'tackled', 'status',
        'dimension', 'size', 'area', 'depth', 'measure', 'inch', 'feet', 'meter', 'cm', 'leak', 'water', 'pipe',
        'pothole', 'road', 'asphalt', 'street', 'light', 'lamp', 'bulb', 'wire', 'waste', 'garbage', 'trash', 'dump',
        'concrete', 'asphalt', 'patch', 'paved', 'drainage', 'electrician', 'cleanup', 'potholes', 'streetlights',
        'roadside', 'garbage', 'puddle', 'spill', 'repaired', 'completed', 'verified', 'inspect', 'pothole'
      ]);

      if (selectedDetailPost.dimensions.area) {
        selectedDetailPost.dimensions.area.toLowerCase().split(/\s+/).forEach(w => { if (w.length > 2) postKeywords.add(w); });
      }
      if (selectedDetailPost.dimensions.depth) {
        selectedDetailPost.dimensions.depth.toLowerCase().split(/\s+/).forEach(w => { if (w.length > 2) postKeywords.add(w); });
      }

      const commentWords = text.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g,"").split(/\s+/).filter(w => w.length > 2);
      
      const isRelated = commentWords.some(word => {
        return postKeywords.has(word) || Array.from(postKeywords).some(pk => pk.includes(word) || word.includes(pk));
      });

      if (containsSpam) {
        setAiFilterWarning(
          'AI Moderator blocked comment: Comments on CivicLens must be constructive and constructive-only. Outbursts, spam, or abusive keywords are automatically filtered.'
        );
        return;
      }

      if (!isRelated && commentWords.length > 0) {
        setAiFilterWarning(
          `AI Moderator blocked comment: This comment is not related to the specific details of this ${selectedDetailPost.issueType} report (location: "${selectedDetailPost.location.address}", details: "${selectedDetailPost.description.substring(0, 30)}..."). CivicLens AI Moderator only permits comments containing constructive updates directly related to this specific hazard (e.g. repair updates, size changes, site updates).`
        );
        return;
      }

      onAddComment(selectedDetailPost.id, newCommentText);
      setNewCommentText('');
      setAiFilterWarning(null);
    }, 1000);
  };

  // Map severity string to numeric weight for sorting
  const getSeverityWeight = (sev: string): number => {
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

  // Severity Smart Merge algorithm as defined in user flow:
  // - Low + High -> Medium
  // - Low + Medium -> Low-Medium
  // - Medium + High -> Medium-High
  // - Otherwise: standard Low / Medium / High
  const calculateSmartMerge = (s1: 'Low' | 'Medium' | 'High', s2: 'Low' | 'Medium' | 'High'): string => {
    const list = [s1, s2];
    if (list.includes('Low') && list.includes('High')) return 'Medium';
    if (list.includes('Low') && list.includes('Medium')) return 'Low-Medium';
    if (list.includes('Medium') && list.includes('High')) return 'Medium-High';
    return s1; // If they are the same
  };

  const smartMergeResult = calculateSmartMerge(mergeS1, mergeS2);

  // Filter posts based on selected State & City AND unsolved or pending voting consensus
  const cityPosts = posts.filter(
    p => p.state === selectedState && p.city === selectedCity && (p.status === 'Prevailing' || (p.status === 'Tackled' && (p.votesYesResolved ?? 0) < 2))
  );

  // Apply filters and searches
  let filteredPosts = cityPosts.filter(p => {
    const matchesSearch = p.description.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          p.issueType.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesVerified = filterVerified ? p.isVerified : true;
    const matchesSeverity = severityFilter === 'all' ? true : p.severity.toLowerCase() === severityFilter.toLowerCase();
    return matchesSearch && matchesVerified && matchesSeverity;
  });

  // Apply sorting based on state
  if (sortBySeverity) {
    filteredPosts.sort((a, b) => getSeverityWeight(b.severity) - getSeverityWeight(a.severity));
  } else if (filterRecent) {
    filteredPosts.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  } else {
    // default secondary
    filteredPosts.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }

  // AI-Clustering grouping by Issue Type
  const categories = Array.from(new Set(filteredPosts.map(p => p.issueType)));

  // Filter communities for the active city
  const cityCommunities = communities.filter(c => c.city === selectedCity);

  const handleCreateCommunitySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commTitle.trim() || !commDesc.trim()) {
      alert('Please fill out all fields.');
      return;
    }

    onCreateCommunity({
      city: selectedCity,
      issueType: commType,
      title: commTitle,
      description: commDesc,
      nextMeetup: commMeet.trim() ? commMeet : undefined,
    });

    // Reset and close
    setCommTitle('');
    setCommDesc('');
    setCommMeet('');
    setShowCommModal(false);
  };

  if (selectedDetailPost) {
    const activeComments = comments.filter(c => c.postId === selectedDetailPost.id);
    
    const severityColors = {
      'High': 'bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 border-red-100 dark:border-red-900/40',
      'Medium-High': 'bg-orange-50 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400 border-orange-100 dark:border-orange-900/40',
      'Medium': 'bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border-amber-100 dark:border-amber-900/40',
      'Low-Medium': 'bg-yellow-50 dark:bg-yellow-950/40 text-yellow-600 dark:text-yellow-400 border-yellow-100 dark:border-yellow-900/40',
      'Low': 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border-emerald-100 dark:border-emerald-900/40'
    };

    return (
      <div className="space-y-6 animate-fade-in" id="single-post-detail-view">
        {/* Back and Navigation Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between bg-white dark:bg-slate-800 p-5 rounded-3xl border border-slate-200/80 dark:border-slate-700 shadow-sm gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                setSelectedDetailPost(null);
                setAiFilterWarning(null);
                setNewCommentText('');
              }}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer shadow-sm hover:scale-[1.03]"
            >
              ← Back to Feed
            </button>
            <div>
              <span className="text-[10px] text-[#4c6c9a] dark:text-blue-400 font-extrabold uppercase tracking-widest block">
                Active Hazard Details
              </span>
              <h2 className="text-base font-black text-slate-900 dark:text-white">
                {selectedDetailPost.issueType} Report Details
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs font-bold text-slate-500 bg-slate-50 dark:bg-slate-900/40 px-3 py-1.5 rounded-xl border border-slate-100 dark:border-slate-800 self-start sm:self-auto">
            <ShieldCheck className="w-4 h-4 text-[#6b9661]" />
            <span>AI Verified Citizen Database</span>
          </div>
        </div>

        {/* Main detail columns */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* LEFT: Details & Consensus Voting */}
          <div className="lg:col-span-7 space-y-6">
            <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200/80 dark:border-slate-700 shadow-sm p-6 space-y-5">
              {/* Photo */}
              <div className="relative aspect-video rounded-2xl overflow-hidden border border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-900">
                <img 
                  src={selectedDetailPost.photoUrl} 
                  alt={selectedDetailPost.issueType} 
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute top-3.5 right-3.5">
                  <span className={`text-xs font-black px-3.5 py-1.5 rounded-full border shadow-md uppercase tracking-wider ${
                    severityColors[selectedDetailPost.severity as keyof typeof severityColors] || 'bg-slate-100 text-slate-600'
                  }`}>
                    {selectedDetailPost.severity} Severity
                  </span>
                </div>
              </div>

              {/* Status and description */}
              <div className="space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-700/60 pb-3">
                  <div className="flex items-center gap-2">
                    <span className={`w-2.5 h-2.5 rounded-full ${selectedDetailPost.status === 'Tackled' ? 'bg-[#6b9661]' : 'bg-red-500'} animate-pulse`}></span>
                    <span className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-350">
                      Status: {selectedDetailPost.status === 'Tackled' ? 'Tackled (Pending Public Voting)' : 'Prevailing / Active'}
                    </span>
                  </div>

                  {selectedDetailPost.isVerified && (
                    <span className="bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 border border-emerald-100 dark:border-emerald-900/50 shadow-sm">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Verified Consensus</span>
                    </span>
                  )}
                </div>

                {isEditingPost ? (
                  <div className="space-y-4 bg-slate-50 dark:bg-slate-900/40 p-4 rounded-2xl border border-slate-150 dark:border-slate-800">
                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase tracking-wider text-slate-400">Description</label>
                      <textarea
                        value={editDesc}
                        onChange={(e) => setEditDesc(e.target.value)}
                        className="w-full text-xs p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#4c6c9a]"
                        rows={3}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[10px] font-black uppercase tracking-wider text-slate-400">Estimated Area</label>
                        <input
                          type="text"
                          value={editArea}
                          onChange={(e) => setEditArea(e.target.value)}
                          className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#4c6c9a]"
                          placeholder="e.g. 5m x 2m"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-black uppercase tracking-wider text-slate-400">Estimated Depth</label>
                        <input
                          type="text"
                          value={editDepth}
                          onChange={(e) => setEditDepth(e.target.value)}
                          className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#4c6c9a]"
                          placeholder="e.g. 15 cm"
                        />
                      </div>
                    </div>
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => setIsEditingPost(false)}
                        className="px-3 py-1.5 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg text-xs font-bold"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleEditSave}
                        className="px-3.5 py-1.5 bg-[#4c6c9a] hover:bg-[#5b80b2] text-white rounded-lg text-xs font-black shadow"
                      >
                        Publish Changes
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <p className="text-sm text-slate-700 dark:text-slate-200 leading-relaxed font-medium">
                      {selectedDetailPost.description}
                    </p>

                    {/* Metadata items */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 dark:bg-slate-900/40 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 text-xs">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                          <MapPin className="w-4 h-4 text-[#4c6c9a]" />
                          <div>
                            <span className="font-extrabold block text-slate-700 dark:text-slate-200">Location Details</span>
                            <span className="text-[11px] font-bold block">{selectedDetailPost.location.address}</span>
                            <span className="text-[10px] text-slate-400 font-bold block">{selectedDetailPost.city}, {selectedDetailPost.state}</span>
                          </div>
                        </div>

                        {selectedDetailPost.location.gps && (
                          <div className="text-[10px] font-mono text-slate-400 bg-white dark:bg-slate-900 p-1.5 rounded-lg border border-slate-100 dark:border-slate-800/80 inline-block">
                            GPS: Lat {selectedDetailPost.location.gps.lat.toFixed(4)}, Lng {selectedDetailPost.location.gps.lng.toFixed(4)}
                          </div>
                        )}
                      </div>

                      <div className="space-y-2 border-t sm:border-t-0 sm:border-l border-slate-100 dark:border-slate-800/80 sm:pl-4">
                        <span className="font-extrabold block text-slate-700 dark:text-slate-200">Physical Dimensions</span>
                        <div className="grid grid-cols-2 gap-2 text-[11px]">
                          <div className="bg-white dark:bg-slate-950/60 p-2 rounded-xl border border-slate-100 dark:border-slate-800/60">
                            <span className="text-[9px] text-slate-400 font-bold uppercase block">Area Size</span>
                            <span className="font-mono font-black text-slate-700 dark:text-slate-350">{selectedDetailPost.dimensions.area || 'Not Measured'}</span>
                          </div>
                          <div className="bg-white dark:bg-slate-950/60 p-2 rounded-xl border border-slate-100 dark:border-slate-800/60">
                            <span className="text-[9px] text-slate-400 font-bold uppercase block">Avg Depth</span>
                            <span className="font-mono font-black text-slate-700 dark:text-slate-350">{selectedDetailPost.dimensions.depth || 'Not Measured'}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Author info */}
                    <div className="flex flex-wrap items-center justify-between text-xs text-slate-400 border-t border-slate-100 dark:border-slate-700/60 pt-3 gap-2">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold">Reported by:</span>
                        <span className="text-slate-700 dark:text-slate-300 font-black">@{selectedDetailPost.author}</span>
                        <span className="text-slate-200 dark:text-slate-700">|</span>
                        <span className="font-mono">{new Date(selectedDetailPost.timestamp).toLocaleString()}</span>
                      </div>

                      {/* Author Edit Link */}
                      {selectedDetailPost.author === currentUser.username && (
                        <button
                          onClick={startEditing}
                          className="text-[#4c6c9a] hover:text-[#5b80b2] text-[11px] font-black flex items-center gap-1 hover:underline cursor-pointer"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                          <span>Edit Report Details</span>
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Solved Status Interactive Marker */}
              <div className="bg-[#6b9661]/10 dark:bg-[#6b9661]/5 border border-[#6b9661]/25 p-4 rounded-2xl flex items-start gap-3">
                <input
                  id="detail-tackled-check"
                  type="checkbox"
                  checked={selectedDetailPost.status === 'Tackled'}
                  onChange={(e) => {
                    onToggleTackledCheckbox(selectedDetailPost.id, e.target.checked);
                    setSelectedDetailPost({
                      ...selectedDetailPost,
                      status: e.target.checked ? 'Tackled' : 'Prevailing',
                      votesYesResolved: e.target.checked ? 1 : 0,
                      votesNoResolved: 0
                    });
                  }}
                  className="w-5 h-5 text-[#6b9661] focus:ring-[#6b9661] border-slate-300 rounded cursor-pointer accent-[#6b9661] mt-0.5"
                />
                <div>
                  <label htmlFor="detail-tackled-check" className="text-xs font-black text-slate-800 dark:text-slate-200 cursor-pointer flex items-center gap-1">
                    {selectedDetailPost.status === 'Tackled' ? (
                      <span className="text-[#6b9661] font-extrabold flex items-center gap-1">
                        ✓ Marked as Tackled / Solved (Awaiting Public Consensus)
                      </span>
                    ) : (
                      <span>Mark this Hazard as Solved / Repaired</span>
                    )}
                  </label>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                    Once marked as tackled, the system initiates a real-time 24-hour verification clock. 
                    Other citizens must cast verification votes to confirm the fix before it moves officially into the "Solved Database".
                  </p>
                </div>
              </div>
            </div>

            {/* Peer-Consensus Verification Center */}
            <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200/80 dark:border-slate-700 shadow-sm p-6 space-y-4">
              <div>
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-extrabold uppercase tracking-widest block">
                  Peer-Consensus Voting Console
                </span>
                <h3 className="text-sm font-black text-slate-900 dark:text-white mt-0.5">
                  Citizen-Led Validation & Status Consensus
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Question 1: Is this hazard active? */}
                <div className="p-4 bg-slate-50 dark:bg-slate-900/40 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-3 flex flex-col justify-between">
                  <div>
                    <span className="text-[9px] text-slate-400 font-bold uppercase block">Verification Check 1</span>
                    <h4 className="text-xs font-extrabold text-slate-800 dark:text-slate-250 leading-tight mt-1">
                      Is this hazard active and prevailing at this location?
                    </h4>
                  </div>

                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleVote('issue', 'YES')}
                        className={`flex-1 py-2 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 cursor-pointer transition-all ${
                          selectedDetailPost.userVotes.some(v => v.username === currentUser.username && v.questionType === 'issue' && v.vote === 'YES')
                            ? 'bg-[#4c6c9a] text-white shadow-sm scale-95'
                            : 'bg-white hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        <span>Yes, Active</span>
                        <span className="bg-slate-100 dark:bg-slate-900/60 text-[10px] px-1.5 py-0.5 rounded-full font-mono text-[#4c6c9a]">
                          {selectedDetailPost.votesYesIssue}
                        </span>
                      </button>

                      <button
                        onClick={() => handleVote('issue', 'NO')}
                        className={`flex-1 py-2 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 cursor-pointer transition-all ${
                          selectedDetailPost.userVotes.some(v => v.username === currentUser.username && v.questionType === 'issue' && v.vote === 'NO')
                            ? 'bg-red-600 text-white shadow-sm scale-95'
                            : 'bg-white hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        <span>No, False</span>
                        <span className="bg-slate-100 dark:bg-slate-900/60 text-[10px] px-1.5 py-0.5 rounded-full font-mono text-[#4c6c9a]">
                          {selectedDetailPost.votesNoIssue}
                        </span>
                      </button>
                    </div>

                    <div className="text-[9px] text-slate-400 font-medium leading-normal">
                      A report gains "Verified" status once YES vote threshold is met.
                    </div>
                  </div>
                </div>

                {/* Question 2: Is this fixed? */}
                <div className="p-4 bg-slate-50 dark:bg-slate-900/40 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-3 flex flex-col justify-between">
                  <div>
                    <span className="text-[9px] text-slate-400 font-bold uppercase block">Verification Check 2</span>
                    <h4 className="text-xs font-extrabold text-slate-800 dark:text-slate-250 leading-tight mt-1">
                      Confirm fix: Is this issue fully solved/repaired?
                    </h4>
                  </div>

                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <button
                        disabled={selectedDetailPost.status !== 'Tackled'}
                        onClick={() => handleVote('resolved', 'YES')}
                        className={`flex-1 py-2 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 cursor-pointer transition-all ${
                          selectedDetailPost.status !== 'Tackled'
                            ? 'opacity-40 cursor-not-allowed'
                            : selectedDetailPost.userVotes.some(v => v.username === currentUser.username && v.questionType === 'resolved' && v.vote === 'YES')
                              ? 'bg-emerald-600 text-white shadow-sm scale-95'
                              : 'bg-white hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        <span>Yes, Solved</span>
                        <span className="bg-slate-100 dark:bg-slate-900/60 text-[10px] px-1.5 py-0.5 rounded-full font-mono text-[#4c6c9a]">
                          {selectedDetailPost.votesYesResolved || 0}
                        </span>
                      </button>

                      <button
                        disabled={selectedDetailPost.status !== 'Tackled'}
                        onClick={() => handleVote('resolved', 'NO')}
                        className={`flex-1 py-2 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 cursor-pointer transition-all ${
                          selectedDetailPost.status !== 'Tackled'
                            ? 'opacity-40 cursor-not-allowed'
                            : selectedDetailPost.userVotes.some(v => v.username === currentUser.username && v.questionType === 'resolved' && v.vote === 'NO')
                              ? 'bg-red-600 text-white shadow-sm scale-95'
                              : 'bg-white hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        <span>No, Active</span>
                        <span className="bg-slate-100 dark:bg-slate-900/60 text-[10px] px-1.5 py-0.5 rounded-full font-mono text-[#4c6c9a]">
                          {selectedDetailPost.votesNoResolved || 0}
                        </span>
                      </button>
                    </div>

                    <div className="text-[9px] text-slate-400 font-medium leading-normal">
                      Requires at least 2 public YES votes to be moved to the Solved Database.
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT: Comments with AI Moderator */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200/80 dark:border-slate-700 shadow-sm p-6 flex flex-col h-full min-h-[500px]">
              <div className="border-b border-slate-100 dark:border-slate-700/60 pb-3 mb-4 flex items-center justify-between">
                <div>
                  <h3 className="font-extrabold text-slate-900 dark:text-white text-sm flex items-center gap-1.5">
                    <MessageSquare className="w-4 h-4 text-[#4c6c9a]" />
                    <span>Community updates</span>
                  </h3>
                  <p className="text-[10px] text-slate-400 font-bold">
                    {activeComments.length} {activeComments.length === 1 ? 'comment' : 'comments'} registered
                  </p>
                </div>

                <span className="bg-[#4c6c9a]/10 text-[#4c6c9a] dark:text-blue-400 text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-emerald-500 animate-pulse" />
                  <span>AI Moderated</span>
                </span>
              </div>

              {/* Chat list */}
              <div className="flex-1 space-y-3 overflow-y-auto pr-1 max-h-[380px]">
                {activeComments.length === 0 ? (
                  <div className="py-12 text-center text-slate-400 dark:text-slate-500 text-xs font-bold border border-dashed border-slate-100 dark:border-slate-800/80 rounded-2xl bg-slate-50/50 dark:bg-slate-900/20">
                    No verified reports comments yet. Be the first to post an update!
                  </div>
                ) : (
                  [...activeComments].reverse().map((comm) => (
                    <div 
                      key={comm.id} 
                      className={`p-3.5 rounded-2xl text-xs space-y-1.5 border transition-all ${
                        comm.author === currentUser.username 
                          ? 'bg-[#4c6c9a]/5 dark:bg-[#4c6c9a]/10 border-[#4c6c9a]/15 text-slate-800 dark:text-slate-100'
                          : 'bg-slate-50 dark:bg-slate-900/40 border-slate-100 dark:border-slate-800 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5 font-bold">
                          <span className="text-[#4c6c9a] dark:text-blue-400 font-black">@{comm.author}</span>
                          {comm.author === selectedDetailPost.author && (
                            <span className="bg-[#4c6c9a]/10 text-[#4c6c9a] text-[8px] px-1 py-0.2 rounded font-black uppercase tracking-wide">Author</span>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-2 text-[9px] text-slate-400">
                          <span>{new Date(comm.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          
                          {/* Edit / Delete option for comment author */}
                          {comm.author === currentUser.username && (
                            <div className="flex items-center gap-1.5 border-l border-slate-200 dark:border-slate-700 pl-2">
                              <button
                                onClick={() => {
                                  setEditingCommentId(comm.id);
                                  setEditingCommentText(comm.text);
                                }}
                                className="hover:text-amber-500 transition-colors p-0.5 cursor-pointer"
                                title="Edit comment"
                              >
                                <Edit2 className="w-3 h-3" />
                              </button>
                              <button
                                onClick={() => {
                                  if (confirm('Delete this comment?')) {
                                    onDeleteComment(comm.id);
                                  }
                                }}
                                className="hover:text-red-500 transition-colors p-0.5 cursor-pointer"
                                title="Delete comment"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          )}
                        </div>
                      </div>

                      {editingCommentId === comm.id ? (
                        <div className="space-y-2 pt-1">
                          <textarea
                            value={editingCommentText}
                            onChange={(e) => setEditingCommentText(e.target.value)}
                            className="w-full text-xs p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#4c6c9a]"
                            rows={2}
                          />
                          <div className="flex justify-end gap-1.5">
                            <button
                              onClick={() => setEditingCommentId(null)}
                              className="px-2 py-1 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded text-[10px] font-bold"
                            >
                              Cancel
                            </button>
                            <button
                              onClick={() => {
                                if (editingCommentText.trim()) {
                                  onEditComment(comm.id, editingCommentText);
                                  setEditingCommentId(null);
                                }
                              }}
                              className="px-2.5 py-1 bg-[#4c6c9a] text-white rounded text-[10px] font-black"
                            >
                              Save
                            </button>
                          </div>
                        </div>
                      ) : (
                        <p className="leading-relaxed font-medium">{comm.text}</p>
                      )}
                    </div>
                  ))
                )}
              </div>

              {/* AI Moderation warning banner if triggered */}
              {aiFilterWarning && (
                <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200/50 dark:border-amber-900/50 text-amber-800 dark:text-amber-300 p-3 rounded-2xl flex gap-2 text-[10px] leading-relaxed my-3 shadow-sm animate-pulse">
                  <ShieldAlert className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                  <p>{aiFilterWarning}</p>
                </div>
              )}

              {/* Submission Form */}
              <form onSubmit={handleCommentSubmit} className="mt-4 border-t border-slate-50 dark:border-slate-700/60 pt-3 space-y-2">
                <div className="flex gap-2">
                  <input
                    type="text"
                    disabled={isCheckingAi}
                    value={newCommentText}
                    onChange={(e) => setNewCommentText(e.target.value)}
                    placeholder="Write a constructive site update..."
                    className="flex-1 text-xs px-3.5 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/60 text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#4c6c9a] disabled:opacity-50"
                  />
                  <button
                    type="submit"
                    disabled={isCheckingAi || !newCommentText.trim()}
                    className="bg-[#4c6c9a] hover:bg-[#5b80b2] disabled:opacity-45 text-white p-2.5 rounded-2xl transition-all cursor-pointer flex items-center justify-center shadow-sm"
                  >
                    {isCheckingAi ? (
                      <div className="w-4.5 h-4.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                  </button>
                </div>

                <div className="flex items-center justify-between text-[9px] text-slate-400 font-bold px-1">
                  <span className="flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-emerald-500 animate-bounce" />
                    <span>AI auto-filters spam and off-topic conversations</span>
                  </span>
                  <span>{newCommentText.length}/150</span>
                </div>
              </form>
            </div>
          </div>

        </div>
      </div>
    );
  }

  return (
    <div 
      className="space-y-8" 
      id="home-view-container"
    >
      {viewMode === 'landing' ? (
        <>
          {/* HOME PAGE HEADER BANNER (Contains the Home Page Navbar) */}
      <div className="bg-[#1b283c] border border-[#4c6c9a]/30 rounded-3xl p-6 md:p-10 shadow-sm relative overflow-hidden space-y-8 max-w-7xl mx-auto">
        {/* Background blobs for premium depth */}
        <div className="absolute top-0 left-0 w-64 h-64 bg-[#4c6c9a]/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 right-0 w-64 h-64 bg-[#6b9661]/10 rounded-full blur-3xl pointer-events-none"></div>

        {/* Hero content */}
        <div className="relative text-center space-y-6 max-w-3xl mx-auto">
          {/* Animated Big Title CivicLens with hollow font type design */}
          <motion.h1 
            className="text-5xl sm:text-7xl md:text-8xl font-black tracking-tight flex items-center justify-center gap-1 select-none"
            whileHover={{ scale: 1.04, rotate: -0.5 }}
            transition={{ type: "spring", stiffness: 300, damping: 15 }}
          >
            <span className="bg-gradient-to-r from-[#4c6c9a] to-[#6b9661] bg-clip-text text-transparent">
              Civic
            </span>
            <span className="text-transparent [-webkit-text-stroke:2px_#6b9661] dark:[-webkit-text-stroke:2px_#6b9661]">
              Lens
            </span>
          </motion.h1>

          {/* Tagline below CivicLens */}
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="flex items-center justify-center gap-3"
          >
            <Sparkles className="w-5 sm:w-6 h-5 sm:h-6 text-[#6b9661] animate-pulse" />
            <span className="text-lg sm:text-2xl font-black uppercase tracking-widest bg-gradient-to-r from-[#4c6c9a] to-[#6b9661] bg-clip-text text-transparent">
              {getTranslation(lang, 'seeItPostIt')}
            </span>
          </motion.div>

          {/* Description */}
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-medium">
            {getTranslation(lang, 'aboutPlatform')}
          </p>

          {/* Step to make */}
          <div className="pt-2">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">
              {getTranslation(lang, 'stepToMake')}
            </span>
            <div className="inline-block bg-white/5 border border-white/10 rounded-2xl px-6 py-3.5 shadow-sm">
              <p className="text-sm sm:text-lg font-black text-[#6b9661] uppercase tracking-wide">
                {getTranslation(lang, 'passiveToActive')}
              </p>
            </div>
          </div>
        </div>
      </div>
      {/* Quick Navigation / Explore the Platform Section */}
      <div className="bg-[#1b283c] border border-[#4c6c9a]/30 rounded-3xl p-6 md:p-10 shadow-sm relative overflow-hidden space-y-8 max-w-7xl mx-auto">
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#4c6c9a]/5 rounded-full blur-3xl pointer-events-none"></div>
        <div className="relative space-y-6">
          <div className="text-center space-y-2">
            <h2 className="text-2xl font-black tracking-tight text-white">
              {getTranslation(lang, 'explorePlatform')}
            </h2>
            <p className="text-xs text-slate-300 font-bold uppercase tracking-widest">
              {getTranslation(lang, 'directActionPortals')}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 relative">
            {/* Action 1: AI-Clustered Feed */}
            <motion.div 
              whileHover={{ scale: 1.03, y: -4 }}
              className="bg-white/5 hover:bg-white/10 p-6 rounded-3xl border border-white/10 shadow-sm flex flex-col justify-between space-y-4 cursor-pointer transition-all"
              onClick={() => onNavigateToTab?.('Home')}
            >
              <div className="space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-[#4c6c9a]/20 text-[#9cb4d5] flex items-center justify-center">
                  <Layers className="w-6 h-6" />
                </div>
                <h3 className="text-sm font-extrabold text-white">
                  {getTranslation(lang, 'navHome')}
                </h3>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  {getTranslation(lang, 'aiClusteredFeedDesc')}
                </p>
              </div>
              <div className="text-xs font-bold text-[#9cb4d5] flex items-center gap-1 hover:underline">
                {getTranslation(lang, 'enterFeed')} <ArrowRight className="w-3.5 h-3.5" />
              </div>
            </motion.div>

            {/* Action 2: All Reports */}
            <motion.div 
              whileHover={{ scale: 1.03, y: -4 }}
              className="bg-white/5 hover:bg-white/10 p-6 rounded-3xl border border-white/10 shadow-sm flex flex-col justify-between space-y-4 cursor-pointer transition-all"
              onClick={() => onNavigateToTab?.('AllPosts')}
            >
              <div className="space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-300 flex items-center justify-center">
                  <Database className="w-6 h-6" />
                </div>
                <h3 className="text-sm font-extrabold text-white">
                  {getTranslation(lang, 'navAllPosts')}
                </h3>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  {getTranslation(lang, 'allReportsDesc')}
                </p>
              </div>
              <div className="text-xs font-bold text-amber-300 flex items-center gap-1 hover:underline">
                {getTranslation(lang, 'viewDatabase')} <ArrowRight className="w-3.5 h-3.5" />
              </div>
            </motion.div>

            {/* Action 3: Report Hazard */}
            <motion.div 
              whileHover={{ scale: 1.03, y: -4 }}
              className="bg-white/5 hover:bg-white/10 p-6 rounded-3xl border border-white/10 shadow-sm flex flex-col justify-between space-y-4 cursor-pointer transition-all"
              onClick={() => onNavigateToTab?.('PostIssue')}
            >
              <div className="space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-rose-500/20 text-rose-300 flex items-center justify-center">
                  <PlusCircle className="w-6 h-6" />
                </div>
                <h3 className="text-sm font-extrabold text-white">
                  {getTranslation(lang, 'navPostIssue')}
                </h3>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  {getTranslation(lang, 'reportHazardDesc')}
                </p>
              </div>
              <div className="text-xs font-bold text-rose-300 flex items-center gap-1 hover:underline">
                {getTranslation(lang, 'fileReport')} <ArrowRight className="w-3.5 h-3.5" />
              </div>
            </motion.div>

            {/* Action 4: Action Groups */}
            <motion.div 
              whileHover={{ scale: 1.03, y: -4 }}
              className="bg-white/5 hover:bg-white/10 p-6 rounded-3xl border border-white/10 shadow-sm flex flex-col justify-between space-y-4 cursor-pointer transition-all"
              onClick={() => onNavigateToTab?.('CommunityGroups')}
            >
              <div className="space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-300 flex items-center justify-center">
                  <Users className="w-6 h-6" />
                </div>
                <h3 className="text-sm font-extrabold text-white">
                  {getTranslation(lang, 'navCommunityGroups')}
                </h3>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  {getTranslation(lang, 'actionGroupsDesc')}
                </p>
              </div>
              <div className="text-xs font-bold text-emerald-300 flex items-center gap-1 hover:underline">
                {getTranslation(lang, 'joinGroups')} <ArrowRight className="w-3.5 h-3.5" />
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Community Feedback Partner Testimonials section - Moved below Explore section */}
      <div className="bg-[#1b283c] border border-[#4c6c9a]/30 rounded-3xl p-6 md:p-10 shadow-sm relative overflow-hidden space-y-6 max-w-7xl mx-auto">
        <div className="absolute top-0 left-0 w-64 h-64 bg-[#6b9661]/5 rounded-full blur-3xl pointer-events-none"></div>
        <div className="relative space-y-6">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-[#6b9661]/20 rounded-xl text-[#6b9661]">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm text-white leading-tight">
                {getTranslation(lang, 'communityFeedback')}
              </h3>
              <span className="text-[10px] text-slate-300 font-bold block uppercase tracking-wider">
                {getTranslation(lang, 'partnerTestimonials')}
              </span>
            </div>
          </div>

          <p className="text-xs text-slate-300 leading-relaxed">
            {getTranslation(lang, 'collabDesc')}
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Testimonial 1 */}
            <div className="bg-white/5 hover:bg-white/10 transition-all border border-white/10 p-4 rounded-2xl space-y-3 shadow-sm hover:scale-[1.02]">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#4c6c9a] to-[#6b9661] text-white flex items-center justify-center text-xs font-bold">
                  PS
                </div>
                <div>
                  <h4 className="text-xs font-extrabold text-white leading-tight">
                    Priya Sharma
                  </h4>
                  <span className="text-[9px] bg-[#4c6c9a]/25 text-[#9cb4d5] font-bold px-1.5 py-0.5 rounded">
                    {getTranslation(lang, 'activeCitizen')}
                  </span>
                </div>
              </div>
              <p className="text-[11px] text-slate-300 italic leading-relaxed">
                {getTranslation(lang, 'priyaQuote')}
              </p>
            </div>

            {/* Testimonial 2 */}
            <div className="bg-white/5 hover:bg-white/10 transition-all border border-white/10 p-4 rounded-2xl space-y-3 shadow-sm hover:scale-[1.02]">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs font-bold">
                  EW
                </div>
                <div>
                  <h4 className="text-xs font-extrabold text-white leading-tight">
                    Eco-Watch NGO
                  </h4>
                  <span className="text-[9px] bg-emerald-500/25 text-emerald-300 font-bold px-1.5 py-0.5 rounded">
                    {getTranslation(lang, 'environmentalPartner')}
                  </span>
                </div>
              </div>
              <p className="text-[11px] text-slate-300 italic leading-relaxed">
                {getTranslation(lang, 'ecoQuote')}
              </p>
            </div>

            {/* Testimonial 3 */}
            <div className="bg-white/5 hover:bg-white/10 transition-all border border-white/10 p-4 rounded-2xl space-y-3 shadow-sm hover:scale-[1.02]">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs font-bold">
                  MC
                </div>
                <div>
                  <h4 className="text-xs font-extrabold text-white leading-tight">
                    {getTranslation(lang, 'municipalCommissioner')}
                  </h4>
                  <span className="text-[9px] bg-indigo-500/25 text-indigo-300 font-bold px-1.5 py-0.5 rounded">
                    {getTranslation(lang, 'corporationAuthority')}
                  </span>
                </div>
              </div>
              <p className="text-[11px] text-slate-300 italic leading-relaxed">
                {getTranslation(lang, 'officerQuote')}
              </p>
            </div>
          </div>
        </div>
      </div>
        </>
      ) : (
        <>
          {/* Conditional feed unlock flow based on login status */}
          {!isLoggedIn ? (
        <div className="space-y-8">
          {/* Secure lock prompt calling login portal */}
          <div className="bg-slate-900 text-slate-100 rounded-3xl p-8 max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 border border-slate-850 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-[#6b9661]/10 rounded-full blur-2xl pointer-events-none"></div>
            <div className="space-y-2 text-left">
              <span className="bg-emerald-500/15 text-emerald-400 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border border-emerald-500/20">
                {getTranslation(lang, 'unlockInteractiveFeed')}
              </span>
              <h3 className="text-lg md:text-xl font-black">
                {getTranslation(lang, 'joinConsensusTitle')}
              </h3>
              <p className="text-xs text-slate-400 max-w-xl leading-relaxed">
                {getTranslation(lang, 'joinConsensusDesc')}
              </p>
            </div>
            <button
              onClick={() => {
                (window as any).triggerLoginPortal?.();
              }}
              className="w-full md:w-auto bg-gradient-to-r from-[#4c6c9a] to-[#6b9661] hover:scale-[1.03] active:scale-95 text-white font-extrabold px-6 py-3.5 rounded-2xl text-xs transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md"
            >
              <Lock className="w-4 h-4" />
              <span>{getTranslation(lang, 'loginSignUpNow')}</span>
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* Clustered Feeds */}
          <div className="space-y-8">
          
          {exploredCategory ? (
          /* Clustered Category Interface - Clustered by location, no duplicates */
          <div className="space-y-6" id="clustered-category-view">
            {/* Header bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-800 p-5 rounded-3xl border border-slate-200/80 dark:border-slate-700 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setExploredCategory(null)}
                  className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer shadow-sm hover:scale-[1.03]"
                >
                  ← {getTranslation(lang, 'back')}
                </button>
                <div>
                  <span className="text-[10px] text-[#4c6c9a] dark:text-blue-400 font-extrabold uppercase tracking-widest block">
                    Category Clustered View
                  </span>
                  <h2 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                    {exploredCategory} Clustered Database
                  </h2>
                </div>
              </div>
              
              <div className="flex items-center gap-2 text-xs font-bold text-slate-500 bg-slate-50 dark:bg-slate-900/40 px-3 py-1.5 rounded-xl border border-slate-100 dark:border-slate-800">
                <Sparkles className="w-4 h-4 text-emerald-500 animate-pulse" />
                <span>AI geo-clustered by location points</span>
              </div>
            </div>

            {/* Clustered groups */}
            <div className="space-y-6">
              {(() => {
                const categoryPosts = filteredPosts.filter(p => p.issueType === exploredCategory);
                
                // Group by location address to prevent duplicate locations
                const groupedByLocation: Record<string, Post[]> = {};
                categoryPosts.forEach(p => {
                  const address = p.location.address;
                  if (!groupedByLocation[address]) {
                    groupedByLocation[address] = [];
                  }
                  groupedByLocation[address].push(p);
                });

                const severityColors = {
                  'High': 'bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 border-red-100 dark:border-red-900/40',
                  'Medium-High': 'bg-orange-50 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400 border-orange-100 dark:border-orange-900/40',
                  'Medium': 'bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border-amber-100 dark:border-amber-900/40',
                  'Low-Medium': 'bg-yellow-50 dark:bg-yellow-950/40 text-yellow-600 dark:text-yellow-400 border-yellow-100 dark:border-yellow-900/40',
                  'Low': 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border-emerald-100 dark:border-emerald-900/40'
                };

                if (Object.keys(groupedByLocation).length === 0) {
                  return (
                    <div className="bg-white dark:bg-slate-800 p-12 text-center rounded-3xl border border-dashed border-slate-200 dark:border-slate-700">
                      <AlertTriangle className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
                      <p className="text-xs text-slate-500">No active reports for this category matching filters in {selectedCity}.</p>
                    </div>
                  );
                }

                return Object.keys(groupedByLocation).map((address, groupIdx) => {
                  const postsAtLocation = groupedByLocation[address];
                  return (
                    <div key={groupIdx} className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200/80 dark:border-slate-700/60 p-6 shadow-sm hover:shadow-md transition-all duration-300 space-y-4 hover:scale-[1.01]">
                      {/* Location Title Block - listed only ONCE */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 dark:border-slate-700/60 pb-3 gap-2">
                        <div className="flex items-start gap-2.5">
                          <div className="p-2 bg-[#4c6c9a]/15 text-[#4c6c9a] dark:text-blue-400 rounded-xl">
                            <MapPin className="w-4.5 h-4.5" />
                          </div>
                          <div>
                            <h4 className="text-sm font-black text-slate-900 dark:text-white leading-tight">
                              {address}
                            </h4>
                            <p className="text-[10px] text-slate-400 font-bold mt-0.5">
                              Consolidated {postsAtLocation.length} {postsAtLocation.length === 1 ? 'report' : 'reports'} at this address
                            </p>
                          </div>
                        </div>
                        <span className="bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold px-2.5 py-1 rounded-full border border-emerald-100 dark:border-emerald-900/30 flex items-center gap-1 self-start">
                          <Sparkles className="w-3 h-3 text-emerald-500 animate-bounce" />
                          <span>Zero-Duplication Area</span>
                        </span>
                      </div>

                      {/* Nested Reports */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {postsAtLocation.map((post) => (
                          <div 
                            key={post.id} 
                            onClick={() => { setSelectedDetailPost(post); setIsEditingPost(false); }}
                            className="bg-slate-50 dark:bg-slate-900/40 border border-slate-150 dark:border-slate-800 p-4 rounded-2xl flex flex-col justify-between cursor-pointer hover:border-[#4c6c9a]/60 hover:shadow-sm transition-all group"
                          >
                            <div>
                              <div className="relative aspect-video rounded-xl overflow-hidden mb-3 border border-slate-200/60 dark:border-slate-800">
                                <img 
                                  src={post.photoUrl} 
                                  alt={post.issueType} 
                                  className="w-full h-full object-cover transition-transform group-hover:scale-105 duration-500"
                                  referrerPolicy="no-referrer"
                                />
                                <div className="absolute top-2 right-2">
                                  <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border shadow-sm uppercase ${
                                    severityColors[post.severity as keyof typeof severityColors] || 'bg-slate-100 text-slate-600'
                                  }`}>
                                    {post.severity}
                                  </span>
                                </div>
                              </div>
                              <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2 leading-relaxed">
                                {post.description}
                              </p>

                              {/* Tackled / Unsolved Checkbox */}
                              <div 
                                className="mt-2.5 flex items-center gap-2 bg-white dark:bg-slate-900 p-2 rounded-xl border border-slate-100 dark:border-slate-800"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <input
                                  id={`tackled-check-cluster-${post.id}`}
                                  type="checkbox"
                                  checked={post.status === 'Tackled'}
                                  onChange={(e) => {
                                    e.stopPropagation();
                                    onToggleTackledCheckbox(post.id, e.target.checked);
                                  }}
                                  className="w-3.5 h-3.5 text-[#6b9661] focus:ring-[#6b9661] border-slate-300 rounded cursor-pointer accent-[#6b9661]"
                                />
                                <label 
                                  htmlFor={`tackled-check-cluster-${post.id}`}
                                  className="text-[10px] font-bold text-slate-600 dark:text-slate-400 cursor-pointer flex items-center gap-1 w-full"
                                >
                                  {post.status === 'Tackled' ? (
                                    <span className="text-[#6b9661] font-extrabold">✓ Marked Tackled (Pending vote)</span>
                                  ) : (
                                    <span>Mark as Tackled / Solved</span>
                                  )}
                                </label>
                              </div>
                            </div>

                            <div className="mt-4 pt-3 border-t border-slate-200/60 dark:border-slate-800 flex items-center justify-between text-[10px] text-slate-400 font-bold">
                              <span>@{post.author}</span>
                              <span className="text-[#4c6c9a] dark:text-blue-400 inline-flex items-center gap-0.5 hover:underline font-black">
                                explore post <ArrowRight className="w-3 h-3" />
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                });
              })()}
            </div>
          </div>
        ) : (
          /* Normal feed view with clustered groups list */
          <>
            {/* City Filter Header */}
            <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-sm border border-slate-200/80 dark:border-slate-700 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-[#4c6c9a]/10 rounded-xl text-[#4c6c9a]">
                  <MapPin className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                    Monitoring Location
                  </span>
                  <h1 className="text-xl font-black text-slate-800 dark:text-white flex items-center gap-1.5">
                    {selectedCity}, {selectedState}
                  </h1>
                </div>
              </div>

              <div className="flex gap-2.5 w-full sm:w-auto">
                <select
                  value={selectedState}
                  onChange={(e) => {
                    const newState = e.target.value;
                    setSelectedState(newState);
                    const cities = statesAndCities[newState as keyof typeof statesAndCities] || [];
                    if (cities.length > 0) {
                      setSelectedCity(cities[0]);
                    }
                  }}
                  className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2 text-xs font-bold text-slate-700 dark:text-slate-300 focus:outline-none focus:border-[#4c6c9a] cursor-pointer"
                >
                  {Object.keys(statesAndCities).map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>

                <select
                  value={selectedCity}
                  onChange={(e) => setSelectedCity(e.target.value)}
                  className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2 text-xs font-bold text-slate-700 dark:text-slate-300 focus:outline-none focus:border-[#4c6c9a] cursor-pointer"
                >
                  {(statesAndCities[selectedState as keyof typeof statesAndCities] || []).map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Search & Filtering Bar */}
            <div className="bg-white dark:bg-slate-800 p-4 rounded-3xl shadow-sm border border-slate-200/80 dark:border-slate-700 flex flex-col md:flex-row gap-3.5 items-center justify-between hover:shadow-md transition-shadow">
              {/* Search */}
              <div className="relative w-full md:max-w-md">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type="text"
                  placeholder="Search active issues or types..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs font-medium pl-10 pr-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-[#4c6c9a]"
                />
              </div>

              {/* Filters */}
              <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
                <button
                  onClick={() => setFilterRecent(!filterRecent)}
                  className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 border transition-all ${
                    filterRecent 
                      ? 'bg-[#4c6c9a] text-white border-[#4c6c9a]' 
                      : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:border-[#4c6c9a]'
                  }`}
                >
                  <span>{getTranslation(lang, 'filterRecent')}</span>
                </button>

                <button
                  onClick={() => setFilterVerified(!filterVerified)}
                  className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 border transition-all ${
                    filterVerified 
                      ? 'bg-[#6b9661] text-white border-[#6b9661]' 
                      : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:border-[#6b9661]'
                  }`}
                >
                  <span>{getTranslation(lang, 'filterVerified')}</span>
                </button>

                {/* Active Severity Filter Dropdown - Premium Blue-Green Blur Custom Select */}
                <div className="relative z-30">
                  <button
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3.5 py-2 rounded-xl shadow-sm hover:border-[#4c6c9a] transition-all cursor-pointer text-xs font-bold text-slate-700 dark:text-slate-300"
                  >
                    <SlidersHorizontal className="w-3.5 h-3.5 text-slate-400" />
                    <span>{severityFilter === 'all' ? 'All Severities' : severityFilter}</span>
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ml-1" />
                  </button>
                  
                  <AnimatePresence>
                    {isDropdownOpen && (
                      <>
                        <div className="fixed inset-0 z-40" onClick={() => setIsDropdownOpen(false)} />
                        <motion.div
                          initial={{ opacity: 0, y: 8, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: 8, scale: 0.95 }}
                          className="absolute right-0 mt-2 w-48 rounded-2xl p-1.5 bg-gradient-to-r from-[#4c6c9a]/95 to-[#6b9661]/95 backdrop-blur-md border border-white/20 shadow-xl z-50 overflow-hidden text-white"
                        >
                          {['all', 'Low', 'Low-Medium', 'Medium', 'Medium-High', 'High'].map((opt) => (
                            <button
                              key={opt}
                              onClick={() => {
                                setSeverityFilter(opt);
                                setIsDropdownOpen(false);
                              }}
                              className={`w-full text-left px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                                severityFilter === opt 
                                  ? 'bg-white/20 text-white shadow-sm' 
                                  : 'hover:bg-white/10 text-slate-100 hover:text-white'
                              }`}
                            >
                              {opt === 'all' ? 'All Severities' : opt}
                            </button>
                          ))}
                        </motion.div>
                      </>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </div>

            {/* AI Clustered Groups */}
            <div className="space-y-6">
              {categories.length === 0 ? (
                <div className="bg-white dark:bg-slate-800 p-12 text-center rounded-2xl border border-dashed border-slate-200 dark:border-slate-700">
                  <AlertTriangle className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
                  <h3 className="font-extrabold text-slate-700 dark:text-slate-300 text-base">
                    No active issues found
                  </h3>
                  <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 max-w-sm mx-auto leading-relaxed">
                    No prevailing issues recorded or matching filters for {selectedCity}. Choose another city or post a new hazard to start tracking!
                  </p>
                </div>
              ) : (
                categories.map((cat) => {
                  const categoryPosts = filteredPosts.filter(p => p.issueType === cat);
                  const isExpanded = expandedCategories[cat] || false;
                  const displayedPosts = isExpanded ? categoryPosts : categoryPosts.slice(0, 1);

                  return (
                    <div key={cat} className="space-y-3.5" id={`category-cluster-${cat.toLowerCase().replace(/\s+/g, '-')}`}>
                      {/* Category Cluster Header */}
                      <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700/60 pb-2">
                        <div className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full bg-[#4c6c9a]"></span>
                          <h3 
                            className="font-extrabold text-base transition-colors duration-200"
                            style={{ color: theme === 'dark' ? '#ffffff' : '#000000' }}
                          >
                            {cat} Cluster
                          </h3>
                          <span className="bg-[#4c6c9a]/10 text-[#4c6c9a] text-xs font-bold px-2.5 py-0.5 rounded-full">
                            {categoryPosts.length} {categoryPosts.length === 1 ? 'report' : 'reports'}
                          </span>
                        </div>
                      </div>

                      {/* List of posts inside this category */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
                        {displayedPosts.map((post) => {
                          // Severity badge color mapping
                          const severityColors = {
                            'High': 'bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 border-red-100 dark:border-red-900/40',
                            'Medium-High': 'bg-orange-50 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400 border-orange-100 dark:border-orange-900/40',
                            'Medium': 'bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border-amber-100 dark:border-amber-900/40',
                            'Low-Medium': 'bg-yellow-50 dark:bg-yellow-950/40 text-yellow-600 dark:text-yellow-400 border-yellow-100 dark:border-yellow-900/40',
                            'Low': 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border-emerald-100 dark:border-emerald-900/40'
                          };

                          return (
                            <div
                              key={post.id}
                              onClick={() => { setSelectedDetailPost(post); setIsEditingPost(false); }}
                              className="bg-white dark:bg-slate-800 p-5 rounded-3xl border border-slate-200/80 dark:border-slate-700/60 shadow-sm hover:shadow-lg hover:shadow-[#4c6c9a]/5 transition-all duration-300 cursor-pointer flex flex-col justify-between group h-full hover:-translate-y-0.5"
                            >
                              <div>
                                <div className="relative rounded-xl overflow-hidden mb-3 aspect-video border border-slate-50 dark:border-slate-700">
                                  <img 
                                    src={post.photoUrl} 
                                    alt={post.issueType} 
                                    className="w-full h-full object-cover transition-transform group-hover:scale-105 duration-500"
                                    referrerPolicy="no-referrer"
                                  />
                                  <div className="absolute top-2.5 right-2.5 flex items-center gap-1.5">
                                    <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border shadow-sm uppercase ${
                                      severityColors[post.severity as keyof typeof severityColors] || 'bg-slate-100 text-slate-600'
                                    }`}>
                                      {post.severity}
                                    </span>
                                  </div>
                                </div>

                                <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                                  {post.description}
                                </p>

                                {/* Tackled / Unsolved Small Checkbox Option */}
                                <div 
                                  className="mt-3 flex items-center gap-2 bg-slate-50 dark:bg-slate-900/60 p-2 rounded-xl border border-slate-100/80 dark:border-slate-800"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <input
                                    id={`tackled-check-home-${post.id}`}
                                    type="checkbox"
                                    checked={post.status === 'Tackled'}
                                    onChange={(e) => {
                                      e.stopPropagation();
                                      onToggleTackledCheckbox(post.id, e.target.checked);
                                    }}
                                    className="w-4 h-4 text-[#6b9661] focus:ring-[#6b9661] border-slate-300 rounded cursor-pointer accent-[#6b9661]"
                                  />
                                  <label 
                                    htmlFor={`tackled-check-home-${post.id}`}
                                    className="text-[11px] font-bold text-slate-600 dark:text-slate-350 cursor-pointer flex items-center gap-1 w-full"
                                  >
                                    {post.status === 'Tackled' ? (
                                      <span className="text-[#6b9661] font-extrabold flex items-center gap-1">
                                        ✓ Marked Tackled (Pending voting)
                                      </span>
                                    ) : (
                                      <span className="text-slate-500 hover:text-slate-700 dark:hover:text-slate-200">
                                        Mark as Tackled / Solved
                                      </span>
                                    )}
                                  </label>
                                </div>
                              </div>

                              <div className="mt-4 pt-3.5 border-t border-slate-50 dark:border-slate-700/60 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[10px] text-slate-400 dark:text-slate-500 font-medium">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <span className="truncate font-bold">@{post.author}</span>
                                  <span className="text-slate-300 dark:text-slate-700">|</span>
                                  <span className="font-mono text-[9px] bg-slate-100 dark:bg-slate-900 px-1.5 py-0.5 rounded text-slate-500">
                                    {new Date(post.timestamp).toLocaleDateString()}
                                  </span>
                                </div>
                                
                                <div className="flex items-center gap-2">
                                  {post.isVerified && (
                                    <span className="bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded-full font-bold flex items-center gap-0.5 border border-emerald-100 dark:border-emerald-900/50">
                                      <CheckCircle2 className="w-3 h-3" />
                                      <span>Verified</span>
                                    </span>
                                  )}
                                  <span className="bg-slate-50 dark:bg-slate-700/40 px-2 py-0.5 rounded-full font-semibold">
                                    {post.votesYesIssue} Yes
                                  </span>
                                  <span className="text-[#4c6c9a] dark:text-blue-400 font-extrabold text-[11px] inline-flex items-center gap-0.5 hover:underline pl-1 border-l border-slate-200 dark:border-slate-700">
                                    explore post <ArrowRight className="w-3 h-3" />
                                  </span>
                                </div>
                              </div>
                            </div>
                          );
                        })}

                        {/* Large, beautiful button on the right empty side of the category cluster */}
                        <div className="flex items-center justify-center h-full min-h-[180px] p-2">
                          <button 
                            onClick={() => setExploredCategory(cat)}
                            className="w-full text-white bg-gradient-to-r from-[#4c6c9a] to-[#6b9661] hover:from-[#6b9661] hover:to-[#4c6c9a] dark:from-[#4c6c9a] dark:to-[#6b9661] px-7 py-5 rounded-[28px] flex items-center justify-center gap-3 cursor-pointer transition-all hover:scale-[1.03] active:scale-95 shadow-md border border-white/10"
                          >
                            <Sparkles className="w-5 h-5 text-emerald-300 animate-pulse flex-shrink-0" />
                            <span style={{ fontSize: '20px' }} className="font-extrabold tracking-normal">
                              Explore More Related {cat} Posts
                            </span>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </>
        )}
      </div>
      </>
      )}
      </>
      )}
    </div>
  );
}
