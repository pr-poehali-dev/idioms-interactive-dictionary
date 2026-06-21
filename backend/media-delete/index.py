import json
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
    Удаляет медиафайл из S3 по указанному ключу.
    Принимает DELETE или POST запрос с телом {"key": "phraseology/..."}.
    Возвращает {"success": True} при успешном удалении.
    """
    if event.get("httpMethod") == "OPTIONS":
        return {
            "statusCode": 200,
            "headers": CORS_HEADERS,
            "body": "",
        }

    body = json.loads(event.get("body") or "{}")
    s3_key = body["key"]

    s3 = boto3.client(
        "s3",
        endpoint_url=S3_ENDPOINT,
        aws_access_key_id=os.environ["AWS_ACCESS_KEY_ID"],
        aws_secret_access_key=os.environ["AWS_SECRET_ACCESS_KEY"],
        config=Config(signature_version="s3v4"),
    )

    try:
        s3.delete_object(Bucket=S3_BUCKET, Key=s3_key)
    except Exception as e:
        return {
            "statusCode": 500,
            "headers": {**CORS_HEADERS, "Content-Type": "application/json"},
            "body": json.dumps({"success": False, "error": str(e)}),
        }

    return {
        "statusCode": 200,
        "headers": {**CORS_HEADERS, "Content-Type": "application/json"},
        "body": json.dumps({"success": True}),
    }
