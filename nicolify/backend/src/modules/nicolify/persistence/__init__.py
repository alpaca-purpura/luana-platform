"""Brand-local persistence wiring for nicolify.

SQLAlchemy mapper registry — ensures all engine + brand SQLA models are imported
before the first DB session triggers ``configure_mappers()``.
"""
