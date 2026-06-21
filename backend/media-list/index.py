import json
import os
import psycopg2

CORS_HEADERS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
}

SCHEMA = os.environ.get("MAIN_DB_SCHEMA", "t_p31110856_idioms_interactive_d")


def handler(event: dict, context) -> dict:
    """Возвращает список медиа-ссылок для фразеологизма из БД."""
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": CORS_HEADERS, "body": ""}

    query_params = event.get("queryStringParameters") or {}
    phrase_id = query_params.get("phrase_id", "").strip()

    conn = psycopg2.connect(os.environ["DATABASE_URL"])
    cur = conn.cursor()

    if phrase_id:
        cur.execute(
            f"SELECT id, phrase_id, media_type, url, title FROM {SCHEMA}.phrase_media WHERE phrase_id = %s ORDER BY id",
            (phrase_id,),
        )
    else:
        cur.execute(
            f"SELECT id, phrase_id, media_type, url, title FROM {SCHEMA}.phrase_media ORDER BY phrase_id, id"
        )

    rows = cur.fetchall()
    cur.close()
    conn.close()

    files = [
        {"id": r[0], "phrase_id": r[1], "media_type": r[2], "url": r[3], "title": r[4] or ""}
        for r in rows
    ]

    return {
        "statusCode": 200,
        "headers": {**CORS_HEADERS, "Content-Type": "application/json"},
        "body": json.dumps({"files": files}),
    }
