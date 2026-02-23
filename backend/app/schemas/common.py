from pydantic import BaseModel, ConfigDict


class PaginationMeta(BaseModel):
    page: int
    page_size: int
    total: int
    total_pages: int


class PaginatedResponse(BaseModel):
    model_config = ConfigDict(arbitrary_types_allowed=True)