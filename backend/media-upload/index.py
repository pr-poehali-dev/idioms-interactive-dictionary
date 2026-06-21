import json
import base64
import os
import boto3
from botocore.client import Config


CORS_HEADERS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, X-User-Id",
}

S3_ENDPOINT = "https://bucket.poehali.dev"
S3_BUCKET = "files"


def handler(event: dict, context) -> dict:
    """
    Загружает медиафайл (аудио/видео/изображение) в S3.
    Принимает файл в формате base64 через тело JSON-запроса.
    Возвращает CDN-ссылку на загруженный файл и его S3-ключ.
    """
    if event.get("httpMethod") == "OPTIONS":
        return {
            "statusCode": 200,
            "headers": CORS_HEADERS,
            "body": "",
        }

    body = json.loads(event.get("body") or "{}")

    phrase_id = body["phrase_id"]
    media_type = body["media_type"]
    filename = body["filename"]
    file_data = body["file_data"]
    content_type = body["content_type"]

    file_bytes = base64.b64decode(file_data)

    s3_key = f"phraseology/{phrase_id}/{media_type}/{filename}"
    access_key = os.environ["AWS_ACCESS_KEY_ID"]
    cdn_url = (
        f"https://cdn.poehali.dev/projects/{access_key}"
        f"/bucket/phraseology/{phrase_id}/{media_type}/{filename}"
    )

    s3 = boto3.client(
        "s3",
        endpoint_url=S3_ENDPOINT,
        aws_access_key_id=access_key,
        aws_secret_access_key=os.environ["AWS_SECRET_ACCESS_KEY"],
        config=Config(signature_version="s3v4"),
    )

    try:
        s3.put_object(
            Bucket=S3_BUCKET,
            Key=s3_key,
            Body=file_bytes,
            ContentType=content_type,
        )
    except Exception as e:
        return {
            "statusCode": 500,
            "headers": {**CORS_HEADERS, "Content-Type": "application/json"},
            "body": json.dumps({"success": False, "error": str(e)}),
        }

    return {
        "statusCode": 200,
        "headers": {**CORS_HEADERS, "Content-Type": "application/json"},
        "body": json.dumps({"success": True, "url": cdn_url, "key": s3_key}),
    }
