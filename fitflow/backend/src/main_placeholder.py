"""
fitflow/backend/src/main_placeholder.py
Placeholder FastAPI app minima para FitFlow (Fitness + Deporte).
Esta es la primera pieza de codigo de fitflow — placeholder hasta Story TBD.
La app real se implementa en S-FITFLOW-BOOTSTRAP (pendiente).

bootstrap brand topology — 2026-05-15
Per guidelines F5: Dockerfiles de fitflow MUST tener target dev funcional con /health.
"""
from fastapi import FastAPI

app = FastAPI(
    title="FitFlow API (placeholder)",
    description="Fitness + Deporte vertical — facturación recurrente membresías, control aforo, calendario clases, waivers digitales",
    version="0.0.1-placeholder",
    redirect_slashes=False,
)


@app.get("/health")
async def health() -> dict:
    """Health endpoint requerido para Docker healthcheck y Makefile validators."""
    return {"status": "ok", "brand": "fitflow", "note": "placeholder — Story TBD pendiente"}


@app.get("/")
async def root() -> dict:
    return {"message": "FitFlow API placeholder", "docs": "/docs"}
