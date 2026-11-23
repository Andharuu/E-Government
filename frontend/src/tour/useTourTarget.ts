import { useState, useEffect, useRef } from 'react';

export interface TargetRect {
  top: number;
  left: number;
  width: number;
  height: number;
  right: number;
  bottom: number;
}

export function useTourTarget(targetSelector?: string, padding = 8) {
  const [rect, setRect] = useState<TargetRect | null>(null);
  const [element, setElement] = useState<HTMLElement | null>(null);
  const [isReady, setIsReady] = useState(false);
  const elementRef = useRef<HTMLElement | null>(null);
  const observerRef = useRef<ResizeObserver | null>(null);

  useEffect(() => {
    if (!targetSelector) {
      elementRef.current = null;
      setRect(null);
      setElement(null);
      setIsReady(true);
      return;
    }

    let isCancelled = false;
    let attempts = 0;
    const maxAttempts = 25; // 25 x 100ms = 2.5s timeout

    const measure = (el: HTMLElement) => {
      if (isCancelled) return;
      const r = el.getBoundingClientRect();
      if (r.width === 0 && r.height === 0) {
        return false;
      }

      setRect({
        top: Math.max(0, r.top - padding),
        left: Math.max(0, r.left - padding),
        width: r.width + padding * 2,
        height: r.height + padding * 2,
        right: r.right + padding,
        bottom: r.bottom + padding,
      });
      return true;
    };

    const findAndMeasure = () => {
      if (isCancelled) return;
      const el = document.querySelector<HTMLElement>(targetSelector);
      if (el) {
        elementRef.current = el;
        setElement(el);
        
        // Scroll into view jika berada di luar viewport
        const r = el.getBoundingClientRect();
        const isInViewport =
          r.top >= 60 &&
          r.left >= 0 &&
          r.bottom <= (window.innerHeight - 60) &&
          r.right <= window.innerWidth;

        if (!isInViewport) {
          try {
            el.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' });
          } catch {}
        }

        // Delay sedikit agar smooth scroll selesai sebelum pengukuran posisi
        setTimeout(() => {
          if (isCancelled) return;
          measure(el);
          setIsReady(true);
        }, 180);

        // Pasang ResizeObserver pada elemen target
        if (observerRef.current) observerRef.current.disconnect();
        observerRef.current = new ResizeObserver(() => {
          measure(el);
        });
        observerRef.current.observe(el);
        return;
      }

      attempts++;
      if (attempts < maxAttempts && !isCancelled) {
        setTimeout(findAndMeasure, 100);
      } else if (!isCancelled) {
        // Fallback jika elemen tidak ditemukan dalam batas waktu
        elementRef.current = null;
        setRect(null);
        setElement(null);
        setIsReady(true);
      }
    };

    setIsReady(false);
    findAndMeasure();

    const handleScrollOrResize = () => {
      if (elementRef.current) {
        measure(elementRef.current);
      }
    };

    window.addEventListener('resize', handleScrollOrResize, { passive: true });
    window.addEventListener('scroll', handleScrollOrResize, { capture: true, passive: true });

    return () => {
      isCancelled = true;
      elementRef.current = null;
      window.removeEventListener('resize', handleScrollOrResize);
      window.removeEventListener('scroll', handleScrollOrResize, { capture: true } as any);
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [targetSelector, padding]);

  return { rect, element, isReady };
}
