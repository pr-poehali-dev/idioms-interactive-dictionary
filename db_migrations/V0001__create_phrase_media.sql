CREATE TABLE t_p31110856_idioms_interactive_d.phrase_media (
    id SERIAL PRIMARY KEY,
    phrase_id TEXT NOT NULL,
    media_type TEXT NOT NULL CHECK (media_type IN ('audio', 'video', 'image')),
    url TEXT NOT NULL,
    title TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);