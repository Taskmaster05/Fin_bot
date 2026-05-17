import { useState, useCallback, useRef } from 'react';

const BASE = import.meta.env.VITE_API_BASE || '/api';
const WS_BASE = import.meta.env.VITE_WS_BASE || `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}/api`;

export function useApi() {
  const [apiStatus, setApiStatus] = useState('connecting'); // connecting | ok | error
  const wsRef = useRef(null);

  const checkHealth = useCallback(async () => {
    try {
      const res = await fetch(`${BASE}/health`, { signal: AbortSignal.timeout(4000) });
      if (res.ok) setApiStatus('ok');
      else setApiStatus('error');
    } catch {
      setApiStatus('error');
    }
  }, []);

  const sendMessage = useCallback(async (sessionId, message) => {
    const res = await fetch(`${BASE}/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ session_id: sessionId ?? null, message }),
    });

    // Check if response is a file download
    const contentType = res.headers.get('content-type') || '';
    if (contentType.includes('application/pdf') || contentType.includes('spreadsheetml')) {
      const rawBlob = await res.blob();
      const disposition = res.headers.get('content-disposition') || '';
      const filename = (() => {
        const filenameStarMatch = disposition.match(/filename\*=([^;]+)/i);
        if (filenameStarMatch) {
          return decodeURIComponent(filenameStarMatch[1].trim().replace(/(^"|"$)/g, ''));
        }
        const filenameMatch = disposition.match(/filename="?([^";]+)"?/i);
        if (filenameMatch) return filenameMatch[1];
        return contentType.includes('pdf') ? 'financial_report.pdf' : 'financial_report.xlsx';
      })();
      const format = contentType.includes('pdf') ? 'pdf' : 'excel';
      const expectedExtension = format === 'pdf' ? '.pdf' : '.xlsx';
      const normalizedFilename = filename.toLowerCase().endsWith(expectedExtension)
        ? filename
        : filename.replace(/\.[^./\\]+$/, '') + expectedExtension;
      const blob = rawBlob.type ? rawBlob : new Blob([rawBlob], { type: contentType });
      return { isFile: true, blob, filename: normalizedFilename, format, size: blob.size };
    }

    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Unknown error' }));
      throw new Error(err.detail || `HTTP ${res.status}`);
    }

    return { isFile: false, ...(await res.json()) };
  }, []);

  const streamMessage = useCallback((sessionId, message, onChunk, onDone, onError) => {
    const ws = new WebSocket(`${WS_BASE}/chat/stream`);
    wsRef.current = ws;

    ws.onopen = () => ws.send(JSON.stringify({ session_id: sessionId, message }));
    ws.onmessage = (e) => onChunk(e.data);
    ws.onclose = () => { wsRef.current = null; onDone(); };
    ws.onerror = () => { onError(new Error('WebSocket error')); };

    return () => { ws.close(); wsRef.current = null; };
  }, []);

  const stopStream = useCallback(() => {
    if (wsRef.current) { wsRef.current.close(); wsRef.current = null; }
  }, []);

  const clearSession = useCallback(async (sessionId) => {
    await fetch(`${BASE}/session/${sessionId}`, { method: 'DELETE' });
  }, []);

  return { apiStatus, checkHealth, sendMessage, streamMessage, stopStream, clearSession };
}
