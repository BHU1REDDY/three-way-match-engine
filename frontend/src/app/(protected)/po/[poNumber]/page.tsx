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

  if (matchLoading) {
    return <div className="p-6 text-sm text-gray-400">Loading match…</div>;
  }

  const activeInvoice = invoices.find((i) => i._id === activeInvoiceId) ?? invoices[0];
  const activeGrn = grns.find((g) => g._id === activeGrnId) ?? grns[0];

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-gray-100 bg-white px-4 py-3">
        <div>
          <h1 className="font-mono text-base font-semibold text-gray-900">{poNumber}</h1>
          {primaryPo && <p className="text-xs text-gray-500">{primaryPo.vendorName}</p>}
        </div>
        <button
          onClick={() => setUploadModalOpen(true)}
          className="rounded-md bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700"
        >
          + Upload Document
        </button>
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

      <div className="flex-1 overflow-auto p-4">
        {match && match.status === 'insufficient_documents' && (
          <div className="mb-4 rounded-lg border border-gray-200 bg-gray-50 p-4 text-sm text-gray-600">
            Waiting on more documents before a full three-way match can be computed. Currently have:{' '}
            {match.linkedDocs.po.length} PO, {match.linkedDocs.grns.length} GRN,{' '}
            {match.linkedDocs.invoices.length} Invoice.
          </div>
        )}

        {activeTab === 'po' && primaryPo && match && (
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <div className="flex flex-col gap-4">
              <MismatchBanner status={match.status} reasons={match.reasons} />
              <FormPanel
                title="Purchase Order Details"
                accentColor="border-l-blue-500"
                fields={[
                  { label: 'PO Number', value: primaryPo.poNumber },
                  { label: 'PO Date', value: new Date(primaryPo.poDate).toLocaleDateString() },
                  { label: 'Vendor', value: primaryPo.vendorName },
                  { label: 'Line Items', value: primaryPo.items.length },
                ]}
              />
            </div>
            <FilePreview documentId={primaryPo._id} />
            <div className="lg:col-span-2">
              <ItemGrid items={match.items} />
            </div>
          </div>
        )}

        {activeTab === 'po' && !primaryPo && (
          <p className="text-sm text-gray-400">No PO uploaded yet for this poNumber.</p>
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
            <div className="lg:col-span-2">
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
          <p className="text-sm text-gray-400">No invoices uploaded yet for this poNumber.</p>
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
            <div className="lg:col-span-2">
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
          <p className="text-sm text-gray-400">No GRNs uploaded yet for this poNumber.</p>
        )}

        {activeTab === 'summary' && (
          <div className="flex flex-col gap-4">
            {summaryLoading && <p className="text-sm text-gray-400">Loading summary…</p>}
            {summary && (
              <>
                <StatCards {...summary.statCards} />
                <AssociatedTable rows={summary.rows} />
              </>
            )}
          </div>
        )}
      </div>

      <UploadModal
        open={uploadModalOpen}
        onClose={() => setUploadModalOpen(false)}
        onUploaded={() => setUploadModalOpen(false)}
        defaultPoNumber={poNumber}
      />
    </div>
  );
}
