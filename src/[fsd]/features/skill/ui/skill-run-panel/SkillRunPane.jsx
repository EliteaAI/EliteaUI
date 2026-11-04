import { forwardRef, memo, useRef } from 'react';

import { useFormikContext } from 'formik';

import { Box } from '@mui/material';

import { hasUnsavedRunChanges } from '@/[fsd]/features/skill/lib/helpers';
import { useCanRunSkill, useFocusRunInput } from '@/[fsd]/features/skill/lib/hooks';

import SkillTestPanel from '../skill-test-panel/SkillTestPanel';
import SkillRunPanel from './SkillRunPanel';
import UnsavedChangesTestBanner from './UnsavedChangesTestBanner';

const UNSAVED_CHANGES_BANNER = <UnsavedChangesTestBanner />;

/**
 * Chat of the skill Test panel: the persisted run of the saved version, or a stateless test of unsaved
 * changes. `ref` reaches the shown chat, so the panel toolbar can clear it.
 */
const SkillRunPane = memo(
  forwardRef((props, ref) => {
    const {
      runConversationId,
      onRunConversationChange,
      onOpenRunVersion,
      onClearStateChange,
      onContextConversationChange,
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
            ref={ref}
            banner={isTestingUnsavedChanges ? UNSAVED_CHANGES_BANNER : null}
            onClearStateChange={onClearStateChange}
          />
        ) : (
          <SkillRunPanel
            ref={ref}
            skillId={initialValues.id}
            skillName={initialValues.name}
            versionDetails={initialValues.version_details}
            runConversationId={runConversationId}
            onRunConversationChange={onRunConversationChange}
            onOpenRunVersion={onOpenRunVersion}
            onClearStateChange={onClearStateChange}
            onContextConversationChange={onContextConversationChange}
            focusRequest={focusRequest}
            onFocusHandled={onFocusHandled}
          />
        )}
      </Box>
    );
  }),
);

SkillRunPane.displayName = 'SkillRunPane';

/** @type {MuiSx} */
const skillRunPaneStyles = () => ({
  pane: {
    height: '100%',
  },
});

export default SkillRunPane;
