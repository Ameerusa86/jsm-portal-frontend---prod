"use client";

import React, { useRef } from "react";
import { UserRound, Loader2, Search, X } from "lucide-react";
import { Choice, FormField } from "@/types/jsm";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface UserPickerFieldProps {
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

export const UserPickerField: React.FC<UserPickerFieldProps> = ({
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
  cache,
  onCacheChoice,
  baseInputClass,
}) => {
  const id = (field.id || field.fieldId) as string;
  const containerRef = useRef<HTMLDivElement>(null);

  const allChoices = [...(field.choices || []), ...choices];

  if (isMulti) {
    const selectedIds = Array.isArray(value) ? value : [];
    const filteredChoices = allChoices.filter((c) => {
      const choiceVal = c.id || c.value || c.accountId || "";
      if (selectedIds.includes(choiceVal)) return false;
      const q = query.toLowerCase().trim();
      if (!q) return true;
      return (
        c.label?.toLowerCase().includes(q) ||
        c.name?.toLowerCase().includes(q) ||
        c.email?.toLowerCase().includes(q)
      );
    });

    return (
      <div className="space-y-2 relative" ref={containerRef}>
        {selectedIds.length > 0 && (
          <div className="flex flex-wrap gap-2 pt-1">
            {selectedIds.map((userId) => {
              const cached =
                cache[userId] ||
                allChoices.find(
                  (c) => (c.id || c.value || c.accountId) === userId,
                );
              const name = cached?.label || cached?.name || userId;

              return (
                <Badge
                  key={userId}
                  variant="secondary"
                  className="inline-flex items-center gap-2 pl-1.5 pr-2 py-1 text-xs font-semibold text-blue-900 bg-blue-50 border border-blue-200"
                >
                  <Avatar className="w-4 h-4 text-[10px]">
                    <AvatarFallback className="bg-primary text-primary-foreground font-bold">
                      {name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <span className="truncate max-w-40">{name}</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      onChange(selectedIds.filter((u) => u !== userId));
                    }}
                    className="h-4 w-4 p-0 text-muted-foreground hover:text-destructive cursor-pointer ml-0.5"
                    aria-label={`Remove user ${name}`}
                  >
                    <X className="w-3.5 h-3.5" />
                  </Button>
                </Badge>
              );
            })}
          </div>
        )}

        <div className="relative">
          <div className="relative">
            <UserRound className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              id={id}
              type="text"
              autoComplete="off"
              placeholder="Search people to add..."
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
            <Card className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-xl border border-slate-200 bg-white py-1 shadow-2xl">
              <div className="flex items-center justify-between px-3 py-1.5 border-b border-slate-100 bg-slate-50 text-[11px] font-semibold text-slate-500">
                <span>Select Users</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={onClose}
                  className="h-6 px-1.5 text-xs text-muted-foreground hover:text-foreground font-normal"
                >
                  Done
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
                        onChange([...selectedIds, choiceVal]);
                        onCacheChoice(choiceVal, choice);
                        onQueryChange("");
                      }}
                      className="flex w-full items-center gap-3 px-3.5 py-2.5 text-left text-xs sm:text-sm text-foreground hover:bg-accent transition-colors cursor-pointer min-h-[44px]"
                    >
                      <Avatar className="w-7 h-7 shrink-0 text-xs font-bold">
                        <AvatarFallback className="bg-primary/10 text-primary">
                          {choiceName.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-foreground truncate">
                          {choiceName}
                        </p>
                        {choice.email && (
                          <p className="text-[11px] text-muted-foreground truncate">
                            {choice.email}
                          </p>
                        )}
                      </div>
                    </button>
                  );
                })
              ) : (
                <div className="p-4 text-center text-xs text-muted-foreground">
                  {query.length < 2
                    ? "Type to search employees..."
                    : "No matching employees found"}
                </div>
              )}
            </Card>
          )}
        </div>
      </div>
    );
  }

  // Single User Picker
  const selectedId = typeof value === "string" ? value : undefined;
  const selectedUser = selectedId
    ? cache[selectedId] ||
      allChoices.find(
        (c) => (c.id || c.value || c.accountId) === selectedId,
      ) || {
        id: selectedId,
        label: selectedId,
        name: selectedId,
      }
    : null;

  const filteredChoices = allChoices.filter((c) => {
    const q = query.toLowerCase().trim();
    if (!q) return true;
    return (
      c.label?.toLowerCase().includes(q) ||
      c.name?.toLowerCase().includes(q) ||
      c.email?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-2 relative" ref={containerRef}>
      {selectedUser && selectedId ? (
        <Card className="flex items-center justify-between p-3 rounded-xl bg-blue-50/80 border border-blue-200 text-slate-900 shadow-xs">
          <div className="flex items-center gap-3 min-w-0">
            <Avatar className="w-8 h-8 shrink-0 text-xs font-bold">
              <AvatarFallback className="bg-primary text-primary-foreground">
                {selectedUser.name
                  ? selectedUser.name.charAt(0).toUpperCase()
                  : "U"}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <p className="text-xs sm:text-sm font-semibold text-foreground truncate">
                {selectedUser.label || selectedUser.name}
              </p>
              {selectedUser.email && (
                <p className="text-[11px] text-muted-foreground truncate">
                  {selectedUser.email}
                </p>
              )}
            </div>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => {
              onChange("");
              onQueryChange("");
              onOpen();
            }}
            className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors cursor-pointer"
            title="Change selected user"
          >
            <X className="w-4 h-4" />
          </Button>
        </Card>
      ) : (
        <div className="relative">
          <div className="relative">
            <UserRound className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              id={id}
              type="text"
              autoComplete="off"
              placeholder="Search employees or specialists by name or email..."
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
            <Card className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-xl border border-slate-200 bg-white py-1 shadow-2xl">
              <div className="flex items-center justify-between px-3 py-1.5 border-b border-slate-100 bg-slate-50 text-[11px] font-semibold text-slate-500">
                <span>Suggested Users</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={onClose}
                  className="h-6 px-1.5 text-xs text-muted-foreground hover:text-foreground font-normal"
                >
                  Done
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
                        onChange(choiceVal);
                        onCacheChoice(choiceVal, choice);
                        onQueryChange("");
                        onClose();
                      }}
                      className="flex w-full items-center gap-3 px-3.5 py-2.5 text-left text-xs sm:text-sm text-foreground hover:bg-accent transition-colors cursor-pointer min-h-[44px]"
                    >
                      <Avatar className="w-7 h-7 shrink-0 text-xs font-bold">
                        <AvatarFallback className="bg-primary/10 text-primary">
                          {choiceName.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-foreground truncate">
                          {choiceName}
                        </p>
                        {choice.email && (
                          <p className="text-[11px] text-muted-foreground truncate">
                            {choice.email}
                          </p>
                        )}
                      </div>
                    </button>
                  );
                })
              ) : (
                <div className="p-4 text-center text-xs text-muted-foreground">
                  {query.length < 2
                    ? "Type to search employees..."
                    : "No matching employees found"}
                </div>
              )}
            </Card>
          )}
        </div>
      )}
    </div>
  );
};
