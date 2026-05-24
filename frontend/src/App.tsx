import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import {
  LayoutDashboard, Calendar, TrendingUp, Settings, Play, Pause, RotateCcw,
  AlertTriangle, CheckCircle, Clock, Users, Target, Zap, Activity,
  ChevronDown, ChevronUp, ChevronRight, X, Search, Plus, RefreshCw, BarChart3,
  Sparkles, Brain, Film, AlertCircle, Info, Upload, Trash2, Edit, Eye,
  Monitor, Smartphone, Globe, ArrowUpRight, ArrowDownRight, UploadCloud,
  FileVideo, Clock3, TrendingDown, Award, Star, Radio, Menu, Maximize2, Minimize2,
  Shield, LogOut
} from 'lucide-react';
import { useAuth, AuthProvider } from './contexts/AuthContext';
import { LoginPage } from './components/LoginPage';
import { AdminDashboard } from './components/AdminDashboard';
import { getMediaUploads, uploadMedia } from './lib/api';
import type {
  Content,
  ScheduleSlot,
  SelfHealingLog,
  RetentionForecast,
  TransitionHotspot,
  NLIntent,
  SimulationResult,
  ChannelConfig,
  WeekSchedule,
  MediaUpload,
  TopProgram,
  ChannelComparison,
} from './types';
import {
  mockContentCatalog,
  mockSelfHealingLogs,
  channelConfigs,
  weekSchedule,
  channelMetrics,
  channelComparisons,
  generateRetentionForecast,
  parseNaturalLanguageIntent,
  transitionScores
} from './data/mockData';

type TabType = 'dashboard' | 'schedule' | 'media' | 'analytics' | 'simulation' | 'settings' | 'admin';
type ViewMode = 'timeline' | 'grid' | 'list';
type ScheduleViewMode = 'day' | 'week';

