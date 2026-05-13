"use client";

import { InlineEditableInput } from "@luana/ui-kit";

import type { BaseInputProps } from "./types";

/**
 * Single-line text field rendered as an InlineEditable input — seamless
 * chrome by default, full chrome on focus.
 */
export function TextInput({
  field,
  value,
  onChange,
  disabled,
  autoFocus,
  onBlur,
}: BaseInputProps<string>) {
  return (
    <InlineEditableInput
      id={field.id}
      value={value ?? ""}
      onChange={onChange}
      onBlur={onBlur}
      placeholder={field.placeholder}
      disabled={disabled}
      autoFocus={autoFocus}
      aria-required={field.required}
    />
  );
}
