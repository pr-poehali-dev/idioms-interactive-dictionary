const URLS = {
  upload: 'https://functions.poehali.dev/07f2f44b-2c49-4f16-a8d2-143dfaa08c66',
  list: 'https://functions.poehali.dev/414b245a-8366-4f48-aaf1-e4d73ea27c39',
  delete: 'https://functions.poehali.dev/2d74b103-2549-4d9f-a4f4-53987772fa09',
};

export type MediaType = 'audio' | 'video' | 'image';

export interface MediaFile {
  phrase_id: string;
  media_type: MediaType;
  filename: string;
  url: string;
  key: string;
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      resolve(result.split(',')[1]);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export async function uploadMedia(
  phraseId: string,
  mediaType: MediaType,
  file: File
): Promise<{ url: string; key: string }> {
  const base64 = await fileToBase64(file);
  const res = await fetch(URLS.upload, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      phrase_id: phraseId,
      media_type: mediaType,
      filename: file.name,
      file_data: base64,
      content_type: file.type,
    }),
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.error || 'Upload failed');
  return { url: data.url, key: data.key };
}

export async function listMedia(phraseId?: string): Promise<MediaFile[]> {
  const url = phraseId ? `${URLS.list}?phrase_id=${phraseId}` : URLS.list;
  const res = await fetch(url);
  const data = await res.json();
  return data.files || [];
}

export async function deleteMedia(key: string): Promise<void> {
  const res = await fetch(URLS.delete, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ key }),
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.error || 'Delete failed');
}
