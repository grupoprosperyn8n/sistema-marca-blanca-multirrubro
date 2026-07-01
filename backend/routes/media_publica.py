"""Public endpoint for MEDIA_PUBLICA.

Safe, read-only media layer used by the white-label frontend to render
same-size image/video carousels from Airtable.
"""

import sys
from pathlib import Path

from fastapi import APIRouter, HTTPException, Response

_BACKEND = Path(__file__).resolve().parent.parent
if str(_BACKEND) not in sys.path:
    sys.path.insert(0, str(_BACKEND))

from services.public_media_service import list_public_media

router = APIRouter(prefix="/api", tags=["media-publica"])


@router.get("/media-publica")
async def listar_media_publica(response: Response):
    """List public media records for cards and detail carousels."""
    try:
        response.headers["Cache-Control"] = "no-store, max-age=0"
        items = list_public_media()
        return {"total": len(items), "media": items}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")
