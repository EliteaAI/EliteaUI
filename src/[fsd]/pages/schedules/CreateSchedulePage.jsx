import { useCallback, useMemo, useState } from 'react';

import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';

import { Box } from '@mui/material';

import { useCreateScheduleMutation } from '@/[fsd]/entities/schedule';
import { ScheduleForm } from '@/[fsd]/features/schedule';
import { buildInitialValues } from '@/[fsd]/features/schedule/lib/helpers';
import { ScheduleHelpers } from '@/[fsd]/shared/lib/helpers';
import { useSelectedProjectId } from '@/[fsd]/shared/lib/hooks';
import { Breadcrumbs } from '@/[fsd]/shared/ui';
import { ScheduleSettingsSection, StopOnDateField } from '@/[fsd]/shared/ui/schedule';

const DEFAULT_CRON = '0 0 * * 6';

const CreateSchedulePage = () => {
  const projectId = useSelectedProjectId();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { state } = useLocation();
  const [createSchedule] = useCreateScheduleMutation();
  const [cron, setCron] = useState(DEFAULT_CRON);
  const [expiresAt, setExpiresAt] = useState(null);

  const { values, urlEntity, returnTo } = useMemo(
    () => buildInitialValues(searchParams, state),
    [searchParams, state],
  );

  const onSubmit = useCallback(
    async body => {
      await createSchedule({
        projectId,
        ...body,
        cron,
        timezone: ScheduleHelpers.getBrowserTimezone(),
        expires_at: expiresAt,
      }).unwrap();
      navigate(returnTo);
    },
    [createSchedule, cron, expiresAt, navigate, projectId, returnTo],
  );

  const onCancel = useCallback(() => navigate(returnTo), [navigate, returnTo]);

  return (
    <Box sx={{ padding: '1rem 1.5rem' }}>
      <Breadcrumbs />
      <ScheduleForm
        initialValues={values}
        lockedEntity={urlEntity}
        onSubmit={onSubmit}
        onCancel={onCancel}
      >
        <ScheduleSettingsSection
          value={cron}
          onChange={setCron}
          sourceCron={DEFAULT_CRON}
        />
        <StopOnDateField
          value={expiresAt}
          onChange={setExpiresAt}
        />
      </ScheduleForm>
    </Box>
  );
};

export default CreateSchedulePage;
