import { useState } from 'react';
import Icon from '@/components/ui/icon';
import { PHRASEOLOGISMS } from '@/data/phraseology';
import { type Exercise } from '@/data/phraseology';
import { addExerciseResult, getResults } from '@/data/userStore';

interface AllExercise extends Exercise {
  phraseId: string;
  phraseTitle: string;
}

function buildAllExercises(): AllExercise[] {
  const result: AllExercise[] = [];
  PHRASEOLOGISMS.forEach((p) => {
    p.exercises.forEach((ex) => {
      result.push({ ...ex, phraseId: p.id, phraseTitle: p.title });
    });
  });
  return result;
}

const ALL = buildAllExercises();

type ExState = 'idle' | 'correct' | 'wrong';

export default function ExercisesPage({ onNav }: { onNav: (page: string, data?: string) => void }) {
  const [current, setCurrent] = useState(0);
  const [sessionResults, setSessionResults] = useState<boolean[]>([]);
  const [state, setState] = useState<ExState>('idle');
  const [selected, setSelected] = useState<number | null>(null);
  const [showHint, setShowHint] = useState(false);
  const [mode, setMode] = useState<'all' | 'session'>('session');
  const [sessionExs, setSessionExs] = useState<AllExercise[]>(() => {
    const shuffled = [...ALL].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, Math.min(8, shuffled.length));
  });

  const exercises = mode === 'session' ? sessionExs : ALL;
  const ex = exercises[current];
  const allResults = getResults();

  const handleSelect = (idx: number) => {
    if (state !== 'idle') return;
    setSelected(idx);
    const correct = idx === ex.correct;
    setState(correct ? 'correct' : 'wrong');
    setSessionResults((prev) => [...prev, correct]);
    addExerciseResult({ phraseologismId: ex.phraseId, exerciseId: ex.id, correct, timestamp: Date.now() });
  };

  const handleNext = () => {
    setSelected(null);
    setState('idle');
    setShowHint(false);
    setCurrent((c) => c + 1);
  };

  const handleRestart = () => {
    const shuffled = [...ALL].sort(() => Math.random() - 0.5);
    setSessionExs(shuffled.slice(0, Math.min(8, shuffled.length)));
    setCurrent(0);
    setSessionResults([]);
    setState('idle');
    setSelected(null);
    setShowHint(false);
  };

  const sessionDone = current >= exercises.length;
  const score = sessionResults.filter(Boolean).length;
  const totalDone = allResults.length;
  const totalCorrect = allResults.filter((r) => r.correct).length;

  const typeLabel: Record<Exercise['type'], string> = {
    fill: 'Вставьте пропущенный компонент',
    choice: 'Выберите правильный вариант',
    match: 'Соотнесите значение',
    transform: 'Трансформационное задание',
  };

  return (
    <div className="animate-fade-in">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="font-display text-3xl font-bold text-[var(--color-text)] mb-1">Упражнения</h1>
          <p className="font-body text-sm text-[var(--color-muted)]">
            Всего выполнено: {totalDone} · Верных: {totalDone > 0 ? Math.round((totalCorrect / totalDone) * 100) : 0}%
          </p>
        </div>
        <button
          onClick={handleRestart}
          className="flex items-center gap-1.5 px-4 py-2 border border-[var(--color-border)] rounded-full text-sm font-body text-[var(--color-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-surface)] transition-all"
        >
          <Icon name="Shuffle" size={14} />
          Новый набор
        </button>
      </div>

      {!sessionDone && ex && (
        <div className="mb-4">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex-1 h-1.5 rounded-full bg-[var(--color-surface)] overflow-hidden">
              <div
                className="h-full bg-[var(--color-accent)] rounded-full transition-all duration-500"
                style={{ width: `${((current) / exercises.length) * 100}%` }}
              />
            </div>
            <span className="font-body text-xs text-[var(--color-muted)] shrink-0">
              {current + 1} / {exercises.length}
            </span>
          </div>

          <div className={`rounded-2xl border p-6 transition-all ${
            state === 'correct' ? 'border-green-300 bg-green-50' :
            state === 'wrong' ? 'border-red-200 bg-red-50' :
            'border-[var(--color-border)] bg-[var(--color-card)]'
          }`}>
            <button
              onClick={() => onNav('article', ex.phraseId)}
              className="inline-flex items-center gap-1 text-[10px] uppercase tracking-wider font-body text-[var(--color-accent)] hover:underline mb-3"
            >
              <Icon name="BookOpen" size={12} />
              {ex.phraseTitle}
            </button>

            <div className="font-body text-[10px] uppercase tracking-wider text-[var(--color-muted)] mb-1">
              {typeLabel[ex.type]}
            </div>
            <p className="font-body text-base font-medium text-[var(--color-text)] mb-5 leading-relaxed">{ex.question}</p>

            <div className="space-y-2">
              {ex.options?.map((opt, idx) => {
                const isCorrect = idx === ex.correct;
                const isSelected = idx === selected;
                let btnClass = 'border-[var(--color-border)] text-[var(--color-text)] hover:border-[var(--color-accent)] cursor-pointer';
                if (state !== 'idle') {
                  if (isCorrect) btnClass = 'border-green-400 bg-green-100 text-green-800 cursor-default';
                  else if (isSelected && !isCorrect) btnClass = 'border-red-400 bg-red-100 text-red-700 cursor-default';
                  else btnClass = 'border-[var(--color-border)] text-[var(--color-muted)] opacity-50 cursor-default';
                }
                return (
                  <button
                    key={idx}
                    onClick={() => handleSelect(idx)}
                    className={`w-full text-left text-sm font-body px-4 py-3 rounded-xl border transition-all flex items-center gap-3 ${btnClass}`}
                  >
                    {state !== 'idle' && isCorrect && <Icon name="CheckCircle2" size={16} className="text-green-600 shrink-0" />}
                    {state !== 'idle' && isSelected && !isCorrect && <Icon name="XCircle" size={16} className="text-red-500 shrink-0" />}
                    {(state === 'idle' || (!isCorrect && !isSelected)) && (
                      <span className="w-5 h-5 rounded-full border border-current shrink-0 text-[11px] flex items-center justify-center font-bold">
                        {String.fromCharCode(65 + idx)}
                      </span>
                    )}
                    {opt}
                  </button>
                );
              })}
            </div>

            {state !== 'idle' && (
              <div className="mt-4 space-y-2">
                <div className={`flex items-start gap-2 p-3 rounded-xl ${
                  state === 'correct' ? 'bg-green-100 border border-green-200' : 'bg-red-50 border border-red-200'
                }`}>
                  <Icon name={state === 'correct' ? 'CheckCircle2' : 'AlertCircle'} size={16} className={`mt-0.5 shrink-0 ${state === 'correct' ? 'text-green-600' : 'text-red-500'}`} />
                  <p className={`font-body text-sm ${state === 'correct' ? 'text-green-800' : 'text-red-700'}`}>{ex.explanation}</p>
                </div>
                {state === 'wrong' && (
                  <>
                    <button
                      onClick={() => setShowHint(!showHint)}
                      className="text-xs text-[var(--color-accent)] font-body hover:underline flex items-center gap-1"
                    >
                      <Icon name="Lightbulb" size={12} />
                      {showHint ? 'Скрыть подсказку' : 'Показать подсказку'}
                    </button>
                    {showHint && (
                      <div className="p-3 rounded-xl bg-amber-50 border border-amber-200">
                        <p className="font-body text-sm text-amber-800">💡 {ex.hint}</p>
                      </div>
                    )}
                  </>
                )}
                <button
                  onClick={handleNext}
                  className="w-full mt-2 py-2.5 bg-[var(--color-accent)] text-white rounded-xl font-body text-sm font-medium hover:opacity-90 transition-opacity"
                >
                  {current + 1 < exercises.length ? 'Следующее задание →' : 'Завершить сессию'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {sessionDone && (
        <div className={`p-8 rounded-2xl border text-center animate-fade-in mb-6 ${
          score >= exercises.length * 0.8 ? 'border-green-300 bg-green-50' :
          score >= exercises.length * 0.5 ? 'border-amber-300 bg-amber-50' :
          'border-red-200 bg-red-50'
        }`}>
          <div className="text-4xl mb-3">
            {score >= exercises.length * 0.8 ? '🎉' : score >= exercises.length * 0.5 ? '👍' : '📚'}
          </div>
          <div className="font-display text-3xl font-bold text-[var(--color-text)] mb-1">
            {score} / {exercises.length}
          </div>
          <p className="font-body text-[var(--color-muted)] mb-5">
            {score >= exercises.length * 0.8
              ? 'Отличный результат! Вы хорошо знаете эти фразеологизмы.'
              : score >= exercises.length * 0.5
              ? 'Неплохо! Рекомендуем повторить статьи с ошибками.'
              : 'Изучите статьи внимательнее и попробуйте снова.'}
          </p>
          <button
            onClick={handleRestart}
            className="px-6 py-2.5 bg-[var(--color-accent)] text-white rounded-full font-body font-medium text-sm hover:opacity-90 transition-opacity"
          >
            Новый набор заданий
          </button>
        </div>
      )}

      <div className="mt-8">
        <h2 className="font-display text-lg font-bold text-[var(--color-text)] mb-4">Все фразеологизмы</h2>
        <div className="grid sm:grid-cols-2 gap-3">
          {PHRASEOLOGISMS.map((p) => {
            const r = allResults.filter((x) => x.phraseologismId === p.id);
            const pct = r.length > 0 ? Math.round((r.filter((x) => x.correct).length / r.length) * 100) : null;
            return (
              <button
                key={p.id}
                onClick={() => onNav('article', p.id)}
                className="text-left p-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] hover:border-[var(--color-accent)] transition-all group flex items-center justify-between"
              >
                <div>
                  <div className="font-display font-bold text-sm text-[var(--color-text)] group-hover:text-[var(--color-accent)] transition-colors">
                    {p.title}
                  </div>
                  <div className="font-body text-xs text-[var(--color-muted)] mt-0.5">{p.exercises.length} задани{p.exercises.length === 1 ? 'е' : 'я'}</div>
                </div>
                {pct !== null && (
                  <span className={`text-xs font-body px-2 py-1 rounded-full font-medium ${
                    pct >= 70 ? 'bg-green-100 text-green-700' : pct >= 40 ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'
                  }`}>
                    {pct}%
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
