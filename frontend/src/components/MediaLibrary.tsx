import { useRef } from 'react';
import { API_URL } from '../lib/api';
import type { ChannelConfig } from '../types';
import type { MediaUpload } from '../types';
import { Edit, Eye, FileVideo, Trash2, Upload, UploadCloud, X } from 'lucide-react';

type MediaUploadForm = {
  title: string;
  genre: string;
  rating: string;
  targetAudience: string;
  description: string;
  transcription: string;
  metadata: string;
};

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

type MediaLibraryProps = {
  mediaUploads: MediaUpload[];
  selectedMedia: MediaUpload | null;
  isEditingMedia: boolean;
  mediaEditForm: MediaEditForm | null;
  mediaEditError: string | null;
  showUploadModal: boolean;
  uploadSelections: Array<{ file: File; thumbnail: string | null }>;
  uploadError: string | null;
  uploadForm: MediaUploadForm;
  activeChannel: ChannelConfig;
  analyticsImportMessage: string | null;
  analyticsImportError: string | null;
  formatDuration: (value: number) => string;
  formatFileSize: (value: number) => string;
  onOpenUploadModal: () => void;
  onCloseUploadModal: () => void;
  onFileSelect: (files: FileList | File[] | null) => void;
  onUploadSubmit: () => void;
  onUploadFormChange: (next: MediaUploadForm) => void;
  onAnalyticsImport: (files: FileList | null) => void;
  onOpenMediaViewer: (media: MediaUpload) => void;
  onOpenMediaEditor: (media: MediaUpload) => void;
  onDeleteMedia: (mediaId: string) => void;
  onCloseMediaModal: () => void;
  onStartEditingMedia: () => void;
  onCancelMediaEdit: () => void;
  onSaveMediaEdits: () => void;
  onMediaEditFormChange: (next: MediaEditForm) => void;
};

