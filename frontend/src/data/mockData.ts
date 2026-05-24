import type {
  Content,
  ViewerBehavior,
  ChannelConfig,
  SelfHealingLog,
  ScheduleSlot,
  TransitionScore,
  ChannelMetrics,
  TopProgram,
  WeekSchedule,
  MediaUpload,
  ChannelComparison,
} from '../types';

export const mockContentCatalog: Content[] = [
  {
    id: 'content-001',
    title: 'Northern Exposure',
    type: 'series',
    genre: ['Drama', 'Mystery'],
    subgenre: ['Thriller', 'Crime'],
    mood: ['Tense', 'Atmospheric'],
    rating: 'TV-14',
    duration: 42,
    description: 'A remote Alaskan town harbors dark secrets beneath its serene surface.',
    embedding: [0.82, 0.45, 0.33, 0.67, 0.89, 0.12, 0.78, 0.56],
    rightsStart: '2024-01-01',
    rightsEnd: '2026-12-31',
    regions: ['US', 'CA', 'UK'],
    seasonalTags: ['winter', 'holiday'],
    targetAudience: ['adults 25-54'],
    adBreakCount: 4,
    completionRate: 78,
    avgWatchDuration: 32,
    status: 'available',
  },
  {
    id: 'content-002',
    title: 'Family Matters',
    type: 'series',
    genre: ['Comedy', 'Family'],
    subgenre: ['Sitcom', 'Slapstick'],
    mood: ['Light', 'Upbeat'],
    rating: 'TV-G',
    duration: 22,
    description: 'Wacky family adventures in suburban Chicago.',
    embedding: [0.22, 0.89, 0.67, 0.12, 0.34, 0.91, 0.23, 0.45],
    rightsStart: '2024-01-01',
    rightsEnd: '2025-06-30',
    regions: ['US', 'CA', 'MX'],
    seasonalTags: ['summer'],
    targetAudience: ['families', 'kids 6-12'],
    adBreakCount: 3,
    completionRate: 72,
    avgWatchDuration: 18,
    status: 'scheduled',
  },
  {
    id: 'content-003',
    title: 'The Grand Hotel',
    type: 'series',
    genre: ['Drama', 'Romance'],
    subgenre: ['Period', 'Mystery'],
    mood: ['Romantic', 'Dramatic'],
    rating: 'TV-PG',
    duration: 45,
    description: 'Romance and intrigue at a luxurious coastal hotel in 1920s Spain.',
    embedding: [0.56, 0.78, 0.45, 0.34, 0.67, 0.89, 0.45, 0.23],
    rightsStart: '2024-03-01',
    rightsEnd: '2026-03-01',
    regions: ['US', 'UK', 'EU'],
    seasonalTags: ['spring'],
    targetAudience: ['adults 35-54', 'seniors'],
    adBreakCount: 5,
    completionRate: 81,
    avgWatchDuration: 38,
    status: 'available',
  },
  {
    id: 'content-004',
    title: 'Christmas in Evergreen',
    type: 'movie',
    genre: ['Romance', 'Holiday'],
    subgenre: ['Christmas', 'Rom-Com'],
    mood: ['Heartwarming', 'Festive'],
    rating: 'TV-G',
    duration: 84,
    description: 'A small-town romance blossoms during the holiday season.',
    embedding: [0.12, 0.95, 0.23, 0.67, 0.45, 0.78, 0.34, 0.56],
    rightsStart: '2024-10-01',
    rightsEnd: '2025-01-31',
    regions: ['US', 'CA'],
    seasonalTags: ['christmas', 'winter', 'holiday'],
    targetAudience: ['adults 25-54', 'families'],
    adBreakCount: 6,
    completionRate: 85,
    avgWatchDuration: 72,
    status: 'live',
  },
  {
    id: 'content-005',
    title: 'Winter Wonderland',
    type: 'special',
    genre: ['Holiday', 'Music'],
    subgenre: ['Christmas', 'Musical'],
    mood: ['Festive', 'Joyful'],
    rating: 'TV-G',
    duration: 90,
    description: 'Musical performances celebrating the holiday season.',
    embedding: [0.23, 0.87, 0.12, 0.78, 0.56, 0.67, 0.45, 0.89],
    rightsStart: '2024-11-01',
    rightsEnd: '2025-01-15',
    regions: ['US', 'CA', 'UK'],
    seasonalTags: ['christmas', 'winter'],
    targetAudience: ['all ages'],
    adBreakCount: 5,
    completionRate: 76,
    avgWatchDuration: 65,
    status: 'scheduled',
  },
  {
    id: 'content-006',
    title: 'Tech Innovators',
    type: 'series',
    genre: ['Documentary', 'Tech'],
    subgenre: ['Business', 'Science'],
    mood: ['Inspiring', 'Informative'],
    rating: 'TV-PG',
    duration: 48,
    description: 'Behind the scenes of Silicon Valley breakthrough.',
    embedding: [0.78, 0.34, 0.89, 0.23, 0.12, 0.45, 0.67, 0.89],
    rightsStart: '2024-01-01',
    rightsEnd: '2025-12-31',
    regions: ['US', 'UK', 'EU', 'APAC'],
    seasonalTags: [],
    targetAudience: ['adults 18-49', 'professionals'],
    adBreakCount: 4,
    completionRate: 68,
    avgWatchDuration: 35,
    status: 'available',
  },
  {
    id: 'content-007',
    title: 'Kitchen Championship',
    type: 'series',
    genre: ['Reality', 'Food'],
    subgenre: ['Competition', 'Cooking'],
    mood: ['Exciting', 'Competitive'],
    rating: 'TV-PG',
    duration: 42,
    description: 'Top chefs compete for culinary glory.',
    embedding: [0.45, 0.67, 0.34, 0.89, 0.56, 0.23, 0.78, 0.12],
    rightsStart: '2024-01-01',
    rightsEnd: '2026-06-30',
    regions: ['US', 'CA', 'UK', 'AU'],
    seasonalTags: [],
    targetAudience: ['adults 25-54'],
    adBreakCount: 5,
    completionRate: 74,
    avgWatchDuration: 30,
    status: 'available',
  },
  {
    id: 'content-008',
    title: 'Nature Unleashed',
    type: 'series',
    genre: ['Documentary', 'Nature'],
    subgenre: ['Wildlife', 'Adventure'],
    mood: ['Awe-inspiring', 'Dramatic'],
    rating: 'TV-G',
    duration: 50,
    description: 'Stunning footage of Earth most powerful natural phenomena.',
    embedding: [0.67, 0.23, 0.45, 0.78, 0.89, 0.34, 0.12, 0.56],
    rightsStart: '2024-01-01',
    rightsEnd: '2027-12-31',
    regions: ['global'],
    seasonalTags: [],
    targetAudience: ['all ages', 'nature lovers'],
    adBreakCount: 4,
    completionRate: 82,
    avgWatchDuration: 42,
    status: 'available',
  },
];

