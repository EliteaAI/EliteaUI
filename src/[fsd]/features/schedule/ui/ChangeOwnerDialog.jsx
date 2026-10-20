import { memo, useCallback, useMemo, useRef, useState } from 'react';

import { Box, Typography } from '@mui/material';

import { useChangeScheduleOwnerMutation } from '@/[fsd]/entities/schedule/api/scheduleApi';
import { useSelectedProjectId, useToast, useUserList } from '@/[fsd]/shared/lib/hooks';
import { Modal } from '@/[fsd]/shared/ui';
import BannerMessage from '@/[fsd]/shared/ui/banner-message/BannerMessage';
import LazySelect from '@/[fsd]/shared/ui/select/LazySelect';
import { buildErrorMessage } from '@/common/utils';

const USER_PAGE_SIZE = 20;
// 400 and 503 keep the dialog open so the admin can pick again or retry
const STAY_OPEN_STATUSES = [400, 503];

const toOption = user => ({ value: user.id, label: user.name || user.email });

const ChangeOwnerDialog = memo(props => {
  const { open, schedule, onClose } = props;
  const projectId = useSelectedProjectId();
  const { toastError, toastSuccess } = useToast();
  const [changeOwner, { isLoading }] = useChangeScheduleOwnerMutation();

  const [query, setQuery] = useState('');
  const [picked, setPicked] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');
  const isSubmitting = useRef(false);

  const { data, onLoadMoreUsers, isUsersFetching } = useUserList({
    sortBy: 'name',
    sortOrder: 'asc',
    query,
    pageSize: USER_PAGE_SIZE,
  });

  // The picked user stays an option after a new search drops it from the loaded rows
  const options = useMemo(() => {
    const loaded = (data?.rows || []).map(toOption);
    return picked && !loaded.some(option => option.value === picked.value) ? [picked, ...loaded] : loaded;
  }, [data?.rows, picked]);

  const handlePick = useCallback(
    value => {
      setPicked(options.find(option => option.value === value) || null);
      setErrorMessage('');
    },
    [options],
  );

  const handleConfirm = useCallback(async () => {
    if (isSubmitting.current) return;
    isSubmitting.current = true;
    try {
      await changeOwner({ projectId, scheduleId: schedule.id, ownerId: picked.value }).unwrap();
      toastSuccess('The schedule owner is changed.');
      onClose();
    } catch (error) {
      if (STAY_OPEN_STATUSES.includes(error?.status)) {
        setErrorMessage(buildErrorMessage(error));
      } else {
        toastError(buildErrorMessage(error));
        onClose();
      }
    } finally {
      isSubmitting.current = false;
    }
  }, [changeOwner, onClose, picked, projectId, schedule.id, toastError, toastSuccess]);

  const content = (
    <Box sx={styles.content}>
      <Typography
        variant="bodySmall"
        color="text.secondary"
      >
        Schedule: {schedule.name}
      </Typography>
      <Typography
        variant="bodySmall"
        color="text.secondary"
      >
        Current owner: {schedule.owner?.name}
      </Typography>
      <LazySelect
        label="New owner"
        value={picked?.value}
        onValueChange={handlePick}
        options={options}
        total={data?.total}
        isFetching={isUsersFetching}
        onLoadMore={onLoadMoreUsers}
        searchString={query}
        onSearch={setQuery}
      />
      {errorMessage && (
        <BannerMessage
          variant="error"
          message={errorMessage}
        />
      )}
    </Box>
  );

  return (
    <Modal.BaseModal
      open={open}
      title={<Typography id="alert-dialog-title">Change owner</Typography>}
      onClose={onClose}
      onConfirm={handleConfirm}
      confirming={!picked || picked.value === schedule.owner?.id || isLoading}
      content={content}
    />
  );
});

ChangeOwnerDialog.displayName = 'ChangeOwnerDialog';

/** @type {MuiSx} */
const styles = {
  content: { display: 'flex', flexDirection: 'column', gap: '0.75rem' },
};

export default ChangeOwnerDialog;
