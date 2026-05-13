"use client";

import { Switch } from "@luana/ui-kit";

import type { BaseInputProps } from "./types";

/**
 *
 */
export function BooleanInput({ field, value, onChange, disabled }: BaseInputProps<boolean>) {
  return (
    <Switch
      id={field.id}
      checked={Boolean(value)}
      onCheckedChange={onChange}
      disabled={disabled}
      aria-required={field.required}
    />
  );
}
