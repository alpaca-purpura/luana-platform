# Voice cloning para creators

> Cómo distillar la voz auténtica del creador. Story 12 NEW feature ★ vs Vitalia.

## sample_selection

Para distillar bien la voz de un creador necesitás ~50 muestras de chats/posts/transcripciones que SEAN representativas. Criterios:

- **Mismo medio que el output deseado** — si el agente va a responder por WhatsApp, samples deben ser chats privados (NO posts curados de Instagram).
- **Spectrum de contextos** — cliente nuevo + cliente recurrente + objeción + chitchat + cierre de venta.
- **Sin edición ex-post** — chats crudos, no versiones que el creador "pulió" para parecer mejor. La voz auténtica incluye typos pequeños, expresiones informales, muletillas.
- **Recientes** — últimos 6 meses idealmente. La voz evoluciona; samples de hace 3 años pueden distillar voz vieja.
- **Mismo idioma + dialecto** — si el creador es AR voseo, samples 100% voseo. NO mezclar con posts en tuteo.

50 samples es el FLOOR. 80-100 da resultado más estable.

## distillation_prompts_overview

El pipeline VoiceDistillationOrchestrator (Story 12 NEW) ejecuta 4 olas LLM:

1. **dialect_detection** — identifica dialecto base (AR voseo, MX tuteo, CL chileno, etc.)
2. **vocabulary_anchors_extraction** — palabras/frases distintivas del creador
3. **register_tone_profile** — formal/informal, cálido/directo, humor presente/ausente
4. **validate_and_compile_v2** — output: PersonalityProfile.system_instruction v2

Cada ola toma SOLO outputs sanitizados (estadísticas, no chat raw) → privacy by design (D15 03-arch § 9.4).

## when_to_redistill

¿Cuándo correr de nuevo el pipeline para un creador?

- El creador cambió de vertical/audiencia ("pasé de fitness a finanzas") — redistill obligatorio
- Pasaron 12 meses desde la última distillation y el creador siente que ya no se reconoce en los outputs
- Feedback de alumnos: "el agente no suena como vos" 3+ veces en 1 mes
- Métrica voice_fidelity_score cae < 0.8 (grader detecta drift)

NO redistillar:
- Por capricho ("quiero probar")
- Después de UN sample anómalo
- Sin tener nuevos samples (≥30 nuevos chats post última distillation)

## dialect_coverage_spanish_latam

LatAm tiene heterogeneidad alta. Cubrimos los siguientes dialectos en distillation:

- **AR (Argentina, Uruguay)** — voseo (vos, sos, tenés, podés, mirá, dejá)
- **MX (México)** — tuteo + léxico mexicano (chido, padre, órale)
- **CL (Chile)** — tuteo + dialecto chileno (cachái, fome, bacán)
- **CO (Colombia)** — tuteo + paisa/costeño/bogotano (chimba, parcero, qué hubo)
- **PE (Perú)** — tuteo + dialecto peruano (chévere, pata, jato)
- **EC (Ecuador)** — tuteo + dialecto ecuatoriano (chuta, ñaño)
- **VE (Venezuela)** — tuteo + venezolano (chévere, mano, pana)
- **Neutro LatAm** — tuteo + español castellano "neutralizado" (para creator que apunta cross-país)

El creador elige UN dialecto primario. Mezclar dialectos en el mismo agente confunde y baja voice_fidelity_score.

## ratification_ux_pattern

Pre-deploy de la voz nueva v2, el creador debe ratificar:

1. **Diff visualizable** — versión v1 vs v2 lado a lado, mostrando outputs en 5 escenarios canon (saludo, objeción precio, cierre, follow-up, error en cliente).
2. **Aprobar o pedir cambios** — el creador NO escribe prompts; solo decide "esta voz es mía" / "esta voz NO es mía, redistillar".
3. **Cool-down de 24h** — si aprueba, voz v2 entra en producción al día siguiente (no inmediato — evita cambios impulsivos por euforia).
4. **Rollback express** — si dentro de 7 días el creador o sus alumnos detectan algo raro, rollback a v1 en 1 click.

NO automatizar la activación de voz nueva. Voz = identidad pública del creador; cambios requieren ratification humano.

## sample_sanitization_pii

ANTES de meter samples al pipeline:

- **PII de terceros (clientes que aparecen en chats)** — anonimizar: "Juan Pérez" → "[NOMBRE]", "+54 11 1234 5678" → "[TELÉFONO]"
- **Datos financieros específicos** — "transferí los USD 2500" → "transferí [MONTO]"
- **Localizaciones precisas** — "estoy en Av. Cabildo 1234" → "[DIRECCIÓN]"
- **Conversaciones bajo NDA** — excluidas completamente

El pipeline NUNCA persiste raw samples post-distillation (D15). Lo que persiste son estadísticas: distribución de longitudes, frecuencias de palabras anchor, perfil de registro — sin chats originales.

## voice_drift_detection_production

Una vez en producción, monitorear:

- **voice_fidelity_score** — grader compara cada output del agente vs system_instruction. Cae < 0.85 sustained 3 días = drift.
- **vocabulary_anchor_recall** — % de outputs que usan al menos 1 vocabulary anchor del creador. < 30% = blandura.
- **dialect_purity** — % de outputs sin mezclar dialectos. Voseo mezclando "tuteo" = problema.

Si drift detectado:
1. Alertar al creador con ejemplos concretos
2. Sugerir 1 de 3 acciones: (a) redistillar con nuevos samples, (b) revisar prompts manualmente, (c) aceptar drift como evolución natural

## anti_pattern_voice_overcorrection

Un error común: el creador después de distillation pide "más voseo" / "más calidez" / "más humor" repetidamente. Termina con voz CARICATURA (todos los modismos al palo, sin contexto).

Mejor:
- Aceptar que la voz distillada captura el 80-90% del creador, no el 100%
- Refinar VÍA NUEVAS MUESTRAS, no vía prompts manuales ("hace que diga 'che' siempre")
- Una voz natural alterna entre contextos — formal cuando habla de precio, cálido en empatía, directo en cierre. NO uniforme.

Si el creador insiste en overcorrección: explicar trade-off + mostrar ejemplo de cómo suena caricaturizado vs natural.
