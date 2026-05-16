"""
retailly/backend/src/main_placeholder.py
Placeholder FastAPI app minima para Retailly (E-commerce / D2C).
Esta es la primera pieza de codigo de retailly — placeholder hasta Story TBD.
La app real se implementa en S-RETAILLY-BOOTSTRAP (pendiente).

bootstrap brand topology — 2026-05-15
Per guidelines F5: Dockerfiles de retailly MUST tener target dev funcional con /health.
"""
from fastapi import FastAPI

app = FastAPI(
    title="Retailly API (placeholder)",
    description="E-commerce / D2C vertical — catálogos sincronizados con Shopify/WooCommerce, cart recovery y cross-selling automático",
    version="0.0.1-placeholder",
    redirect_slashes=False,
)


@app.get("/health")
async def health() -> dict:
    """Health endpoint requerido para Docker healthcheck y Makefile validators."""
    return {"status": "ok", "brand": "retailly", "note": "placeholder — Story TBD pendiente"}


@app.get("/")
async def root() -> dict:
    return {"message": "Retailly API placeholder", "docs": "/docs"}
