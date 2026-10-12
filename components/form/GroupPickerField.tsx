"use client";

import React, { useRef } from "react";
import { UsersRound, Loader2, Search, X, Plus } from "lucide-react";
import { Choice, FormField } from "@/types/jsm";

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
            <div
              key={groupName}
              className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-indigo-50 border border-indigo-200 text-xs font-semibold text-indigo-900"
            >
              <UsersRound className="w-3.5 h-3.5 text-indigo-600" />
              <span>{groupName}</span>
              <button
                type="button"
                onClick={() => {
                  if (isMulti) {
                    onChange(selectedGroups.filter((g) => g !== groupName));
                  } else {
                    onChange("");
                  }
                }}
                className="p-0.5 rounded text-indigo-400 hover:text-rose-600 transition-colors cursor-pointer"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {(!selectedGroups.length || isMulti) && (
        <div className="relative">
          <div className="relative">
            <UsersRound className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
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
                <Loader2 className="h-4 w-4 text-indigo-600 animate-spin" />
              ) : query ? (
                <button
                  type="button"
                  onClick={() => onQueryChange("")}
                  className="p-0.5 text-slate-400 hover:text-slate-600 rounded cursor-pointer"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              ) : (
                <Search className="pointer-events-none h-4 w-4 text-slate-400" />
              )}
            </div>
          </div>

          {isOpen && (
            <div className="absolute z-50 mt-1 max-h-56 w-full overflow-auto rounded-xl border border-slate-200 bg-white py-1 shadow-2xl">
              <div className="flex items-center justify-between px-3 py-1.5 border-b border-slate-100 bg-slate-50 text-[11px] font-semibold text-slate-500">
                <span>Select Groups</span>
                <button
                  type="button"
                  onClick={onClose}
                  className="text-slate-400 hover:text-slate-700 cursor-pointer font-normal text-xs"
                >
                  Close
                </button>
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
                      className="flex w-full items-center justify-between px-3.5 py-2.5 text-left text-xs sm:text-sm text-slate-700 hover:bg-indigo-50/70 transition-colors cursor-pointer min-h-[44px]"
                    >
                      <div className="flex items-center gap-2.5">
                        <UsersRound className="w-4 h-4 text-indigo-500" />
                        <span className="font-semibold text-slate-900">
                          {choiceName}
                        </span>
                      </div>
                      <Plus className="w-4 h-4 text-indigo-600 shrink-0" />
                    </button>
                  );
                })
              ) : (
                <div className="p-3 text-center text-xs text-slate-400">
                  No matching groups found
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
