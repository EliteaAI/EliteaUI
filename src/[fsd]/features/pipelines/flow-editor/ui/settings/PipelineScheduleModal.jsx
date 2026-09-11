import { memo } from 'react';

import { Schedule } from '@/[fsd]/shared/ui';

const PipelineScheduleModal = memo(props => {
  const { open, onClose, onSubmit, cron, timezone, isLoading, isEdit = false } = props;

  return (
    <Schedule.ScheduleModal
      open={open}
      onClose={onClose}
      onSubmit={onSubmit}
      cron={cron}
      timezone={timezone}
      isLoading={isLoading}
      isEdit={isEdit}
      title={isEdit ? 'Edit Schedule' : 'Schedule Settings'}
    />
  );
});

PipelineScheduleModal.displayName = 'PipelineScheduleModal';

export default PipelineScheduleModal;
