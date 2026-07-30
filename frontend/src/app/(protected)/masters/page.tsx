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
import type { SkuMaster } from '@/types/api';

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

      {isLoading && <p className="text-sm text-gray-400">Loading…</p>}

      {skus && (
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
