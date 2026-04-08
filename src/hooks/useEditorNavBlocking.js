import { useEffect } from 'react';

import useNavBlocker from '@/hooks/useNavBlocker';

/**
 * Custom hook for handling navigation blocking in editor components
 * @param {boolean} isVisible - Whether the editor is visible
 * @param {boolean} isDirty - Whether the form has unsaved changes
 * @returns {object} - Object containing setBlockNav function
 */
export default function useEditorNavBlocking(isVisible, isDirty) {
  const { setBlockNav } = useNavBlocker();

  // Track dirty state and set navigation blocking
  useEffect(() => {
    if (isVisible) {
      // Only block navigation if the form is actually dirty
      setBlockNav(isDirty);
    } else {
      setBlockNav(false);
    }

    // Cleanup when unmounting or when visibility changes
    return () => {
      setBlockNav(false);
    };
  }, [isVisible, isDirty, setBlockNav]);

  return { setBlockNav };
}
