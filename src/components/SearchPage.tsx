import { useState, useMemo, useEffect } from 'react';
import Icon from '@/components/ui/icon';
import {
  PHRASEOLOGISMS, THEMES, STYLES, SITUATIONS,
  searchPhraseologisms, filterPhraseologisms,
  type ThemeTag, type StyleTag,
} from '@/data/phraseology';

interface SearchPageProps {
  initialQuery?: string;
  onNav: (page: string, data?: string) => void;
}

export default function SearchPage({ initialQuery = '', onNav }: SearchPageProps) {
  const [query, setQuery] = useState('');
  const [selectedThemes, setSelectedThemes] = useState<ThemeTag[]>([]);
  const [selectedStyles, setSelectedStyles] = useState<StyleTag[]>([]);
  const [selectedSituations, setSelectedSituations] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    if (initialQuery?.startsWith('theme:')) {
      const theme = initialQuery.replace('theme:', '') as ThemeTag;
      setSelectedThemes([theme]);
      setShowFilters(true);
    } else if (initialQuery) {
      setQuery(initialQuery);
    }
  }, [initialQuery]);

  const results = useMemo(() => {
    const searched = searchPhraseologisms(query);
    return filterPhraseologisms(searched, selectedThemes, selectedStyles, selectedSituations);
  }, [query, selectedThemes, selectedStyles, selectedSituations]);

  const toggleTheme = (t: ThemeTag) =>
    setSelectedThemes((prev) => prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]);
  const toggleStyle = (s: StyleTag) =>
    setSelectedStyles((prev) => prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]);
  const toggleSit = (s: string) =>
    setSelectedSituations((prev) => prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]);

  const hasFilters = selectedThemes.length + selectedStyles.length + selectedSituations.length > 0;
  const clearAll = () => { setSelectedThemes([]); setSelectedStyles([]); setSelectedSituations([]); setQuery(''); };

  return (
    <div className="animate-fade-in">
      <div className="mb-6">
        <h1 className="font-display text-3xl font-bold text-[var(--color-text)] mb-4">Поиск</h1>
        <div className="relative">
          <Icon name="Search" size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--color-muted)]" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="бить баклуши, баклуши, бил, сел в лужу…"
            className="w-full pl-11 pr-4 py-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] text-[var(--color-text)] font-body text-sm focus:outline-none focus:border-[var(--color-accent)] transition-colors placeholder:text-[var(--color-muted)]"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--color-muted)] hover:text-[var(--color-text)]"
            >
              <Icon name="X" size={16} />
            </button>
          )}
        </div>
        <p className="font-body text-xs text-[var(--color-muted)] mt-2">
          Поиск по любой форме слова: «бью баклуши», «бил», «баклуши» — всё приведёт к нужной статье
        </p>
      </div>

      <div className="mb-6">
        <div className="flex items-center gap-3 mb-3">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-4 py-2 rounded-full border text-sm font-body transition-all ${
              hasFilters
                ? 'border-[var(--color-accent)] bg-[var(--color-accent-light)] text-[var(--color-accent)]'
                : 'border-[var(--color-border)] text-[var(--color-muted)] hover:text-[var(--color-text)]'
            }`}
          >
            <Icon name="SlidersHorizontal" size={14} />
            Фильтры
            {hasFilters && (
              <span className="bg-[var(--color-accent)] text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center">
                {selectedThemes.length + selectedStyles.length + selectedSituations.length}
              </span>
            )}
          </button>
          {hasFilters && (
            <button onClick={clearAll} className="text-xs text-[var(--color-muted)] hover:text-[var(--color-text)] font-body underline">
              Сбросить всё
            </button>
          )}
          <span className="ml-auto text-xs text-[var(--color-muted)] font-body">
            {results.length} из {PHRASEOLOGISMS.length}
          </span>
        </div>

        {showFilters && (
          <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] p-4 animate-fade-in">
            <div className="grid md:grid-cols-3 gap-5">
              <div>
                <div className="font-body text-xs uppercase tracking-wider text-[var(--color-muted)] mb-2">Тематика</div>
                <div className="flex flex-col gap-1">
                  {THEMES.map((t) => (
                    <button
                      key={t}
                      onClick={() => toggleTheme(t)}
                      className={`text-left text-sm font-body px-3 py-1.5 rounded-lg transition-all ${
                        selectedThemes.includes(t)
                          ? 'bg-[var(--color-accent)] text-white'
                          : 'text-[var(--color-text)] hover:bg-[var(--color-surface)]'
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <div className="font-body text-xs uppercase tracking-wider text-[var(--color-muted)] mb-2">Стиль</div>
                <div className="flex flex-col gap-1">
                  {STYLES.map((s) => (
                    <button
                      key={s}
                      onClick={() => toggleStyle(s)}
                      className={`text-left text-sm font-body px-3 py-1.5 rounded-lg transition-all capitalize ${
                        selectedStyles.includes(s)
                          ? 'bg-[var(--color-accent)] text-white'
                          : 'text-[var(--color-text)] hover:bg-[var(--color-surface)]'
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <div className="font-body text-xs uppercase tracking-wider text-[var(--color-muted)] mb-2">Ситуация</div>
                <div className="flex flex-col gap-1 max-h-48 overflow-y-auto">
                  {SITUATIONS.slice(0, 12).map((s) => (
                    <button
                      key={s}
                      onClick={() => toggleSit(s)}
                      className={`text-left text-sm font-body px-3 py-1.5 rounded-lg transition-all ${
                        selectedSituations.includes(s)
                          ? 'bg-[var(--color-accent)] text-white'
                          : 'text-[var(--color-text)] hover:bg-[var(--color-surface)]'
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="space-y-3">
        {results.length === 0 && (
          <div className="text-center py-12">
            <Icon name="SearchX" size={40} className="text-[var(--color-muted)] mx-auto mb-3" />
            <p className="font-body text-[var(--color-muted)]">Ничего не найдено. Попробуйте другой запрос.</p>
          </div>
        )}
        {results.map((p) => (
          <button
            key={p.id}
            onClick={() => onNav('article', p.id)}
            className="w-full text-left p-5 rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] hover:border-[var(--color-accent)] hover:shadow-sm transition-all group"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <span className="font-display text-lg font-bold text-[var(--color-text)] group-hover:text-[var(--color-accent)] transition-colors">
                    {p.title}
                  </span>
                  <span className="text-[10px] uppercase tracking-wider font-body px-2 py-0.5 rounded-full bg-[var(--color-surface)] text-[var(--color-muted)]">
                    {p.style}
                  </span>
                </div>
                <p className="font-body text-sm text-[var(--color-muted)] mb-2 line-clamp-1">{p.meaning}</p>
                <div className="flex flex-wrap gap-1">
                  {p.themes.map((t) => (
                    <span key={t} className="text-[10px] font-body px-2 py-0.5 rounded-full bg-[var(--color-accent-light)] text-[var(--color-accent)]">
                      {t}
                    </span>
                  ))}
                </div>
              </div>
              <Icon name="ChevronRight" size={18} className="text-[var(--color-muted)] group-hover:text-[var(--color-accent)] shrink-0 mt-1 transition-colors" />
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
