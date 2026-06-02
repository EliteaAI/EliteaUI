import React, { memo, useEffect, useState } from 'react';

import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';

import { PERMISSIONS } from '@/common/constants';
import { useSelectedProjectId } from '@/hooks/useSelectedProject';
import LoadingPage from '@/pages/LoadingPage';
import RouteDefinitions from '@/routes';

import NewChat from './NewChat';

const NewChatWrapper = memo(() => {
  const { permissions } = useSelector(state => state.user);

  const projectId = useSelectedProjectId();
  const navigate = useNavigate();

  const [preProjectId, setPreProjectId] = useState(projectId);

  useEffect(() => {
    if (permissions && !permissions.includes(PERMISSIONS.chat.folders.get)) {
      navigate(RouteDefinitions.Onboarding);
    }
  }, [permissions, navigate]);

  if (!permissions) return <LoadingPage />;
  if (!permissions?.includes(PERMISSIONS.chat.folders.get)) return null;

  return (
    <NewChat
      preProjectId={preProjectId}
      projectId={projectId}
      setPreProjectId={setPreProjectId}
    />
  );
});

NewChatWrapper.displayName = 'NewChatWrapper';

export default NewChatWrapper;
