"use client";

// TODO T-fe-2 polish post-merge: wire VoiceSamplesUploader + useVoiceSamplesUpload + usePollDistillationJob + VoiceDistilledPreview

export function VoiceCloningClient() {
  return (
    <div className="flex flex-col gap-6 p-6" data-testid="voice-cloning-client">
      <h1 className="text-2xl font-bold">Clonación de voz</h1>
      <p className="text-sm text-muted-foreground">
        Sube muestras de audio para destilar tu voz única.
      </p>
    </div>
  );
}
