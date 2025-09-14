"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface ProviderSelectorProps {
  selectedProvider: string;
  onProviderChange: (provider: string) => void;
}

const providers = [{ id: "anthropic", name: "Anthropic Claude" }];

export function ProviderSelector({
  selectedProvider,
  onProviderChange,
}: ProviderSelectorProps) {
  return (
    <Select value={selectedProvider} onValueChange={onProviderChange}>
      <SelectTrigger className="w-48 bg-card text-card-foreground">
        <SelectValue placeholder="Select LLM Provider" />
      </SelectTrigger>
      <SelectContent>
        {providers.map((provider) => (
          <SelectItem key={provider.id} value={provider.id}>
            {provider.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
