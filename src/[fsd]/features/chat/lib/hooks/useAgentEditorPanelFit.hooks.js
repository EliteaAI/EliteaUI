import { useEffect, useRef, useState } from 'react';

// Below this width of the chat input column the panel switches to its icon-only view
const CHAT_CONTROLS_WIDTH_THRESHOLD = 430;

/**
 * Custom hook to detect if AgentEditorPanel needs to switch to icon view
 * based on available width in the parent container
 *
 * Strategy: measures the panel's grandparent — the chat input column (the field and the row under it, where the panel
 * sits) — and compares its width against the threshold
 *
 * @returns {Object} - { containerRef, isSmallView }
 */
export const useAgentEditorPanelFit = () => {
  const containerRef = useRef(null);
  const [isSmallView, setIsSmallView] = useState(false);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) {
      return;
    }

    // Function to check available width
    const checkWidth = () => {
      // Structure: panel -> the row under the field -> the chat input column
      const rightSideContainer = container.parentElement;
      const chatControlsContainer = rightSideContainer?.parentElement;

      if (!chatControlsContainer) {
        setIsSmallView(false);
        return;
      }

      const totalControlsWidth = chatControlsContainer.offsetWidth;
      const needsSmallView = totalControlsWidth < CHAT_CONTROLS_WIDTH_THRESHOLD;

      setIsSmallView(needsSmallView);
    };

    // Monitor the chat input column (grandparent) for width changes
    const chatControlsContainer = container.parentElement?.parentElement;
    const parentToObserve = chatControlsContainer || container.parentElement || container;

    const resizeObserver = new ResizeObserver(() => {
      checkWidth();
    });

    // Start observing the parent
    resizeObserver.observe(parentToObserve);

    // Initial check
    checkWidth();

    // Cleanup
    return () => {
      resizeObserver.disconnect();
    };
  }, []);

  // Additional effect to handle when container ref changes
  // This ensures we re-check when the component switches between icon/text view
  useEffect(() => {
    if (!containerRef.current) return;

    const timer = setTimeout(() => {
      const rightSideContainer = containerRef.current?.parentElement;
      const chatControlsContainer = rightSideContainer?.parentElement;
      if (chatControlsContainer) {
        const totalControlsWidth = chatControlsContainer.offsetWidth;
        const needsSmallView = totalControlsWidth < CHAT_CONTROLS_WIDTH_THRESHOLD;
        setIsSmallView(needsSmallView);
      }
    }, 100); // Small delay to let DOM settle

    return () => clearTimeout(timer);
  }); // Run on every render to catch view changes

  return {
    containerRef,
    isSmallView,
  };
};
