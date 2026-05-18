import Icon from '@/components/ui/icon';
import { PHRASEOLOGISMS, THEMES } from '@/data/phraseology';

interface HomePageProps {
  onNav: (page: string, data?: string) => void;
}

const FEATURED = ['bit-baklushy', 'sest-v-luzhu', 'zarubit-na-nosu', 'kak-belka-v-kolese'];

export default function HomePage({ onNav }: HomePageProps) {
  const featured = PHRASEOLOGISMS.filter((p) => FEATURED.includes(p.id));

  return (
    <div className="animate-fade-in">
      <section className="text-center py-12 md:py-16">
        <div className="inline-block mb-4 px-3 py-1 rounded-full bg-[var(--color-accent-light)] text-[var(--color-accent)] text-xs font-body tracking-widest uppercase">
          для иностранных студентов
        </div>
        <h1 className="font-display text-4xl md:text-6xl font-bold text-[var(--color-text)] mb-4 leading-tight">
          Русские
          <br />
          <span className="text-[var(--color-accent)]">фразеологизмы</span>
        </h1>
        <p className="font-body text-[var(--color-muted)] text-lg max-w-xl mx-auto mb-8">
          Интерактивный словарь с упражнениями, гипертекстом и личным кабинетом для системного изучения устойчивых выражений русского языка.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={() => onNav('search')}
            className="px-6 py-3 bg-[var(--color-accent)] text-white rounded-full font-body font-medium text-sm hover:opacity-90 transition-opacity flex items-center gap-2 justify-center"
          >
            <Icon name="Search" size={16} />
            Найти фразеологизм
          </button>
          <button
            onClick={() => onNav('exercises')}
            className="px-6 py-3 border border-[var(--color-border)] text-[var(--color-text)] rounded-full font-body font-medium text-sm hover:bg-[var(--color-surface)] transition-colors flex items-center gap-2 justify-center"
          >
            <Icon name="PenLine" size={16} />
            Тренироваться
          </button>
        </div>
      </section>

      <section className="mb-12">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-display text-xl font-bold text-[var(--color-text)]">Избранные статьи</h2>
          <button
            onClick={() => onNav('search')}
            className="text-xs text-[var(--color-accent)] font-body hover:underline flex items-center gap-1"
          >
            Все <Icon name="ChevronRight" size={14} />
          </button>
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          {featured.map((p) => (
            <button
              key={p.id}
              onClick={() => onNav('article', p.id)}
              className="text-left p-5 rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] hover:border-[var(--color-accent)] hover:shadow-md transition-all group"
            >
              <div className="flex items-start justify-between mb-2">
                <span className="font-display text-lg font-bold text-[var(--color-text)] group-hover:text-[var(--color-accent)] transition-colors">
                  {p.title}
                </span>
                <span className="text-[10px] uppercase tracking-wider font-body px-2 py-0.5 rounded-full bg-[var(--color-surface)] text-[var(--color-muted)] ml-2 shrink-0">
                  {p.style}
                </span>
              </div>
              <p className="font-body text-sm text-[var(--color-muted)] mb-3 leading-relaxed line-clamp-2">
                {p.meaning}
              </p>
              <div className="flex flex-wrap gap-1">
                {p.themes.map((t) => (
                  <span key={t} className="text-[10px] font-body px-2 py-0.5 rounded-full bg-[var(--color-accent-light)] text-[var(--color-accent)]">
                    {t}
                  </span>
                ))}
              </div>
            </button>
          ))}
        </div>
      </section>

      <section className="mb-12">
        <h2 className="font-display text-xl font-bold text-[var(--color-text)] mb-5">Тематические рубрики</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {THEMES.map((theme, i) => {
            const icons = ['User', 'Heart', 'Briefcase', 'TrendingUp'];
            const count = PHRASEOLOGISMS.filter((p) => p.themes.includes(theme)).length;
            return (
              <button
                key={theme}
                onClick={() => onNav('search', `theme:${theme}`)}
                className="p-4 rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] hover:border-[var(--color-accent)] hover:shadow-md transition-all text-left group"
              >
                <Icon name={icons[i]} size={20} fallback="Circle" className="text-[var(--color-accent)] mb-2" />
                <div className="font-body text-sm font-medium text-[var(--color-text)] group-hover:text-[var(--color-accent)] transition-colors mb-1 leading-snug">
                  {theme}
                </div>
                <div className="font-body text-xs text-[var(--color-muted)]">{count} фразеологизм{count === 1 ? '' : 'а'}</div>
              </button>
            );
          })}
        </div>
      </section>

      <section className="rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)] p-6 md:p-8">
        <h2 className="font-display text-xl font-bold text-[var(--color-text)] mb-4">Как пользоваться словарём</h2>
        <div className="grid sm:grid-cols-3 gap-5">
          {[
            { icon: 'Search', title: 'Умный поиск', desc: 'Вводите любую форму слова — «бью баклуши», «баклуши», «бил» — система найдёт нужную статью.' },
            { icon: 'Link', title: 'Гипертекст', desc: 'Синонимы, антонимы и тематически связанные фразеологизмы — одним кликом.' },
            { icon: 'BarChart2', title: 'Личный кабинет', desc: 'История просмотров, результаты упражнений, собственные подборки и заметки.' },
          ].map((f) => (
            <div key={f.title} className="flex gap-3">
              <div className="shrink-0 w-9 h-9 rounded-xl bg-[var(--color-accent-light)] flex items-center justify-center">
                <Icon name={f.icon} size={16} fallback="Circle" className="text-[var(--color-accent)]" />
              </div>
              <div>
                <div className="font-body font-semibold text-sm text-[var(--color-text)] mb-1">{f.title}</div>
                <div className="font-body text-xs text-[var(--color-muted)] leading-relaxed">{f.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
