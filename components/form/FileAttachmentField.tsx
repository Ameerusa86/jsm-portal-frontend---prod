"use client";

import React, { useState, useRef } from "react";
import { UploadCloud, File as FileIcon, X } from "lucide-react";
import { FormField } from "@/types/jsm";

interface FileAttachmentFieldProps {
  field: FormField;
  files: File[];
  onFilesAdded: (newFiles: FileList | File[]) => void;
  onFileRemoved: (index: number) => void;
}

export const FileAttachmentField: React.FC<FileAttachmentFieldProps> = ({
  field,
  files,
  onFilesAdded,
  onFileRemoved,
}) => {
  const id = (field.id || field.fieldId) as string;
  const [isDragActive, setIsDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleClickDropzone = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="space-y-3">
      <div
        role="button"
        tabIndex={0}
        onClick={handleClickDropzone}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            handleClickDropzone();
          }
        }}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragActive(true);
        }}
        onDragLeave={() => setIsDragActive(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragActive(false);
          if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            onFilesAdded(e.dataTransfer.files);
          }
        }}
        className={`border-2 border-dashed rounded-xl p-5 sm:p-6 text-center transition-colors cursor-pointer select-none ${
          isDragActive
            ? "border-blue-500 bg-blue-50/50"
            : "border-slate-300 hover:border-slate-400 bg-slate-50/50 active:bg-slate-100"
        }`}
      >
        <UploadCloud className="w-8 h-8 text-slate-400 mx-auto mb-2" />
        <p className="text-sm font-medium text-slate-700">
          Drag and drop files here, or{" "}
          <span className="text-blue-600 hover:text-blue-700 font-semibold underline underline-offset-2">
            browse files
          </span>
        </p>
        <input
          ref={fileInputRef}
          type="file"
          id={id}
          multiple
          className="sr-only"
          onChange={(e) => {
            if (e.target.files && e.target.files.length > 0) {
              onFilesAdded(e.target.files);
            }
          }}
        />
        <p className="text-xs text-slate-400 mt-1">
          Supports images, logs, PDFs, documents up to 25MB each
        </p>
      </div>

      {files && files.length > 0 && (
        <div className="flex flex-wrap gap-2 pt-1">
          {files.map((file, idx) => (
            <div
              key={`${file.name}-${idx}`}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-100 border border-slate-200 text-xs text-slate-700 font-medium min-h-[36px]"
            >
              <FileIcon className="w-3.5 h-3.5 text-blue-600 shrink-0" />
              <span className="truncate max-w-40 sm:max-w-48">{file.name}</span>
              <span className="text-[10px] text-slate-400 shrink-0">
                ({(file.size / 1024).toFixed(0)} KB)
              </span>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onFileRemoved(idx);
                }}
                className="text-slate-400 hover:text-rose-500 hover:bg-slate-200/60 transition-colors ml-1 p-1 -mr-1 rounded cursor-pointer min-h-[28px] min-w-[28px] flex items-center justify-center"
                title="Remove file"
                aria-label={`Remove file ${file.name}`}
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