export const channelConfigs: ChannelConfig[] = [
  {
    id: 'channel-001',
    name: 'Holiday Hits FAST',
    targetAudience: 'families, adults 25-54',
    primaryGenre: 'Holiday',
    ratingLimit: 'TV-PG',
    adLoadMinutes: 12,
    operatingHours: '06:00-24:00',
    color: '#10b981',
    status: 'active',
    viewerCount: 456000,
    retention: 78,
    growth: 12,
  },
  {
    id: 'channel-002',
    name: 'Action Cinema',
    targetAudience: 'adults 18-49',
    primaryGenre: 'Action',
    ratingLimit: 'TV-14',
    adLoadMinutes: 10,
    operatingHours: '00:00-24:00',
    color: '#f59e0b',
    status: 'active',
    viewerCount: 389000,
    retention: 72,
    growth: 8,
  },
  {
    id: 'channel-003',
    name: 'Family Fun',
    targetAudience: 'families, all ages',
    primaryGenre: 'Family',
    ratingLimit: 'TV-G',
    adLoadMinutes: 8,
    operatingHours: '06:00-22:00',
    color: '#ec4899',
    status: 'active',
    viewerCount: 312000,
    retention: 81,
    growth: -2,
  },
  {
    id: 'channel-004',
    name: 'Documentary Central',
    targetAudience: 'adults 35-65',
    primaryGenre: 'Documentary',
    ratingLimit: 'TV-PG',
    adLoadMinutes: 9,
    operatingHours: '00:00-24:00',
    color: '#6366f1',
    status: 'active',
    viewerCount: 267000,
    retention: 85,
    growth: 15,
  },
  {
    id: 'channel-005',
    name: 'Sports Highlights',
    targetAudience: 'sports fans 18-49',
    primaryGenre: 'Sports',
    ratingLimit: 'TV-PG',
    adLoadMinutes: 11,
    operatingHours: '06:00-24:00',
    color: '#14b8a6',
    status: 'maintenance',
    viewerCount: 189000,
    retention: 68,
    growth: -5,
  },
];

