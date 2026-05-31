// cap: platform.autosave-primitive-platform
// story-origin: build-autosave-primitive-luana T-3
"use client";

/**
 * FormRuntimeProvider — section editor state manager.
 *
 * Autosave internals replaced with useAutosave from @luana/hooks (ADR-012).
 * Public API (props, context shape, observable behavior) is preserved 1:1.
 *
 * Mapping from @luana/hooks to nicolify API:
 *   - debounceMs: 800  → preserves original 800ms debounce timing
 *   - save: wraps onSave ignoring the token (auth is handled by caller's onSave)
 *   - getToken: returns a stub non-null string (auth not needed here)
 *   - status "dirty" → mapped to "idle" (debounce window not surfaced in banner)
 *   - autosaveError: captured via onError callback (useAutosave doesn't return error)
 */

import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";

import { useAutosave, type AutosaveStatus as LuanaAutosaveStatus } from "@luana/hooks";

import { useCopilotStore } from "@/features/copilot/store/copilot-store";
import { createFormRuntimeBridge, type FormRuntimeBridge } from "@/lib/form-runtime/copilot";
import { useActiveField } from "@/lib/form-runtime/hooks";
import { setNestedPath } from "@/lib/form-runtime/utils";

import { FormRuntimeContext, type FormRuntimeContextValue } from "./FormRuntimeContext";

import type { AutosaveStatus } from "./AutosaveBanner";
import type { SaveMode, SectionSchema } from "@/lib/form-runtime/schema";

const DEFAULT_SAVE_MODE: SaveMode = "autosave-with-banner";

export interface FormRuntimeProviderProps<TValues extends object> {
  schema: SectionSchema;
  initialValues: TValues;
  /** Feature save function. Receives the full composed section object. */
  onSave: (values: TValues) => Promise<void>;
  saveMode?: SaveMode;
  children: ReactNode;
}

/**
 * Owns section values, runs autosave, exposes the FormRuntimeBridge via
 * Context. Focus state is NOT owned here anymore — it lives in the URL
 * query param via ``useActiveField``. The bridge is kept in sync by a
 * single effect that mirrors the active field id into the bridge's
 * ``focusField`` imperative API (so copilot subscribers see the change).
 */
export function FormRuntimeProvider<TValues extends object>({
  schema,
  initialValues,
  onSave,
  saveMode = DEFAULT_SAVE_MODE,
  children,
}: FormRuntimeProviderProps<TValues>) {
  const [values, setValues] = useState<TValues>(initialValues);
  const snapshotRef = useRef<TValues>(initialValues);
  const valuesRef = useRef<TValues>(initialValues);
  const { activeFieldId } = useActiveField();

  useEffect(() => {
    valuesRef.current = values;
  }, [values]);

  const isAutosave = saveMode !== "explicit";

  // Track autosave error separately (useAutosave doesn't return error object).
  const [autosaveError, setAutosaveError] = useState<Error | null>(null);

  const autosave = useAutosave<TValues>({
    // Wraps onSave — token is ignored since auth is handled by the caller's onSave.
    save: async (vals, _ctx) => {
      await onSave(vals);
    },
    // Stub token provider — getTokenReady exits on first attempt (non-null → immediate).
    // The real auth token is managed by the onSave caller (fetchClient injects X-Tenant-ID).
    getToken: async () => "form-runtime-no-auth",
    // Preserve original 800ms debounce timing (form-runtime uses 800ms, not the 2000ms default).
    debounceMs: 800,
    onSaved: () => {
      setAutosaveError(null);
    },
    onError: (err: unknown) => {
      const normalised = err instanceof Error ? err : new Error("Error al guardar");
      setAutosaveError(normalised);
    },
  });

  const setFieldValue = useCallback(
    (path: string, next: unknown) => {
      setValues((prev) => {
        const updated = setNestedPath(prev, path, next);
        if (isAutosave) {
          autosave.scheduleSave(updated);
        }
        return updated;
      });
    },
    [autosave, isAutosave],
  );

  const undoSession = useCallback(() => {
    setValues(snapshotRef.current);
    if (isAutosave) {
      autosave.scheduleSave(snapshotRef.current);
    }
  }, [autosave, isAutosave]);

  /* eslint-disable react-hooks/refs -- bridge reads valuesRef lazily; invoked only from copilot events, not during render */
  const bridge: FormRuntimeBridge = useMemo(
    () =>
      createFormRuntimeBridge({
        schema,
        getValues: () => valuesRef.current as unknown as Record<string, unknown>,
        patchFn: (path, value) => {
          setFieldValue(path, value);
          return Promise.resolve();
        },
      }),
    [schema, setFieldValue],
  );
  /* eslint-enable react-hooks/refs */

  // Mirror URL-driven focus into the bridge so copilot subscribers see
  // the same "focusedField" the user sees. This is the single writer to
  // ``bridge.focusField`` — the URL is the source of truth.
  useEffect(() => {
    bridge.focusField(activeFieldId);
  }, [bridge, activeFieldId]);

  // Connect the active bridge to the copilot store so chat UI actions can
  // mutate fields directly (bridge.patchField) instead of dispatching the
  // legacy copilot:field-update window events.
  useEffect(() => {
    const { connectBridge, disconnectBridge } = useCopilotStore.getState();
    connectBridge(bridge);
    return () => {
      disconnectBridge(bridge);
    };
  }, [bridge]);

  // eslint-disable-next-line react-hooks/refs -- snapshotRef is set once at mount and never mutated
  const isDirty = values !== snapshotRef.current;

  /**
   * Map @luana/hooks AutosaveStatus to nicolify's banner-level AutosaveStatus.
   * "dirty" (debounce window) is not surfaced in the banner — treated as "idle".
   * This preserves the prior behavior where only saving/saved/error were shown.
   */
  const luanaStatus: LuanaAutosaveStatus = autosave.status;
  const autosaveStatus: AutosaveStatus | null = isAutosave
    ? (luanaStatus === "dirty" ? "idle" : (luanaStatus as AutosaveStatus))
    : null;

  const ctxValue: FormRuntimeContextValue = useMemo(
    () => ({
      schema,
      values: values as unknown as Record<string, unknown>,
      saveMode,
      autosaveStatus,
      autosaveError,
      setFieldValue,
      undoSession,
      isDirty,
      bridge,
    }),
    [
      schema,
      values,
      saveMode,
      autosaveStatus,
      autosaveError,
      setFieldValue,
      undoSession,
      isDirty,
      bridge,
    ],
  );

  return <FormRuntimeContext.Provider value={ctxValue}>{children}</FormRuntimeContext.Provider>;
}
