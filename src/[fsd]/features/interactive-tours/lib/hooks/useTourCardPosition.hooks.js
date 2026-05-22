import { useCallback, useEffect, useMemo, useState } from 'react';

import { CARD_WIDTH_PX } from '@/[fsd]/features/interactive-tours/lib/constants';

const CARD_GAP_PX = 18;
const CARD_ESTIMATED_HEIGHT_PX = 400;
const VIEWPORT_MARGIN_PX = 16;
// Fixed vertical space consumed by padding, title, gaps, and footer — everything
// except the scrollable body. Used to compute the maximum body height when the
// card is placed below a target near the bottom of the viewport.
const CARD_CHROME_HEIGHT_PX = 136;

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
 * @returns {{ targetInfo: { rect: DOMRect, borderRadius: string }|null, cardPositionSx: object, cardBodySx: object|null }}
 */
export const useTourCardPosition = currentStep => {
  const [targetInfo, setTargetInfo] = useState(null);

  // Viewport dimensions as state so cardPositionSx re-runs on resize even when
  // the target element's own rect hasn't changed (e.g. a fixed-position sidebar).
  const [viewport, setViewport] = useState(getViewportSize);

  const measureElement = useCallback(el => {
    const rect = el.getBoundingClientRect();
    // getComputedStyle returns '0px' (truthy) when no radius is set, so check
    // for zero explicitly and fall back to the design-spec default (12px).
    const computed = getComputedStyle(el).borderRadius;
    const borderRadius = !computed || computed === '0px' ? '0.75rem' : computed;

    setTargetInfo({ rect, borderRadius });
  }, []);

  // Viewport dimensions only change on window resize — update them separately
  // so scroll events don't create unnecessary re-renders.
  const updateViewport = useCallback(() => {
    setViewport(prev => {
      const { vw, vh } = getViewportSize();

      return prev.vw === vw && prev.vh === vh ? prev : { vw, vh };
    });
  }, []);

  useEffect(() => {
    if (!currentStep?.target) {
      setTargetInfo(null);
      return;
    }

    const el = document.querySelector(currentStep.target);

    if (!el) {
      setTargetInfo(null);
      return;
    }

    measureElement(el);

    // Throttle re-measurement to one rAF tick to avoid layout thrash on every
    // scroll/resize event. Captures el and rafId from this effect's closure.
    let rafId = null;
    const scheduleMeasure = () => {
      if (rafId !== null) return;
      rafId = requestAnimationFrame(() => {
        rafId = null;
        measureElement(el);
      });
    };

    const onResize = () => {
      scheduleMeasure();
      updateViewport();
    };

    // Capture phase catches scroll on any scrollable ancestor.
    window.addEventListener('scroll', scheduleMeasure, { capture: true, passive: true });
    window.addEventListener('resize', onResize, { passive: true });

    const ro = new ResizeObserver(scheduleMeasure);

    ro.observe(el);

    return () => {
      window.removeEventListener('scroll', scheduleMeasure, { capture: true });
      window.removeEventListener('resize', onResize);
      ro.disconnect();
      if (rafId !== null) cancelAnimationFrame(rafId);
    };
  }, [currentStep?.target, currentStep?.placement, measureElement, updateViewport]);

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

    const centeredTop = Math.max(
      VIEWPORT_MARGIN_PX,
      Math.min(
        rect.top + rect.height / 2 - CARD_ESTIMATED_HEIGHT_PX / 2,
        vh - CARD_ESTIMATED_HEIGHT_PX - VIEWPORT_MARGIN_PX,
      ),
    );

    switch (currentStep.placement) {
      case 'center':
        return {
          top: centeredTop,
          left: clampLeft(rect.left + rect.width / 2 - CARD_WIDTH_PX / 2),
        };
      case 'left':
        return { top: verticalTop, left: clampLeft(rect.left - CARD_WIDTH_PX - CARD_GAP_PX) };
      case 'right': {
        const cardLeft = clampLeft(rect.right + CARD_GAP_PX);
        // If the card fits below the target's top edge, top-align to the target
        if (rect.top + CARD_ESTIMATED_HEIGHT_PX + VIEWPORT_MARGIN_PX <= vh) {
          return { top: Math.max(VIEWPORT_MARGIN_PX, rect.top), left: cardLeft };
        }
        // Target is near the bottom — bottom-align the card to the target's bottom edge
        return { bottom: Math.max(VIEWPORT_MARGIN_PX, vh - rect.bottom), left: cardLeft };
      }
      case 'top': {
        const fitsAbove = rect.top - CARD_GAP_PX - CARD_ESTIMATED_HEIGHT_PX - VIEWPORT_MARGIN_PX >= 0;
        if (fitsAbove) {
          return {
            bottom: vh - rect.top + CARD_GAP_PX,
            left: clampLeft(rect.left + rect.width / 2 - CARD_WIDTH_PX / 2),
          };
        }
        // Not enough room above — flip to below
        return {
          top: rect.bottom + CARD_GAP_PX,
          left: clampLeft(rect.left + rect.width / 2 - CARD_WIDTH_PX / 2),
        };
      }
      case 'bottom': {
        const availableBelow = vh - rect.bottom - CARD_GAP_PX - VIEWPORT_MARGIN_PX;
        const fitsBelow = availableBelow >= CARD_ESTIMATED_HEIGHT_PX;

        if (fitsBelow) {
          const bodyMaxHeightPx = Math.max(80, availableBelow - CARD_CHROME_HEIGHT_PX);

          return {
            positionSx: {
              top: rect.bottom + CARD_GAP_PX,
              left: clampLeft(rect.left + rect.width / 2 - CARD_WIDTH_PX / 2),
            },
            bodySx: { maxHeight: `${bodyMaxHeightPx}px` },
          };
        }

        const availableAbove = rect.top - CARD_GAP_PX - VIEWPORT_MARGIN_PX;
        const bodyMaxHeightPx = Math.max(80, availableAbove - CARD_CHROME_HEIGHT_PX);

        return {
          positionSx: {
            bottom: vh - rect.top + CARD_GAP_PX,
            left: clampLeft(rect.left + rect.width / 2 - CARD_WIDTH_PX / 2),
          },
          bodySx: { maxHeight: `${bodyMaxHeightPx}px` },
        };
      }
      default:
        return { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' };
    }
  }, [targetInfo, viewport, currentStep?.placement]);

  // bottom returns a split { positionSx, bodySx } shape; all others return a flat sx object.
  const isBottomSplit = cardPositionSx !== null && 'positionSx' in cardPositionSx;

  return {
    targetInfo,
    cardPositionSx: isBottomSplit ? cardPositionSx.positionSx : cardPositionSx,
    cardBodySx: isBottomSplit ? cardPositionSx.bodySx : null,
  };
};
