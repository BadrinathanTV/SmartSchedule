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
import { ScheduleBuilder } from './components/ScheduleBuilder';
import { MediaLibrary } from './components/MediaLibrary';
import { API_URL, deleteMedia, getMediaUploads, importProgramAnalytics, updateMedia, uploadMedia } from './lib/api';
import type {
  Content,
  ScheduleSlot,
  SelfHealingLog,
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
  mockSelfHealingLogs,
  channelConfigs,
  weekSchedule,
  channelMetrics,
  channelComparisons,
  parseNaturalLanguageIntent,
} from './data/mockData';
import {
  buildRetentionForecast,
  buildTransitionScoreMap,
  buildViewerBehaviorMap,
} from './lib/schedulerMetrics';

type TabType = 'dashboard' | 'schedule' | 'media' | 'analytics' | 'simulation' | 'settings' | 'admin';
type ViewMode = 'timeline' | 'grid' | 'list';
type ScheduleViewMode = 'day' | 'week';

type SchedulerSummary = {
  scope: string;
  epochs: number;
  reward: number;
  retention: number;
  watchTime: number;
  engagement: number;
  adRevenue: number;
  diversity: number;
  novelty: number;
  penalties: {
    repetition: number;
    genre: number;
    series: number;
    actors: number;
    dominance: number;
    dropoff: number;
  };
  appliedConstraints: string[];
  recommendations: string[];
};
type MediaUploadList = MediaUpload[];

type MediaEditForm = {
  title: string;
  fileName: string;
  fileSize: string;
  duration: string;
  status: MediaUpload['status'];
  uploadProgress: string;
  transcodingProgress: string;
  description: string;
  genre: string;
  rating: string;
  targetAudience: string;
  regions: string;
  tags: string;
  rightsStart: string;
  rightsEnd: string;
  transcription: string;
  transcriptionSource: string;
  thumbnailUrl: string;
  uploadedAt: string;
};

const parseCsvList = (value: string) => value.split(',').map(item => item.trim()).filter(Boolean);

const toDateTimeLocal = (value: string) => {
  if (!value) return '';
  const normalized = value.includes('T') ? value : value.replace(' ', 'T');
  return normalized.slice(0, 16);
};

const fromDateTimeLocal = (value: string) => {
  if (!value) return '';
  return `${value.replace('T', ' ')}:00`;
};

const buildMediaEditForm = (media: MediaUpload): MediaEditForm => ({
  title: media.title,
  fileName: media.fileName,
  fileSize: String(media.fileSize),
  duration: String(media.duration),
  status: media.status,
  uploadProgress: String(media.uploadProgress),
  transcodingProgress: String(media.transcodingProgress),
  description: media.metadata.description,
  genre: media.metadata.genre.join(', '),
  rating: media.metadata.rating,
  targetAudience: media.metadata.targetAudience.join(', '),
  regions: media.metadata.regions.join(', '),
  tags: media.metadata.tags.join(', '),
  rightsStart: media.metadata.rightsStart || '',
  rightsEnd: media.metadata.rightsEnd || '',
  transcription: media.transcription || media.metadata.transcription || '',
  transcriptionSource: media.transcriptionSource || '',
  thumbnailUrl: media.thumbnailUrl || '',
  uploadedAt: toDateTimeLocal(media.uploadedAt),
});

const parseUploadedGenres = (media: MediaUpload) => {
  if (media.metadata.genre.length > 0) return media.metadata.genre;
  if (media.metadata.tags.length > 0) return media.metadata.tags.slice(0, 2);
  return ['General'];
};

const deriveProgramMood = (media: MediaUpload) => {
  const text = [media.title, media.metadata.description, ...media.metadata.genre, ...media.metadata.tags].join(' ').toLowerCase();
  if (/news|update|report|talk/.test(text)) return ['Informative', 'Timely'];
  if (/action|sport|high|fast/.test(text)) return ['Energetic', 'Intense'];
  if (/family|kids|cartoon|fun/.test(text)) return ['Light', 'Upbeat'];
  if (/holiday|christmas|winter/.test(text)) return ['Festive', 'Heartwarming'];
  if (/documentary|nature|tech|science/.test(text)) return ['Inspiring', 'Informative'];
  return ['Balanced', 'Engaging'];
};

const deriveProgramType = (duration: number): Content['type'] => {
  if (duration <= 1200) return 'short';
  if (duration <= 2700) return 'special';
  if (duration <= 5400) return 'series';
  return 'movie';
};

const buildProgramFromUpload = (media: MediaUpload): Content => ({
  id: media.id,
  title: media.title,
  type: deriveProgramType(media.duration),
  seriesName: media.title,
  cast: undefined,
  genre: parseUploadedGenres(media),
  subgenre: media.metadata.tags.length > 0 ? media.metadata.tags.slice(0, 3) : media.metadata.genre,
  mood: deriveProgramMood(media),
  rating: (['G', 'PG', 'PG-13', 'R', 'TV-Y', 'TV-Y7', 'TV-G', 'TV-PG', 'TV-14', 'TV-MA'].includes(media.metadata.rating)
    ? media.metadata.rating
    : 'TV-G') as Content['rating'],
  duration: media.duration,
  description: media.metadata.description,
  embedding: media.title.split('').slice(0, 8).map(char => char.charCodeAt(0) / 255).concat(Array.from({ length: 8 }).fill(0)).slice(0, 8),
  rightsStart: media.metadata.rightsStart || media.uploadedAt.split(' ')[0],
  rightsEnd: media.metadata.rightsEnd || media.uploadedAt.split(' ')[0],
  regions: media.metadata.regions.length > 0 ? media.metadata.regions : ['global'],
  seasonalTags: media.metadata.tags.filter(tag => /holiday|winter|summer|spring|autumn|fall/i.test(tag)),
  targetAudience: media.metadata.targetAudience.length > 0 ? media.metadata.targetAudience : ['general audience'],
  adBreakCount: Math.max(1, Math.round(media.duration / 1800)),
  completionRate: clampProgramScore(media.duration, media.metadata.genre, media.metadata.targetAudience),
  avgWatchDuration: Math.max(10, Math.round(media.duration / 90)),
  thumbnailUrl: media.thumbnailUrl,
  status: media.status === 'ready' ? 'available' : media.status === 'processing' ? 'processing' : media.status === 'error' ? 'error' : 'scheduled',
  uploadDate: media.uploadedAt,
  fileSize: media.fileSize,
  transcodingStatus: media.transcodingProgress >= 100 ? 'completed' : media.status === 'processing' ? 'in_progress' : media.status === 'error' ? 'failed' : 'pending',
});

