import boto3
from functools import lru_cache
from .base import (
    FileStorage,
    FileNotFoundError,
    FileIdentifier,
    UploadError,
    StorageResult,
    FileType,
    StorageError
)
from botocore.client import BaseClient
from io import BytesIO
from src.config import settings


@lru_cache()
def get_s3_client():
    session = boto3.Session(
        aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
        aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
        region_name=settings.AWS_REGION,
    )
    return session.client("s3")

@lru_cache()
def get_s3_storage():
    return S3FileStorage(
        get_s3_client()
    )


class S3FileStorage(FileStorage):
    def __init__(
        self,
        client: BaseClient
    ) -> None:
        self._client = get_s3_client()

    def get_url(self, identifier: FileIdentifier) -> str:
        if settings.S3_PROVIDER.lower() == 'minio':
            return f"http://localhost:9000/{identifier.bucket}/{identifier.key}"    
        return f"https://{identifier.bucket}.s3.{settings.AWS_REGION}.amazonaws.com/{identifier.key}"

    async def upload(
        self,
        identifier: FileIdentifier,
        file: bytes,
        file_type: FileType,
    ) -> StorageResult:
        try:
            data = BytesIO(file)
            self._client.upload_fileobj(
                data, 
                identifier.bucket, 
                identifier.key,
                ExtraArgs={
                    "ContentType": file_type.value
                }
            )
            return StorageResult(
                url=self.get_url(identifier),
                identifier=identifier,
                content_type=file_type,
            )
        except Exception as exc:
            raise UploadError(f"S3 upload failed for {identifier}") from exc

    async def delete(self, identifier: FileIdentifier) -> None:
        try:
            self._client.delete_object(Bucket=identifier.bucket, Key=identifier.key)
        except Exception as exc:
            raise StorageError("Unexecepted error") from exc

    async def exists(self, identifier: FileIdentifier) -> bool:
        try:
            self._client.head_object(Bucket=identifier.bucket, Key=identifier.key)
            return True
        except Exception:
            return False