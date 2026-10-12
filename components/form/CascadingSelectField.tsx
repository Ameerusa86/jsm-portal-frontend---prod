"use client";

import React from "react";
import { ChevronDown } from "lucide-react";
import { FormField } from "@/types/jsm";

interface CascadingSelectFieldProps {
  field: FormField;
  value: { parent?: string; child?: string } | undefined;
  onChange: (val: { parent?: string; child?: string }) => void;
  baseInputClass: string;
}

export const CascadingSelectField: React.FC<CascadingSelectFieldProps> = ({
  field,
  value,
  onChange,
  baseInputClass,
}) => {
  const id = (field.id || field.fieldId) as string;
  const cascadingValue = value || {};

  const selectedParent = field.choices?.find(
    (choice) => (choice.id || choice.value) === cascadingValue.parent,
  );
  const childChoices =
    selectedParent?.children ||
    field.choices?.filter(
      (choice) => choice.parentId === cascadingValue.parent,
    ) || [];

  const updateCascadingValue = (
    key: "parent" | "child",
    val: string,
  ) => {
    const nextValue = {
      ...cascadingValue,
      [key]: val,
      ...(key === "parent" ? { child: "" } : {}),
    };
    onChange(nextValue);
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
      {["parent", "child"].map((level) => {
        const isParent = level === "parent";
        const choices = isParent ? field.choices || [] : childChoices;
        const currentVal = cascadingValue[isParent ? "parent" : "child"];

        return (
          <div key={level} className="relative">
            <select
              id={`${id}-${level}`}
              value={currentVal || ""}
              disabled={!isParent && !cascadingValue.parent}
              onChange={(event) =>
                updateCascadingValue(
                  isParent ? "parent" : "child",
                  event.target.value,
                )
              }
              className={`${baseInputClass} appearance-none pr-10 cursor-pointer disabled:bg-slate-50 disabled:text-slate-400`}
            >
              <option value="">
                {isParent ? "Select category..." : "Select sub-option..."}
              </option>
              {choices.map((choice) => {
                const choiceValue = choice.id || choice.value || "";
                return (
                  <option key={choiceValue} value={choiceValue}>
                    {choice.label || choice.name || choice.value}
                  </option>
                );
              })}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3.5 text-slate-400">
              <ChevronDown className="w-4 h-4" />
            </div>
          </div>
        );
      })}
    </div>
  );
};
