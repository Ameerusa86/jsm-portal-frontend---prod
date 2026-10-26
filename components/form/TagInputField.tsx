"use client";

import React, { useState } from "react";
import { Tag, X } from "lucide-react";
import { FormField } from "@/types/jsm";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

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
            <Badge
              key={tag}
              variant="secondary"
              className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold text-blue-900 bg-blue-50 border border-blue-200"
            >
              <Tag className="w-3 h-3 text-muted-foreground" />
              <span>{tag}</span>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => removeTag(tag)}
                className="h-4 w-4 p-0 text-muted-foreground hover:text-destructive cursor-pointer ml-0.5"
                aria-label={`Remove tag ${tag}`}
              >
                <X className="w-3.5 h-3.5" />
              </Button>
            </Badge>
          ))}
        </div>
      )}

      <div className="relative">
        <Tag className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
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
        <div className="flex flex-wrap items-center gap-1.5 pt-1">
          <span className="text-[11px] text-muted-foreground self-center mr-1">
            Suggestions:
          </span>
          {field.choices.map((c) => {
            const val = c.label || c.name || c.value || "";
            return (
              <Button
                key={val}
                type="button"
                variant="outline"
                size="sm"
                onClick={() => addTag(val)}
                className="h-7 text-xs px-2.5 py-0.5 text-muted-foreground hover:text-foreground cursor-pointer font-normal"
              >
                + {val}
              </Button>
            );
          })}
        </div>
      )}
    </div>
  );
};