function AppContent() {
  const { user, profile, loading, signOut, isAdmin } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [currentTime, setCurrentTime] = useState('14:32:08');
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulationResults, setSimulationResults] = useState<SimulationResult | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('timeline');
  const [scheduleViewMode, setScheduleViewMode] = useState<ScheduleViewMode>('week');
  const [selectedChannel, setSelectedChannel] = useState<ChannelConfig>(channelConfigs[0]);
  const [showChannelDropdown, setShowChannelDropdown] = useState(false);
  const [nlInput, setNlInput] = useState('');
  const [parsedIntent, setParsedIntent] = useState<NLIntent | null>(null);
  const [selectedDayIndex, setSelectedDayIndex] = useState(1);
  const [editingSlot, setEditingSlot] = useState<ScheduleSlot | null>(null);
  const [showEditWarning, setShowEditWarning] = useState(false);
  const [selfHealingLogs] = useState<SelfHealingLog[]>(mockSelfHealingLogs);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [selectedMedia, setSelectedMedia] = useState<MediaUpload | null>(null);
  const [mediaUploads, setMediaUploads] = useState<MediaUpload[]>([]);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadForm, setUploadForm] = useState({
    title: '',
    genre: '',
    rating: 'TV-G',
    targetAudience: '',
    description: '',
    transcription: '',
  });
  const [retentionForecast] = useState(generateRetentionForecast);
  const [showEditPanel, setShowEditPanel] = useState(false);
  const [showManualScheduleModal, setShowManualScheduleModal] = useState(false);
  const [editedSlotData, setEditedSlotData] = useState<{
    contentId: string;
    startTime: string;
    endTime: string;
  } | null>(null);
  const [manualScheduleData, setManualScheduleData] = useState({
    contentId: '',
    day: '2024-12-24',
    startTime: '06:00',
  });
  const channelDropdownRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [scheduleData, setScheduleData] = useState<WeekSchedule[]>(weekSchedule);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString('en-US', { hour12: false }));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (channelDropdownRef.current && !channelDropdownRef.current.contains(event.target as Node)) {
        setShowChannelDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const loadMediaUploads = useCallback(async () => {
    try {
      const data = await getMediaUploads();
      setMediaUploads(data as MediaUpload[]);
    } catch (error) {
      console.error('Error loading media uploads:', error);
    }
  }, []);

  useEffect(() => {
    loadMediaUploads();
  }, [loadMediaUploads]);

  const handleFileSelect = useCallback((file: File | null) => {
    if (!file) return;
    setUploadFile(file);
    setUploadError(null);
    setUploadForm(prev => ({
      ...prev,
      title: prev.title || file.name.replace(/\.[^/.]+$/, ''),
    }));
  }, []);

  const handleUploadSubmit = useCallback(async () => {
    if (!uploadFile) {
      setUploadError('Please select a video file to upload.');
      return;
    }
    setIsUploading(true);
    setUploadError(null);
    try {
      const uploaded = await uploadMedia(uploadFile, {
        title: uploadForm.title || uploadFile.name,
        description: uploadForm.description,
        genre: uploadForm.genre,
        rating: uploadForm.rating,
        targetAudience: uploadForm.targetAudience,
        transcription: uploadForm.transcription,
      });
      setMediaUploads(prev => [uploaded as MediaUpload, ...prev]);
      setShowUploadModal(false);
      setUploadFile(null);
      setUploadForm({
        title: '',
        genre: '',
        rating: 'TV-G',
        targetAudience: '',
        description: '',
        transcription: '',
      });
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : 'Upload failed');
    } finally {
      setIsUploading(false);
    }
  }, [uploadFile, uploadForm]);

  const contentMap = useMemo(() => {
    const map = new Map<string, Content>();
    mockContentCatalog.forEach(c => map.set(c.id, c));
    return map;
  }, []);

  const handleNLSubmit = useCallback(() => {
    if (!nlInput.trim()) return;
    const intent = parseNaturalLanguageIntent(nlInput);
    setParsedIntent(intent);
  }, [nlInput]);

  const runSimulation = useCallback(() => {
    setIsSimulating(true);
    setTimeout(() => {
      const allSlots = scheduleData.flatMap(d => d.slots);
      const hotspots: TransitionHotspot[] = allSlots
        .filter(s => s.transitionRisk === 'high')
        .map(s => {
          const content = contentMap.get(s.contentId);
          return {
            slotId: s.id,
            contentTitle: content?.title || 'Unknown',
            timeRange: `${s.startTime}-${s.endTime}`,
            risk: 'high' as const,
            predictedDropoff: s.predictedDropoff,
            suggestedFix: 'Consider moving to earlier time slot or pairing with similar genre content',
          };
        });

      setSimulationResults({
        scheduleId: 'schedule-001',
        predictedRetention: allSlots.reduce((acc, s) => acc + s.predictedRetention, 0) / allSlots.length,
        predictedExits: allSlots.reduce((acc, s) => acc + s.predictedDropoff, 0) / allSlots.length,
        predictedAdRevenue: 456000 + Math.random() * 89000,
        transitionHotpots: hotspots,
        optimizationSuggestions: [
          'Slot 10:00-11:00 shows strong audience retention. Consider extending nature content block.',
          'Transition at 16:00 predicted 18% drop-off. Suggest adding teaser for upcoming content.',
          'Holiday content performing 14% above weekday average. Recommend extending Christmas block.',
        ],
      });
      setIsSimulating(false);
    }, 2500);
  }, [scheduleData, contentMap]);

  const handleSlotEdit = useCallback((slot: ScheduleSlot) => {
    setEditingSlot(slot);
    setShowEditWarning(true);
  }, []);

  const confirmEdit = useCallback(() => {
    setShowEditWarning(false);
    setShowEditPanel(true);
    if (editingSlot) {
      setEditedSlotData({
        contentId: editingSlot.contentId,
        startTime: editingSlot.startTime,
        endTime: editingSlot.endTime,
      });
    }
  }, [editingSlot]);

  const cancelEdit = useCallback(() => {
    setShowEditWarning(false);
    setEditingSlot(null);
  }, []);

  const saveSlotEdit = useCallback(() => {
    if (!editingSlot || !editedSlotData) return;

    setScheduleData(prev => prev.map(day => ({
      ...day,
      slots: day.slots.map(slot => {
        if (slot.id === editingSlot.id) {
          const content = contentMap.get(editedSlotData.contentId);
          return {
            ...slot,
            contentId: editedSlotData.contentId,
            startTime: editedSlotData.startTime,
            endTime: editedSlotData.endTime,
            isEdited: true,
            predictedRetention: content?.completionRate || slot.predictedRetention,
            predictedDropoff: 100 - (content?.completionRate || slot.predictedRetention),
          };
        }
        return slot;
      }),
    })));

    setShowEditPanel(false);
    setEditingSlot(null);
    setEditedSlotData(null);
  }, [editingSlot, editedSlotData, contentMap]);

  const handleManualSchedule = useCallback(() => {
    if (!manualScheduleData.contentId || !manualScheduleData.day || !manualScheduleData.startTime) return;

    const content = contentMap.get(manualScheduleData.contentId);
    if (!content) return;

    const startHour = parseInt(manualScheduleData.startTime.split(':')[0]);
    const endHour = startHour + Math.ceil(content.duration / 60);
    const endTime = `${endHour.toString().padStart(2, '0')}:00`;

    const newSlot: ScheduleSlot = {
      id: `slot-manual-${Date.now()}`,
      contentId: manualScheduleData.contentId,
      startTime: manualScheduleData.startTime,
      endTime,
      predictedRetention: content.completionRate,
      predictedDropoff: 100 - content.completionRate,
      confidence: 0.75,
      adBreaks: [{ id: `ad-manual-${Date.now()}`, position: Math.ceil(content.duration / 3), duration: 180, predictedImpressions: 150000, predictedCompletionRate: 82, type: 'midroll' }],
      status: 'scheduled',
      transitionRisk: 'medium',
      day: manualScheduleData.day,
      isEdited: true,
    };

    setScheduleData(prev => prev.map(day => {
      if (day.date === manualScheduleData.day) {
        return {
          ...day,
          slots: [...day.slots, newSlot].sort((a, b) => {
            const timeA = parseInt(a.startTime.split(':')[0]);
            const timeB = parseInt(b.startTime.split(':')[0]);
            return timeA - timeB;
          }),
        };
      }
      return day;
    }));

    setShowManualScheduleModal(false);
    setManualScheduleData({ contentId: '', day: '2024-12-24', startTime: '06:00' });
  }, [manualScheduleData, contentMap]);

  const getTransitionColor = (risk: 'low' | 'medium' | 'high') => {
    switch (risk) {
      case 'low': return 'bg-emerald-500';
      case 'medium': return 'bg-amber-500';
      case 'high': return 'bg-rose-500';
    }
  };

  const formatTime = (time: string) => {
    const [hours] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour} ${ampm}`;
  };

  const getStatusIcon = (status: ScheduleSlot['status']) => {
    switch (status) {
      case 'scheduled': return <Clock className="w-4 h-4 text-slate-400" />;
      case 'live': return <Play className="w-4 h-4 text-green-400" />;
      case 'completed': return <CheckCircle className="w-4 h-4 text-slate-500" />;
      case 'conflict': return <AlertTriangle className="w-4 h-4 text-rose-400" />;
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes >= 1e9) return `${(bytes / 1e9).toFixed(1)} GB`;
    if (bytes >= 1e6) return `${(bytes / 1e6).toFixed(1)} MB`;
    return `${(bytes / 1e3).toFixed(1)} KB`;
  };

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };

  const navItems = [
    { id: 'dashboard' as TabType, icon: LayoutDashboard, label: 'Dashboard' },
    { id: 'schedule' as TabType, icon: Calendar, label: 'Schedule Builder' },
    { id: 'media' as TabType, icon: Upload, label: 'Media Upload' },
    { id: 'analytics' as TabType, icon: TrendingUp, label: 'Analytics' },
    { id: 'simulation' as TabType, icon: Brain, label: 'Digital Twin' },
    { id: 'settings' as TabType, icon: Settings, label: 'Settings' },
  ];

  // Add admin tab for admins
  const adminNavItems = isAdmin
    ? [{ id: 'admin' as TabType, icon: Shield, label: 'Admin Panel' }, ...navItems]
    : navItems;

  useEffect(() => {
    const handleResize = () => {
      setSidebarCollapsed(window.innerWidth < 1024);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Show login if not authenticated
  const [isSignUp, setIsSignUp] = useState(false);

  if (!loading && !user) {
    return <LoginPage isSignUp={isSignUp} onToggleMode={() => setIsSignUp(!isSignUp)} />;
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex">
      {/* Left Sidebar Navigation */}
      <aside className={`${sidebarCollapsed ? 'w-16' : 'w-64'} bg-slate-900 border-r border-slate-800 flex flex-col transition-all duration-300 flex-shrink-0`}>
        <div className="p-4 border-b border-slate-800">
          <div className={`flex items-center ${sidebarCollapsed ? 'justify-center' : 'gap-3'}`}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20 flex-shrink-0">
              <Radio className="w-6 h-6 text-white" />
            </div>
            {!sidebarCollapsed && (
              <div>
                <h1 className="text-sm font-semibold text-white tracking-tight">AI Smart Scheduler</h1>
                <p className="text-xs text-slate-400">FAST Channel Optimization</p>
              </div>
            )}
          </div>
        </div>

        <button
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          className="hidden lg:flex mx-4 mt-3 p-2 rounded-lg bg-slate-800 hover:bg-slate-700 transition-colors justify-center items-center"
        >
          {sidebarCollapsed ? <ChevronRight className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
        </button>

        <nav className="flex-1 p-3 space-y-1">
          {adminNavItems.map(({ id, icon: Icon, label }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`w-full flex items-center ${sidebarCollapsed ? 'justify-center' : 'gap-3'} px-3 py-2.5 rounded-lg transition-all ${
                activeTab === id
                  ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
              }`}
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              {!sidebarCollapsed && <span className="text-sm font-medium">{label}</span>}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-800">
          {profile && (
            <div className="bg-slate-800/50 rounded-lg p-3 mb-3">
              <div className={`flex items-center ${sidebarCollapsed ? 'justify-center' : 'gap-2'} mb-2`}>
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white text-xs font-bold">
                  {profile.full_name?.charAt(0).toUpperCase() || '?'}
                </div>
                {!sidebarCollapsed && (
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-200 truncate">{profile.full_name || 'User'}</p>
                    <p className="text-xs text-slate-400">{profile.role === 'admin' ? 'Administrator' : 'Employee'}</p>
                  </div>
                )}
              </div>
              <button
                onClick={signOut}
                className={`w-full flex items-center ${sidebarCollapsed ? 'justify-center' : 'justify-center gap-2'} px-3 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-xs text-slate-300 mt-2`}
                title="Sign Out"
              >
                <LogOut className="w-3.5 h-3.5" />
                {!sidebarCollapsed && <span>Sign Out</span>}
              </button>
            </div>
          )}
          {!sidebarCollapsed && (
            <div className="bg-slate-800/50 rounded-lg p-2">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-xs text-slate-400">Live Sync</span>
              </div>
              <p className="text-xs font-mono text-slate-500">{currentTime}</p>
            </div>
          )}
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header */}
        <header className="bg-slate-900 border-b border-slate-800 px-4 lg:px-6 py-3">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                className="lg:hidden p-2 rounded-lg bg-slate-800 hover:bg-slate-700"
              >
                <Menu className="w-5 h-5 text-slate-400" />
              </button>

              {/* Channel Dropdown */}
              <div className="relative" ref={channelDropdownRef}>
                <button
                  onClick={() => setShowChannelDropdown(!showChannelDropdown)}
                  className="flex items-center gap-3 bg-slate-800 px-3 lg:px-4 py-2 rounded-lg border border-slate-700 hover:bg-slate-700 transition-colors min-w-[180px] lg:min-w-[220px]"
                >
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: selectedChannel.color }}
                  />
                  <div className="flex-1 text-left">
                    <p className="text-sm font-medium text-slate-100 truncate">{selectedChannel.name}</p>
                    <p className="text-xs text-slate-400">{selectedChannel.primaryGenre}</p>
                  </div>
                  <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${showChannelDropdown ? 'rotate-180' : ''}`} />
                </button>

                {showChannelDropdown && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-slate-800 rounded-xl border border-slate-700 shadow-xl shadow-black/50 z-50 overflow-hidden">
                    <div className="p-2 border-b border-slate-700">
                      <p className="text-xs text-slate-400 px-2">Select Channel</p>
                    </div>
                    <div className="max-h-72 overflow-y-auto p-2 space-y-1">
                      {channelConfigs.map(channel => (
                        <button
                          key={channel.id}
                          onClick={() => {
                            setSelectedChannel(channel);
                            setShowChannelDropdown(false);
                          }}
                          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                            selectedChannel.id === channel.id
                              ? 'bg-cyan-500/10 border border-cyan-500/30'
                              : 'hover:bg-slate-700'
                          }`}
                        >
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: channel.color }}
                          />
                          <div className="flex-1 text-left">
                            <p className="text-sm font-medium text-slate-100">{channel.name}</p>
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-slate-400">{channel.primaryGenre}</span>
                              <span className={`text-xs ${channel.growth >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                {channel.growth >= 0 ? '+' : ''}{channel.growth}%
                              </span>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-xs text-slate-400">{(channel.viewerCount! / 1000).toFixed(0)}K</p>
                            <span className={`text-xs px-1.5 py-0.5 rounded ${
                              channel.status === 'active' ? 'bg-emerald-500/20 text-emerald-400' :
                              channel.status === 'maintenance' ? 'bg-amber-500/20 text-amber-400' :
                              'bg-slate-500/20 text-slate-400'
                            }`}>
                              {channel.status}
                            </span>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center gap-4">
              <p className="text-sm font-mono text-slate-300 hidden sm:block">{currentTime}</p>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-xs text-emerald-400 font-medium hidden sm:block">LIVE</span>
              </div>

              {/* User Menu in Header */}
              {profile && (
                <div className="flex items-center gap-3 ml-2 pl-4 border-l border-slate-700">
                  <div className="hidden sm:block text-right">
                    <p className="text-sm font-medium text-slate-200">{profile.full_name || 'User'}</p>
                    <p className="text-xs text-slate-400 capitalize">{profile.role}</p>
                  </div>
                  <button
                    onClick={signOut}
                    className="flex items-center gap-2 px-3 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-sm text-slate-300 border border-slate-700"
                  >
                    <LogOut className="w-4 h-4" />
                    <span className="hidden sm:inline">Sign Out</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-auto p-4 lg:p-6">
          {/* Dashboard */}
          {activeTab === 'dashboard' && (
            <div className="space-y-4 lg:space-y-6 max-w-7xl mx-auto">
              {/* Executing States Header */}
              <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 p-4 lg:p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg lg:text-xl font-semibold text-slate-100 flex items-center gap-2">
                    <Activity className="w-5 h-5 text-cyan-400" />
                    Channel Status - {selectedChannel.name}
                  </h2>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs px-3 py-1.5 rounded-full ${
                      selectedChannel.status === 'active' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                      selectedChannel.status === 'maintenance' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                      'bg-slate-500/20 text-slate-400 border border-slate-500/30'
                    }`}>
                      {selectedChannel.status.toUpperCase()}
                    </span>
                  </div>
                </div>

                {/* Key Metrics Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 lg:gap-4">
                  <div className="bg-slate-700/30 rounded-lg p-3 lg:p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Users className="w-4 h-4 text-cyan-400" />
                      <span className="text-xs text-slate-400">Viewers</span>
                    </div>
                    <p className="text-lg lg:text-2xl font-bold text-white">{(channelMetrics.audienceCount / 1000).toFixed(0)}K</p>
                    <p className="text-xs text-emerald-400 flex items-center gap-1 mt-1">
                      <ArrowUpRight className="w-3 h-3" /> +{channelMetrics.weeklyGrowth}%
                    </p>
                  </div>
                  <div className="bg-slate-700/30 rounded-lg p-3 lg:p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <TrendingUp className="w-4 h-4 text-emerald-400" />
                      <span className="text-xs text-slate-400">Retention</span>
                    </div>
                    <p className="text-lg lg:text-2xl font-bold text-white">{channelMetrics.weeklyRetention}%</p>
                    <p className="text-xs text-emerald-400 flex items-center gap-1 mt-1">
                      <ArrowUpRight className="w-3 h-3" /> +3%
                    </p>
                  </div>
                  <div className="bg-slate-700/30 rounded-lg p-3 lg:p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Clock3 className="w-4 h-4 text-amber-400" />
                      <span className="text-xs text-slate-400">Ad Watch</span>
                    </div>
                    <p className="text-lg lg:text-2xl font-bold text-white">{channelMetrics.adWatchTime}m</p>
                    <p className="text-xs text-emerald-400 flex items-center gap-1 mt-1">
                      <ArrowUpRight className="w-3 h-3" /> +2m
                    </p>
                  </div>
                  <div className="bg-slate-700/30 rounded-lg p-3 lg:p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Clock className="w-4 h-4 text-purple-400" />
                      <span className="text-xs text-slate-400">Avg Duration</span>
                    </div>
                    <p className="text-lg lg:text-2xl font-bold text-white">{channelMetrics.avgViewDuration}m</p>
                    <p className="text-xs text-emerald-400 flex items-center gap-1 mt-1">
                      <ArrowUpRight className="w-3 h-3" /> +5m
                    </p>
                  </div>
                  <div className="bg-slate-700/30 rounded-lg p-3 lg:p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Award className="w-4 h-4 text-rose-400" />
                      <span className="text-xs text-slate-400">Peak Time</span>
                    </div>
                    <p className="text-sm lg:text-base font-bold text-white">7-10 PM</p>
                    <p className="text-xs text-slate-400 mt-1">Prime Time</p>
                  </div>
                  <div className="bg-slate-700/30 rounded-lg p-3 lg:p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Globe className="w-4 h-4 text-teal-400" />
                      <span className="text-xs text-slate-400">Top Region</span>
                    </div>
                    <p className="text-sm lg:text-base font-bold text-white">USA</p>
                    <p className="text-xs text-slate-400 mt-1">78% audience</p>
                  </div>
                </div>
              </div>

              {/* Top Programs & Stats */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
                {/* Top Programs */}
                <div className="lg:col-span-2 bg-slate-800/50 rounded-xl border border-slate-700/50 p-4 lg:p-6">
                  <h3 className="text-base lg:text-lg font-semibold text-slate-200 mb-4 flex items-center gap-2">
                    <Star className="w-5 h-5 text-amber-400" />
                    Top Performing Programs
                  </h3>
                  <div className="space-y-2 lg:space-y-3">
                    {channelMetrics.topPrograms.map((program, index) => (
                      <div key={program.id} className="bg-slate-700/30 rounded-lg p-3 lg:p-4 flex items-center gap-3 lg:gap-4">
                        <div className={`w-8 h-8 lg:w-10 lg:h-10 rounded-lg flex items-center justify-center text-sm lg:text-base font-bold ${
                          index === 0 ? 'bg-amber-500/20 text-amber-400' :
                          index === 1 ? 'bg-slate-400/20 text-slate-400' :
                          index === 2 ? 'bg-orange-600/20 text-orange-400' :
                          'bg-slate-600/20 text-slate-500'
                        }`}>
                          {index + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm lg:text-base font-medium text-slate-100 truncate">{program.title}</p>
                          <div className="flex items-center gap-2 lg:gap-3 text-xs text-slate-400 mt-1">
                            <span>{program.genre}</span>
                            <span className="hidden sm:inline">•</span>
                            <span className="hidden sm:inline">{program.airTime}</span>
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <div className="flex items-center gap-1">
                            <Star className="w-3 h-3 lg:w-4 lg:h-4 text-amber-400 fill-amber-400" />
                            <span className="text-sm lg:text-base font-semibold text-white">{program.rating}</span>
                          </div>
                          <p className="text-xs text-emerald-400 mt-1">{program.retention}% retention</p>
                        </div>
                        <div className="hidden md:flex flex-col items-end">
                          <p className="text-sm font-medium text-white">{(program.viewers / 1000).toFixed(0)}K</p>
                          <p className="text-xs text-slate-400">viewers</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Quick Stats */}
                <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 p-4 lg:p-6">
                  <h3 className="text-base lg:text-lg font-semibold text-slate-200 mb-4 flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-cyan-400" />
                    Channel Overview
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-slate-400">Completion Rate</span>
                        <span className="text-sm font-semibold text-white">{channelMetrics.completionRate}%</span>
                      </div>
                      <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full" style={{ width: `${channelMetrics.completionRate}%` }} />
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-slate-400">Weekly Growth</span>
                        <span className="text-sm font-semibold text-emerald-400">+{channelMetrics.weeklyGrowth}%</span>
                      </div>
                      <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full" style={{ width: `${Math.min(100, 60 + channelMetrics.weeklyGrowth)}%` }} />
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-slate-400">Ad Fill Rate</span>
                        <span className="text-sm font-semibold text-amber-400">87%</span>
                      </div>
                      <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-amber-500 to-orange-500 rounded-full" style={{ width: '87%' }} />
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 pt-4 border-t border-slate-700">
                    <p className="text-xs text-slate-400 mb-3">Device Distribution</p>
                    <div className="grid grid-cols-3 gap-2">
                      {Object.entries({ 'Connected TV': 72, 'Mobile': 21, 'Web': 11 }).map(([device, percent]) => (
                        <div key={device} className="text-center">
                          {device === 'Connected TV' ? <Monitor className="w-5 h-5 mx-auto text-cyan-400" /> :
                           device === 'Mobile' ? <Smartphone className="w-5 h-5 mx-auto text-emerald-400" /> :
                           <Globe className="w-5 h-5 mx-auto text-amber-400" />}
                          <p className="text-xs text-slate-400 mt-1">{device.split(' ')[0]}</p>
                          <p className="text-sm font-semibold text-white">{percent}%</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Schedule Builder */}
          {activeTab === 'schedule' && (
            <div className="space-y-4 max-w-7xl mx-auto">
              {/* Controls */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  {(['day', 'week'] as ScheduleViewMode[]).map(mode => (
                    <button
                      key={mode}
                      onClick={() => setScheduleViewMode(mode)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                        scheduleViewMode === mode
                          ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/50'
                          : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {mode.charAt(0).toUpperCase() + mode.slice(1)} View
                    </button>
                  ))}
                </div>

                {/* Natural Language Input */}
                <div className="flex items-center w-full sm:w-auto gap-2">
                  <div className="relative flex-1 sm:w-80">
                    <Sparkles className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-cyan-400" />
                    <input
                      type="text"
                      placeholder="Schedule holiday content for evening..."
                      value={nlInput}
                      onChange={(e) => setNlInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleNLSubmit()}
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-10 pr-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
                    />
                  </div>
                  <button
                    onClick={handleNLSubmit}
                    className="px-4 py-2.5 bg-gradient-to-r from-cyan-600 to-blue-600 text-white rounded-lg text-sm font-medium whitespace-nowrap"
                  >
                    Generate
                  </button>
                </div>
              </div>

              {parsedIntent && (
                <div className="bg-slate-800/50 rounded-lg border border-slate-700 p-3 flex items-center gap-4 text-xs flex-wrap">
                  <span className="text-slate-400">Parsed Intent:</span>
                  <span className="px-2 py-1 bg-cyan-500/20 text-cyan-400 rounded">{parsedIntent.parsed.action}</span>
                  <div className="flex gap-1 flex-wrap">
                    {parsedIntent.parsed.constraints.map((c, i) => (
                      <span key={i} className="px-2 py-1 bg-amber-500/20 text-amber-400 rounded">{c}</span>
                    ))}
                  </div>
                  <span className="text-emerald-400 ml-auto">Confidence: {(parsedIntent.confidence * 100).toFixed(0)}%</span>
                </div>
              )}

              {/* Week Days Header */}
              <div className="flex gap-2 overflow-x-auto pb-2">
                {scheduleData.map((day, index) => (
                  <button
                    key={day.date}
                    onClick={() => setSelectedDayIndex(index)}
                    className={`flex-shrink-0 px-4 py-3 rounded-lg border transition-all min-w-[100px] ${
                      selectedDayIndex === index
                        ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-400'
                        : 'bg-slate-800/50 border-slate-700/50 text-slate-400 hover:bg-slate-700/50'
                    }`}
                  >
                    <p className="text-sm font-medium">{day.day}</p>
                    <p className="text-xs text-slate-500">{day.date}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-xs text-emerald-400">{day.avgRetention}% ret.</span>
                      {day.conflicts > 0 && (
                        <span className="text-xs text-rose-400">{day.conflicts} conflicts</span>
                      )}
                    </div>
                  </button>
                ))}
              </div>

              {/* Schedule Timeline */}
              <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-base font-semibold text-slate-200">
                    {scheduleData[selectedDayIndex].day} - {scheduleData[selectedDayIndex].date}
                  </h3>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setShowManualScheduleModal(true)}
                      className="flex items-center gap-2 px-3 py-1.5 bg-cyan-600 text-white rounded-lg text-xs font-medium hover:bg-cyan-500 transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Manual Schedule
                    </button>
                    <button className="flex items-center gap-2 px-3 py-1.5 bg-slate-700 text-slate-300 rounded-lg text-xs font-medium hover:bg-slate-600 transition-colors">
                      <RefreshCw className="w-3.5 h-3.5" />
                      Auto-Schedule
                    </button>
                  </div>
                </div>

                <div className="space-y-3">
                  {scheduleData[selectedDayIndex].slots.map((slot, slotIndex) => {
                    const content = contentMap.get(slot.contentId);
                    const nextSlot = scheduleData[selectedDayIndex].slots[slotIndex + 1];

                    return (
                      <div key={slot.id}>
                        <div className="bg-slate-700/30 rounded-lg p-3 lg:p-4 border border-slate-600/30 hover:border-slate-500/50 transition-colors">
                          <div className="flex items-center gap-3 lg:gap-4 flex-wrap">
                            {/* Time */}
                            <div className="w-16 lg:w-20 flex-shrink-0">
                              <p className="text-sm font-mono font-medium text-slate-200">{formatTime(slot.startTime)}</p>
                              <p className="text-xs text-slate-500">{formatTime(slot.endTime)}</p>
                            </div>

                            {/* Status */}
                            <div className="flex items-center gap-2">
                              {getStatusIcon(slot.status)}
                              <div className={`w-1.5 h-10 rounded-full ${getTransitionColor(slot.transitionRisk)}`} />
                            </div>

                            {/* Content Info */}
                            <div className="flex-1 min-w-[150px]">
                              <div className="flex items-center gap-2 flex-wrap">
                                <p className="text-sm lg:text-base font-medium text-slate-100">{content?.title}</p>
                                <span className={`text-xs px-2 py-0.5 rounded ${
                                  content?.rating?.includes('G') ? 'bg-emerald-500/20 text-emerald-400' :
                                  content?.rating?.includes('PG') ? 'bg-amber-500/20 text-amber-400' :
                                  'bg-rose-500/20 text-rose-400'
                                }`}>
                                  {content?.rating}
                                </span>
                                <span className="text-xs text-slate-400">{content?.duration}m</span>
                              </div>
                              <div className="flex items-center gap-3 mt-1 text-xs text-slate-400">
                                <span>{content?.genre.join(', ')}</span>
                                <span className="hidden sm:inline">•</span>
                                <span className="hidden sm:inline">{slot.adBreaks.length} ad breaks</span>
                              </div>
                            </div>

                            {/* Metrics */}
                            <div className="flex items-center gap-3 lg:gap-4 flex-wrap sm:flex-nowrap">
                              <div className="text-center sm:text-right">
                                <p className="text-xs text-slate-400">Retention</p>
                                <p className="text-sm font-semibold text-emerald-400">{slot.predictedRetention}%</p>
                              </div>
                              <div className="text-center sm:text-right">
                                <p className="text-xs text-slate-400">Drop-off</p>
                                <p className="text-sm font-semibold text-rose-400">{slot.predictedDropoff}%</p>
                              </div>
                              <div className="text-center sm:text-right hidden md:block">
                                <p className="text-xs text-slate-400">Confidence</p>
                                <p className="text-sm font-semibold text-cyan-400">{(slot.confidence * 100).toFixed(0)}%</p>
                              </div>
                            </div>

                            {/* Actions */}
                            <button
                              onClick={() => handleSlotEdit(slot)}
                              className="p-2 rounded-lg bg-slate-600/50 hover:bg-slate-500 transition-colors flex-shrink-0"
                            >
                              <Edit className="w-4 h-4 text-slate-300" />
                            </button>
                          </div>

                          {/* Individual Stats */}
                          <div className="mt-3 pt-3 border-t border-slate-600/30 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                            <div>
                              <p className="text-slate-400">Avg Watch Duration</p>
                              <p className="text-slate-200 font-medium">{content?.avgWatchDuration || Math.ceil(content!.duration * 0.7)}m</p>
                            </div>
                            <div>
                              <p className="text-slate-400">Completion Rate</p>
                              <p className="text-slate-200 font-medium">{content?.completionRate || 75}%</p>
                            </div>
                            <div>
                              <p className="text-slate-400">Target Audience</p>
                              <p className="text-slate-200 font-medium truncate">{content?.targetAudience[0]}</p>
                            </div>
                            <div>
                              <p className="text-slate-400">Mood</p>
                              <p className="text-slate-200 font-medium">{content?.mood[0]}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Media Upload */}
          {activeTab === 'media' && (
            <div className="space-y-4 max-w-7xl mx-auto">
              {/* Upload Controls */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold text-slate-100">Media Library</h2>
                  <p className="text-sm text-slate-400">Upload, manage, and organize your video content</p>
                </div>
                <button
                  onClick={() => setShowUploadModal(true)}
                  className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-cyan-600 to-blue-600 text-white rounded-lg text-sm font-medium"
                >
                  <UploadCloud className="w-4 h-4" />
                  Upload Video
                </button>
              </div>

              {/* Upload Modal */}
              {showUploadModal && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
                  <div className="bg-slate-800 rounded-xl border border-slate-700 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                    <div className="flex items-center justify-between p-4 border-b border-slate-700">
                      <h3 className="text-lg font-semibold text-slate-100">Upload New Video</h3>
                      <button onClick={() => setShowUploadModal(false)} className="p-2 hover:bg-slate-700 rounded-lg">
                        <X className="w-5 h-5 text-slate-400" />
                      </button>
                    </div>
                    <div className="p-4 space-y-4">
                      <div
                        className="border-2 border-dashed border-slate-600 rounded-xl p-8 text-center hover:border-cyan-500/50 transition-colors cursor-pointer"
                        onClick={() => fileInputRef.current?.click()}
                        onDragOver={(event) => event.preventDefault()}
                        onDrop={(event) => {
                          event.preventDefault();
                          const file = event.dataTransfer.files?.[0] || null;
                          handleFileSelect(file);
                        }}
                      >
                        <UploadCloud className="w-12 h-12 text-slate-500 mx-auto mb-3" />
                        <p className="text-sm text-slate-400">Drag and drop video files here, or click to browse</p>
                        <p className="text-xs text-slate-500 mt-1">MP4, MOV, AVI up to 10GB</p>
                        {uploadFile && (
                          <p className="text-xs text-cyan-400 mt-2">Selected: {uploadFile.name}</p>
                        )}
                        <input
                          ref={fileInputRef}
                          type="file"
                          className="hidden"
                          accept="video/*"
                          onChange={(event) => handleFileSelect(event.target.files?.[0] || null)}
                        />
                      </div>
                      {uploadError && (
                        <div className="text-xs text-rose-400">{uploadError}</div>
                      )}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="text-xs text-slate-400 mb-1 block">Title</label>
                          <input
                            type="text"
                            value={uploadForm.title}
                            onChange={(event) => setUploadForm({ ...uploadForm, title: event.target.value })}
                            className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm text-slate-200"
                            placeholder="Video title"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-slate-400 mb-1 block">Genre</label>
                          <input
                            type="text"
                            value={uploadForm.genre}
                            onChange={(event) => setUploadForm({ ...uploadForm, genre: event.target.value })}
                            className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm text-slate-200"
                            placeholder="Documentary, Drama"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-slate-400 mb-1 block">Rating</label>
                          <select
                            value={uploadForm.rating}
                            onChange={(event) => setUploadForm({ ...uploadForm, rating: event.target.value })}
                            className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm text-slate-200"
                          >
                            <option>G</option>
                            <option>PG</option>
                            <option>TV-PG</option>
                            <option>TV-14</option>
                            <option>TV-MA</option>
                          </select>
                        </div>
                        <div>
                          <label className="text-xs text-slate-400 mb-1 block">Target Audience</label>
                          <input
                            type="text"
                            value={uploadForm.targetAudience}
                            onChange={(event) => setUploadForm({ ...uploadForm, targetAudience: event.target.value })}
                            className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm text-slate-200"
                            placeholder="adults 25-54"
                          />
                        </div>
                        <div className="sm:col-span-2">
                          <label className="text-xs text-slate-400 mb-1 block">Description</label>
                          <textarea
                            value={uploadForm.description}
                            onChange={(event) => setUploadForm({ ...uploadForm, description: event.target.value })}
                            className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm text-slate-200 h-20 resize-none"
                            placeholder="Video description..."
                          />
                        </div>
                        <div className="sm:col-span-2">
                          <label className="text-xs text-slate-400 mb-1 block">Transcription (Optional)</label>
                          <textarea
                            value={uploadForm.transcription}
                            onChange={(event) => setUploadForm({ ...uploadForm, transcription: event.target.value })}
                            className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm text-slate-200 h-20 resize-none"
                            placeholder="Paste or upload transcription..."
                          />
                        </div>
                      </div>
                      <div className="flex justify-end gap-3 pt-4 border-t border-slate-700">
                        <button onClick={() => setShowUploadModal(false)} className="px-4 py-2 bg-slate-700 text-slate-300 rounded-lg text-sm font-medium hover:bg-slate-600">Cancel</button>
                        <button
                          onClick={handleUploadSubmit}
                          disabled={isUploading}
                          className="px-4 py-2 bg-cyan-600 text-white rounded-lg text-sm font-medium hover:bg-cyan-500 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {isUploading ? 'Uploading...' : 'Upload'}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Media Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {mediaUploads.map(media => (
                  <div key={media.id} className="bg-slate-800/50 rounded-xl border border-slate-700/50 overflow-hidden hover:border-slate-600 transition-colors">
                    <div className="aspect-video bg-slate-900 relative flex items-center justify-center">
                      <FileVideo className="w-12 h-12 text-slate-600" />
                      <div className="absolute top-2 right-2">
                        <span className={`text-xs px-2 py-1 rounded ${
                          media.status === 'ready' ? 'bg-emerald-500/20 text-emerald-400' :
                          media.status === 'processing' ? 'bg-cyan-500/20 text-cyan-400' :
                          media.status === 'error' ? 'bg-rose-500/20 text-rose-400' :
                          'bg-slate-500/20 text-slate-400'
                        }`}>
                          {media.status}
                        </span>
                      </div>
                      {media.status === 'processing' && (
                        <div className="absolute bottom-0 left-0 right-0 h-1 bg-slate-700">
                          <div className="h-full bg-cyan-500" style={{ width: `${media.transcodingProgress}%` }} />
                        </div>
                      )}
                    </div>
                    <div className="p-4">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div>
                          <p className="text-sm font-medium text-slate-100 truncate">{media.title}</p>
                          <p className="text-xs text-slate-400">{formatDuration(media.duration)} • {formatFileSize(media.fileSize)}</p>
                        </div>
                        <div className="flex gap-1">
                          <button onClick={() => setSelectedMedia(media)} className="p-1.5 rounded-lg hover:bg-slate-700 transition-colors">
                            <Eye className="w-4 h-4 text-slate-400" />
                          </button>
                          <button className="p-1.5 rounded-lg hover:bg-slate-700 transition-colors">
                            <Edit className="w-4 h-4 text-slate-400" />
                          </button>
                          <button className="p-1.5 rounded-lg hover:bg-rose-500/20 transition-colors">
                            <Trash2 className="w-4 h-4 text-rose-400" />
                          </button>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-1.5 mb-3">
                        {media.metadata.genre.map(g => (
                          <span key={g} className="text-xs px-2 py-0.5 bg-slate-700 text-slate-300 rounded">{g}</span>
                        ))}
                      </div>
                      <div className="flex justify-between text-xs text-slate-400">
                        <span>{media.metadata.rating}</span>
                        <span>Uploaded {media.uploadedAt.split(' ')[0]}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Media Detail Modal */}
              {selectedMedia && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
                  <div className="bg-slate-800 rounded-xl border border-slate-700 w-full max-w-3xl max-h-[90vh] overflow-y-auto">
                    <div className="flex items-center justify-between p-4 border-b border-slate-700">
                      <h3 className="text-lg font-semibold text-slate-100">{selectedMedia.title}</h3>
                      <button onClick={() => setSelectedMedia(null)} className="p-2 hover:bg-slate-700 rounded-lg">
                        <X className="w-5 h-5 text-slate-400" />
                      </button>
                    </div>
                    <div className="p-4 space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-slate-700/30 rounded-lg p-3">
                          <p className="text-xs text-slate-400">File Name</p>
                          <p className="text-sm text-slate-200">{selectedMedia.fileName}</p>
                        </div>
                        <div className="bg-slate-700/30 rounded-lg p-3">
                          <p className="text-xs text-slate-400">Duration</p>
                          <p className="text-sm text-slate-200">{formatDuration(selectedMedia.duration)}</p>
                        </div>
                        <div className="bg-slate-700/30 rounded-lg p-3">
                          <p className="text-xs text-slate-400">File Size</p>
                          <p className="text-sm text-slate-200">{formatFileSize(selectedMedia.fileSize)}</p>
                        </div>
                        <div className="bg-slate-700/30 rounded-lg p-3">
                          <p className="text-xs text-slate-400">Status</p>
                          <p className="text-sm text-slate-200 capitalize">{selectedMedia.status}</p>
                        </div>
                      </div>
                      <div>
                        <p className="text-xs text-slate-400 mb-1">Description</p>
                        <p className="text-sm text-slate-300">{selectedMedia.metadata.description}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-400 mb-1">Target Audience</p>
                        <div className="flex flex-wrap gap-2">
                          {selectedMedia.metadata.targetAudience.map(aud => (
                            <span key={aud} className="text-xs px-2 py-1 bg-cyan-500/20 text-cyan-400 rounded">{aud}</span>
                          ))}
                        </div>
                      </div>
                      <div>
                        <p className="text-xs text-slate-400 mb-1">Tags</p>
                        <div className="flex flex-wrap gap-2">
                          {selectedMedia.metadata.tags.map(tag => (
                            <span key={tag} className="text-xs px-2 py-1 bg-slate-700 text-slate-300 rounded">{tag}</span>
                          ))}
                        </div>
                      </div>
                      {selectedMedia.metadata.transcription && (
                        <div>
                          <p className="text-xs text-slate-400 mb-1">Transcription</p>
                          <div className="bg-slate-700/30 rounded-lg p-3 max-h-32 overflow-y-auto">
                            <p className="text-xs text-slate-300">{selectedMedia.metadata.transcription}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Analytics */}
          {activeTab === 'analytics' && (
            <div className="space-y-4 lg:space-y-6 max-w-7xl mx-auto">
              {/* Channel Comparison */}
              <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 p-4 lg:p-6">
                <h3 className="text-base lg:text-lg font-semibold text-slate-200 mb-4 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-cyan-400" />
                  Channel Comparison Analysis
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[600px]">
                    <thead>
                      <tr className="text-xs text-slate-400 border-b border-slate-700">
                        <th className="text-left py-3 px-2">Channel</th>
                        <th className="text-center py-3 px-2">Retention</th>
                        <th className="text-center py-3 px-2">Viewers</th>
                        <th className="text-center py-3 px-2">Growth</th>
                        <th className="text-center py-3 px-2">Ad Revenue</th>
                        <th className="text-center py-3 px-2">Score</th>
                        <th className="text-center py-3 px-2">Suggestion</th>
                      </tr>
                    </thead>
                    <tbody>
                      {channelComparisons.map((channel, i) => (
                        <tr key={channel.channelId} className={`text-sm border-b border-slate-700/30 ${
                          channel.channelId === selectedChannel.id ? 'bg-cyan-500/10' : ''
                        }`}>
                          <td className="py-3 px-2">
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: channelConfigs.find(c => c.id === channel.channelId)?.color }} />
                              <span className="text-slate-200 font-medium">{channel.channelName}</span>
                            </div>
                          </td>
                          <td className="py-3 px-2 text-center">
                            <span className={`${channel.retention >= 80 ? 'text-emerald-400' : channel.retention >= 70 ? 'text-amber-400' : 'text-rose-400'}`}>
                              {channel.retention}%
                            </span>
                          </td>
                          <td className="py-3 px-2 text-center text-slate-300">{(channel.viewers / 1000).toFixed(0)}K</td>
                          <td className="py-3 px-2 text-center">
                            <span className={`flex items-center justify-center gap-1 ${channel.growth >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                              {channel.growth >= 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                              {channel.growth >= 0 ? '+' : ''}{channel.growth}%
                            </span>
                          </td>
                          <td className="py-3 px-2 text-center text-slate-300">${(channel.adRevenue / 1000).toFixed(0)}K</td>
                          <td className="py-3 px-2 text-center">
                            <span className={`px-2 py-1 rounded text-xs font-medium ${
                              channel.score >= 85 ? 'bg-emerald-500/20 text-emerald-400' :
                              channel.score >= 70 ? 'bg-amber-500/20 text-amber-400' :
                              'bg-rose-500/20 text-rose-400'
                            }`}>
                              {channel.score}
                            </span>
                          </td>
                          <td className="py-3 px-2 text-center text-xs text-slate-400">
                            {i === 0 ? 'Extend holiday content' :
                             i === 1 ? 'Add action variety' :
                             'Monitor closely'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Growth Suggestions */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 p-4 lg:p-6">
                  <h3 className="text-base font-semibold text-slate-200 mb-4 flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-emerald-400" />
                    Growth Opportunities
                  </h3>
                  <div className="space-y-3">
                    {[
                      { title: 'Increase Holiday Content', impact: '+15% retention', difficulty: 'Easy' },
                      { title: 'Optimize Prime Time Slots', impact: '+22% viewers', difficulty: 'Medium' },
                      { title: 'Add Family Programming', impact: '+8% growth', difficulty: 'Easy' },
                      { title: 'Reduce Ad Load', impact: '+5% completion', difficulty: 'Hard' },
                    ].map((item, i) => (
                      <div key={i} className="flex items-center gap-3 bg-slate-700/30 rounded-lg p-3">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                          item.difficulty === 'Easy' ? 'bg-emerald-500/20 text-emerald-400' :
                          item.difficulty === 'Medium' ? 'bg-amber-500/20 text-amber-400' :
                          'bg-rose-500/20 text-rose-400'
                        }`}>
                          {i + 1}
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-slate-200">{item.title}</p>
                          <p className="text-xs text-emerald-400">{item.impact}</p>
                        </div>
                        <span className={`text-xs px-2 py-1 rounded ${
                          item.difficulty === 'Easy' ? 'bg-emerald-500/20 text-emerald-400' :
                          item.difficulty === 'Medium' ? 'bg-amber-500/20 text-amber-400' :
                          'bg-rose-500/20 text-rose-400'
                        }`}>
                          {item.difficulty}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 p-4 lg:p-6">
                  <h3 className="text-base font-semibold text-slate-200 mb-4 flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-amber-400" />
                    Risk Areas
                  </h3>
                  <div className="space-y-3">
                    {[
                      { title: 'Documentary Central Growing', risk: 'Competitor threat', action: 'Diversify content' },
                      { title: 'Family Fun Declining', risk: '-2% growth', action: 'Add new shows' },
                      { title: 'Late Night Dropoff', risk: '23% exit at 11PM', action: 'Schedule teasers' },
                      { title: 'Mobile Experience', risk: 'High bounce rate', action: 'Optimize streams' },
                    ].map((item, i) => (
                      <div key={i} className="flex items-center gap-3 bg-slate-700/30 rounded-lg p-3">
                        <AlertCircle className="w-5 h-5 text-amber-400 flex-shrink-0" />
                        <div className="flex-1">
                          <p className="text-sm font-medium text-slate-200">{item.title}</p>
                          <p className="text-xs text-rose-400">{item.risk}</p>
                        </div>
                        <span className="text-xs text-cyan-400">{item.action}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Digital Twin */}
          {activeTab === 'simulation' && (
            <div className="space-y-4 lg:space-y-6 max-w-7xl mx-auto">
              {/* Simulation Controls */}
              <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 p-4 lg:p-6">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-4">
                  <div>
                    <h3 className="text-base lg:text-lg font-semibold text-slate-100 flex items-center gap-2">
                      <Brain className="w-5 h-5 text-cyan-400" />
                      Digital Twin Simulator
                    </h3>
                    <p className="text-xs lg:text-sm text-slate-400 mt-1">Predict schedule outcomes before going live</p>
                  </div>
                  <button
                    onClick={runSimulation}
                    disabled={isSimulating}
                    className={`flex items-center justify-center gap-2 px-6 py-3 rounded-lg text-sm font-medium transition-all ${
                      isSimulating
                        ? 'bg-slate-700 text-slate-400 cursor-not-allowed'
                        : 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-lg shadow-cyan-500/20'
                    }`}
                  >
                    {isSimulating ? (
                      <>
                        <div className="w-4 h-4 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" />
                        Simulating...
                      </>
                    ) : (
                      <>
                        <Play className="w-4 h-4" />
                        Run Simulation
                      </>
                    )}
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  <div className="bg-slate-700/30 rounded-lg p-3">
                    <label className="text-xs text-slate-400 mb-1 block">Simulation Date</label>
                    <input type="date" defaultValue="2024-12-24" className="w-full bg-slate-600 border border-slate-500 rounded px-3 py-2 text-sm text-slate-200" />
                  </div>
                  <div className="bg-slate-700/30 rounded-lg p-3">
                    <label className="text-xs text-slate-400 mb-1 block">Time Block</label>
                    <select className="w-full bg-slate-600 border border-slate-500 rounded px-3 py-2 text-sm text-slate-200">
                      <option>Full Day</option>
                      <option>Morning (6AM-12PM)</option>
                      <option>Afternoon (12PM-6PM)</option>
                      <option>Prime Time (6PM-11PM)</option>
                    </select>
                  </div>
                  <div className="bg-slate-700/30 rounded-lg p-3">
                    <label className="text-xs text-slate-400 mb-1 block">Optimization Target</label>
                    <select className="w-full bg-slate-600 border border-slate-500 rounded px-3 py-2 text-sm text-slate-200">
                      <option>Retention</option>
                      <option>Watch Time</option>
                      <option>Ad Revenue</option>
                    </select>
                  </div>
                  <div className="bg-slate-700/30 rounded-lg p-3">
                    <label className="text-xs text-slate-400 mb-1 block">Confidence Level</label>
                    <select className="w-full bg-slate-600 border border-slate-500 rounded px-3 py-2 text-sm text-slate-200">
                      <option>95%</option>
                      <option>90%</option>
                      <option>85%</option>
                    </select>
                  </div>
                </div>
              </div>

              {simulationResults && (
                <div className="space-y-4">
                  {/* KPI Cards */}
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                    <div className="bg-gradient-to-br from-emerald-500/20 to-emerald-600/10 rounded-xl border border-emerald-500/30 p-4">
                      <div className="flex items-center justify-between mb-2">
                        <TrendingUp className="w-5 h-5 text-emerald-400" />
                        <span className="text-xs text-emerald-400 bg-emerald-500/20 px-2 py-0.5 rounded">+14%</span>
                      </div>
                      <p className="text-2xl font-bold text-white">{simulationResults.predictedRetention.toFixed(1)}%</p>
                      <p className="text-xs text-slate-400 mt-1">Predicted Retention</p>
                    </div>
                    <div className="bg-gradient-to-br from-cyan-500/20 to-cyan-600/10 rounded-xl border border-cyan-500/30 p-4">
                      <div className="flex items-center justify-between mb-2">
                        <Users className="w-5 h-5 text-cyan-400" />
                        <span className="text-xs text-cyan-400 bg-cyan-500/20 px-2 py-0.5 rounded">-9%</span>
                      </div>
                      <p className="text-2xl font-bold text-white">{simulationResults.predictedExits.toFixed(1)}%</p>
                      <p className="text-xs text-slate-400 mt-1">Predicted Exits</p>
                    </div>
                    <div className="bg-gradient-to-br from-amber-500/20 to-amber-600/10 rounded-xl border border-amber-500/30 p-4">
                      <div className="flex items-center justify-between mb-2">
                        <Target className="w-5 h-5 text-amber-400" />
                        <span className="text-xs text-amber-400 bg-amber-500/20 px-2 py-0.5 rounded">+12%</span>
                      </div>
                      <p className="text-2xl font-bold text-white">${(simulationResults.predictedAdRevenue / 1000).toFixed(0)}K</p>
                      <p className="text-xs text-slate-400 mt-1">Predicted Revenue</p>
                    </div>
                    <div className="bg-gradient-to-br from-rose-500/20 to-rose-600/10 rounded-xl border border-rose-500/30 p-4">
                      <div className="flex items-center justify-between mb-2">
                        <AlertTriangle className="w-5 h-5 text-rose-400" />
                      </div>
                      <p className="text-2xl font-bold text-white">{simulationResults.transitionHotpots.length}</p>
                      <p className="text-xs text-slate-400 mt-1">Risk Hotspots</p>
                    </div>
                  </div>

                  {/* Detailed Analysis */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {/* Optimization Suggestions */}
                    <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 p-4">
                      <h3 className="text-base font-semibold text-slate-200 mb-4 flex items-center gap-2">
                        <Sparkles className="w-5 h-5 text-amber-400" />
                        AI Optimization Suggestions
                      </h3>
                      <div className="space-y-3">
                        {simulationResults.optimizationSuggestions.map((suggestion, i) => (
                          <div key={i} className="flex items-start gap-3 bg-slate-700/30 rounded-lg p-3">
                            <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${
                              i === 0 ? 'bg-emerald-500/20 text-emerald-400' :
                              i === 1 ? 'bg-amber-500/20 text-amber-400' :
                              'bg-cyan-500/20 text-cyan-400'
                            }`}>
                              {i + 1}
                            </div>
                            <p className="text-sm text-slate-300">{suggestion}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Risk Hotspots */}
                    <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 p-4">
                      <h3 className="text-base font-semibold text-slate-200 mb-4 flex items-center gap-2">
                        <AlertTriangle className="w-5 h-5 text-rose-400" />
                        High Risk Transitions
                      </h3>
                      {simulationResults.transitionHotpots.length > 0 ? (
                        <div className="space-y-2">
                          {simulationResults.transitionHotpots.map(hotspot => (
                            <div key={hotspot.slotId} className="bg-rose-500/10 border border-rose-500/30 rounded-lg p-3">
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-sm font-medium text-slate-200">{hotspot.contentTitle}</span>
                                <span className="text-xs text-rose-400">{hotspot.timeRange}</span>
                              </div>
                              <p className="text-xs text-slate-400 mb-1">Predicted Drop-off: <span className="text-rose-400">{hotspot.predictedDropoff}%</span></p>
                              <p className="text-xs text-slate-300">{hotspot.suggestedFix}</p>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="bg-slate-700/30 rounded-lg p-4 text-center">
                          <CheckCircle className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
                          <p className="text-sm text-slate-300">No high-risk transitions detected</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {!simulationResults && !isSimulating && (
                <div className="bg-slate-800/30 rounded-xl border border-slate-700/50 border-dashed p-8 lg:p-12 flex flex-col items-center justify-center text-center">
                  <Brain className="w-12 h-12 text-slate-600 mb-4" />
                  <h3 className="text-lg font-medium text-slate-400 mb-2">Run Digital Twin Simulation</h3>
                  <p className="text-sm text-slate-500 max-w-md">Configure simulation parameters and click Run to predict viewer behavior and optimize schedule.</p>
                </div>
              )}
            </div>
          )}

          {/* Settings */}
          {activeTab === 'settings' && (
            <div className="space-y-4 max-w-4xl mx-auto">
              <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 p-4 lg:p-6">
                <h3 className="text-base font-semibold text-slate-200 mb-4 flex items-center gap-2">
                  <Settings className="w-5 h-5 text-slate-400" />
                  Channel Configuration
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-slate-400 mb-1 block">Channel Name</label>
                    <input type="text" defaultValue={selectedChannel.name} className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm text-slate-200" />
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 mb-1 block">Primary Genre</label>
                    <input type="text" defaultValue={selectedChannel.primaryGenre} className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm text-slate-200" />
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 mb-1 block">Target Audience</label>
                    <input type="text" defaultValue={selectedChannel.targetAudience} className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm text-slate-200" />
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 mb-1 block">Rating Limit</label>
                    <select className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm text-slate-200">
                      <option>TV-G</option>
                      <option>TV-PG</option>
                      <option>TV-14</option>
                      <option>TV-MA</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 p-4 lg:p-6">
                <h3 className="text-base font-semibold text-slate-200 mb-4 flex items-center gap-2">
                  <Target className="w-5 h-5 text-emerald-400" />
                  Scheduling Constraints
                </h3>
                <div className="space-y-3">
                  {[
                    { label: 'Restrict mature content before 10 PM', enabled: true },
                    { label: 'Enforce frequency caps (no repeat within 4 hours)', enabled: true },
                    { label: 'Maintain genre diversity (max 2 consecutive same-genre)', enabled: false },
                    { label: 'Respect regional rights windows', enabled: true },
                    { label: 'Auto-heal unavailable assets', enabled: true },
                  ].map((constraint, i) => (
                    <div key={i} className="flex items-center justify-between bg-slate-700/30 rounded-lg px-4 py-3">
                      <span className="text-sm text-slate-300">{constraint.label}</span>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" defaultChecked={constraint.enabled} className="sr-only peer" />
                        <div className="w-9 h-5 bg-slate-600 rounded-full peer peer-checked:bg-cyan-500 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-full"></div>
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Admin Panel */}
          {activeTab === 'admin' && <AdminDashboard />}
        </main>
      </div>

      {/* Edit Warning Modal */}
      {showEditWarning && editingSlot && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-xl border border-amber-500/50 w-full max-w-md">
            <div className="p-4 border-b border-slate-700">
              <div className="flex items-center gap-3">
                <AlertTriangle className="w-6 h-6 text-amber-400" />
                <h3 className="text-lg font-semibold text-slate-100">Schedule Modification Warning</h3>
              </div>
            </div>
            <div className="p-4">
              <p className="text-sm text-slate-300 mb-4">
                You are about to manually modify an auto-optimized schedule slot. This change may:
              </p>
              <ul className="text-sm text-slate-400 space-y-2 mb-4">
                <li className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                  <span>Affect predicted retention rates by up to -12%</span>
                </li>
                <li className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                  <span>Create sequence conflicts with adjacent content</span>
                </li>
                <li className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                  <span>Require recalculation of ad break placements</span>
                </li>
              </ul>
              <p className="text-xs text-slate-400">
                Editing slot: <span className="text-cyan-400">{editingSlot.id}</span>
              </p>
            </div>
            <div className="p-4 border-t border-slate-700 flex justify-end gap-3">
              <button
                onClick={cancelEdit}
                className="px-4 py-2 bg-slate-700 text-slate-300 rounded-lg text-sm font-medium hover:bg-slate-600"
              >
                Cancel
              </button>
              <button
                onClick={confirmEdit}
                className="px-4 py-2 bg-amber-600 text-white rounded-lg text-sm font-medium hover:bg-amber-500"
              >
                Proceed Anyway
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Slot Panel */}
      {showEditPanel && editingSlot && editedSlotData && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-xl border border-cyan-500/30 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b border-slate-700">
              <div className="flex items-center gap-3">
                <Edit className="w-5 h-5 text-cyan-400" />
                <h3 className="text-lg font-semibold text-slate-100">Edit Schedule Slot</h3>
                {editingSlot.isEdited && (
                  <span className="text-xs px-2 py-1 bg-amber-500/20 text-amber-400 rounded border border-amber-500/30">
                    Manually Modified
                  </span>
                )}
              </div>
              <button
                onClick={() => {
                  setShowEditPanel(false);
                  setEditingSlot(null);
                  setEditedSlotData(null);
                }}
                className="p-2 hover:bg-slate-700 rounded-lg"
              >
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>
            <div className="p-4 space-y-4">
              {/* Original vs New Comparison */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-700/30 rounded-lg p-4 border border-slate-600/30">
                  <p className="text-xs text-slate-400 mb-3 font-medium uppercase tracking-wide">Original Schedule</p>
                  {(() => {
                    const originalContent = contentMap.get(editingSlot.contentId);
                    return (
                      <>
                        <p className="text-sm font-medium text-slate-300 mb-2">{originalContent?.title || 'Unknown'}</p>
                        <p className="text-xs text-slate-400">{formatTime(editingSlot.startTime)} - {formatTime(editingSlot.endTime)}</p>
                        <div className="mt-3 pt-3 border-t border-slate-600/30 grid grid-cols-2 gap-2 text-xs">
                          <div>
                            <p className="text-slate-500">Retention</p>
                            <p className="text-emerald-400">{editingSlot.predictedRetention}%</p>
                          </div>
                          <div>
                            <p className="text-slate-500">Drop-off</p>
                            <p className="text-rose-400">{editingSlot.predictedDropoff}%</p>
                          </div>
                        </div>
                      </>
                    );
                  })()}
                </div>
                <div className="bg-cyan-500/10 rounded-lg p-4 border border-cyan-500/30">
                  <p className="text-xs text-cyan-400 mb-3 font-medium uppercase tracking-wide">New Schedule</p>
                  {(() => {
                    const newContent = contentMap.get(editedSlotData.contentId);
                    return (
                      <>
                        <p className="text-sm font-medium text-slate-200 mb-2">{newContent?.title || 'Unknown'}</p>
                        <p className="text-xs text-slate-300">{formatTime(editedSlotData.startTime)} - {formatTime(editedSlotData.endTime)}</p>
                        <div className="mt-3 pt-3 border-t border-cyan-500/30 grid grid-cols-2 gap-2 text-xs">
                          <div>
                            <p className="text-slate-400">Retention</p>
                            <p className="text-emerald-400">{newContent?.completionRate || '--'}%</p>
                          </div>
                          <div>
                            <p className="text-slate-400">Drop-off</p>
                            <p className="text-rose-400">{100 - (newContent?.completionRate || 0)}%</p>
                          </div>
                        </div>
                      </>
                    );
                  })()}
                </div>
              </div>

              {/* Edit Form */}
              <div className="bg-slate-700/30 rounded-lg p-4 border border-slate-600/30">
                <p className="text-xs text-slate-400 mb-4 font-medium">Modify Schedule Settings</p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="text-xs text-slate-400 mb-1 block">Content / Program</label>
                    <select
                      value={editedSlotData.contentId}
                      onChange={(e) => {
                        const content = contentMap.get(e.target.target.value);
                        const endHour = parseInt(editedSlotData.startTime.split(':')[0]) + Math.ceil((content?.duration || 60) / 60);
                        setEditedSlotData({
                          ...editedSlotData,
                          contentId: e.target.target.value,
                          endTime: `${endHour.toString().padStart(2, '0')}:00`,
                        });
                      }}
                      className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm text-slate-200"
                    >
                      {mockContentCatalog.map(content => (
                        <option key={content.id} value={content.id}>
                          {content.title} ({content.duration}m)
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 mb-1 block">Start Time</label>
                    <input
                      type="time"
                      value={editedSlotData.startTime}
                      onChange={(e) => {
                        const content = contentMap.get(editedSlotData.contentId);
                        const startHour = parseInt(e.target.target.value.split(':')[0]);
                        const endHour = startHour + Math.ceil((content?.duration || 60) / 60);
                        setEditedSlotData({
                          ...editedSlotData,
                          startTime: e.target.target.value,
                          endTime: `${endHour.toString().padStart(2, '0')}:00`,
                        });
                      }}
                      className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm text-slate-200"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 mb-1 block">End Time (Auto-calculated)</label>
                    <input
                      type="time"
                      value={editedSlotData.endTime}
                      disabled
                      className="w-full bg-slate-600 border border-slate-600 rounded-lg px-3 py-2 text-sm text-slate-400 cursor-not-allowed"
                    />
                  </div>
                </div>
              </div>

              {/* Content Stats for Selected Program */}
              {(() => {
                const selectedContent = contentMap.get(editedSlotData.contentId);
                return selectedContent ? (
                  <div className="bg-slate-700/20 rounded-lg p-4 border border-slate-600/20">
                    <p className="text-xs text-slate-400 mb-3 font-medium">Selected Program Statistics</p>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                      <div>
                        <p className="text-slate-500">Genre</p>
                        <p className="text-slate-200 mt-1">{selectedContent.genre.join(', ')}</p>
                      </div>
                      <div>
                        <p className="text-slate-500">Duration</p>
                        <p className="text-slate-200 mt-1">{selectedContent.duration} minutes</p>
                      </div>
                      <div>
                        <p className="text-slate-500">Rating</p>
                        <p className="text-slate-200 mt-1">{selectedContent.rating}</p>
                      </div>
                      <div>
                        <p className="text-slate-500">Avg Watch</p>
                        <p className="text-slate-200 mt-1">{selectedContent.avgWatchDuration}m</p>
                      </div>
                      <div>
                        <p className="text-slate-500">Completion Rate</p>
                        <p className="text-emerald-400 mt-1">{selectedContent.completionRate}%</p>
                      </div>
                      <div>
                        <p className="text-slate-500">Target Audience</p>
                        <p className="text-slate-200 mt-1">{selectedContent.targetAudience[0]}</p>
                      </div>
                      <div>
                        <p className="text-slate-500">Mood</p>
                        <p className="text-slate-200 mt-1">{selectedContent.mood.join(', ')}</p>
                      </div>
                      <div>
                        <p className="text-slate-500">Ad Breaks</p>
                        <p className="text-slate-200 mt-1">{selectedContent.adBreakCount}</p>
                      </div>
                    </div>
                  </div>
                ) : null;
              })()}

              {/* Impact Warning */}
              <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-amber-400 mb-1">Changes Impact Notice</p>
                    <p className="text-xs text-slate-300">
                      Manual modifications will be flagged and may affect AI predictions. The schedule optimizer will recalculate adjacent retention scores and transition risks.
                    </p>
                  </div>
                </div>
              </div>
            </div>
            <div className="p-4 border-t border-slate-700 flex justify-between">
              <button
                onClick={() => {
                  setShowEditPanel(false);
                  setEditingSlot(null);
                  setEditedSlotData(null);
                }}
                className="px-4 py-2 bg-slate-700 text-slate-300 rounded-lg text-sm font-medium hover:bg-slate-600"
              >
                Cancel Changes
              </button>
              <button
                onClick={saveSlotEdit}
                className="flex items-center gap-2 px-4 py-2 bg-cyan-600 text-white rounded-lg text-sm font-medium hover:bg-cyan-500"
              >
                <CheckCircle className="w-4 h-4" />
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Manual Schedule Modal */}
      {showManualScheduleModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-xl border border-cyan-500/30 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b border-slate-700">
              <div className="flex items-center gap-3">
                <Plus className="w-5 h-5 text-cyan-400" />
                <h3 className="text-lg font-semibold text-slate-100">Schedule New Program</h3>
              </div>
              <button
                onClick={() => setShowManualScheduleModal(false)}
                className="p-2 hover:bg-slate-700 rounded-lg"
              >
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Select Program</label>
                <select
                  value={manualScheduleData.contentId}
                  onChange={(e) => setManualScheduleData({ ...manualScheduleData, contentId: e.target.target.value })}
                  className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm text-slate-200"
                >
                  <option value="">-- Select a program --</option>
                  {mockContentCatalog.map(content => (
                    <option key={content.id} value={content.id}>
                      {content.title} ({content.duration}m | {content.genre[0]})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Schedule Date</label>
                <select
                  value={manualScheduleData.day}
                  onChange={(e) => setManualScheduleData({ ...manualScheduleData, day: e.target.target.value })}
                  className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm text-slate-200"
                >
                  {scheduleData.map(day => (
                    <option key={day.date} value={day.date}>
                      {day.day} ({day.date})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Start Time</label>
                <input
                  type="time"
                  value={manualScheduleData.startTime}
                  onChange={(e) => setManualScheduleData({ ...manualScheduleData, startTime: e.target.target.value })}
                  className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm text-slate-200"
                />
              </div>

              {/* Preview */}
              {manualScheduleData.contentId && (
                <div className="bg-cyan-500/10 rounded-lg p-4 border border-cyan-500/30">
                  <p className="text-xs text-cyan-400 mb-3 font-medium uppercase tracking-wide">Schedule Preview</p>
                  {(() => {
                    const content = contentMap.get(manualScheduleData.contentId);
                    const startHour = parseInt(manualScheduleData.startTime.split(':')[0]);
                    const endHour = startHour + Math.ceil((content?.duration || 60) / 60);
                    return content ? (
                      <div className="space-y-2">
                        <p className="text-sm font-medium text-slate-200">{content.title}</p>
                        <p className="text-xs text-slate-400">
                          {formatTime(manualScheduleData.startTime)} - {formatTime(`${endHour.toString().padStart(2, '0')}:00`)}
                        </p>
                        <div className="grid grid-cols-2 gap-2 text-xs mt-3 pt-3 border-t border-cyan-500/30">
                          <div>
                            <span className="text-slate-400">Duration:</span>{' '}
                            <span className="text-white">{content.duration}m</span>
                          </div>
                          <div>
                            <span className="text-slate-400">Retention:</span>{' '}
                            <span className="text-emerald-400">{content.completionRate}%</span>
                          </div>
                        </div>
                      </div>
                    ) : null;
                  })()}
                </div>
              )}

              <div className="bg-slate-700/30 rounded-lg p-3 text-xs text-slate-400">
                <p className="flex items-center gap-2">
                  <Info className="w-4 h-4 text-cyan-400" />
                  Manual schedules will be auto-optimized and may be adjusted for better transitions.
                </p>
              </div>
            </div>
            <div className="p-4 border-t border-slate-700 flex justify-end gap-3">
              <button
                onClick={() => setShowManualScheduleModal(false)}
                className="px-4 py-2 bg-slate-700 text-slate-300 rounded-lg text-sm font-medium hover:bg-slate-600"
              >
                Cancel
              </button>
              <button
                onClick={handleManualSchedule}
                disabled={!manualScheduleData.contentId}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium ${
                  manualScheduleData.contentId
                    ? 'bg-cyan-600 text-white hover:bg-cyan-500'
                    : 'bg-slate-600 text-slate-400 cursor-not-allowed'
                }`}
              >
                <Plus className="w-4 h-4" />
                Add to Schedule
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
