"""
lupulo/backend/src/main_placeholder.py
Placeholder FastAPI app minima para Lupulo Labs (gastronomia).
Esta es la primera pieza de codigo de lupulo — placeholder hasta Story 13.
La app real se implementa en S-LUPULO-BOOTSTRAP (pendiente).

S-DOCKER-DEV-MULTIBRAND T-4 — 2026-05-15
Per guidelines F5: Dockerfiles de lupulo MUST tener target dev funcional con /health.
"""
from fastapi import FastAPI

app = FastAPI(
    title="Lupulo Labs API (placeholder)",
    description="Gastronomia vertical — reservas de mesa, pedidos digitales, integracion KDS",
    version="0.0.1-placeholder",
    redirect_slashes=False,
)


@app.get("/health")
async def health() -> dict:
    """Health endpoint requerido para Docker healthcheck y Makefile validators."""
    return {"status": "ok", "brand": "lupulo", "note": "placeholder — Story 13 pendiente"}


@app.get("/")
async def root() -> dict:
    return {"message": "Lupulo Labs API placeholder", "docs": "/docs"}
