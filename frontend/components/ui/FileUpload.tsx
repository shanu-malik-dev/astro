"use client";

import { ChangeEvent, DragEvent, useEffect, useRef, useState } from "react";
import { CloudUpload, X } from "lucide-react";
import { PublicAssetImage } from "./PublicAssetImage";

interface FileUploadProps {
  value?: string;
  accept?: string;
  title?: string;
  helperText?: string;
  buttonLabel?: string;
  previewAlt?: string;
  previewType?: "image" | "video";
  disabled?: boolean;
  className?: string;
  onFileSelect: (file: File) => void;
  onClear?: () => void;
}

export function FileUpload({
  value,
  accept,
  title = "Choose a file or drag & drop it here",
  helperText = "JPEG, PNG, PDF, and MP4 formats, up to 50MB",
  buttonLabel = "Browse File",
  previewAlt = "Selected file preview",
  previewType = "image",
  disabled = false,
  className = "",
  onFileSelect,
  onClear,
}: FileUploadProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [localPreview, setLocalPreview] = useState("");
  const previewUrl = value || localPreview;

  useEffect(() => {
    if (value && localPreview) setLocalPreview("");
  }, [localPreview, value]);

  useEffect(() => {
    return () => {
      if (localPreview) URL.revokeObjectURL(localPreview);
    };
  }, [localPreview]);

  const openFilePicker = () => {
    if (!disabled) inputRef.current?.click();
  };

  const selectFile = (file?: File | null) => {
    if (!file || disabled) return;
    if (
      file.type.startsWith("image/") ||
      file.type.startsWith("video/")
    ) {
      setLocalPreview((currentPreview) => {
        if (currentPreview) URL.revokeObjectURL(currentPreview);
        return URL.createObjectURL(file);
      });
    }
    onFileSelect(file);
  };

  const handleInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    selectFile(event.target.files?.[0]);
    event.target.value = "";
  };

  const handleDragOver = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    if (!disabled) setIsDragging(true);
  };

  const handleDragLeave = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(false);
    selectFile(event.dataTransfer.files?.[0]);
  };

  return (
    <div className={className}>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        disabled={disabled}
        onChange={handleInputChange}
        className="sr-only"
      />

      {previewUrl ? (
        <div className="relative overflow-hidden rounded-lg border border-dashed border-mist bg-white">
          {previewType === "video" ? (
            <video
              src={previewUrl}
              controls
              className="h-48 w-full bg-black object-contain"
            />
          ) : (
            <PublicAssetImage
              src={previewUrl}
              alt={previewAlt}
              className="h-48 w-full bg-white object-contain"
            />
          )}

          {onClear && (
            <button
              type="button"
              onClick={() => {
                setLocalPreview((currentPreview) => {
                  if (currentPreview) URL.revokeObjectURL(currentPreview);
                  return "";
                });
                onClear();
              }}
              disabled={disabled}
              className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full border border-mist bg-white text-ink/65 shadow-sm transition hover:border-red-200 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-50"
              aria-label="Remove selected file"
            >
              <X size={16} />
            </button>
          )}
        </div>
      ) : (
        <div
          role="button"
          tabIndex={disabled ? -1 : 0}
          onClick={openFilePicker}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault();
              openFilePicker();
            }
          }}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`flex min-h-44 flex-col items-center justify-center rounded-lg border-2 border-dashed px-5 py-8 text-center transition ${
            isDragging
              ? "border-gold bg-gold/10"
              : "border-slate-300 bg-white/65 hover:border-gold"
          } ${disabled ? "cursor-not-allowed opacity-60" : "cursor-pointer"}`}
        >
          <CloudUpload size={24} className="text-ink/65" />
          <p className="mt-4 text-sm font-semibold text-ink/80">{title}</p>
          <p className="mt-1 text-xs font-medium text-ink/35">{helperText}</p>
          <button
            type="button"
            disabled={disabled}
            onClick={(event) => {
              event.stopPropagation();
              openFilePicker();
            }}
            className="mt-5 rounded-md border border-mist bg-white px-4 py-2 text-sm font-medium text-ink/65 transition hover:border-gold hover:text-ink disabled:cursor-not-allowed"
          >
            {buttonLabel}
          </button>
        </div>
      )}
    </div>
  );
}
