'use client';

import { useState } from 'react';
import { useFilePreview } from '@/lib/useFilePreview';

export function FilePreview({ documentId }: { documentId: string | undefined }) {
  const { url, mimeType, loading, error } = useFilePreview(documentId);
  const [zoom, setZoom] = useState(1);

  return (
    <div className="flex h-full flex-col rounded-lg border border-gray-200 bg-white shadow-sm">
      <div className="flex items-center justify-end gap-1 border-b border-gray-100 px-2 py-1.5">
        <button
          onClick={() => setZoom((z) => Math.max(0.5, z - 0.1))}
          className="flex h-7 w-7 items-center justify-center rounded text-gray-500 hover:bg-gray-100"
        >
          −
        </button>
        <span className="w-12 text-center text-xs text-gray-500">{Math.round(zoom * 100)}%</span>
        <button
          onClick={() => setZoom((z) => Math.min(2, z + 0.1))}
          className="flex h-7 w-7 items-center justify-center rounded text-gray-500 hover:bg-gray-100"
        >
          +
        </button>
      </div>
      <div className="flex-1 overflow-auto bg-gray-50 p-2">
        {loading && <p className="p-4 text-sm text-gray-400">Loading preview…</p>}
        {!loading && (error || !url) && (
          <p className="p-4 text-sm text-gray-400">Preview isn&apos;t available for this document.</p>
        )}
        {!loading && url && (
          <div style={{ transform: `scale(${zoom})`, transformOrigin: 'top left' }}>
            {mimeType?.startsWith('image/') ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={url} alt="Document preview" className="max-w-none" />
            ) : (
              <iframe src={url} title="Document preview" className="h-[900px] w-[700px] border-0" />
            )}
          </div>
        )}
      </div>
    </div>
  );
}
