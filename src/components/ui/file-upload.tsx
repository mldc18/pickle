"use client";

import { useRef, useState } from "react";
import { cn } from "@/lib/cn";
import { Upload, FileCheck } from "lucide-react";

interface FileUploadProps {
  label: string;
  accept?: string;
  onChange: (file: File | null) => void;
  error?: string;
}

export function FileUpload({ label, accept = "image/*", onChange, error }: FileUploadProps) {
  const [fileName, setFileName] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] || null;
    setFileName(file?.name || null);
    onChange(file);
  }

  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-sm font-medium">{label}</span>
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className={cn(
          "flex h-24 w-full flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed transition-colors",
          error
            ? "border-destructive bg-destructive/5"
            : fileName
              ? "border-success/50 bg-success/5"
              : "border-input-border hover:border-accent/50 hover:bg-accent/5 bg-input-bg"
        )}
      >
        {fileName ? (
          <>
            <FileCheck className="h-5 w-5 text-success" />
            <span className="text-xs text-success font-medium">{fileName}</span>
          </>
        ) : (
          <>
            <Upload className="h-5 w-5 text-muted" />
            <span className="text-xs text-muted">Tap to upload</span>
          </>
        )}
      </button>
      <input ref={inputRef} type="file" accept={accept} onChange={handleChange} className="hidden" />
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
