'use client';

import { useEffect, useRef, useState } from 'react';
import { useUploadDocument } from '@/lib/queries';
import { ApiClientError } from '@/lib/apiClient';
import type { DocumentType } from '@/types/api';

const STAGES = ['Uploading', 'Parsing with Gemini', 'Mapping to SKU Master', 'Finalizing'];

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
  const [stageIndex, setStageIndex] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
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

  const errorMessage =
    mutation.error instanceof ApiClientError
      ? `${mutation.error.message}${mutation.error.details ? ` (${JSON.stringify(mutation.error.details)})` : ''}`
      : mutation.error
      ? 'Upload failed'
      : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Upload Document</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700">
            ✕
          </button>
        </div>

        {defaultPoNumber && (
          <p className="mb-3 text-xs text-gray-500">
            Adding a document for PO <span className="font-mono">{defaultPoNumber}</span>. The
            poNumber is read from the uploaded file itself, not this field.
          </p>
        )}

        <label className="mb-1 block text-sm font-medium text-gray-700">Document type</label>
        <select
          className="mb-4 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
          value={documentType}
          onChange={(e) => setDocumentType(e.target.value as DocumentType)}
          disabled={mutation.isPending}
        >
          <option value="po">Purchase Order</option>
          <option value="grn">GRN (Delivery)</option>
          <option value="invoice">Invoice (Fulfillment)</option>
        </select>

        <label className="mb-1 block text-sm font-medium text-gray-700">File (PDF or image)</label>
        <input
          type="file"
          accept="application/pdf,image/png,image/jpeg,image/webp"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          disabled={mutation.isPending}
          className="mb-4 w-full text-sm"
        />

        {mutation.isPending && (
          <div className="mb-4 rounded-md bg-blue-50 p-3 text-sm text-blue-700">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 animate-pulse rounded-full bg-blue-600" />
              {STAGES[stageIndex]}…
            </div>
          </div>
        )}

        {errorMessage && <p className="mb-4 text-sm text-red-600">{errorMessage}</p>}

        {mutation.isSuccess && !mutation.isPending && (
          <p className="mb-4 text-sm text-green-600">Uploaded and matched successfully.</p>
        )}

        <div className="flex justify-end gap-2">
          <button
            onClick={onClose}
            className="rounded-md border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
          >
            Close
          </button>
          <button
            onClick={handleSubmit}
            disabled={!file || mutation.isPending}
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {mutation.isPending ? 'Uploading…' : 'Upload'}
          </button>
        </div>
      </div>
    </div>
  );
}
