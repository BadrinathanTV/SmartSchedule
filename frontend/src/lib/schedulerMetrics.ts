import type { Content, MediaUpload, RetentionForecast, TransitionScore, ViewerBehavior } from '../types';

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

const normalize = (value: string) => value.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();

const average = (values: number[]) => values.reduce((sum, value) => sum + value, 0) / Math.max(1, values.length);

const jaccardSimilarity = (left: string[], right: string[]) => {
  const leftSet = new Set(left.map(normalize).filter(Boolean));
  const rightSet = new Set(right.map(normalize).filter(Boolean));
  const union = new Set([...leftSet, ...rightSet]);
  if (union.size === 0) return 0;
  let intersection = 0;
  leftSet.forEach(value => {
    if (rightSet.has(value)) {
      intersection += 1;
    }
  });
  return intersection / union.size;
};

const parseHour = (value: string) => {
  const match = value.match(/(\d{1,2}):(\d{2})/);
  if (!match) return null;
  const hour = Number(match[1]);
  if (!Number.isFinite(hour)) return null;
  return ((hour % 24) + 24) % 24;
};

const parseMinuteOffset = (value: string) => {
  const match = value.match(/(\d{1,2}):(\d{2})/);
  if (!match) return null;
  const hour = Number(match[1]);
  const minute = Number(match[2]);
  if (!Number.isFinite(hour) || !Number.isFinite(minute)) return null;
  return (hour * 60) + minute;
};

const countValues = (values: string[]) => values.reduce((accumulator, value) => {
  const key = value.trim();
  if (!key) return accumulator;
  accumulator[key] = (accumulator[key] || 0) + 1;
  return accumulator;
}, {} as Record<string, number>);

const deriveRetentionPercent = (curve: number[] | undefined, fallback: number) => {
  if (!curve || curve.length === 0) {
    return fallback;
  }
  const normalized = curve.map(point => (point > 1 ? point : point * 100));
  return average(normalized);
};

export const buildViewerBehaviorMap = (mediaUploads: MediaUpload[]) => {
  const map = new Map<string, ViewerBehavior>();

  mediaUploads.forEach(media => {
    const analytics = media.analyticsData;
    if (!analytics) return;

    const retentionCurve = analytics.audience_retention_curve.length > 0
      ? analytics.audience_retention_curve.map(point => (point > 1 ? point / 100 : point))
      : [Math.max(0.1, Math.min(1, analytics.average_watch_duration_minutes / Math.max(1, media.duration / 60)))];

    map.set(media.id, {
      contentId: media.id,
      avgWatchDuration: analytics.average_watch_duration_minutes,
      peakConcurrency: analytics.concurrent_viewers,
      entryPoint: parseMinuteOffset(analytics.start_time) ?? 0,
      exitPoints: analytics.drop_off_timestamps.map(parseMinuteOffset).filter((point): point is number => point !== null),
      retentionCurve,
      deviceTypes: analytics.device_types,
      geographicDistribution: analytics.geographic_regions,
      switchToChannels: countValues(analytics.viewer_behavior.entry_points),
      switchFromChannels: countValues(analytics.viewer_behavior.exit_points),
    });
  });

  return map;
};

export const buildRetentionForecast = (mediaUploads: MediaUpload[]): RetentionForecast[] => {
  const buckets = new Map<number, { viewers: number[]; retention: number[]; confidence: number[] }>();

  mediaUploads.forEach(media => {
    const analytics = media.analyticsData;
    if (!analytics) return;

    const hour = parseHour(analytics.start_time);
    if (hour === null) return;

    const retentionPercent = deriveRetentionPercent(
      analytics.audience_retention_curve,
      analytics.average_watch_duration_minutes > 0 && media.duration > 0
        ? clamp((analytics.average_watch_duration_minutes / (media.duration / 60)) * 100, 0, 100)
        : 0,
    );
    const confidence = clamp(0.6 + (analytics.audience_retention_curve.length * 0.04) + (analytics.interactive_ctr * 0.5), 0.55, 0.98);

    const bucket = buckets.get(hour) || { viewers: [], retention: [], confidence: [] };
    bucket.viewers.push(analytics.concurrent_viewers);
    bucket.retention.push(retentionPercent);
    bucket.confidence.push(confidence);
    buckets.set(hour, bucket);
  });

  return [...buckets.entries()]
    .sort(([leftHour], [rightHour]) => leftHour - rightHour)
    .map(([hour, bucket]) => {
      const predictedViewers = Math.round(average(bucket.viewers));
      const predictedRetention = average(bucket.retention);
      const confidence = average(bucket.confidence);
      return {
        timeRange: `${String(hour).padStart(2, '0')}:00-${String((hour + 1) % 24).padStart(2, '0')}:00`,
        predictedViewers,
        predictedRetention,
        confidence,
        lowerBound: Math.round(predictedViewers * 0.9),
        upperBound: Math.round(predictedViewers * 1.1),
      };
    });
};

