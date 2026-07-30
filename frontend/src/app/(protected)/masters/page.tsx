'use client';

import { useState } from 'react';
import {
  useSkuMasters,
  useCreateSkuMaster,
  useUpdateSkuMaster,
  useDeleteSkuMaster,
} from '@/lib/queries';
import { SkuMasterTable } from '@/components/masters/SkuMasterTable';
import { SkuMasterForm } from '@/components/masters/SkuMasterForm';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import type { SkuMaster } from '@/types/api';

function BoxIcon() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="m7.5 4.27 9 5.15" />
      <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" />
      <path d="m3.3 7 8.7 5 8.7-5M12 22V12" />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

export default function MastersPage() {
  const { data: skus, isLoading } = useSkuMasters();
  const createMutation = useCreateSkuMaster();
  const updateMutation = useUpdateSkuMaster();
  const deleteMutation = useDeleteSkuMaster();

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<SkuMaster | null>(null);

  async function handleSubmit(payload: Partial<SkuMaster>) {
    if (editing) {
      await updateMutation.mutateAsync({ id: editing._id, data: payload });
    } else {
      await createMutation.mutateAsync(payload);
    }
    setFormOpen(false);
    setEditing(null);
  }

  return (
    <div className="mx-auto max-w-5xl px-6 py-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-gray-900">SKU Master</h1>
          <p className="mt-1 text-sm text-gray-500">
            The catalogue used to resolve PO/GRN/Invoice line items across documents.
          </p>
        </div>
        {!formOpen && (
          <Button
            icon={<PlusIcon />}
            onClick={() => {
              setEditing(null);
              setFormOpen(true);
            }}
          >
            New SKU
          </Button>
        )}
      </div>

      {formOpen && (
        <div className="mb-6">
          <SkuMasterForm
            initial={editing}
            submitLabel={editing ? 'Save changes' : 'Create SKU'}
            onSubmit={handleSubmit}
            onCancel={() => {
              setFormOpen(false);
              setEditing(null);
            }}
            error={editing ? updateMutation.error : createMutation.error}
          />
        </div>
      )}

      {isLoading && <Skeleton className="h-64 rounded-xl" />}

      {skus && skus.length === 0 && (
        <EmptyState
          icon={<BoxIcon />}
          title="No SKU Master records yet"
          description="Create one manually, or upload documents whose items will show as unmapped until a SKU exists."
        />
      )}

      {skus && skus.length > 0 && (
        <SkuMasterTable
          skus={skus}
          onEdit={(sku) => {
            setEditing(sku);
            setFormOpen(true);
          }}
          onDelete={(sku) => {
            if (confirm(`Delete SKU Master "${sku.name}"?`)) {
              deleteMutation.mutate(sku._id);
            }
          }}
        />
      )}

      {deleteMutation.isError && (
        <p className="mt-2 text-sm text-red-600">Failed to delete: check that the SKU isn&apos;t referenced elsewhere.</p>
      )}
    </div>
  );
}
