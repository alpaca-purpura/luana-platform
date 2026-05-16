"""
inmoflow/backend/src/main_placeholder.py
Placeholder FastAPI app minima para InmoFlow (Real Estate (Inmobiliaria)).
Esta es la primera pieza de codigo de inmoflow — placeholder hasta Story TBD.
La app real se implementa en S-INMOFLOW-BOOTSTRAP (pendiente).

bootstrap brand topology — 2026-05-15
Per guidelines F5: Dockerfiles de inmoflow MUST tener target dev funcional con /health.
"""
from fastapi import FastAPI

app = FastAPI(
    title="InmoFlow API (placeholder)",
    description="Real Estate (Inmobiliaria) vertical — sync portales inmobiliarios, lead routing geográfico y calculadoras hipotecarias",
    version="0.0.1-placeholder",
    redirect_slashes=False,
)


@app.get("/health")
async def health() -> dict:
    """Health endpoint requerido para Docker healthcheck y Makefile validators."""
    return {"status": "ok", "brand": "inmoflow", "note": "placeholder — Story TBD pendiente"}


@app.get("/")
async def root() -> dict:
    return {"message": "InmoFlow API placeholder", "docs": "/docs"}
