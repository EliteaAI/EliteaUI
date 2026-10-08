import { memo, useRef } from 'react';

import { useFormikContext } from 'formik';

import { Box } from '@mui/material';

import { hasUnsavedRunChanges } from '@/[fsd]/features/skill/lib/helpers';
import { useCanRunSkill, useFocusRunInput } from '@/[fsd]/features/skill/lib/hooks';

import SkillTestPanel from '../skill-test-panel/SkillTestPanel';
import SkillRunPanel from './SkillRunPanel';
import UnsavedChangesTestBanner from './UnsavedChangesTestBanner';

const UNSAVED_CHANGES_BANNER = <UnsavedChangesTestBanner />;

const SkillRunPane = memo(props => {
  const {
    isFullScreenChat,
    setIsFullScreenChat,
    runConversationId,
    onRunConversationChange,
    onOpenRunVersion,
    onShowHistory,
    focusRequest,
    onFocusHandled,
  } = props;
  const { values, initialValues } = useFormikContext();
  const paneRef = useRef(null);
  const canRunSkill = useCanRunSkill();
  const isTestingUnsavedChanges = hasUnsavedRunChanges(values, initialValues);
  const showsTestPanel = isTestingUnsavedChanges || !canRunSkill;
  const styles = skillRunPaneStyles();

  useFocusRunInput({ containerRef: paneRef, focusRequest, isReady: showsTestPanel, onFocusHandled });

  return (
    <Box
      ref={paneRef}
      sx={styles.pane}
      data-testid="skill-run-pane"
    >
      {showsTestPanel ? (
        <SkillTestPanel
          isFullScreenChat={isFullScreenChat}
          setIsFullScreenChat={setIsFullScreenChat}
          banner={isTestingUnsavedChanges ? UNSAVED_CHANGES_BANNER : null}
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
          focusRequest={focusRequest}
          onFocusHandled={onFocusHandled}
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
