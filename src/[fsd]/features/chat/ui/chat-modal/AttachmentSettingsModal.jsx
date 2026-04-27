import { memo, useCallback, useEffect, useMemo, useState } from 'react';

import { Button, DialogContent, DialogTitle, IconButton, Typography, useTheme } from '@mui/material';

import StyledCircleProgress from '@/ComponentsLib/CircularProgress';
import { useLoadToolkits } from '@/[fsd]/features/toolkits/lib/hooks';
import { buildErrorMessage } from '@/common/utils';
import FormInput from '@/components/FormInput';
import CloseIcon from '@/components/Icons/CloseIcon';
import PlusIcon from '@/components/Icons/PlusIcon';
import SingleSelectWithSearch from '@/components/SingleSelectWithSearch';
import { StyledDialog, StyledDialogActions } from '@/components/StyledDialog';
import { useCreateArtifactWithDefaultConfiguration } from '@/hooks/useCreateArtifactWithDefaultConfiguratiion';
import useToast from '@/hooks/useToast';

const CREATE_NEW_OPTION = 'create_new';

const AttachmentSettingsModal = memo(props => {
  const {
    open,
    onSelectManager,
    isSettingManager,
    selectedManager,
    existingToolkitIds = [],
    onCancel,
    onClose,
  } = props;

  const theme = useTheme();
  const { toastError } = useToast();

  const [selectedArtifact, setSelectedArtifact] = useState(selectedManager || '');
  const [bucketName, setBucketName] = useState('');
  const [searchString, setSearchString] = useState('');

  const { createArtifact, isLoading } = useCreateArtifactWithDefaultConfiguration({ bucketName });
  const { onLoadMoreToolkits, data, isToolkitsFetching, totalCount } = useLoadToolkits({
    toolkit_type: 'artifact',
    search_artifact: searchString,
  });

  const toolkitOptions = useMemo(() => {
    const createNewOption = {
      value: CREATE_NEW_OPTION,
      label: 'Create new',
      icon: (
        <PlusIcon
          style={{
            width: '1rem',
            height: '1rem',
            flexShrink: 0,
          }}
          fill={theme.palette.icon.fill.secondary}
        />
      ),
      style: {
        borderBottom: `.0625rem solid ${theme.palette.border.lines}`,
      },
    };

    const toolkitItems = (
      data?.map(toolkit => ({
        value: toolkit.id,
        label: toolkit.name || 'Untitled Toolkit',
        icon: null,
        toolkit,
      })) || []
    ).sort((a, b) => a.label.localeCompare(b.label));

    // Partition into existing and non-existing toolkits
    const existingToolkits = toolkitItems.filter(item => existingToolkitIds.includes(item.value));
    const nonExistingToolkits = toolkitItems.filter(item => !existingToolkitIds.includes(item.value));
    return [createNewOption, ...existingToolkits, ...nonExistingToolkits];
  }, [data, theme.palette.border.lines, theme.palette.icon.fill.secondary, existingToolkitIds]);

  const loadMoreToolkits = useCallback(() => {
    if (totalCount <= data?.length) return;

    onLoadMoreToolkits();
  }, [data?.length, onLoadMoreToolkits, totalCount]);

  const onChangeBucketName = event => {
    setBucketName(event.target.value);
  };

  const handleCreateArtifact = async () => {
    const result = await createArtifact();
    if (result.data) {
      onSelectManager(result.data);
      onClose?.();
      return true;
    }
    toastError(buildErrorMessage(result.error) || 'Failed to create artifact toolkit');
    return false;
  };

  const handleOK = async () => {
    if (selectedArtifact === CREATE_NEW_OPTION) {
      await handleCreateArtifact();
      return;
    }

    onSelectManager(toolkitOptions.find(option => option.value === selectedArtifact)?.toolkit);
  };

  const onChangeArtifact = option => {
    setBucketName('');
    setSelectedArtifact(option?.value);
  };

  const onSearch = useCallback(value => {
    setSearchString(value);
  }, []);

  useEffect(() => {
    const shouldInitializeFromManager = selectedManager && !selectedArtifact && open;
    if (shouldInitializeFromManager) setSelectedArtifact(selectedManager);

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedManager, open]);

  const resetForm = useCallback(() => {
    setSelectedArtifact();
    setSearchString('');
    setBucketName('');
  }, []);

  useEffect(() => {
    if (!open) {
      resetForm();
    }
  }, [open, resetForm]);

  const saveButtonDisabled =
    (selectedArtifact !== CREATE_NEW_OPTION ? !selectedArtifact : !bucketName) ||
    isLoading ||
    isSettingManager ||
    selectedArtifact === selectedManager;

  const handleKeyDown = event => {
    if (event.key === 'Enter' && !saveButtonDisabled) {
      event.preventDefault();
      handleOK();
    } else if (event.key === 'Escape') {
      event.preventDefault();
      onCancel();
    }
  };

  const customRenderValue = option => (
    <Typography
      variant="bodyMedium"
      color="text.secondary"
      component="div"
      maxWidth="31.25rem"
      overflow="hidden"
      whiteSpace="nowrap"
      textOverflow="ellipsis"
      sx={{ whiteSpaceCollapse: 'preserve' }}
    >
      {!option ? 'Select' : option.label}
    </Typography>
  );

  return (
    <StyledDialog
      open={open}
      onKeyDown={handleKeyDown}
      aria-labelledby="alert-dialog-title"
      aria-describedby="alert-dialog-description"
      sx={styles.dialog}
    >
      <DialogTitle
        id="variables-dialog-title"
        sx={{ height: '3.75rem' }}
        width="100%"
        display="flex"
        alignItems="center"
        justifyContent="space-between"
      >
        <Typography
          variant="headingSmall"
          color="text.secondary"
        >
          Attachment settings
        </Typography>
        <IconButton
          variant="alita"
          color="tertiary"
          aria-label="close"
          onClick={onClose}
          sx={{ padding: 0, margin: 0 }}
        >
          <CloseIcon sx={{ fontSize: '1rem' }} />
        </IconButton>
      </DialogTitle>
      <DialogContent sx={styles.dialogContent}>
        <Typography
          component="div"
          variant="bodyMedium"
          color="text.secondary"
          marginBottom="1.875rem"
        >
          Choose an artifact toolkit or create new one to keep attached files.
        </Typography>
        <SingleSelectWithSearch
          label="Attachment's Artifact toolkit"
          onValueChange={onChangeArtifact}
          value={selectedArtifact}
          options={toolkitOptions}
          renderValue={customRenderValue}
          required={false}
          error={false}
          helperText=""
          onLoadMore={loadMoreToolkits}
          isFetching={isToolkitsFetching}
          maxListHeight="22.5rem"
          searchString={searchString}
          onSearch={onSearch}
          paperZIndex="1400"
          allowEmptySelection
        />
        {selectedArtifact === CREATE_NEW_OPTION && (
          <FormInput
            required
            label="Bucket Name"
            id="bucket_name"
            name="bucket_name"
            value={bucketName}
            onChange={onChangeBucketName}
            sx={{ marginTop: '1rem' }}
          />
        )}
      </DialogContent>
      <StyledDialogActions sx={styles.dialogActions}>
        <Button
          disableRipple
          variant="alita"
          color="secondary"
          onClick={onCancel}
        >
          Cancel
        </Button>
        <Button
          disableRipple
          disabled={saveButtonDisabled}
          variant="alita"
          onClick={handleOK}
        >
          Save
          {(isLoading || isSettingManager) && (
            <StyledCircleProgress
              size={16}
              sx={{ marginLeft: '.5rem' }}
            />
          )}
        </Button>
      </StyledDialogActions>
    </StyledDialog>
  );
});

