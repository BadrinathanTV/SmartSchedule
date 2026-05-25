export interface Content {
  id: string;
  title: string;
  type: 'movie' | 'series' | 'special' | 'short';
  seriesName?: string;
  cast?: string[];
  genre: string[];
  subgenre: string[];
  mood: string[];
  rating: 'G' | 'PG' | 'PG-13' | 'R' | 'TV-Y' | 'TV-Y7' | 'TV-G' | 'TV-PG' | 'TV-14' | 'TV-MA';
  duration: number;
  description: string;
  embedding: number[];
  rightsStart: string;
  rightsEnd: string;
  regions: string[];
  seasonalTags: string[];
  targetAudience: string[];
  adBreakCount: number;
  completionRate: number;
  avgWatchDuration: number;
  thumbnailUrl?: string;
  status?: 'available' | 'processing' | 'error' | 'scheduled';
  uploadDate?: string;
  fileSize?: number;
  transcodingStatus?: 'pending' | 'in_progress' | 'completed' | 'failed';
}

export interface ScheduleSlot {
  id: string;
  contentId: string;
  displayTitle?: string;
  description?: string;
  scheduleType?: 'program' | 'live';
  startTime: string;
  endTime: string;
  predictedRetention: number;
  predictedDropoff: number;
  confidence: number;
  adBreaks: AdBreak[];
  status: 'scheduled' | 'live' | 'completed' | 'conflict';
  transitionRisk: 'low' | 'medium' | 'high';
  day: string;
  isEdited?: boolean;
}

export interface AdBreak {
  id: string;
  position: number;
  duration: number;
  predictedImpressions: number;
  predictedCompletionRate: number;
  type: 'preroll' | 'midroll' | 'postroll';
}

export interface ViewerBehavior {
  contentId: string;
  avgWatchDuration: number;
  peakConcurrency: number;
  entryPoint: number;
  exitPoints: number[];
  retentionCurve: number[];
  deviceTypes: Record<string, number>;
  geographicDistribution: Record<string, number>;
  switchToChannels: Record<string, number>;
  switchFromChannels: Record<string, number>;
}

export interface TransitionScore {
  fromContentId: string;
  toContentId: string;
  score: number;
  predictedRetention: number;
  predictedSwitching: number;
  reasons: string[];
}

export interface ScheduleIntent {
  naturalLanguage: string;
  parsedConstraints: string[];
  parsedGoals: string[];
  targetDate: string;
  channelId: string;
}

export interface SimulationResult {
  scheduleId: string;
  predictedRetention: number;
  predictedExits: number;
  predictedAdRevenue: number;
  transitionHotpots: TransitionHotspot[];
  optimizationSuggestions: string[];
  comparisonBaseline?: SimulationResult;
}

export interface TransitionHotspot {
  slotId: string;
  contentTitle: string;
  timeRange: string;
  risk: 'low' | 'medium' | 'high';
  predictedDropoff: number;
  suggestedFix: string;
}

export interface SelfHealingLog {
  id: string;
  timestamp: string;
  originalContentId: string;
  originalTitle: string;
  replacementContentId: string;
  replacementTitle: string;
  similarityScore: number;
  reason: string;
  status: 'completed' | 'pending' | 'rejected';
}

export interface ChannelConfig {
  id: string;
  name: string;
  targetAudience: string;
  primaryGenre: string;
  ratingLimit: string;
  adLoadMinutes: number;
  operatingHours: string;
  logo?: string;
  color?: string;
  status: 'active' | 'inactive' | 'maintenance';
  viewerCount?: number;
  retention?: number;
  growth?: number;
}

export interface ConstraintViolation {
  type: 'rights' | 'rating' | 'frequency' | 'ad_break' | 'policy';
  severity: 'warning' | 'error';
  message: string;
  affectedSlotId: string;
  suggestedFix: string;
}

export interface RetentionForecast {
  timeRange: string;
  predictedViewers: number;
  predictedRetention: number;
  confidence: number;
  lowerBound: number;
  upperBound: number;
}

export interface NLIntent {
  raw: string;
  parsed: {
    action: 'create' | 'modify' | 'optimize' | 'simulate';
    constraints: string[];
    goals: string[];
    timeRange?: string;
    targetContent?: string;
  };
  confidence: number;
}

export interface ChannelMetrics {
  channelId: string;
  topPrograms: TopProgram[];
  peakTime: string;
  audienceCount: number;
  adWatchTime: number;
  weeklyRetention: number;
  weeklyGrowth: number;
  avgViewDuration: number;
  topGenre: string;
  topRegion: string;
  completionRate: number;
}

export interface TopProgram {
  id: string;
  title: string;
  rating: number;
  viewers: number;
  retention: number;
  genre: string;
  airTime: string;
}

export interface WeekSchedule {
  day: string;
  date: string;
  slots: ScheduleSlot[];
  totalHours: number;
  avgRetention: number;
  conflicts: number;
}

export interface ImportedProgramAnalytics {
  content_id: string;
  program_title: string;
  start_time: string;
  end_time: string;
  concurrent_viewers: number;
  unique_viewers: number;
  average_watch_duration_minutes: number;
  audience_retention_curve: number[];
  drop_off_timestamps: string[];
  ad_metrics: {
    impressions: number;
    completion_rate: number;
  };
  viewer_behavior: {
    entry_points: string[];
    exit_points: string[];
  };
  device_types: Record<string, number>;
  geographic_regions: Record<string, number>;
  interactive_ctr: number;
}

export interface MediaUpload {
  id: string;
  title: string;
  fileName: string;
  fileSize: number;
  duration: number;
  status: 'uploading' | 'processing' | 'ready' | 'error';
  uploadProgress: number;
  transcodingProgress: number;
  metadata: MediaMetadata;
  uploadedAt: string;
  channelId?: string;
  thumbnailUrl?: string;
  transcription?: string;
  transcriptionSource?: 'ai' | 'user';
  analyticsData?: ImportedProgramAnalytics;
}

export interface MediaMetadata {
  description: string;
  genre: string[];
  rating: string;
  transcription?: string;
  targetAudience: string[];
  rightsStart?: string;
  rightsEnd?: string;
  regions: string[];
  tags: string[];
}

export interface ChannelComparison {
  channelId: string;
  channelName: string;
  retention: number;
  viewers: number;
  growth: number;
  adRevenue: number;
  score: number;
}
