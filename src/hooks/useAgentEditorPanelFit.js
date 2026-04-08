import { useEffect, useRef, useState } from 'react';

// Minimum chat controls container width threshold to show full text view
// Below this, the panel switches to icon-only view to prevent crowding
const CHAT_CONTROLS_WIDTH_THRESHOLD = 430;

/**
 * Custom hook to detect if AgentEditorPanel needs to switch to icon view
 * based on available width in the parent container
 *
 * Strategy: Measures the chat controls container's total width and compares against threshold
 * The chat controls container is the grandparent element that contains both left and right sections
 *
 * @returns {Object} - { containerRef, isSmallView }
 */
const useAgentEditorPanelFit = () => {
  const containerRef = useRef(null);
  const [isSmallView, setIsSmallView] = useState(false);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) {
      return;
    }

    // Function to check available width
    const checkWidth = () => {
      // Navigate up the DOM to find the chat controls container
      // Structure: ButtonGroup -> Box (right side) -> Box (chat controls) -> possibly more
      const rightSideContainer = container.parentElement; // Box with flex-shrink
      const chatControlsContainer = rightSideContainer?.parentElement; // Chat controls Box

      if (!chatControlsContainer) {
        setIsSmallView(false);
        return;
      }

      // Use the chat controls container's total width to determine if we have space
      // This is more reliable than measuring the constrained right-side box
      const totalControlsWidth = chatControlsContainer.offsetWidth;

      // If the chat controls container has enough space, we can show full view
      // This accounts for left-side buttons (attachments, tools) plus the panel itself
      const needsSmallView = totalControlsWidth < CHAT_CONTROLS_WIDTH_THRESHOLD;

      setIsSmallView(needsSmallView);
    };

    // Monitor the chat controls container (grandparent) for width changes
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

export default useAgentEditorPanelFit;
