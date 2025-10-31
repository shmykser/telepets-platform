from __future__ import annotations

import os
from typing import Optional
from io import BytesIO
import boto3
from botocore.config import Config
from botocore.exceptions import ClientError

from config.settings import get_r2_config


class R2Storage:
    def __init__(self) -> None:
        cfg = get_r2_config()
        self.bucket: str = cfg.get("bucket") or ""
        self.public_base_url: Optional[str] = cfg.get("public_base_url") or None
        self.use_signed: bool = bool(cfg.get("use_signed_urls"))
        self.signed_ttl: int = int(cfg.get("signed_url_ttl", 3600))

        conf = Config(signature_version="s3v4", s3={"addressing_style": "path"})
        self.client = boto3.client(
            "s3",
            endpoint_url=cfg.get("endpoint"),
            aws_access_key_id=cfg.get("access_key_id"),
            aws_secret_access_key=cfg.get("secret_access_key"),
            region_name="auto",
            config=conf,
        )

    def upload_bytes(self, key: str, data: bytes, content_type: str) -> str:
        self.client.put_object(Bucket=self.bucket, Key=key, Body=data, ContentType=content_type)
        return self.make_url(key)

    def make_url(self, key: str) -> str:
        # Если публичный базовый URL не задан — формируем подписанный URL по умолчанию
        if self.use_signed or not self.public_base_url:
            return self.client.generate_presigned_url(
                ClientMethod="get_object",
                Params={"Bucket": self.bucket, "Key": key},
                ExpiresIn=self.signed_ttl,
            )
        # Публичный доступ включён и задан базовый домен (r2.dev/CDN)
        base = self.public_base_url.rstrip("/")
        return f"{base}/{key}"
        # Fallback на S3 endpoint не используем для приватных бакетов

    def list_keys(self, prefix: str = "") -> list[str]:
        keys: list[str] = []
        kwargs = {"Bucket": self.bucket, "Prefix": prefix} if prefix else {"Bucket": self.bucket}
        while True:
            resp = self.client.list_objects_v2(**kwargs)
            for it in resp.get("Contents", []) or []:
                keys.append(it["Key"])
            if not resp.get("IsTruncated"):
                break
            kwargs["ContinuationToken"] = resp.get("NextContinuationToken")
        return keys

    def delete_prefix(self, prefix: str) -> int:
        keys = self.list_keys(prefix)
        if not keys:
            return 0
        # batched deletes (max 1000 per request)
        deleted = 0
        for i in range(0, len(keys), 1000):
            batch = keys[i:i+1000]
            self.client.delete_objects(Bucket=self.bucket, Delete={"Objects": [{"Key": k} for k in batch]})
            deleted += len(batch)
        return deleted


