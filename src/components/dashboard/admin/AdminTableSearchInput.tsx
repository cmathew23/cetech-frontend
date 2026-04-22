"use client";

import { Input } from "@/components/ui/Input";
import type { ChangeEvent } from "react";

type AdminTableSearchInputProps = {
  id: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  disabled?: boolean;
};

export function AdminTableSearchInput({
  id,
  value,
  onChange,
  placeholder,
  disabled = false,
}: AdminTableSearchInputProps) {
  return (
    <div className="relative w-full min-w-0 max-w-md">
      <svg
        className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-textMuted"
        aria-hidden
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth="2"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M21 21l-4.35-4.35M11 18a7 7 0 100-14 7 7 0 000 14z"
        />
      </svg>
      <Input
        id={id}
        type="search"
        className="pl-9"
        value={value}
        disabled={disabled}
        placeholder={placeholder}
        aria-label={placeholder}
        onChange={(e: ChangeEvent<HTMLInputElement>) => onChange(e.target.value)}
        autoComplete="off"
      />
    </div>
  );
}
