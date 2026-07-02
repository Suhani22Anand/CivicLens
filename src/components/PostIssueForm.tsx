import React, { useState, useEffect } from 'react';
import { Post, AppLanguage, SeverityType, LocationDetail, DimensionsDetail, UserProfile } from '../types';
import { getTranslation } from '../utils/translate';
import { motion, AnimatePresence } from 'motion/react';
import { Camera, MapPin, Mic, ArrowRight, ArrowLeft, CheckCircle, ShieldAlert, Sparkles, Wand2, RefreshCw, Video } from 'lucide-react';
import { statesAndCities } from '../data/sampleData';

interface PostIssueFormProps {
  onAddPost: (newPost: Omit<Post, 'id' | 'votesYesIssue' | 'votesNoIssue' | 'votesYesResolved' | 'votesNoResolved' | 'userVotes' | 'isVerified' | 'forwardedTo'>) => void;
  currentUser: UserProfile;
  lang: AppLanguage;
  onNavigateToHome: () => void;
}

// Preset mock photo options with associated AI scan suggestions
const mockPhotos = [
  {
    id: 'pothole',
    name: 'Asphalt Pothole',
    url: 'https://images.unsplash.com/photo-1515162305285-0293e4767cc2?auto=format&fit=crop&w=800&q=80',
    type: 'Potholes',
    severity: 'Medium' as SeverityType,
    desc: 'Deep pothole along the high-traffic corridor.',
    dimensions: { area: '12 sq.ft', depth: '5 inches' }
  },
  {
    id: 'water',
    name: 'Water Pipeline Burst',
    url: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=800&q=80',
    type: 'Water Leakage',
    severity: 'High' as SeverityType,
    desc: 'Ruptured main line spraying clean water onto sidewalk.',
    dimensions: { area: '150 sq.ft', depth: 'N/A' }
  },
  {
    id: 'light',
    name: 'Unlit Broken Streetlamp',
    url: 'https://images.unsplash.com/photo-1542382257-201b7f493020?auto=format&fit=crop&w=800&q=80',
    type: 'Damaged Streetlights',
    severity: 'Low' as SeverityType,
    desc: 'Rusting fixture with shattered bulb. Totally dark lane.',
    dimensions: { area: '1 lamp post', depth: 'N/A' }
  },
  {
    id: 'waste',
    name: 'Overflowing Garbage Pile',
    url: 'https://images.unsplash.com/photo-1611284446314-60a58ac0deb9?auto=format&fit=crop&w=800&q=80',
    type: 'Waste Management',
    severity: 'Medium' as SeverityType,
    desc: 'Heaped plastic waste smelling strongly next to park.',
    dimensions: { area: '50 sq.ft', depth: '2 feet' }
  },
  {
    id: 'footpath',
    name: 'Broken Sidewalk Slab',
    url: 'https://images.unsplash.com/photo-1584467541268-b040f83be3fd?auto=format&fit=crop&w=800&q=80',
    type: 'Public Infrastructure',
    severity: 'High' as SeverityType,
    desc: 'Shattered pavement concrete exposing underlying drain.',
    dimensions: { area: '6 sq.ft', depth: '3 feet drain' }
  }
];

