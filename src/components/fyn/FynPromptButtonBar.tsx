"use client";

import { Button } from "@/components/ui/Button";

export type FynPromptOption<TPromptKey extends string> = {
  key: TPromptKey;
  label: string;
};

export function FynPromptButtonBar<TPromptKey extends string>({
  prompts,
  disabled = false,
  onSelectPrompt,
}: {
  prompts: Array<FynPromptOption<TPromptKey>>;
  disabled?: boolean;
  onSelectPrompt: (promptKey: TPromptKey) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {prompts.map((prompt) => (
        <Button
          key={prompt.key}
          type="button"
          variant="secondary"
          className="text-sm"
          disabled={disabled}
          onClick={() => onSelectPrompt(prompt.key)}
        >
          {prompt.label}
        </Button>
      ))}
    </div>
  );
}
