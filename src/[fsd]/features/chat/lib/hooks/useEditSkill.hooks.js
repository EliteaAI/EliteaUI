import { useCallback, useEffect, useRef, useState } from 'react';

import useNavBlocker from '@/hooks/useNavBlocker';

export const useEditSkill = () => {
  const { isEditingSkill, setSkillEditingBlockNav } = useNavBlocker();
  const setSkillEditingBlockNavRef = useRef(setSkillEditingBlockNav);

  useEffect(() => {
    setSkillEditingBlockNavRef.current = setSkillEditingBlockNav;
  }, [setSkillEditingBlockNav]);

  const [editingSkill, setEditingSkill] = useState(null);

  const onShowSkillEditor = useCallback(theSelectedSkill => {
    if (!theSelectedSkill) return;
    setEditingSkill(theSelectedSkill);
    setSkillEditingBlockNavRef.current(true);
  }, []);

  const onCloseSkillEditor = useCallback(() => {
    setSkillEditingBlockNavRef.current(false);
    setEditingSkill(null);
  }, []);

  useEffect(() => {
    return () => {
      setSkillEditingBlockNavRef.current(false);
    };
  }, []);

  return {
    isEditingSkill,
    editingSkill,
    onShowSkillEditor,
    onCloseSkillEditor,
  };
};
