"""
fixia/backend/src/main_placeholder.py
Placeholder FastAPI app minima para Fixia (Servicios Hogar + Oficios).
Esta es la primera pieza de codigo de fixia — placeholder hasta Story TBD.
La app real se implementa en S-FIXIA-BOOTSTRAP (pendiente).

bootstrap brand topology — 2026-05-15
Per guidelines F5: Dockerfiles de fixia MUST tener target dev funcional con /health.
"""
from fastapi import FastAPI

app = FastAPI(
    title="Fixia API (placeholder)",
    description="Servicios Hogar + Oficios vertical — técnicos en campo con cotización on-site mobile y reseñas locales SEO",
    version="0.0.1-placeholder",
    redirect_slashes=False,
)


@app.get("/health")
async def health() -> dict:
    """Health endpoint requerido para Docker healthcheck y Makefile validators."""
    return {"status": "ok", "brand": "fixia", "note": "placeholder — Story TBD pendiente"}


@app.get("/")
async def root() -> dict:
    return {"message": "Fixia API placeholder", "docs": "/docs"}
