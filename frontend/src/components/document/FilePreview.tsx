'use client';

import { useState } from 'react';
import { useFilePreview } from '@/lib/useFilePreview';

function ZoomIcon({ children }: { children: React.ReactNode }) {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
      {children}
    </svg>
  );
}

export function FilePreview({ documentId }: { documentId: string | undefined }) {
  const { url, mimeType, loading, error } = useFilePreview(documentId);
  const [zoom, setZoom] = useState(1);

  return (
    <div className="flex h-[65vh] max-h-[640px] min-h-[420px] flex-col overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-gray-100 px-3 py-2">
        <span className="text-xs font-semibold uppercase tracking-wide text-gray-400">Document Preview</span>
        <div className="flex items-center gap-0.5 rounded-lg bg-gray-100 p-0.5">
          <button
            onClick={() => setZoom((z) => Math.max(0.5, z - 0.1))}
            className="flex h-6 w-6 items-center justify-center rounded-md text-gray-500 transition-colors hover:bg-white hover:text-gray-900 hover:shadow-sm"
          >
            <ZoomIcon>
              <path d="M5 12h14" />
            </ZoomIcon>
          </button>
          <span className="w-10 text-center text-xs font-medium text-gray-500">{Math.round(zoom * 100)}%</span>
          <button
            onClick={() => setZoom((z) => Math.min(2, z + 0.1))}
            className="flex h-6 w-6 items-center justify-center rounded-md text-gray-500 transition-colors hover:bg-white hover:text-gray-900 hover:shadow-sm"
          >
            <ZoomIcon>
              <path d="M12 5v14M5 12h14" />
            </ZoomIcon>
          </button>
        </div>
      </div>
      <div className="relative flex-1 overflow-auto bg-gray-50">
        {loading && (
          <div className="flex h-full items-center justify-center text-sm text-gray-400">Loading preview…</div>
        )}
        {!loading && (error || !url) && (
          <div className="flex h-full items-center justify-center px-4 text-center text-sm text-gray-400">
            Preview isn&apos;t available for this document.
          </div>
        )}
        {!loading && url && (
          <div
            className="min-h-full"
            style={{ transform: `scale(${zoom})`, transformOrigin: 'top center' }}
          >
            {mimeType?.startsWith('image/') ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={url} alt="Document preview" className="w-full" />
            ) : (
              <iframe src={url} title="Document preview" className="h-[65vh] max-h-[640px] min-h-[420px] w-full border-0" />
            )}
          </div>
        )}
      </div>
    </div>
  );
}
