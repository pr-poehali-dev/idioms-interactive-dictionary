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

    try:
        files = []
        continuation_token = None

        while True:
            kwargs = {"Bucket": S3_BUCKET, "Prefix": prefix, "MaxKeys": 1000}
            if continuation_token:
                kwargs["ContinuationToken"] = continuation_token

            response = s3.list_objects_v2(**kwargs)
            print(f"[media-list] prefix={prefix!r} KeyCount={response.get('KeyCount', 0)}")

            for obj in response.get("Contents", []):
                key = obj["Key"]
                parts = key.split("/")
                # key format: phraseology/{phrase_id}/{media_type}/{filename}
                if len(parts) < 4:
                    continue
                parsed_phrase_id = parts[1]
                parsed_media_type = parts[2]
                parsed_filename = "/".join(parts[3:])
                cdn_url = (
                    f"https://cdn.poehali.dev/projects/{access_key}"
                    f"/bucket/{key}"
                )
                files.append({
                    "phrase_id": parsed_phrase_id,
                    "media_type": parsed_media_type,
                    "filename": parsed_filename,
                    "url": cdn_url,
                    "key": key,
                })

            if response.get("IsTruncated"):
                continuation_token = response.get("NextContinuationToken")
            else:
                break

    except Exception as e:
        print(f"[media-list] ERROR: {e}")
        return {
            "statusCode": 500,
            "headers": {**CORS_HEADERS, "Content-Type": "application/json"},
            "body": json.dumps({"files": [], "error": str(e)}),
        }

    print(f"[media-list] returning {len(files)} files")
    return {
        "statusCode": 200,
        "headers": {**CORS_HEADERS, "Content-Type": "application/json"},
        "body": json.dumps({"files": files}),
    }
