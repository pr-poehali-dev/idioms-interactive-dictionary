const URLS = {
  upload: 'https://functions.poehali.dev/07f2f44b-2c49-4f16-a8d2-143dfaa08c66',
  list: 'https://functions.poehali.dev/414b245a-8366-4f48-aaf1-e4d73ea27c39',
  delete: 'https://functions.poehali.dev/2d74b103-2549-4d9f-a4f4-53987772fa09',
};

export type MediaType = 'audio' | 'video' | 'image';

export interface MediaFile {
  id: number;
  phrase_id: string;
  media_type: MediaType;
  url: string;
  title: string;
}

export async function addMedia(
  phraseId: string,
  mediaType: MediaType,
  url: string,
  title: string
): Promise<{ id: number }> {
  const res = await fetch(URLS.upload, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phrase_id: phraseId, media_type: mediaType, url, title }),
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.error || 'Ошибка сохранения');
  return { id: data.id };
}

export async function listMedia(phraseId?: string): Promise<MediaFile[]> {
  const url = phraseId ? `${URLS.list}?phrase_id=${encodeURIComponent(phraseId)}` : URLS.list;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();
  return data.files || [];
}

export async function deleteMedia(id: number): Promise<void> {
  const res = await fetch(URLS.delete, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id }),
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.error || 'Ошибка удаления');
}
