import { useCallback, useEffect, useRef, useState } from 'react';

import useNavBlocker from '@/hooks/useNavBlocker';

export const useEditSkill = () => {
  const { isEditingSkill, setSkillEditingBlockNav } = useNavBlocker();
  const [editingSkill, setEditingSkill] = useState(null);
  const [isSkillCreateMode, setIsSkillCreateMode] = useState(false);
  const skillEditorSessionRef = useRef(0);
  const [skillEditorSession, setSkillEditorSession] = useState(0);

  const startSkillEditorSession = useCallback(() => {
    skillEditorSessionRef.current += 1;
    setSkillEditorSession(skillEditorSessionRef.current);
  }, []);

  const onShowSkillEditor = useCallback(
    theSelectedSkill => {
      if (!theSelectedSkill) return;
      startSkillEditorSession();
      setEditingSkill(theSelectedSkill);
      setIsSkillCreateMode(false);
      setSkillEditingBlockNav(true);
    },
    [setSkillEditingBlockNav, startSkillEditorSession],
  );

  const onShowSkillEditorCreator = useCallback(() => {
    startSkillEditorSession();
    setEditingSkill(null);
    setIsSkillCreateMode(true);
    setSkillEditingBlockNav(true);
  }, [setSkillEditingBlockNav, startSkillEditorSession]);

  const onSkillEditorCreated = useCallback((createdSkill, session) => {
    if (session !== skillEditorSessionRef.current) return;
    setEditingSkill(createdSkill);
    setIsSkillCreateMode(false);
  }, []);

  const onCloseSkillEditor = useCallback(() => {
    startSkillEditorSession();
    setSkillEditingBlockNav(false);
    setEditingSkill(null);
    setIsSkillCreateMode(false);
  }, [setSkillEditingBlockNav, startSkillEditorSession]);

  useEffect(() => {
    return () => {
      setSkillEditingBlockNav(false);
    };
  }, [setSkillEditingBlockNav]);

  return {
    isEditingSkill,
    editingSkill,
    isSkillCreateMode,
    skillEditorSession,
    onShowSkillEditor,
    onShowSkillEditorCreator,
    onSkillEditorCreated,
    onCloseSkillEditor,
  };
};
