'use client';

import { useEffect, useRef, useState } from 'react';
import { useUploadDocument } from '@/lib/queries';
import { ApiClientError } from '@/lib/apiClient';
import { Button } from '@/components/ui/Button';
import type { DocumentType } from '@/types/api';

const STAGES = ['Uploading', 'Parsing with Gemini', 'Mapping to SKU Master', 'Finalizing'];

const DOC_TYPES: { id: DocumentType; label: string; hint: string }[] = [
  { id: 'po', label: 'Purchase Order', hint: 'What was ordered' },
  { id: 'grn', label: 'GRN', hint: 'What was received' },
  { id: 'invoice', label: 'Invoice', hint: "What's being billed" },
];

function UploadIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="17 8 12 3 7 8" />
      <line x1="12" y1="3" x2="12" y2="15" />
    </svg>
  );
}

function FileIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <path d="M14 2v6h6" />
    </svg>
  );
}

export function UploadModal({
  open,
  onClose,
  onUploaded,
  defaultPoNumber,
}: {
  open: boolean;
  onClose: () => void;
  onUploaded: (poNumber: string) => void;
  defaultPoNumber?: string;
}) {
  const [documentType, setDocumentType] = useState<DocumentType>('po');
  const [file, setFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [stageIndex, setStageIndex] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mutation = useUploadDocument();

  useEffect(() => {
    if (mutation.isPending) {
      setStageIndex(0);
      timerRef.current = setInterval(() => {
        setStageIndex((i) => Math.min(i + 1, STAGES.length - 1));
      }, 700);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [mutation.isPending]);

  if (!open) return null;

  async function handleSubmit() {
    if (!file) return;
    try {
      const result = await mutation.mutateAsync({ file, documentType });
      onUploaded(result.document.poNumber);
      setFile(null);
      mutation.reset();
    } catch {
      // error surfaced via mutation.error below
    }
  }

  function handleClose() {
    setFile(null);
    mutation.reset();
    onClose();
  }

  const errorMessage =
    mutation.error instanceof ApiClientError
      ? `${mutation.error.message}${mutation.error.details ? ` (${JSON.stringify(mutation.error.details)})` : ''}`
      : mutation.error
      ? 'Upload failed'
      : null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/50 p-4 backdrop-blur-sm"
      onClick={handleClose}
    >
      <div
        className="w-full max-w-md rounded-2xl bg-white shadow-2xl ring-1 ring-black/5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
              <UploadIcon />
            </div>
            <h2 className="text-base font-semibold text-gray-900">Upload Document</h2>
          </div>
          <button
            onClick={handleClose}
            className="flex h-7 w-7 items-center justify-center rounded-full text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="px-6 py-5">
          {defaultPoNumber && (
            <p className="mb-4 rounded-lg bg-gray-50 px-3 py-2 text-xs text-gray-500">
              Adding a document for PO <span className="font-mono font-medium text-gray-700">{defaultPoNumber}</span>.
              The poNumber is read from the uploaded file itself, not this field.
            </p>
          )}

          <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-gray-500">
            Document type
          </label>
          <div className="mb-5 grid grid-cols-3 gap-2">
            {DOC_TYPES.map((dt) => {
              const isActive = dt.id === documentType;
              return (
                <button
                  key={dt.id}
                  type="button"
                  onClick={() => setDocumentType(dt.id)}
                  disabled={mutation.isPending}
                  className={`rounded-lg border px-2 py-2.5 text-left transition-all ${
                    isActive
                      ? 'border-indigo-600 bg-indigo-50 ring-1 ring-indigo-600'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <p className={`text-xs font-semibold ${isActive ? 'text-indigo-700' : 'text-gray-700'}`}>
                    {dt.label}
                  </p>
                  <p className="mt-0.5 text-[10px] leading-tight text-gray-400">{dt.hint}</p>
                </button>
              );
            })}
          </div>

          <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-gray-500">
            File
          </label>
          <input
            ref={fileInputRef}
            type="file"
            accept="application/pdf,image/png,image/jpeg,image/webp"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            disabled={mutation.isPending}
            className="hidden"
          />
          <div
            onClick={() => !mutation.isPending && fileInputRef.current?.click()}
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragOver(false);
              const dropped = e.dataTransfer.files?.[0];
              if (dropped) setFile(dropped);
            }}
            className={`flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed px-4 py-6 text-center transition-colors ${
              dragOver
                ? 'border-indigo-400 bg-indigo-50/60'
                : file
                ? 'border-gray-300 bg-gray-50'
                : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
            }`}
          >
            {file ? (
              <>
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-100 text-indigo-600">
                  <FileIcon />
                </div>
                <p className="mt-2 max-w-full truncate text-sm font-medium text-gray-800">{file.name}</p>
                <p className="text-xs text-gray-400">{(file.size / 1024).toFixed(0)} KB · click to change</p>
              </>
            ) : (
              <>
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100 text-gray-400">
                  <UploadIcon />
                </div>
                <p className="mt-2 text-sm text-gray-600">
                  <span className="font-medium text-indigo-600">Click to upload</span> or drag and drop
                </p>
                <p className="text-xs text-gray-400">PDF, PNG, JPEG, or WebP</p>
              </>
            )}
          </div>

          {mutation.isPending && (
            <div className="mt-4 rounded-lg bg-indigo-50 p-3">
              <div className="mb-2 flex items-center gap-2 text-sm font-medium text-indigo-700">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-indigo-500 opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-indigo-600" />
                </span>
                {STAGES[stageIndex]}…
              </div>
              <div className="flex gap-1">
                {STAGES.map((_, idx) => (
                  <div
                    key={idx}
                    className={`h-1 flex-1 rounded-full transition-colors ${
                      idx <= stageIndex ? 'bg-indigo-600' : 'bg-indigo-100'
                    }`}
                  />
                ))}
              </div>
            </div>
          )}

          {errorMessage && (
            <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{errorMessage}</p>
          )}

          {mutation.isSuccess && !mutation.isPending && (
            <p className="mt-4 rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700">
              Uploaded and matched successfully.
            </p>
          )}
        </div>

        <div className="flex justify-end gap-2 rounded-b-2xl border-t border-gray-100 bg-gray-50/60 px-6 py-4">
          <Button variant="secondary" onClick={handleClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!file || mutation.isPending}>
            {mutation.isPending ? 'Uploading…' : 'Upload'}
          </Button>
        </div>
      </div>
    </div>
  );
}
