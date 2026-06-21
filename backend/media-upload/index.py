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
    method = event.get("httpMethod", "")
    print(f"[media-upload] method={method}")

    if method == "OPTIONS":
        return {"statusCode": 200, "headers": CORS_HEADERS, "body": ""}

    raw_body = event.get("body") or ""
    is_base64 = event.get("isBase64Encoded", False)
    print(f"[media-upload] body_len={len(raw_body)} isBase64Encoded={is_base64}")

    try:
        if is_base64:
            raw_body = base64.b64decode(raw_body).decode("utf-8")
        body = json.loads(raw_body)
    except Exception as e:
        print(f"[media-upload] parse error: {e}")
        return {
            "statusCode": 400,
            "headers": {**CORS_HEADERS, "Content-Type": "application/json"},
            "body": json.dumps({"success": False, "error": f"parse error: {e}"}),
        }

    phrase_id = body.get("phrase_id", "")
    media_type = body.get("media_type", "")
    filename = body.get("filename", "")
    file_data = body.get("file_data", "")
    content_type = body.get("content_type", "application/octet-stream")

    print(f"[media-upload] phrase_id={phrase_id!r} media_type={media_type!r} filename={filename!r} file_data_len={len(file_data)}")

    if not phrase_id or not media_type or not filename or not file_data:
        return {
            "statusCode": 400,
            "headers": {**CORS_HEADERS, "Content-Type": "application/json"},
            "body": json.dumps({"success": False, "error": "missing required fields"}),
        }

    try:
        file_bytes = base64.b64decode(file_data)
    except Exception as e:
        print(f"[media-upload] base64 decode error: {e}")
        return {
            "statusCode": 400,
            "headers": {**CORS_HEADERS, "Content-Type": "application/json"},
            "body": json.dumps({"success": False, "error": f"base64 decode error: {e}"}),
        }

    s3_key = f"phraseology/{phrase_id}/{media_type}/{filename}"
    access_key = os.environ["AWS_ACCESS_KEY_ID"]
    cdn_url = f"https://cdn.poehali.dev/projects/{access_key}/bucket/{s3_key}"

    print(f"[media-upload] uploading to S3: bucket={S3_BUCKET} key={s3_key} size={len(file_bytes)} content_type={content_type}")

    s3 = boto3.client(
        "s3",
        endpoint_url=S3_ENDPOINT,
        aws_access_key_id=access_key,
        aws_secret_access_key=os.environ["AWS_SECRET_ACCESS_KEY"],
        config=Config(signature_version="s3v4"),
    )

    try:
        resp = s3.put_object(
            Bucket=S3_BUCKET,
            Key=s3_key,
            Body=file_bytes,
            ContentType=content_type,
        )
        print(f"[media-upload] put_object response: {resp.get('ResponseMetadata', {}).get('HTTPStatusCode')}")
    except Exception as e:
        print(f"[media-upload] S3 error: {e}")
        return {
            "statusCode": 500,
            "headers": {**CORS_HEADERS, "Content-Type": "application/json"},
            "body": json.dumps({"success": False, "error": str(e)}),
        }

    print(f"[media-upload] success: {cdn_url}")
    return {
        "statusCode": 200,
        "headers": {**CORS_HEADERS, "Content-Type": "application/json"},
        "body": json.dumps({"success": True, "url": cdn_url, "key": s3_key}),
    }