export default function PostIssueForm({ onAddPost, currentUser, lang, onNavigateToHome }: PostIssueFormProps) {
  const [step, setStep] = useState(1);
  const [selectedState, setSelectedState] = useState(currentUser.location.state);
  const [selectedCity, setSelectedCity] = useState(currentUser.location.city);

  // Form states
  const [selectedPhoto, setSelectedPhoto] = useState<typeof mockPhotos[0] | null>(null);
  const [customPhotoUrl, setCustomPhotoUrl] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [scanComplete, setScanComplete] = useState(false);

  const [issueType, setIssueType] = useState('Potholes');
  const [customIssueType, setCustomIssueType] = useState('');
  const [isCustomTypeActive, setIsCustomTypeActive] = useState(false);
  const [videoUrl, setVideoUrl] = useState('');
  
  const [severity, setSeverity] = useState<SeverityType>('Medium');
  const [description, setDescription] = useState('');
  const [area, setArea] = useState('');
  const [depth, setDepth] = useState('');

  // Voice simulator
  const [isRecording, setIsRecording] = useState(false);

  // GPS fetch simulator
  const [isFetchingGps, setIsFetchingGps] = useState(false);
  const [gpsData, setGpsData] = useState<LocationDetail | null>(null);

  // Update city if state changes
  useEffect(() => {
    const cities = statesAndCities[selectedState as keyof typeof statesAndCities] || [];
    if (cities.length > 0 && !cities.includes(selectedCity)) {
      setSelectedCity(cities[0]);
    }
  }, [selectedState]);

  // Simulate AI Vision scanning
  const handlePhotoSelect = (photo: typeof mockPhotos[0]) => {
    setSelectedPhoto(photo);
    setCustomPhotoUrl('');
    setIsScanning(true);
    setScanComplete(false);

    // Trigger scanning animation
    setTimeout(() => {
      setIsScanning(false);
      setScanComplete(true);
      // Auto recommend fields from mock database
      setIssueType(photo.type);
      setSeverity(photo.severity);
      if (!description) {
        setDescription(`AI detected issue: ${photo.desc}`);
      }
      setArea(photo.dimensions.area);
      setDepth(photo.dimensions.depth);
    }, 2200);
  };

  // Simulated Speech-to-Text translation
  const startVoiceRecording = () => {
    setIsRecording(true);
    setTimeout(() => {
      setIsRecording(false);
      const voiceTexts = {
        'Potholes': 'There is a medium-sized pothole here on the central lane which is causing water to splash onto the walkers and forcing motorcycles to take sudden risky cuts.',
        'Water Leakage': 'Clean water has been gushing from the pipe joints near the corner supermarket for hours now, creating a large pool on the main road.',
        'Damaged Streetlights': 'The corner lamp has been flickering and completely goes dead after eight in the evening, making the park crossing extremely dark and scary.',
        'Waste Management': 'People have dumped four large bags of stale food waste near the garbage bin and street dogs are scattering it all over the clean path.',
        'Public Infrastructure': 'The concrete sidewalk slabs have crumbled completely near the bus stop, making it difficult for elderly citizens to board.'
      };
      const recommendedText = voiceTexts[issueType as keyof typeof voiceTexts] || 'The sidewalk slab has collapsed, creating a hazard.';
      setDescription(recommendedText);
    }, 3000);
  };

  // Simulate location capture
  const handleFetchGps = () => {
    setIsFetchingGps(true);
    setTimeout(() => {
      setIsFetchingGps(false);
      
      // Generate randomized coordinates near center cities
      const baseCoords = {
        'Bengaluru': { lat: 12.9716, lng: 77.5946, street: 'Church Street, Mahatma Gandhi Rd' },
        'Mysuru': { lat: 12.2958, lng: 76.6394, street: 'Devaraja Double Rd, near Palace Gate' },
        'Mumbai': { lat: 19.0760, lng: 72.8777, street: 'Dr. Annie Besant Rd, Worli Naka' },
        'Pune': { lat: 18.5204, lng: 73.8567, street: 'F.C. Road, Shivajinagar' },
        'New Delhi': { lat: 28.6139, lng: 77.2090, street: 'Connaught Circle, Block G' },
        'Noida': { lat: 28.5355, lng: 77.3910, street: 'Sector 62, near Electronic City' },
        'Chennai': { lat: 13.0827, lng: 80.2707, street: 'Anna Salai, opposite LIC Metro' }
      };

      const cityData = baseCoords[selectedCity as keyof typeof baseCoords] || { lat: 12.9716, lng: 77.5946, street: 'Main Municipal Ring Road' };
      const offsetLat = (Math.random() - 0.5) * 0.01;
      const offsetLng = (Math.random() - 0.5) * 0.01;

      setGpsData({
        lat: Number((cityData.lat + offsetLat).toFixed(4)),
        lng: Number((cityData.lng + offsetLng).toFixed(4)),
        address: `${cityData.street}, ${selectedCity}, ${selectedState}, India`
      });
    }, 1500);
  };

  const handlePublish = () => {
    if (!description.trim()) {
      alert('Please provide a description.');
      return;
    }

    const finalPhotoUrl = selectedPhoto ? selectedPhoto.url : (customPhotoUrl || 'https://images.unsplash.com/photo-1584467541268-b040f83be3fd?auto=format&fit=crop&w=800&q=80');
    const finalLocation: LocationDetail = gpsData || {
      lat: 12.9716,
      lng: 77.5946,
      address: `Manual Entry: Near Main Street, ${selectedCity}, ${selectedState}`
    };

    const finalIssueType = (issueType || customIssueType || 'Other').trim();

    onAddPost({
      author: currentUser.username,
      state: selectedState,
      city: selectedCity,
      issueType: finalIssueType,
      severity,
      originalSeverities: [{ username: currentUser.username, severity: severity as 'Low' | 'Medium' | 'High' }],
      location: finalLocation,
      photoUrl: finalPhotoUrl,
      videoUrl: videoUrl.trim() ? videoUrl.trim() : undefined,
      description,
      dimensions: {
        area: area.trim() ? area : undefined,
        depth: depth.trim() ? depth : undefined,
      },
      status: 'Prevailing',
      timestamp: new Date().toISOString(),
    });

    onNavigateToHome();
  };

  return (
    <div className="max-w-3xl mx-auto bg-white dark:bg-slate-800 rounded-3xl shadow-md border border-slate-100 dark:border-slate-700 p-8" id="post-issue-wizard">
      {/* Wizard Header Progress */}
      <div className="flex items-center justify-between mb-8 border-b border-slate-50 dark:border-slate-700/60 pb-5">
        <div>
          <span className="text-xs font-bold text-[#6b9661] uppercase tracking-wider">
            {getTranslation(lang, 'navPostIssue')} Wizard
          </span>
          <h2 className="text-xl font-extrabold text-slate-800 dark:text-white mt-1">
            {step === 1 ? '1. Location & Image' : step === 2 ? '2. Category & AI Diagnostics' : '3. Final Details & Submit'}
          </h2>
        </div>
        <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-700 px-3 py-1.5 rounded-full text-xs font-bold text-slate-500 dark:text-slate-300">
          <span>{getTranslation(lang, 'step')} {step} / 3</span>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {step === 1 && (
          <motion.div
            key="step1"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            {/* Location selection */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 dark:text-slate-400">
                  {getTranslation(lang, 'selectState')}
                </label>
                <select
                  value={selectedState}
                  onChange={(e) => setSelectedState(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-4 py-2.5 rounded-xl text-sm font-semibold text-slate-800 dark:text-slate-100 focus:outline-none focus:border-[#4c6c9a]"
                >
                  {Object.keys(statesAndCities).map((state) => (
                    <option key={state} value={state}>{state}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 dark:text-slate-400">
                  {getTranslation(lang, 'selectCity')}
                </label>
                <select
                  value={selectedCity}
                  onChange={(e) => setSelectedCity(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-4 py-2.5 rounded-xl text-sm font-semibold text-slate-800 dark:text-slate-100 focus:outline-none focus:border-[#4c6c9a]"
                >
                  {(statesAndCities[selectedState as keyof typeof statesAndCities] || []).map((city) => (
                    <option key={city} value={city}>{city}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Photo Selection Grid */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                  <Camera className="w-4 h-4 text-[#4c6c9a]" />
                  {getTranslation(lang, 'choosePhoto')}
                </label>
                <span className="text-[10px] bg-[#6b9661]/10 text-[#6b9661] font-bold px-2 py-0.5 rounded">
                  Google Cloud Vision Connected
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                {mockPhotos.map((photo) => {
                  const isSelected = selectedPhoto?.id === photo.id;
                  return (
                    <button
                      key={photo.id}
                      type="button"
                      onClick={() => handlePhotoSelect(photo)}
                      className={`relative aspect-square rounded-xl overflow-hidden border-2 transition-all ${
                        isSelected 
                          ? 'border-[#6b9661] ring-4 ring-[#6b9661]/15 scale-95' 
                          : 'border-slate-100 dark:border-slate-700 opacity-70 hover:opacity-100'
                      }`}
                    >
                      <img 
                        src={photo.url} 
                        alt={photo.name} 
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex items-end p-2">
                        <span className="text-[10px] font-bold text-white line-clamp-1">
                          {photo.name}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Video Option (Optional) */}
            <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-3xl border border-slate-200/60 dark:border-slate-700 space-y-2">
              <label className="text-xs font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <Video className="w-4.5 h-4.5 text-rose-500" />
                Optional Video Upload (MP4 / WebM)
              </label>
              <div className="flex flex-col sm:flex-row gap-3 items-center">
                <input
                  type="text"
                  placeholder="Paste video URL, or click to upload simulated footage..."
                  value={videoUrl}
                  onChange={(e) => setVideoUrl(e.target.value)}
                  className="w-full flex-grow bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-4 py-2.5 rounded-xl text-xs font-semibold focus:outline-none focus:border-[#4c6c9a]"
                />
                <button
                  type="button"
                  onClick={() => {
                    setVideoUrl('https://assets.mixkit.co/videos/preview/mixkit-pothole-in-asphalt-road-43180-large.mp4');
                    alert('Simulated: Video file uploaded successfully!');
                  }}
                  className="bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 text-xs font-bold px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 w-full sm:w-auto flex-shrink-0"
                >
                  Simulate Video Upload
                </button>
              </div>
              {videoUrl && (
                <p className="text-[10px] text-[#6b9661] font-bold flex items-center gap-1 mt-1">
                  ✓ Video active: {videoUrl.substring(0, 60)}...
                </p>
              )}
            </div>

            {/* Simulated Live Scan Overlay if scanning */}
            <AnimatePresence>
              {isScanning && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="bg-[#4c6c9a]/5 border border-[#4c6c9a]/20 p-5 rounded-2xl flex flex-col items-center justify-center gap-3 overflow-hidden"
                >
                  <div className="relative">
                    <img 
                      src={selectedPhoto?.url} 
                      alt="scanning" 
                      className="w-28 h-28 rounded-lg object-cover blur-[1px]"
                      referrerPolicy="no-referrer"
                    />
                    {/* Pulsing scanning beam */}
                    <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#6b9661] to-transparent animate-bounce shadow-[0_0_15px_#6b9661] mt-5"></div>
                  </div>
                  <div className="flex items-center gap-2 text-xs font-bold text-[#4c6c9a]">
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Analyzing via Google Cloud Vision AI Diagnostics...</span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {scanComplete && !isScanning && (
              <div className="bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/40 p-4 rounded-xl flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                <div className="flex-grow flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-extrabold text-emerald-800 dark:text-emerald-400">
                      AI Auto-Detection Succeeded!
                    </h4>
                    <p className="text-[11px] text-emerald-600 dark:text-emerald-500 mt-0.5">
                      Recommended Category: <span className="font-bold">{issueType}</span> (98% confidence)
                    </p>
                  </div>
                  <span className="text-[10px] font-bold bg-emerald-500 text-white px-2.5 py-0.5 rounded-full flex items-center gap-1 shadow-sm">
                    <Sparkles className="w-3 h-3" /> Recommended
                  </span>
                </div>
              </div>
            )}

            {/* Navigation buttons */}
            <div className="flex justify-end pt-4">
              <button
                type="button"
                disabled={!selectedPhoto}
                onClick={() => setStep(2)}
                className={`flex items-center gap-2 text-white font-bold px-6 py-3 rounded-xl shadow-md transition-all ${
                  selectedPhoto 
                    ? 'bg-gradient-to-r from-[#4c6c9a] to-[#6b9661] hover:shadow-lg hover:scale-[1.02]' 
                    : 'bg-slate-300 dark:bg-slate-700 cursor-not-allowed'
                }`}
              >
                <span>{getTranslation(lang, 'next')}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}

        {step === 2 && (
          <motion.div
            key="step2"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            {/* Category selection */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 dark:text-slate-400">
                  Select Issue Type
                </label>
                <select
                  value={isCustomTypeActive ? 'ADD_NEW' : issueType}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === 'ADD_NEW') {
                      setIsCustomTypeActive(true);
                      setIssueType('');
                    } else {
                      setIsCustomTypeActive(false);
                      setIssueType(val);
                    }
                  }}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-4 py-2.5 rounded-xl text-sm font-semibold text-slate-800 dark:text-slate-100 focus:outline-none focus:border-[#4c6c9a]"
                >
                  <option value="Potholes">Potholes</option>
                  <option value="Water Leakage">Water Leakage</option>
                  <option value="Damaged Streetlights">Damaged Streetlights</option>
                  <option value="Waste Management">Waste Management</option>
                  <option value="Public Infrastructure">Public Infrastructure</option>
                  <option value="ADD_NEW">+ Add New Issue Type...</option>
                </select>

                {isCustomTypeActive && (
                  <motion.div 
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="pt-2 space-y-1"
                  >
                    <label className="text-[10px] font-bold text-[#4c6c9a] uppercase">
                      Enter Custom Issue Type
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Stray Cattle, Open Drain"
                      value={customIssueType}
                      onChange={(e) => {
                        setCustomIssueType(e.target.value);
                        setIssueType(e.target.value);
                      }}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-4 py-2 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-100 focus:outline-none focus:border-[#4c6c9a]"
                    />
                  </motion.div>
                )}

                <span className="text-[10px] text-slate-400 dark:text-slate-500 block pt-1">
                  Ground view is more accurate. Feel free to override the AI suggestion.
                </span>
              </div>

              {/* Severity selection */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 dark:text-slate-400">
                  Select Severity Level
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['Low', 'Medium', 'High'] as SeverityType[]).map((level) => {
                    const active = severity === level;
                    const colorMap = {
                      Low: 'hover:bg-slate-50 active:bg-slate-100 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300',
                      Medium: 'hover:bg-amber-50/40 active:bg-amber-100 border-amber-200 dark:border-amber-900 text-amber-600 dark:text-amber-400',
                      High: 'hover:bg-red-50/40 active:bg-red-100 border-red-200 dark:border-red-900 text-red-600 dark:text-red-400'
                    };
                    const activeColorMap = {
                      Low: 'bg-[#6b9661] text-white border-[#6b9661] shadow-md shadow-[#6b9661]/15',
                      Medium: 'bg-amber-500 text-white border-amber-500 shadow-md shadow-amber-500/15',
                      High: 'bg-red-500 text-white border-red-500 shadow-md shadow-red-500/15'
                    };

                    return (
                      <button
                        key={level}
                        type="button"
                        onClick={() => setSeverity(level)}
                        className={`py-2 px-3 border rounded-xl text-xs font-bold transition-all ${
                          active ? activeColorMap[level as 'Low'|'Medium'|'High'] : colorMap[level as 'Low'|'Medium'|'High']
                        }`}
                      >
                        {level}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* GPS Capture Widget */}
            <div className="bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-700/60 p-5 rounded-2xl space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-extrabold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 text-[#6b9661]" />
                    Fetch Hazard Coordinates
                  </h4>
                  <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
                    Utilizes Google Maps high-precision mobile tracking for verification accuracy.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleFetchGps}
                  disabled={isFetchingGps}
                  className="bg-[#4c6c9a] hover:bg-[#4c6c9a]/90 text-white text-[11px] font-bold px-3.5 py-2 rounded-xl shadow-sm transition-all flex items-center gap-1.5"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isFetchingGps ? 'animate-spin' : ''}`} />
                  {getTranslation(lang, 'gpsFetch')}
                </button>
              </div>

              {isFetchingGps && (
                <div className="flex items-center gap-2.5 text-xs text-slate-500 dark:text-slate-400 justify-center py-4">
                  <div className="w-4 h-4 border-2 border-t-transparent border-[#4c6c9a] rounded-full animate-spin"></div>
                  <span>{getTranslation(lang, 'gpsFetching')}</span>
                </div>
              )}

              {gpsData && !isFetchingGps && (
                <div className="p-3 bg-emerald-50 dark:bg-emerald-950/20 rounded-xl border border-emerald-100 dark:border-emerald-900/30 text-xs text-slate-700 dark:text-slate-300 space-y-1">
                  <div className="flex items-center gap-1.5 font-bold text-[#6b9661]">
                    <CheckCircle className="w-4 h-4" />
                    <span>{getTranslation(lang, 'gpsSuccess')}</span>
                  </div>
                  <p className="font-semibold text-slate-500 dark:text-slate-400">
                    Lat: <span className="text-slate-800 dark:text-white font-mono">{gpsData.lat}</span>, Lng: <span className="text-slate-800 dark:text-white font-mono">{gpsData.lng}</span>
                  </p>
                  <p className="text-slate-500 dark:text-slate-400 text-[11px] font-medium leading-relaxed">
                    {gpsData.address}
                  </p>
                </div>
              )}
            </div>

            {/* Navigation buttons */}
            <div className="flex justify-between pt-4">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="flex items-center gap-2 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-600 dark:text-slate-300 font-bold px-5 py-3 rounded-xl transition-all"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>{getTranslation(lang, 'back')}</span>
              </button>

              <button
                type="button"
                onClick={() => setStep(3)}
                className="flex items-center gap-2 text-white font-bold bg-gradient-to-r from-[#4c6c9a] to-[#6b9661] hover:shadow-lg px-6 py-3 rounded-xl transition-all hover:scale-[1.02]"
              >
                <span>{getTranslation(lang, 'next')}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}

        {step === 3 && (
          <motion.div
            key="step3"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            {/* Dimensions Specifications */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 dark:text-slate-400">
                  Approx Area (sq.ft / quantity)
                </label>
                <input
                  type="text"
                  placeholder="e.g. 15 sq.ft or 3 lamp posts"
                  value={area}
                  onChange={(e) => setArea(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-4 py-2.5 rounded-xl text-sm font-semibold text-slate-800 dark:text-slate-100 focus:outline-none focus:border-[#4c6c9a]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 dark:text-slate-400">
                  Approx Depth / Height
                </label>
                <input
                  type="text"
                  placeholder="e.g. 6 inches deep"
                  value={depth}
                  onChange={(e) => setDepth(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-4 py-2.5 rounded-xl text-sm font-semibold text-slate-800 dark:text-slate-100 focus:outline-none focus:border-[#4c6c9a]"
                />
              </div>
            </div>

            {/* Description Text with Speech to Text */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-500 dark:text-slate-400">
                  Detailed Hazard Description
                </label>

                {/* Speech to text simulator */}
                <button
                  type="button"
                  onClick={startVoiceRecording}
                  disabled={isRecording}
                  className={`text-[10px] font-bold px-3 py-1.5 rounded-lg flex items-center gap-1.5 border transition-all ${
                    isRecording 
                      ? 'bg-red-500 border-red-500 text-white animate-pulse' 
                      : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:border-[#4c6c9a] border-slate-200 dark:border-slate-700'
                  }`}
                >
                  <Mic className="w-3.5 h-3.5" />
                  {isRecording ? getTranslation(lang, 'recording') : getTranslation(lang, 'voicePostBtn')}
                </button>
              </div>

              <textarea
                rows={4}
                placeholder="Explain the specific risk, surrounding landmarks, and hazard conditions to help rescue workers find it..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-4 py-3 rounded-xl text-sm font-medium text-slate-800 dark:text-slate-100 focus:outline-none focus:border-[#4c6c9a] leading-relaxed"
              ></textarea>
            </div>

            {/* Identity disclosure notice */}
            <div className="p-4 bg-[#4c6c9a]/5 border border-[#4c6c9a]/25 rounded-2xl flex gap-3 items-start">
              <ShieldAlert className="w-5 h-5 text-[#4c6c9a] flex-shrink-0 mt-0.5" />
              <div className="text-xs space-y-1">
                <h4 className="font-bold text-slate-800 dark:text-slate-200">
                  Identified Citizen Responsibility Disclosure
                </h4>
                <p className="text-slate-500 dark:text-slate-400 leading-relaxed">
                  CivicLens is <span className="font-bold">strictly non-anonymous</span> to eliminate fake duplicates and misinformation. This post will be published under your active handle <span className="font-extrabold text-[#4c6c9a]">@{currentUser.username}</span>. You can only edit your own posts.
                </p>
              </div>
            </div>

            {/* Navigation buttons */}
            <div className="flex justify-between pt-4">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="flex items-center gap-2 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-600 dark:text-slate-300 font-bold px-5 py-3 rounded-xl transition-all"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>{getTranslation(lang, 'back')}</span>
              </button>

              <button
                type="button"
                onClick={handlePublish}
                className="flex items-center gap-2 text-white font-extrabold bg-[#6b9661] hover:bg-[#6b9661]/90 shadow-lg shadow-[#6b9661]/15 px-8 py-3.5 rounded-xl transition-all hover:scale-[1.02]"
              >
                <CheckCircle className="w-4.5 h-4.5" />
                <span>{getTranslation(lang, 'submit')}</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
