"""
guestly/backend/src/main_placeholder.py
Placeholder FastAPI app minima para Guestly (Turismo + Hotelería).
Esta es la primera pieza de codigo de guestly — placeholder hasta Story TBD.
La app real se implementa en S-GUESTLY-BOOTSTRAP (pendiente).

bootstrap brand topology — 2026-05-15
Per guidelines F5: Dockerfiles de guestly MUST tener target dev funcional con /health.
"""
from fastapi import FastAPI

app = FastAPI(
    title="Guestly API (placeholder)",
    description="Turismo + Hotelería vertical — motor de reservas por temporada, sync OTAs (Airbnb/Booking), guest experience automatizado",
    version="0.0.1-placeholder",
    redirect_slashes=False,
)


@app.get("/health")
async def health() -> dict:
    """Health endpoint requerido para Docker healthcheck y Makefile validators."""
    return {"status": "ok", "brand": "guestly", "note": "placeholder — Story TBD pendiente"}


@app.get("/")
async def root() -> dict:
    return {"message": "Guestly API placeholder", "docs": "/docs"}
