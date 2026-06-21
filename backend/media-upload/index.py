import json
import os
import psycopg2

CORS_HEADERS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
}

SCHEMA = os.environ.get("MAIN_DB_SCHEMA", "t_p31110856_idioms_interactive_d")


def get_conn():
    return psycopg2.connect(os.environ["DATABASE_URL"])


def handler(event: dict, context) -> dict:
    """Сохраняет медиа-ссылку (аудио/видео/изображение) для фразеологизма в БД."""
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": CORS_HEADERS, "body": ""}

    body = json.loads(event.get("body") or "{}")
    phrase_id = body.get("phrase_id", "").strip()
    media_type = body.get("media_type", "").strip()
    url = body.get("url", "").strip()
    title = body.get("title", "").strip()

    if not phrase_id or not media_type or not url:
        return {
            "statusCode": 400,
            "headers": {**CORS_HEADERS, "Content-Type": "application/json"},
            "body": json.dumps({"success": False, "error": "phrase_id, media_type и url обязательны"}),
        }

    if media_type not in ("audio", "video", "image"):
        return {
            "statusCode": 400,
            "headers": {**CORS_HEADERS, "Content-Type": "application/json"},
            "body": json.dumps({"success": False, "error": "media_type должен быть audio, video или image"}),
        }

    conn = get_conn()
    cur = conn.cursor()
    cur.execute(
        f"INSERT INTO {SCHEMA}.phrase_media (phrase_id, media_type, url, title) VALUES (%s, %s, %s, %s) RETURNING id",
        (phrase_id, media_type, url, title or None),
    )
    new_id = cur.fetchone()[0]
    conn.commit()
    cur.close()
    conn.close()

    return {
        "statusCode": 200,
        "headers": {**CORS_HEADERS, "Content-Type": "application/json"},
        "body": json.dumps({"success": True, "id": new_id}),
    }
