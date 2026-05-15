"""Comunify application task workers.

* ``voice_samples_ingest_worker`` — T-voice-2 ARQ worker (WhatsApp ZIP →
  parser → Whisper transcribe → persist counts only + delete raw on success).
"""
