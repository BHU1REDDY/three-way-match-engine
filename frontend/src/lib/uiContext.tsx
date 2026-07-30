'use client';

import { createContext, useContext, useState, ReactNode } from 'react';

export type TopTab = 'po' | 'fulfillment' | 'delivery' | 'summary';

interface UiContextValue {
  activeTab: TopTab;
  setActiveTab: (tab: TopTab) => void;
  activeInvoiceId: string | null;
  setActiveInvoiceId: (id: string | null) => void;
  activeGrnId: string | null;
  setActiveGrnId: (id: string | null) => void;
  zoom: number;
  setZoom: (z: number) => void;
  uploadModalOpen: boolean;
  setUploadModalOpen: (open: boolean) => void;
}

const UiContext = createContext<UiContextValue | undefined>(undefined);

export function UiProvider({ children }: { children: ReactNode }) {
  const [activeTab, setActiveTab] = useState<TopTab>('po');
  const [activeInvoiceId, setActiveInvoiceId] = useState<string | null>(null);
  const [activeGrnId, setActiveGrnId] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);

  return (
    <UiContext.Provider
      value={{
        activeTab,
        setActiveTab,
        activeInvoiceId,
        setActiveInvoiceId,
        activeGrnId,
        setActiveGrnId,
        zoom,
        setZoom,
        uploadModalOpen,
        setUploadModalOpen,
      }}
    >
      {children}
    </UiContext.Provider>
  );
}

export function useUi() {
  const ctx = useContext(UiContext);
  if (!ctx) throw new Error('useUi must be used within UiProvider');
  return ctx;
}
