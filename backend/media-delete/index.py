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
    """Удаляет медиа-ссылку из БД по id."""
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": CORS_HEADERS, "body": ""}

    body = json.loads(event.get("body") or "{}")
    media_id = body.get("id")

    if not media_id:
        return {
            "statusCode": 400,
            "headers": {**CORS_HEADERS, "Content-Type": "application/json"},
            "body": json.dumps({"success": False, "error": "id обязателен"}),
        }

    conn = psycopg2.connect(os.environ["DATABASE_URL"])
    cur = conn.cursor()
    cur.execute(f"DELETE FROM {SCHEMA}.phrase_media WHERE id = %s", (media_id,))
    conn.commit()
    cur.close()
    conn.close()

    return {
        "statusCode": 200,
        "headers": {**CORS_HEADERS, "Content-Type": "application/json"},
        "body": json.dumps({"success": True}),
    }
