"""Comunify KB packs root — one pack per vertical reference corpus.

Created by T-kb-1 (R23 Opus 4.7 production AGENTIC code).

Currently hosts a single pack:

* ``creator_economy_kb_v1`` — vertical creator-economy reference content
  (frameworks, terminology, cohort design, community engagement, voice
  cloning tips, authority vault, vulnerable disclosure playbook).

Per 03-arch-agentic.md § 7.1 the pack is registered via Extension SDK
``EP-14 copilot_kb_pack_register`` in ``comunify/extensions.py`` (T-extensions-1
done). Runtime Qdrant ingestion lives in ``scripts/seed_creator_economy_kb.py``.
"""
