import { useEffect } from 'react';

/**
 * In development mode, connects to the stackwright-prebuild --watch SSE server
 * and triggers a full page reload when content changes are detected.
 *
 * In production, this hook is a no-op. The connection fails silently if the
 * watcher isn't running (e.g., when using `next dev` without --watch).
 *
 * The SSE server runs on port 35729 by default (configurable via
 * STACKWRIGHT_RELOAD_PORT env var on the watcher side).
 */
export function useDevContentReload(port = 35729): void {
  useEffect(() => {
    if (process.env.NODE_ENV !== 'development') return;
    if (typeof EventSource === 'undefined') return;

    let es: EventSource | null = null;
    try {
      es = new EventSource(`http://localhost:${port}/__stackwright_sse`);
      es.addEventListener('content-change', () => {
        window.location.reload();
      });
      // Silence connection errors — watcher may not be running
      es.onerror = () => {};
    } catch {
      // EventSource constructor failed — ignore
    }

    return () => {
      if (es) es.close();
    };
  }, [port]);
}
