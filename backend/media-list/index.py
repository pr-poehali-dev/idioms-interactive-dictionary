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
    Возвращает список медиафайлов для указанного phrase_id из S3.
    Если phrase_id не передан, возвращает все файлы из раздела phraseology/.
    Каждый элемент содержит phrase_id, media_type, filename, CDN-ссылку и S3-ключ.
    """
    if event.get("httpMethod") == "OPTIONS":
        return {
            "statusCode": 200,
            "headers": CORS_HEADERS,
            "body": "",
        }

    query_params = event.get("queryStringParameters") or {}
    phrase_id = query_params.get("phrase_id", "").strip()

    prefix = f"phraseology/{phrase_id}/" if phrase_id else "phraseology/"

    access_key = os.environ["AWS_ACCESS_KEY_ID"]

    s3 = boto3.client(
        "s3",
        endpoint_url=S3_ENDPOINT,
        aws_access_key_id=access_key,
        aws_secret_access_key=os.environ["AWS_SECRET_ACCESS_KEY"],
        config=Config(signature_version="s3v4"),
    )

    try:
        paginator = s3.get_paginator("list_objects_v2")
        pages = paginator.paginate(Bucket=S3_BUCKET, Prefix=prefix)

        files = []
        for page in pages:
            for obj in page.get("Contents", []):
                key = obj["Key"]
                # key format: phraseology/{phrase_id}/{media_type}/{filename}
                parts = key.split("/")
                if len(parts) < 4:
                    continue
                parsed_phrase_id = parts[1]
                parsed_media_type = parts[2]
                parsed_filename = "/".join(parts[3:])
                cdn_url = (
                    f"https://cdn.poehali.dev/projects/{access_key}"
                    f"/bucket/phraseology/{parsed_phrase_id}"
                    f"/{parsed_media_type}/{parsed_filename}"
                )
                files.append(
                    {
                        "phrase_id": parsed_phrase_id,
                        "media_type": parsed_media_type,
                        "filename": parsed_filename,
                        "url": cdn_url,
                        "key": key,
                    }
                )
    except Exception as e:
        return {
            "statusCode": 500,
            "headers": {**CORS_HEADERS, "Content-Type": "application/json"},
            "body": json.dumps({"files": [], "error": str(e)}),
        }

    return {
        "statusCode": 200,
        "headers": {**CORS_HEADERS, "Content-Type": "application/json"},
        "body": json.dumps({"files": files}),
    }
