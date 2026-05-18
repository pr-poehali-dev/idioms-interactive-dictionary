import { useState } from 'react';
import Icon from '@/components/ui/icon';
import { getPhraseologismById, PHRASEOLOGISMS } from '@/data/phraseology';
import {
  getHistory, getResults, getCollections, getAllNotes,
  createCollection, deleteCollection, removeFromCollection,
} from '@/data/userStore';

export default function CabinetPage({ onNav }: { onNav: (page: string, data?: string) => void }) {
  const [tab, setTab] = useState<'history' | 'stats' | 'collections' | 'notes'>('history');
  const [newColName, setNewColName] = useState('');
  const [, forceUpdate] = useState(0);
  const refresh = () => forceUpdate((n) => n + 1);

  const history = getHistory().slice(0, 20).map((id) => getPhraseologismById(id)).filter(Boolean);
  const results = getResults();
  const collections = getCollections();
  const notes = getAllNotes();

  const totalDone = results.length;
  const totalCorrect = results.filter((r) => r.correct).length;
  const pct = totalDone > 0 ? Math.round((totalCorrect / totalDone) * 100) : 0;

  const phraseStats = PHRASEOLOGISMS.map((p) => {
    const r = results.filter((x) => x.phraseologismId === p.id);
    const errors = r.filter((x) => !x.correct).length;
    return { p, total: r.length, correct: r.filter((x) => x.correct).length, errors };
  }).filter((x) => x.total > 0).sort((a, b) => b.errors - a.errors);

  const recommended = phraseStats.filter((x) => x.errors >= 2).slice(0, 4);

  const tabs = [
    { id: 'history', label: 'История', icon: 'Clock' },
    { id: 'stats', label: 'Статистика', icon: 'BarChart2' },
    { id: 'collections', label: 'Подборки', icon: 'Bookmark' },
    { id: 'notes', label: 'Заметки', icon: 'NotebookPen' },
  ] as const;

  return (
    <div className="animate-fade-in">
      <h1 className="font-display text-3xl font-bold text-[var(--color-text)] mb-6">Личный кабинет</h1>

      <div className="grid grid-cols-3 gap-3 mb-6">
        {[
          { label: 'Изучено статей', value: history.length, icon: 'BookOpen' },
          { label: 'Заданий выполнено', value: totalDone, icon: 'PenLine' },
          { label: 'Правильных', value: `${pct}%`, icon: 'TrendingUp' },
        ].map((s) => (
          <div key={s.label} className="p-4 rounded-2xl bg-[var(--color-card)] border border-[var(--color-border)] text-center">
            <Icon name={s.icon} size={18} fallback="Circle" className="text-[var(--color-accent)] mx-auto mb-2" />
            <div className="font-display text-2xl font-bold text-[var(--color-text)]">{s.value}</div>
            <div className="font-body text-xs text-[var(--color-muted)] mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="flex border-b border-[var(--color-border)] mb-6 overflow-x-auto">
        {tabs.map(({ id, label, icon }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-body whitespace-nowrap transition-all border-b-2 -mb-px ${
              tab === id
                ? 'border-[var(--color-accent)] text-[var(--color-accent)]'
                : 'border-transparent text-[var(--color-muted)] hover:text-[var(--color-text)]'
            }`}
          >
            <Icon name={icon} size={14} fallback="Circle" />
            {label}
          </button>
        ))}
      </div>

      {tab === 'history' && (
        <div>
          {history.length === 0 && (
            <div className="text-center py-12 text-[var(--color-muted)] font-body">
              История пуста — откройте несколько статей
            </div>
          )}
          <div className="space-y-2">
            {history.map((p) => p && (
              <button
                key={p.id}
                onClick={() => onNav('article', p.id)}
                className="w-full text-left p-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] hover:border-[var(--color-accent)] transition-all group flex items-center justify-between"
              >
                <div>
                  <div className="font-display font-bold text-sm text-[var(--color-text)] group-hover:text-[var(--color-accent)] transition-colors">
                    {p.title}
                  </div>
                  <div className="font-body text-xs text-[var(--color-muted)] mt-0.5 line-clamp-1">{p.meaning}</div>
                </div>
                <Icon name="ChevronRight" size={16} className="text-[var(--color-muted)] group-hover:text-[var(--color-accent)] shrink-0 transition-colors" />
              </button>
            ))}
          </div>
        </div>
      )}

      {tab === 'stats' && (
        <div className="space-y-5">
          {phraseStats.length === 0 && (
            <p className="text-center py-12 text-[var(--color-muted)] font-body">
              Выполните упражнения, чтобы увидеть статистику
            </p>
          )}
          {phraseStats.map(({ p, total, correct, errors }) => (
            <div key={p.id} className="p-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-card)]">
              <div className="flex items-center justify-between mb-2">
                <button onClick={() => onNav('article', p.id)} className="font-display font-bold text-sm text-[var(--color-text)] hover:text-[var(--color-accent)] transition-colors">
                  {p.title}
                </button>
                <span className={`text-xs font-body px-2 py-0.5 rounded-full font-medium ${
                  Math.round((correct / total) * 100) >= 70 ? 'bg-green-100 text-green-700' :
                  Math.round((correct / total) * 100) >= 40 ? 'bg-amber-100 text-amber-700' :
                  'bg-red-100 text-red-700'
                }`}>
                  {Math.round((correct / total) * 100)}%
                </span>
              </div>
              <div className="h-1.5 rounded-full bg-[var(--color-surface)] overflow-hidden mb-2">
                <div
                  className="h-full rounded-full bg-[var(--color-accent)] transition-all"
                  style={{ width: `${Math.round((correct / total) * 100)}%` }}
                />
              </div>
              <div className="flex gap-4 font-body text-xs text-[var(--color-muted)]">
                <span>Всего: {total}</span>
                <span className="text-green-600">✓ {correct}</span>
                <span className="text-red-500">✗ {errors}</span>
              </div>
            </div>
          ))}

          {recommended.length > 0 && (
            <div className="p-5 rounded-2xl bg-amber-50 border border-amber-200">
              <div className="font-body text-xs uppercase tracking-wider text-amber-600 mb-3 flex items-center gap-2">
                <Icon name="Lightbulb" size={14} />
                Рекомендуем повторить
              </div>
              <div className="space-y-2">
                {recommended.map(({ p }) => (
                  <button
                    key={p.id}
                    onClick={() => onNav('article', p.id)}
                    className="w-full text-left text-sm font-body text-amber-800 hover:text-amber-900 hover:underline flex items-center gap-2"
                  >
                    <Icon name="ChevronRight" size={14} />
                    {p.title}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {tab === 'collections' && (
        <div className="space-y-5">
          <div className="flex gap-2">
            <input
              value={newColName}
              onChange={(e) => setNewColName(e.target.value)}
              placeholder="Название новой подборки…"
              className="flex-1 px-4 py-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] text-[var(--color-text)] font-body text-sm focus:outline-none focus:border-[var(--color-accent)]"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && newColName.trim()) {
                  createCollection(newColName.trim());
                  setNewColName('');
                  refresh();
                }
              }}
            />
            <button
              onClick={() => {
                if (newColName.trim()) {
                  createCollection(newColName.trim());
                  setNewColName('');
                  refresh();
                }
              }}
              className="px-4 py-2 bg-[var(--color-accent)] text-white rounded-xl font-body text-sm font-medium hover:opacity-90 transition-opacity"
            >
              Создать
            </button>
          </div>

          {collections.length === 0 && (
            <p className="text-center py-8 text-[var(--color-muted)] font-body">Подборок пока нет</p>
          )}

          {collections.map((col) => {
            const phrases = col.phraseologismIds.map((id) => getPhraseologismById(id)).filter(Boolean);
            return (
              <div key={col.id} className="p-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-card)]">
                <div className="flex items-center justify-between mb-3">
                  <span className="font-display font-bold text-[var(--color-text)]">{col.name}</span>
                  <button
                    onClick={() => { deleteCollection(col.id); refresh(); }}
                    className="text-xs text-red-400 hover:text-red-600 font-body flex items-center gap-1"
                  >
                    <Icon name="Trash2" size={12} />
                    Удалить
                  </button>
                </div>
                {phrases.length === 0 && (
                  <p className="font-body text-xs text-[var(--color-muted)]">Пусто — добавьте фразеологизмы из статей</p>
                )}
                <div className="flex flex-wrap gap-2">
                  {phrases.map((p) => p && (
                    <div key={p.id} className="flex items-center gap-1">
                      <button
                        onClick={() => onNav('article', p.id)}
                        className="font-body text-sm px-3 py-1 rounded-full border border-[var(--color-accent)] text-[var(--color-accent)] hover:bg-[var(--color-accent)] hover:text-white transition-all"
                      >
                        {p.title}
                      </button>
                      <button
                        onClick={() => { removeFromCollection(col.id, p.id); refresh(); }}
                        className="text-[var(--color-muted)] hover:text-red-500 transition-colors"
                      >
                        <Icon name="X" size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {tab === 'notes' && (
        <div className="space-y-3">
          {notes.length === 0 && (
            <p className="text-center py-12 text-[var(--color-muted)] font-body">
              Заметок пока нет — добавляйте их в статьях
            </p>
          )}
          {notes.map((n) => {
            const p = getPhraseologismById(n.phraseologismId);
            return (
              <div key={n.phraseologismId} className="p-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-card)]">
                <button
                  onClick={() => onNav('article', n.phraseologismId)}
                  className="font-display font-bold text-sm text-[var(--color-accent)] hover:underline mb-2 block"
                >
                  {p?.title}
                </button>
                <p className="font-body text-sm text-[var(--color-text)] whitespace-pre-wrap">{n.text}</p>
                <p className="font-body text-xs text-[var(--color-muted)] mt-2">
                  {new Date(n.timestamp).toLocaleDateString('ru-RU')}
                </p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
