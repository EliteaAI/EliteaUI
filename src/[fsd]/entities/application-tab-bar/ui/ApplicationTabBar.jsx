import { memo, useMemo } from 'react';

import { useFormikContext } from 'formik';
import { useSelector } from 'react-redux';

import { Box } from '@mui/material';

import { ApplicationVersionSelect } from '@/[fsd]/entities/application-tab-bar/ui';
import { useFormDirtyExcluding } from '@/[fsd]/shared/lib/hooks';
import { Button } from '@/[fsd]/shared/ui';
import { ViewMode } from '@/common/constants';
import useFromApplications from '@/hooks/application/useIsFromApplication';
import useRefetchAgentDetails from '@/hooks/application/useRefetchAgentDetails';
import { useIsFromPipelineDetail } from '@/hooks/useIsFromSpecificPageHooks';
import { useSelectedProjectId } from '@/hooks/useSelectedProject';
import useViewMode from '@/hooks/useViewMode';
import ApplicationValidator from '@/pages/Applications/Components/Applications/ApplicationValidator';
import SaveApplicationButton from '@/pages/Applications/Components/Applications/SaveApplicationButton';
import SaveNewVersionButton from '@/pages/Applications/Components/Applications/SaveNewVersionButton';
import useDiscardApplicationChanges from '@/pages/Applications/useDiscardApplicationChanges';
import useIsPipelineYamlCodeDirty from '@/pages/Pipelines/useIsPipelineYamlCodeDirty';

const ApplicationTabBar = memo(({ onSuccess, onDiscard }) => {
  const viewMode = useViewMode();

  const projectId = useSelectedProjectId();
  const { personal_project_id } = useSelector(state => state.user);

  const { values } = useFormikContext();
  const isFormDirtyExcluding = useFormDirtyExcluding();

  const styles = applicationTabBarStyles();

  const isYamlCodeDirty = useIsPipelineYamlCodeDirty();
  const isFromApplications = useFromApplications();
  const isFromPipeline = useIsFromPipelineDetail();
  const selectedProjectId = useSelectedProjectId();

  const { discardApplicationChanges } = useDiscardApplicationChanges(onDiscard);

  const isPublic = useMemo(() => viewMode === ViewMode.Public, [viewMode]);

  useRefetchAgentDetails();

  return (
    <>
      <ApplicationValidator
        agentId={values?.id}
        projectId={selectedProjectId}
        isCreateMode={false}
      />
      <Box sx={styles.wrapper}>
        <Box sx={styles.centeredBlock}>
          <ApplicationVersionSelect
            enableVersionListAvatar={isFromApplications && isPublic && projectId !== personal_project_id}
            isFromPipeline={isFromPipeline}
            onSuccess={onSuccess}
          />
        </Box>
        <Box sx={styles.rightBlock}>
          {!isPublic && (
            <>
              <SaveApplicationButton onSuccess={onSuccess} />
              <SaveNewVersionButton onSuccess={onSuccess} />
            </>
          )}

          <Button.DiscardButton
            disabled={!isFormDirtyExcluding && !isYamlCodeDirty}
            onDiscard={discardApplicationChanges}
          />
        </Box>
      </Box>
    </>
  );
});

ApplicationTabBar.displayName = 'ApplicationTabBar';

/** @type {MuiSx} */
const applicationTabBarStyles = () => ({
  wrapper: { display: 'flex', justifyContent: 'center', alignItems: 'center', width: '100%', gap: '.5rem' },
  centeredBlock: {
    flex: 1,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    gap: '.5rem',
  },
  rightBlock: {
    display: 'flex',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: '.5rem',
  },
});

export default ApplicationTabBar;
