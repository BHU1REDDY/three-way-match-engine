import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from './apiClient';
import type {
  DocumentType,
  MatchResult,
  SummaryResult,
  SkuMaster,
  PurchaseOrderDoc,
  GrnDoc,
  InvoiceDoc,
} from '@/types/api';

type AnyDoc = (PurchaseOrderDoc | GrnDoc | InvoiceDoc) & { documentType: DocumentType };

export function useDocuments(poNumber?: string, type?: DocumentType) {
  const params = new URLSearchParams();
  if (poNumber) params.set('poNumber', poNumber);
  if (type) params.set('type', type);
  const qs = params.toString();

  return useQuery({
    queryKey: ['documents', poNumber, type],
    queryFn: () => api.get<AnyDoc[]>(`/documents${qs ? `?${qs}` : ''}`),
  });
}

export function useMatch(poNumber: string | undefined) {
  return useQuery({
    queryKey: ['match', poNumber],
    queryFn: () => api.get<MatchResult>(`/match/${poNumber}`),
    enabled: !!poNumber,
  });
}

export function useSummary(poNumber: string | undefined) {
  return useQuery({
    queryKey: ['summary', poNumber],
    queryFn: () => api.get<SummaryResult>(`/summary/${poNumber}`),
    enabled: !!poNumber,
  });
}

export function useUploadDocument() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ file, documentType }: { file: File; documentType: DocumentType }) => {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('documentType', documentType);
      return api.upload<{ documentType: DocumentType; document: AnyDoc; warnings: string[] }>(
        '/documents/upload',
        formData
      );
    },
    onSuccess: (result) => {
      const poNumber = result.document.poNumber;
      queryClient.invalidateQueries({ queryKey: ['documents', poNumber] });
      queryClient.invalidateQueries({ queryKey: ['documents', undefined] });
      queryClient.invalidateQueries({ queryKey: ['match', poNumber] });
      queryClient.invalidateQueries({ queryKey: ['summary', poNumber] });
    },
  });
}

export function useSkuMasters() {
  return useQuery({
    queryKey: ['skuMasters'],
    queryFn: () => api.get<SkuMaster[]>('/masters/sku'),
  });
}

export function useCreateSkuMaster() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<SkuMaster>) => api.post<SkuMaster>('/masters/sku', data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['skuMasters'] }),
  });
}

export function useUpdateSkuMaster() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<SkuMaster> }) =>
      api.patch<SkuMaster>(`/masters/sku/${id}`, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['skuMasters'] }),
  });
}

export function useDeleteSkuMaster() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/masters/sku/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['skuMasters'] }),
  });
}
