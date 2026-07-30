'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useDocuments } from '@/lib/queries';
import { UploadModal } from '@/components/upload/UploadModal';
import type { PurchaseOrderDoc } from '@/types/api';

export default function HomePage() {
  const router = useRouter();
  const { data: poDocs, isLoading } = useDocuments(undefined, 'po');
  const [uploadOpen, setUploadOpen] = useState(false);

  const pos = (poDocs as PurchaseOrderDoc[] | undefined) ?? [];
  const uniqueByPoNumber = Array.from(new Map(pos.map((p) => [p.poNumber, p])).values());

  return (
    <div className="mx-auto max-w-4xl p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Purchase Orders</h1>
          <p className="text-sm text-gray-500">Upload a PO, GRN, or Invoice to begin matching.</p>
        </div>
        <button
          onClick={() => setUploadOpen(true)}
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          Upload Document
        </button>
      </div>

      {isLoading && <p className="text-sm text-gray-400">Loading…</p>}

      {!isLoading && uniqueByPoNumber.length === 0 && (
        <div className="rounded-lg border border-dashed border-gray-300 p-8 text-center text-sm text-gray-400">
          No documents uploaded yet. Upload a PO, GRN, or Invoice to get started - order doesn&apos;t
          matter.
        </div>
      )}

      <div className="grid gap-3">
        {uniqueByPoNumber.map((po) => (
          <button
            key={po.poNumber}
            onClick={() => router.push(`/po/${encodeURIComponent(po.poNumber)}`)}
            className="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-4 text-left shadow-sm hover:border-blue-300"
          >
            <div>
              <p className="font-mono text-sm font-medium text-gray-900">{po.poNumber}</p>
              <p className="text-xs text-gray-500">{po.vendorName}</p>
            </div>
            <span className="text-xs text-gray-400">{new Date(po.poDate).toLocaleDateString()}</span>
          </button>
        ))}
      </div>

      <UploadModal
        open={uploadOpen}
        onClose={() => setUploadOpen(false)}
        onUploaded={(poNumber) => {
          setUploadOpen(false);
          router.push(`/po/${encodeURIComponent(poNumber)}`);
        }}
      />
    </div>
  );
}
