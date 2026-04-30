from abc import ABC, abstractmethod
import hashlib
from dataclasses import dataclass, field
from enum import Enum

class ImageType(str, Enum):
    PNG  = "image/png",  ("png",)
    JPEG = "image/jpeg", ("jpg", "jpeg")
    WEBP = "image/webp", ("webp",)
    GIF  = "image/gif",  ("gif",)

    def __new__(cls, mime: str, _extensions: tuple[str, ...]) -> "ImageType":
        obj = str.__new__(cls, mime) 
        obj._value_ = mime
        return obj

    def __init__(self, _mime: str, extensions: tuple[str, ...]) -> None:
        self._extensions = extensions

    @property
    def extension(self) -> str:
        """Canonical file extension."""
        return self._extensions[0]

    @classmethod
    def from_extension(cls, ext: str) -> "ImageType":
        key = ext.lstrip(".").lower()
        for member in cls:
            if key in member._extensions:
                return member
        raise ValueError(f"Unsupported image extension: {ext!r}")


FileType = ImageType

@dataclass(frozen=True)
class FileIdentifier:
    """
    Logical address of a file in the storage backend.
    `bucket` maps to an S3 bucket, a directory, etc.
    `key` is a forward-slash path within that bucket.
    """
    bucket: str
    key: str

    def __str__(self) -> str:
        return f"{self.bucket}/{self.key}"

    @classmethod
    def from_content(cls, bucket: str, file: bytes, image_type: ImageType) -> "FileIdentifier":
        """Content-addressed key derived from SHA-256 of the raw bytes."""
        digest = hashlib.sha256(file).hexdigest()
        return cls(bucket=bucket, key=f"{digest}.{image_type.extension}")


@dataclass(frozen=True)
class StorageResult:
    url: str
    identifier: FileIdentifier
    content_type: FileType


class StorageError(Exception):
    """Base for all storage errors."""

class FileNotFoundError(StorageError):
    def __init__(self, identifier: FileIdentifier) -> None:
        super().__init__(f"File not found: {identifier}")
        self.identifier = identifier

class UploadError(StorageError):
    pass


class FileStorage(ABC):
    @abstractmethod
    def get_url(self, identifier: FileIdentifier) -> str:
        """Return a publicly accessible URL for the given identifier."""
        ...

    @abstractmethod
    async def upload(
        self,
        identifier: FileIdentifier,
        file: bytes,
        file_type: FileType,
    ) -> StorageResult:
        """
        Upload a file and return a StorageResult.
        Raises UploadError on failure.
        """
        ...
    
    async def upload_image(
        self,
        identifier: FileIdentifier,
        image: bytes,
        image_type: ImageType = ImageType.PNG,
    ) -> StorageResult:
        return await self.upload(
            identifier=identifier,
            file=image,
            file_type=image_type
        )

    @abstractmethod
    async def delete(self, identifier: FileIdentifier) -> None:
        ...

    @abstractmethod
    async def exists(self, identifier: FileIdentifier) -> bool:
        ...