const clampProgramScore = (duration: number, genres: string[], audience: string[]) => {
  const genreText = genres.join(' ').toLowerCase();
  const audienceText = audience.join(' ').toLowerCase();
  const familyBoost = /family|kids|all ages/.test(audienceText) ? 6 : 0;
  const premiumBoost = /documentary|news|sports|tech/.test(genreText) ? 8 : 0;
  const durationBoost = duration > 3600 ? 4 : duration > 1800 ? 7 : 5;
  return Math.min(95, Math.max(58, 68 + familyBoost + premiumBoost + durationBoost - Math.round(duration / 1200)));
};

const createUploadedScheduleTemplate = (template: WeekSchedule[], programs: Content[]) => {
  if (programs.length === 0) {
    return template;
  }

  const buildEndTime = (startTime: string, duration: number) => {
    const [hours, minutes] = startTime.split(':').map(Number);
    const totalMinutes = hours * 60 + minutes + duration;
    const endHour = Math.floor((totalMinutes % (24 * 60)) / 60);
    const endMinute = totalMinutes % 60;
    return `${String(endHour).padStart(2, '0')}:${String(endMinute).padStart(2, '0')}`;
  };

  return template.map((day, dayIndex) => ({
    ...day,
    slots: day.slots.map((slot, slotIndex) => {
      const fallbackProgram = programs[(dayIndex * day.slots.length + slotIndex) % programs.length];
      const program = programs.find(candidate => candidate.id === slot.contentId) || fallbackProgram;
      const predictedRetention = Math.min(96, Math.max(50, program.completionRate - (slotIndex % 4) * 2));
      const predictedDropoff = Math.max(4, 100 - predictedRetention);
      const slotDurationMinutes = Math.max(1, Math.ceil(program.duration / 60));

      return {
        ...slot,
        contentId: program.id,
        startTime: slot.startTime,
        endTime: buildEndTime(slot.startTime, slotDurationMinutes),
        predictedRetention,
        predictedDropoff,
        confidence: Math.min(0.99, Math.max(0.72, 0.78 + (program.completionRate - 70) / 100)),
        transitionRisk: slotIndex % 3 === 0 ? 'low' : slotIndex % 3 === 1 ? 'medium' : 'high',
        adBreaks: [{
          id: `${slot.id}-ad-1`,
          position: Math.max(12, Math.round(program.duration / 4)),
          duration: 180,
          predictedImpressions: Math.round(program.duration * 120),
          predictedCompletionRate: Math.min(96, Math.max(72, program.completionRate)),
          type: 'midroll',
        }],
      };
    }),
    avgRetention: Math.round(day.slots.reduce((sum, slot) => {
      const program = programs.find(candidate => candidate.id === slot.contentId) || programs[(dayIndex * day.slots.length) % programs.length];
      return sum + Math.min(96, Math.max(50, program.completionRate));
    }, 0) / Math.max(1, day.slots.length)),
    conflicts: day.slots.filter((_, index) => index % 3 === 2).length,
  }));
};

