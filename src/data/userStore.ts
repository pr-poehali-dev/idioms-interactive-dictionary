export interface ExerciseResult {
  phraseologismId: string;
  exerciseId: string;
  correct: boolean;
  timestamp: number;
}

export interface UserNote {
  phraseologismId: string;
  text: string;
  timestamp: number;
}

export interface UserCollection {
  id: string;
  name: string;
  phraseologismIds: string[];
  createdAt: number;
}

export interface UserData {
  history: string[];
  results: ExerciseResult[];
  notes: UserNote[];
  collections: UserCollection[];
}

const STORAGE_KEY = 'phraseology_user_data';

function load(): UserData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.warn('Failed to load user data', e);
  }
  return { history: [], results: [], notes: [], collections: [] };
}

function save(data: UserData) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function addToHistory(id: string) {
  const data = load();
  data.history = [id, ...data.history.filter((h) => h !== id)].slice(0, 50);
  save(data);
}

export function getHistory(): string[] {
  return load().history;
}

export function addExerciseResult(result: ExerciseResult) {
  const data = load();
  data.results.push(result);
  save(data);
}

export function getResults(): ExerciseResult[] {
  return load().results;
}

export function getStatsForPhrase(phraseId: string) {
  const results = load().results.filter((r) => r.phraseologismId === phraseId);
  const total = results.length;
  const correct = results.filter((r) => r.correct).length;
  return { total, correct, percent: total > 0 ? Math.round((correct / total) * 100) : null };
}

export function getNoteForPhrase(phraseId: string): string {
  const data = load();
  return data.notes.find((n) => n.phraseologismId === phraseId)?.text ?? '';
}

export function saveNote(phraseId: string, text: string) {
  const data = load();
  const idx = data.notes.findIndex((n) => n.phraseologismId === phraseId);
  if (idx >= 0) {
    data.notes[idx] = { phraseologismId: phraseId, text, timestamp: Date.now() };
  } else {
    data.notes.push({ phraseologismId: phraseId, text, timestamp: Date.now() });
  }
  save(data);
}

export function getCollections(): UserCollection[] {
  return load().collections;
}

export function createCollection(name: string) {
  const data = load();
  data.collections.push({ id: Date.now().toString(), name, phraseologismIds: [], createdAt: Date.now() });
  save(data);
}

export function addToCollection(collectionId: string, phraseId: string) {
  const data = load();
  const col = data.collections.find((c) => c.id === collectionId);
  if (col && !col.phraseologismIds.includes(phraseId)) {
    col.phraseologismIds.push(phraseId);
    save(data);
  }
}

export function removeFromCollection(collectionId: string, phraseId: string) {
  const data = load();
  const col = data.collections.find((c) => c.id === collectionId);
  if (col) {
    col.phraseologismIds = col.phraseologismIds.filter((id) => id !== phraseId);
    save(data);
  }
}

export function deleteCollection(collectionId: string) {
  const data = load();
  data.collections = data.collections.filter((c) => c.id !== collectionId);
  save(data);
}

export function getAllNotes(): UserNote[] {
  return load().notes.filter((n) => n.text.trim());
}

export function getRecommendations(phraseId: string): string[] {
  const data = load();
  const phraseResults = data.results.filter((r) => r.phraseologismId === phraseId);
  const errors = phraseResults.filter((r) => !r.correct).length;
  if (errors < 2) return [];
  return [];
}