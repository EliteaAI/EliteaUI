import { useCallback, useEffect, useState } from 'react';

import useNavBlocker from '@/hooks/useNavBlocker';

export const useEditSkill = () => {
  const { isEditingSkill, setSkillEditingBlockNav } = useNavBlocker();
  const [editingSkill, setEditingSkill] = useState(null);

  const onShowSkillEditor = useCallback(
    theSelectedSkill => {
      if (!theSelectedSkill) return;
      setEditingSkill(theSelectedSkill);
      setSkillEditingBlockNav(true);
    },
    [setSkillEditingBlockNav],
  );

  const onCloseSkillEditor = useCallback(() => {
    setSkillEditingBlockNav(false);
    setEditingSkill(null);
  }, [setSkillEditingBlockNav]);

  useEffect(() => {
    return () => {
      setSkillEditingBlockNav(false);
    };
  }, [setSkillEditingBlockNav]);

  return {
    isEditingSkill,
    editingSkill,
    onShowSkillEditor,
    onCloseSkillEditor,
  };
};