export function MediaLibrary({
  mediaUploads,
  selectedMedia,
  isEditingMedia,
  mediaEditForm,
  mediaEditError,
  showUploadModal,
  uploadSelections,
  uploadError,
  uploadForm,
  activeChannel,
  analyticsImportMessage,
  analyticsImportError,
  formatDuration,
  formatFileSize,
  onOpenUploadModal,
  onCloseUploadModal,
  onFileSelect,
  onUploadSubmit,
  onUploadFormChange,
  onAnalyticsImport,
  onOpenMediaViewer,
  onOpenMediaEditor,
  onDeleteMedia,
  onCloseMediaModal,
  onStartEditingMedia,
  onCancelMediaEdit,
  onSaveMediaEdits,
  onMediaEditFormChange,
}: MediaLibraryProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const analyticsFileInputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="space-y-4 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-slate-100">Media Library</h2>
          <p className="text-sm text-slate-400">Upload, manage, and organize your video content</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => analyticsFileInputRef.current?.click()}
            className="flex items-center gap-2 px-4 py-2.5 bg-slate-700 text-slate-200 rounded-lg text-sm font-medium hover:bg-slate-600 transition-colors"
          >
            <Upload className="w-4 h-4" />
            User Analytics
          </button>
          <button
            onClick={onOpenUploadModal}
            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-cyan-600 to-blue-600 text-white rounded-lg text-sm font-medium"
          >
            <UploadCloud className="w-4 h-4" />
            Upload Video
          </button>
        </div>
      </div>

      <input
        ref={analyticsFileInputRef}
        type="file"
        accept="application/json,.json"
        className="hidden"
        onChange={(event) => {
          onAnalyticsImport(event.currentTarget.files);
          event.currentTarget.value = '';
        }}
      />

      {(analyticsImportMessage || analyticsImportError) && (
        <div className={`rounded-lg border px-4 py-3 text-sm ${analyticsImportError ? 'bg-rose-500/10 border-rose-500/30 text-rose-300' : 'bg-cyan-500/10 border-cyan-500/30 text-cyan-200'}`}>
          {analyticsImportError || analyticsImportMessage}
        </div>
      )}

      {showUploadModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-xl border border-slate-700 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b border-slate-700">
              <h3 className="text-lg font-semibold text-slate-100">Upload New Video</h3>
              <button onClick={onCloseUploadModal} className="p-2 hover:bg-slate-700 rounded-lg">
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>
            <div className="p-4 space-y-4">
              <div className="rounded-lg border border-cyan-500/20 bg-cyan-500/10 px-4 py-3 text-sm text-cyan-100">
                Uploading to <span className="font-semibold">{activeChannel.name}</span>
                <span className="text-cyan-200/80"> • {activeChannel.primaryGenre} • {activeChannel.targetAudience}</span>
              </div>
              <div
                className="border-2 border-dashed border-slate-600 rounded-xl p-6 text-center hover:border-cyan-500/50 transition-colors cursor-pointer"
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(event) => event.preventDefault()}
                onDrop={(event) => {
                  event.preventDefault();
                  onFileSelect(event.dataTransfer.files);
                }}
              >
                {uploadSelections.length > 0 ? (
                  <div className="space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {uploadSelections.map(({ file, thumbnail }) => (
                        <div key={file.name} className="rounded-lg overflow-hidden bg-slate-900/60">
                          {thumbnail ? (
                            <div className="relative w-full h-32">
                              <img src={thumbnail} alt={`${file.name} thumbnail`} className="w-full h-full object-cover" />
                              <div className="pointer-events-none absolute inset-0">
                                <div className="absolute inset-0 bg-gradient-to-tr from-white/10 via-transparent to-slate-900/60" />
                                <div className="absolute -left-1/3 top-0 h-full w-2/3 bg-white/10 rotate-[-12deg]" />
                              </div>
                            </div>
                          ) : (
                            <div className="h-32 flex items-center justify-center">
                              <FileVideo className="w-8 h-8 text-slate-600" />
                            </div>
                          )}
                          <p className="text-[10px] text-cyan-300 px-2 py-1 truncate">{file.name}</p>
                        </div>
                      ))}
                    </div>
                    <p className="text-xs text-cyan-400">Selected: {uploadSelections.length} file(s)</p>
                  </div>
                ) : (
                  <>
                    <UploadCloud className="w-12 h-12 text-slate-500 mx-auto mb-3" />
                    <p className="text-sm text-slate-400">Drag and drop video files here, or click to browse</p>
                    <p className="text-xs text-slate-500 mt-1">MP4, MOV, AVI up to 10GB</p>
                  </>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  className="hidden"
                  accept="video/*"
                  multiple
                  onChange={(event) => onFileSelect(event.currentTarget.files)}
                />
              </div>
              {uploadError && <div className="text-xs text-rose-400">{uploadError}</div>}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-slate-400 mb-1 block">Title</label>
                  <input
                    type="text"
                    value={uploadForm.title}
                    onChange={(event) => onUploadFormChange({ ...uploadForm, title: event.target.value })}
                    className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm text-slate-200"
                    placeholder="Video title"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400 mb-1 block">Genre</label>
                  <input
                    type="text"
                    value={uploadForm.genre}
                    onChange={(event) => onUploadFormChange({ ...uploadForm, genre: event.target.value })}
                    className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm text-slate-200"
                    placeholder="Documentary, Drama"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400 mb-1 block">Rating</label>
                  <select
                    value={uploadForm.rating}
                    onChange={(event) => onUploadFormChange({ ...uploadForm, rating: event.target.value })}
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
                    onChange={(event) => onUploadFormChange({ ...uploadForm, targetAudience: event.target.value })}
                    className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm text-slate-200"
                    placeholder="adults 25-54"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="text-xs text-slate-400 mb-1 block">Description</label>
                  <textarea
                    value={uploadForm.description}
                    onChange={(event) => onUploadFormChange({ ...uploadForm, description: event.target.value })}
                    className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm text-slate-200 h-20 resize-none"
                    placeholder="Video description..."
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="text-xs text-slate-400 mb-1 block">Transcription (Optional)</label>
                  <textarea
                    value={uploadForm.transcription}
                    onChange={(event) => onUploadFormChange({ ...uploadForm, transcription: event.target.value })}
                    className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm text-slate-200 h-20 resize-none"
                    placeholder="Paste or upload transcription..."
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="text-xs text-slate-400 mb-1 block">Metadata</label>
                  <textarea
                    value={uploadForm.metadata}
                    onChange={(event) => onUploadFormChange({ ...uploadForm, metadata: event.target.value })}
                    className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm text-slate-200 h-20 resize-none"
                    placeholder="Add metadata notes..."
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-700">
                <button onClick={onCloseUploadModal} className="px-4 py-2 bg-slate-700 text-slate-300 rounded-lg text-sm font-medium hover:bg-slate-600">Cancel</button>
                <button onClick={onUploadSubmit} className="px-4 py-2 bg-cyan-600 text-white rounded-lg text-sm font-medium hover:bg-cyan-500">Upload</button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {mediaUploads.map(media => (
          <div key={media.id} className="bg-slate-800/50 rounded-xl border border-slate-700/50 overflow-hidden hover:border-slate-600 transition-colors">
            <div className="aspect-video bg-slate-900 relative cursor-pointer" onClick={() => onOpenMediaViewer(media)}>
              {media.thumbnailUrl ? (
                <div className="absolute inset-0">
                  <img src={media.thumbnailUrl} alt={`${media.title} thumbnail`} className="w-full h-full object-cover" />
                  <div className="pointer-events-none absolute inset-0">
                    <div className="absolute inset-0 bg-gradient-to-tr from-white/10 via-transparent to-slate-900/60" />
                    <div className="absolute -left-1/3 top-0 h-full w-2/3 bg-white/10 rotate-[-12deg]" />
                  </div>
                </div>
              ) : (
                <div className="absolute inset-0 flex items-center justify-center">
                  <FileVideo className="w-12 h-12 text-slate-600" />
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900/50 via-transparent to-transparent" />
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
                  <button onClick={() => onOpenMediaViewer(media)} className="p-1.5 rounded-lg hover:bg-slate-700 transition-colors" title="View program details">
                    <Eye className="w-4 h-4 text-slate-400" />
                  </button>
                  <button onClick={() => onOpenMediaEditor(media)} className="p-1.5 rounded-lg hover:bg-slate-700 transition-colors" title="Edit program details">
                    <Edit className="w-4 h-4 text-slate-400" />
                  </button>
                  <button
                    onClick={() => onDeleteMedia(media.id)}
                    className="p-1.5 rounded-lg hover:bg-rose-500/20 transition-colors"
                    title="Delete program"
                  >
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

      {selectedMedia && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-xl border border-slate-700 w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b border-slate-700">
              <h3 className="text-lg font-semibold text-slate-100">{selectedMedia.title}</h3>
              <div className="flex items-center gap-2">
                {!isEditingMedia && (
                  <button onClick={onStartEditingMedia} className="px-3 py-2 text-sm rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-200">
                    Edit
                  </button>
                )}
                <button onClick={onCloseMediaModal} className="p-2 hover:bg-slate-700 rounded-lg" title="Close dialog">
                  <X className="w-5 h-5 text-slate-400" />
                </button>
              </div>
            </div>
            <div className="p-4 space-y-4">
              <div className="rounded-lg overflow-hidden bg-slate-900">
                {selectedMedia.status === 'ready' ? (
                  <video
                    controls
                    className="w-full h-full"
                    poster={selectedMedia.thumbnailUrl}
                    src={`${API_URL}/api/media/${selectedMedia.id}/file`}
                  />
                ) : (
                  <div className="aspect-video flex items-center justify-center text-sm text-slate-400">
                    Video available when processing completes.
                  </div>
                )}
              </div>

              {isEditingMedia && mediaEditForm ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-slate-700/30 rounded-lg p-3 space-y-2">
                      <label className="text-xs text-slate-400 block">Title</label>
                      <input value={mediaEditForm.title} onChange={(event) => onMediaEditFormChange({ ...mediaEditForm, title: event.target.value })} className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm text-slate-200" />
                    </div>
                    <div className="bg-slate-700/30 rounded-lg p-3 space-y-2">
                      <label className="text-xs text-slate-400 block">File Name</label>
                      <input value={mediaEditForm.fileName} onChange={(event) => onMediaEditFormChange({ ...mediaEditForm, fileName: event.target.value })} className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm text-slate-200" />
                    </div>
                    <div className="bg-slate-700/30 rounded-lg p-3 space-y-2">
                      <label className="text-xs text-slate-400 block">Duration</label>
                      <input type="number" value={mediaEditForm.duration} onChange={(event) => onMediaEditFormChange({ ...mediaEditForm, duration: event.target.value })} className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm text-slate-200" />
                    </div>
                    <div className="bg-slate-700/30 rounded-lg p-3 space-y-2">
                      <label className="text-xs text-slate-400 block">File Size</label>
                      <input type="number" value={mediaEditForm.fileSize} onChange={(event) => onMediaEditFormChange({ ...mediaEditForm, fileSize: event.target.value })} className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm text-slate-200" />
                    </div>
                    <div className="bg-slate-700/30 rounded-lg p-3 space-y-2">
                      <label className="text-xs text-slate-400 block">Status</label>
                      <select value={mediaEditForm.status} onChange={(event) => onMediaEditFormChange({ ...mediaEditForm, status: event.target.value as MediaUpload['status'] })} className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm text-slate-200">
                        <option value="uploading">uploading</option>
                        <option value="processing">processing</option>
                        <option value="ready">ready</option>
                        <option value="error">error</option>
                      </select>
                    </div>
                    <div className="bg-slate-700/30 rounded-lg p-3 space-y-2">
                      <label className="text-xs text-slate-400 block">Uploaded At</label>
                      <input type="datetime-local" value={mediaEditForm.uploadedAt} onChange={(event) => onMediaEditFormChange({ ...mediaEditForm, uploadedAt: event.target.value })} className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm text-slate-200" />
                    </div>
                    <div className="bg-slate-700/30 rounded-lg p-3 space-y-2">
                      <label className="text-xs text-slate-400 block">Upload Progress</label>
                      <input type="number" value={mediaEditForm.uploadProgress} onChange={(event) => onMediaEditFormChange({ ...mediaEditForm, uploadProgress: event.target.value })} className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm text-slate-200" />
                    </div>
                    <div className="bg-slate-700/30 rounded-lg p-3 space-y-2">
                      <label className="text-xs text-slate-400 block">Transcoding Progress</label>
                      <input type="number" value={mediaEditForm.transcodingProgress} onChange={(event) => onMediaEditFormChange({ ...mediaEditForm, transcodingProgress: event.target.value })} className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm text-slate-200" />
                    </div>
                    <div className="bg-slate-700/30 rounded-lg p-3 space-y-2">
                      <label className="text-xs text-slate-400 block">Thumbnail URL</label>
                      <input value={mediaEditForm.thumbnailUrl} onChange={(event) => onMediaEditFormChange({ ...mediaEditForm, thumbnailUrl: event.target.value })} className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm text-slate-200" />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-slate-700/30 rounded-lg p-3 space-y-2 md:col-span-2">
                      <label className="text-xs text-slate-400 block">Description</label>
                      <textarea value={mediaEditForm.description} onChange={(event) => onMediaEditFormChange({ ...mediaEditForm, description: event.target.value })} className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm text-slate-200 h-24 resize-none" />
                    </div>
                    <div className="bg-slate-700/30 rounded-lg p-3 space-y-2 md:col-span-2">
                      <label className="text-xs text-slate-400 block">Transcription</label>
                      <textarea value={mediaEditForm.transcription} onChange={(event) => onMediaEditFormChange({ ...mediaEditForm, transcription: event.target.value })} className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm text-slate-200 h-24 resize-none" />
                    </div>
                    <div className="bg-slate-700/30 rounded-lg p-3 space-y-2">
                      <label className="text-xs text-slate-400 block">Genre</label>
                      <textarea value={mediaEditForm.genre} onChange={(event) => onMediaEditFormChange({ ...mediaEditForm, genre: event.target.value })} className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm text-slate-200 h-24 resize-none" />
                    </div>
                    <div className="bg-slate-700/30 rounded-lg p-3 space-y-2">
                      <label className="text-xs text-slate-400 block">Rating</label>
                      <input value={mediaEditForm.rating} onChange={(event) => onMediaEditFormChange({ ...mediaEditForm, rating: event.target.value })} className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm text-slate-200" />
                    </div>
                    <div className="bg-slate-700/30 rounded-lg p-3 space-y-2">
                      <label className="text-xs text-slate-400 block">Target Audience</label>
                      <textarea value={mediaEditForm.targetAudience} onChange={(event) => onMediaEditFormChange({ ...mediaEditForm, targetAudience: event.target.value })} className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm text-slate-200 h-24 resize-none" />
                    </div>
                    <div className="bg-slate-700/30 rounded-lg p-3 space-y-2">
                      <label className="text-xs text-slate-400 block">Regions</label>
                      <textarea value={mediaEditForm.regions} onChange={(event) => onMediaEditFormChange({ ...mediaEditForm, regions: event.target.value })} className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm text-slate-200 h-24 resize-none" />
                    </div>
                    <div className="bg-slate-700/30 rounded-lg p-3 space-y-2">
                      <label className="text-xs text-slate-400 block">Tags</label>
                      <textarea value={mediaEditForm.tags} onChange={(event) => onMediaEditFormChange({ ...mediaEditForm, tags: event.target.value })} className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm text-slate-200 h-24 resize-none" />
                    </div>
                    <div className="bg-slate-700/30 rounded-lg p-3 space-y-2">
                      <label className="text-xs text-slate-400 block">Rights Start</label>
                      <input value={mediaEditForm.rightsStart} onChange={(event) => onMediaEditFormChange({ ...mediaEditForm, rightsStart: event.target.value })} className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm text-slate-200" />
                    </div>
                    <div className="bg-slate-700/30 rounded-lg p-3 space-y-2">
                      <label className="text-xs text-slate-400 block">Rights End</label>
                      <input value={mediaEditForm.rightsEnd} onChange={(event) => onMediaEditFormChange({ ...mediaEditForm, rightsEnd: event.target.value })} className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm text-slate-200" />
                    </div>
                    <div className="bg-slate-700/30 rounded-lg p-3 space-y-2 md:col-span-2">
                      <label className="text-xs text-slate-400 block">Transcription Source</label>
                      <select value={mediaEditForm.transcriptionSource} onChange={(event) => onMediaEditFormChange({ ...mediaEditForm, transcriptionSource: event.target.value })} className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm text-slate-200">
                        <option value="">none</option>
                        <option value="ai">ai</option>
                        <option value="user">user</option>
                      </select>
                    </div>
                  </div>

                  {mediaEditError && <div className="bg-rose-500/10 border border-rose-500/30 rounded-lg p-3 text-sm text-rose-300">{mediaEditError}</div>}
                </div>
              ) : (
                <>
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
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-xs text-slate-400">Transcription</p>
                      {selectedMedia.transcriptionSource === 'ai' && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300">AI generated</span>
                      )}
                    </div>
                    <textarea
                      readOnly
                      className="w-full bg-slate-700/30 border border-slate-600/50 rounded-lg px-3 py-2 text-xs text-slate-300 h-28 resize-none"
                      value={selectedMedia.transcription || selectedMedia.metadata.transcription || 'Transcription not available yet.'}
                    />
                  </div>
                  <div className="bg-cyan-500/10 border border-cyan-500/25 rounded-lg p-4 space-y-4">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-xs uppercase tracking-wide text-cyan-300 font-medium">Analytics</p>
                        <p className="text-sm font-semibold text-slate-100 mt-1">Program analytics</p>
                      </div>
                      <span className="text-[10px] px-2 py-1 rounded-full bg-cyan-500/20 text-cyan-300">Imported JSON</span>
                    </div>
                    {selectedMedia.analyticsData ? (
                      <>
                        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
                          <div className="bg-slate-900/30 rounded-lg p-3 border border-slate-700/40">
                            <p className="text-slate-400">Program</p>
                            <p className="text-slate-100 mt-1 font-medium truncate">{selectedMedia.analyticsData.program_title}</p>
                          </div>
                          <div className="bg-slate-900/30 rounded-lg p-3 border border-slate-700/40">
                            <p className="text-slate-400">Concurrent viewers</p>
                            <p className="text-slate-100 mt-1 font-medium">{selectedMedia.analyticsData.concurrent_viewers.toLocaleString()}</p>
                          </div>
                          <div className="bg-slate-900/30 rounded-lg p-3 border border-slate-700/40">
                            <p className="text-slate-400">Unique viewers</p>
                            <p className="text-slate-100 mt-1 font-medium">{selectedMedia.analyticsData.unique_viewers.toLocaleString()}</p>
                          </div>
                          <div className="bg-slate-900/30 rounded-lg p-3 border border-slate-700/40">
                            <p className="text-slate-400">Avg watch duration</p>
                            <p className="text-slate-100 mt-1 font-medium">{selectedMedia.analyticsData.average_watch_duration_minutes} min</p>
                          </div>
                          <div className="bg-slate-900/30 rounded-lg p-3 border border-slate-700/40">
                            <p className="text-slate-400">Ad impressions</p>
                            <p className="text-slate-100 mt-1 font-medium">{selectedMedia.analyticsData.ad_metrics.impressions.toLocaleString()}</p>
                          </div>
                          <div className="bg-slate-900/30 rounded-lg p-3 border border-slate-700/40">
                            <p className="text-slate-400">CTR</p>
                            <p className="text-slate-100 mt-1 font-medium">{(selectedMedia.analyticsData.interactive_ctr * 100).toFixed(1)}%</p>
                          </div>
                        </div>
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 text-xs">
                          <div className="bg-slate-900/30 rounded-lg p-3 border border-slate-700/40">
                            <p className="text-slate-400 mb-2">Retention curve</p>
                            <div className="flex flex-wrap gap-2">
                              {selectedMedia.analyticsData.audience_retention_curve.map((point, index) => (
                                <span key={`${point}-${index}`} className="px-2 py-1 rounded bg-slate-700 text-slate-200">{point}%</span>
                              ))}
                            </div>
                          </div>
                          <div className="bg-slate-900/30 rounded-lg p-3 border border-slate-700/40">
                            <p className="text-slate-400 mb-2">Device mix</p>
                            <div className="flex flex-wrap gap-2">
                              {Object.entries(selectedMedia.analyticsData.device_types).map(([device, value]) => (
                                <span key={device} className="px-2 py-1 rounded bg-slate-700 text-slate-200 capitalize">
                                  {device}: {value}%
                                </span>
                              ))}
                            </div>
                          </div>
                          <div className="bg-slate-900/30 rounded-lg p-3 border border-slate-700/40">
                            <p className="text-slate-400 mb-2">Geographic regions</p>
                            <div className="flex flex-wrap gap-2">
                              {Object.entries(selectedMedia.analyticsData.geographic_regions).map(([region, value]) => (
                                <span key={region} className="px-2 py-1 rounded bg-slate-700 text-slate-200">{region}: {value}%</span>
                              ))}
                            </div>
                          </div>
                          <div className="bg-slate-900/30 rounded-lg p-3 border border-slate-700/40">
                            <p className="text-slate-400 mb-2">Drop-off timestamps</p>
                            <div className="flex flex-wrap gap-2">
                              {selectedMedia.analyticsData.drop_off_timestamps.map((stamp) => (
                                <span key={stamp} className="px-2 py-1 rounded bg-slate-700 text-slate-200">{stamp}</span>
                              ))}
                            </div>
                          </div>
                        </div>
                      </>
                    ) : (
                      <p className="text-sm text-slate-300">Upload a JSON analytics file to attach program metrics to this program.</p>
                    )}
                  </div>
                </>
              )}
            </div>
            {isEditingMedia && mediaEditForm && (
              <div className="p-4 border-t border-slate-700 flex justify-end gap-3">
                <button onClick={onCancelMediaEdit} className="px-4 py-2 bg-slate-700 text-slate-300 rounded-lg text-sm font-medium hover:bg-slate-600">Cancel</button>
                <button onClick={onSaveMediaEdits} className="px-4 py-2 bg-cyan-600 text-white rounded-lg text-sm font-medium hover:bg-cyan-500">Save Changes</button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
