from __future__ import annotations

from typing import List, Optional, Dict
from pydantic import BaseModel, Field


class Content(BaseModel):
    id: str
    title: str
    type: str
    genre: List[str]
    subgenre: List[str]
    mood: List[str]
    rating: str
    duration: int
    description: str
    embedding: List[float]
    rightsStart: str
    rightsEnd: str
    regions: List[str]
    seasonalTags: List[str]
    targetAudience: List[str]
    adBreakCount: int
    completionRate: float
    avgWatchDuration: int
    thumbnailUrl: Optional[str] = None
    status: Optional[str] = None
    uploadDate: Optional[str] = None
    fileSize: Optional[int] = None
    transcodingStatus: Optional[str] = None


class ContentUpdate(BaseModel):
    title: Optional[str] = None
    type: Optional[str] = None
    genre: Optional[List[str]] = None
    subgenre: Optional[List[str]] = None
    mood: Optional[List[str]] = None
    rating: Optional[str] = None
    duration: Optional[int] = None
    description: Optional[str] = None
    embedding: Optional[List[float]] = None
    rightsStart: Optional[str] = None
    rightsEnd: Optional[str] = None
    regions: Optional[List[str]] = None
    seasonalTags: Optional[List[str]] = None
    targetAudience: Optional[List[str]] = None
    adBreakCount: Optional[int] = None
    completionRate: Optional[float] = None
    avgWatchDuration: Optional[int] = None
    thumbnailUrl: Optional[str] = None
    status: Optional[str] = None
    uploadDate: Optional[str] = None
    fileSize: Optional[int] = None
    transcodingStatus: Optional[str] = None


class AdBreak(BaseModel):
    id: str
    position: int
    duration: int
    predictedImpressions: int
    predictedCompletionRate: float
    type: str


class ScheduleSlot(BaseModel):
    id: str
    contentId: str
    startTime: str
    endTime: str
    predictedRetention: float
    predictedDropoff: float
    confidence: float
    adBreaks: List[AdBreak]
    status: str
    transitionRisk: str
    day: str
    isEdited: Optional[bool] = None


class WeekSchedule(BaseModel):
    day: str
    date: str
    slots: List[ScheduleSlot]
    totalHours: int
    avgRetention: float
    conflicts: int


class ChannelConfig(BaseModel):
    id: str
    name: str
    targetAudience: str
    primaryGenre: str
    ratingLimit: str
    adLoadMinutes: int
    operatingHours: str
    logo: Optional[str] = None
    color: Optional[str] = None
    status: str
    viewerCount: Optional[int] = None
    retention: Optional[float] = None
    growth: Optional[float] = None


class TopProgram(BaseModel):
    id: str
    title: str
    rating: float
    viewers: int
    retention: float
    genre: str
    airTime: str


class ChannelMetrics(BaseModel):
    channelId: str
    topPrograms: List[TopProgram]
    peakTime: str
    audienceCount: int
    adWatchTime: int
    weeklyRetention: float
    weeklyGrowth: float
    avgViewDuration: int
    topGenre: str
    topRegion: str
    completionRate: float


class MediaMetadata(BaseModel):
    description: str
    genre: List[str]
    rating: str
    transcription: Optional[str] = None
    targetAudience: List[str]
    rightsStart: Optional[str] = None
    rightsEnd: Optional[str] = None
    regions: List[str]
    tags: List[str]


class MediaUpload(BaseModel):
    id: str
    title: str
    fileName: str
    fileSize: int
    duration: int
    status: str
    uploadProgress: int
    transcodingProgress: int
    metadata: MediaMetadata
    uploadedAt: str
    channelId: Optional[str] = None
    thumbnailUrl: Optional[str] = None
    transcription: Optional[str] = None
    transcriptionSource: Optional[str] = None
    analyticsData: Optional[Dict[str, object]] = None


class SelfHealingLog(BaseModel):
    id: str
    timestamp: str
    originalContentId: str
    originalTitle: str
    replacementContentId: str
    replacementTitle: str
    similarityScore: float
    reason: str
    status: str


class TransitionHotspot(BaseModel):
    slotId: str
    contentTitle: str
    timeRange: str
    risk: str
    predictedDropoff: float
    suggestedFix: str


class SimulationResult(BaseModel):
    scheduleId: str
    predictedRetention: float
    predictedExits: float
    predictedAdRevenue: float
    transitionHotpots: List[TransitionHotspot]
    optimizationSuggestions: List[str]
    comparisonBaseline: Optional["SimulationResult"] = None


class NLIntent(BaseModel):
    raw: str
    parsed: Dict[str, object]
    confidence: float


class DailyAnalytics(BaseModel):
    id: str
    channel_id: str
    date: str
    total_viewers: int
    avg_retention: float
    total_watch_time_hours: float
    ad_impressions: int
    ad_revenue: float
    unique_viewers: int
    peak_concurrent_viewers: int


class MonthlySummary(BaseModel):
    id: str
    channel_id: str
    month: str
    total_revenue: float
    total_viewers: int
    avg_retention: float
    growth_percentage: float


class UserProfile(BaseModel):
    id: str
    email: str
    full_name: str
    role: str
    avatar_url: Optional[str] = None
    assigned_channels: List[str]
    is_active: bool
    created_at: str
    last_login: Optional[str] = None


class IntentRequest(BaseModel):
    text: str = Field(..., min_length=1)


class SimulationRequest(BaseModel):
    scheduleId: str
    slots: List[ScheduleSlot]


class SelfHealRequest(BaseModel):
    contentId: str
    constraints: Optional[Dict[str, object]] = None


class MediaCreateRequest(BaseModel):
    title: str
    fileName: str
    fileSize: int
    duration: int
    metadata: MediaMetadata
    channelId: Optional[str] = None


class MediaUpdateRequest(BaseModel):
    channelId: Optional[str] = None
    title: Optional[str] = None
    fileName: Optional[str] = None
    fileSize: Optional[int] = None
    duration: Optional[int] = None
    status: Optional[str] = None
    uploadProgress: Optional[int] = None
    transcodingProgress: Optional[int] = None
    metadata: Optional[MediaMetadata] = None
    uploadedAt: Optional[str] = None
    thumbnailUrl: Optional[str] = None
    transcription: Optional[str] = None
    transcriptionSource: Optional[str] = None
    analyticsData: Optional[Dict[str, object]] = None


class ProgramAnalyticsImportRequest(BaseModel):
    programs: List[Dict[str, object]]


class UserCreateRequest(BaseModel):
    email: str
    full_name: str
    role: str = "employee"
    assigned_channels: Optional[List[str]] = None


class UserUpdateRequest(BaseModel):
    full_name: Optional[str] = None
    role: Optional[str] = None
    assigned_channels: Optional[List[str]] = None
    is_active: Optional[bool] = None


class LoginRequest(BaseModel):
    email: str
    password: str


class SignupRequest(BaseModel):
    email: str
    password: str
    full_name: str
    role: str = "employee"
