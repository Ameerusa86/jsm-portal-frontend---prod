"use client";

import React, { useRef } from "react";
import { UserRound, Loader2, Search, X } from "lucide-react";
import { Choice, FormField } from "@/types/jsm";

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
                <div
                  key={userId}
                  className="inline-flex items-center gap-2 pl-2 pr-1.5 py-1 rounded-lg bg-blue-50 border border-blue-200 text-xs font-semibold text-blue-900"
                >
                  <div className="w-4 h-4 rounded-full bg-blue-600 text-white text-[10px] flex items-center justify-center font-bold">
                    {name.charAt(0).toUpperCase()}
                  </div>
                  <span className="truncate max-w-40">{name}</span>
                  <button
                    type="button"
                    onClick={() => {
                      onChange(selectedIds.filter((u) => u !== userId));
                    }}
                    className="p-0.5 rounded text-blue-500 hover:text-rose-600 hover:bg-rose-50 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })}
          </div>
        )}

        <div className="relative">
          <div className="relative">
            <UserRound className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
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
                <Loader2 className="h-4 w-4 text-blue-600 animate-spin" />
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
            <div className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-xl border border-slate-200 bg-white py-1 shadow-2xl">
              <div className="flex items-center justify-between px-3 py-1.5 border-b border-slate-100 bg-slate-50 text-[11px] font-semibold text-slate-500">
                <span>Select Users</span>
                <button
                  type="button"
                  onClick={onClose}
                  className="text-slate-400 hover:text-slate-700 cursor-pointer font-normal text-xs"
                >
                  Done
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
                        onChange([...selectedIds, choiceVal]);
                        onCacheChoice(choiceVal, choice);
                        onQueryChange("");
                      }}
                      className="flex w-full items-center gap-3 px-3.5 py-2.5 text-left text-xs sm:text-sm text-slate-700 hover:bg-blue-50/70 transition-colors cursor-pointer min-h-[44px]"
                    >
                      <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-700 font-bold text-xs flex items-center justify-center shrink-0">
                        {choiceName.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-slate-900 truncate">
                          {choiceName}
                        </p>
                        {choice.email && (
                          <p className="text-[11px] text-slate-400 truncate">
                            {choice.email}
                          </p>
                        )}
                      </div>
                    </button>
                  );
                })
              ) : (
                <div className="p-4 text-center text-xs text-slate-400">
                  {query.length < 2
                    ? "Type to search employees..."
                    : "No matching employees found"}
                </div>
              )}
            </div>
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
        <div className="flex items-center justify-between p-3 rounded-xl bg-blue-50/80 border border-blue-200 text-slate-900 shadow-xs">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-8 h-8 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center shrink-0">
              {selectedUser.name
                ? selectedUser.name.charAt(0).toUpperCase()
                : "U"}
            </div>
            <div className="min-w-0">
              <p className="text-xs sm:text-sm font-semibold text-slate-900 truncate">
                {selectedUser.label || selectedUser.name}
              </p>
              {selectedUser.email && (
                <p className="text-[11px] text-slate-500 truncate">
                  {selectedUser.email}
                </p>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              onChange("");
              onQueryChange("");
              onOpen();
            }}
            className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
            title="Change selected user"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <div className="relative">
          <div className="relative">
            <UserRound className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
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
                <Loader2 className="h-4 w-4 text-blue-600 animate-spin" />
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
            <div className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-xl border border-slate-200 bg-white py-1 shadow-2xl">
              <div className="flex items-center justify-between px-3 py-1.5 border-b border-slate-100 bg-slate-50 text-[11px] font-semibold text-slate-500">
                <span>Suggested Users</span>
                <button
                  type="button"
                  onClick={onClose}
                  className="text-slate-400 hover:text-slate-700 cursor-pointer font-normal text-xs"
                >
                  Done
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
                        onChange(choiceVal);
                        onCacheChoice(choiceVal, choice);
                        onQueryChange("");
                        onClose();
                      }}
                      className="flex w-full items-center gap-3 px-3.5 py-2.5 text-left text-xs sm:text-sm text-slate-700 hover:bg-blue-50/70 transition-colors cursor-pointer min-h-[44px]"
                    >
                      <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-700 font-bold text-xs flex items-center justify-center shrink-0">
                        {choiceName.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-slate-900 truncate">
                          {choiceName}
                        </p>
                        {choice.email && (
                          <p className="text-[11px] text-slate-400 truncate">
                            {choice.email}
                          </p>
                        )}
                      </div>
                    </button>
                  );
                })
              ) : (
                <div className="p-4 text-center text-xs text-slate-400">
                  {query.length < 2
                    ? "Type to search employees..."
                    : "No matching employees found"}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