function AppContent() {
  const { user, profile, loading, signOut, isAdmin } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>(() => {
    const storedTab = localStorage.getItem('activeTab');
    return (storedTab as TabType) || 'dashboard';
  });
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
  const [isEditingMedia, setIsEditingMedia] = useState(false);
  const [mediaEditForm, setMediaEditForm] = useState<MediaEditForm | null>(null);
  const [mediaEditError, setMediaEditError] = useState<string | null>(null);
  const [mediaUploads, setMediaUploads] = useState<MediaUpload[]>([]);
  const [analyticsImportMessage, setAnalyticsImportMessage] = useState<string | null>(null);
  const [analyticsImportError, setAnalyticsImportError] = useState<string | null>(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadSelections, setUploadSelections] = useState<Array<{ file: File; thumbnail: string | null }>>([]);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadForm, setUploadForm] = useState({
    title: '',
    genre: '',
    rating: 'TV-G',
    targetAudience: '',
    description: '',
    transcription: '',
    metadata: '',
  });
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
  const analyticsFileInputRef = useRef<HTMLInputElement>(null);

  const [scheduleData, setScheduleData] = useState<WeekSchedule[]>(weekSchedule);
  const [isOptimizingSchedule, setIsOptimizingSchedule] = useState(false);
  const [schedulerSummary, setSchedulerSummary] = useState<SchedulerSummary | null>(null);

  const uploadedProgramCatalog = useMemo(() => mediaUploads.map(buildProgramFromUpload), [mediaUploads]);
  const contentMap = useMemo(() => new Map(uploadedProgramCatalog.map(program => [program.id, program] as const)), [uploadedProgramCatalog]);
  const viewerBehaviorMap = useMemo(() => buildViewerBehaviorMap(mediaUploads), [mediaUploads]);
  const transitionScoreMap = useMemo(() => buildTransitionScoreMap(uploadedProgramCatalog, mediaUploads), [uploadedProgramCatalog, mediaUploads]);
  const retentionForecast = useMemo(() => buildRetentionForecast(mediaUploads), [mediaUploads]);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString('en-US', { hour12: false }));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    localStorage.setItem('activeTab', activeTab);
  }, [activeTab]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (channelDropdownRef.current && !channelDropdownRef.current.contains(event.target as Node)) {
        setShowChannelDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const loadMediaUploads = useCallback(async (): Promise<MediaUploadList> => {
    try {
      const data = await getMediaUploads();
      const uploads = data as MediaUpload[];
      setMediaUploads(uploads);
      return uploads;
    } catch (error) {
      console.error('Error loading media uploads:', error);
      return [];
    }
  }, []);

  useEffect(() => {
    loadMediaUploads();
  }, [loadMediaUploads]);

  useEffect(() => {
    if (uploadedProgramCatalog.length === 0) {
      return;
    }

    setScheduleData(prev => createUploadedScheduleTemplate(prev, uploadedProgramCatalog));
  }, [uploadedProgramCatalog]);

  const generateVideoThumbnail = useCallback(async (file: File) => {
    return new Promise<string | null>((resolve) => {
      const video = document.createElement('video');
      const url = URL.createObjectURL(file);
      video.preload = 'metadata';
      video.muted = true;
      video.playsInline = true;

      const cleanup = () => {
        URL.revokeObjectURL(url);
        video.remove();
      };

      video.onloadedmetadata = () => {
        const duration = Number.isFinite(video.duration) ? video.duration : 0;
        const seekTime = duration > 0 ? Math.max(0.1, Math.min(1, duration * 0.1)) : 0;
        video.currentTime = seekTime;
      };

      video.onseeked = () => {
        const canvas = document.createElement('canvas');
        const width = video.videoWidth || 1280;
        const height = video.videoHeight || 720;
        canvas.width = width;
        canvas.height = height;
        const context = canvas.getContext('2d');
        if (!context) {
          cleanup();
          resolve(null);
          return;
        }
        context.drawImage(video, 0, 0, width, height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
        cleanup();
        resolve(dataUrl);
      };

      video.onerror = () => {
        cleanup();
        resolve(null);
      };

      video.src = url;
      video.load();
    });
  }, []);

  const handleFileSelect = useCallback(async (files: File[] | FileList | null) => {
    if (!files || (Array.isArray(files) && files.length === 0) || (!Array.isArray(files) && files.length === 0)) {
      setUploadSelections([]);
      return;
    }

    const fileList = Array.isArray(files) ? files : Array.from(files);
    setUploadError(null);
    if (fileList.length === 1) {
      setUploadForm(prev => ({
        ...prev,
        title: prev.title || fileList[0].name.replace(/\.[^/.]+$/, ''),
      }));
    }

    const selections = await Promise.all(
      fileList.map(async (file) => ({
        file,
        thumbnail: await generateVideoThumbnail(file),
      })),
    );
    setUploadSelections(selections);
  }, [generateVideoThumbnail]);

  const handleUploadSubmit = useCallback(async () => {
    if (uploadSelections.length === 0) {
      setUploadError('Please select a video file to upload.');
      return;
    }
    setUploadError(null);
    const submittedAt = new Date().toISOString().replace('T', ' ').slice(0, 19);
    const parsedGenre = uploadForm.genre
      .split(',')
      .map(item => item.trim())
      .filter(Boolean);
    const parsedAudience = uploadForm.targetAudience
      .split(',')
      .map(item => item.trim())
      .filter(Boolean);

    const tempItems = uploadSelections.map(({ file, thumbnail }, index) => ({
      id: `local-${Date.now()}-${index}`,
      title: uploadSelections.length === 1 && uploadForm.title
        ? uploadForm.title
        : file.name.replace(/\.[^/.]+$/, ''),
      fileName: file.name,
      fileSize: file.size,
      duration: 0,
      status: 'uploading' as const,
      uploadProgress: 0,
      transcodingProgress: 0,
      metadata: {
        description: uploadForm.description,
        genre: parsedGenre,
        rating: uploadForm.rating,
        transcription: uploadForm.transcription || undefined,
        targetAudience: parsedAudience,
        regions: [],
        tags: [],
      },
      uploadedAt: submittedAt,
      thumbnailUrl: thumbnail || undefined,
    }));

    setMediaUploads(prev => [...tempItems, ...prev]);
    setShowUploadModal(false);
    setUploadSelections([]);
    setUploadForm({
      title: '',
      genre: '',
      rating: 'TV-G',
      targetAudience: '',
      description: '',
      transcription: '',
      metadata: '',
    });

    uploadSelections.forEach(({ file, thumbnail }, index) => {
      const tempId = tempItems[index].id;
      uploadMedia(file, {
        title: uploadSelections.length === 1 && uploadForm.title
          ? uploadForm.title
          : file.name,
        description: uploadForm.description,
        genre: uploadForm.genre,
        rating: uploadForm.rating,
        targetAudience: uploadForm.targetAudience,
        transcription: uploadForm.transcription,
        thumbnailUrl: thumbnail || undefined,
      })
        .then((uploaded) => {
          setMediaUploads(prev => prev.map(item => (item.id === tempId ? uploaded as MediaUpload : item)));
        })
        .catch((error) => {
          console.error('Upload failed:', error);
          setMediaUploads(prev => prev.map(item => (
            item.id === tempId ? { ...item, status: 'error' } : item
          )));
        });
    });
  }, [uploadSelections, uploadForm]);

  const handleDeleteMedia = useCallback(async (mediaId: string) => {
    try {
      await deleteMedia(mediaId);
      setMediaUploads(prev => prev.filter(item => item.id !== mediaId));
      if (selectedMedia?.id === mediaId) {
        setSelectedMedia(null);
        setMediaEditForm(null);
        setMediaEditError(null);
        setIsEditingMedia(false);
      }
    } catch (error) {
      console.error('Failed to delete media:', error);
    }
  }, [selectedMedia]);

  const handleAnalyticsImport = useCallback(async (files: FileList | null) => {
    if (!files || files.length === 0) {
      return;
    }

    const file = files[0];
    setAnalyticsImportError(null);
    setAnalyticsImportMessage(null);

    try {
      const parsed = JSON.parse(await file.text()) as { programs?: Array<Record<string, unknown>> };
      if (!Array.isArray(parsed.programs) || parsed.programs.length === 0) {
        throw new Error('Analytics file must contain a non-empty programs array.');
      }

      const result = await importProgramAnalytics({ programs: parsed.programs });
      const refreshedUploads = await loadMediaUploads();

      if (selectedMedia) {
        const refreshedSelected = refreshedUploads.find(item => item.id === selectedMedia.id);
        if (refreshedSelected) {
          setSelectedMedia(refreshedSelected);
          if (isEditingMedia) {
            setMediaEditForm(buildMediaEditForm(refreshedSelected));
          }
        }
      }

      setAnalyticsImportMessage(`Imported analytics for ${result.updatedCount} program(s).`);
    } catch (error) {
      console.error('Failed to import analytics:', error);
      setAnalyticsImportError(error instanceof Error ? error.message : 'Failed to import analytics file.');
    }
  }, [isEditingMedia, loadMediaUploads, selectedMedia]);

  const openMediaViewer = useCallback((media: MediaUpload) => {
    setSelectedMedia(media);
    setMediaEditForm(buildMediaEditForm(media));
    setMediaEditError(null);
    setIsEditingMedia(false);
  }, []);

  const openMediaEditor = useCallback((media: MediaUpload) => {
    setSelectedMedia(media);
    setMediaEditForm(buildMediaEditForm(media));
    setMediaEditError(null);
    setIsEditingMedia(true);
  }, []);

  const closeMediaModal = useCallback(() => {
    setSelectedMedia(null);
    setMediaEditForm(null);
    setMediaEditError(null);
    setIsEditingMedia(false);
  }, []);

  const saveMediaEdits = useCallback(async () => {
    if (!selectedMedia || !mediaEditForm) return;

    const nextMedia: MediaUpload = {
      ...selectedMedia,
      title: mediaEditForm.title.trim() || selectedMedia.title,
      fileName: mediaEditForm.fileName.trim() || selectedMedia.fileName,
      fileSize: Number.isFinite(Number(mediaEditForm.fileSize)) ? Number(mediaEditForm.fileSize) : selectedMedia.fileSize,
      duration: Number.isFinite(Number(mediaEditForm.duration)) ? Number(mediaEditForm.duration) : selectedMedia.duration,
      status: mediaEditForm.status,
      uploadProgress: Number.isFinite(Number(mediaEditForm.uploadProgress)) ? Number(mediaEditForm.uploadProgress) : selectedMedia.uploadProgress,
      transcodingProgress: Number.isFinite(Number(mediaEditForm.transcodingProgress)) ? Number(mediaEditForm.transcodingProgress) : selectedMedia.transcodingProgress,
      metadata: {
        ...selectedMedia.metadata,
        description: mediaEditForm.description,
        genre: parseCsvList(mediaEditForm.genre),
        rating: mediaEditForm.rating,
        targetAudience: parseCsvList(mediaEditForm.targetAudience),
        regions: parseCsvList(mediaEditForm.regions),
        tags: parseCsvList(mediaEditForm.tags),
        rightsStart: mediaEditForm.rightsStart || undefined,
        rightsEnd: mediaEditForm.rightsEnd || undefined,
        transcription: mediaEditForm.transcription || undefined,
      },
      uploadedAt: fromDateTimeLocal(mediaEditForm.uploadedAt) || selectedMedia.uploadedAt,
      thumbnailUrl: mediaEditForm.thumbnailUrl.trim() || undefined,
      transcription: mediaEditForm.transcription || undefined,
      transcriptionSource: mediaEditForm.transcriptionSource || undefined,
    };

    setMediaEditError(null);

    if (selectedMedia.id.startsWith('local-')) {
      setMediaUploads(prev => prev.map(item => (item.id === selectedMedia.id ? nextMedia : item)));
      setSelectedMedia(nextMedia);
      setMediaEditForm(buildMediaEditForm(nextMedia));
      setIsEditingMedia(false);
      return;
    }

    try {
      const updated = await updateMedia(selectedMedia.id, {
        title: nextMedia.title,
        fileName: nextMedia.fileName,
        fileSize: nextMedia.fileSize,
        duration: nextMedia.duration,
        status: nextMedia.status,
        uploadProgress: nextMedia.uploadProgress,
        transcodingProgress: nextMedia.transcodingProgress,
        metadata: nextMedia.metadata,
        uploadedAt: nextMedia.uploadedAt,
        thumbnailUrl: nextMedia.thumbnailUrl,
        transcription: nextMedia.transcription,
        transcriptionSource: nextMedia.transcriptionSource,
      });

      const normalized = updated as MediaUpload;
      setMediaUploads(prev => prev.map(item => (item.id === normalized.id ? normalized : item)));
      setSelectedMedia(normalized);
      setMediaEditForm(buildMediaEditForm(normalized));
      setIsEditingMedia(false);
    } catch (error) {
      console.error('Failed to save media edits:', error);
      setMediaEditError('Failed to save media changes.');
    }
  }, [mediaEditForm, selectedMedia]);

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

  const runIntelligentScheduler = useCallback(() => {
    if (uploadedProgramCatalog.length === 0) {
      return;
    }

    setIsOptimizingSchedule(true);

    const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));
    const normalize = (value: string) => value.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
    const parseTimeToMinutes = (time: string) => {
      const [hours, minutes] = time.split(':').map(Number);
      return hours * 60 + (minutes || 0);
    };
    const getSeason = (dateString: string) => {
      const month = Number(dateString.split('-')[1]);
      if ([12, 1, 2].includes(month)) return 'winter';
      if ([3, 4, 5].includes(month)) return 'spring';
      if ([6, 7, 8].includes(month)) return 'summer';
      return 'autumn';
    };
    const getDayPart = (time: string) => {
      const hour = Number(time.split(':')[0]);
      if (hour >= 6 && hour < 12) return 'morning';
      if (hour >= 12 && hour < 17) return 'afternoon';
      if (hour >= 17 && hour < 22) return 'evening';
      return 'late-night';
    };
    const getForecastForSlot = (time: string) => {
      const hour = Number(time.split(':')[0]);
      return retentionForecast.find(forecast => Number(forecast.timeRange.split(':')[0]) === hour) || retentionForecast[0];
    };
    const getTimeStampFromSchedule = (dayDate: string, time: string) => new Date(`${dayDate}T${time}:00`);
    const getTimeStampFromSlot = (slot: ScheduleSlot) => new Date(`${slot.day}T${slot.startTime}:00`);
    const getSeriesKey = (content: Content) => {
      if (content.seriesName) return normalize(content.seriesName);
      if (content.type !== 'series') return normalize(content.title);
      return normalize(
        content.title
          .replace(/\bS\d+E\d+\b/gi, '')
          .replace(/\bepisode\s*\d+\b/gi, '')
          .replace(/\bep\.?\s*\d+\b/gi, ''),
      );
    };
    const getCastKey = (content: Content) => (content.cast || []).map(normalize).filter(Boolean);
    const overlapCount = (left: string[], right: string[]) => {
      const rightSet = new Set(right.map(normalize));
      return left.map(normalize).filter(item => rightSet.has(item)).length;
    };
    const getTransitionScore = (previousContentId: string | undefined, nextContent: Content) => {
      if (!previousContentId) return 72;
      const score = transitionScoreMap.get(`${previousContentId}->${nextContent.id}`);
      if (score) return Math.round(score.score * 100);
      const previousContent = contentMap.get(previousContentId);
      if (!previousContent) return 68;
      const sharedGenres = overlapCount(previousContent.genre, nextContent.genre);
      const sharedMood = overlapCount(previousContent.mood, nextContent.mood);
      return clamp(60 + sharedGenres * 12 + sharedMood * 8, 30, 96);
    };
    const buildAdBreakPlan = (content: Content, slotMinutes: number, predictedViewers: number, predictedRetention: number) => {
      const breakCount = Math.max(1, Math.min(2, content.adBreakCount >= 5 || slotMinutes >= 60 ? 2 : 1));
      const firstPosition = Math.max(12, Math.min(30, Math.round(slotMinutes * 0.35)));
      const secondPosition = Math.max(firstPosition + 10, Math.min(slotMinutes - 8, Math.round(slotMinutes * 0.68)));
      const baseImpressions = Math.round(predictedViewers * (predictedRetention / 100));
      return [
        {
          id: `ad-${content.id}-${Date.now()}-1`,
          position: firstPosition,
          duration: 180,
          predictedImpressions: Math.round(baseImpressions * 0.42),
          predictedCompletionRate: clamp(72 + predictedRetention * 0.2, 60, 97),
          type: 'midroll' as const,
        },
        ...(breakCount > 1 ? [{
          id: `ad-${content.id}-${Date.now()}-2`,
          position: secondPosition,
          duration: 180,
          predictedImpressions: Math.round(baseImpressions * 0.33),
          predictedCompletionRate: clamp(74 + predictedRetention * 0.18, 60, 98),
          type: 'midroll' as const,
        }] : []),
      ];
    };

    type PolicyWeights = {
      retention: number;
      watchTime: number;
      engagement: number;
      adRevenue: number;
      diversity: number;
      novelty: number;
      transition: number;
    };

    const targetDayIndices = scheduleViewMode === 'week'
      ? scheduleData.map((_, index) => index)
      : [selectedDayIndex];
    const historicalByContent = new Map<string, ScheduleSlot[]>();
    scheduleData.flatMap(day => day.slots).forEach(slot => {
      const existing = historicalByContent.get(slot.contentId) || [];
      historicalByContent.set(slot.contentId, [...existing, slot]);
    });

    const optimizeOnce = (weights: PolicyWeights) => {
      const workingDays = scheduleData.map(day => ({
        ...day,
        slots: day.slots.map(slot => ({
          ...slot,
          adBreaks: slot.adBreaks.map(adBreak => ({ ...adBreak })),
        })),
      }));

      const scheduledHistory: ScheduleSlot[] = [];
      let totalReward = 0;
      let totalRetention = 0;
      let totalWatchTime = 0;
      let totalEngagement = 0;
      let totalAdRevenue = 0;
      let totalDiversity = 0;
      let totalNovelty = 0;
      let repetitionPenalty = 0;
      let genrePenalty = 0;
      let seriesPenalty = 0;
      let actorPenalty = 0;
      let dominancePenalty = 0;
      let dropoffPenalty = 0;

      const appliedConstraints = new Set<string>();
      const recommendations = new Set<string>();

      const candidatePool = uploadedProgramCatalog;

      for (let dayIndex = 0; dayIndex < workingDays.length; dayIndex += 1) {
        const day = workingDays[dayIndex];
        const shouldOptimizeDay = targetDayIndices.includes(dayIndex);
        const nextSlots: ScheduleSlot[] = [];

        for (let slotIndex = 0; slotIndex < day.slots.length; slotIndex += 1) {
          const slot = day.slots[slotIndex];
          const slotStart = parseTimeToMinutes(slot.startTime);
          const slotEnd = parseTimeToMinutes(slot.endTime);
          const slotDuration = Math.max(1, slotEnd - slotStart);
          const forecast = getForecastForSlot(slot.startTime, slot.contentId);
          const previousContentId = nextSlots[nextSlots.length - 1]?.contentId || scheduledHistory[scheduledHistory.length - 1]?.contentId;
          const historyWindow = [...scheduledHistory, ...nextSlots].slice(-6);
          const dayWindow = nextSlots.slice(-3);
          const currentSeason = getSeason(day.date);
          const slotDayPart = getDayPart(slot.startTime);

          if (!shouldOptimizeDay) {
            nextSlots.push(slot);
            scheduledHistory.push(slot);
            continue;
          }

          const scoredCandidates = candidatePool.map(content => {
            const historicalSlots = historicalByContent.get(content.id) || [];
            const lastHistoricalSlot = [...historyWindow].reverse().find(historySlot => historySlot.contentId === content.id);
            const lastHistoricalTime = lastHistoricalSlot ? getTimeStampFromSlot(lastHistoricalSlot) : null;
            const currentTimeStamp = getTimeStampFromSchedule(day.date, slot.startTime);
            const hoursSinceRepeat = lastHistoricalTime ? (currentTimeStamp.getTime() - lastHistoricalTime.getTime()) / (1000 * 60 * 60) : Number.POSITIVE_INFINITY;
            const sameContentHardBlock = hoursSinceRepeat < 4;
            const seriesKey = getSeriesKey(content);
            const castKey = getCastKey(content);
            const recentContentCount = historyWindow.filter(historySlot => historySlot.contentId === content.id).length;
            const recentGenres = historyWindow.flatMap(historySlot => contentMap.get(historySlot.contentId)?.genre || []);
            const recentGenreCount = recentGenres.filter(genre => content.genre.some(candidateGenre => normalize(candidateGenre) === normalize(genre))).length;
            const recentSeriesCount = historyWindow.filter(historySlot => getSeriesKey(contentMap.get(historySlot.contentId) || content) === seriesKey).length;
            const recentCastCount = historyWindow.filter(historySlot => {
              const historyContent = contentMap.get(historySlot.contentId);
              if (!historyContent) return false;
              return getCastKey(historyContent).some(member => castKey.includes(member));
            }).length;
            const dominantGenre = recentGenres.reduce((best, genre) => {
              const normalizedGenre = normalize(genre);
              const existingCount = recentGenres.filter(item => normalize(item) === normalizedGenre).length;
              return existingCount > best.count ? { genre, count: existingCount } : best;
            }, { genre: '', count: 0 });
            const dominantGenreShare = historyWindow.length > 0 ? dominantGenre.count / historyWindow.length : 0;
            const sameGenreStreak = [...dayWindow].reverse().reduce((count, historySlot) => {
              const historyContent = contentMap.get(historySlot.contentId);
              if (!historyContent) return count;
              const overlapsGenre = historyContent.genre.some(historyGenre => content.genre.some(candidateGenre => normalize(historyGenre) === normalize(candidateGenre)));
              return overlapsGenre ? count + 1 : count;
            }, 0);

            if (sameContentHardBlock) {
              return {
                blocked: true,
                score: Number.NEGATIVE_INFINITY,
                predictedRetention: 0,
                predictedWatchTime: 0,
                predictedEngagement: 0,
                predictedAdRevenue: 0,
                predictedNovelty: 0,
                predictedDiversity: 0,
                repetitionPenalty: 100,
                genrePenalty: 0,
                seriesPenalty: 0,
                actorPenalty: 0,
                dominancePenalty: 0,
                dropoffPenalty: 0,
                transitionRisk: 'high' as const,
                confidence: 0,
                adBreaks: [],
              };
            }

            const viewerBehavior = viewerBehaviorMap.get(content.id);
            const historicalRetention = historicalSlots.length > 0
              ? historicalSlots.reduce((sum, historySlot) => sum + historySlot.predictedRetention, 0) / historicalSlots.length
              : null;
            const historicalWatchTime = viewerBehavior?.avgWatchDuration || content.avgWatchDuration;
            const behaviorRetention = viewerBehavior
              ? (viewerBehavior.retentionCurve.reduce((sum, value) => sum + value, 0) / viewerBehavior.retentionCurve.length) * 100
              : null;
            const baseRetention = historicalRetention ?? behaviorRetention ?? content.completionRate;
            const targetTokens = selectedChannel.targetAudience.split(',').map(item => normalize(item)).filter(Boolean);
            const targetAudienceOverlap = content.targetAudience.filter(audience => targetTokens.some(target => audience.toLowerCase().includes(target) || target.includes(normalize(audience)))).length;
            const audienceFit = clamp(52 + targetAudienceOverlap * 14 + (content.genre.some(genre => normalize(genre) === normalize(selectedChannel.primaryGenre)) ? 12 : 0), 20, 100);
            const timeFit = clamp(
              slotDayPart === 'evening' ? (content.genre.some(genre => /action|drama|holiday|reality/i.test(genre)) ? 92 : 68)
              : slotDayPart === 'morning' ? (content.genre.some(genre => /news|documentary|kids|family/i.test(genre)) ? 91 : 62)
              : slotDayPart === 'afternoon' ? (content.genre.some(genre => /documentary|tech|family|reality/i.test(genre)) ? 88 : 64)
              : (content.type === 'short' || content.genre.some(genre => /tech|reality/i.test(genre)) ? 84 : 58),
              20,
              100,
            );
            const seasonFit = clamp(
              content.seasonalTags.some(tag => normalize(tag).includes(currentSeason))
                ? 96
                : currentSeason === 'winter' && content.genre.some(genre => /holiday|christmas/i.test(genre))
                  ? 94
                  : currentSeason === 'summer' && content.genre.some(genre => /family|sports/i.test(genre))
                    ? 84
                    : 64,
              20,
              100,
            );
            const durationFit = clamp(100 - Math.abs(content.duration - slotDuration) * 2, 0, 100);
            const transitionBonus = getTransitionScore(previousContentId, content);
            const forecastRetention = forecast.predictedRetention;
            const forecastViewers = forecast.predictedViewers;
            const engagementSignal = clamp((forecastViewers / 6000) + (viewerBehavior?.peakConcurrency || 0) / 6000 + (durationFit * 0.2), 0, 100);
            const adRevenueSignal = clamp(((forecastViewers * Math.max(1, content.adBreakCount)) / 4200) * (content.completionRate / 100), 0, 100);
            const noveltyScore = clamp(100 - recentContentCount * 32 - recentGenreCount * 8 - recentSeriesCount * 18 - recentCastCount * 16, 0, 100);
            const diversityScore = clamp(100 - dominantGenreShare * 120 - Math.max(0, sameGenreStreak - 1) * 18, 0, 100);
            const repetitionPenaltyScore = recentContentCount > 0 ? 100 : 0;
            const genrePenaltyScore = sameGenreStreak >= 2 ? 22 * sameGenreStreak : 0;
            const seriesPenaltyScore = recentSeriesCount > 0 ? 20 * recentSeriesCount : 0;
            const actorPenaltyScore = recentCastCount > 0 ? 18 * recentCastCount : 0;
            const dominancePenaltyScore = dominantGenreShare > 0.4 ? (dominantGenreShare - 0.4) * 120 : 0;
            const dropoffPenaltyScore = clamp(100 - baseRetention, 0, 60);

            const totalScore = (
              weights.retention * ((baseRetention + forecastRetention + audienceFit) / 3)
              + weights.watchTime * clamp((historicalWatchTime / Math.max(1, content.duration)) * 100, 0, 100)
              + weights.engagement * engagementSignal
              + weights.adRevenue * adRevenueSignal
              + weights.diversity * diversityScore
              + weights.novelty * noveltyScore
              + weights.transition * transitionBonus
              - repetitionPenaltyScore
              - genrePenaltyScore
              - seriesPenaltyScore
              - actorPenaltyScore
              - dominancePenaltyScore
              - dropoffPenaltyScore
            );

            return {
              content,
              blocked: false,
              score: totalScore,
              predictedRetention: clamp((baseRetention * 0.45) + (forecastRetention * 0.25) + (audienceFit * 0.15) + (durationFit * 0.15), 45, 98),
              predictedWatchTime: historicalWatchTime,
              predictedEngagement: engagementSignal,
              predictedAdRevenue: adRevenueSignal,
              predictedNovelty: noveltyScore,
              predictedDiversity: diversityScore,
              repetitionPenalty: repetitionPenaltyScore,
              genrePenalty: genrePenaltyScore,
              seriesPenalty: seriesPenaltyScore,
              actorPenalty: actorPenaltyScore,
              dominancePenalty: dominancePenaltyScore,
              dropoffPenalty: dropoffPenaltyScore,
              transitionRisk: totalScore >= 72 ? 'low' as const : totalScore >= 58 ? 'medium' as const : 'high' as const,
              confidence: clamp((forecast.confidence * 100 + durationFit + diversityScore) / 3, 38, 97),
              adBreaks: buildAdBreakPlan(content, slotDuration, forecastViewers, clamp((baseRetention * 0.45) + (forecastRetention * 0.25) + (audienceFit * 0.15) + (durationFit * 0.15), 45, 98)),
            };
          }).filter(candidate => !candidate.blocked);

          const bestCandidate = scoredCandidates.sort((left, right) => right.score - left.score)[0] || null;
          const fallbackContent = contentMap.get(slot.contentId) || candidatePool[0];
          const chosenContent = bestCandidate?.content || fallbackContent;
          const chosenRetention = bestCandidate?.predictedRetention || clamp(chosenContent?.completionRate || 70, 45, 98);
          const chosenWatchTime = bestCandidate?.predictedWatchTime || chosenContent?.avgWatchDuration || slotDuration;
          const chosenEngagement = bestCandidate?.predictedEngagement || 55;
          const chosenAdRevenue = bestCandidate?.predictedAdRevenue || 40;
          const chosenNovelty = bestCandidate?.predictedNovelty || 50;
          const chosenDiversity = bestCandidate?.predictedDiversity || 50;

          const scheduledSlot: ScheduleSlot = {
            ...slot,
            contentId: chosenContent?.id || slot.contentId,
            predictedRetention: Math.round(chosenRetention),
            predictedDropoff: Math.round(100 - chosenRetention),
            confidence: (bestCandidate?.confidence || slot.confidence) / 100,
            transitionRisk: bestCandidate?.transitionRisk || slot.transitionRisk,
            adBreaks: bestCandidate?.adBreaks || slot.adBreaks,
            isEdited: true,
          };

          nextSlots.push(scheduledSlot);
          scheduledHistory.push(scheduledSlot);

          totalRetention += chosenRetention;
          totalWatchTime += chosenWatchTime;
          totalEngagement += chosenEngagement;
          totalAdRevenue += chosenAdRevenue;
          totalNovelty += chosenNovelty;
          totalDiversity += chosenDiversity;
          totalReward += bestCandidate?.score || 0;
          repetitionPenalty += bestCandidate?.repetitionPenalty || 0;
          genrePenalty += bestCandidate?.genrePenalty || 0;
          seriesPenalty += bestCandidate?.seriesPenalty || 0;
          actorPenalty += bestCandidate?.actorPenalty || 0;
          dominancePenalty += bestCandidate?.dominancePenalty || 0;
          dropoffPenalty += bestCandidate?.dropoffPenalty || 0;

          if ((bestCandidate?.repetitionPenalty || 0) > 0) {
            appliedConstraints.add('Repeat cap applied');
          }
          if ((bestCandidate?.genrePenalty || 0) > 0) {
            appliedConstraints.add('Genre balance enforced');
          }
          if ((bestCandidate?.seriesPenalty || 0) > 0) {
            appliedConstraints.add('Series repetition penalized');
          }
          if ((bestCandidate?.actorPenalty || 0) > 0) {
            appliedConstraints.add('Actor repetition penalized');
          }
          if ((bestCandidate?.dominancePenalty || 0) > 0) {
            appliedConstraints.add('Dominant content capped');
          }

          if ((bestCandidate?.predictedNovelty || 0) < 55) {
            recommendations.add('Rotate in fresher programs to preserve novelty across the daypart.');
          }
          if ((bestCandidate?.predictedDiversity || 0) < 60) {
            recommendations.add('Increase genre contrast in the next block to avoid audience fatigue.');
          }
          if ((bestCandidate?.predictedAdRevenue || 0) > 65) {
            recommendations.add('Keep the current ad load in high-retention slots to maximize revenue.');
          }
        }

        const updatedAvgRetention = nextSlots.length > 0
          ? nextSlots.reduce((sum, slot) => sum + slot.predictedRetention, 0) / nextSlots.length
          : day.avgRetention;
        const updatedConflicts = nextSlots.filter(slot => slot.transitionRisk === 'high').length;

        workingDays[dayIndex] = {
          ...day,
          slots: nextSlots,
          avgRetention: Math.round(updatedAvgRetention),
          conflicts: updatedConflicts,
        };

      }

      const scheduledCount = Math.max(1, scheduledHistory.length);
      const summary: SchedulerSummary = {
        scope: scheduleViewMode === 'week' ? 'Full week' : `${scheduleData[selectedDayIndex].day}`,
        epochs: 1,
        reward: Math.round(totalReward / scheduledCount),
        retention: Math.round(totalRetention / scheduledCount),
        watchTime: Math.round(totalWatchTime / scheduledCount),
        engagement: Math.round(totalEngagement / scheduledCount),
        adRevenue: Math.round(totalAdRevenue),
        diversity: Math.round(totalDiversity / scheduledCount),
        novelty: Math.round(totalNovelty / scheduledCount),
        penalties: {
          repetition: Math.round(repetitionPenalty),
          genre: Math.round(genrePenalty),
          series: Math.round(seriesPenalty),
          actors: Math.round(actorPenalty),
          dominance: Math.round(dominancePenalty),
          dropoff: Math.round(dropoffPenalty),
        },
        appliedConstraints: Array.from(appliedConstraints),
        recommendations: Array.from(recommendations),
      };

      return {
        schedule: workingDays,
        summary,
      };
    };

    try {
      const basePolicy: PolicyWeights = {
        retention: 0.28,
        watchTime: 0.20,
        engagement: 0.16,
        adRevenue: 0.16,
        diversity: 0.12,
        novelty: 0.08,
        transition: 0.10,
      };

      let policy = { ...basePolicy };
      let bestResult: { schedule: WeekSchedule[]; summary: SchedulerSummary } | null = null;

      for (let epoch = 0; epoch < 3; epoch += 1) {
        const result = optimizeOnce(policy);
        result.summary.epochs = epoch + 1;

        if (!bestResult || result.summary.reward > bestResult.summary.reward) {
          bestResult = result;
        }

        const clippedAdvantage = clamp(result.summary.reward / 100 - 0.5, -0.2, 0.2);
        policy = {
          retention: clamp(policy.retention + clippedAdvantage * 0.03, 0.18, 0.36),
          watchTime: clamp(policy.watchTime + clippedAdvantage * 0.02, 0.12, 0.30),
          engagement: clamp(policy.engagement + clippedAdvantage * 0.02, 0.10, 0.25),
          adRevenue: clamp(policy.adRevenue + clippedAdvantage * 0.02, 0.10, 0.25),
          diversity: clamp(policy.diversity + (result.summary.diversity < 65 ? 0.02 : -0.005), 0.08, 0.20),
          novelty: clamp(policy.novelty + (result.summary.novelty < 65 ? 0.015 : -0.005), 0.05, 0.16),
          transition: clamp(policy.transition + (result.summary.penalties.dropoff > 0 ? 0.01 : -0.002), 0.06, 0.14),
        };
      }

      if (bestResult) {
        setScheduleData(bestResult.schedule);
        setSchedulerSummary(bestResult.summary);
      }
    } finally {
      setIsOptimizingSchedule(false);
    }
  }, [contentMap, retentionForecast, scheduleData, scheduleViewMode, selectedDayIndex, selectedChannel, transitionScoreMap, uploadedProgramCatalog, viewerBehaviorMap]);

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
            <ScheduleBuilder
              uploadedProgramCatalog={uploadedProgramCatalog}
              scheduleData={scheduleData}
              selectedDayIndex={selectedDayIndex}
              onSelectedDayIndexChange={setSelectedDayIndex}
              scheduleViewMode={scheduleViewMode}
              onScheduleViewModeChange={setScheduleViewMode}
              nlInput={nlInput}
              onNlInputChange={setNlInput}
              onGenerateIntent={handleNLSubmit}
              parsedIntent={parsedIntent}
              onRunScheduler={runIntelligentScheduler}
              isOptimizingSchedule={isOptimizingSchedule}
              schedulerSummary={schedulerSummary}
              formatTime={formatTime}
              getStatusIcon={getStatusIcon}
              getTransitionColor={getTransitionColor}
              onSlotEdit={handleSlotEdit}
              showEditWarning={showEditWarning}
              editingSlot={editingSlot}
              onCancelEdit={cancelEdit}
              onConfirmEdit={confirmEdit}
              showEditPanel={showEditPanel}
              editedSlotData={editedSlotData}
              onCloseEditPanel={() => {
                setShowEditPanel(false);
                setEditingSlot(null);
                setEditedSlotData(null);
              }}
              onEditedSlotDataChange={setEditedSlotData}
              onSaveSlotEdit={saveSlotEdit}
              showManualScheduleModal={showManualScheduleModal}
              onOpenManualScheduleModal={() => setShowManualScheduleModal(true)}
              onCloseManualScheduleModal={() => setShowManualScheduleModal(false)}
              manualScheduleData={manualScheduleData}
              onManualScheduleDataChange={setManualScheduleData}
              onManualScheduleSubmit={handleManualSchedule}
            />
          )}

          {/* Media Upload */}
          {activeTab === 'media' && (
            <MediaLibrary
              mediaUploads={mediaUploads}
              selectedMedia={selectedMedia}
              isEditingMedia={isEditingMedia}
              mediaEditForm={mediaEditForm}
              mediaEditError={mediaEditError}
              showUploadModal={showUploadModal}
              uploadSelections={uploadSelections}
              uploadError={uploadError}
              uploadForm={uploadForm}
              analyticsImportMessage={analyticsImportMessage}
              analyticsImportError={analyticsImportError}
              formatDuration={formatDuration}
              formatFileSize={formatFileSize}
              onOpenUploadModal={() => setShowUploadModal(true)}
              onCloseUploadModal={() => setShowUploadModal(false)}
              onFileSelect={handleFileSelect}
              onUploadSubmit={handleUploadSubmit}
              onUploadFormChange={(next) => setUploadForm(next)}
              onAnalyticsImport={handleAnalyticsImport}
              onOpenMediaViewer={openMediaViewer}
              onOpenMediaEditor={openMediaEditor}
              onDeleteMedia={(mediaId) => { void handleDeleteMedia(mediaId); }}
              onCloseMediaModal={closeMediaModal}
              onStartEditingMedia={() => setIsEditingMedia(true)}
              onCancelMediaEdit={() => {
                if (selectedMedia) {
                  setMediaEditForm(buildMediaEditForm(selectedMedia));
                }
                setIsEditingMedia(false);
                setMediaEditError(null);
              }}
              onSaveMediaEdits={() => { void saveMediaEdits(); }}
              onMediaEditFormChange={(next) => setMediaEditForm(next)}
            />
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
