from __future__ import annotations

from fastapi import APIRouter

from .. import __version__

router = APIRouter(tags=["health"])


@router.get("/health")
async def health() -> dict:
    try:
        import torch  # type: ignore

        gpu = bool(torch.cuda.is_available())
    except Exception:
        gpu = False
    return {"ok": True, "version": __version__, "gpu_available": gpu}
