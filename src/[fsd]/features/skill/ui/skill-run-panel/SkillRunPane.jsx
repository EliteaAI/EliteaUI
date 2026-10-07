import { memo, useEffect, useRef } from 'react';

import { useFormikContext } from 'formik';

import { Box } from '@mui/material';

import { hasUnsavedRunChanges } from '@/[fsd]/features/skill/lib/helpers';

import SkillTestPanel from '../skill-test-panel/SkillTestPanel';
import SkillRunPanel from './SkillRunPanel';
import UnsavedChangesTestBanner from './UnsavedChangesTestBanner';

const MESSAGE_INPUT_SELECTOR = '[contenteditable="true"], textarea';

const SkillRunPane = memo(props => {
  const {
    isFullScreenChat,
    setIsFullScreenChat,
    runConversationId,
    onRunConversationChange,
    onOpenRunVersion,
    onShowHistory,
    focusRequest,
  } = props;
  const { values, initialValues } = useFormikContext();
  const paneRef = useRef(null);
  const isTestingUnsavedChanges = hasUnsavedRunChanges(values, initialValues);
  const styles = skillRunPaneStyles();

  useEffect(() => {
    if (!focusRequest || !paneRef.current) return;
    paneRef.current.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    paneRef.current.querySelector(MESSAGE_INPUT_SELECTOR)?.focus();
  }, [focusRequest]);

  return (
    <Box
      ref={paneRef}
      sx={styles.pane}
      data-testid="skill-run-pane"
    >
      {isTestingUnsavedChanges ? (
        <SkillTestPanel
          isFullScreenChat={isFullScreenChat}
          setIsFullScreenChat={setIsFullScreenChat}
          banner={<UnsavedChangesTestBanner />}
        />
      ) : (
        <SkillRunPanel
          skillId={initialValues.id}
          skillName={initialValues.name}
          versionDetails={initialValues.version_details}
          runConversationId={runConversationId}
          onRunConversationChange={onRunConversationChange}
          onOpenRunVersion={onOpenRunVersion}
          isFullScreenChat={isFullScreenChat}
          setIsFullScreenChat={setIsFullScreenChat}
          onShowHistory={onShowHistory}
        />
      )}
    </Box>
  );
});

SkillRunPane.displayName = 'SkillRunPane';

/** @type {MuiSx} */
const skillRunPaneStyles = () => ({
  pane: {
    height: '100%',
  },
});

export default SkillRunPane;
