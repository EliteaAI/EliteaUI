import { memo, useCallback, useEffect, useMemo, useState } from 'react';

import { Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, Typography } from '@mui/material';

import { LATEST_VERSION_NAME } from '@/[fsd]/entities/version/lib/constants';
import { SingleSelect } from '@/[fsd]/shared/ui/select';
import { StyledCircleProgress } from '@/components/Chat/StyledComponents';

const VersionReplacementModal = memo(props => {
  const {
    open,
    onClose,
    versionName,
    referencingParents,
    replacementVersions,
    onReplace,
    isReplacing,
    defaultVersionId,
  } = props;
  const [selectedVersionId, setSelectedVersionId] = useState('');
  const styles = getStyles();

  // Format version display name
  const formatVersionName = useCallback(version => {
    if (version.name === LATEST_VERSION_NAME) return LATEST_VERSION_NAME;

    if (version.created_at) {
      try {
        const date = new Date(version.created_at);
        const day = date.getDate().toString().padStart(2, '0');
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const year = date.getFullYear();
        return `${version.name} – ${day}.${month}.${year}`;
      } catch {
        return version.name;
      }
    }
    return version.name;
  }, []);

  // Sort versions: defaultVersionId at top, then by date (newest first), LATEST_VERSION_NAME at bottom
  const sortedVersions = useMemo(() => {
    if (!replacementVersions) return [];
    return [...replacementVersions].sort((a, b) => {
      // Always put defaultVersionId at the top
      if (a.id === defaultVersionId) return -1;
      if (b.id === defaultVersionId) return 1;

      // Always put LATEST_VERSION_NAME at the bottom
      if (a.name === LATEST_VERSION_NAME) return 1;
      if (b.name === LATEST_VERSION_NAME) return -1;

      // Sort other versions by creation date (newest first)
      return new Date(b.created_at) - new Date(a.created_at);
    });
  }, [replacementVersions, defaultVersionId]);

  const versionSelectOptions = useMemo(() => {
    return sortedVersions.map(item => ({
      label: formatVersionName(item),
      value: item.id,
    }));
  }, [formatVersionName, sortedVersions]);

  // Auto-select: default version || LATEST_VERSION_NAME || first sorted
  useEffect(() => {
    if (open && sortedVersions.length > 0 && !selectedVersionId) {
      const defaultVersion = sortedVersions.find(v => v.id === defaultVersionId);
      const latestVersion = sortedVersions.find(v => v.name === LATEST_VERSION_NAME);
      const versionToSelect = defaultVersion || latestVersion || sortedVersions[0];

      setSelectedVersionId(versionToSelect.id);
    }
  }, [open, sortedVersions, selectedVersionId, defaultVersionId]);

  const handleReplace = useCallback(() => {
    if (selectedVersionId) {
      onReplace(selectedVersionId);
    }
  }, [selectedVersionId, onReplace]);

  const handleClose = useCallback(() => {
    setSelectedVersionId('');
    onClose();
  }, [onClose]);

  // Get unique parent applications (deduplicate by application_id)
  const uniqueParents = useMemo(() => {
    if (!referencingParents) return [];
    const seen = new Set();
    return referencingParents.filter(parent => {
      const key = `${parent.application_id}-${parent.version_id}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [referencingParents]);

  const onSelectVersion = useCallback(newVersion => {
    setSelectedVersionId(newVersion);
  }, []);

  const handleKeyDown = event => {
    if (event.key === 'Enter' && selectedVersionId && !isReplacing) {
      event.preventDefault();
      handleReplace();
    } else if (event.key === 'Escape' && !isReplacing) {
      event.preventDefault();
      handleClose();
    }
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      onKeyDown={handleKeyDown}
      fullWidth
      slotProps={{ paper: { sx: styles.paper } }}
    >
      <DialogTitle>
        <Typography
          variant="headingMedium"
          color="text.secondary"
        >
          Version in use
        </Typography>
      </DialogTitle>
      <DialogContent>
        <Typography
          component="div"
          variant="bodyMedium"
          color="text.secondary"
          sx={styles.description}
        >
          The version{' '}
          <Typography
            component={'span'}
            variant="headingSmall"
            sx={styles.versionName}
          >
            {versionName}
          </Typography>{' '}
          is currently used by the following agents/pipelines. Select a replacement version to update all
          references before deletion.
        </Typography>

        <Box sx={styles.affectedList}>
          <Typography
            variant="headingSmall"
            color="text.primary"
            component="div"
          >
            Affected ({uniqueParents.length}):
          </Typography>
          {uniqueParents.map((parent, index) => (
            <Typography
              key={`${parent.application_id}-${parent.version_id}-${index}`}
              variant="bodyMedium"
              color="text.secondary"
              component="div"
            >
              • {parent.application_name} ({parent.version_name})
            </Typography>
          ))}
        </Box>
        <Box>
          <SingleSelect
            onValueChange={onSelectVersion}
            value={selectedVersionId}
            options={versionSelectOptions}
            inputSX={styles.versionSelectInput}
            labelSX={styles.versionSelectLabel}
            maxDisplayValueLength={'200px'}
            label="Replace with version"
            showBorder
          />
        </Box>
      </DialogContent>
      <DialogActions sx={styles.dialogActions}>
        <Button
          onClick={handleClose}
          disabled={isReplacing}
          variant="alita"
          color="secondary"
        >
          Cancel
        </Button>
        <Button
          onClick={handleReplace}
          disabled={!selectedVersionId || isReplacing}
          variant="alita"
          color="alarm"
        >
          {isReplacing ? (
            <>
              Replacing...
              <StyledCircleProgress
                size={16}
                sx={styles.replaceProgress}
              />
            </>
          ) : (
            'Replace & Delete'
          )}
        </Button>
      </DialogActions>
    </Dialog>
  );
});

VersionReplacementModal.displayName = 'VersionReplacementModal';

/** @type {MuiSx} */
const getStyles = () => ({
  paper: { width: '37.5rem' },
  versionName: ({ palette }) => ({ color: palette.text.deleteAlertEntityName }),
  description: {
    marginBottom: '1rem',
  },
  parentType: {
    marginLeft: '0.5rem',
  },
  affectedList: ({ palette }) => ({
    mb: 3,
    p: 2,
    borderRadius: '0.5rem',
    border: `.0625rem solid ${palette.border.tips}`,
    background: palette.background.info,
    maxHeight: '9.375rem',
    overflowY: 'auto',
  }),
  versionSelectInput: {
    '& .MuiSelect-select': {
      paddingRight: '0.5rem !important',
    },
  },
  versionSelectLabel: {
    left: '.5rem',
  },
  dialogActions: { p: '1.25rem', pt: 0 },
  replaceProgress: { ml: 1 },
});

export default VersionReplacementModal;
