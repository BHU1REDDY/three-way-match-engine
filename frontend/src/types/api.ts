export type DocumentType = 'po' | 'grn' | 'invoice';

export interface SkuMasterRef {
  _id: string;
  skuErpCode: string;
  name: string;
  eanCode: string | null;
  hsnCode: string | null;
  uom: string | null;
  agreedRate: number | null;
  mrp: number | null;
  priceTolerance?: number;
}

export interface FileMeta {
  filePath: string;
  originalName: string;
  mimeType: string;
}

export interface BaseItem {
  itemCode: string;
  description: string;
  skuMaster: string | null;
  unmappedReason: string | null;
}

export interface PoItem extends BaseItem {
  quantity: number;
}

export interface GrnItem extends BaseItem {
  receivedQuantity: number;
  mrp: number | null;
}

export interface InvoiceItem extends BaseItem {
  quantity: number;
  unitRate: number | null;
  mrp: number | null;
}

export interface PurchaseOrderDoc {
  _id: string;
  documentType?: 'po';
  poNumber: string;
  poDate: string;
  vendorName: string;
  items: PoItem[];
  file: FileMeta;
  createdAt: string;
}

export interface GrnDoc {
  _id: string;
  documentType?: 'grn';
  grnNumber: string;
  poNumber: string;
  grnDate: string;
  items: GrnItem[];
  file: FileMeta;
  createdAt: string;
}

export interface InvoiceDoc {
  _id: string;
  documentType?: 'invoice';
  invoiceNumber: string;
  poNumber: string;
  invoiceDate: string;
  items: InvoiceItem[];
  file: FileMeta;
  createdAt: string;
}

export type MatchStatus = 'insufficient_documents' | 'mismatch' | 'partially_matched' | 'matched';

export interface MatchItem {
  key: string;
  itemCode: string;
  description: string;
  skuMaster: SkuMasterRef | null;
  poQty: number | null;
  grnQty: number;
  invoiceQty: number;
  unitRate: number | null;
  mrp: number | null;
  grossAmount: number | null;
  reasons: string[];
}

export interface MatchResult {
  poNumber: string;
  status: MatchStatus;
  reasons: string[];
  items: MatchItem[];
  linkedDocs: {
    po: PurchaseOrderDoc[];
    grns: GrnDoc[];
    invoices: InvoiceDoc[];
  };
}

export interface SummaryRow {
  documentType: 'grn' | 'invoice' | 'current_status';
  documentNumber: string | null;
  date: string | null;
  qty: number | null;
  status?: MatchStatus;
  cumulativeReceivedQty: number;
  cumulativeInvoicedQty: number;
  pendingDeliveryQty: number;
}

export interface SummaryResult {
  poNumber: string;
  statCards: {
    poAmount: number;
    totalInvoiced: number;
    totalReceived: number;
  };
  rows: SummaryRow[];
  status: MatchStatus;
}

export interface SkuMaster {
  _id: string;
  skuErpCode: string;
  name: string;
  eanCode: string | null;
  hsnCode: string | null;
  uom: string | null;
  agreedRate: number | null;
  mrp: number | null;
  priceTolerance: number;
  createdAt: string;
}
