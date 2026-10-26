"use client";

import React, { useRef } from "react";
import { UsersRound, Loader2, Search, X, Plus } from "lucide-react";
import { Choice, FormField } from "@/types/jsm";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

interface GroupPickerFieldProps {
  field: FormField;
  isMulti?: boolean;
  value: string | string[] | undefined;
  onChange: (val: string | string[]) => void;
  query: string;
  onQueryChange: (q: string) => void;
  choices: Choice[];
  isLoading?: boolean;
  isOpen: boolean;
  onOpen: () => void;
  onClose: () => void;
  cache: Record<string, Choice>;
  onCacheChoice: (key: string, choice: Choice) => void;
  baseInputClass: string;
}

export const GroupPickerField: React.FC<GroupPickerFieldProps> = ({
  field,
  isMulti = false,
  value,
  onChange,
  query,
  onQueryChange,
  choices,
  isLoading = false,
  isOpen,
  onOpen,
  onClose,
  onCacheChoice,
  baseInputClass,
}) => {
  const id = (field.id || field.fieldId) as string;
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedGroups = isMulti
    ? Array.isArray(value)
      ? (value as string[])
      : []
    : typeof value === "string" && value
      ? [value]
      : [];

  const allChoices = [...(field.choices || []), ...choices];

  const filteredChoices = allChoices.filter((c) => {
    const name = c.label || c.name || c.value || "";
    if (selectedGroups.includes(name)) return false;
    const q = query.toLowerCase().trim();
    if (!q) return true;
    return name.toLowerCase().includes(q);
  });

  return (
    <div className="space-y-2 relative" ref={containerRef}>
      {selectedGroups.length > 0 && (
        <div className="flex flex-wrap gap-2 pt-1">
          {selectedGroups.map((groupName) => (
            <Badge
              key={groupName}
              variant="secondary"
              className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-blue-900 bg-blue-50 border border-blue-200"
            >
              <UsersRound className="w-3.5 h-3.5 text-muted-foreground" />
              <span>{groupName}</span>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => {
                  if (isMulti) {
                    onChange(selectedGroups.filter((g) => g !== groupName));
                  } else {
                    onChange("");
                  }
                }}
                className="h-4 w-4 p-0 text-muted-foreground hover:text-destructive cursor-pointer ml-0.5"
                aria-label={`Remove group ${groupName}`}
              >
                <X className="w-3 h-3" />
              </Button>
            </Badge>
          ))}
        </div>
      )}

      {(!selectedGroups.length || isMulti) && (
        <div className="relative">
          <div className="relative">
            <UsersRound className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              id={id}
              type="text"
              autoComplete="off"
              placeholder="Search IAM / Security groups..."
              value={query}
              onFocus={onOpen}
              onChange={(e) => onQueryChange(e.target.value)}
              className={`${baseInputClass} pl-10 pr-16`}
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
              {isLoading ? (
                <Loader2 className="h-4 w-4 text-primary animate-spin" />
              ) : query ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => onQueryChange("")}
                  className="h-6 w-6 text-muted-foreground hover:text-foreground cursor-pointer"
                >
                  <X className="h-3.5 w-3.5" />
                </Button>
              ) : (
                <Search className="pointer-events-none h-4 w-4 text-muted-foreground" />
              )}
            </div>
          </div>

          {isOpen && (
            <Card className="absolute z-50 mt-1 max-h-56 w-full overflow-auto rounded-xl border border-slate-200 bg-white py-1 shadow-2xl">
              <div className="flex items-center justify-between px-3 py-1.5 border-b border-slate-100 bg-slate-50 text-[11px] font-semibold text-slate-500">
                <span>Select Groups</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={onClose}
                  className="h-6 px-1.5 text-xs text-muted-foreground hover:text-foreground font-normal"
                >
                  Close
                </Button>
              </div>
              {filteredChoices.length > 0 ? (
                filteredChoices.map((choice) => {
                  const choiceVal =
                    choice.id || choice.value || choice.accountId || "";
                  const choiceName = choice.label || choice.name || choiceVal;

                  return (
                    <button
                      key={choiceVal}
                      type="button"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => {
                        if (isMulti) {
                          onChange([...selectedGroups, choiceName]);
                        } else {
                          onChange(choiceName);
                          onClose();
                        }
                        onCacheChoice(choiceVal, choice);
                        onQueryChange("");
                      }}
                      className="flex w-full items-center justify-between px-3.5 py-2.5 text-left text-xs sm:text-sm text-foreground hover:bg-accent transition-colors cursor-pointer min-h-[44px]"
                    >
                      <div className="flex items-center gap-2.5">
                        <UsersRound className="w-4 h-4 text-primary" />
                        <span className="font-semibold text-foreground">
                          {choiceName}
                        </span>
                      </div>
                      <Plus className="w-4 h-4 text-primary shrink-0" />
                    </button>
                  );
                })
              ) : (
                <div className="p-3 text-center text-xs text-muted-foreground">
                  No matching groups found
                </div>
              )}
            </Card>
          )}
        </div>
      )}
    </div>
  );
};
