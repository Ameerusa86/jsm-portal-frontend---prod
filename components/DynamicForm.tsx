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
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface DynamicFormProps {
  fields: FormField[];
  onSubmit: (values: Record<string, unknown>) => Promise<void>;
  onCancel?: () => void;
  submitLabel?: string;
}

const computeInitialFormData = (fieldsList: FormField[]) => {
  const defaults: Record<string, unknown> = {};
  fieldsList.forEach((f) => {
    const id = (f.id || f.fieldId) as string;
    if (f.default !== undefined) {
      defaults[id] = f.default;
    } else if (f.value !== undefined) {
      defaults[id] = f.value;
    } else if (
      f.type === "checkbox" ||
      f.type === "multiselect" ||
      f.type === "labels" ||
      f.type === "multi-user-picker" ||
      f.type === "multi-group-picker"
    ) {
      defaults[id] = [];
    } else if (f.type === "cascading" || f.type === "cascading-select") {
      defaults[id] = {};
    }
  });
  return defaults;
};

export const DynamicForm: React.FC<DynamicFormProps> = ({
  fields,
  onSubmit,
  onCancel,
  submitLabel = "Submit Request",
}) => {
  const [prevFields, setPrevFields] = useState<FormField[]>(fields);
  const [formData, setFormData] = useState<Record<string, unknown>>(() =>
    computeInitialFormData(fields)
  );

  if (fields !== prevFields) {
    setPrevFields(fields);
    setFormData(computeInitialFormData(fields));
  }
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
  }, [activePickerId, activePickerQuery, activePickerField]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    // Validate required fields
    for (const field of fields) {
      if (field.required) {
        const id = (field.id || field.fieldId) as string;
        const val = formData[id];

        if (val === undefined || val === null || val === "") {
          setValidationError(`Please fill out the required field: "${field.label || field.name}"`);
          return;
        }

        if (Array.isArray(val) && val.length === 0) {
          setValidationError(`Please select at least one option for: "${field.label || field.name}"`);
          return;
        }

        if (typeof val === "object" && !Array.isArray(val)) {
          const obj = val as Record<string, unknown>;
          if (!obj.parent && !obj.child && Object.keys(obj).length === 0) {
            setValidationError(`Please make a selection for: "${field.label || field.name}"`);
            return;
          }
        }
      }
    }

    setSubmitting(true);
    try {
      await onSubmit(formData);
    } catch (err: unknown) {
      setValidationError(err instanceof Error ? err.message : "Failed to submit request");
    } finally {
      setSubmitting(false);
    }
  };

  const handleFilesAdded = (id: string, newFiles: FileList | File[]) => {
    const added = Array.from(newFiles);
    const existing = fileList[id] || [];
    const combined = [...existing, ...added];
    setFileList({ ...fileList, [id]: combined });
    setFormData({ ...formData, [id]: combined.map((f) => f.name) });
  };

  const removeFile = (id: string, index: number) => {
    const updated = (fileList[id] || []).filter((_, i) => i !== index);
    setFileList({ ...fileList, [id]: updated });
    setFormData({ ...formData, [id]: updated.map((f) => f.name) });
  };

  const baseInputClass =
    "w-full rounded-lg border border-input bg-background py-2 px-3 text-base sm:text-sm text-foreground placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 outline-none transition-all shadow-xs min-h-[40px]";

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
        <Card className="p-4 bg-destructive/10 border-destructive/20 text-destructive flex flex-row items-start gap-3 text-sm animate-shake">
          <AlertCircle className="size-5 shrink-0 mt-0.5 text-destructive" />
          <div className="flex-1">
            <p className="font-semibold text-destructive">Submission Incomplete</p>
            <p className="text-xs mt-0.5 text-destructive/80">{validationError}</p>
          </div>
        </Card>
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
                  <Label
                    htmlFor={id}
                    className="text-sm font-semibold text-foreground flex items-center"
                  >
                    <span>{label}</span>
                    {field.required ? (
                      <span
                        className="text-destructive ml-1 font-bold"
                        title="Required field"
                      >
                        *
                      </span>
                    ) : (
                      <span className="text-xs text-muted-foreground font-normal ml-1.5">
                        (Optional)
                      </span>
                    )}
                  </Label>
                </div>
              )}

              {/* Render Field By Type */}
              {isInfo ? (
                <Card className="rounded-xl bg-blue-50/90 border-blue-200/90 dark:bg-blue-950/40 dark:border-blue-900 p-4 text-blue-900 dark:text-blue-200 my-2 flex flex-row items-start gap-3">
                  <Info className="size-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                  <div className="text-xs space-y-1">
                    <p className="font-semibold text-sm text-blue-950 dark:text-blue-100">
                      {label}
                    </p>
                    <p className="text-blue-800 dark:text-blue-300 leading-relaxed">
                      {field.description}
                    </p>
                  </div>
                </Card>
              ) : isRadio && hasChoices ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 pt-1">
                  {field.choices!.map((c) => {
                    const choiceVal = c.id || c.value || "";
                    const choiceLabel = c.label || c.name || c.value || "";
                    const isSelected = formData[id] === choiceVal;

                    return (
                      <Label
                        key={choiceVal}
                        className={cn(
                          "flex items-start gap-3 p-3.5 rounded-xl border text-sm cursor-pointer transition-all min-h-[44px]",
                          isSelected
                            ? "bg-blue-50/80 border-blue-500 text-blue-950 dark:bg-blue-950/40 dark:text-blue-100 font-medium ring-2 ring-blue-500/10 shadow-xs"
                            : "bg-card border-border text-foreground hover:bg-muted/40 hover:border-slate-300"
                        )}
                      >
                        <input
                          type="radio"
                          name={id}
                          value={choiceVal}
                          checked={isSelected}
                          onChange={(e) =>
                            setFormData({ ...formData, [id]: e.target.value })
                          }
                          className="size-4 mt-0.5 text-primary border-input focus:ring-ring cursor-pointer shrink-0"
                        />
                        <span className="text-sm leading-snug">
                          {choiceLabel}
                        </span>
                      </Label>
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
                      <Label
                        key={choiceVal}
                        className={cn(
                          "flex items-start gap-3 p-3.5 rounded-xl border text-sm cursor-pointer transition-all min-h-[44px]",
                          isChecked
                            ? "bg-blue-50/80 border-blue-500 text-blue-950 dark:bg-blue-950/40 dark:text-blue-100 font-medium ring-2 ring-blue-500/10 shadow-xs"
                            : "bg-card border-border text-foreground hover:bg-muted/40 hover:border-slate-300"
                        )}
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
                          className="size-4 mt-0.5 rounded text-primary border-input focus:ring-ring cursor-pointer shrink-0"
                        />
                        <span className="text-sm leading-snug">
                          {choiceLabel}
                        </span>
                      </Label>
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
                    className={cn(baseInputClass, "appearance-none pr-10 cursor-pointer")}
                  >
                    <option value="" className="text-muted-foreground">
                      Select an option...
                    </option>
                    {field.choices!.map((c) => (
                      <option
                        key={c.id || c.value}
                        value={c.id || c.value}
                        className="text-foreground"
                      >
                        {c.label || c.name || c.value}
                      </option>
                    ))}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground">
                    <ChevronDown className="size-4" />
                  </div>
                </div>
              ) : isLongText ? (
                <Textarea
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
                  className="resize-y min-h-25 leading-relaxed bg-background"
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
                    <Clock className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                  ) : (
                    <Calendar className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                  )}
                  <Input
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
                    className="pl-9 h-10"
                  />
                </div>
              ) : isEmail ? (
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                  <Input
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
                    className="pl-9 h-10"
                  />
                </div>
              ) : isUrl ? (
                <div className="relative">
                  <Globe className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                  <Input
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
                    className="pl-9 h-10"
                  />
                </div>
              ) : isAsset ? (
                <div className="relative">
                  <Box className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                  <Input
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
                    className="pl-9 h-10"
                  />
                </div>
              ) : (
                <div className="relative">
                  {isNumber && (
                    <Hash className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                  )}
                  <Input
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
                    className={cn("h-10", isNumber && "pl-9")}
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
                  <p className="text-xs text-muted-foreground pt-0.5 leading-normal">
                    {field.description}
                  </p>
                )}
            </div>
          );
        })}
      </div>

      {/* Action Bar */}
      <div className="pt-6 border-t border-border/70 flex flex-col-reverse sm:flex-row items-center justify-end gap-3">
        {onCancel && (
          <Button
            type="button"
            variant="outline"
            size="lg"
            onClick={onCancel}
            disabled={submitting}
            className="w-full sm:w-auto cursor-pointer"
          >
            Cancel
          </Button>
        )}

        <Button
          type="submit"
          variant="default"
          size="lg"
          disabled={submitting}
          className="w-full sm:w-auto cursor-pointer gap-2 shadow-md"
        >
          {submitting ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              <span>Submitting Request...</span>
            </>
          ) : (
            <>
              <Send className="size-4" />
              <span>{submitLabel}</span>
            </>
          )}
        </Button>
      </div>
    </form>
  );
};
