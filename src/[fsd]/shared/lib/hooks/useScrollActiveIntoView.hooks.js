import { useEffect, useRef } from 'react';

/**
 * Scrolls the active item into the visible area of a scrollable container,
 * accounting for an optional sticky header inside that container.
 *
 * @param {number} activeIndex - Index of the currently active item (-1 = none)
 * @param {React.RefObject} containerRef - Ref to the scrollable container element
 * @param {React.RefObject} [headerRef] - Optional ref to a sticky header inside the container
 * @returns {{ itemRefs: React.MutableRefObject<Array> }}
 */
const useScrollActiveIntoView = (activeIndex, containerRef, headerRef) => {
  const itemRefs = useRef([]);

  useEffect(() => {
    if (activeIndex < 0 || !containerRef.current || !itemRefs.current[activeIndex]) return;
    const container = containerRef.current;
    const item = itemRefs.current[activeIndex];
    const cRect = container.getBoundingClientRect();
    const iRect = item.getBoundingClientRect();
    const headerBottom = headerRef?.current ? headerRef.current.getBoundingClientRect().bottom : cRect.top;
    if (iRect.top < headerBottom) {
      container.scrollTop -= headerBottom - iRect.top;
    } else if (iRect.bottom > cRect.bottom) {
      container.scrollTop += iRect.bottom - cRect.bottom;
    }
  }, [activeIndex, containerRef, headerRef]);

  return { itemRefs };
};

export default useScrollActiveIntoView;