/** @type {MuiSx} */
const styles = {
  dialog: {
    '& .MuiDialog-paper': {
      width: '37.5rem !important', // or any custom width
      maxWidth: '60% !important', // or any custom width
      background: ({ palette }) => `${palette.background.tabPanel} !important`,
      backgroundColor: ({ palette }) => `${palette.background.tabPanel} !important`,
    },
  },
  dialogContent: {
    width: '100%',
    overflow: 'auto',
    background: ({ palette }) => `${palette.background.secondary} !important`,
    borderTop: ({ palette }) => `.0625rem solid ${palette.border.lines}`,
    borderBottom: ({ palette }) => `.0625rem solid ${palette.border.lines}`,
    maxHeight: 'calc(100vh - 23.75rem)',
    boxSizing: 'border-box',
    padding: '1.5rem !important',
    overflowY: 'scroll',
    gap: '1rem',
  },
  dialogActions: {
    alignItems: 'center',
    flexDirection: 'row',
    padding: '.75rem 1.5rem !important',
    gap: '.75rem',
    height: '3.75rem',
  },
  menuItemIcon: {
    width: '1rem !important',
    height: '1rem !important',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '.875rem !important',
    svg: {
      fontSize: '.875rem !important',
    },
  },
};

AttachmentSettingsModal.displayName = 'AttachmentSettingsModal';

export default AttachmentSettingsModal;