export const channelMetrics: ChannelMetrics = {
  channelId: 'channel-001',
  topPrograms: [
    { id: 'p1', title: 'Christmas in Evergreen', rating: 4.8, viewers: 456000, retention: 85, genre: 'Holiday', airTime: '11:00 AM' },
    { id: 'p2', title: 'Winter Wonderland', rating: 4.6, viewers: 389000, retention: 82, genre: 'Holiday', airTime: '12:30 PM' },
    { id: 'p3', title: 'The Grand Hotel', rating: 4.5, viewers: 312000, retention: 78, genre: 'Drama', airTime: '09:00 AM' },
    { id: 'p4', title: 'Nature Unleashed', rating: 4.4, viewers: 298000, retention: 81, genre: 'Documentary', airTime: '10:00 AM' },
    { id: 'p5', title: 'Kitchen Championship', rating: 4.3, viewers: 267000, retention: 74, genre: 'Reality', airTime: '08:00 AM' },
  ],
  peakTime: '07:00 PM - 10:00 PM',
  audienceCount: 456000,
  adWatchTime: 45,
  weeklyRetention: 78,
  weeklyGrowth: 12,
  avgViewDuration: 42,
  topGenre: 'Holiday',
  topRegion: 'United States (78%)',
  completionRate: 82,
};

export const weekSchedule: WeekSchedule[] = [
  {
    day: 'Monday',
    date: '2024-12-23',
    totalHours: 18,
    avgRetention: 74,
    conflicts: 0,
    slots: generateDaySlots('2024-12-23'),
  },
  {
    day: 'Tuesday',
    date: '2024-12-24',
    totalHours: 18,
    avgRetention: 76,
    conflicts: 1,
    slots: generateDaySlots('2024-12-24'),
  },
  {
    day: 'Wednesday',
    date: '2024-12-25',
    totalHours: 18,
    avgRetention: 85,
    conflicts: 0,
    slots: generateHolidaySlots('2024-12-25'),
  },
  {
    day: 'Thursday',
    date: '2024-12-26',
    totalHours: 18,
    avgRetention: 72,
    conflicts: 0,
    slots: generateDaySlots('2024-12-26'),
  },
  {
    day: 'Friday',
    date: '2024-12-27',
    totalHours: 18,
    avgRetention: 73,
    conflicts: 2,
    slots: generateDaySlots('2024-12-27'),
  },
];

function generateDaySlots(date: string): ScheduleSlot[] {
  const contents = ['content-002', 'content-007', 'content-003', 'content-008', 'content-006', 'content-001'];
  const slots: ScheduleSlot[] = [];
  let currentTime = 6;

  for (let i = 0; i < 8; i++) {
    const content = mockContentCatalog.find(c => c.id === contents[i % contents.length])!;
    const startTime = `${currentTime.toString().padStart(2, '0')}:00`;
    const endTime = `${(currentTime + Math.ceil(content.duration / 60)).toString().padStart(2, '0')}:00`;

    slots.push({
      id: `slot-${date}-${i}`,
      contentId: content.id,
      startTime,
      endTime,
      predictedRetention: content.completionRate - Math.floor(Math.random() * 10),
      predictedDropoff: 100 - content.completionRate + Math.floor(Math.random() * 10),
      confidence: 0.8 + Math.random() * 0.15,
      adBreaks: [
        { id: `ad-${date}-${i}-1`, position: 15, duration: 180, predictedImpressions: 150000 + Math.floor(Math.random() * 100000), predictedCompletionRate: 80 + Math.floor(Math.random() * 10), type: 'midroll' },
      ],
      status: 'scheduled',
      transitionRisk: i % 3 === 0 ? 'low' : i % 3 === 1 ? 'medium' : 'high',
      day: date,
    });

    currentTime += Math.ceil(content.duration / 60);
    if (currentTime >= 24) currentTime = 0;
  }

  return slots;
}

