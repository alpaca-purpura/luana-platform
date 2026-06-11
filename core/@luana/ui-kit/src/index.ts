// AutosaveBadge — primitiva de autoguardado compartida (ADR-012, build-autosave-primitive-luana T-2)
export * from "./AutosaveBadge";
export * from "./accordion";
// Page archetypes — scaffolds list/detail/form/dashboard (canon §6.2, core-ds-foundation T-8)
export * from "./archetypes";
export * from "./alert";
export * from "./alert-dialog";
export * from "./avatar";
export * from "./badge";
export * from "./brand-icons";
export * from "./button";
export * from "./calendar";
export * from "./card";
export * from "./chart";
export * from "./checkbox";
export * from "./collapsible";
export * from "./command";
export * from "./currency-selector";
export * from "./detail-panel";
export * from "./dialog";
export * from "./dropdown-menu";
// EntityInfoCard — canon §2.3 grid-friendly entity card Opción B (core-ds-foundation T-5)
export * from "./EntityInfoCard";
// EntityPicker — canon §2.4 entity selector (debounced + windowed, escala 200+) (core-ds-foundation T-6)
export * from "./EntityPicker";
// EntitySubNavBar + EntityWorkspaceLayout — canon N3 list/detail workspace (core-ds-foundation T-4)
export * from "./EntitySubNavBar";
export * from "./EntityWorkspaceLayout";
export * from "./field-info";
// FloatingAutosaveIndicator — canon §2.6 autosave: UNA por página, sticky bottom-center (core-ds-foundation T-7)
export * from "./FloatingAutosaveIndicator";
export * from "./form";
// Group + GroupHeader + WhatForChip — canon §2.6 grupo de campos con error semántico + barrita de agente (core-ds-foundation T-7)
export * from "./Group";
export * from "./highlighted-text";
export * from "./inline-editable";
export * from "./input";
export * from "./layout";
export * from "./label";
export * from "./loading-button";
export * from "./popover";
export * from "./progress";
export * from "./radio-group";
export * from "./rich-select";
export * from "./scroll-area";
export * from "./select";
export * from "./separator";
export * from "./sheet";
export * from "./skeleton";
export * from "./slider";
export * from "./smart-datetime-picker";
export * from "./sonner";
export * from "./switch";
export * from "./table";
export * from "./tabs";
export * from "./textarea";
export * from "./timezone-select";
export * from "./tooltip";

// ── Shell organism (T-K3 — brand-agnostic shell chrome, 0.4.0) ───────────────
// ⛔ react-resizable-panels Group/Panel/Separator NOT re-exported (shell barrel guards).
export * from "./organism/shell";
