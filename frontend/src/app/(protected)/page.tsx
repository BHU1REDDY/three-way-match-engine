'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useDocuments } from '@/lib/queries';
import { UploadModal } from '@/components/upload/UploadModal';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import type { PurchaseOrderDoc } from '@/types/api';

function PlusIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round">
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

function InboxIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="m22 12-6.5 0-1.5 3h-4l-1.5-3H2" />
      <path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11Z" />
    </svg>
  );
}

export default function HomePage() {
  const router = useRouter();
  const { data: poDocs, isLoading } = useDocuments(undefined, 'po');
  const [uploadOpen, setUploadOpen] = useState(false);

  const pos = (poDocs as PurchaseOrderDoc[] | undefined) ?? [];
  const uniqueByPoNumber = Array.from(new Map(pos.map((p) => [p.poNumber, p])).values());

  return (
    <div className="mx-auto max-w-4xl px-6 py-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-gray-900">Purchase Orders</h1>
          <p className="mt-1 text-sm text-gray-500">Upload a PO, GRN, or Invoice to begin matching.</p>
        </div>
        <Button icon={<PlusIcon />} onClick={() => setUploadOpen(true)}>
          Upload Document
        </Button>
      </div>

      {isLoading && (
        <div className="grid gap-3">
          <Skeleton className="h-[68px] rounded-xl" />
          <Skeleton className="h-[68px] rounded-xl" />
          <Skeleton className="h-[68px] rounded-xl" />
        </div>
      )}

      {!isLoading && uniqueByPoNumber.length === 0 && (
        <EmptyState
          icon={<InboxIcon />}
          title="No documents yet"
          description="Upload a PO, GRN, or Invoice to get started - upload order doesn't matter."
          action={
            <Button icon={<PlusIcon />} onClick={() => setUploadOpen(true)}>
              Upload Document
            </Button>
          }
        />
      )}

      <div className="grid gap-3">
        {uniqueByPoNumber.map((po) => (
          <button
            key={po.poNumber}
            onClick={() => router.push(`/po/${encodeURIComponent(po.poNumber)}`)}
            className="group flex items-center justify-between rounded-xl border border-gray-200 bg-white p-4 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:border-indigo-300 hover:shadow-md"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-50 text-sm font-semibold text-indigo-600">
                {po.vendorName?.[0]?.toUpperCase() || 'P'}
              </div>
              <div>
                <p className="font-mono text-sm font-medium text-gray-900">{po.poNumber}</p>
                <p className="text-xs text-gray-500">{po.vendorName}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs text-gray-400">{new Date(po.poDate).toLocaleDateString()}</span>
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className="text-gray-300 transition-transform group-hover:translate-x-0.5 group-hover:text-indigo-500"
              >
                <path d="m9 18 6-6-6-6" />
              </svg>
            </div>
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