const buildTransitionScore = (from: Content, to: Content, fromMedia?: MediaUpload, toMedia?: MediaUpload): TransitionScore => {
  const genreSimilarity = jaccardSimilarity(from.genre, to.genre);
  const moodSimilarity = jaccardSimilarity(from.mood, to.mood);
  const audienceSimilarity = jaccardSimilarity(from.targetAudience, to.targetAudience);
  const seasonalSimilarity = jaccardSimilarity(from.seasonalTags, to.seasonalTags);
  const durationSimilarity = 1 - Math.min(1, Math.abs(from.duration - to.duration) / Math.max(from.duration, to.duration, 1));
  const completionSimilarity = 1 - Math.min(1, Math.abs(from.completionRate - to.completionRate) / 100);

  const fromAnalytics = fromMedia?.analyticsData;
  const toAnalytics = toMedia?.analyticsData;
  const watchSimilarity = fromAnalytics && toAnalytics
    ? 1 - Math.min(1, Math.abs(fromAnalytics.average_watch_duration_minutes - toAnalytics.average_watch_duration_minutes) / Math.max(fromAnalytics.average_watch_duration_minutes, toAnalytics.average_watch_duration_minutes, 1))
    : completionSimilarity;
  const viewerSimilarity = fromAnalytics && toAnalytics
    ? 1 - Math.min(1, Math.abs(fromAnalytics.concurrent_viewers - toAnalytics.concurrent_viewers) / Math.max(fromAnalytics.concurrent_viewers, toAnalytics.concurrent_viewers, 1))
    : completionSimilarity;

  const score = clamp(
    (genreSimilarity * 0.28)
    + (moodSimilarity * 0.16)
    + (audienceSimilarity * 0.16)
    + (seasonalSimilarity * 0.1)
    + (durationSimilarity * 0.1)
    + (completionSimilarity * 0.1)
    + (watchSimilarity * 0.05)
    + (viewerSimilarity * 0.05),
    0.2,
    0.99,
  );

  const reasons = [
    genreSimilarity > 0 ? `Genre overlap ${Math.round(genreSimilarity * 100)}%` : null,
    moodSimilarity > 0 ? `Mood overlap ${Math.round(moodSimilarity * 100)}%` : null,
    audienceSimilarity > 0 ? `Audience overlap ${Math.round(audienceSimilarity * 100)}%` : null,
    fromAnalytics && toAnalytics ? `Watch duration similarity ${Math.round(watchSimilarity * 100)}%` : null,
  ].filter((reason): reason is string => Boolean(reason));

  return {
    fromContentId: from.id,
    toContentId: to.id,
    score,
    predictedRetention: Math.round(score * 100),
    predictedSwitching: Math.round((1 - score) * 100),
    reasons: reasons.length > 0 ? reasons : ['Derived from uploaded content metadata'],
  };
};

export const buildTransitionScoreMap = (programs: Content[], mediaUploads: MediaUpload[]) => {
  const mediaById = new Map(mediaUploads.map(media => [media.id, media] as const));
  const map = new Map<string, TransitionScore>();

  programs.forEach(from => {
    programs.forEach(to => {
      if (from.id === to.id) return;
      const transition = buildTransitionScore(from, to, mediaById.get(from.id), mediaById.get(to.id));
      map.set(`${from.id}->${to.id}`, transition);
    });
  });

  return map;
};