import { useEffect } from 'react';

import useNavBlocker from '@/hooks/useNavBlocker';

/**
 * Custom hook for handling navigation blocking in editor components.
 * @param {boolean} isVisible - Whether the editor is visible
 * @param {boolean} isDirty - Whether the form has unsaved changes
 * @param {boolean} disabled - When true, this hook is a no-op and never touches the nav blocker.
 *   Use this for editors rendered inside a multi-tab panel where the parent manages the nav block.
 * @returns {object} - Object containing setBlockNav function
 */
export default function useEditorNavBlocking(isVisible, isDirty, disabled = false) {
  const { setBlockNav } = useNavBlocker();

  useEffect(() => {
    if (disabled) return;

    if (isVisible) {
      setBlockNav(isDirty);
    } else {
      setBlockNav(false);
    }

    return () => {
      if (!disabled) setBlockNav(false);
    };
  }, [isVisible, isDirty, disabled, setBlockNav]);

  return { setBlockNav };
}
