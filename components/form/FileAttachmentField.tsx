"use client";

import React, { useState, useRef } from "react";
import { UploadCloud, File as FileIcon, X } from "lucide-react";
import { FormField } from "@/types/jsm";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

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
      <Card
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
        className={`border-2 border-dashed rounded-xl p-5 sm:p-6 text-center transition-colors cursor-pointer select-none shadow-none ${
          isDragActive
            ? "border-primary bg-primary/5"
            : "border-input hover:border-muted-foreground/50 bg-muted/20 active:bg-muted/40"
        }`}
      >
        <UploadCloud className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
        <p className="text-sm font-medium text-foreground">
          Drag and drop files here, or{" "}
          <span className="text-primary hover:underline underline-offset-2 font-semibold">
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
        <p className="text-xs text-muted-foreground mt-1">
          Supports images, logs, PDFs, documents up to 25MB each
        </p>
      </Card>

      {files && files.length > 0 && (
        <div className="flex flex-wrap gap-2 pt-1">
          {files.map((file, idx) => (
            <div
              key={`${file.name}-${idx}`}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-muted border border-border text-xs text-foreground font-medium min-h-[36px]"
            >
              <FileIcon className="w-3.5 h-3.5 text-primary shrink-0" />
              <span className="truncate max-w-40 sm:max-w-48">{file.name}</span>
              <span className="text-[10px] text-muted-foreground shrink-0">
                ({(file.size / 1024).toFixed(0)} KB)
              </span>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={(e) => {
                  e.stopPropagation();
                  onFileRemoved(idx);
                }}
                className="h-6 w-6 text-muted-foreground hover:text-destructive hover:bg-destructive/10 ml-1 rounded-sm cursor-pointer"
                title="Remove file"
                aria-label={`Remove file ${file.name}`}
              >
                <X className="w-3.5 h-3.5" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
