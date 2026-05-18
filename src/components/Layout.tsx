import { useState } from 'react';
import Icon from '@/components/ui/icon';

interface LayoutProps {
  children: React.ReactNode;
  page: string;
  onNav: (page: string, data?: string) => void;
}

export default function Layout({ children, page, onNav }: LayoutProps) {
  const [menuOpen, setMenuOpen] = useState(false);

  const navItems = [
    { id: 'home', label: 'Главная', icon: 'BookOpen' },
    { id: 'search', label: 'Поиск', icon: 'Search' },
    { id: 'exercises', label: 'Упражнения', icon: 'PenLine' },
    { id: 'cabinet', label: 'Кабинет', icon: 'User' },
  ];

  return (
    <div className="min-h-screen bg-[var(--color-bg)] text-[var(--color-text)]">
      <header className="sticky top-0 z-50 bg-[var(--color-bg)] border-b border-[var(--color-border)]">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <button
            onClick={() => onNav('home')}
            className="flex items-center gap-2 hover:opacity-70 transition-opacity"
          >
            <span className="text-[var(--color-accent)] font-display text-xl font-bold tracking-tight">
              Фразеологизмы
            </span>
            <span className="text-[var(--color-muted)] text-xs font-body uppercase tracking-widest hidden sm:block">
              Словарь
            </span>
          </button>

          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => onNav(item.id)}
                className={`px-4 py-1.5 rounded-full text-sm font-body transition-all ${
                  page === item.id
                    ? 'bg-[var(--color-accent)] text-white'
                    : 'text-[var(--color-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-surface)]'
                }`}
              >
                {item.label}
              </button>
            ))}
          </nav>

          <button
            className="md:hidden p-2 rounded-lg hover:bg-[var(--color-surface)] transition-colors"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            <Icon name={menuOpen ? 'X' : 'Menu'} size={20} />
          </button>
        </div>

        {menuOpen && (
          <div className="md:hidden border-t border-[var(--color-border)] bg-[var(--color-bg)] px-4 py-2 animate-fade-in">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => { onNav(item.id); setMenuOpen(false); }}
                className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-body transition-all mb-1 ${
                  page === item.id
                    ? 'bg-[var(--color-accent)] text-white'
                    : 'text-[var(--color-text)] hover:bg-[var(--color-surface)]'
                }`}
              >
                <Icon name={item.icon} size={16} fallback="Circle" />
                {item.label}
              </button>
            ))}
          </div>
        )}
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6">
        {children}
      </main>

      <footer className="border-t border-[var(--color-border)] mt-12 py-6 text-center text-xs text-[var(--color-muted)] font-body">
        Интерактивный словарь русских фразеологизмов · для иностранных студентов
      </footer>
    </div>
  );
}
