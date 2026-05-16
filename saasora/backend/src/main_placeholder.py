"""
saasora/backend/src/main_placeholder.py
Placeholder FastAPI app minima para SaaSora (SaaS y Productos Digitales).
Esta es la primera pieza de codigo de saasora — placeholder hasta Story TBD.
La app real se implementa en S-SAASORA-BOOTSTRAP (pendiente).

bootstrap brand topology — 2026-05-15
Per guidelines F5: Dockerfiles de saasora MUST tener target dev funcional con /health.
"""
from fastapi import FastAPI

app = FastAPI(
    title="SaaSora API (placeholder)",
    description="SaaS y Productos Digitales vertical — onboarding automatizado, subscripciones recurrentes y dashboards Churn/MRR",
    version="0.0.1-placeholder",
    redirect_slashes=False,
)


@app.get("/health")
async def health() -> dict:
    """Health endpoint requerido para Docker healthcheck y Makefile validators."""
    return {"status": "ok", "brand": "saasora", "note": "placeholder — Story TBD pendiente"}


@app.get("/")
async def root() -> dict:
    return {"message": "SaaSora API placeholder", "docs": "/docs"}
