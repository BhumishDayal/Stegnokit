from __future__ import annotations

import logging

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from . import __version__
from .api import routes_audio, routes_health, routes_image
from .config import get_settings

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s %(name)s :: %(message)s",
)
log = logging.getLogger("stegnokit")


def create_app() -> FastAPI:
    settings = get_settings()
    app = FastAPI(
        title="Stegnokit API",
        version=__version__,
        description="Robust steganography service: AES-GCM-encrypted payloads embedded in images and audio.",
    )

    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.origins,
        allow_credentials=False,
        allow_methods=["GET", "POST", "OPTIONS"],
        allow_headers=["Content-Type", "Authorization"],
        expose_headers=[
            "X-Stegnokit-PSNR",
            "X-Stegnokit-SSIM",
            "X-Stegnokit-SNR-dB",
            "X-Stegnokit-Grid",
            "X-Stegnokit-Bytes",
            "X-Stegnokit-Bits",
            "X-Stegnokit-ChipSamples",
            "Content-Disposition",
        ],
        max_age=600,
    )

    app.include_router(routes_health.router)
    app.include_router(routes_image.router)
    app.include_router(routes_audio.router)

    @app.exception_handler(Exception)
    async def unhandled_exception_handler(request: Request, exc: Exception):  # noqa: ARG001
        log.exception("unhandled error on %s %s", request.method, request.url.path)
        return JSONResponse(
            status_code=500,
            content={"detail": "internal server error", "code": "internal"},
        )

    @app.get("/", tags=["health"])
    async def root() -> dict:
        return {"service": "stegnokit", "version": __version__, "docs": "/docs"}

    return app


app = create_app()


if __name__ == "__main__":
    import uvicorn

    settings = get_settings()
    uvicorn.run(
        "app.main:app",
        host=settings.app_host,
        port=settings.app_port,
        reload=False,
    )
