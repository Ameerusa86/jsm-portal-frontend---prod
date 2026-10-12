"use client";

import React, { useEffect, useState, useRef } from "react";
import {
  UploadCloud,
  File,
  X,
  AlertCircle,
  ChevronDown,
  Info,
  Send,
  Loader2,
  Search,
  UserRound,
  UsersRound,
  Calendar,
  Clock,
  Mail,
  Globe,
  Hash,
  Tag,
  Box,
  Plus,
} from "lucide-react";
import { Choice, FormField } from "@/types/jsm";
import { KnowledgeBaseSuggestions } from "./KnowledgeBaseSuggestions";

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
  const [dragActiveId, setDragActiveId] = useState<string | null>(null);

  // Picker search and selection state
  const [pickerQueries, setPickerQueries] = useState<Record<string, string>>(
    {},
  );
  const [activePickerId, setActivePickerId] = useState<string | null>(null);
  const [pickerChoices, setPickerChoices] = useState<Record<string, Choice[]>>(
    {},
  );
  const [pickerLoading, setPickerLoading] = useState<Record<string, boolean>>(
    {},
  );
  const [selectedChoicesCache, setSelectedChoicesCache] = useState<
    Record<string, Choice>
  >({});

  // Tag / Label input state
  const [tagInputs, setTagInputs] = useState<Record<string, string>>({});

  const pickerContainerRef = useRef<HTMLDivElement | null>(null);

  const activePickerField = fields.find(
    (f) => (f.id || f.fieldId) === activePickerId,
  );
  const activePickerQuery = activePickerId
    ? pickerQueries[activePickerId] || ""
    : "";

  // Close active picker on click outside or Escape key
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        pickerContainerRef.current &&
        !pickerContainerRef.current.contains(event.target as Node)
      ) {
        setActivePickerId(null);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setActivePickerId(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
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

    setPickerLoading((prev) => ({ ...prev, [activePickerId]: true }));

    const timer = window.setTimeout(async () => {
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
    "w-full rounded-xl border border-slate-300 bg-white py-2.5 px-3.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:outline-none focus:ring-4 focus:ring-blue-500/10 transition-all shadow-xs";

  // Find the summary field to use as the search query for KB articles
  const summaryField = fields.find(
    (f) =>
      (f.id || f.fieldId)?.toLowerCase() === "summary" ||
      f.name?.toLowerCase() === "summary"
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
                        className={`flex items-start gap-3 p-3.5 rounded-xl border text-sm cursor-pointer transition-all ${
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
                          className="h-4 w-4 mt-0.5 text-blue-600 border-slate-300 focus:ring-blue-500 cursor-pointer"
                        />
                        <span className="text-xs sm:text-sm leading-snug">
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
                        className={`flex items-start gap-3 p-3.5 rounded-xl border text-sm cursor-pointer transition-all ${
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
                          className="h-4 w-4 mt-0.5 rounded text-blue-600 border-slate-300 focus:ring-blue-500 cursor-pointer"
                        />
                        <span className="text-xs sm:text-sm leading-snug">
                          {choiceLabel}
                        </span>
                      </label>
                    );
                  })}
                </div>
              ) : isCascading && hasChoices ? (
                (() => {
                  const cascadingValue =
                    typeof formData[id] === "object" && formData[id] !== null
                      ? (formData[id] as { parent?: string; child?: string })
                      : {};
                  const selectedParent = field.choices!.find(
                    (choice) =>
                      (choice.id || choice.value) === cascadingValue.parent,
                  );
                  const childChoices =
                    selectedParent?.children ||
                    field.choices!.filter(
                      (choice) => choice.parentId === cascadingValue.parent,
                    );

                  const updateCascadingValue = (
                    key: "parent" | "child",
                    value: string,
                  ) => {
                    const nextValue = {
                      ...cascadingValue,
                      [key]: value,
                      ...(key === "parent" ? { child: "" } : {}),
                    };
                    setFormData({ ...formData, [id]: nextValue });
                  };

                  return (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {["parent", "child"].map((level) => {
                        const isParent = level === "parent";
                        const choices = isParent
                          ? field.choices!
                          : childChoices;
                        const value =
                          cascadingValue[isParent ? "parent" : "child"];

                        return (
                          <div key={level} className="relative">
                            <select
                              id={`${id}-${level}`}
                              value={value || ""}
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
                                {isParent
                                  ? "Select category..."
                                  : "Select sub-option..."}
                              </option>
                              {choices.map((choice) => {
                                const choiceValue =
                                  choice.id || choice.value || "";
                                return (
                                  <option key={choiceValue} value={choiceValue}>
                                    {choice.label ||
                                      choice.name ||
                                      choice.value}
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
                })()
              ) : isSingleUserPicker ? (
                /* SINGLE USER PICKER */
                (() => {
                  const selectedId = formData[id] as string | undefined;
                  const allChoices = [
                    ...(field.choices || []),
                    ...(pickerChoices[id] || []),
                  ];
                  const selectedUser = selectedId
                    ? selectedChoicesCache[selectedId] ||
                      allChoices.find(
                        (c) => (c.id || c.value || c.accountId) === selectedId,
                      ) || {
                        id: selectedId,
                        label: selectedId,
                        name: selectedId,
                      }
                    : null;

                  const query = pickerQueries[id] ?? "";
                  const filteredChoices = allChoices.filter((c) => {
                    const q = query.toLowerCase().trim();
                    if (!q) return true;
                    return (
                      c.label?.toLowerCase().includes(q) ||
                      c.name?.toLowerCase().includes(q) ||
                      c.email?.toLowerCase().includes(q)
                    );
                  });

                  const isOpen = activePickerId === id;

                  return (
                    <div
                      className="space-y-2 relative"
                      ref={isOpen ? pickerContainerRef : undefined}
                    >
                      {selectedUser && selectedId ? (
                        /* Selected User Card */
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
                              setFormData({ ...formData, [id]: "" });
                              setPickerQueries({ ...pickerQueries, [id]: "" });
                              setActivePickerId(id);
                            }}
                            className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                            title="Change selected user"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        /* Search User Input & Dropdown */
                        <div className="relative">
                          <div className="relative">
                            <UserRound className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                            <input
                              id={id}
                              type="text"
                              autoComplete="off"
                              placeholder="Search employees or specialists by name or email..."
                              value={query}
                              onFocus={() => setActivePickerId(id)}
                              onChange={(e) => {
                                setPickerQueries({
                                  ...pickerQueries,
                                  [id]: e.target.value,
                                });
                                setActivePickerId(id);
                              }}
                              className={`${baseInputClass} pl-10 pr-16`}
                            />
                            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
                              {pickerLoading[id] ? (
                                <Loader2 className="h-4 w-4 text-blue-600 animate-spin" />
                              ) : query ? (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setPickerQueries({
                                      ...pickerQueries,
                                      [id]: "",
                                    });
                                  }}
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
                                  onClick={() => setActivePickerId(null)}
                                  className="text-slate-400 hover:text-slate-700 cursor-pointer font-normal text-xs"
                                >
                                  Done
                                </button>
                              </div>
                              {filteredChoices.length > 0 ? (
                                filteredChoices.map((choice) => {
                                  const choiceVal =
                                    choice.id ||
                                    choice.value ||
                                    choice.accountId ||
                                    "";
                                  const choiceName =
                                    choice.label || choice.name || choiceVal;

                                  return (
                                    <button
                                      key={choiceVal}
                                      type="button"
                                      onMouseDown={(e) => e.preventDefault()}
                                      onClick={() => {
                                        setFormData({
                                          ...formData,
                                          [id]: choiceVal,
                                        });
                                        setSelectedChoicesCache((cache) => ({
                                          ...cache,
                                          [choiceVal]: choice,
                                        }));
                                        setPickerQueries({
                                          ...pickerQueries,
                                          [id]: "",
                                        });
                                        setActivePickerId(null);
                                      }}
                                      className="flex w-full items-center gap-3 px-3.5 py-2.5 text-left text-xs sm:text-sm text-slate-700 hover:bg-blue-50/70 transition-colors cursor-pointer"
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
                })()
              ) : isMultiUserPicker ? (
                /* MULTI USER PICKER */
                (() => {
                  const selectedIds = Array.isArray(formData[id])
                    ? (formData[id] as string[])
                    : [];
                  const allChoices = [
                    ...(field.choices || []),
                    ...(pickerChoices[id] || []),
                  ];
                  const query = pickerQueries[id] ?? "";
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

                  const isOpen = activePickerId === id;

                  return (
                    <div
                      className="space-y-2 relative"
                      ref={isOpen ? pickerContainerRef : undefined}
                    >
                      {/* Selected Users Chips */}
                      {selectedIds.length > 0 && (
                        <div className="flex flex-wrap gap-2 pt-1">
                          {selectedIds.map((userId) => {
                            const cached =
                              selectedChoicesCache[userId] ||
                              allChoices.find(
                                (c) =>
                                  (c.id || c.value || c.accountId) === userId,
                              );
                            const name =
                              cached?.label || cached?.name || userId;

                            return (
                              <div
                                key={userId}
                                className="inline-flex items-center gap-2 pl-2 pr-1.5 py-1 rounded-lg bg-blue-50 border border-blue-200 text-xs font-semibold text-blue-900"
                              >
                                <div className="w-4 h-4 rounded-full bg-blue-600 text-white text-[10px] flex items-center justify-center font-bold">
                                  {name.charAt(0).toUpperCase()}
                                </div>
                                <span className="truncate max-w-40">
                                  {name}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setFormData({
                                      ...formData,
                                      [id]: selectedIds.filter(
                                        (u) => u !== userId,
                                      ),
                                    });
                                  }}
                                  className="p-0.5 rounded text-blue-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {/* Search & Add User Input */}
                      <div className="relative">
                        <div className="relative">
                          <UserRound className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                          <input
                            id={id}
                            type="text"
                            autoComplete="off"
                            placeholder="Add employee or buddy..."
                            value={query}
                            onFocus={() => setActivePickerId(id)}
                            onChange={(e) => {
                              setPickerQueries({
                                ...pickerQueries,
                                [id]: e.target.value,
                              });
                              setActivePickerId(id);
                            }}
                            className={`${baseInputClass} pl-10 pr-16`}
                          />
                          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
                            {pickerLoading[id] ? (
                              <Loader2 className="h-4 w-4 text-blue-600 animate-spin" />
                            ) : (
                              <Search className="pointer-events-none h-4 w-4 text-slate-400" />
                            )}
                          </div>
                        </div>

                        {isOpen && (
                          <div className="absolute z-50 mt-1 max-h-52 w-full overflow-auto rounded-xl border border-slate-200 bg-white py-1 shadow-2xl">
                            <div className="flex items-center justify-between px-3 py-1.5 border-b border-slate-100 bg-slate-50 text-[11px] font-semibold text-slate-500">
                              <span>Select user to add</span>
                              <button
                                type="button"
                                onClick={() => setActivePickerId(null)}
                                className="text-slate-400 hover:text-slate-700 cursor-pointer font-normal text-xs"
                              >
                                Close
                              </button>
                            </div>
                            {filteredChoices.length > 0 ? (
                              filteredChoices.map((choice) => {
                                const choiceVal =
                                  choice.id ||
                                  choice.value ||
                                  choice.accountId ||
                                  "";
                                const choiceName =
                                  choice.label || choice.name || choiceVal;

                                return (
                                  <button
                                    key={choiceVal}
                                    type="button"
                                    onMouseDown={(e) => e.preventDefault()}
                                    onClick={() => {
                                      const next = [...selectedIds, choiceVal];
                                      setFormData({
                                        ...formData,
                                        [id]: next,
                                      });
                                      setSelectedChoicesCache((cache) => ({
                                        ...cache,
                                        [choiceVal]: choice,
                                      }));
                                      setPickerQueries({
                                        ...pickerQueries,
                                        [id]: "",
                                      });
                                      setActivePickerId(null);
                                    }}
                                    className="flex w-full items-center gap-3 px-3.5 py-2 text-left text-xs sm:text-sm text-slate-700 hover:bg-blue-50/70 transition-colors cursor-pointer"
                                  >
                                    <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 font-bold text-xs flex items-center justify-center shrink-0">
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
                                    <Plus className="w-4 h-4 text-blue-600 shrink-0" />
                                  </button>
                                );
                              })
                            ) : (
                              <div className="p-3 text-center text-xs text-slate-400">
                                No more users found
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })()
              ) : isSingleGroupPicker || isMultiGroupPicker ? (
                /* GROUP PICKER (SINGLE / MULTI) */
                (() => {
                  const isMulti = isMultiGroupPicker;
                  const selectedVal = formData[id];
                  const selectedGroups = isMulti
                    ? Array.isArray(selectedVal)
                      ? (selectedVal as string[])
                      : []
                    : typeof selectedVal === "string" && selectedVal
                      ? [selectedVal]
                      : [];

                  const allChoices = [
                    ...(field.choices || []),
                    ...(pickerChoices[id] || []),
                  ];
                  const query = pickerQueries[id] ?? "";
                  const filteredChoices = allChoices.filter((c) => {
                    const name = c.label || c.name || c.value || "";
                    if (selectedGroups.includes(name)) return false;
                    const q = query.toLowerCase().trim();
                    if (!q) return true;
                    return name.toLowerCase().includes(q);
                  });

                  const isOpen = activePickerId === id;

                  return (
                    <div
                      className="space-y-2 relative"
                      ref={isOpen ? pickerContainerRef : undefined}
                    >
                      {/* Selected Groups Chips */}
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
                                    setFormData({
                                      ...formData,
                                      [id]: selectedGroups.filter(
                                        (g) => g !== groupName,
                                      ),
                                    });
                                  } else {
                                    setFormData({ ...formData, [id]: "" });
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
                              onFocus={() => setActivePickerId(id)}
                              onChange={(e) => {
                                setPickerQueries({
                                  ...pickerQueries,
                                  [id]: e.target.value,
                                });
                                setActivePickerId(id);
                              }}
                              className={`${baseInputClass} pl-10 pr-16`}
                            />
                            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
                              {pickerLoading[id] ? (
                                <Loader2 className="h-4 w-4 text-blue-600 animate-spin" />
                              ) : (
                                <Search className="pointer-events-none h-4 w-4 text-slate-400" />
                              )}
                            </div>
                          </div>

                          {isOpen && (
                            <div className="absolute z-50 mt-1 max-h-52 w-full overflow-auto rounded-xl border border-slate-200 bg-white py-1 shadow-2xl">
                              <div className="flex items-center justify-between px-3 py-1.5 border-b border-slate-100 bg-slate-50 text-[11px] font-semibold text-slate-500">
                                <span>Suggested Groups</span>
                                <button
                                  type="button"
                                  onClick={() => setActivePickerId(null)}
                                  className="text-slate-400 hover:text-slate-700 cursor-pointer font-normal text-xs"
                                >
                                  Close
                                </button>
                              </div>
                              {filteredChoices.length > 0 ? (
                                filteredChoices.map((choice) => {
                                  const name =
                                    choice.label ||
                                    choice.name ||
                                    choice.value ||
                                    "";

                                  return (
                                    <button
                                      key={name}
                                      type="button"
                                      onMouseDown={(e) => e.preventDefault()}
                                      onClick={() => {
                                        if (isMulti) {
                                          setFormData({
                                            ...formData,
                                            [id]: [...selectedGroups, name],
                                          });
                                        } else {
                                          setFormData({
                                            ...formData,
                                            [id]: name,
                                          });
                                        }
                                        setPickerQueries({
                                          ...pickerQueries,
                                          [id]: "",
                                        });
                                        setActivePickerId(null);
                                      }}
                                      className="flex w-full items-center justify-between px-3.5 py-2 text-left text-xs sm:text-sm text-slate-700 hover:bg-indigo-50/70 transition-colors cursor-pointer"
                                    >
                                      <span className="font-semibold text-slate-900">
                                        {name}
                                      </span>
                                      <Plus className="w-4 h-4 text-indigo-600" />
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
                })()
              ) : isLabels ? (
                /* LABELS / TAGS COMPONENT */
                (() => {
                  const currentLabels = Array.isArray(formData[id])
                    ? (formData[id] as string[])
                    : [];
                  const tagInput = tagInputs[id] || "";

                  const addTag = (text: string) => {
                    const clean = text.trim().toLowerCase();
                    if (clean && !currentLabels.includes(clean)) {
                      setFormData({
                        ...formData,
                        [id]: [...currentLabels, clean],
                      });
                    }
                    setTagInputs({ ...tagInputs, [id]: "" });
                  };

                  return (
                    <div className="space-y-2">
                      <div className="flex flex-wrap gap-2">
                        {currentLabels.map((tag) => (
                          <span
                            key={tag}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-100 border border-slate-200 text-xs font-semibold text-slate-700"
                          >
                            <Tag className="w-3 h-3 text-slate-500" />
                            <span>{tag}</span>
                            <button
                              type="button"
                              onClick={() => {
                                setFormData({
                                  ...formData,
                                  [id]: currentLabels.filter((t) => t !== tag),
                                });
                              }}
                              className="text-slate-400 hover:text-rose-500 transition-colors cursor-pointer"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </span>
                        ))}
                      </div>

                      <div className="relative">
                        <Tag className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <input
                          id={id}
                          type="text"
                          value={tagInput}
                          placeholder="Type label and press Enter (e.g. soc2, audit, prod)..."
                          onChange={(e) =>
                            setTagInputs({ ...tagInputs, [id]: e.target.value })
                          }
                          onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === ",") {
                              e.preventDefault();
                              addTag(tagInput);
                            }
                          }}
                          className={`${baseInputClass} pl-10`}
                        />
                      </div>

                      {field.choices && field.choices.length > 0 && (
                        <div className="flex flex-wrap items-center gap-1.5 pt-1">
                          <span className="text-[11px] text-slate-400">
                            Suggestions:
                          </span>
                          {field.choices.map((c) => {
                            const val = c.label || c.name || c.value || "";
                            return (
                              <button
                                key={val}
                                type="button"
                                onClick={() => addTag(val)}
                                className="px-2 py-0.5 rounded text-[11px] bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors cursor-pointer"
                              >
                                + {val}
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })()
              ) : isDropdown && hasChoices ? (
                /* DROPDOWN SELECT */
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
                /* PARAGRAPH / TEXTAREA */
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
                /* FILE / ATTACHMENT UPLOAD */
                <div className="space-y-3">
                  <div
                    onDragOver={(e) => {
                      e.preventDefault();
                      setDragActiveId(id);
                    }}
                    onDragLeave={() => setDragActiveId(null)}
                    onDrop={(e) => {
                      e.preventDefault();
                      setDragActiveId(null);
                      if (
                        e.dataTransfer.files &&
                        e.dataTransfer.files.length > 0
                      ) {
                        handleFilesAdded(id, e.dataTransfer.files);
                      }
                    }}
                    className={`border-2 border-dashed rounded-xl p-6 text-center transition-colors ${
                      dragActiveId === id
                        ? "border-blue-500 bg-blue-50/50"
                        : "border-slate-300 hover:border-slate-400 bg-slate-50/50"
                    }`}
                  >
                    <UploadCloud className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                    <p className="text-xs sm:text-sm font-medium text-slate-700">
                      Drag and drop files here, or{" "}
                      <label className="text-blue-600 hover:text-blue-700 font-semibold cursor-pointer underline underline-offset-2">
                        <span>browse files</span>
                        <input
                          type="file"
                          multiple
                          className="sr-only"
                          onChange={(e) => {
                            if (e.target.files && e.target.files.length > 0) {
                              handleFilesAdded(id, e.target.files);
                            }
                          }}
                        />
                      </label>
                    </p>
                    <p className="text-[11px] text-slate-400 mt-1">
                      Supports images, logs, PDFs, documents up to 25MB each
                    </p>
                  </div>

                  {fileList[id] && fileList[id].length > 0 && (
                    <div className="flex flex-wrap gap-2 pt-1">
                      {fileList[id].map((file, idx) => (
                        <div
                          key={idx}
                          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-100 border border-slate-200 text-xs text-slate-700 font-medium"
                        >
                          <File className="w-3.5 h-3.5 text-blue-600" />
                          <span className="truncate max-w-45">{file.name}</span>
                          <span className="text-[10px] text-slate-400">
                            ({(file.size / 1024).toFixed(0)} KB)
                          </span>
                          <button
                            type="button"
                            onClick={() => removeFile(id, idx)}
                            className="text-slate-400 hover:text-rose-500 transition-colors ml-1 p-0.5 rounded cursor-pointer"
                            title="Remove file"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : isDate || isDateTime || isTime ? (
                /* DATE / DATETIME / TIME PICKERS */
                <div className="relative">
                  {isTime ? (
                    <Clock className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  ) : (
                    <Calendar className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  )}
                  <input
                    type={
                      isDate ? "date" : isDateTime ? "datetime-local" : "time"
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
                /* EMAIL INPUT */
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
                /* URL INPUT */
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
                /* ASSET / INSIGHT OBJECT */
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
                /* STANDARD TEXT / NUMBER */
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
            className="w-full sm:w-auto px-6 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-700 bg-white hover:bg-slate-50 hover:text-slate-900 transition-all cursor-pointer shadow-xs disabled:opacity-50"
          >
            Cancel
          </button>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="w-full sm:w-auto px-7 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 active:scale-[0.98] shadow-md shadow-blue-600/20 transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
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
