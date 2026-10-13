"use client";

import React, { useEffect, useState } from "react";
import {
  AlertCircle,
  ChevronDown,
  Info,
  Send,
  Loader2,
  Calendar,
  Clock,
  Mail,
  Globe,
  Hash,
  Box,
} from "lucide-react";
import { Choice, FormField } from "@/types/jsm";
import { KnowledgeBaseSuggestions } from "./KnowledgeBaseSuggestions";
import { UserPickerField } from "./form/UserPickerField";
import { GroupPickerField } from "./form/GroupPickerField";
import { CascadingSelectField } from "./form/CascadingSelectField";
import { FileAttachmentField } from "./form/FileAttachmentField";
import { TagInputField } from "./form/TagInputField";

interface DynamicFormProps {
  fields: FormField[];
  onSubmit: (values: Record<string, unknown>) => Promise<void>;
  onCancel?: () => void;
  submitLabel?: string;
}

export const DynamicForm: React.FC<DynamicFormProps> = ({
  fields,
  onSubmit,
  onCancel,
  submitLabel = "Submit Request",
}) => {
  const [formData, setFormData] = useState<Record<string, unknown>>({});
  const [fileList, setFileList] = useState<Record<string, File[]>>({});
  const [submitting, setSubmitting] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Picker search and selection state
  const [pickerQueries, setPickerQueries] = useState<Record<string, string>>({});
  const [activePickerId, setActivePickerId] = useState<string | null>(null);
  const [pickerChoices, setPickerChoices] = useState<Record<string, Choice[]>>({});
  const [pickerLoading, setPickerLoading] = useState<Record<string, boolean>>({});
  const [selectedChoicesCache, setSelectedChoicesCache] = useState<Record<string, Choice>>({});

  const activePickerField = fields.find(
    (f) => (f.id || f.fieldId) === activePickerId,
  );
  const activePickerQuery = activePickerId
    ? pickerQueries[activePickerId] || ""
    : "";

  // Close active picker on click outside or Escape key
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setActivePickerId(null);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  // Debounced directory search for User and Group Pickers
  useEffect(() => {
    if (!activePickerId || !activePickerField) return;

    const isUserPicker =
      activePickerField.type === "user-picker" ||
      activePickerField.type === "multi-user-picker";
    const isGroupPicker =
      activePickerField.type === "group-picker" ||
      activePickerField.type === "multi-group-picker";

    if (!isUserPicker && !isGroupPicker) return;

    const controller = new AbortController();
    const type = isUserPicker ? "user" : "group";
    const timer = window.setTimeout(async () => {
      setPickerLoading((prev) => ({ ...prev, [activePickerId]: true }));
      try {
        const response = await fetch(
          `/api/jsm/directory?type=${type}&query=${encodeURIComponent(activePickerQuery)}`,
          { signal: controller.signal },
        );
        if (response.ok) {
          const data = (await response.json()) as { choices?: Choice[] };
          const loadedChoices = data.choices || [];
          setPickerChoices((current) => ({
            ...current,
            [activePickerId]: loadedChoices,
          }));

          // Cache loaded choices for quick lookup
          loadedChoices.forEach((c) => {
            const key = c.id || c.value || c.accountId;
            if (key) {
              setSelectedChoicesCache((cache) => ({ ...cache, [key]: c }));
            }
          });
        }
      } catch (error: unknown) {
        if (error instanceof DOMException && error.name === "AbortError")
          return;
        console.error("Picker search failed:", error);
      } finally {
        setPickerLoading((prev) => ({ ...prev, [activePickerId]: false }));
      }
    }, 180);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [activePickerField, activePickerId, activePickerQuery]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    // Validate required fields
    for (const field of fields) {
      const id = (field.id || field.fieldId) as string;
      if (!id || field.type === "info" || field.type === "message") continue;

      if (field.required) {
        const val = formData[id];
        const files = fileList[id];
        const isFile = field.type === "file" || field.type === "attachment";

        if (isFile) {
          if (!files || files.length === 0) {
            setValidationError(
              `Please upload the required file for "${field.label || field.name}".`,
            );
            return;
          }
        } else if (
          field.type === "user-picker" ||
          field.type === "group-picker"
        ) {
          if (!val || (typeof val === "string" && !val.trim())) {
            setValidationError(
              `Please select a ${field.type === "user-picker" ? "user" : "group"} for "${field.label || field.name}".`,
            );
            return;
          }
        } else if (
          field.type === "multi-user-picker" ||
          field.type === "multi-group-picker" ||
          field.type === "checkbox" ||
          field.type === "labels"
        ) {
          if (!Array.isArray(val) || val.length === 0) {
            setValidationError(
              `Please select or add at least one option for "${field.label || field.name}".`,
            );
            return;
          }
        } else if (
          field.type === "cascading" ||
          field.type === "cascading-select"
        ) {
          const cascadingVal = val as
            | { parent?: string; child?: string }
            | undefined;
          if (!cascadingVal?.parent) {
            setValidationError(
              `Please select an option for "${field.label || field.name}".`,
            );
            return;
          }
        } else if (val === undefined || val === null || val === "") {
          setValidationError(
            `Please fill out the required field: "${field.label || field.name}".`,
          );
          return;
        }
      }
    }

    setSubmitting(true);
    try {
      await onSubmit(formData);
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : "An error occurred while submitting.";
      setValidationError(message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleFilesAdded = (id: string, newFiles: FileList | File[]) => {
    const existing = fileList[id] || [];
    const addedArray = Array.from(newFiles);
    const combinedFiles = [...existing, ...addedArray];
    setFileList({ ...fileList, [id]: combinedFiles });
    setFormData({ ...formData, [id]: combinedFiles.map((f) => f.name) });
  };

  const removeFile = (id: string, index: number) => {
    const updated = (fileList[id] || []).filter((_, i) => i !== index);
    setFileList({ ...fileList, [id]: updated });
    setFormData({ ...formData, [id]: updated.map((f) => f.name) });
  };

  const baseInputClass =
    "w-full rounded-xl border border-slate-300 bg-white py-3 sm:py-2.5 px-3.5 text-base sm:text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:outline-none focus:ring-4 focus:ring-blue-500/10 transition-all shadow-xs min-h-[44px]";

  // Find the summary field to use as the search query for KB articles
  const summaryField = fields.find(
    (f) =>
      (f.id || f.fieldId)?.toLowerCase() === "summary" ||
      f.name?.toLowerCase() === "summary",
  );
  const summaryValue = summaryField
    ? (formData[(summaryField.id || summaryField.fieldId) as string] as string) || ""
    : "";

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {summaryValue && (
        <KnowledgeBaseSuggestions query={summaryValue} />
      )}

      {validationError && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 flex items-start gap-3 text-sm animate-shake">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-semibold">Submission Incomplete</p>
            <p className="text-xs mt-0.5 text-rose-600">{validationError}</p>
          </div>
        </div>
      )}

      {/* Sequential Form Inputs matching exact JSM order */}
      <div className="space-y-6">
        {fields.map((field) => {
          const id = (field.id || field.fieldId) as string;
          const label = field.label || field.name || "Field";
          const hasChoices = Boolean(field.choices && field.choices.length > 0);

          const fieldType = field.type || "text";
          const isRadio = fieldType === "radio";
          const isCheckbox =
            fieldType === "checkbox" || fieldType === "multiselect";
          const isDropdown =
            fieldType === "choice" ||
            fieldType === "dropdown" ||
            fieldType === "select" ||
            fieldType === "components" ||
            fieldType === "priority";
          const isCascading =
            fieldType === "cascading" || fieldType === "cascading-select";
          const isSingleUserPicker = fieldType === "user-picker";
          const isMultiUserPicker = fieldType === "multi-user-picker";
          const isSingleGroupPicker = fieldType === "group-picker";
          const isMultiGroupPicker = fieldType === "multi-group-picker";
          const isLabels = fieldType === "labels";
          const isLongText =
            fieldType === "paragraph" ||
            fieldType === "multiline" ||
            fieldType === "textarea";
          const isInfo = fieldType === "info" || fieldType === "message";
          const isFile = fieldType === "file" || fieldType === "attachment";
          const isDate = fieldType === "date";
          const isDateTime =
            fieldType === "datetime" || fieldType === "datetime-local";
          const isTime = fieldType === "time";
          const isNumber = fieldType === "number";
          const isEmail = fieldType === "email";
          const isUrl = fieldType === "url";
          const isAsset = fieldType === "asset";

          return (
            <div key={id} className="space-y-2">
              {/* Field Header & Label */}
              {!isInfo && (
                <div className="flex items-center justify-between">
                  <label
                    htmlFor={id}
                    className="block text-sm font-semibold text-slate-800"
                  >
                    {label}
                    {field.required ? (
                      <span
                        className="text-rose-500 ml-1 font-bold"
                        title="Required field"
                      >
                        *
                      </span>
                    ) : (
                      <span className="text-xs text-slate-400 font-normal ml-1.5">
                        (Optional)
                      </span>
                    )}
                  </label>
                </div>
              )}

              {/* Render Field By Type */}
              {isInfo ? (
                <div className="rounded-xl bg-blue-50/90 border border-blue-200/90 p-4 text-blue-900 my-2 flex items-start gap-3">
                  <Info className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                  <div className="text-xs space-y-1">
                    <p className="font-semibold text-sm text-blue-950">
                      {label}
                    </p>
                    <p className="text-blue-800 leading-relaxed">
                      {field.description}
                    </p>
                  </div>
                </div>
              ) : isRadio && hasChoices ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 pt-1">
                  {field.choices!.map((c) => {
                    const choiceVal = c.id || c.value || "";
                    const choiceLabel = c.label || c.name || c.value || "";
                    const isSelected = formData[id] === choiceVal;

                    return (
                      <label
                        key={choiceVal}
                        className={`flex items-start gap-3 p-3.5 rounded-xl border text-sm cursor-pointer transition-all min-h-[44px] ${
                          isSelected
                            ? "bg-blue-50/80 border-blue-500 text-blue-950 font-medium ring-2 ring-blue-500/10 shadow-xs"
                            : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300"
                        }`}
                      >
                        <input
                          type="radio"
                          name={id}
                          value={choiceVal}
                          checked={isSelected}
                          onChange={(e) =>
                            setFormData({ ...formData, [id]: e.target.value })
                          }
                          className="h-4 w-4 mt-0.5 text-blue-600 border-slate-300 focus:ring-blue-500 cursor-pointer shrink-0"
                        />
                        <span className="text-sm leading-snug">
                          {choiceLabel}
                        </span>
                      </label>
                    );
                  })}
                </div>
              ) : isCheckbox && hasChoices ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 pt-1">
                  {field.choices!.map((c) => {
                    const choiceVal = c.id || c.value || "";
                    const choiceLabel = c.label || c.name || c.value || "";
                    const currentValues = Array.isArray(formData[id])
                       ? (formData[id] as string[])
                       : [];
                    const isChecked = currentValues.includes(choiceVal);

                    return (
                      <label
                        key={choiceVal}
                        className={`flex items-start gap-3 p-3.5 rounded-xl border text-sm cursor-pointer transition-all min-h-[44px] ${
                          isChecked
                            ? "bg-blue-50/80 border-blue-500 text-blue-950 font-medium ring-2 ring-blue-500/10 shadow-xs"
                            : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300"
                        }`}
                      >
                        <input
                          type="checkbox"
                          value={choiceVal}
                          checked={isChecked}
                          onChange={(e) => {
                            const val = e.target.value;
                            const newValues = e.target.checked
                              ? [...currentValues, val]
                              : currentValues.filter((v) => v !== val);
                            setFormData({ ...formData, [id]: newValues });
                          }}
                          className="h-4 w-4 mt-0.5 rounded text-blue-600 border-slate-300 focus:ring-blue-500 cursor-pointer shrink-0"
                        />
                        <span className="text-sm leading-snug">
                          {choiceLabel}
                        </span>
                      </label>
                    );
                  })}
                </div>
              ) : isCascading && hasChoices ? (
                <CascadingSelectField
                  field={field}
                  value={
                    typeof formData[id] === "object" && formData[id] !== null
                      ? (formData[id] as { parent?: string; child?: string })
                      : undefined
                  }
                  onChange={(val) => setFormData({ ...formData, [id]: val })}
                  baseInputClass={baseInputClass}
                />
              ) : isSingleUserPicker || isMultiUserPicker ? (
                <UserPickerField
                  field={field}
                  isMulti={isMultiUserPicker}
                  value={formData[id] as string | string[] | undefined}
                  onChange={(val) => setFormData({ ...formData, [id]: val })}
                  query={pickerQueries[id] ?? ""}
                  onQueryChange={(q) =>
                    setPickerQueries({ ...pickerQueries, [id]: q })
                  }
                  choices={pickerChoices[id] || []}
                  isLoading={pickerLoading[id]}
                  isOpen={activePickerId === id}
                  onOpen={() => setActivePickerId(id)}
                  onClose={() => setActivePickerId(null)}
                  cache={selectedChoicesCache}
                  onCacheChoice={(key, choice) =>
                    setSelectedChoicesCache((prev) => ({ ...prev, [key]: choice }))
                  }
                  baseInputClass={baseInputClass}
                />
              ) : isSingleGroupPicker || isMultiGroupPicker ? (
                <GroupPickerField
                  field={field}
                  isMulti={isMultiGroupPicker}
                  value={formData[id] as string | string[] | undefined}
                  onChange={(val) => setFormData({ ...formData, [id]: val })}
                  query={pickerQueries[id] ?? ""}
                  onQueryChange={(q) =>
                    setPickerQueries({ ...pickerQueries, [id]: q })
                  }
                  choices={pickerChoices[id] || []}
                  isLoading={pickerLoading[id]}
                  isOpen={activePickerId === id}
                  onOpen={() => setActivePickerId(id)}
                  onClose={() => setActivePickerId(null)}
                  cache={selectedChoicesCache}
                  onCacheChoice={(key, choice) =>
                    setSelectedChoicesCache((prev) => ({ ...prev, [key]: choice }))
                  }
                  baseInputClass={baseInputClass}
                />
              ) : isLabels ? (
                <TagInputField
                  field={field}
                  tags={
                    Array.isArray(formData[id])
                      ? (formData[id] as string[])
                      : []
                  }
                  onChange={(tags) =>
                    setFormData({ ...formData, [id]: tags })
                  }
                  baseInputClass={baseInputClass}
                />
              ) : isDropdown && hasChoices ? (
                <div className="relative">
                  <select
                    id={id}
                    value={
                      typeof formData[id] === "string"
                        ? (formData[id] as string)
                        : ""
                    }
                    onChange={(e) =>
                      setFormData({ ...formData, [id]: e.target.value })
                    }
                    className={`${baseInputClass} appearance-none pr-10 cursor-pointer`}
                  >
                    <option value="" className="text-slate-400">
                      Select an option...
                    </option>
                    {field.choices!.map((c) => (
                      <option
                        key={c.id || c.value}
                        value={c.id || c.value}
                        className="text-slate-900"
                      >
                        {c.label || c.name || c.value}
                      </option>
                    ))}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3.5 text-slate-400">
                    <ChevronDown className="w-4 h-4" />
                  </div>
                </div>
              ) : isLongText ? (
                <textarea
                  id={id}
                  rows={4}
                  placeholder={
                    field.description ||
                    "Provide comprehensive details, specifications, or steps..."
                  }
                  value={
                    typeof formData[id] === "string"
                      ? (formData[id] as string)
                      : ""
                  }
                  onChange={(e) =>
                    setFormData({ ...formData, [id]: e.target.value })
                  }
                  className={`${baseInputClass} resize-y min-h-25 leading-relaxed`}
                />
              ) : isFile ? (
                <FileAttachmentField
                  field={field}
                  files={fileList[id] || []}
                  onFilesAdded={(newFiles) => handleFilesAdded(id, newFiles)}
                  onFileRemoved={(idx) => removeFile(id, idx)}
                />
              ) : isDate || isDateTime || isTime ? (
                <div className="relative">
                  {isTime ? (
                    <Clock className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  ) : (
                    <Calendar className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  )}
                  <input
                    type={
                      isDate
                        ? "date"
                        : isDateTime
                          ? "datetime-local"
                          : "time"
                    }
                    id={id}
                    value={
                      typeof formData[id] === "string"
                        ? (formData[id] as string)
                        : ""
                    }
                    onChange={(e) =>
                      setFormData({ ...formData, [id]: e.target.value })
                    }
                    className={`${baseInputClass} pl-10`}
                  />
                </div>
              ) : isEmail ? (
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    type="email"
                    id={id}
                    placeholder="e.g. first.last@company.com"
                    value={
                      typeof formData[id] === "string"
                        ? (formData[id] as string)
                        : ""
                    }
                    onChange={(e) =>
                      setFormData({ ...formData, [id]: e.target.value })
                    }
                    className={`${baseInputClass} pl-10`}
                  />
                </div>
              ) : isUrl ? (
                <div className="relative">
                  <Globe className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    type="url"
                    id={id}
                    placeholder="https://..."
                    value={
                      typeof formData[id] === "string"
                        ? (formData[id] as string)
                        : ""
                    }
                    onChange={(e) =>
                      setFormData({ ...formData, [id]: e.target.value })
                    }
                    className={`${baseInputClass} pl-10`}
                  />
                </div>
              ) : isAsset ? (
                <div className="relative">
                  <Box className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    id={id}
                    placeholder="Enter asset key or tag (e.g. AST-10021)..."
                    value={
                      typeof formData[id] === "string"
                        ? (formData[id] as string)
                        : ""
                    }
                    onChange={(e) =>
                      setFormData({ ...formData, [id]: e.target.value })
                    }
                    className={`${baseInputClass} pl-10`}
                  />
                </div>
              ) : (
                <div className="relative">
                  {isNumber && (
                    <Hash className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  )}
                  <input
                    type={isNumber ? "number" : "text"}
                    id={id}
                    placeholder={
                      field.description || `Enter ${label.toLowerCase()}...`
                    }
                    value={
                      typeof formData[id] === "string" ||
                      typeof formData[id] === "number"
                        ? String(formData[id])
                        : ""
                    }
                    onChange={(e) =>
                      setFormData({ ...formData, [id]: e.target.value })
                    }
                    className={`${baseInputClass} ${isNumber ? "pl-10" : ""}`}
                  />
                </div>
              )}

              {/* Helper / Description text */}
              {field.description &&
                !isInfo &&
                !isLongText &&
                !isCascading &&
                !isSingleUserPicker &&
                !isMultiUserPicker && (
                  <p className="text-xs text-slate-500 pt-0.5 leading-normal">
                    {field.description}
                  </p>
                )}
            </div>
          );
        })}
      </div>

      {/* Action Bar */}
      <div className="pt-6 border-t border-slate-200 flex flex-col-reverse sm:flex-row items-center justify-end gap-3">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            disabled={submitting}
            className="w-full sm:w-auto px-6 py-3 sm:py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-700 bg-white hover:bg-slate-50 hover:text-slate-900 transition-all cursor-pointer shadow-xs disabled:opacity-50 min-h-[44px] flex items-center justify-center"
          >
            Cancel
          </button>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="w-full sm:w-auto px-7 py-3 sm:py-2.5 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 active:scale-[0.98] shadow-md shadow-blue-600/20 transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer min-h-[44px]"
        >
          {submitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Submitting Request...</span>
            </>
          ) : (
            <>
              <Send className="w-4 h-4" />
              <span>{submitLabel}</span>
            </>
          )}
        </button>
      </div>
    </form>
  );
};