function generateHolidaySlots(date: string): ScheduleSlot[] {
  const holidayContents = ['content-004', 'content-005', 'content-004', 'content-005', 'content-011'];
  const slots: ScheduleSlot[] = [];
  let currentTime = 6;

  for (let i = 0; i < 6; i++) {
    const content = mockContentCatalog.find(c => c.id === holidayContents[i % holidayContents.length]) || mockContentCatalog[0]!;
    const startTime = `${currentTime.toString().padStart(2, '0')}:00`;
    const endTime = `${(currentTime + Math.ceil(content.duration / 60)).toString().padStart(2, '0')}:00`;

    slots.push({
      id: `slot-${date}-${i}`,
      contentId: content.id,
      startTime,
      endTime,
      predictedRetention: 85 + Math.floor(Math.random() * 5),
      predictedDropoff: 15 - Math.floor(Math.random() * 5),
      confidence: 0.9 + Math.random() * 0.08,
      adBreaks: [
        { id: `ad-${date}-${i}-1`, position: 20, duration: 180, predictedImpressions: 350000 + Math.floor(Math.random() * 100000), predictedCompletionRate: 88 + Math.floor(Math.random() * 8), type: 'midroll' },
      ],
      status: 'scheduled',
      transitionRisk: 'low',
      day: date,
    });

    currentTime += Math.ceil(content.duration / 60);
    if (currentTime >= 24) break;
  }

  return slots;
}

export const mockMediaUploads: MediaUpload[] = [
  {
    id: 'media-001',
    title: 'Christmas in Evergreen',
    fileName: 'christmas_evergreen_1080p.mp4',
    fileSize: 2456000000,
    duration: 5040,
    status: 'ready',
    uploadProgress: 100,
    transcodingProgress: 100,
    metadata: {
      description: 'A small-town romance blossoms during the holiday season.',
      genre: ['Romance', 'Holiday'],
      rating: 'TV-G',
      transcription: 'Generated automatically',
      targetAudience: ['families', 'adults 25-54'],
      regions: ['US', 'CA'],
      tags: ['christmas', 'winter', 'romance', 'holiday'],
    },
    uploadedAt: '2024-12-15 14:30:00',
  },
  {
    id: 'media-002',
    title: 'Winter Wonderland Special',
    fileName: 'winter_wonderland_2024.mp4',
    fileSize: 3120000000,
    duration: 5400,
    status: 'processing',
    uploadProgress: 100,
    transcodingProgress: 67,
    metadata: {
      description: 'Musical performances celebrating the holiday season.',
      genre: ['Holiday', 'Music'],
      rating: 'TV-G',
      targetAudience: ['all ages'],
      regions: ['US', 'CA', 'UK'],
      tags: ['christmas', 'music', 'special'],
    },
    uploadedAt: '2024-12-18 09:15:00',
  },
  {
    id: 'media-003',
    title: 'Nature Documentary EP 1',
    fileName: 'nature_ep01_4k.mp4',
    fileSize: 5600000000,
    duration: 3000,
    status: 'ready',
    uploadProgress: 100,
    transcodingProgress: 100,
    metadata: {
      description: 'Stunning footage of Earth most powerful natural phenomena.',
      genre: ['Documentary', 'Nature'],
      rating: 'TV-G',
      targetAudience: ['all ages', 'nature lovers'],
      regions: ['global'],
      tags: ['nature', 'wildlife', 'documentary'],
    },
    uploadedAt: '2024-12-10 11:45:00',
  },
  {
    id: 'media-004',
    title: 'Tech Innovators S1E01',
    fileName: 'tech_innovators_s01e01.mp4',
    fileSize: 1890000000,
    duration: 2880,
    status: 'error',
    uploadProgress: 100,
    transcodingProgress: 45,
    metadata: {
      description: 'Behind the scenes of Silicon Valley breakthrough.',
      genre: ['Documentary', 'Tech'],
      rating: 'TV-PG',
      targetAudience: ['adults 18-49'],
      regions: ['US', 'EU'],
      tags: ['tech', 'documentary', 'business'],
    },
    uploadedAt: '2024-12-12 16:20:00',
  },
];

