"use client";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { FormEvent, useState, type ChangeEvent } from "react";

export function FynComposer({
  disabled = false,
  placeholder = "Ask a follow-up question",
  onSubmit,
}: {
  disabled?: boolean;
  placeholder?: string;
  onSubmit: (message: string) => Promise<void> | void;
}) {
  const [message, setMessage] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = message.trim();
    if (trimmed === "" || disabled) return;
    await onSubmit(trimmed);
    setMessage("");
  }

  return (
    <form className="flex flex-col gap-2 sm:flex-row" onSubmit={(e) => void handleSubmit(e)}>
      <Input
        value={message}
        onChange={(event: ChangeEvent<HTMLInputElement>) => setMessage(event.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        aria-label="Fyn follow-up message"
      />
      <Button type="submit" disabled={disabled || message.trim() === ""}>
        Send
      </Button>
    </form>
  );
}
