"""imapsync-Optionen eines Sync-Jobs."""

from pydantic import BaseModel, Field


class FolderMapping(BaseModel):
    source: str = Field(min_length=1)
    target: str = Field(min_length=1)


class SyncOptions(BaseModel):
    dry_run: bool = False
    just_folders: bool = False
    automap: bool = False
    subscribe_all: bool = False
    folders: list[str] = Field(default_factory=list, description="--folder (nur diese Ordner)")
    include: list[str] = Field(default_factory=list, description="--include Regex")
    exclude: list[str] = Field(default_factory=list, description="--exclude Regex")
    folder_mappings: list[FolderMapping] = Field(default_factory=list)
    delete2: bool = Field(default=False, description="Auf Ziel löschen, was in Quelle fehlt")
    delete2_folders: bool = False
    delete1: bool = Field(default=False, description="Nach Übertragung in Quelle löschen")
    expunge1: bool = False
    skip_cross_duplicates: bool = False
    max_age_days: int | None = Field(default=None, ge=0)
    min_age_days: int | None = Field(default=None, ge=0)
    max_size_bytes: int | None = Field(default=None, ge=0)
    max_bytes_per_second: int | None = Field(default=None, ge=0)
    extra_args: str = Field(default="", max_length=2000)
