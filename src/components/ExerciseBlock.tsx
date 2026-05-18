import { useState } from 'react';
import Icon from '@/components/ui/icon';
import { type Exercise } from '@/data/phraseology';
import { addExerciseResult } from '@/data/userStore';

interface ExerciseBlockProps {
  phraseId: string;
  exercises: Exercise[];
}

type State = 'idle' | 'correct' | 'wrong';

function SingleExercise({ phraseId, ex, onDone }: { phraseId: string; ex: Exercise; onDone: (correct: boolean) => void }) {
  const [selected, setSelected] = useState<number | null>(null);
  const [state, setState] = useState<State>('idle');
  const [showHint, setShowHint] = useState(false);

  const handleSelect = (idx: number) => {
    if (state !== 'idle') return;
    setSelected(idx);
    const correct = idx === ex.correct;
    setState(correct ? 'correct' : 'wrong');
    addExerciseResult({ phraseologismId: phraseId, exerciseId: ex.id, correct, timestamp: Date.now() });
    onDone(correct);
  };

  const typeLabel: Record<Exercise['type'], string> = {
    fill: 'Вставьте пропущенный компонент',
    choice: 'Выберите правильный вариант',
    match: 'Соотнесите значение',
    transform: 'Трансформационное задание',
  };

  return (
    <div className={`rounded-2xl border p-5 transition-all ${
      state === 'correct' ? 'border-green-300 bg-green-50' :
      state === 'wrong' ? 'border-red-200 bg-red-50' :
      'border-[var(--color-border)] bg-[var(--color-card)]'
    }`}>
      <div className="font-body text-[10px] uppercase tracking-wider text-[var(--color-muted)] mb-2">
        {typeLabel[ex.type]}
      </div>
      <p className="font-body text-sm font-medium text-[var(--color-text)] mb-4 leading-relaxed">{ex.question}</p>
      <div className="space-y-2">
        {ex.options?.map((opt, idx) => {
          const isCorrect = idx === ex.correct;
          const isSelected = idx === selected;
          let btnClass = 'border-[var(--color-border)] text-[var(--color-text)] hover:border-[var(--color-accent)]';
          if (state !== 'idle') {
            if (isCorrect) btnClass = 'border-green-400 bg-green-100 text-green-800';
            else if (isSelected && !isCorrect) btnClass = 'border-red-400 bg-red-100 text-red-700';
            else btnClass = 'border-[var(--color-border)] text-[var(--color-muted)] opacity-60';
          }
          return (
            <button
              key={idx}
              onClick={() => handleSelect(idx)}
              className={`w-full text-left text-sm font-body px-4 py-2.5 rounded-xl border transition-all flex items-center gap-3 ${btnClass} ${state === 'idle' ? 'cursor-pointer' : 'cursor-default'}`}
            >
              {state !== 'idle' && isCorrect && <Icon name="CheckCircle2" size={16} className="text-green-600 shrink-0" />}
              {state !== 'idle' && isSelected && !isCorrect && <Icon name="XCircle" size={16} className="text-red-500 shrink-0" />}
              {(state === 'idle' || (!isCorrect && !isSelected)) && (
                <span className="w-4 h-4 rounded-full border border-current shrink-0 text-[10px] flex items-center justify-center font-bold">
                  {String.fromCharCode(65 + idx)}
                </span>
              )}
              {opt}
            </button>
          );
        })}
      </div>
      {state === 'correct' && (
        <div className="mt-3 flex items-start gap-2 p-3 rounded-xl bg-green-100 border border-green-200">
          <Icon name="CheckCircle2" size={16} className="text-green-600 mt-0.5 shrink-0" />
          <p className="font-body text-sm text-green-800">{ex.explanation}</p>
        </div>
      )}
      {state === 'wrong' && (
        <div className="mt-3 space-y-2">
          <div className="flex items-start gap-2 p-3 rounded-xl bg-red-50 border border-red-200">
            <Icon name="AlertCircle" size={16} className="text-red-500 mt-0.5 shrink-0" />
            <div>
              <p className="font-body text-sm text-red-700 font-medium mb-1">Не совсем верно.</p>
              <p className="font-body text-sm text-red-600">{ex.explanation}</p>
            </div>
          </div>
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
        </div>
      )}
    </div>
  );
}

export default function ExerciseBlock({ phraseId, exercises }: ExerciseBlockProps) {
  const [results, setResults] = useState<boolean[]>([]);
  const [resetKey, setResetKey] = useState(0);

  const handleDone = (correct: boolean) => {
    setResults((prev) => [...prev, correct]);
  };

  const allDone = results.length === exercises.length;
  const score = results.filter(Boolean).length;

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center justify-between mb-2">
        <div className="font-body text-xs text-[var(--color-muted)]">
          Выполнено: {results.length} / {exercises.length}
        </div>
        {results.length > 0 && (
          <button
            onClick={() => { setResults([]); setResetKey((k) => k + 1); }}
            className="text-xs text-[var(--color-accent)] font-body hover:underline flex items-center gap-1"
          >
            <Icon name="RotateCcw" size={12} />
            Начать заново
          </button>
        )}
      </div>

      <div key={resetKey} className="space-y-4">
        {exercises.map((ex, i) => (
          <SingleExercise key={ex.id} phraseId={phraseId} ex={ex} onDone={(c) => { if (i === results.length) handleDone(c); }} />
        ))}
      </div>

      {allDone && (
        <div className={`p-5 rounded-2xl border text-center animate-fade-in ${
          score === exercises.length ? 'border-green-300 bg-green-50' :
          score >= exercises.length / 2 ? 'border-amber-300 bg-amber-50' :
          'border-red-200 bg-red-50'
        }`}>
          <div className="text-2xl mb-2">
            {score === exercises.length ? '🎉' : score >= exercises.length / 2 ? '👍' : '📚'}
          </div>
          <div className="font-display text-xl font-bold text-[var(--color-text)] mb-1">
            {score} / {exercises.length}
          </div>
          <p className="font-body text-sm text-[var(--color-muted)]">
            {score === exercises.length
              ? 'Отлично! Все задания выполнены верно.'
              : score >= exercises.length / 2
              ? 'Хороший результат! Повторите статью и попробуйте снова.'
              : 'Рекомендуем перечитать статью и грамматический комментарий.'}
          </p>
        </div>
      )}
    </div>
  );
}
