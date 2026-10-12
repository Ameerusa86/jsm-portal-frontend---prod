"use client";

import React, { useState } from "react";
import { Tag, X } from "lucide-react";
import { FormField } from "@/types/jsm";

interface TagInputFieldProps {
  field: FormField;
  tags: string[];
  onChange: (newTags: string[]) => void;
  baseInputClass: string;
}

export const TagInputField: React.FC<TagInputFieldProps> = ({
  field,
  tags = [],
  onChange,
  baseInputClass,
}) => {
  const id = (field.id || field.fieldId) as string;
  const [inputValue, setInputValue] = useState("");

  const addTag = (text: string) => {
    const clean = text.trim().toLowerCase();
    if (clean && !tags.includes(clean)) {
      onChange([...tags, clean]);
    }
    setInputValue("");
  };

  const removeTag = (tagToRemove: string) => {
    onChange(tags.filter((t) => t !== tagToRemove));
  };

  return (
    <div className="space-y-2">
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {tags.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-100 border border-slate-200 text-xs font-semibold text-slate-700"
            >
              <Tag className="w-3 h-3 text-slate-500" />
              <span>{tag}</span>
              <button
                type="button"
                onClick={() => removeTag(tag)}
                className="p-1 -mr-1 rounded text-slate-400 hover:text-rose-500 hover:bg-slate-200/60 transition-colors cursor-pointer"
                aria-label={`Remove tag ${tag}`}
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </span>
          ))}
        </div>
      )}

      <div className="relative">
        <Tag className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <input
          id={id}
          type="text"
          value={inputValue}
          placeholder="Type label and press Enter (e.g. soc2, audit, prod)..."
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === ",") {
              e.preventDefault();
              addTag(inputValue);
            }
          }}
          className={`${baseInputClass} pl-10`}
        />
      </div>

      {field.choices && field.choices.length > 0 && (
        <div className="flex flex-wrap gap-1.5 pt-1">
          <span className="text-[11px] text-slate-400 self-center mr-1">
            Suggestions:
          </span>
          {field.choices.map((c) => {
            const val = c.label || c.name || c.value || "";
            return (
              <button
                key={val}
                type="button"
                onClick={() => addTag(val)}
                className="px-2.5 py-1 rounded text-xs bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors cursor-pointer min-h-[32px] sm:min-h-0 flex items-center"
              >
                + {val}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
