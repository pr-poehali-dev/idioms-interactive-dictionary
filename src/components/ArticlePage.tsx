import { useState, useEffect } from 'react';
import Icon from '@/components/ui/icon';
import { getPhraseologismById, PHRASEOLOGISMS } from '@/data/phraseology';
import { addToHistory, getNoteForPhrase, saveNote, getCollections, addToCollection, createCollection, getStatsForPhrase } from '@/data/userStore';
import ExerciseBlock from './ExerciseBlock';

interface ArticlePageProps {
  phraseId: string;
  onNav: (page: string, data?: string) => void;
}

export default function ArticlePage({ phraseId, onNav }: ArticlePageProps) {
  const phrase = getPhraseologismById(phraseId);
  const [note, setNote] = useState('');
  const [editingNote, setEditingNote] = useState(false);
  const [noteText, setNoteText] = useState('');
  const [showCollectionMenu, setShowCollectionMenu] = useState(false);
  const [collections, setCollections] = useState(getCollections());
  const [newCollName, setNewCollName] = useState('');
  const [activeTab, setActiveTab] = useState<'article' | 'exercises'>('article');
  const stats = phrase ? getStatsForPhrase(phrase.id) : null;

  useEffect(() => {
    if (phrase) {
      addToHistory(phrase.id);
      const saved = getNoteForPhrase(phrase.id);
      setNote(saved);
      setNoteText(saved);
    }
  }, [phraseId, phrase]);

  if (!phrase) {
    return (
      <div className="text-center py-20 animate-fade-in">
        <p className="font-body text-[var(--color-muted)]">Статья не найдена.</p>
        <button onClick={() => onNav('search')} className="mt-4 text-[var(--color-accent)] text-sm font-body underline">
          Вернуться к поиску
        </button>
      </div>
    );
  }

  const synonymPhrases = phrase.synonyms
    .map((s) => PHRASEOLOGISMS.find((p) => p.title === s || p.synonyms.includes(s)))
    .filter(Boolean);
  const relatedPhrases = phrase.related
    .map((id) => PHRASEOLOGISMS.find((p) => p.id === id))
    .filter(Boolean);

  const handleSaveNote = () => {
    saveNote(phrase.id, noteText);
    setNote(noteText);
    setEditingNote(false);
  };

  const handleAddToCollection = (collId: string) => {
    addToCollection(collId, phrase.id);
    setShowCollectionMenu(false);
  };

  const handleCreateCollection = () => {
    if (newCollName.trim()) {
      createCollection(newCollName.trim());
      const cols = getCollections();
      setCollections(cols);
      addToCollection(cols[cols.length - 1].id, phrase.id);
      setNewCollName('');
      setShowCollectionMenu(false);
    }
  };

  return (
    <div className="animate-fade-in">
      <button
        onClick={() => onNav('search')}
        className="flex items-center gap-1 text-sm text-[var(--color-muted)] hover:text-[var(--color-text)] font-body mb-6 transition-colors"
      >
        <Icon name="ArrowLeft" size={16} />
        Назад к поиску
      </button>

      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="font-display text-4xl font-bold text-[var(--color-text)] mb-2">
            {phrase.title}
          </h1>
          <div className="flex flex-wrap gap-2 items-center">
            <span className="text-xs uppercase tracking-wider font-body px-3 py-1 rounded-full bg-[var(--color-surface)] text-[var(--color-muted)] border border-[var(--color-border)]">
              {phrase.style}
            </span>
            {phrase.themes.map((t) => (
              <span key={t} className="text-xs font-body px-3 py-1 rounded-full bg-[var(--color-accent-light)] text-[var(--color-accent)]">
                {t}
              </span>
            ))}
          </div>
        </div>
        <div className="relative shrink-0">
          <button
            onClick={() => { setShowCollectionMenu(!showCollectionMenu); setCollections(getCollections()); }}
            className="p-2.5 rounded-xl border border-[var(--color-border)] hover:bg-[var(--color-surface)] transition-colors text-[var(--color-muted)] hover:text-[var(--color-accent)]"
            title="Добавить в подборку"
          >
            <Icon name="Bookmark" size={18} />
          </button>
          {showCollectionMenu && (
            <div className="absolute right-0 top-12 z-50 w-64 bg-[var(--color-card)] border border-[var(--color-border)] rounded-xl shadow-lg p-3 animate-fade-in">
              <div className="text-xs font-body text-[var(--color-muted)] mb-2 uppercase tracking-wider">Добавить в подборку</div>
              {collections.length === 0 && (
                <p className="text-xs font-body text-[var(--color-muted)] mb-2">Подборок пока нет</p>
              )}
              {collections.map((c) => (
                <button
                  key={c.id}
                  onClick={() => handleAddToCollection(c.id)}
                  className="w-full text-left text-sm font-body px-2 py-1.5 rounded-lg hover:bg-[var(--color-surface)] text-[var(--color-text)] transition-colors"
                >
                  {c.name}
                </button>
              ))}
              <div className="border-t border-[var(--color-border)] mt-2 pt-2 flex gap-2">
                <input
                  value={newCollName}
                  onChange={(e) => setNewCollName(e.target.value)}
                  placeholder="Новая подборка…"
                  className="flex-1 text-xs font-body px-2 py-1.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text)] focus:outline-none focus:border-[var(--color-accent)]"
                  onKeyDown={(e) => e.key === 'Enter' && handleCreateCollection()}
                />
                <button
                  onClick={handleCreateCollection}
                  className="px-3 py-1.5 bg-[var(--color-accent)] text-white text-xs rounded-lg font-body"
                >
                  +
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="flex border-b border-[var(--color-border)] mb-6">
        {(['article', 'exercises'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-5 py-2.5 text-sm font-body transition-all border-b-2 -mb-px ${
              activeTab === tab
                ? 'border-[var(--color-accent)] text-[var(--color-accent)]'
                : 'border-transparent text-[var(--color-muted)] hover:text-[var(--color-text)]'
            }`}
          >
            {tab === 'article' ? 'Статья' : `Упражнения (${phrase.exercises.length})`}
            {tab === 'exercises' && stats && stats.total > 0 && (
              <span className="ml-2 text-[10px] px-1.5 py-0.5 rounded-full bg-[var(--color-accent-light)] text-[var(--color-accent)]">
                {stats.percent}%
              </span>
            )}
          </button>
        ))}
      </div>

      {activeTab === 'article' && (
        <div className="space-y-6">
          <section className="p-5 rounded-2xl bg-[var(--color-card)] border border-[var(--color-border)]">
            <div className="font-body text-xs uppercase tracking-wider text-[var(--color-muted)] mb-2">Значение</div>
            <p className="font-body text-base text-[var(--color-text)] leading-relaxed">{phrase.meaning}</p>
          </section>

          <section className="p-5 rounded-2xl bg-[var(--color-card)] border border-[var(--color-border)]">
            <div className="font-body text-xs uppercase tracking-wider text-[var(--color-muted)] mb-3">Грамматика</div>
            <p className="font-body text-sm text-[var(--color-text)] leading-relaxed mb-3">{phrase.grammar}</p>
            <div className="font-body text-xs uppercase tracking-wider text-[var(--color-muted)] mb-2">Грамматические формы</div>
            <div className="flex flex-wrap gap-2">
              {phrase.forms.map((f) => (
                <span key={f} className="font-body text-sm px-3 py-1 rounded-full bg-[var(--color-surface)] text-[var(--color-text)] border border-[var(--color-border)]">
                  {f}
                </span>
              ))}
            </div>
          </section>

          <section className="p-5 rounded-2xl bg-[var(--color-card)] border border-[var(--color-border)]">
            <div className="font-body text-xs uppercase tracking-wider text-[var(--color-muted)] mb-3 flex items-center gap-2">
              <Icon name="BookOpen" size={14} />
              Иллюстративные контексты
            </div>
            <ol className="space-y-3">
              {phrase.examples.map((ex, i) => (
                <li key={i} className="flex gap-3">
                  <span className="font-display text-[var(--color-accent)] font-bold shrink-0">{i + 1}.</span>
                  <p className="font-body text-sm text-[var(--color-text)] leading-relaxed italic">{ex}</p>
                </li>
              ))}
            </ol>
          </section>

          <section className="p-5 rounded-2xl bg-[var(--color-card)] border border-[var(--color-border)]">
            <div className="font-body text-xs uppercase tracking-wider text-[var(--color-muted)] mb-2">Этимология</div>
            <p className="font-body text-sm text-[var(--color-text)] leading-relaxed">{phrase.etymology}</p>
            {phrase.imageCaption && (
              <div className="mt-3 p-3 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)]">
                <Icon name="Image" size={14} className="text-[var(--color-muted)] inline mr-2" />
                <span className="text-xs font-body text-[var(--color-muted)] italic">{phrase.imageCaption}</span>
              </div>
            )}
          </section>

          {(phrase.synonyms.length > 0 || phrase.antonyms.length > 0) && (
            <section className="p-5 rounded-2xl bg-[var(--color-card)] border border-[var(--color-border)]">
              <div className="grid sm:grid-cols-2 gap-5">
                {phrase.synonyms.length > 0 && (
                  <div>
                    <div className="font-body text-xs uppercase tracking-wider text-[var(--color-muted)] mb-2">Синонимы</div>
                    <div className="flex flex-wrap gap-2">
                      {phrase.synonyms.map((s) => {
                        const linked = PHRASEOLOGISMS.find((p) => p.title === s);
                        return linked ? (
                          <button
                            key={s}
                            onClick={() => onNav('article', linked.id)}
                            className="font-body text-sm px-3 py-1 rounded-full border border-[var(--color-accent)] text-[var(--color-accent)] hover:bg-[var(--color-accent)] hover:text-white transition-all"
                          >
                            {s}
                          </button>
                        ) : (
                          <span key={s} className="font-body text-sm px-3 py-1 rounded-full bg-[var(--color-surface)] text-[var(--color-text)] border border-[var(--color-border)]">
                            {s}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                )}
                {phrase.antonyms.length > 0 && (
                  <div>
                    <div className="font-body text-xs uppercase tracking-wider text-[var(--color-muted)] mb-2">Антонимы</div>
                    <div className="flex flex-wrap gap-2">
                      {phrase.antonyms.map((a) => {
                        const linked = PHRASEOLOGISMS.find((p) => p.title === a);
                        return linked ? (
                          <button
                            key={a}
                            onClick={() => onNav('article', linked.id)}
                            className="font-body text-sm px-3 py-1 rounded-full border border-[var(--color-border)] text-[var(--color-muted)] hover:border-[var(--color-text)] hover:text-[var(--color-text)] transition-all"
                          >
                            {a}
                          </button>
                        ) : (
                          <span key={a} className="font-body text-sm px-3 py-1 rounded-full bg-[var(--color-surface)] text-[var(--color-muted)] border border-[var(--color-border)]">
                            {a}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </section>
          )}

          {relatedPhrases.length > 0 && (
            <section className="p-5 rounded-2xl bg-[var(--color-card)] border border-[var(--color-border)]">
              <div className="font-body text-xs uppercase tracking-wider text-[var(--color-muted)] mb-3">Тематически связанные</div>
              <div className="space-y-2">
                {relatedPhrases.map((rp) => rp && (
                  <button
                    key={rp.id}
                    onClick={() => onNav('article', rp.id)}
                    className="w-full text-left flex items-center justify-between p-3 rounded-xl hover:bg-[var(--color-surface)] border border-transparent hover:border-[var(--color-border)] transition-all group"
                  >
                    <div>
                      <span className="font-display font-bold text-sm text-[var(--color-text)] group-hover:text-[var(--color-accent)] transition-colors">
                        {rp.title}
                      </span>
                      <span className="font-body text-xs text-[var(--color-muted)] ml-2">{rp.meaning.slice(0, 50)}…</span>
                    </div>
                    <Icon name="ChevronRight" size={16} className="text-[var(--color-muted)] group-hover:text-[var(--color-accent)] transition-colors shrink-0" />
                  </button>
                ))}
              </div>
            </section>
          )}

          {phrase.situations.length > 0 && (
            <section className="p-5 rounded-2xl bg-[var(--color-card)] border border-[var(--color-border)]">
              <div className="font-body text-xs uppercase tracking-wider text-[var(--color-muted)] mb-2">Ситуации употребления</div>
              <div className="flex flex-wrap gap-2">
                {phrase.situations.map((s) => (
                  <span key={s} className="font-body text-xs px-3 py-1.5 rounded-full bg-[var(--color-surface)] text-[var(--color-text)] border border-[var(--color-border)]">
                    {s}
                  </span>
                ))}
              </div>
            </section>
          )}

          <section className="p-5 rounded-2xl bg-[var(--color-card)] border border-[var(--color-border)]">
            <div className="flex items-center justify-between mb-3">
              <div className="font-body text-xs uppercase tracking-wider text-[var(--color-muted)] flex items-center gap-2">
                <Icon name="NotebookPen" size={14} />
                Мои заметки
              </div>
              {!editingNote && (
                <button
                  onClick={() => { setEditingNote(true); setNoteText(note); }}
                  className="text-xs text-[var(--color-accent)] font-body hover:underline"
                >
                  {note ? 'Редактировать' : 'Добавить заметку'}
                </button>
              )}
            </div>
            {editingNote ? (
              <div>
                <textarea
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                  placeholder="Добавьте личные примеры, ассоциации или примечания…"
                  rows={3}
                  className="w-full font-body text-sm px-3 py-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text)] focus:outline-none focus:border-[var(--color-accent)] resize-none"
                />
                <div className="flex gap-2 mt-2">
                  <button onClick={handleSaveNote} className="px-4 py-1.5 bg-[var(--color-accent)] text-white text-xs rounded-lg font-body">
                    Сохранить
                  </button>
                  <button onClick={() => setEditingNote(false)} className="px-4 py-1.5 text-[var(--color-muted)] text-xs font-body hover:text-[var(--color-text)]">
                    Отмена
                  </button>
                </div>
              </div>
            ) : note ? (
              <p className="font-body text-sm text-[var(--color-text)] leading-relaxed whitespace-pre-wrap">{note}</p>
            ) : (
              <p className="font-body text-sm text-[var(--color-muted)] italic">Заметок пока нет</p>
            )}
          </section>
        </div>
      )}

      {activeTab === 'exercises' && (
        <ExerciseBlock phraseId={phrase.id} exercises={phrase.exercises} />
      )}
    </div>
  );
}