export const channelComparisons: ChannelComparison[] = [
  { channelId: 'channel-001', channelName: 'Holiday Hits FAST', retention: 78, viewers: 456000, growth: 12, adRevenue: 234000, score: 89 },
  { channelId: 'channel-002', channelName: 'Action Cinema', retention: 72, viewers: 389000, growth: 8, adRevenue: 198000, score: 76 },
  { channelId: 'channel-003', channelName: 'Family Fun', retention: 81, viewers: 312000, growth: -2, adRevenue: 167000, score: 82 },
  { channelId: 'channel-004', channelName: 'Documentary Central', retention: 85, viewers: 267000, growth: 15, adRevenue: 145000, score: 91 },
  { channelId: 'channel-005', channelName: 'Sports Highlights', retention: 68, viewers: 189000, growth: -5, adRevenue: 112000, score: 64 },
];

export const mockViewerBehaviors: ViewerBehavior[] = [
  {
    contentId: 'content-001',
    avgWatchDuration: 32,
    peakConcurrency: 245000,
    entryPoint: 0,
    exitPoints: [8, 15, 28, 35],
    retentionCurve: [1.0, 0.92, 0.87, 0.78, 0.72, 0.65, 0.58],
    deviceTypes: { 'Connected TV': 72, 'Mobile': 18, 'Web': 10 },
    geographicDistribution: { 'US': 78, 'CA': 15, 'UK': 7 },
    switchToChannels: { 'news-channel': 23, 'sports-channel': 18, 'entertainment-channel': 12 },
    switchFromChannels: { 'news-channel': 15, 'sports-channel': 12 },
  },
  {
    contentId: 'content-004',
    avgWatchDuration: 72,
    peakConcurrency: 489000,
    entryPoint: 0,
    exitPoints: [15, 35, 50, 72],
    retentionCurve: [1.0, 0.96, 0.93, 0.89, 0.85, 0.82, 0.79],
    deviceTypes: { 'Connected TV': 82, 'Mobile': 12, 'Web': 6 },
    geographicDistribution: { 'US': 72, 'CA': 28 },
    switchToChannels: { 'holiday-movies': 34, 'family-channel': 12 },
    switchFromChannels: { 'news-channel': 8 },
  },
];

export const defaultScheduleSlots: ScheduleSlot[] = generateDaySlots('2024-12-24');

export const transitionScores: TransitionScore[] = [
  { fromContentId: 'content-002', toContentId: 'content-007', score: 0.76, predictedRetention: 71, predictedSwitching: 18, reasons: ['Genre mismatch: Comedy to Reality', 'Audience overlap: 65%'] },
  { fromContentId: 'content-007', toContentId: 'content-003', score: 0.89, predictedRetention: 74, predictedSwitching: 12, reasons: ['Genre match: Reality', 'Mood alignment: Inspiring to Exciting', 'Audience overlap: 78%'] },
  { fromContentId: 'content-003', toContentId: 'content-008', score: 0.72, predictedRetention: 81, predictedSwitching: 15, reasons: ['Genre mismatch: Drama to Documentary', 'Audience overlap: 54%'] },
  { fromContentId: 'content-008', toContentId: 'content-004', score: 0.93, predictedRetention: 85, predictedSwitching: 8, reasons: ['Mood transition: Awe-inspiring to Heartwarming', 'Seasonal alignment: Winter content', 'Audience overlap: 82%'] },
];

export const mockSelfHealingLogs: SelfHealingLog[] = [
  {
    id: 'heal-001',
    timestamp: '2024-12-20 14:23:45',
    originalContentId: 'content-004',
    originalTitle: 'Christmas in Evergreen',
    replacementContentId: 'content-005',
    replacementTitle: 'Winter Wonderland',
    similarityScore: 0.89,
    reason: 'Rights window expired during scheduled broadcast',
    status: 'completed',
  },
  {
    id: 'heal-002',
    timestamp: '2024-12-20 08:45:12',
    originalContentId: 'content-005',
    originalTitle: 'Winter Wonderland',
    replacementContentId: 'content-004',
    replacementTitle: 'Christmas in Evergreen',
    similarityScore: 0.91,
    reason: 'Technical issue: asset unavailable',
    status: 'completed',
  },
];

