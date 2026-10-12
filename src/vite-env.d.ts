/// <reference types="vite/client" />

interface Window {
  adsbygoogle?: Record<string, unknown>[];
  gtag?: (...args: unknown[]) => void;
  dataLayer?: unknown[];
}
