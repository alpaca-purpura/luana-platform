# cap: abel/icp-buyer  # noqa: ERA001
"""Domain exceptions for Abel module (ICP + Buyer).

DDD: pure Python exceptions. Router maps these to HTTP status codes.
- IcpLabelConflictError → 409 Conflict (RN-7 unique label per tenant)
- IcpMinimumNotMetError → 422 Unprocessable (RN-8 mark-ready validation)
- BuyerNotInIcpError → 404 (RN-5 FK validation)
"""

from __future__ import annotations

from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from uuid import UUID


class IcpLabelConflictError(Exception):
    """RN-7: Etiqueta de ICP ya existe para este tenant (case-insensitive).

    Mapeada a HTTP 409 Conflict por el router.
    """

    def __init__(self, label: str) -> None:
        """Initialize with the duplicate label."""
        self.label = label
        super().__init__(f"Ya existe un ICP con la etiqueta '{label}' para este tenant.")


class IcpMinimumNotMetError(Exception):
    """RN-8: El ICP no cumple los campos mínimos para mark-ready.

    No se lanza como excepción HTTP — el servicio devuelve IcpMarkReadyResponse
    con missing[] (no raise). Esta excepción es para el dominio interno.
    """

    def __init__(self, missing: list[str]) -> None:
        """Initialize with the list of missing fields."""
        self.missing = missing
        super().__init__(f"Campos faltantes para marcar listo: {', '.join(missing)}")


class BuyerNotInIcpError(Exception):
    """RN-5: El buyer no pertenece al ICP especificado.

    Mapeada a HTTP 404 por el router.
    """

    def __init__(self, buyer_id: UUID, icp_id: UUID) -> None:
        """Initialize with buyer_id and icp_id."""
        self.buyer_id = buyer_id
        self.icp_id = icp_id
        super().__init__(f"El buyer {buyer_id} no existe o no pertenece al ICP {icp_id}.")


# Backward-compatible aliases (used in tests and router)
IcpLabelConflict = IcpLabelConflictError
IcpMinimumNotMet = IcpMinimumNotMetError
BuyerNotInIcp = BuyerNotInIcpError
