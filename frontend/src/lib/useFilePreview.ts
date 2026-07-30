'use client';

import { useEffect, useState } from 'react';
import { API_URL, getToken } from './apiClient';

interface PreviewState {
  url: string | null;
  mimeType: string | null;
  loading: boolean;
  error: string | null;
}

/**
 * <iframe>/<img> can't send an Authorization header, so we fetch the
 * protected file as a blob and hand back an object URL instead.
 */
export function useFilePreview(documentId: string | undefined) {
  const [state, setState] = useState<PreviewState>({ url: null, mimeType: null, loading: true, error: null });

  useEffect(() => {
    if (!documentId) return;
    let objectUrl: string | null = null;
    let cancelled = false;

    setState({ url: null, mimeType: null, loading: true, error: null });

    fetch(`${API_URL}/documents/${documentId}/file`, {
      headers: { Authorization: `Bearer ${getToken()}` },
    })
      .then(async (res) => {
        if (!res.ok) throw new Error('Preview not available');
        const blob = await res.blob();
        if (cancelled) return;
        objectUrl = URL.createObjectURL(blob);
        setState({ url: objectUrl, mimeType: blob.type, loading: false, error: null });
      })
      .catch((err) => {
        if (!cancelled) setState({ url: null, mimeType: null, loading: false, error: err.message });
      });

    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [documentId]);

  return state;
}
