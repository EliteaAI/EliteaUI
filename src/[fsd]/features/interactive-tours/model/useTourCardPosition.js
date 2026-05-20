import { useEffect, useMemo, useState } from 'react';

export const CARD_WIDTH_PX = 440;

const CARD_GAP_PX = 18;
const CARD_ESTIMATED_HEIGHT_PX = 400;
const VIEWPORT_MARGIN_PX = 16;

const getViewportSize = () => {
  if (typeof window === 'undefined') {
    return { vw: 0, vh: 0 };
  }

  return { vw: window.innerWidth, vh: window.innerHeight };
};

/**
 * Tracks the bounding rect of a tour step's target element and derives the
 * card's fixed position, keeping both in sync with scroll, viewport resize, and
 * target element resize.
 *
 * @param {object|null} currentStep
 * @returns {{ targetInfo: { rect: DOMRect, borderRadius: string }|null, cardPositionSx: object }}
 */
export const useTourCardPosition = currentStep => {
  const [targetInfo, setTargetInfo] = useState(null);

  // Viewport dimensions as state so cardPositionSx re-runs on resize even when
  // the target element's own rect hasn't changed (e.g. a fixed-position sidebar).
  const [viewport, setViewport] = useState(getViewportSize);

  useEffect(() => {
    if (!currentStep?.target || currentStep.placement === 'center') {
      setTargetInfo(null);
      return;
    }

    const el = document.querySelector(currentStep.target);

    if (!el) {
      setTargetInfo(null);
      return;
    }

    const measure = () => {
      const rect = el.getBoundingClientRect();
      // getComputedStyle returns '0px' (truthy) when no radius is set, so check
      // for zero explicitly and fall back to the design-spec default (12px).
      const computed = getComputedStyle(el).borderRadius;
      const borderRadius = !computed || computed === '0px' ? '0.75rem' : computed;
      setTargetInfo({ rect, borderRadius });
    };

    // Initial measurement
    measure();

    // Throttle re-measurement to one rAF tick to avoid layout thrash on every
    // scroll/resize event.
    let rafId = null;
    const scheduleMeasure = () => {
      if (rafId !== null) return;
      rafId = requestAnimationFrame(() => {
        rafId = null;
        measure();
      });
    };

    // Viewport dimensions only change on window resize — update them separately
    // so scroll events don't create unnecessary re-renders.
    const scheduleViewportUpdate = () => {
      setViewport(prev => {
        const { vw, vh } = getViewportSize();
        return prev.vw === vw && prev.vh === vh ? prev : { vw, vh };
      });
    };

    // Capture phase catches scroll on any scrollable ancestor.
    window.addEventListener('scroll', scheduleMeasure, { capture: true, passive: true });
    window.addEventListener('resize', scheduleMeasure, { passive: true });
    window.addEventListener('resize', scheduleViewportUpdate, { passive: true });

    const ro = new ResizeObserver(scheduleMeasure);
    ro.observe(el);

    return () => {
      window.removeEventListener('scroll', scheduleMeasure, { capture: true });
      window.removeEventListener('resize', scheduleMeasure);
      window.removeEventListener('resize', scheduleViewportUpdate);
      ro.disconnect();
      if (rafId !== null) cancelAnimationFrame(rafId);
    };
  }, [currentStep?.target, currentStep?.placement]);

  const cardPositionSx = useMemo(() => {
    if (!targetInfo || currentStep?.placement === 'center') {
      return { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' };
    }

    const { rect } = targetInfo;
    const { vw, vh } = viewport;

    const clampLeft = x => Math.max(VIEWPORT_MARGIN_PX, Math.min(x, vw - CARD_WIDTH_PX - VIEWPORT_MARGIN_PX));

    const verticalTop = Math.max(
      VIEWPORT_MARGIN_PX,
      Math.min(rect.top, vh - CARD_ESTIMATED_HEIGHT_PX - VIEWPORT_MARGIN_PX),
    );

    switch (currentStep.placement) {
      case 'left':
        return { top: verticalTop, left: clampLeft(rect.left - CARD_WIDTH_PX - CARD_GAP_PX) };
      case 'right':
        return { top: verticalTop, left: clampLeft(rect.right + CARD_GAP_PX) };
      case 'top':
        return {
          bottom: vh - rect.top + CARD_GAP_PX,
          left: clampLeft(rect.left + rect.width / 2 - CARD_WIDTH_PX / 2),
        };
      case 'bottom':
        return {
          top: Math.min(rect.bottom + CARD_GAP_PX, vh - CARD_ESTIMATED_HEIGHT_PX - VIEWPORT_MARGIN_PX),
          left: clampLeft(rect.left + rect.width / 2 - CARD_WIDTH_PX / 2),
        };
      default:
        return { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' };
    }
  }, [targetInfo, viewport, currentStep?.placement]);

  return { targetInfo, cardPositionSx };
};
