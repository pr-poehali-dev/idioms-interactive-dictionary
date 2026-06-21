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


def handler(event: dict, context) -> dict:
    """
    Возвращает список медиафайлов для указанного phrase_id из S3.
    Если phrase_id не передан, возвращает все файлы из раздела phraseology/.
    """
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": CORS_HEADERS, "body": ""}

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

    # Перебираем кандидатов на имя бакета
    files = []
    found_bucket = None
    for bucket in ["files", access_key, "media", "storage"]:
        try:
            resp = s3.list_objects_v2(Bucket=bucket, MaxKeys=10)
            kc = resp.get("KeyCount", 0)
            sample = [o["Key"] for o in resp.get("Contents", [])]
            print(f"[media-list] probe bucket={bucket!r} KeyCount={kc} sample={sample}")
            if kc > 0 and not found_bucket:
                found_bucket = bucket
        except Exception as e:
            print(f"[media-list] probe bucket={bucket!r} error: {type(e).__name__}: {e}")

    target = found_bucket or "files"
    print(f"[media-list] target_bucket={target!r} prefix={prefix!r}")
    try:
        resp = s3.list_objects_v2(Bucket=target, Prefix=prefix, MaxKeys=1000)
        print(f"[media-list] KeyCount={resp.get('KeyCount', 0)}")
        for obj in resp.get("Contents", []):
            key = obj["Key"]
            parts = key.split("/")
            if len(parts) < 4:
                continue
            cdn_url = f"https://cdn.poehali.dev/projects/{access_key}/bucket/{key}"
            files.append({
                "phrase_id": parts[1],
                "media_type": parts[2],
                "filename": "/".join(parts[3:]),
                "url": cdn_url,
                "key": key,
            })
    except Exception as e:
        print(f"[media-list] list error: {e}")

    print(f"[media-list] returning {len(files)} files")
    return {
        "statusCode": 200,
        "headers": {**CORS_HEADERS, "Content-Type": "application/json"},
        "body": json.dumps({"files": files}),
    }