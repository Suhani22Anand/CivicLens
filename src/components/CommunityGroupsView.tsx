import React, { useState } from 'react';
import { CommunityGroup, AppLanguage } from '../types';
import { getTranslation } from '../utils/translate';
import { Users, Plus, MapPin, Calendar, Heart, ShieldCheck, Tag, PlusCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface CommunityGroupsViewProps {
  communities: CommunityGroup[];
  selectedCity: string;
  lang: AppLanguage;
  onCreateCommunity: (newGroup: Omit<CommunityGroup, 'id' | 'membersCount' | 'volunteersCount' | 'status'>) => void;
}

export default function CommunityGroupsView({
  communities,
  selectedCity,
  lang,
  onCreateCommunity,
}: CommunityGroupsViewProps) {
  const [showModal, setShowModal] = useState(false);
  const [cityFilter, setCityFilter] = useState(selectedCity || 'All');

  // New Group Form State
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newIssueType, setNewIssueType] = useState('Potholes');
  const [newCity, setNewCity] = useState(selectedCity || 'Bengaluru');
  const [newMeetup, setNewMeetup] = useState('');

  const issueTypes = ['Potholes', 'Water Leakage', 'Damaged Streetlights', 'Waste Management', 'Public Infrastructure'];

  // All distinct cities represented
  const allCities = ['All', ...Array.from(new Set(communities.map(c => c.city)))];

  const filteredCommunities = cityFilter === 'All'
    ? communities
    : communities.filter(c => c.city.toLowerCase() === cityFilter.toLowerCase());

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newDesc.trim()) return;

    onCreateCommunity({
      title: newTitle,
      description: newDesc,
      issueType: newIssueType,
      city: newCity,
      nextMeetup: newMeetup || undefined,
    });

    // Reset Form
    setNewTitle('');
    setNewDesc('');
    setNewMeetup('');
    setShowModal(false);
  };

  return (
    <div className="space-y-8" id="community-action-groups-view">
      
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-[#4c6c9a] to-[#6b9661] text-white p-8 rounded-3xl shadow-xl shadow-[#4c6c9a]/10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight">
            {getTranslation(lang, 'communityTitle')}
          </h2>
          <p className="text-sm opacity-90 mt-2 max-w-xl">
            Join forces with your neighbors to physically tackle verified issues. Plant trees, clean parks, or coordinate local safety walks.
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="bg-white hover:bg-slate-50 text-[#4c6c9a] font-extrabold text-sm px-6 py-3 rounded-2xl flex items-center gap-2 shadow-lg transition-transform hover:-translate-y-0.5"
        >
          <Plus className="w-5 h-5 text-[#6b9661]" />
          <span>Start Action Group</span>
        </button>
      </div>

      {/* Filter and Status Panel */}
      <div className="bg-white dark:bg-slate-800 p-5 rounded-3xl border border-slate-200/80 dark:border-slate-700 shadow-sm flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-[#4c6c9a]/10 rounded-2xl text-[#4c6c9a]">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-extrabold text-sm text-slate-800 dark:text-white leading-tight">
              Active Mobilizations
            </h3>
            <span className="text-xs text-slate-400 font-medium">
              {filteredCommunities.length} groups coordinated locally
            </span>
          </div>
        </div>

        {/* City Filter Tabs and Dropdown */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setCityFilter('All')}
            className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all ${
              cityFilter === 'All'
                ? 'bg-[#4c6c9a] text-white shadow'
                : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            All
          </button>

          <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 px-3 py-1.5 rounded-xl shadow-sm">
            <span className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
              City:
            </span>
            <select
              value={cityFilter === 'All' ? '' : cityFilter}
              onChange={(e) => setCityFilter(e.target.value || 'All')}
              className="bg-transparent text-xs font-bold text-slate-700 dark:text-slate-300 focus:outline-none cursor-pointer"
            >
              <option value="" className="text-slate-800 dark:text-slate-800">Select City...</option>
              {Array.from(new Set(communities.map(c => c.city))).map(city => (
                <option key={city} value={city} className="text-slate-800 dark:text-slate-800">
                  {city}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Grid of Action Groups */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {filteredCommunities.length === 0 ? (
          <div className="col-span-3 bg-white dark:bg-slate-800 p-12 text-center rounded-3xl border border-dashed border-slate-200 dark:border-slate-700">
            <Users className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
            <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">
              No active community action groups for {cityFilter} yet.
            </p>
            <p className="text-xs text-slate-400 mt-1">
              Be the first to start a clean-up or monitoring drive in this area!
            </p>
            <button
              onClick={() => setShowModal(true)}
              className="mt-4 text-xs font-bold text-[#4c6c9a] hover:underline"
            >
              Start group now &rarr;
            </button>
          </div>
        ) : (
          filteredCommunities.map((comm) => (
            <div
              key={comm.id}
              className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-700/60 shadow-sm hover:shadow-lg transition-all duration-300 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-[10px] font-extrabold uppercase bg-[#6b9661]/10 text-[#6b9661] border border-[#6b9661]/20 px-2.5 py-1 rounded-full">
                    {comm.issueType}
                  </span>
                  <span className="flex items-center gap-1.5 text-xs text-slate-400 font-semibold">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    {comm.city}
                  </span>
                </div>

                <h3 className="font-extrabold text-base text-slate-800 dark:text-white leading-snug">
                  {comm.title}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mt-2.5">
                  {comm.description}
                </p>
              </div>

              <div className="mt-6 pt-5 border-t border-slate-100 dark:border-slate-700/60 space-y-3">
                {comm.nextMeetup && (
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400 flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      Next Meetup:
                    </span>
                    <span className="font-extrabold text-slate-700 dark:text-slate-300">
                      {comm.nextMeetup}
                    </span>
                  </div>
                )}

                <div className="flex items-center justify-between text-xs pt-1.5">
                  <span className="text-slate-400 font-semibold">Total Mobilized:</span>
                  <div className="flex items-center gap-1">
                    <span className="font-black text-emerald-600 dark:text-emerald-400 text-sm">{comm.membersCount}</span>
                    <span className="text-[10px] text-slate-400 font-bold uppercase">Volunteers</span>
                  </div>
                </div>

                <button
                  onClick={() => alert(`Thank you for volunteering for "${comm.title}"! The organizer has been notified.`)}
                  className="w-full py-2.5 bg-slate-50 hover:bg-[#6b9661]/15 hover:text-[#6b9661] dark:bg-slate-700/60 dark:hover:bg-slate-700 transition-all rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 border border-transparent hover:border-[#6b9661]/30 uppercase tracking-wider"
                >
                  Join Action Group
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Creation Modal */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-slate-800 rounded-3xl max-w-md w-full p-6 border border-slate-200 dark:border-slate-700 space-y-4 shadow-2xl"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-700">
                <h3 className="text-base font-extrabold text-slate-800 dark:text-white flex items-center gap-2">
                  <Users className="w-5 h-5 text-[#4c6c9a]" />
                  Launch Action Group
                </h3>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-white font-extrabold text-sm"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4 text-xs">
                <div className="space-y-1">
                  <label className="font-extrabold text-slate-600 dark:text-slate-300">Group Title</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. HSR Clean Drive Initiative"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 p-2.5 rounded-xl font-bold focus:outline-none focus:border-[#4c6c9a]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-extrabold text-slate-600 dark:text-slate-300">Mission Description</label>
                  <textarea
                    required
                    placeholder="Describe how neighbors can help solve this issue physically..."
                    value={newDesc}
                    onChange={(e) => setNewDesc(e.target.value)}
                    rows={3}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 p-2.5 rounded-xl font-semibold focus:outline-none focus:border-[#4c6c9a]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="font-extrabold text-slate-600 dark:text-slate-300">Primary Category</label>
                    <select
                      value={newIssueType}
                      onChange={(e) => setNewIssueType(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 p-2.5 rounded-xl font-bold focus:outline-none"
                    >
                      {issueTypes.map(it => <option key={it} value={it}>{it}</option>)}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="font-extrabold text-slate-600 dark:text-slate-300">City Target</label>
                    <select
                      value={newCity}
                      onChange={(e) => setNewCity(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 p-2.5 rounded-xl font-bold focus:outline-none"
                    >
                      <option value="Bengaluru">Bengaluru</option>
                      <option value="Mumbai">Mumbai</option>
                      <option value="New Delhi">New Delhi</option>
                      <option value="Chennai">Chennai</option>
                      <option value="Kolkata">Kolkata</option>
                      <option value="Jaipur">Jaipur</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="font-extrabold text-slate-600 dark:text-slate-300">Next Meetup Date & Time (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. Saturday, July 10th @ 8:00 AM"
                    value={newMeetup}
                    onChange={(e) => setNewMeetup(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 p-2.5 rounded-xl font-bold focus:outline-none focus:border-[#4c6c9a]"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3 bg-[#6b9661] hover:bg-[#5a7f51] text-white rounded-xl font-extrabold transition-all shadow-lg uppercase tracking-wider mt-2"
                >
                  Create & Launch Group
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
