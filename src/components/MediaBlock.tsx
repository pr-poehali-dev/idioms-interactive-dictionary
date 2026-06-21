import { useState, useEffect, useRef } from 'react';
import Icon from '@/components/ui/icon';
import { listMedia, type MediaFile } from '@/api/media';

interface MediaBlockProps {
  phraseId: string;
  phraseTitle: string;
}

function AudioPlayer({ file }: { file: MediaFile }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);

  const toggle = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (playing) { audio.pause(); } else { audio.play(); }
    setPlaying(!playing);
  };

  const fmt = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;

  return (
    <div className="flex items-center gap-3 p-3 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)]">
      <audio
        ref={audioRef}
        src={file.url}
        onTimeUpdate={(e) => {
          const a = e.currentTarget;
          setProgress(a.duration ? (a.currentTime / a.duration) * 100 : 0);
        }}
        onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
        onEnded={() => { setPlaying(false); setProgress(0); }}
      />
      <button
        onClick={toggle}
        className="w-9 h-9 rounded-full bg-[var(--color-accent)] flex items-center justify-center shrink-0 hover:opacity-80 transition-opacity"
      >
        <Icon name={playing ? 'Pause' : 'Play'} size={16} className="text-[var(--color-bg)]" />
      </button>
      <div className="flex-1 min-w-0">
        <div className="font-body text-xs text-[var(--color-muted)] mb-1.5 truncate">{file.filename}</div>
        <div className="h-1.5 rounded-full bg-[var(--color-border)] overflow-hidden">
          <div
            className="h-full bg-[var(--color-accent)] rounded-full transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
      {duration > 0 && (
        <span className="font-body text-xs text-[var(--color-muted)] shrink-0">{fmt(duration)}</span>
      )}
    </div>
  );
}

function VideoPlayer({ file }: { file: MediaFile }) {
  return (
    <div className="rounded-xl overflow-hidden border border-[var(--color-border)] bg-black">
      <video
        src={file.url}
        controls
        className="w-full max-h-64 object-contain"
        preload="metadata"
      />
      <div className="px-3 py-2 bg-[var(--color-surface)]">
        <span className="font-body text-xs text-[var(--color-muted)]">{file.filename}</span>
      </div>
    </div>
  );
}

function ImageViewer({ file }: { file: MediaFile }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="relative rounded-xl overflow-hidden border border-[var(--color-border)] hover:border-[var(--color-accent)] transition-colors group w-full"
      >
        <img
          src={file.url}
          alt={file.filename}
          className="w-full h-40 object-cover group-hover:scale-105 transition-transform duration-300"
        />
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all flex items-center justify-center">
          <Icon name="ZoomIn" size={24} className="text-white opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
      </button>
      {open && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4 animate-fade-in"
          onClick={() => setOpen(false)}
        >
          <img
            src={file.url}
            alt={file.filename}
            className="max-w-full max-h-full object-contain rounded-xl"
          />
          <button
            className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
            onClick={() => setOpen(false)}
          >
            <Icon name="X" size={20} className="text-white" />
          </button>
        </div>
      )}
    </>
  );
}

export default function MediaBlock({ phraseId, phraseTitle }: MediaBlockProps) {
  const [files, setFiles] = useState<MediaFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    setLoading(true);
    setError(false);
    listMedia(phraseId)
      .then((data) => { setFiles(data); })
      .catch((e) => { console.error('[MediaBlock] listMedia error:', e); setError(true); })
      .finally(() => setLoading(false));
  }, [phraseId, retryCount]);

  const audio = files.filter((f) => f.media_type === 'audio');
  const video = files.filter((f) => f.media_type === 'video');
  const images = files.filter((f) => f.media_type === 'image');

  if (loading) {
    return (
      <div className="p-5 rounded-2xl bg-[var(--color-card)] border border-[var(--color-border)]">
        <div className="flex items-center gap-2 mb-3">
          <Icon name="PlayCircle" size={14} className="text-[var(--color-muted)]" />
          <div className="font-body text-xs uppercase tracking-wider text-[var(--color-muted)]">Медиа</div>
        </div>
        <div className="space-y-2">
          {[1, 2].map((i) => (
            <div key={i} className="h-12 rounded-xl bg-[var(--color-surface)] animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-5 rounded-2xl bg-[var(--color-card)] border border-[var(--color-border)]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Icon name="PlayCircle" size={14} className="text-[var(--color-muted)]" />
            <div className="font-body text-xs uppercase tracking-wider text-[var(--color-muted)]">Медиа</div>
          </div>
          <button
            onClick={() => setRetryCount((c) => c + 1)}
            className="flex items-center gap-1.5 text-xs font-body text-[var(--color-accent)] hover:underline"
          >
            <Icon name="RefreshCw" size={12} />
            Повторить
          </button>
        </div>
        <p className="font-body text-xs text-[var(--color-muted)] mt-2">Не удалось загрузить медиафайлы</p>
      </div>
    );
  }

  if (files.length === 0) return null;

  return (
    <section className="p-5 rounded-2xl bg-[var(--color-card)] border border-[var(--color-border)]">
      <div className="flex items-center gap-2 mb-4">
        <Icon name="PlayCircle" size={14} className="text-[var(--color-accent)]" />
        <div className="font-body text-xs uppercase tracking-wider text-[var(--color-muted)]">
          Мультимедиа · <span className="text-[var(--color-accent)]">{phraseTitle}</span>
        </div>
      </div>

      <div className="space-y-4">
        {audio.length > 0 && (
          <div>
            <div className="font-body text-xs text-[var(--color-muted)] mb-2 flex items-center gap-1.5">
              <Icon name="Volume2" size={12} />
              Произношение
            </div>
            <div className="space-y-2">
              {audio.map((f) => <AudioPlayer key={f.key} file={f} />)}
            </div>
          </div>
        )}

        {video.length > 0 && (
          <div>
            <div className="font-body text-xs text-[var(--color-muted)] mb-2 flex items-center gap-1.5">
              <Icon name="Video" size={12} />
              Видео-объяснение
            </div>
            <div className="space-y-3">
              {video.map((f) => <VideoPlayer key={f.key} file={f} />)}
            </div>
          </div>
        )}

        {images.length > 0 && (
          <div>
            <div className="font-body text-xs text-[var(--color-muted)] mb-2 flex items-center gap-1.5">
              <Icon name="Image" size={12} />
              Иллюстрации
            </div>
            <div className="grid grid-cols-2 gap-2">
              {images.map((f) => <ImageViewer key={f.key} file={f} />)}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}