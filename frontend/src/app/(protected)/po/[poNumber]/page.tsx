'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useMatch, useSummary } from '@/lib/queries';
import { useUi } from '@/lib/uiContext';
import { TopTabs } from '@/components/shell/TopTabs';
import { SubTabPills } from '@/components/shell/SubTabPills';
import { FormPanel } from '@/components/document/FormPanel';
import { FilePreview } from '@/components/document/FilePreview';
import { ItemGrid } from '@/components/document/ItemGrid';
import { MismatchBanner } from '@/components/document/MismatchBanner';
import { DocumentItemsTable } from '@/components/document/DocumentItemsTable';
import { StatCards } from '@/components/summary/StatCards';
import { AssociatedTable } from '@/components/summary/AssociatedTable';
import { UploadModal } from '@/components/upload/UploadModal';
import { Button } from '@/components/ui/Button';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { EmptyState } from '@/components/ui/EmptyState';
import { Skeleton } from '@/components/ui/Skeleton';

function PlusIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

function FileIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <path d="M14 2v6h6" />
    </svg>
  );
}

function InfoIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 16v-5M12 8h.01" />
    </svg>
  );
}

function WorkspaceSkeleton() {
  return (
    <div className="p-5">
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="flex flex-col gap-4">
          <Skeleton className="h-16 w-full rounded-xl" />
          <Skeleton className="h-40 w-full rounded-xl" />
        </div>
        <Skeleton className="h-[420px] w-full rounded-xl" />
      </div>
    </div>
  );
}

