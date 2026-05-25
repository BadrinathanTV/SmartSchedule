import { Plus, RefreshCw, Edit, Info, Sparkles, AlertTriangle, AlertCircle, CheckCircle, X } from 'lucide-react';
import type { Content, NLIntent, ScheduleSlot, WeekSchedule } from '../types';

export type ScheduleViewMode = 'day' | 'week';

export type SchedulerSummary = {
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

type ManualScheduleData = {
  contentId: string;
  day: string;
  startTime: string;
  scheduleType: 'program' | 'live';
  liveTitle: string;
  liveDescription: string;
};

type EditedSlotData = {
  contentId: string;
  startTime: string;
  endTime: string;
};

type ScheduleBuilderProps = {
  uploadedProgramCatalog: Content[];
  scheduleData: WeekSchedule[];
  selectedDayIndex: number;
  onSelectedDayIndexChange: (index: number) => void;
  scheduleViewMode: ScheduleViewMode;
  onScheduleViewModeChange: (mode: ScheduleViewMode) => void;
  nlInput: string;
  onNlInputChange: (value: string) => void;
  onGenerateIntent: () => void;
  parsedIntent: NLIntent | null;
  onRunScheduler: () => void;
  isOptimizingSchedule: boolean;
  schedulerSummary: SchedulerSummary | null;
  formatTime: (value: string) => string;
  getStatusIcon: (status: ScheduleSlot['status']) => JSX.Element;
  getTransitionColor: (risk: ScheduleSlot['transitionRisk']) => string;
  onSlotEdit: (slot: ScheduleSlot) => void;
  showEditWarning: boolean;
  editingSlot: ScheduleSlot | null;
  onCancelEdit: () => void;
  onConfirmEdit: () => void;
  showEditPanel: boolean;
  editedSlotData: EditedSlotData | null;
  onCloseEditPanel: () => void;
  onEditedSlotDataChange: (next: EditedSlotData) => void;
  onSaveSlotEdit: () => void;
  showManualScheduleModal: boolean;
  onOpenManualScheduleModal: () => void;
  onCloseManualScheduleModal: () => void;
  manualScheduleData: ManualScheduleData;
  onManualScheduleDataChange: (next: ManualScheduleData) => void;
  onManualScheduleSubmit: () => void;
};

const buildContentMap = (programs: Content[]) => new Map(programs.map(program => [program.id, program] as const));

export function ScheduleBuilder({
  uploadedProgramCatalog,
  scheduleData,
  selectedDayIndex,
  onSelectedDayIndexChange,
  scheduleViewMode,
  onScheduleViewModeChange,
  nlInput,
  onNlInputChange,
  onGenerateIntent,
  parsedIntent,
  onRunScheduler,
  isOptimizingSchedule,
  schedulerSummary,
  formatTime,
  getStatusIcon,
  getTransitionColor,
  onSlotEdit,
  showEditWarning,
  editingSlot,
  onCancelEdit,
  onConfirmEdit,
  showEditPanel,
  editedSlotData,
  onCloseEditPanel,
  onEditedSlotDataChange,
  onSaveSlotEdit,
  showManualScheduleModal,
  onOpenManualScheduleModal,
  onCloseManualScheduleModal,
  manualScheduleData,
  onManualScheduleDataChange,
  onManualScheduleSubmit,
}: ScheduleBuilderProps) {
  const contentMap = buildContentMap(uploadedProgramCatalog);
  const visibleScheduleData = scheduleViewMode === 'day'
    ? [scheduleData[selectedDayIndex]].filter(Boolean)
    : scheduleData;
  const activeDay = scheduleData[selectedDayIndex];
  const canSubmitManualSchedule = manualScheduleData.scheduleType === 'program'
    ? Boolean(manualScheduleData.contentId)
    : Boolean(manualScheduleData.liveTitle.trim());

  return (
    <>
      <div className="space-y-4 max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            {(['day', 'week'] as ScheduleViewMode[]).map(mode => (
              <button
                key={mode}
                onClick={() => onScheduleViewModeChange(mode)}
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

          <div className="flex items-center w-full sm:w-auto gap-2">
            <div className="relative flex-1 sm:w-80">
              <Sparkles className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-cyan-400" />
              <input
                type="text"
                placeholder="Schedule holiday content for evening..."
                value={nlInput}
                onChange={(event) => onNlInputChange(event.target.value)}
                onKeyDown={(event) => event.key === 'Enter' && onGenerateIntent()}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-10 pr-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
              />
            </div>
            <button
              onClick={onGenerateIntent}
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
              {parsedIntent.parsed.constraints.map((constraint, index) => (
                <span key={index} className="px-2 py-1 bg-amber-500/20 text-amber-400 rounded">{constraint}</span>
              ))}
            </div>
            <span className="text-emerald-400 ml-auto">Confidence: {(parsedIntent.confidence * 100).toFixed(0)}%</span>
          </div>
        )}

        {uploadedProgramCatalog.length > 0 ? (
          <>
            {scheduleViewMode === 'week' ? (
              <div className="flex gap-2 overflow-x-auto pb-2">
                {scheduleData.map((day, index) => (
                  <button
                    key={day.date}
                    onClick={() => onSelectedDayIndexChange(index)}
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
                      {day.conflicts > 0 && <span className="text-xs text-rose-400">{day.conflicts} conflicts</span>}
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="flex items-center justify-between gap-3 rounded-lg border border-cyan-500/30 bg-cyan-500/10 px-4 py-3">
                <div>
                  <p className="text-sm font-medium text-cyan-300">Single Day View</p>
                  <p className="text-xs text-cyan-100/80">Showing only {activeDay.day} · {activeDay.date}</p>
                </div>
                <button
                  onClick={() => onSelectedDayIndexChange(selectedDayIndex)}
                  className="text-xs font-medium text-cyan-200 hover:text-white"
                >
                  Refresh day
                </button>
              </div>
            )}

            <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-semibold text-slate-200">
                  {activeDay.day} - {activeDay.date}
                </h3>
                <div className="flex items-center gap-2">
                  <button
                    onClick={onOpenManualScheduleModal}
                    className="flex items-center gap-2 px-3 py-1.5 bg-cyan-600 text-white rounded-lg text-xs font-medium hover:bg-cyan-500 transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Manual Schedule
                  </button>
                  <button
                    onClick={onRunScheduler}
                    disabled={isOptimizingSchedule}
                    className="flex items-center gap-2 px-3 py-1.5 bg-slate-700 text-slate-300 rounded-lg text-xs font-medium hover:bg-slate-600 transition-colors disabled:opacity-60"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isOptimizingSchedule ? 'animate-spin' : ''}`} />
                    {isOptimizingSchedule ? 'Optimizing...' : 'Intelligent Schedule'}
                  </button>
                </div>
              </div>

              <div className="space-y-3">
                {visibleScheduleData[0]?.slots.map((slot) => {
                  const content = contentMap.get(slot.contentId);
                  return (
                    <div key={slot.id}>
                      <div className="bg-slate-700/30 rounded-lg p-3 lg:p-4 border border-slate-600/30 hover:border-slate-500/50 transition-colors">
                        <div className="flex items-center gap-3 lg:gap-4 flex-wrap">
                          <div className="w-16 lg:w-20 flex-shrink-0">
                            <p className="text-sm font-mono font-medium text-slate-200">{formatTime(slot.startTime)}</p>
                            <p className="text-xs text-slate-500">{formatTime(slot.endTime)}</p>
                          </div>

                          <div className="flex items-center gap-2">
                            {getStatusIcon(slot.status)}
                            <div className={`w-1.5 h-10 rounded-full ${getTransitionColor(slot.transitionRisk)}`} />
                          </div>

                          <div className="flex-1 min-w-[150px]">
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="text-sm lg:text-base font-medium text-slate-100">
                                {slot.displayTitle || content?.title || 'Live Stream'}
                              </p>
                              {slot.scheduleType === 'live' && (
                                <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 uppercase tracking-wide">
                                  Live
                                </span>
                              )}
                              <span className={`text-xs px-2 py-0.5 rounded ${
                                slot.scheduleType === 'live' ? 'bg-cyan-500/20 text-cyan-300' :
                                content?.rating?.includes('G') ? 'bg-emerald-500/20 text-emerald-400' :
                                content?.rating?.includes('PG') ? 'bg-amber-500/20 text-amber-400' :
                                'bg-rose-500/20 text-rose-400'
                              }`}>
                                {slot.scheduleType === 'live' ? 'LIVE' : content?.rating}
                              </span>
                              <span className="text-xs text-slate-400">{slot.scheduleType === 'live' ? 'Live' : `${content?.duration}m`}</span>
                            </div>
                            <div className="flex items-center gap-3 mt-1 text-xs text-slate-400">
                              <span>{slot.scheduleType === 'live' ? 'Live Streaming' : content?.genre.join(', ')}</span>
                              <span className="hidden sm:inline">•</span>
                              <span className="hidden sm:inline">{slot.scheduleType === 'live' ? 'Immediate' : `${slot.adBreaks.length} ad breaks`}</span>
                            </div>
                          </div>

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

                          <button
                            onClick={() => onSlotEdit(slot)}
                            className="p-2 rounded-lg bg-slate-600/50 hover:bg-slate-500 transition-colors flex-shrink-0"
                          >
                            <Edit className="w-4 h-4 text-slate-300" />
                          </button>
                        </div>

                        <div className="mt-3 pt-3 border-t border-slate-600/30 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                          <div>
                            <p className="text-slate-400">Avg Watch Duration</p>
                            <p className="text-slate-200 font-medium">{content?.avgWatchDuration || Math.ceil((content?.duration || 60) * 0.7)}m</p>
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

            {schedulerSummary && (
              <div className="bg-cyan-500/10 border border-cyan-500/20 rounded-xl p-4 lg:p-5 space-y-4">
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <div>
                    <p className="text-xs uppercase tracking-wide text-cyan-300 font-medium">PPO Scheduler</p>
                    <h3 className="text-lg font-semibold text-slate-100">Optimized schedule for {schedulerSummary.scope}</h3>
                  </div>
                  <span className="text-xs px-2 py-1 rounded-full bg-cyan-500/20 text-cyan-300">{schedulerSummary.epochs} policy epochs</span>
                </div>

                <div className="grid grid-cols-2 lg:grid-cols-6 gap-3 text-xs">
                  <div className="bg-slate-900/30 rounded-lg p-3 border border-slate-700/40">
                    <p className="text-slate-400">Reward</p>
                    <p className="text-slate-100 mt-1 font-semibold">{schedulerSummary.reward}</p>
                  </div>
                  <div className="bg-slate-900/30 rounded-lg p-3 border border-slate-700/40">
                    <p className="text-slate-400">Retention</p>
                    <p className="text-slate-100 mt-1 font-semibold">{schedulerSummary.retention}%</p>
                  </div>
                  <div className="bg-slate-900/30 rounded-lg p-3 border border-slate-700/40">
                    <p className="text-slate-400">Watch Time</p>
                    <p className="text-slate-100 mt-1 font-semibold">{schedulerSummary.watchTime}m</p>
                  </div>
                  <div className="bg-slate-900/30 rounded-lg p-3 border border-slate-700/40">
                    <p className="text-slate-400">Engagement</p>
                    <p className="text-slate-100 mt-1 font-semibold">{schedulerSummary.engagement}</p>
                  </div>
                  <div className="bg-slate-900/30 rounded-lg p-3 border border-slate-700/40">
                    <p className="text-slate-400">Ad Revenue</p>
                    <p className="text-slate-100 mt-1 font-semibold">{schedulerSummary.adRevenue}</p>
                  </div>
                  <div className="bg-slate-900/30 rounded-lg p-3 border border-slate-700/40">
                    <p className="text-slate-400">Diversity / Novelty</p>
                    <p className="text-slate-100 mt-1 font-semibold">{schedulerSummary.diversity}% / {schedulerSummary.novelty}%</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 text-xs">
                  <div className="bg-slate-900/30 rounded-lg p-3 border border-slate-700/40">
                    <p className="text-slate-400 mb-2">Constraints applied</p>
                    <div className="flex flex-wrap gap-2">
                      {schedulerSummary.appliedConstraints.length > 0 ? schedulerSummary.appliedConstraints.map(item => (
                        <span key={item} className="px-2 py-1 rounded bg-slate-700 text-slate-200">{item}</span>
                      )) : (
                        <span className="text-slate-500">No hard constraint violations.</span>
                      )}
                    </div>
                  </div>
                  <div className="bg-slate-900/30 rounded-lg p-3 border border-slate-700/40">
                    <p className="text-slate-400 mb-2">Recommendations</p>
                    <div className="space-y-2">
                      {schedulerSummary.recommendations.length > 0 ? schedulerSummary.recommendations.slice(0, 3).map(item => (
                        <p key={item} className="text-slate-200">{item}</p>
                      )) : (
                        <p className="text-slate-500">The current mix is balanced for the selected scope.</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 p-6 text-center space-y-3">
            <p className="text-lg font-semibold text-slate-100">Upload media to build the schedule</p>
            <p className="text-sm text-slate-400">The schedule builder only uses programs that already exist in Media Upload.</p>
          </div>
        )}
      </div>

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
              <p className="text-sm text-slate-300 mb-4">You are about to manually modify an auto-optimized schedule slot. This change may:</p>
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
              <p className="text-xs text-slate-400">Editing slot: <span className="text-cyan-400">{editingSlot.id}</span></p>
            </div>
            <div className="p-4 border-t border-slate-700 flex justify-end gap-3">
              <button onClick={onCancelEdit} className="px-4 py-2 bg-slate-700 text-slate-300 rounded-lg text-sm font-medium hover:bg-slate-600">Cancel</button>
              <button onClick={onConfirmEdit} className="px-4 py-2 bg-amber-600 text-white rounded-lg text-sm font-medium hover:bg-amber-500">Proceed Anyway</button>
            </div>
          </div>
        </div>
      )}

      {showEditPanel && editingSlot && editedSlotData && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-xl border border-cyan-500/30 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b border-slate-700">
              <div className="flex items-center gap-3">
                <Edit className="w-5 h-5 text-cyan-400" />
                <h3 className="text-lg font-semibold text-slate-100">Edit Schedule Slot</h3>
                {editingSlot.isEdited && <span className="text-xs px-2 py-1 bg-amber-500/20 text-amber-400 rounded border border-amber-500/30">Manually Modified</span>}
              </div>
              <button onClick={onCloseEditPanel} className="p-2 hover:bg-slate-700 rounded-lg">
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>
            <div className="p-4 space-y-4">
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

              <div className="bg-slate-700/30 rounded-lg p-4 border border-slate-600/30">
                <p className="text-xs text-slate-400 mb-4 font-medium">Modify Schedule Settings</p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="text-xs text-slate-400 mb-1 block">Content / Program</label>
                    <select
                      value={editedSlotData.contentId}
                      onChange={(event) => {
                        const nextContent = contentMap.get(event.currentTarget.value);
                        const endHour = parseInt(editedSlotData.startTime.split(':')[0]) + Math.ceil((nextContent?.duration || 60) / 60);
                        onEditedSlotDataChange({
                          ...editedSlotData,
                          contentId: event.currentTarget.value,
                          endTime: `${endHour.toString().padStart(2, '0')}:00`,
                        });
                      }}
                      className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm text-slate-200"
                    >
                      {uploadedProgramCatalog.map(content => (
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
                      onChange={(event) => {
                        const nextContent = contentMap.get(editedSlotData.contentId);
                        const startHour = parseInt(event.currentTarget.value.split(':')[0]);
                        const endHour = startHour + Math.ceil((nextContent?.duration || 60) / 60);
                        onEditedSlotDataChange({
                          ...editedSlotData,
                          startTime: event.currentTarget.value,
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

              <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-amber-400 mb-1">Changes Impact Notice</p>
                    <p className="text-xs text-slate-300">Manual modifications will be flagged and may affect AI predictions. The schedule optimizer will recalculate adjacent retention scores and transition risks.</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="p-4 border-t border-slate-700 flex justify-between">
              <button onClick={onCloseEditPanel} className="px-4 py-2 bg-slate-700 text-slate-300 rounded-lg text-sm font-medium hover:bg-slate-600">Cancel Changes</button>
              <button onClick={onSaveSlotEdit} className="flex items-center gap-2 px-4 py-2 bg-cyan-600 text-white rounded-lg text-sm font-medium hover:bg-cyan-500">
                <CheckCircle className="w-4 h-4" />
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {showManualScheduleModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-xl border border-cyan-500/30 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b border-slate-700">
              <div className="flex items-center gap-3">
                <Plus className="w-5 h-5 text-cyan-400" />
                <h3 className="text-lg font-semibold text-slate-100">Schedule New Program</h3>
              </div>
              <button onClick={onCloseManualScheduleModal} className="p-2 hover:bg-slate-700 rounded-lg">
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Select Program</label>
                <select
                  value={manualScheduleData.contentId}
                  onChange={(event) => onManualScheduleDataChange({ ...manualScheduleData, contentId: event.currentTarget.value })}
                  disabled={manualScheduleData.scheduleType === 'live'}
                  className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm text-slate-200 disabled:opacity-60"
                >
                  <option value="">-- Select a program --</option>
                  {uploadedProgramCatalog.map(content => (
                    <option key={content.id} value={content.id}>
                      {content.title} ({content.duration}m | {content.genre[0]})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Schedule Type</label>
                <select
                  value={manualScheduleData.scheduleType}
                  onChange={(event) => onManualScheduleDataChange({
                    ...manualScheduleData,
                    scheduleType: event.currentTarget.value as ManualScheduleData['scheduleType'],
                    contentId: event.currentTarget.value === 'live' ? '' : manualScheduleData.contentId,
                  })}
                  className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm text-slate-200"
                >
                  <option value="program">Program</option>
                  <option value="live">Live Streaming</option>
                </select>
              </div>
              {manualScheduleData.scheduleType === 'live' && (
                <div>
                  <label className="text-xs text-slate-400 mb-1 block">Live Title</label>
                  <input
                    type="text"
                    value={manualScheduleData.liveTitle}
                    onChange={(event) => onManualScheduleDataChange({ ...manualScheduleData, liveTitle: event.currentTarget.value })}
                    className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm text-slate-200"
                    placeholder="Live Stream"
                  />
                </div>
              )}
              {manualScheduleData.scheduleType === 'live' && (
                <div>
                  <label className="text-xs text-slate-400 mb-1 block">Live Description</label>
                  <textarea
                    value={manualScheduleData.liveDescription}
                    onChange={(event) => onManualScheduleDataChange({ ...manualScheduleData, liveDescription: event.currentTarget.value })}
                    className="w-full min-h-[96px] bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm text-slate-200"
                    placeholder="Describe the live session, guests, topics, or audience interaction."
                  />
                </div>
              )}
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Schedule Date</label>
                <select
                  value={manualScheduleData.day}
                  onChange={(event) => onManualScheduleDataChange({ ...manualScheduleData, day: event.currentTarget.value })}
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
                  onChange={(event) => onManualScheduleDataChange({ ...manualScheduleData, startTime: event.currentTarget.value })}
                  className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm text-slate-200"
                />
              </div>

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
                        <p className="text-xs text-slate-400">{formatTime(manualScheduleData.startTime)} - {formatTime(`${endHour.toString().padStart(2, '0')}:00`)}</p>
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

              {manualScheduleData.scheduleType === 'live' && (
                <div className="bg-cyan-500/10 rounded-lg p-4 border border-cyan-500/30">
                  <p className="text-xs text-cyan-400 mb-3 font-medium uppercase tracking-wide">Live Preview</p>
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-slate-200">{manualScheduleData.liveTitle || 'Live Stream'}</p>
                    <p className="text-xs text-slate-400">{formatTime(manualScheduleData.startTime)} - Live</p>
                    <div className="text-xs text-slate-300">{manualScheduleData.liveDescription || 'This will appear immediately as a live slot when added.'}</div>
                  </div>
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
              <button onClick={onCloseManualScheduleModal} className="px-4 py-2 bg-slate-700 text-slate-300 rounded-lg text-sm font-medium hover:bg-slate-600">Cancel</button>
              <button
                onClick={onManualScheduleSubmit}
                disabled={!canSubmitManualSchedule}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium ${
                  canSubmitManualSchedule
                    ? 'bg-cyan-600 text-white hover:bg-cyan-500'
                    : 'bg-slate-600 text-slate-400 cursor-not-allowed'
                }`}
              >
                <Plus className="w-4 h-4" />
                {manualScheduleData.scheduleType === 'live' ? 'Add Live Stream' : 'Add to Schedule'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
