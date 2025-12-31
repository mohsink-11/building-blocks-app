import { Sparkles, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface AISuggestion {
  id: string;
  description: string;
  sourceColumns: string[];
  targetColumn: string;
  applied: boolean;
}

interface AISuggestionsBarProps {
  suggestions: AISuggestion[];
  onApply: (id: string) => void;
  onDismiss: (id: string) => void;
  isLoading?: boolean;
}

export function AISuggestionsBar({
  suggestions,
  onApply,
  onDismiss,
  isLoading,
}: AISuggestionsBarProps) {
  const pendingSuggestions = suggestions.filter((s) => !s.applied);

  if (pendingSuggestions.length === 0 && !isLoading) {
    return null;
  }

  return (
    <div className="rounded-xl border border-primary/20 bg-gradient-to-r from-primary/5 to-primary/10 p-4">
      <div className="flex items-center gap-2 mb-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
          <Sparkles className={cn("h-4 w-4 text-primary", isLoading && "animate-pulse")} />
        </div>
        <div>
          <span className="font-semibold text-sm">AI Suggestions</span>
          {isLoading && (
            <span className="ml-2 text-xs text-muted-foreground">Analyzing...</span>
          )}
        </div>
      </div>

      <div className="space-y-2">
        {pendingSuggestions.map((suggestion) => (
          <div
            key={suggestion.id}
            className="flex items-center justify-between gap-3 rounded-lg bg-background/80 px-3 py-2"
          >
            <p className="text-sm flex-1">{suggestion.description}</p>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-accent hover:text-accent hover:bg-accent/10"
                onClick={() => onApply(suggestion.id)}
              >
                <Check className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-muted-foreground hover:text-destructive"
                onClick={() => onDismiss(suggestion.id)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}
      </div>

      {pendingSuggestions.length > 1 && (
        <div className="mt-3 flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="text-xs"
            onClick={() => pendingSuggestions.forEach((s) => onApply(s.id))}
          >
            <Check className="mr-1 h-3 w-3" />
            Apply All
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="text-xs text-muted-foreground"
            onClick={() => pendingSuggestions.forEach((s) => onDismiss(s.id))}
          >
            Dismiss All
          </Button>
        </div>
      )}
    </div>
  );
}
