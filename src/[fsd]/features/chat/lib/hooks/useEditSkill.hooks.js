import { useCallback, useEffect, useState } from 'react';

import useNavBlocker from '@/hooks/useNavBlocker';

export const useEditSkill = () => {
  const { isEditingSkill, setSkillEditingBlockNav } = useNavBlocker();
  const [editingSkill, setEditingSkill] = useState(null);
  const [isSkillCreateMode, setIsSkillCreateMode] = useState(false);

  const onShowSkillEditor = useCallback(
    theSelectedSkill => {
      if (!theSelectedSkill) return;
      setEditingSkill(theSelectedSkill);
      setIsSkillCreateMode(false);
      setSkillEditingBlockNav(true);
    },
    [setSkillEditingBlockNav],
  );

  const onShowSkillEditorCreator = useCallback(() => {
    setEditingSkill(null);
    setIsSkillCreateMode(true);
    setSkillEditingBlockNav(true);
  }, [setSkillEditingBlockNav]);

  const onSkillEditorCreated = useCallback(createdSkill => {
    setEditingSkill(createdSkill);
    setIsSkillCreateMode(false);
  }, []);

  const onCloseSkillEditor = useCallback(() => {
    setSkillEditingBlockNav(false);
    setEditingSkill(null);
    setIsSkillCreateMode(false);
  }, [setSkillEditingBlockNav]);

  useEffect(() => {
    return () => {
      setSkillEditingBlockNav(false);
    };
  }, [setSkillEditingBlockNav]);

  return {
    isEditingSkill,
    editingSkill,
    isSkillCreateMode,
    onShowSkillEditor,
    onShowSkillEditorCreator,
    onSkillEditorCreated,
    onCloseSkillEditor,
  };
};