export function calculateSimilarity(embedding1: number[], embedding2: number[]): number {
  if (embedding1.length !== embedding2.length) return 0;
  let dotProduct = 0;
  let norm1 = 0;
  let norm2 = 0;
  for (let i = 0; i < embedding1.length; i++) {
    dotProduct += embedding1[i] * embedding2[i];
    norm1 += embedding1[i] * embedding1[i];
    norm2 += embedding2[i] * embedding2[i];
  }
  const denominator = Math.sqrt(norm1) * Math.sqrt(norm2);
  return denominator === 0 ? 0 : dotProduct / denominator;
}

export function findBestReplacement(
  contentId: string,
  catalog: Content[],
  constraints: { rating?: string; genre?: string; duration?: number }
): { content: Content; score: number } | null {
  const original = catalog.find(c => c.id === contentId);
  if (!original) return null;

  let bestMatch: { content: Content; score: number } | null = null;

  for (const content of catalog) {
    if (content.id === contentId) continue;
    if (constraints.rating && content.rating !== constraints.rating) continue;

    const similarity = calculateSimilarity(original.embedding, content.embedding);

    if (!bestMatch || similarity > bestMatch.score) {
      bestMatch = { content, score: similarity };
    }
  }

  return bestMatch;
}

export function parseNaturalLanguageIntent(input: string): import('../types').NLIntent {
  const lowerInput = input.toLowerCase();

  const action: 'create' | 'modify' | 'optimize' | 'simulate' =
    lowerInput.includes('create') || lowerInput.includes('build') || lowerInput.includes('schedule') ? 'create' :
    lowerInput.includes('modify') || lowerInput.includes('change') || lowerInput.includes('adjust') ? 'modify' :
    lowerInput.includes('optimize') || lowerInput.includes('improve') ? 'optimize' :
    'simulate';

  const constraints: string[] = [];
  const goals: string[] = [];

  if (lowerInput.includes('holiday')) constraints.push('seasonal:holiday');
  if (lowerInput.includes('family')) constraints.push('audience:families');
  if (lowerInput.includes('pg')) constraints.push('rating:TV-PG');
  if (lowerInput.includes('morning')) constraints.push('time:morning');
  if (lowerInput.includes('prime time') || lowerInput.includes('primetime')) constraints.push('time:primetime');

  if (lowerInput.includes('retention')) goals.push('maximize:retention');
  if (lowerInput.includes('watch time')) goals.push('maximize:watch_time');
  if (lowerInput.includes('ad')) goals.push('maximize:ad_revenue');

  return {
    raw: input,
    parsed: {
      action,
      constraints,
      goals,
    },
    confidence: 0.87,
  };
}

export function generateRetentionForecast(): import('../types').RetentionForecast[] {
  const forecast: import('../types').RetentionForecast[] = [];
  const hours = ['06:00', '08:00', '10:00', '12:00', '14:00', '16:00', '18:00', '20:00', '22:00'];

  let baseViewers = 180000;
  for (let i = 0; i < hours.length; i++) {
    const hour = parseInt(hours[i].split(':')[0]);

    if (hour >= 6 && hour < 9) baseViewers = 180000 + Math.random() * 50000;
    else if (hour >= 9 && hour < 12) baseViewers = 240000 + Math.random() * 40000;
    else if (hour >= 12 && hour < 15) baseViewers = 320000 + Math.random() * 60000;
    else if (hour >= 15 && hour < 18) baseViewers = 380000 + Math.random() * 80000;
    else if (hour >= 18 && hour < 21) baseViewers = 450000 + Math.random() * 100000;
    else baseViewers = 320000 + Math.random() * 50000;

    forecast.push({
      timeRange: `${hours[i]}-${hours[Math.min(i + 1, hours.length - 1)]}`,
      predictedViewers: Math.round(baseViewers),
      predictedRetention: 72 + Math.random() * 15,
      confidence: 0.82 + Math.random() * 0.12,
      lowerBound: Math.round(baseViewers * 0.92),
      upperBound: Math.round(baseViewers * 1.08),
    });
  }

  return forecast;
}
