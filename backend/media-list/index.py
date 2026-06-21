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

    # Определяем правильное имя бакета динамически
    try:
        buckets_resp = s3.list_buckets()
        all_buckets = [b["Name"] for b in buckets_resp.get("Buckets", [])]
        print(f"[media-list] all buckets: {all_buckets}")
    except Exception as e:
        print(f"[media-list] list_buckets error: {e}")
        all_buckets = ["files"]

    # Ищем файлы во всех бакетах — берём первый где есть что-то
    files = []
    found_bucket = None

    for bucket in all_buckets:
        try:
            resp = s3.list_objects_v2(Bucket=bucket, Prefix=prefix, MaxKeys=1000)
            key_count = resp.get("KeyCount", 0)
            print(f"[media-list] bucket={bucket!r} prefix={prefix!r} KeyCount={key_count}")
            if key_count > 0:
                found_bucket = bucket
                for obj in resp.get("Contents", []):
                    key = obj["Key"]
                    parts = key.split("/")
                    if len(parts) < 4:
                        continue
                    parsed_phrase_id = parts[1]
                    parsed_media_type = parts[2]
                    parsed_filename = "/".join(parts[3:])
                    cdn_url = f"https://cdn.poehali.dev/projects/{access_key}/bucket/{key}"
                    files.append({
                        "phrase_id": parsed_phrase_id,
                        "media_type": parsed_media_type,
                        "filename": parsed_filename,
                        "url": cdn_url,
                        "key": key,
                    })
        except Exception as e:
            print(f"[media-list] error listing bucket={bucket!r}: {e}")

    # Если ничего не нашли по prefix — покажем первые 10 ключей каждого бакета для диагностики
    if not files:
        for bucket in all_buckets:
            try:
                resp = s3.list_objects_v2(Bucket=bucket, MaxKeys=10)
                sample_keys = [o["Key"] for o in resp.get("Contents", [])]
                print(f"[media-list] bucket={bucket!r} sample_keys={sample_keys}")
            except Exception as e:
                print(f"[media-list] sample error bucket={bucket!r}: {e}")

    print(f"[media-list] found_bucket={found_bucket!r} returning {len(files)} files")
    return {
        "statusCode": 200,
        "headers": {**CORS_HEADERS, "Content-Type": "application/json"},
        "body": json.dumps({"files": files}),
    }