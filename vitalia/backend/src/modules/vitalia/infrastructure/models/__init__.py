"""Vitalia infrastructure ORM models.

Exports all 11 SQLAlchemy 2.0 Mapped[] model classes.
All models inherit from luana_core_platform.domain.base_entity.Base,
registering their tables in the shared metadata singleton.

Usage:
    from src.modules.vitalia.infrastructure.models import VitaliaBookingModel, ...
"""

from __future__ import annotations

from src.modules.vitalia.infrastructure.models.adherence_record_model import (
    VitaliaAdherenceRecordModel,
)
from src.modules.vitalia.infrastructure.models.booking_model import (
    VitaliaBookingModel,
)
from src.modules.vitalia.infrastructure.models.consent_record_model import (
    VitaliaConsentRecordModel,
)
from src.modules.vitalia.infrastructure.models.doctor_extension_model import (
    VitaliaDoctorExtensionModel,
)
from src.modules.vitalia.infrastructure.models.medical_audit_log_model import (
    VitaliaMedicalAuditLogModel,
)
from src.modules.vitalia.infrastructure.models.medical_history_model import (
    VitaliaPatientDentalHistoryModel,
    VitaliaPatientMedicalHistoryModel,
)
from src.modules.vitalia.infrastructure.models.payment_intent_model import (
    VitaliaPaymentIntentModel,
)
from src.modules.vitalia.infrastructure.models.payment_schedule_model import (
    VitaliaPaymentScheduleModel,
)
from src.modules.vitalia.infrastructure.models.plan_tier_config_model import (
    VitaliaPlanTierConfigModel,
)
from src.modules.vitalia.infrastructure.models.treatment_followup_model import (
    VitaliaTreatmentFollowupModel,
)

__all__ = [
    "VitaliaBookingModel",
    "VitaliaTreatmentFollowupModel",
    "VitaliaConsentRecordModel",
    "VitaliaMedicalAuditLogModel",
    "VitaliaPaymentIntentModel",
    "VitaliaPaymentScheduleModel",
    "VitaliaAdherenceRecordModel",
    "VitaliaDoctorExtensionModel",
    "VitaliaPatientMedicalHistoryModel",
    "VitaliaPatientDentalHistoryModel",
    "VitaliaPlanTierConfigModel",
]
