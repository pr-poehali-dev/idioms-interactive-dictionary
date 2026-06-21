import { useState, useRef, useCallback } from 'react';
import Icon from '@/components/ui/icon';
import { PHRASEOLOGISMS } from '@/data/phraseology';
import { uploadMedia, listMedia, deleteMedia, type MediaType, type MediaFile } from '@/api/media';

const MEDIA_TYPES: { value: MediaType; label: string; icon: string; accept: string; hint: string }[] = [
  { value: 'audio', label: 'Аудио', icon: 'Volume2', accept: 'audio/*', hint: 'MP3, WAV, OGG · произношение фразеологизма' },
  { value: 'video', label: 'Видео', icon: 'Video', accept: 'video/*', hint: 'MP4, WebM · объяснение или пример употребления' },
  { value: 'image', label: 'Изображение', icon: 'Image', accept: 'image/*', hint: 'JPG, PNG, WebP · иллюстрация к этимологии' },
];

const MAX_MB: Record<MediaType, number> = { audio: 20, video: 100, image: 10 };

interface UploadState {
  status: 'idle' | 'uploading' | 'done' | 'error';
  progress: number;
  message: string;
}

export default function MediaUploadPage({ onNav }: { onNav: (page: string, data?: string) => void }) {
  const [selectedPhrase, setSelectedPhrase] = useState('');
  const [mediaType, setMediaType] = useState<MediaType>('audio');
  const [file, setFile] = useState<File | null>(null);
  const [drag, setDrag] = useState(false);
  const [upload, setUpload] = useState<UploadState>({ status: 'idle', progress: 0, message: '' });
  const [allFiles, setAllFiles] = useState<MediaFile[]>([]);
  const [loadingFiles, setLoadingFiles] = useState(false);
  const [filter, setFilter] = useState('');
  const [deleting, setDeleting] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const loadFiles = useCallback(async () => {
    setLoadingFiles(true);
    try {
      const files = await listMedia();
      setAllFiles(files);
    } finally {
      setLoadingFiles(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDrag(false);
    const f = e.dataTransfer.files[0];
    if (f) setFile(f);
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) setFile(f);
  };

  const handleUpload = async () => {
    if (!file || !selectedPhrase) return;
    const maxBytes = MAX_MB[mediaType] * 1024 * 1024;
    if (file.size > maxBytes) {
      setUpload({ status: 'error', progress: 0, message: `Файл слишком большой. Максимум ${MAX_MB[mediaType]} МБ для ${mediaType}.` });
      return;
    }
    setUpload({ status: 'uploading', progress: 10, message: 'Подготовка файла…' });
    try {
      setUpload({ status: 'uploading', progress: 40, message: 'Загрузка в хранилище…' });
      await uploadMedia(selectedPhrase, mediaType, file);
      setUpload({ status: 'done', progress: 100, message: `Файл «${file.name}» успешно загружен!` });
      setFile(null);
      if (fileRef.current) fileRef.current.value = '';
      await loadFiles();
    } catch (e) {
      setUpload({ status: 'error', progress: 0, message: `Ошибка загрузки: ${e instanceof Error ? e.message : 'неизвестная ошибка'}` });
    }
  };

  const handleDelete = async (key: string) => {
    setDeleting(key);
    try {
      await deleteMedia(key);
      setAllFiles((prev) => prev.filter((f) => f.key !== key));
    } finally {
      setDeleting(null);
    }
  };

  const phraseMap = Object.fromEntries(PHRASEOLOGISMS.map((p) => [p.id, p.title]));
  const filtered = allFiles.filter((f) =>
    !filter || f.phrase_id.includes(filter) || (phraseMap[f.phrase_id] || '').toLowerCase().includes(filter.toLowerCase())
  );

  const grouped = filtered.reduce<Record<string, MediaFile[]>>((acc, f) => {
    if (!acc[f.phrase_id]) acc[f.phrase_id] = [];
    acc[f.phrase_id].push(f);
    return acc;
  }, {});

  const typeConfig = MEDIA_TYPES.find((t) => t.value === mediaType)!;
  const selectedPhraseTitle = phraseMap[selectedPhrase] || '';

  return (
    <div className="animate-fade-in">
      <button
        onClick={() => onNav('home')}
        className="flex items-center gap-1 text-sm text-[var(--color-muted)] hover:text-[var(--color-text)] font-body mb-6 transition-colors"
      >
        <Icon name="ArrowLeft" size={16} />
        На главную
      </button>

      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-xl bg-[var(--color-accent-light)] flex items-center justify-center">
          <Icon name="Upload" size={18} className="text-[var(--color-accent)]" />
        </div>
        <div>
          <h1 className="font-display text-3xl font-bold text-[var(--color-text)]">Медиафайлы</h1>
          <p className="font-body text-sm text-[var(--color-muted)]">Загрузка аудио, видео и изображений для словарных статей</p>
        </div>
      </div>

      {/* Upload Form */}
      <div className="p-6 rounded-2xl bg-[var(--color-card)] border border-[var(--color-border)] mb-8">
        <h2 className="font-display text-lg font-bold text-[var(--color-text)] mb-5">Загрузить файл</h2>

        {/* Step 1: phrase */}
        <div className="mb-5">
          <label className="font-body text-xs uppercase tracking-wider text-[var(--color-muted)] mb-2 block">
            1 · Фразеологизм
          </label>
          <select
            value={selectedPhrase}
            onChange={(e) => setSelectedPhrase(e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)] font-body text-sm focus:outline-none focus:border-[var(--color-accent)] transition-colors"
          >
            <option value="">— Выберите фразеологизм —</option>
            {PHRASEOLOGISMS.map((p) => (
              <option key={p.id} value={p.id}>{p.title}</option>
            ))}
          </select>
        </div>

        {/* Step 2: media type */}
        <div className="mb-5">
          <label className="font-body text-xs uppercase tracking-wider text-[var(--color-muted)] mb-2 block">
            2 · Тип медиа
          </label>
          <div className="grid grid-cols-3 gap-2">
            {MEDIA_TYPES.map((t) => (
              <button
                key={t.value}
                onClick={() => { setMediaType(t.value); setFile(null); if (fileRef.current) fileRef.current.value = ''; }}
                className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border text-sm font-body transition-all ${
                  mediaType === t.value
                    ? 'border-[var(--color-accent)] bg-[var(--color-accent-light)] text-[var(--color-accent)]'
                    : 'border-[var(--color-border)] text-[var(--color-muted)] hover:border-[var(--color-accent)] hover:text-[var(--color-text)]'
                }`}
              >
                <Icon name={t.icon} size={18} fallback="File" />
                {t.label}
              </button>
            ))}
          </div>
          <p className="font-body text-xs text-[var(--color-muted)] mt-2">{typeConfig.hint}</p>
        </div>

        {/* Step 3: file drop */}
        <div className="mb-5">
          <label className="font-body text-xs uppercase tracking-wider text-[var(--color-muted)] mb-2 block">
            3 · Файл
          </label>
          <div
            onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
            onDragLeave={() => setDrag(false)}
            onDrop={handleDrop}
            onClick={() => fileRef.current?.click()}
            className={`relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
              drag
                ? 'border-[var(--color-accent)] bg-[var(--color-accent-light)]'
                : file
                ? 'border-[var(--color-accent)] bg-[var(--color-accent-light)]/50'
                : 'border-[var(--color-border)] hover:border-[var(--color-accent)] hover:bg-[var(--color-surface)]'
            }`}
          >
            <input
              ref={fileRef}
              type="file"
              accept={typeConfig.accept}
              onChange={handleFileChange}
              className="hidden"
            />
            {file ? (
              <div className="space-y-1">
                <Icon name="CheckCircle2" size={28} className="text-[var(--color-accent)] mx-auto" />
                <p className="font-body font-medium text-sm text-[var(--color-text)]">{file.name}</p>
                <p className="font-body text-xs text-[var(--color-muted)]">{(file.size / 1024 / 1024).toFixed(2)} МБ</p>
              </div>
            ) : (
              <div className="space-y-2">
                <Icon name="Upload" size={28} className="text-[var(--color-muted)] mx-auto" />
                <p className="font-body text-sm text-[var(--color-text)]">Перетащите файл сюда или нажмите</p>
                <p className="font-body text-xs text-[var(--color-muted)]">Макс. {MAX_MB[mediaType]} МБ · {typeConfig.hint.split('·')[0].trim()}</p>
              </div>
            )}
          </div>
        </div>

        {/* Upload button */}
        <button
          onClick={handleUpload}
          disabled={!file || !selectedPhrase || upload.status === 'uploading'}
          className={`w-full py-3 rounded-xl font-body font-medium text-sm transition-all flex items-center justify-center gap-2 ${
            file && selectedPhrase && upload.status !== 'uploading'
              ? 'bg-[var(--color-accent)] text-[var(--color-bg)] hover:opacity-90'
              : 'bg-[var(--color-surface)] text-[var(--color-muted)] cursor-not-allowed'
          }`}
        >
          {upload.status === 'uploading' ? (
            <>
              <Icon name="Loader2" size={16} className="animate-spin" />
              {upload.message}
            </>
          ) : (
            <>
              <Icon name="Upload" size={16} />
              {selectedPhrase && file
                ? `Загрузить в «${selectedPhraseTitle}»`
                : 'Выберите фразеологизм и файл'}
            </>
          )}
        </button>

        {/* Progress bar */}
        {upload.status === 'uploading' && (
          <div className="mt-3 h-1.5 rounded-full bg-[var(--color-surface)] overflow-hidden">
            <div
              className="h-full bg-[var(--color-accent)] rounded-full transition-all duration-500"
              style={{ width: `${upload.progress}%` }}
            />
          </div>
        )}

        {/* Status messages */}
        {upload.status === 'done' && (
          <div className="mt-3 flex items-center gap-2 p-3 rounded-xl bg-emerald-900/30 border border-emerald-700 animate-fade-in">
            <Icon name="CheckCircle2" size={16} className="text-emerald-400 shrink-0" />
            <p className="font-body text-sm text-emerald-300">{upload.message}</p>
          </div>
        )}
        {upload.status === 'error' && (
          <div className="mt-3 flex items-center gap-2 p-3 rounded-xl bg-red-900/30 border border-red-700 animate-fade-in">
            <Icon name="AlertCircle" size={16} className="text-red-400 shrink-0" />
            <p className="font-body text-sm text-red-300">{upload.message}</p>
          </div>
        )}
      </div>

      {/* File library */}
      <div className="p-6 rounded-2xl bg-[var(--color-card)] border border-[var(--color-border)]">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-lg font-bold text-[var(--color-text)]">
            Библиотека файлов
            {allFiles.length > 0 && (
              <span className="ml-2 text-sm font-body font-normal text-[var(--color-muted)]">
                ({allFiles.length})
              </span>
            )}
          </h2>
          <button
            onClick={loadFiles}
            disabled={loadingFiles}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[var(--color-border)] text-xs font-body text-[var(--color-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-surface)] transition-all"
          >
            <Icon name={loadingFiles ? 'Loader2' : 'RefreshCw'} size={13} className={loadingFiles ? 'animate-spin' : ''} />
            Обновить
          </button>
        </div>

        {allFiles.length > 4 && (
          <div className="relative mb-4">
            <Icon name="Search" size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-muted)]" />
            <input
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              placeholder="Фильтр по фразеологизму…"
              className="w-full pl-9 pr-3 py-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)] font-body text-sm focus:outline-none focus:border-[var(--color-accent)]"
            />
          </div>
        )}

        {loadingFiles && allFiles.length === 0 && (
          <div className="text-center py-8">
            <Icon name="Loader2" size={24} className="text-[var(--color-muted)] mx-auto animate-spin mb-2" />
            <p className="font-body text-sm text-[var(--color-muted)]">Загрузка…</p>
          </div>
        )}

        {!loadingFiles && allFiles.length === 0 && (
          <div className="text-center py-10">
            <Icon name="FolderOpen" size={36} className="text-[var(--color-muted)] mx-auto mb-3 opacity-50" />
            <p className="font-body text-[var(--color-muted)] text-sm">Файлов пока нет</p>
            <p className="font-body text-xs text-[var(--color-muted)] mt-1">Загрузите первый файл выше</p>
          </div>
        )}

        <div className="space-y-5">
          {Object.entries(grouped).map(([phraseId, files]) => (
            <div key={phraseId}>
              <div className="flex items-center justify-between mb-2">
                <button
                  onClick={() => onNav('article', phraseId)}
                  className="font-display font-bold text-sm text-[var(--color-accent)] hover:underline flex items-center gap-1"
                >
                  {phraseMap[phraseId] || phraseId}
                  <Icon name="ExternalLink" size={12} />
                </button>
                <span className="font-body text-xs text-[var(--color-muted)]">{files.length} файл{files.length === 1 ? '' : 'а'}</span>
              </div>
              <div className="space-y-2">
                {files.map((f) => {
                  const icon = f.media_type === 'audio' ? 'Volume2' : f.media_type === 'video' ? 'Video' : 'Image';
                  const typeColor = f.media_type === 'audio'
                    ? 'text-emerald-400 bg-emerald-900/30 border-emerald-800'
                    : f.media_type === 'video'
                    ? 'text-blue-400 bg-blue-900/30 border-blue-800'
                    : 'text-violet-400 bg-violet-900/30 border-violet-800';
                  return (
                    <div
                      key={f.key}
                      className="flex items-center gap-3 p-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] hover:border-[var(--color-border)] group"
                    >
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center border shrink-0 ${typeColor}`}>
                        <Icon name={icon} size={14} fallback="File" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-body text-sm text-[var(--color-text)] truncate">{f.filename}</p>
                        <p className="font-body text-xs text-[var(--color-muted)] truncate">{f.url}</p>
                      </div>
                      <a
                        href={f.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1.5 rounded-lg text-[var(--color-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-border)] transition-all shrink-0"
                        title="Открыть файл"
                      >
                        <Icon name="ExternalLink" size={14} />
                      </a>
                      <button
                        onClick={() => handleDelete(f.key)}
                        disabled={deleting === f.key}
                        className="p-1.5 rounded-lg text-[var(--color-muted)] hover:text-red-400 hover:bg-red-900/20 transition-all shrink-0"
                        title="Удалить"
                      >
                        {deleting === f.key
                          ? <Icon name="Loader2" size={14} className="animate-spin" />
                          : <Icon name="Trash2" size={14} />
                        }
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
