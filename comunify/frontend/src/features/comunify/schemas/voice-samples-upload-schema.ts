import { z } from "zod";

export const voiceSamplesUploadSchema = z.object({
  upload_type: z.enum(["whatsapp_zip", "audio_files"]),
  language_hint: z.enum(["es-neutral", "es-AR", "es-CL", "es-MX"]).optional(),
  consent_granted: z.literal(true, {
    error: "Debes aceptar el uso de tus mensajes para entrenar tu voz",
  }),
});

export type VoiceSamplesUploadInput = z.infer<typeof voiceSamplesUploadSchema>;
