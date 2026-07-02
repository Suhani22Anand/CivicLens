import React, { useState } from 'react';
import { Post, Comment, UserProfile, AppLanguage, SeverityType } from '../types';
import { getTranslation } from '../utils/translate';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle2, AlertTriangle, ShieldCheck, Clock, Send, MessageSquare, ChevronRight, User, Eye, Edit2, Check, X, ShieldAlert, MapPin, Sparkles, Trash2 } from 'lucide-react';

interface PostsListViewProps {
  posts: Post[];
  comments: Comment[];
  currentUser: UserProfile;
  lang: AppLanguage;
  showSolvedOnly?: boolean;
  onSelectPost?: (post: Post) => void;
  selectedPost: Post | null;
  onCloseDetail: () => void;
  onUpdatePost: (updatedPost: Post) => void;
  onAddComment: (postId: string, text: string) => void;
  onEditComment?: (commentId: string, text: string) => void;
  onDeleteComment?: (commentId: string) => void;
  onToggleTackledCheckbox?: (postId: string, checked: boolean) => void;
}

export default function PostsListView({
  posts,
  comments,
  currentUser,
  lang,
  showSolvedOnly = false,
  selectedPost,
  onCloseDetail,
  onUpdatePost,
  onAddComment,
  onEditComment,
  onDeleteComment,
  onSelectPost,
  onToggleTackledCheckbox,
}: PostsListViewProps) {
  const [activeTab, setActiveTab] = useState<'Prevailing' | 'Tackled'>(showSolvedOnly ? 'Tackled' : 'Prevailing');
  const [newCommentText, setNewCommentText] = useState('');
  const [aiFilterWarning, setAiFilterWarning] = useState<string | null>(null);
  
  // AI Moderation loading state
  const [isCheckingAi, setIsCheckingAi] = useState(false);

  // Comment edit state
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editingCommentText, setEditingCommentText] = useState('');

  // Edit State
  const [isEditing, setIsEditing] = useState(false);
  const [editDesc, setEditDesc] = useState('');
  const [editArea, setEditArea] = useState('');
  const [editDepth, setEditDepth] = useState('');

  // Filter posts based on active status & verified vote consensus
  const displayedPosts = posts.filter(p => {
    if (activeTab === 'Tackled') {
      return p.status === 'Tackled' && (p.votesYesResolved ?? 0) >= 2;
    } else {
      return p.status === 'Prevailing' || (p.status === 'Tackled' && (p.votesYesResolved ?? 0) < 2);
    }
  });

  // Comments for the selected post
  const activeComments = selectedPost 
    ? comments.filter(c => c.postId === selectedPost.id)
    : [];

  // Severity style helper
  const getSeverityBadge = (sev: string) => {
    switch (sev) {
      case 'High': return 'bg-red-50 text-red-600 border-red-100 dark:bg-red-950/40 dark:text-red-400';
      case 'Medium-High': return 'bg-orange-50 text-orange-600 border-orange-100 dark:bg-orange-950/40 dark:text-orange-400';
      case 'Medium': return 'bg-amber-50 text-amber-600 border-amber-100 dark:bg-amber-950/40 dark:text-amber-400';
      case 'Low-Medium': return 'bg-yellow-50 text-yellow-600 border-yellow-100 dark:bg-yellow-950/40 dark:text-yellow-400';
      default: return 'bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-400';
    }
  };

  // Voting action
  const handleVote = (questionType: 'issue' | 'resolved', vote: 'YES' | 'NO') => {
    if (!selectedPost) return;

    // Check if user already voted on this question
    const existingVoteIdx = selectedPost.userVotes.findIndex(
      v => v.username === currentUser.username && v.questionType === questionType
    );

    let updatedVotes = [...selectedPost.userVotes];
    let yesDiff = 0;
    let noDiff = 0;

    if (existingVoteIdx > -1) {
      const prevVote = updatedVotes[existingVoteIdx].vote;
      if (prevVote === vote) {
        // Remove vote on click again
        updatedVotes.splice(existingVoteIdx, 1);
        if (vote === 'YES') yesDiff = -1;
        else noDiff = -1;
      } else {
        // Toggle vote
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
      // Add new vote
      updatedVotes.push({ username: currentUser.username, questionType, vote });
      if (vote === 'YES') yesDiff = 1;
      else noDiff = 1;
    }

    // Prepare updated post values
    let votesYesIssue = selectedPost.votesYesIssue;
    let votesNoIssue = selectedPost.votesNoIssue;
    let votesYesResolved = selectedPost.votesYesResolved;
    let votesNoResolved = selectedPost.votesNoResolved;

    if (questionType === 'issue') {
      votesYesIssue += yesDiff;
      votesNoIssue += noDiff;
    } else {
      votesYesResolved += yesDiff;
      votesNoResolved += noDiff;
    }

    // If YES vote majority is achieved on issue, award Verified Tag
    const totalIssueVotes = votesYesIssue + votesNoIssue;
    const isVerified = totalIssueVotes > 0 && (votesYesIssue / totalIssueVotes) > 0.5;

    onUpdatePost({
      ...selectedPost,
      userVotes: updatedVotes,
      votesYesIssue,
      votesNoIssue,
      votesYesResolved,
      votesNoResolved,
      isVerified,
    });
  };

  // Author Edit Publish
  const handleEditSave = () => {
    if (!selectedPost) return;
    onUpdatePost({
      ...selectedPost,
      description: editDesc,
      dimensions: {
        area: editArea || undefined,
        depth: editDepth || undefined,
      }
    });
    setIsEditing(false);
  };

  // Trigger editing
  const startEditing = () => {
    if (!selectedPost) return;
    setEditDesc(selectedPost.description);
    setEditArea(selectedPost.dimensions.area || '');
    setEditDepth(selectedPost.dimensions.depth || '');
    setIsEditing(true);
  };

  // Comment submission with simulated AI moderation
  const handleCommentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCommentText.trim() || !selectedPost) return;

    setIsCheckingAi(true);
    setAiFilterWarning(null);

    setTimeout(() => {
      setIsCheckingAi(false);
      const text = newCommentText.toLowerCase();

      // Spam criteria
      const spamKeywords = ['sucks', 'stupid', 'idiots', 'government', 'hate', 'great app', 'hello', 'nice', 'awesome'];
      const containsSpam = spamKeywords.some(keyword => text.includes(keyword));

      // Post-specific keywords extraction
      const issueWords = selectedPost.issueType.toLowerCase().split(/\s+/);
      const descWords = selectedPost.description.toLowerCase().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g,"").split(/\s+/).filter(w => w.length > 3);
      const addrWords = selectedPost.location.address.toLowerCase().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g,"").split(/\s+/).filter(w => w.length > 3);

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

      if (selectedPost.dimensions.area) {
        selectedPost.dimensions.area.toLowerCase().split(/\s+/).forEach(w => { if (w.length > 2) postKeywords.add(w); });
      }
      if (selectedPost.dimensions.depth) {
        selectedPost.dimensions.depth.toLowerCase().split(/\s+/).forEach(w => { if (w.length > 2) postKeywords.add(w); });
      }

      // Check for overlap of words of length > 2
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
          `AI Moderator blocked comment: This comment is not related to the specific details of this ${selectedPost.issueType} report (location: "${selectedPost.location.address}", details: "${selectedPost.description.substring(0, 30)}..."). CivicLens AI Moderator only permits comments containing constructive updates directly related to this specific hazard (e.g. repair updates, size changes, site updates).`
        );
        return;
      }

      onAddComment(selectedPost.id, newCommentText);
      setNewCommentText('');
      setAiFilterWarning(null);
    }, 1000);
  };

  // Toggle status (Mark Solved)
  const handleToggleStatus = () => {
    if (!selectedPost) return;

    const nextStatus = selectedPost.status === 'Prevailing' ? 'Tackled' : 'Prevailing';

    // If not the author, warn that solving needs public YES vote consensus within 24 hours
    if (selectedPost.author !== currentUser.username) {
      alert(
        'As a peer citizen, your "Tackled" marker has been logged. It will be officially moved to Solved Issues database after public YES vote consensus.'
      );
    }

    if (onToggleTackledCheckbox) {
      onToggleTackledCheckbox(selectedPost.id, nextStatus === 'Tackled');
    } else {
      onUpdatePost({
        ...selectedPost,
        status: nextStatus,
      });
    }
  };

  return (
    <div className="space-y-6" id="all-posts-view">
      {/* Tab Switcher - only show if NO post is selected */}
      {!selectedPost && (
        <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl max-w-sm transition-all hover:shadow-sm">
          <button
            onClick={() => setActiveTab('Prevailing')}
            className={`flex-1 py-2 px-4 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'Prevailing' 
                ? 'bg-white dark:bg-slate-700 text-slate-800 dark:text-white shadow-sm' 
                : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            {getTranslation(lang, 'prevailing')} ({posts.filter(p => p.status === 'Prevailing').length})
          </button>
          <button
            onClick={() => setActiveTab('Tackled')}
            className={`flex-1 py-2 px-4 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'Tackled' 
                ? 'bg-white dark:bg-slate-700 text-slate-800 dark:text-white shadow-sm' 
                : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            {getTranslation(lang, 'tackled')} ({posts.filter(p => p.status === 'Tackled').length})
          </button>
        </div>
      )}

      {/* Main Container Grid */}
      <div className="grid grid-cols-1 gap-8">
        
        {/* Reports List - ONLY rendered if NO post is selected */}
        {!selectedPost && (
          <div className="space-y-4">
            {displayedPosts.length === 0 ? (
              <div className="bg-white dark:bg-slate-800 p-12 text-center rounded-3xl border border-slate-200/80 dark:border-slate-700">
                <AlertTriangle className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
                <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">
                  No reports found in this database.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {displayedPosts.map((post) => {
                  const isSelected = selectedPost?.id === post.id;
                  return (
                    <div
                      key={post.id}
                      onClick={() => {
                        onSelectPost?.(post);
                        setIsEditing(false);
                      }}
                      className={`bg-white dark:bg-slate-800 p-5 rounded-3xl border transition-all duration-300 cursor-pointer flex flex-col justify-between gap-4 hover:-translate-y-1 hover:shadow-lg hover:border-[#4c6c9a]/35 group ${
                        isSelected 
                          ? 'border-[#4c6c9a] ring-4 ring-[#4c6c9a]/10 bg-slate-50/20' 
                          : 'border-slate-200/80 dark:border-slate-700/60 shadow-sm'
                      }`}
                    >
                      <div>
                        <div className="relative aspect-video w-full rounded-2xl overflow-hidden mb-3 border border-slate-100 dark:border-slate-700">
                          <img
                            src={post.photoUrl}
                            alt={post.issueType}
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                            referrerPolicy="no-referrer"
                          />
                          <div className="absolute top-2.5 right-2.5">
                            <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border shadow-sm uppercase ${getSeverityBadge(post.severity)}`}>
                              {post.severity}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center justify-between mb-2">
                          <span className="font-extrabold text-sm text-slate-900 dark:text-white truncate">
                            {post.issueType}
                          </span>
                        </div>

                        <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-3 leading-relaxed mb-4">
                          {post.description}
                        </p>

                        {/* Optional small checkbox for tackled or unsolved issue */}
                        <div 
                          className="flex items-center gap-2 bg-slate-50/80 dark:bg-slate-900/40 p-2 rounded-xl border border-slate-100 dark:border-slate-800"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <input
                            id={`tackled-check-list-${post.id}`}
                            type="checkbox"
                            checked={post.status === 'Tackled'}
                            onChange={(e) => {
                              e.stopPropagation();
                              if (onToggleTackledCheckbox) {
                                onToggleTackledCheckbox(post.id, e.target.checked);
                              }
                            }}
                            className="w-3.5 h-3.5 text-[#6b9661] focus:ring-[#6b9661] border-slate-300 rounded cursor-pointer accent-[#6b9661]"
                          />
                          <label 
                            htmlFor={`tackled-check-list-${post.id}`}
                            className="text-[10px] font-bold text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer flex items-center gap-1 w-full"
                          >
                            {post.status === 'Tackled' ? (
                              <span className="text-[#6b9661] font-black">✓ Tackled (Voting active)</span>
                            ) : (
                              <span>Mark Tackled</span>
                            )}
                          </label>
                        </div>
                      </div>

                      <div className="flex flex-col sm:flex-row sm:items-center justify-between text-[10px] text-slate-400 dark:text-slate-500 pt-3 border-t border-slate-100 dark:border-slate-750 font-medium gap-2">
                        <span className="font-bold">@{post.author}</span>
                        <span className="font-mono text-[9px] bg-slate-100 dark:bg-slate-900 px-1.5 py-0.5 rounded text-slate-500 self-start sm:self-auto">
                          {new Date(post.timestamp).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Selected Post Detail View - ONLY rendered if a post is selected */}
        <AnimatePresence>
          {selectedPost && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 15 }}
              className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-150 dark:border-slate-700/60 shadow-md p-6 sm:p-8 space-y-8 overflow-hidden"
            >
              {/* Back / Close Header */}
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700 pb-4">
                <div className="flex items-center gap-3">
                  <button
                    onClick={onCloseDetail}
                    className="px-4 py-2 rounded-xl bg-slate-50 hover:bg-slate-100 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-600 dark:text-slate-300 transition-all text-xs font-extrabold shadow-sm hover:scale-[1.02] cursor-pointer"
                  >
                    ← Back to Reports
                  </button>

                  <button
                    onClick={handleToggleStatus}
                    className={`text-xs font-bold px-3.5 py-2 rounded-xl border flex items-center gap-1.5 transition-all shadow-sm ${
                      selectedPost.status === 'Tackled'
                        ? 'bg-emerald-50 border-emerald-200 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-900/30'
                        : 'bg-slate-50 border-slate-200 text-slate-500 dark:bg-slate-700 dark:border-slate-600'
                    }`}
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>{selectedPost.status === 'Tackled' ? getTranslation(lang, 'tackled') : getTranslation(lang, 'prevailing')}</span>
                  </button>
                </div>

                {/* Edit options if author */}
                {selectedPost.author === currentUser.username ? (
                  !isEditing ? (
                    <button
                      onClick={startEditing}
                      className="flex items-center gap-1.5 text-xs font-bold text-[#4c6c9a] hover:underline"
                    >
                      <Edit2 className="w-4 h-4" />
                      <span>Edit Details</span>
                    </button>
                  ) : (
                    <div className="flex gap-2">
                      <button
                        onClick={handleEditSave}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-[10px] rounded-lg transition-all flex items-center gap-1"
                        title="Save Changes"
                      >
                        <Check className="w-3.5 h-3.5" /> Save
                      </button>
                      <button
                        onClick={() => setIsEditing(false)}
                        className="px-3 py-1.5 bg-red-600 hover:bg-red-750 text-white font-extrabold text-[10px] rounded-lg transition-all flex items-center gap-1"
                        title="Cancel"
                      >
                        <X className="w-3.5 h-3.5" /> Cancel
                      </button>
                    </div>
                  )
                ) : (
                  <span className="text-[10px] text-slate-400 font-bold italic bg-slate-50 dark:bg-slate-900 px-2.5 py-1 rounded-lg">
                    Read-Only Access
                  </span>
                )}
              </div>

              {/* Photo & GPS Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                <div className="rounded-2xl overflow-hidden border border-slate-100 dark:border-slate-700 shadow-sm transition-all hover:shadow-md">
                  <img
                    src={selectedPost.photoUrl}
                    alt={selectedPost.issueType}
                    className="w-full object-cover max-h-[340px]"
                    referrerPolicy="no-referrer"
                  />
                </div>

                <div className="space-y-5 bg-slate-50/50 dark:bg-slate-900/30 p-6 rounded-2xl border border-slate-100 dark:border-slate-700/60">
                  <div className="space-y-1.5">
                    <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block">
                      Geographic Location
                    </span>
                    <p className="text-sm font-extrabold text-slate-800 dark:text-slate-100 flex items-start gap-1.5 leading-snug">
                      <MapPin className="w-4.5 h-4.5 text-[#6b9661] flex-shrink-0 mt-0.5 animate-bounce" />
                      <span>{selectedPost.location.address}</span>
                    </p>
                    <span className="text-[10px] font-mono font-semibold text-slate-400 bg-white dark:bg-slate-800 px-2.5 py-1 rounded shadow-sm inline-block">
                      GPS coordinates: {selectedPost.location.lat}, {selectedPost.location.lng}
                    </span>
                  </div>

                  <div className="space-y-2 pt-2 border-t border-slate-200/60 dark:border-slate-700/60">
                    <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block">
                      Rough Dimensions
                    </span>
                    <div className="flex flex-wrap gap-2.5 text-xs text-slate-700 dark:text-slate-300 font-bold">
                      {selectedPost.dimensions.area && (
                        <span className="bg-white dark:bg-slate-800 px-3.5 py-1.5 rounded-xl border border-slate-100 dark:border-slate-700 shadow-sm">
                          Area: {selectedPost.dimensions.area}
                        </span>
                      )}
                      {selectedPost.dimensions.depth && (
                        <span className="bg-white dark:bg-slate-800 px-3.5 py-1.5 rounded-xl border border-slate-100 dark:border-slate-700 shadow-sm">
                          Depth: {selectedPost.dimensions.depth}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Editing Form / Details display */}
              {isEditing ? (
                <div className="space-y-4 bg-slate-50 dark:bg-slate-900/40 p-6 rounded-2xl border border-slate-150 dark:border-slate-700">
                  <div className="space-y-1">
                    <label className="text-[10px] font-extrabold text-slate-400 uppercase">Edit Description</label>
                    <textarea
                      rows={3}
                      value={editDesc}
                      onChange={(e) => setEditDesc(e.target.value)}
                      className="w-full bg-white dark:bg-slate-900 text-xs font-semibold border border-slate-200 dark:border-slate-700 rounded-xl p-3 focus:outline-none focus:border-[#4c6c9a]"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-extrabold text-slate-400 uppercase">Area</label>
                      <input
                        type="text"
                        value={editArea}
                        onChange={(e) => setEditArea(e.target.value)}
                        className="w-full bg-white dark:bg-slate-900 text-xs font-bold border border-slate-200 dark:border-slate-700 rounded-xl p-3 focus:outline-none focus:border-[#4c6c9a]"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-extrabold text-slate-400 uppercase">Depth</label>
                      <input
                        type="text"
                        value={editDepth}
                        onChange={(e) => setEditDepth(e.target.value)}
                        className="w-full bg-white dark:bg-slate-900 text-xs font-bold border border-slate-200 dark:border-slate-700 rounded-xl p-3 focus:outline-none focus:border-[#4c6c9a]"
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">
                      Citizens Report Details
                    </span>
                    <span className="text-[10px] font-bold text-[#4c6c9a]">
                      Logged: {new Date(selectedPost.timestamp).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-sm font-medium text-slate-800 dark:text-slate-100 leading-relaxed bg-slate-50 dark:bg-slate-900/30 p-5 rounded-2xl border border-slate-100 dark:border-slate-700/60 shadow-inner">
                    {selectedPost.description}
                  </p>
                </div>
              )}

              {/* 24-Hour Public Verification Voting */}
              <div className="p-6 bg-gradient-to-tr from-[#4c6c9a]/5 to-[#6b9661]/5 dark:from-[#4c6c9a]/10 dark:to-[#6b9661]/10 rounded-2xl border border-slate-100 dark:border-slate-700/60 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 dark:border-slate-700/50 pb-3 gap-2">
                  <div>
                    <h4 className="text-xs font-black text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                      <ShieldCheck className="w-4.5 h-4.5 text-[#6b9661]" />
                      24-Hour Public Verification Voting Consensus
                    </h4>
                    <p className="text-[10px] text-slate-400 dark:text-slate-500">
                      Help authenticate town facts. Non-anonymous democratic upvoting.
                    </p>
                  </div>
                  
                  {selectedPost.isVerified ? (
                    <span className="bg-emerald-500 text-white text-[9px] font-extrabold px-2.5 py-1 rounded-full flex items-center gap-1 shadow-sm uppercase tracking-wider self-start sm:self-auto">
                      <Sparkles className="w-3 h-3 text-white animate-pulse" />
                      {getTranslation(lang, 'verifiedTag')}
                    </span>
                  ) : (
                    <span className="bg-slate-100 dark:bg-slate-700 text-slate-400 text-[9px] font-extrabold px-2.5 py-1 rounded-full uppercase tracking-wider self-start sm:self-auto">
                      {getTranslation(lang, 'notVerified')}
                    </span>
                  )}
                </div>

                {/* Two Questions voting */}
                <div className="space-y-3.5 text-xs font-bold text-slate-600 dark:text-slate-300">
                  {/* Question 1 */}
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                    <span>Q1: {getTranslation(lang, 'voteQuestion1')}</span>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleVote('issue', 'YES')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-extrabold flex items-center gap-1 transition-all ${
                          selectedPost.userVotes.some(v => v.username === currentUser.username && v.questionType === 'issue' && v.vote === 'YES')
                            ? 'bg-[#6b9661] text-white shadow-sm'
                            : 'bg-slate-100 dark:bg-slate-750 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        {getTranslation(lang, 'yes')} ({selectedPost.votesYesIssue})
                      </button>
                      <button
                        onClick={() => handleVote('issue', 'NO')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-extrabold flex items-center gap-1 transition-all ${
                          selectedPost.userVotes.some(v => v.username === currentUser.username && v.questionType === 'issue' && v.vote === 'NO')
                            ? 'bg-red-500 text-white shadow-sm'
                            : 'bg-slate-100 dark:bg-slate-750 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        {getTranslation(lang, 'no')} ({selectedPost.votesNoIssue})
                      </button>
                    </div>
                  </div>

                  {/* Question 2 */}
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pt-2.5 border-t border-dashed border-slate-150 dark:border-slate-700">
                    <span>Q2: {getTranslation(lang, 'voteQuestion2')}</span>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleVote('resolved', 'YES')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-extrabold flex items-center gap-1 transition-all ${
                          selectedPost.userVotes.some(v => v.username === currentUser.username && v.questionType === 'resolved' && v.vote === 'YES')
                            ? 'bg-[#6b9661] text-white shadow-sm'
                            : 'bg-slate-100 dark:bg-slate-750 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        {getTranslation(lang, 'yes')} ({selectedPost.votesYesResolved})
                      </button>
                      <button
                        onClick={() => handleVote('resolved', 'NO')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-extrabold flex items-center gap-1 transition-all ${
                          selectedPost.userVotes.some(v => v.username === currentUser.username && v.questionType === 'resolved' && v.vote === 'NO')
                            ? 'bg-red-500 text-white shadow-sm'
                            : 'bg-slate-100 dark:bg-slate-750 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        {getTranslation(lang, 'no')} ({selectedPost.votesNoResolved})
                      </button>
                    </div>
                  </div>
                </div>

                {/* Forwarding Status if verified */}
                {selectedPost.isVerified && (
                  <div className="pt-3 border-t border-slate-150 dark:border-slate-700/60 flex items-center justify-between text-[10px] text-[#4c6c9a] font-bold">
                    <span>{getTranslation(lang, 'forwardedTo')}:</span>
                    <span className="bg-[#4c6c9a]/10 px-2.5 py-1 rounded font-mono text-xs uppercase text-slate-700 dark:text-slate-200">
                      {selectedPost.issueType === 'Potholes' ? 'BBMP Roads Division' :
                       selectedPost.issueType === 'Water Leakage' ? 'BWSSB Pipelines Team' :
                       selectedPost.issueType === 'Damaged Streetlights' ? 'BESCOM lighting Corp' :
                       selectedPost.issueType === 'Waste Management' ? 'BBMP Swachh Division' : 'BMC Municipality'}
                    </span>
                  </div>
                )}
              </div>

              {/* Comment Section with AI moderation */}
              <div className="space-y-5 pt-4 border-t border-slate-100 dark:border-slate-700">
                <h4 className="text-xs font-black text-slate-800 dark:text-slate-300 flex items-center gap-1.5">
                  <MessageSquare className="w-4.5 h-4.5 text-[#4c6c9a]" />
                  AI-Moderated Citizen Logs ({activeComments.length})
                </h4>

                {/* AI warnings or errors */}
                <AnimatePresence>
                  {isCheckingAi && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="p-3.5 bg-blue-50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/30 text-blue-600 dark:text-blue-400 rounded-xl text-[11px] leading-relaxed flex items-center gap-2"
                    >
                      <Sparkles className="w-4 h-4 text-amber-500 animate-spin" />
                      <span>CivicLens AI Moderator is evaluating relevance...</span>
                    </motion.div>
                  )}

                  {aiFilterWarning && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="p-3.5 bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/30 text-red-600 dark:text-red-400 rounded-xl text-[11px] leading-relaxed flex gap-2"
                    >
                      <ShieldAlert className="w-4 h-4 flex-shrink-0 mt-0.5" />
                      <span>{aiFilterWarning}</span>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Comments List */}
                <div className="space-y-4 max-h-[350px] overflow-y-auto pr-1">
                  {activeComments.length === 0 ? (
                    <p className="text-xs text-slate-400 italic text-center py-6 bg-slate-50 dark:bg-slate-900/20 rounded-2xl border border-dashed border-slate-150 dark:border-slate-750">
                      No citizen logs registered on this report yet.
                    </p>
                  ) : (
                    activeComments.map((comm) => {
                      const isCurrentlyEditing = editingCommentId === comm.id;
                      const isAuthor = comm.author === currentUser.username;
                      return (
                        <div
                          key={comm.id}
                          className={`p-4 rounded-2xl border text-xs leading-relaxed transition-all duration-200 hover:shadow-sm ${
                            comm.isIssueOriented
                              ? 'bg-slate-50 border-slate-100 dark:bg-slate-900/20 dark:border-slate-750'
                              : 'bg-red-50/40 border-red-100 dark:bg-red-950/10 dark:border-red-900/20 opacity-85'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1.5 text-[10px] font-bold">
                            <div className="flex items-center gap-1.5">
                              <span className="text-slate-700 dark:text-slate-300 font-extrabold">@{comm.author}</span>
                              {isAuthor && (
                                <span className="bg-[#4c6c9a]/10 text-[#4c6c9a] dark:text-blue-400 px-1.5 py-0.2 rounded-full text-[8px] tracking-wider uppercase font-black">You</span>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-slate-400 font-medium">{new Date(comm.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                              {isAuthor && comm.isIssueOriented && !isCurrentlyEditing && (
                                <div className="flex items-center gap-1.5">
                                  <button
                                    onClick={() => {
                                      setEditingCommentId(comm.id);
                                      setEditingCommentText(comm.text);
                                    }}
                                    className="p-1 hover:bg-slate-200/50 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 rounded-md transition-colors cursor-pointer"
                                    title="Edit Comment"
                                  >
                                    <Edit2 className="w-3 h-3" />
                                  </button>
                                  <button
                                    onClick={() => {
                                      if (onDeleteComment) onDeleteComment(comm.id);
                                    }}
                                    className="p-1 hover:bg-red-50 dark:hover:bg-red-950/30 text-red-500 rounded-md transition-colors cursor-pointer"
                                    title="Delete Comment"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>

                          {isCurrentlyEditing ? (
                            <div className="space-y-2 mt-1">
                              <input
                                type="text"
                                value={editingCommentText}
                                onChange={(e) => setEditingCommentText(e.target.value)}
                                className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-semibold rounded-lg p-2 focus:outline-none"
                              />
                              <div className="flex justify-end gap-1.5">
                                <button
                                  onClick={() => {
                                    if (onEditComment && editingCommentText.trim()) {
                                      onEditComment(comm.id, editingCommentText);
                                    }
                                    setEditingCommentId(null);
                                  }}
                                  className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] rounded-lg transition-all flex items-center gap-1"
                                >
                                  <Check className="w-3 h-3" /> Save
                                </button>
                                <button
                                  onClick={() => setEditingCommentId(null)}
                                  className="px-2 py-1 bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 font-bold text-[10px] rounded-lg transition-all flex items-center gap-1"
                                >
                                  <X className="w-3 h-3" /> Cancel
                                </button>
                              </div>
                            </div>
                          ) : (
                            <p className={`${comm.isIssueOriented ? 'text-slate-600 dark:text-slate-300 font-medium' : 'text-red-500 line-through italic'}`}>
                              {comm.text}
                            </p>
                          )}

                          {!comm.isIssueOriented && (
                            <div className="mt-1.5 flex items-center gap-1 text-[9px] text-red-500 font-bold bg-red-50 dark:bg-red-950/40 px-1.5 py-0.5 rounded w-fit">
                              <ShieldAlert className="w-3 h-3" />
                              <span>{comm.moderationReason}</span>
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Comment input form */}
                <form onSubmit={handleCommentSubmit} className="space-y-2.5">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder={getTranslation(lang, 'addComment')}
                      value={newCommentText}
                      disabled={isCheckingAi}
                      onChange={(e) => setNewCommentText(e.target.value)}
                      className="flex-grow bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200 text-xs font-semibold px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-[#4c6c9a] disabled:opacity-55"
                    />
                    <button
                      type="submit"
                      disabled={isCheckingAi}
                      className="bg-[#4c6c9a] hover:bg-[#4c6c9a]/90 text-white font-bold text-xs px-5 rounded-xl transition-all shadow-md disabled:bg-slate-400 flex items-center gap-1.5"
                    >
                      {isCheckingAi ? 'Verifying...' : 'Post Log'}
                    </button>
                  </div>
                  <span className="text-[10px] text-slate-450 dark:text-slate-500 block leading-normal">
                    {getTranslation(lang, 'commentNotice')}
                  </span>
                </form>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
}
