"use client";

import * as React from "react";
import { useEffect, useRef } from "react";
import { cn } from "@/lib/cn";
import { X } from "lucide-react";

interface DialogProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
}

function Dialog({ open, onClose, title, description, children }: DialogProps) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    if (open) ref.current?.showModal();
    else ref.current?.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      className="w-[90vw] max-w-md rounded-xl border border-card-border bg-card p-0 text-foreground shadow-lg backdrop:bg-black/50"
    >
      <div className="flex flex-col gap-2 p-6">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-lg font-semibold">{title}</h2>
            {description && <p className="text-sm text-muted mt-1">{description}</p>}
          </div>
          <button
            onClick={onClose}
            className="rounded-md p-1 text-muted hover:text-foreground hover:bg-card-border/50 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        {children}
      </div>
    </dialog>
  );
}

export { Dialog };