export default function PoWorkspacePage() {
  const params = useParams<{ poNumber: string }>();
  const poNumber = decodeURIComponent(params.poNumber);

  const { activeTab, setActiveTab, activeInvoiceId, setActiveInvoiceId, activeGrnId, setActiveGrnId, uploadModalOpen, setUploadModalOpen } =
    useUi();

  const { data: match, isLoading: matchLoading } = useMatch(poNumber);
  const { data: summary, isLoading: summaryLoading } = useSummary(poNumber);

  const invoices = match?.linkedDocs.invoices ?? [];
  const grns = match?.linkedDocs.grns ?? [];
  const primaryPo = match?.linkedDocs.po?.[0];

  useEffect(() => {
    if (invoices.length > 0 && !invoices.some((i) => i._id === activeInvoiceId)) {
      setActiveInvoiceId(invoices[0]._id);
    }
  }, [invoices, activeInvoiceId, setActiveInvoiceId]);

  useEffect(() => {
    if (grns.length > 0 && !grns.some((g) => g._id === activeGrnId)) {
      setActiveGrnId(grns[0]._id);
    }
  }, [grns, activeGrnId, setActiveGrnId]);

  const activeInvoice = invoices.find((i) => i._id === activeInvoiceId) ?? invoices[0];
  const activeGrn = grns.find((g) => g._id === activeGrnId) ?? grns[0];

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-gray-100 bg-white px-5 py-3.5">
        <div className="flex items-center gap-3">
          <div>
            <h1 className="font-mono text-base font-semibold tracking-tight text-gray-900">{poNumber}</h1>
            {primaryPo && <p className="text-xs text-gray-500">{primaryPo.vendorName}</p>}
          </div>
          {match && <StatusBadge status={match.status} />}
        </div>
        <Button size="sm" icon={<PlusIcon />} onClick={() => setUploadModalOpen(true)}>
          Upload Document
        </Button>
      </div>

      <TopTabs
        active={activeTab}
        onChange={setActiveTab}
        poCount={match?.linkedDocs.po.length ?? 0}
        fulfillmentCount={invoices.length}
        deliveryCount={grns.length}
      />

      {activeTab === 'fulfillment' && (
        <SubTabPills
          items={invoices.map((i) => ({ id: i._id, label: `Invoice: ${i.invoiceNumber}` }))}
          activeId={activeInvoiceId}
          onChange={setActiveInvoiceId}
        />
      )}
      {activeTab === 'delivery' && (
        <SubTabPills
          items={grns.map((g) => ({ id: g._id, label: `GRN: ${g.grnNumber}` }))}
          activeId={activeGrnId}
          onChange={setActiveGrnId}
        />
      )}

      {matchLoading && <WorkspaceSkeleton />}

      {!matchLoading && (
        <div className="themed-scroll flex-1 overflow-auto p-5">
          {match && match.status === 'insufficient_documents' && (
            <div className="mb-5 flex items-start gap-3 rounded-xl border border-gray-200 bg-gray-50 p-4 text-sm text-gray-600">
              <InfoIcon />
              <p>
                Waiting on more documents before a full three-way match can be computed. Currently have{' '}
                <span className="font-medium text-gray-800">{match.linkedDocs.po.length} PO</span>,{' '}
                <span className="font-medium text-gray-800">{match.linkedDocs.grns.length} GRN</span>,{' '}
                <span className="font-medium text-gray-800">{match.linkedDocs.invoices.length} Invoice</span>.
              </p>
            </div>
          )}

          {activeTab === 'po' && primaryPo && match && (
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <div className="flex flex-col gap-4">
                <MismatchBanner status={match.status} reasons={match.reasons} />
                <FormPanel
                  title="Purchase Order Details"
                  accentColor="border-l-indigo-500"
                  fields={[
                    { label: 'PO Number', value: primaryPo.poNumber },
                    { label: 'PO Date', value: new Date(primaryPo.poDate).toLocaleDateString() },
                    { label: 'Vendor', value: primaryPo.vendorName },
                    { label: 'Line Items', value: primaryPo.items.length },
                  ]}
                />
              </div>
              <FilePreview documentId={primaryPo._id} />
              <div className="mt-2 border-t border-gray-200 pt-5 lg:col-span-2">
                <h2 className="mb-3 text-sm font-semibold text-gray-700">
                  Line Items <span className="font-normal text-gray-400">({match.items.length})</span>
                </h2>
                <ItemGrid items={match.items} />
              </div>
            </div>
          )}

          {activeTab === 'po' && !primaryPo && (
            <EmptyState
              icon={<FileIcon />}
              title="No PO uploaded yet"
              description="Upload a Purchase Order for this poNumber to see its details here."
            />
          )}

          {activeTab === 'fulfillment' && activeInvoice && (
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <div className="flex flex-col gap-4">
                {match && <MismatchBanner status={match.status} reasons={match.reasons} />}
                <FormPanel
                  title="Invoice Details"
                  accentColor="border-l-purple-500"
                  fields={[
                    { label: 'Invoice Number', value: activeInvoice.invoiceNumber },
                    { label: 'Invoice Date', value: new Date(activeInvoice.invoiceDate).toLocaleDateString() },
                    { label: 'PO Number', value: activeInvoice.poNumber },
                    { label: 'Line Items', value: activeInvoice.items.length },
                  ]}
                />
              </div>
              <FilePreview documentId={activeInvoice._id} />
              <div className="mt-2 border-t border-gray-200 pt-5 lg:col-span-2">
                <h2 className="mb-3 text-sm font-semibold text-gray-700">
                  Line Items <span className="font-normal text-gray-400">({activeInvoice.items.length})</span>
                </h2>
                <DocumentItemsTable
                  qtyLabel="Qty"
                  rows={activeInvoice.items.map((it) => ({
                    itemCode: it.itemCode,
                    description: it.description,
                    qty: it.quantity,
                    rate: it.unitRate,
                    mrp: it.mrp,
                    unmappedReason: it.unmappedReason,
                  }))}
                />
              </div>
            </div>
          )}

          {activeTab === 'fulfillment' && !activeInvoice && (
            <EmptyState
              icon={<FileIcon />}
              title="No invoices yet"
              description="Upload an Invoice for this poNumber to see it here."
            />
          )}

          {activeTab === 'delivery' && activeGrn && (
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <div className="flex flex-col gap-4">
                {match && <MismatchBanner status={match.status} reasons={match.reasons} />}
                <FormPanel
                  title="GRN Details"
                  accentColor="border-l-emerald-500"
                  fields={[
                    { label: 'GRN Number', value: activeGrn.grnNumber },
                    { label: 'GRN Date', value: new Date(activeGrn.grnDate).toLocaleDateString() },
                    { label: 'PO Number', value: activeGrn.poNumber },
                    { label: 'Line Items', value: activeGrn.items.length },
                  ]}
                />
              </div>
              <FilePreview documentId={activeGrn._id} />
              <div className="mt-2 border-t border-gray-200 pt-5 lg:col-span-2">
                <h2 className="mb-3 text-sm font-semibold text-gray-700">
                  Line Items <span className="font-normal text-gray-400">({activeGrn.items.length})</span>
                </h2>
                <DocumentItemsTable
                  qtyLabel="Received Qty"
                  rows={activeGrn.items.map((it) => ({
                    itemCode: it.itemCode,
                    description: it.description,
                    qty: it.receivedQuantity,
                    mrp: it.mrp,
                    unmappedReason: it.unmappedReason,
                  }))}
                />
              </div>
            </div>
          )}

          {activeTab === 'delivery' && !activeGrn && (
            <EmptyState
              icon={<FileIcon />}
              title="No GRNs yet"
              description="Upload a GRN for this poNumber to see it here."
            />
          )}

          {activeTab === 'summary' && (
            <div className="flex flex-col gap-4">
              {summaryLoading && (
                <>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                    <Skeleton className="h-20 rounded-xl" />
                    <Skeleton className="h-20 rounded-xl" />
                    <Skeleton className="h-20 rounded-xl" />
                  </div>
                  <Skeleton className="h-56 rounded-xl" />
                </>
              )}
              {summary && (
                <>
                  <StatCards {...summary.statCards} />
                  <AssociatedTable rows={summary.rows} />
                </>
              )}
            </div>
          )}
        </div>
      )}

      <UploadModal
        open={uploadModalOpen}
        onClose={() => setUploadModalOpen(false)}
        onUploaded={() => setUploadModalOpen(false)}
        defaultPoNumber={poNumber}
      />
    </div>
  );
}
