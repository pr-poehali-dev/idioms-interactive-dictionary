import { useState, useCallback, useEffect } from 'react';
import Icon from '@/components/ui/icon';
import { PHRASEOLOGISMS } from '@/data/phraseology';
import { addMedia, listMedia, deleteMedia, type MediaType, type MediaFile } from '@/api/media';

const MEDIA_TYPES: { value: MediaType; label: string; icon: string; hint: string; placeholder: string }[] = [
  {
    value: 'audio',
    label: 'Аудио',
    icon: 'Volume2',
    hint: 'Прямая ссылка на MP3/OGG файл',
    placeholder: 'https://example.com/audio.mp3',
  },
  {
    value: 'video',
    label: 'Видео',
    icon: 'Video',
    hint: 'Ссылка на YouTube или прямая ссылка на видео',
    placeholder: 'https://youtube.com/watch?v=...',
  },
  {
    value: 'image',
    label: 'Изображение',
    icon: 'Image',
    hint: 'Прямая ссылка на JPG/PNG/WebP',
    placeholder: 'https://example.com/image.jpg',
  },
];

export default function MediaUploadPage({ onNav }: { onNav: (page: string, data?: string) => void }) {
  const [selectedPhrase, setSelectedPhrase] = useState('');
  const [mediaType, setMediaType] = useState<MediaType>('audio');
  const [url, setUrl] = useState('');
  const [title, setTitle] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'done' | 'error'>('idle');
  const [saveMsg, setSaveMsg] = useState('');

  const [allFiles, setAllFiles] = useState<MediaFile[]>([]);
  const [loadingFiles, setLoadingFiles] = useState(false);
  const [filter, setFilter] = useState('');
  const [deleting, setDeleting] = useState<number | null>(null);

  const phraseMap = Object.fromEntries(PHRASEOLOGISMS.map((p) => [p.id, p.title]));

  const loadFiles = useCallback(async () => {
    setLoadingFiles(true);
    try {
      setAllFiles(await listMedia());
    } finally {
      setLoadingFiles(false);
    }
  }, []);

  useEffect(() => { loadFiles(); }, [loadFiles]);

  const handleSave = async () => {
    if (!selectedPhrase || !url.trim()) return;
    setSaving(true);
    setSaveStatus('idle');
    try {
      await addMedia(selectedPhrase, mediaType, url.trim(), title.trim());
      setSaveStatus('done');
      setSaveMsg('Ссылка добавлена!');
      setUrl('');
      setTitle('');
      await loadFiles();
    } catch (e) {
      setSaveStatus('error');
      setSaveMsg(e instanceof Error ? e.message : 'Ошибка');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    setDeleting(id);
    try {
      await deleteMedia(id);
      setAllFiles((prev) => prev.filter((f) => f.id !== id));
    } finally {
      setDeleting(null);
    }
  };

  const typeConfig = MEDIA_TYPES.find((t) => t.value === mediaType)!;
  const filtered = allFiles.filter((f) =>
    !filter || (phraseMap[f.phrase_id] || '').toLowerCase().includes(filter.toLowerCase())
  );
  const grouped = filtered.reduce<Record<string, MediaFile[]>>((acc, f) => {
    if (!acc[f.phrase_id]) acc[f.phrase_id] = [];
    acc[f.phrase_id].push(f);
    return acc;
  }, {});

  const typeIcon: Record<MediaType, string> = { audio: 'Volume2', video: 'Video', image: 'Image' };
  const typeColor: Record<MediaType, string> = {
    audio: 'text-emerald-400 bg-emerald-900/30 border-emerald-800',
    video: 'text-blue-400 bg-blue-900/30 border-blue-800',
    image: 'text-violet-400 bg-violet-900/30 border-violet-800',
  };

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
          <Icon name="Link" size={18} className="text-[var(--color-accent)]" />
        </div>
        <div>
          <h1 className="font-display text-3xl font-bold text-[var(--color-text)]">Медиафайлы</h1>
          <p className="font-body text-sm text-[var(--color-muted)]">Добавьте ссылки на аудио, видео и изображения для статей</p>
        </div>
      </div>

      {/* Форма добавления */}
      <div className="p-6 rounded-2xl bg-[var(--color-card)] border border-[var(--color-border)] mb-8">
        <h2 className="font-display text-lg font-bold text-[var(--color-text)] mb-5">Добавить ссылку</h2>

        <div className="mb-5">
          <label className="font-body text-xs uppercase tracking-wider text-[var(--color-muted)] mb-2 block">1 · Фразеологизм</label>
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

        <div className="mb-5">
          <label className="font-body text-xs uppercase tracking-wider text-[var(--color-muted)] mb-2 block">2 · Тип медиа</label>
          <div className="grid grid-cols-3 gap-2">
            {MEDIA_TYPES.map((t) => (
              <button
                key={t.value}
                onClick={() => setMediaType(t.value)}
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
        </div>

        <div className="mb-4">
          <label className="font-body text-xs uppercase tracking-wider text-[var(--color-muted)] mb-2 block">3 · Ссылка</label>
          <input
            type="url"
            value={url}
            onChange={(e) => { setUrl(e.target.value); setSaveStatus('idle'); }}
            placeholder={typeConfig.placeholder}
            className="w-full px-4 py-2.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)] font-body text-sm focus:outline-none focus:border-[var(--color-accent)] transition-colors placeholder:text-[var(--color-muted)]"
          />
          <p className="font-body text-xs text-[var(--color-muted)] mt-1.5">{typeConfig.hint}</p>
        </div>

        <div className="mb-5">
          <label className="font-body text-xs uppercase tracking-wider text-[var(--color-muted)] mb-2 block">
            Подпись <span className="normal-case">(необязательно)</span>
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Например: произношение носителя языка"
            className="w-full px-4 py-2.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)] font-body text-sm focus:outline-none focus:border-[var(--color-accent)] transition-colors placeholder:text-[var(--color-muted)]"
          />
        </div>

        <button
          onClick={handleSave}
          disabled={!selectedPhrase || !url.trim() || saving}
          className={`w-full py-3 rounded-xl font-body font-medium text-sm transition-all flex items-center justify-center gap-2 ${
            selectedPhrase && url.trim() && !saving
              ? 'bg-[var(--color-accent)] text-[var(--color-bg)] hover:opacity-90'
              : 'bg-[var(--color-surface)] text-[var(--color-muted)] cursor-not-allowed'
          }`}
        >
          {saving
            ? <><Icon name="Loader2" size={16} className="animate-spin" />Сохранение…</>
            : <><Icon name="Plus" size={16} />Добавить ссылку</>
          }
        </button>

        {saveStatus === 'done' && (
          <div className="mt-3 flex items-center gap-2 p-3 rounded-xl bg-emerald-900/30 border border-emerald-700 animate-fade-in">
            <Icon name="CheckCircle2" size={16} className="text-emerald-400 shrink-0" />
            <p className="font-body text-sm text-emerald-300">{saveMsg}</p>
          </div>
        )}
        {saveStatus === 'error' && (
          <div className="mt-3 flex items-center gap-2 p-3 rounded-xl bg-red-900/30 border border-red-700 animate-fade-in">
            <Icon name="AlertCircle" size={16} className="text-red-400 shrink-0" />
            <p className="font-body text-sm text-red-300">{saveMsg}</p>
          </div>
        )}
      </div>

      {/* Библиотека */}
      <div className="p-6 rounded-2xl bg-[var(--color-card)] border border-[var(--color-border)]">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-lg font-bold text-[var(--color-text)]">
            Все ссылки
            {allFiles.length > 0 && <span className="ml-2 text-sm font-body font-normal text-[var(--color-muted)]">({allFiles.length})</span>}
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
              placeholder="Фильтр по названию…"
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
            <Icon name="Link" size={36} className="text-[var(--color-muted)] mx-auto mb-3 opacity-40" />
            <p className="font-body text-[var(--color-muted)] text-sm">Ссылок пока нет</p>
            <p className="font-body text-xs text-[var(--color-muted)] mt-1">Добавьте первую ссылку выше</p>
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
                <span className="font-body text-xs text-[var(--color-muted)]">{files.length} ссылк{files.length === 1 ? 'а' : 'и'}</span>
              </div>
              <div className="space-y-2">
                {files.map((f) => (
                  <div key={f.id} className="flex items-center gap-3 p-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)]">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center border shrink-0 ${typeColor[f.media_type]}`}>
                      <Icon name={typeIcon[f.media_type]} size={14} fallback="File" />
                    </div>
                    <div className="flex-1 min-w-0">
                      {f.title && <p className="font-body text-sm text-[var(--color-text)] truncate">{f.title}</p>}
                      <p className="font-body text-xs text-[var(--color-muted)] truncate">{f.url}</p>
                    </div>
                    <a href={f.url} target="_blank" rel="noopener noreferrer"
                      className="p-1.5 rounded-lg text-[var(--color-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-border)] transition-all shrink-0">
                      <Icon name="ExternalLink" size={14} />
                    </a>
                    <button onClick={() => handleDelete(f.id)} disabled={deleting === f.id}
                      className="p-1.5 rounded-lg text-[var(--color-muted)] hover:text-red-400 hover:bg-red-900/20 transition-all shrink-0">
                      {deleting === f.id
                        ? <Icon name="Loader2" size={14} className="animate-spin" />
                        : <Icon name="Trash2" size={14} />}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
